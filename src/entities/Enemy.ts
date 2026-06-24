import Phaser from 'phaser';
import { EnemyConfig, EnemyType, Element, ElementMark } from '@/types';
import { COUNTER_RELATIONS, ELEMENT_COLORS, getCounterBonus } from '@/data/elements';

// Status effect interface
export interface StatusEffect {
  type: 'burn' | 'freeze' | 'stun' | 'poison' | 'slow' | 'root' | 'defense_break' | 'tick_speed_up';
  value: number;
  duration: number;
  remainingTime: number;
  source: string; // source skill ID
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

  // Element marks for synergy tracking
  private elementMarks: Map<Element, ElementMark> = new Map();

  private target: Phaser.GameObjects.Sprite | null = null;
  private shadowGraphics: Phaser.GameObjects.Graphics | null = null;
  private lastDotTickTime: Record<string, number> = {};
  private elementTintApplied: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, config: EnemyConfig) {
    // 根据敌人配置选择纹理
    const textureKey = ENEMY_TEXTURE_MAP[config.id] || 'enemy_slime';
    super(scene, x, y, textureKey);

    this.config = config;
    this.currentHp = config.hp;
    this.instanceId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.element = config.element;

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

    // Apply element color tint
    this.applyElementTint();

    // Apply passive abilities
    this.applyPassiveAbilities();
  }

  /**
   * Apply passive abilities on spawn
   */
  private applyPassiveAbilities(): void {
    for (const ability of this.config.abilities) {
      if (ability.trigger !== 'passive') continue;

      switch (ability.type) {
        case 'hp_boost':
          const hpMultiplier = ability.params?.multiplier || 1.5;
          this.currentHp = Math.floor(this.config.hp * hpMultiplier);
          this.config = { ...this.config, hp: this.currentHp };
          break;

        case 'speed_boost':
          const speedMultiplier = ability.params?.multiplier || 1.3;
          this.config = { ...this.config, speed: Math.floor(this.config.speed * speedMultiplier) };
          break;

        case 'damage_reduction':
          // Handled in takeDamage
          break;

        case 'burn_on_contact':
          // Handled in CollisionSystem when enemy hits player
          break;
      }
    }
  }

  private getScaleByType(type: EnemyType): number {
    switch (type) {
      case 'normal':
        return 1;
      case 'elite':
        return 1.3;
      case 'boss':
        return 1.8;
      default:
        return 1;
    }
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

  private applyElementTint(): void {
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
    switch (type) {
      case 'freeze':
        this.setTint(0x88ddff); // 淡蓝色
        break;
      case 'stun':
        this.setTint(0xffff88); // 黄色
        break;
      case 'poison':
        this.setTint(0x88ff88); // 绿色
        break;
      case 'defense_break':
        this.setTint(0xff8888); // 红色
        break;
      case 'slow':
        this.setTint(0xaaddff); // 浅蓝灰色（减速视觉）
        break;
      case 'burn':
        this.setTint(0xffaa44); // 橙色（燃烧视觉）
        break;
      default:
        this.applyElementTint();
        break;
    }
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
  private isImmobilized(): boolean {
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
  takeDamage(amount: number, attackerElement?: Element): boolean {
    // Safety check: if enemy is destroyed or scene is gone, return false
    if (!this.scene || !this.active) {
      return false;
    }

    let finalDamage = amount;

    // Apply counter damage bonus
    if (attackerElement) {
      const counterBonus = getCounterBonus(attackerElement, this.element);
      if (counterBonus > 0) {
        finalDamage = amount * (1 + counterBonus);
        // Visual feedback for counter hit
        this.showCounterEffect();
      }
    }

    // Apply damage reduction ability
    const damageReduction = this.getDamageReduction();
    if (damageReduction > 0) {
      finalDamage = finalDamage * (1 - damageReduction);
    }

    // Apply defense break (increase damage taken)
    const defenseBreak = this.getDefenseBreakBonus();
    if (defenseBreak > 0) {
      finalDamage = finalDamage * (1 + defenseBreak);
    }

    this.currentHp -= finalDamage;

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
      this.triggerExplosion(
        this.deathExplosionParams.damage,
        this.deathExplosionParams.radius
      );
    }

    // Then check for ability death explosions
    for (const ability of this.config.abilities) {
      if (ability.trigger !== 'death') continue;

      switch (ability.type) {
        case 'explode_on_death':
          this.triggerExplosion(
            ability.params?.damage || 10,
            ability.params?.radius || 50
          );
          break;
      }
    }
  }

  /**
   * Trigger explosion on death
   */
  private triggerExplosion(damage: number, radius: number): void {
    // Visual effect
    const explosion = this.scene.add.circle(this.x, this.y, radius, 0xff4400, 0.6);
    explosion.setDepth(100);

    const shockwave = this.scene.add.circle(this.x, this.y, radius * 1.5, 0xffff00, 0.3);
    shockwave.setDepth(99);

    this.scene.tweens.add({
      targets: [explosion, shockwave],
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        explosion.destroy();
        shockwave.destroy();
      },
    });

    // Emit event for CollisionSystem to handle damage
    this.scene.events.emit('enemyExplosion', {
      x: this.x,
      y: this.y,
      radius,
      damage,
      sourceEnemy: this,
    });
  }

  /**
   * Create element-specific death effect
   */
  private createElementDeathEffect(): void {
    const color = ELEMENT_DEATH_COLORS[this.element] || 0xffffff;

    switch (this.element) {
      case 'fire':
        this.createFireDeathEffect(color);
        break;
      case 'water':
        this.createWaterDeathEffect(color);
        break;
      case 'ice':
        this.createIceDeathEffect(color);
        break;
      case 'lightning':
        this.createLightningDeathEffect(color);
        break;
      case 'holy':
        this.createHolyDeathEffect(color);
        break;
      case 'shadow':
        this.createShadowDeathEffect(color);
        break;
      case 'grass':
        this.createGrassDeathEffect(color);
        break;
      case 'earth':
        this.createEarthDeathEffect(color);
        break;
      default:
        this.createDefaultDeathEffect(color);
        break;
    }
  }

  private createFireDeathEffect(color: number): void {
    // Fire particle burst
    const particles = this.scene.add.particles(this.x, this.y, 'particle_glow', {
      speed: { min: 80, max: 200 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: color,
      lifespan: 600,
      quantity: 12,
      emitting: false,
    });
    particles.explode();
    this.scene.time.delayedCall(700, () => particles.destroy());
  }

  private createWaterDeathEffect(color: number): void {
    // Water splash effect
    const particles = this.scene.add.particles(this.x, this.y, 'particle_glow', {
      speed: { min: 40, max: 120 },
      scale: { start: 0.6, end: 0.1 },
      alpha: { start: 0.8, end: 0 },
      tint: color,
      lifespan: 500,
      quantity: 16,
      emitting: false,
    });
    particles.explode();
    this.scene.time.delayedCall(600, () => particles.destroy());
  }

  private createIceDeathEffect(color: number): void {
    // Ice shatter effect
    const particles = this.scene.add.particles(this.x, this.y, 'particle_glow', {
      speed: { min: 100, max: 180 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: color,
      lifespan: 400,
      quantity: 20,
      emitting: false,
    });
    particles.explode();
    this.scene.time.delayedCall(500, () => particles.destroy());
  }

  private createLightningDeathEffect(color: number): void {
    // Electric discharge effect
    const particles = this.scene.add.particles(this.x, this.y, 'particle_glow', {
      speed: { min: 150, max: 300 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: color,
      lifespan: 300,
      quantity: 24,
      emitting: false,
    });
    particles.explode();
    this.scene.time.delayedCall(400, () => particles.destroy());
  }

  private createHolyDeathEffect(color: number): void {
    // Golden flash effect
    const particles = this.scene.add.particles(this.x, this.y, 'particle_glow', {
      speed: { min: 60, max: 140 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: color,
      lifespan: 800,
      quantity: 15,
      emitting: false,
    });
    particles.explode();
    this.scene.time.delayedCall(900, () => particles.destroy());
  }

  private createShadowDeathEffect(color: number): void {
    // Purple mist effect
    const particles = this.scene.add.particles(this.x, this.y, 'particle_glow', {
      speed: { min: 30, max: 80 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 0.7, end: 0 },
      tint: color,
      lifespan: 1000,
      quantity: 10,
      emitting: false,
    });
    particles.explode();
    this.scene.time.delayedCall(1100, () => particles.destroy());
  }

  private createGrassDeathEffect(color: number): void {
    // Leaf scatter effect
    const particles = this.scene.add.particles(this.x, this.y, 'particle_glow', {
      speed: { min: 50, max: 100 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: color,
      lifespan: 700,
      quantity: 14,
      emitting: false,
    });
    particles.explode();
    this.scene.time.delayedCall(800, () => particles.destroy());
  }

  private createEarthDeathEffect(color: number): void {
    // Rock debris effect
    const particles = this.scene.add.particles(this.x, this.y, 'particle_glow', {
      speed: { min: 70, max: 150 },
      scale: { start: 0.6, end: 0.2 },
      alpha: { start: 1, end: 0 },
      tint: color,
      lifespan: 600,
      quantity: 18,
      emitting: false,
    });
    particles.explode();
    this.scene.time.delayedCall(700, () => particles.destroy());
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
    if (this.shadowGraphics) {
      this.shadowGraphics.destroy();
    }
    super.destroy();
  }

  getExpValue(): number {
    return this.config.expValue;
  }
}
