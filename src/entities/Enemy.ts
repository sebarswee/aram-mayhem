import Phaser from 'phaser';
import { EnemyConfig, EnemyType, Element, ElementMark, BossPhase, EnemyAbility } from '@/types';
import { COUNTER_RELATIONS, ELEMENT_COLORS, getCounterBonus } from '@/data/elements';
import {
  statusEffectColorRegistry,
  enemyTypeScaleRegistry,
  enemyPassiveAbilityRegistry,
  enemyDeathAbilityRegistry,
  enemyElementDeathRegistry,
} from '@/strategies';

// Status effect interface
export interface StatusEffect {
  type: 'burn' | 'freeze' | 'stun' | 'poison' | 'slow' | 'root' | 'defense_break' | 'tick_speed_up';
  value: number;
  duration: number;
  remainingTime: number;
  source: string; // source skill ID
  element?: Element; // element type for DoT effects
}

// 优先级顺序：freeze > stun > poison > defense_break > slow > burn
const EFFECT_PRIORITY: StatusEffect['type'][] = ['freeze', 'stun', 'poison', 'defense_break', 'slow', 'burn', 'tick_speed_up'];

// 敌人类型到精灵纹理的映射
const ENEMY_TEXTURE_MAP: Record<string, string> = {
  // Normal enemies (8 elements) - 直接使用 GraphicsFactory 创建的纹理名
  'flame_slime': 'flame_slime',
  'water_elemental': 'water_elemental',
  'frost_ghost': 'frost_ghost',
  'thunder_spirit': 'thunder_spirit',
  'holy_sprite': 'holy_sprite',
  'shadow_demon': 'shadow_demon',
  'vine_monster': 'vine_monster',
  'rock_golem': 'rock_golem',
  // Elite enemies
  'elite_flame_lord': 'elite_flame_lord',
  'elite_water_elemental': 'elite_water_elemental',
  'elite_frost_titan': 'elite_frost_titan',
  'elite_storm_drake': 'elite_storm_drake',
  'elite_shadow_lord': 'elite_shadow_lord',
  // Boss enemies
  'boss_flame_lord': 'boss_flame_lord',
  'boss_frost_giant': 'boss_frost_giant',
  'boss_thunder_dragon': 'boss_thunder_dragon',
  'boss_shadow_king': 'boss_shadow_king',
  'boss_nature_guardian': 'boss_nature_guardian',
  'boss_golem_lord': 'boss_golem_lord',
  'boss_fallen_angel': 'boss_fallen_angel',
  'boss_hydra': 'boss_hydra',
};

// Element-specific death effect colors
const ELEMENT_DEATH_COLORS: Record<Element, number> = {
  fire: 0xff4400,
  water: 0x4488ff,
  ice: 0x88ddff,
  lightning: 0xffff00,
  holy: 0xffcc00,
  shadow: 0x8800ff,
  grass: 0x44ff44,
  earth: 0xaa8844,
};

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  public config: EnemyConfig;
  public currentHp: number;
  public instanceId: string; // 唯一实例ID（用于连锁判定）
  public element: Element;

  // Status effects
  public statusEffects: StatusEffect[] = [];

  // Tick speed multiplier for DoT effects (default 1.0, 2.0 = double speed)
  public tickSpeedMultiplier: number = 1.0;

  // Death explosion params (set by synergy effects)
  public deathExplosionParams?: { damage: number; radius: number };

  // Boss 相关属性
  public bossPhase: number = 1;
  public bossPhases?: BossPhase[];
  public abilityCooldowns: Map<string, number> = new Map();
  public shieldValue: number = 0;
  public isEnraged: boolean = false;
  public maxHp: number;  // 用于计算血量百分比

  // Element marks for synergy tracking
  private elementMarks: Map<Element, ElementMark> = new Map();

  private target: Phaser.GameObjects.Sprite | null = null;
  private shadowGraphics: Phaser.GameObjects.Graphics | null = null;
  private lastDotTickTime: Record<string, number> = {};
  private elementTintApplied: boolean = false;
  private typeVisualEffects?: {
    aura?: Phaser.GameObjects.Arc;
    outerAura?: Phaser.GameObjects.Arc;
    innerAura?: Phaser.GameObjects.Arc;
    coreAura?: Phaser.GameObjects.Arc;
    followEvent?: Phaser.Time.TimerEvent;
  };

  constructor(scene: Phaser.Scene, x: number, y: number, config: EnemyConfig) {
    // 根据敌人配置选择纹理
    const textureKey = ENEMY_TEXTURE_MAP[config.id] || 'enemy_slime';
    super(scene, x, y, textureKey);

    this.config = config;
    this.currentHp = config.hp;
    this.maxHp = config.hp;  // 用于计算血量百分比
    this.instanceId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.element = config.element;

    // 初始化 Boss 阶段（如果有）
    if (config.phases) {
      this.bossPhases = config.phases;
      this.bossPhase = 1;
    }

    // 初始化能力冷却
    for (const ability of config.abilities) {
      if (ability.cooldown) {
        this.abilityCooldowns.set(ability.type, 0);
      }
    }

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 设置物理体
    this.setCollideWorldBounds(true);

    // 根据类型设置大小和缩放
    const scale = this.getScaleByType(config.type);
    this.setScale(scale);
    this.body?.setSize(24 * scale, 24 * scale);

    // 设置深度
    this.setDepth(30);

    // 创建阴影效果
    this.createShadow();

    // 创建精英/Boss特殊视觉效果
    this.createTypeVisualEffect();

    // Apply element color tint
    this.applyElementTint();

    // Apply passive abilities
    this.applyPassiveAbilities();
  }

  /**
   * 创建精英/Boss特殊视觉效果
   */
  private createTypeVisualEffect(): void {
    if (this.config.type === 'elite') {
      // 精英敌人：金色脉动光环
      this.createEliteAura();
    } else if (this.config.type === 'boss') {
      // Boss：大型红色光环 + HP条
      this.createBossAura();
    }
  }

  /**
   * 创建精英光环效果
   */
  private createEliteAura(): void {
    // 外圈光环（金色，醒目）
    const aura = this.scene.add.circle(this.x, this.y, 50, 0xffcc00, 0.2);
    aura.setStrokeStyle(3, 0xffaa00, 0.7);
    aura.setDepth(28);

    // 脉动动画
    this.scene.tweens.add({
      targets: aura,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0.35,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // 跟随敌人位置
    const followEvent = this.scene.time.addEvent({
      delay: 50,
      callback: () => {
        if (!this.active) {
          aura.destroy();
          followEvent.destroy();
          return;
        }
        aura.setPosition(this.x, this.y);
      },
      repeat: -1,
    });

    // 存储引用以便清理
    this.typeVisualEffects = { aura, followEvent };
  }

  /**
   * 创建Boss光环效果
   */
  private createBossAura(): void {
    // 大型外圈光环（红色+金色，非常醒目）
    const outerAura = this.scene.add.circle(this.x, this.y, 75, 0xff0000, 0.15);
    outerAura.setStrokeStyle(4, 0xff3333, 0.6);
    outerAura.setDepth(27);

    // 内圈光环
    const innerAura = this.scene.add.circle(this.x, this.y, 60, 0xffcc00, 0.12);
    innerAura.setStrokeStyle(3, 0xffcc00, 0.5);
    innerAura.setDepth(28);

    // 核心（带光晕）
    const coreAura = this.scene.add.circle(this.x, this.y, 45, 0xffffff, 0.08);
    coreAura.setDepth(28);

    // 脉动动画
    this.scene.tweens.add({
      targets: outerAura,
      scaleX: 1.12,
      scaleY: 1.12,
      alpha: 0.2,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    this.scene.tweens.add({
      targets: innerAura,
      scaleX: 1.1,
      scaleY: 1.1,
      alpha: 0.18,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.scene.tweens.add({
      targets: coreAura,
      scaleX: 1.08,
      scaleY: 1.08,
      alpha: 0.12,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // 跟随敌人位置
    const followEvent = this.scene.time.addEvent({
      delay: 50,
      callback: () => {
        if (!this.active) {
          outerAura.destroy();
          innerAura.destroy();
          coreAura.destroy();
          followEvent.destroy();
          return;
        }
        outerAura.setPosition(this.x, this.y);
        innerAura.setPosition(this.x, this.y);
        coreAura.setPosition(this.x, this.y);
      },
      repeat: -1,
    });

    // 存储引用以便清理
    this.typeVisualEffects = { outerAura, innerAura, coreAura, followEvent };
  }

  /**
   * Apply passive abilities on spawn
   */
  private applyPassiveAbilities(): void {
    for (const ability of this.config.abilities) {
      if (ability.trigger !== 'passive') continue;

      // 使用策略模式
      if (enemyPassiveAbilityRegistry.hasStrategy(ability.type)) {
        enemyPassiveAbilityRegistry.execute(ability.type, { enemy: this, ability });
      }
    }
  }

  private getScaleByType(type: EnemyType): number {
    return enemyTypeScaleRegistry.getScale(type);
  }

  private createShadow(): void {
    this.shadowGraphics = this.scene.add.graphics();
    this.updateShadow();
    this.shadowGraphics.setDepth(29);
  }

  private updateShadow(): void {
    if (!this.shadowGraphics) return;
    this.shadowGraphics.clear();
    this.shadowGraphics.fillStyle(0x000000, 0.3);
    this.shadowGraphics.fillEllipse(this.x, this.y + 10, 30 * this.scaleX, 10);
  }

  public applyElementTint(): void {
    const elementColor = ELEMENT_COLORS[this.element];
    if (elementColor) {
      this.setTint(elementColor);
      this.elementTintApplied = true;
    }
  }

  setTarget(target: Phaser.GameObjects.Sprite): void {
    this.target = target;
  }

  update(time: number, _delta: number): void {
    // Safety check: ensure enemy is active and has a valid body
    if (!this.target || !this.active) return;

    const body = this.body as Phaser.Physics.Arcade.Body | null;
    if (!body || !this.scene) return;

    // Update status effects (ticking)
    this.updateStatusEffects(time);

    // Calculate actual speed considering slow effects
    const speedMultiplier = this.getSpeedMultiplier();
    const actualSpeed = this.config.speed * speedMultiplier;

    // Check if immobilized (freeze, stun, or root)
    const isImmobilized = this.isImmobilized();

    if (!isImmobilized) {
      // 追踪目标
      const angle = Phaser.Math.Angle.Between(
        this.x,
        this.y,
        this.target.x,
        this.target.y
      );

      body.setVelocity(Math.cos(angle) * actualSpeed, Math.sin(angle) * actualSpeed);

      // 根据移动方向轻微翻转
      if (body.velocity.x < 0) {
        this.setFlipX(true);
      } else if (body.velocity.x > 0) {
        this.setFlipX(false);
      }
    } else {
      // Stop movement when immobilized
      body.setVelocity(0, 0);
    }

    // 更新阴影位置
    if (this.shadowGraphics) {
      this.updateShadow();
    }
  }

  // ==================== Status Effect Methods ====================

  /**
   * Add a status effect to this enemy
   */
  addStatusEffect(effect: StatusEffect): void {
    // Check if same type already exists
    const existingIndex = this.statusEffects.findIndex(e => e.type === effect.type);

    if (existingIndex >= 0) {
      // Refresh duration if new one is stronger or longer
      const existing = this.statusEffects[existingIndex];
      if (effect.value >= existing.value || effect.duration >= existing.remainingTime) {
        this.statusEffects[existingIndex] = { ...effect, remainingTime: effect.duration };
      }
    } else {
      this.statusEffects.push({ ...effect, remainingTime: effect.duration });
    }

    // 更新视觉效果（根据优先级）
    this.updateStatusVisual();
  }

  /**
   * 根据优先级更新视觉效果
   */
  private updateStatusVisual(): void {
    // 按优先级排序，找到最高优先级的效果
    for (const effectType of EFFECT_PRIORITY) {
      const effect = this.statusEffects.find(e => e.type === effectType);
      if (effect) {
        this.applyStatusEffectColor(effectType);
        return;
      }
    }
    // 没有状态效果，恢复元素颜色
    this.applyElementTint();
  }

  /**
   * Apply visual color for status type
   */
  private applyStatusEffectColor(type: StatusEffect['type']): void {
    // 使用策略模式
    if (statusEffectColorRegistry.hasColor(type)) {
      const color = statusEffectColorRegistry.getColor(type as any);
      if (color !== undefined) {
        this.setTint(color);
        return;
      }
    }
    // 没有颜色映射，恢复元素颜色
    this.applyElementTint();
  }

  /**
   * Update all status effects - tick damage and expire
   */
  private updateStatusEffects(time: number): void {
    const delta = this.scene.game.loop.delta;

    // Check for tick_speed_up effect and update multiplier
    const tickSpeedUp = this.statusEffects.find(e => e.type === 'tick_speed_up');
    this.tickSpeedMultiplier = tickSpeedUp ? 2.0 : 1.0;

    let visualNeedsUpdate = false;

    this.statusEffects = this.statusEffects.filter(effect => {
      effect.remainingTime -= delta;

      // Process tick-based effects
      if (effect.type === 'burn' || effect.type === 'poison') {
        // Base tick interval, reduced by tickSpeedMultiplier
        const baseTickInterval = effect.type === 'burn' ? 500 : 1000;
        const tickInterval = baseTickInterval / this.tickSpeedMultiplier;
        const key = `${this.instanceId}_${effect.type}`;

        if (!this.lastDotTickTime[key]) {
          this.lastDotTickTime[key] = time;
        }

        if (time - this.lastDotTickTime[key] >= tickInterval) {
          this.takeDamage(effect.value);
          this.lastDotTickTime[key] = time;
        }
      }

      // Remove expired effects
      if (effect.remainingTime <= 0) {
        delete this.lastDotTickTime[`${this.instanceId}_${effect.type}`];
        visualNeedsUpdate = true;
        return false;
      }

      return true;
    });

    // 如果有效果过期，更新视觉效果
    if (visualNeedsUpdate) {
      this.updateStatusVisual();
    }
  }

  /**
   * Get speed multiplier from slow effects
   */
  private getSpeedMultiplier(): number {
    const slowEffect = this.statusEffects.find(e => e.type === 'slow');
    if (slowEffect) {
      return 1 - slowEffect.value; // value is 0-1, so 0.3 slow = 0.7x speed
    }
    return 1;
  }

  /**
   * Check if enemy is immobilized (freeze/stun/root)
   */
  public isImmobilized(): boolean {
    return this.statusEffects.some(e =>
      e.type === 'freeze' || e.type === 'stun' || e.type === 'root'
    );
  }

  // ==================== Element Mark Methods ====================

  /**
   * Add an element mark to this enemy for synergy tracking
   */
  addElementMark(element: Element, source: string, duration: number = 5000): void {
    const mark: ElementMark = {
      element,
      timestamp: Date.now(),
      duration,
      source,
    };
    this.elementMarks.set(element, mark);
  }

  /**
   * Get all active element marks on this enemy
   */
  getElementMarks(): ElementMark[] {
    const now = Date.now();
    const activeMarks: ElementMark[] = [];

    this.elementMarks.forEach((mark, element) => {
      if (now - mark.timestamp < mark.duration) {
        activeMarks.push(mark);
      } else {
        this.elementMarks.delete(element);
      }
    });

    return activeMarks;
  }

  /**
   * Check if enemy has a specific element mark
   */
  hasElementMark(element: Element): boolean {
    const mark = this.elementMarks.get(element);
    if (!mark) return false;

    const now = Date.now();
    if (now - mark.timestamp >= mark.duration) {
      this.elementMarks.delete(element);
      return false;
    }

    return true;
  }

  // ==================== Damage Methods ====================

  /**
   * Take damage, with optional element for counter bonus calculation
   */
  takeDamage(amount: number, attackerElement?: Element, isCrit: boolean = false): boolean {
    // Safety check: if enemy is destroyed or scene is gone, return false
    if (!this.scene || !this.active) {
      return false;
    }

    let finalDamage = amount;
    let isCounter = false;

    // Apply counter damage bonus
    if (attackerElement) {
      const counterBonus = getCounterBonus(attackerElement, this.element);
      if (counterBonus > 0) {
        finalDamage = Math.floor(amount * (1 + counterBonus));
        isCounter = true;
        // Visual feedback for counter hit
        this.showCounterEffect();
      }
    }

    // Apply damage reduction ability
    const damageReduction = this.getDamageReduction();
    if (damageReduction > 0) {
      finalDamage = Math.floor(finalDamage * (1 - damageReduction));
    }

    // Apply defense break (increase damage taken)
    const defenseBreak = this.getDefenseBreakBonus();
    if (defenseBreak > 0) {
      finalDamage = Math.floor(finalDamage * (1 + defenseBreak));
    }

    // Apply shield first
    if (this.shieldValue > 0) {
      if (this.shieldValue >= finalDamage) {
        this.shieldValue -= finalDamage;
        // 护盾吸收全部伤害，显示护盾效果
        this.showShieldEffect();
        // Emit damage event (shield absorbed)
        this.scene.events.emit('enemyDamage', {
          x: this.x,
          y: this.y,
          damage: Math.floor(finalDamage),
          isCrit: false,
          isCounter: false,
          absorbed: true,
        });
        return false;
      } else {
        finalDamage -= this.shieldValue;
        this.shieldValue = 0;
      }
    }

    this.currentHp = Math.floor(this.currentHp - finalDamage);

    // Check boss phase transition
    if (this.bossPhases) {
      this.checkPhaseTransition();
    }

    // Emit damage event for visual feedback
    this.scene.events.emit('enemyDamage', {
      x: this.x,
      y: this.y,
      damage: Math.floor(finalDamage),
      isCrit,
      isCounter,
      element: attackerElement,
    });

    // 受伤闪烁 (check scene again in case it was destroyed during damage calculation)
    if (this.scene) {
      this.scene.tweens.add({
        targets: this,
        alpha: 0.3,
        duration: 50,
        yoyo: true,
      });
    }

    if (this.currentHp <= 0) {
      this.die();
      return true;
    }

    return false;
  }

  /**
   * Get damage reduction from abilities
   */
  private getDamageReduction(): number {
    for (const ability of this.config.abilities) {
      if (ability.type === 'damage_reduction' && ability.trigger === 'passive') {
        return ability.params?.reduction || 0;
      }
    }
    return 0;
  }

  /**
   * Get defense break bonus (increased damage taken)
   */
  private getDefenseBreakBonus(): number {
    const defenseBreak = this.statusEffects.find(e => e.type === 'defense_break');
    return defenseBreak?.value || 0;
  }

  // ==================== Boss Abilities ====================

  /**
   * Add shield to enemy
   */
  addShield(value: number): void {
    this.shieldValue += value;
    this.showShieldEffect();
  }

  /**
   * Check if enemy has shield
   */
  hasShield(): boolean {
    return this.shieldValue > 0;
  }

  /**
   * Heal enemy
   */
  heal(value: number): void {
    const healAmount = Math.floor(value);
    this.currentHp = Math.min(this.maxHp, Math.floor(this.currentHp + healAmount));
    this.showHealEffect();
  }

  /**
   * Activate rage mode
   */
  activateRage(params: { damageMultiplier?: number; speedMultiplier?: number }): void {
    this.isEnraged = true;
    const damageMult = params.damageMultiplier || 1.5;
    const speedMult = params.speedMultiplier || 1.3;
    this.config = {
      ...this.config,
      damage: Math.floor(this.config.damage * damageMult),
      speed: Math.floor(this.config.speed * speedMult),
    };
    this.showRageEffect();
  }

  /**
   * Update ability cooldowns
   */
  updateAbilityCooldowns(delta: number): void {
    for (const [type, cooldown] of this.abilityCooldowns) {
      if (cooldown > 0) {
        this.abilityCooldowns.set(type, Math.max(0, cooldown - delta));
      }
    }
  }

  /**
   * Check if ability is ready
   */
  isAbilityReady(type: string): boolean {
    const cooldown = this.abilityCooldowns.get(type);
    return cooldown === undefined || cooldown <= 0;
  }

  /**
   * Set ability cooldown
   */
  setAbilityCooldown(type: string, cooldown: number): void {
    this.abilityCooldowns.set(type, cooldown);
  }

  /**
   * Get current HP percentage
   */
  getHpPercentage(): number {
    return (this.currentHp / this.maxHp) * 100;
  }

  /**
   * Get active abilities for current phase
   */
  getActiveAbilities(): EnemyAbility[] {
    if (!this.bossPhases) {
      return this.config.abilities.filter(a => a.trigger === 'active');
    }
    const currentPhase = this.bossPhases.find(p => p.phase === this.bossPhase);
    if (!currentPhase) return [];
    return this.config.abilities.filter(a =>
      a.trigger === 'active' && currentPhase.abilities.includes(a.type)
    );
  }

  /**
   * Check and handle boss phase transitions
   */
  private checkPhaseTransition(): void {
    if (!this.bossPhases) return;

    const hpPercent = this.getHpPercentage();

    // Find the highest phase that should be active based on current HP
    // Phases are sorted by hpThreshold descending (100 -> 50 -> 20)
    for (let i = this.bossPhases.length - 1; i >= 0; i--) {
      const phase = this.bossPhases[i];
      if (hpPercent <= phase.hpThreshold && this.bossPhase < phase.phase) {
        this.bossPhase = phase.phase;

        // Apply phase stat multipliers
        if (phase.damageMultiplier && phase.damageMultiplier !== 1.0) {
          this.config.damage = Math.floor(this.config.damage * phase.damageMultiplier);
        }
        if (phase.speedMultiplier && phase.speedMultiplier !== 1.0) {
          this.config.speed = this.config.speed * phase.speedMultiplier;
        }

        // Visual feedback for phase transition
        this.showPhaseTransitionEffect();

        console.log(`[Boss] ${this.config.name} entered phase ${phase.phase}`);
        break;
      }
    }
  }

  /**
   * Show visual effect for phase transition
   */
  private showPhaseTransitionEffect(): void {
    if (!this.scene) return;

    // Screen shake effect
    this.scene.cameras.main.shake(300, 0.01);

    // Flash effect on boss
    const flash = this.scene.add.circle(this.x, this.y, 50, 0xffffff, 0.8);
    flash.setDepth(100);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2,
      duration: 500,
      onComplete: () => flash.destroy(),
    });
  }

  // ==================== Visual Effects ====================

  /**
   * Show shield visual effect
   */
  private showShieldEffect(): void {
    if (!this.scene) return;
    const shield = this.scene.add.circle(this.x, this.y, 30, 0x4488ff, 0.4);
    shield.setDepth(31);
    shield.setStrokeStyle(2, 0x4488ff, 0.8);
    this.scene.tweens.add({
      targets: shield,
      alpha: 0,
      scale: 1.5,
      duration: 300,
      onComplete: () => shield.destroy(),
    });
  }

  /**
   * Show heal visual effect
   */
  private showHealEffect(): void {
    if (!this.scene) return;
    const heal = this.scene.add.circle(this.x, this.y, 25, 0x44ff44, 0.6);
    heal.setDepth(31);
    this.scene.tweens.add({
      targets: heal,
      alpha: 0,
      scale: 1.5,
      duration: 400,
      onComplete: () => heal.destroy(),
    });
    // 绿色光柱
    const beam = this.scene.add.graphics();
    beam.fillStyle(0x44ff44, 0.3);
    beam.fillRect(this.x - 15, this.y - 40, 30, 40);
    this.scene.tweens.add({
      targets: beam,
      alpha: 0,
      duration: 400,
      onComplete: () => beam.destroy(),
    });
  }

  /**
   * Show rage visual effect
   */
  private showRageEffect(): void {
    if (!this.scene) return;
    // 红色脉冲
    const rage = this.scene.add.circle(this.x, this.y, 40, 0xff4444, 0.6);
    rage.setDepth(31);
    this.scene.tweens.add({
      targets: rage,
      alpha: 0,
      scale: 2,
      duration: 500,
      onComplete: () => rage.destroy(),
    });
    // 持续红光
    this.setTint(0xff6666);
    this.scene.time.delayedCall(3000, () => {
      if (this.active) {
        this.applyElementTint();
      }
    });
  }

  /**
   * Get attack abilities (for CollisionSystem to trigger)
   */
  getAttackAbilities(): Array<{ type: string; params?: Record<string, any> }> {
    return this.config.abilities
      .filter(a => a.trigger === 'attack')
      .map(a => ({ type: a.type, params: a.params }));
  }

  /**
   * Visual effect for counter hit
   */
  private showCounterEffect(): void {
    // Safety check
    if (!this.scene || !this.active) return;

    // Flash white briefly
    const originalTint = this.tintTopLeft;
    this.setTint(0xffffff);
    this.scene.time.delayedCall(100, () => {
      if (this.active && this.scene) {
        this.setTint(originalTint);
      }
    });
  }

  private die(): void {
    // Check for explode_on_death ability
    this.triggerDeathAbilities();

    // 创建元素特定死亡效果
    this.createElementDeathEffect();

    // 清理阴影
    if (this.shadowGraphics) {
      this.shadowGraphics.destroy();
    }

    this.emit('death');
    this.destroy();
  }

  /**
   * Trigger death abilities (explode_on_death)
   */
  private triggerDeathAbilities(): void {
    // First check for synergy death explosion
    if (this.deathExplosionParams) {
      // 使用策略模式处理协同爆炸
      if (enemyDeathAbilityRegistry.hasStrategy('explode_on_death')) {
        enemyDeathAbilityRegistry.execute('explode_on_death', {
          enemy: this,
          scene: this.scene,
          params: {
            damage: this.deathExplosionParams.damage,
            radius: this.deathExplosionParams.radius,
          },
        });
      }
    }

    // Then check for ability death explosions
    for (const ability of this.config.abilities) {
      if (ability.trigger !== 'death') continue;

      // 使用策略模式
      if (enemyDeathAbilityRegistry.hasStrategy(ability.type)) {
        enemyDeathAbilityRegistry.execute(ability.type, {
          enemy: this,
          scene: this.scene,
          params: ability.params,
        });
      }
    }
  }

  /**
   * Create element-specific death effect
   */
  private createElementDeathEffect(): void {
    const color = ELEMENT_DEATH_COLORS[this.element] || 0xffffff;

    // 使用策略模式
    if (enemyElementDeathRegistry.hasStrategy(this.element)) {
      enemyElementDeathRegistry.create(this.element, {
        x: this.x,
        y: this.y,
        scene: this.scene,
        color,
      });
    } else {
      // 默认效果
      this.createDefaultDeathEffect(color);
    }
  }

  private createDefaultDeathEffect(color: number): void {
    // Default explosion effect
    const particles = this.scene.add.particles(this.x, this.y, 'particle_glow', {
      speed: { min: 50, max: 150 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: color,
      lifespan: 400,
      quantity: 8,
      emitting: false,
    });
    particles.explode();
    this.scene.time.delayedCall(500, () => particles.destroy());
  }

  destroy(): void {
    // 清理阴影
    if (this.shadowGraphics) {
      this.shadowGraphics.destroy();
    }

    // 清理精英/Boss视觉效果
    if (this.typeVisualEffects) {
      if (this.typeVisualEffects.aura) {
        this.typeVisualEffects.aura.destroy();
      }
      if (this.typeVisualEffects.outerAura) {
        this.typeVisualEffects.outerAura.destroy();
      }
      if (this.typeVisualEffects.innerAura) {
        this.typeVisualEffects.innerAura.destroy();
      }
      if (this.typeVisualEffects.coreAura) {
        this.typeVisualEffects.coreAura.destroy();
      }
      if (this.typeVisualEffects.followEvent) {
        this.typeVisualEffects.followEvent.destroy();
      }
    }

    super.destroy();
  }

  getExpValue(): number {
    return this.config.expValue;
  }
}
