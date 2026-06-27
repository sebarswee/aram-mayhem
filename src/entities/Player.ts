import Phaser from 'phaser';
import { PlayerStats, Skill, Element } from '@/types';
import { INITIAL_PLAYER_STATS } from '@/config/balance.config';
import { WORLD_WIDTH, WORLD_HEIGHT } from '@/config/game.config';
import { passiveEffectStrategyRegistry, PassiveEffectData, getThornsStrategy } from '@/strategies';
import { IBuffable } from '@/modifiers/interfaces/IBuffable';
import { ModifierStack } from '@/modifiers/core/ModifierStack';
import {
  createBurnVisualModifier,
  createPoisonVisualModifier,
  createSlowVisualModifier,
  createRootVisualModifier,
  createAttackBoostVisualModifier,
  createSpeedBoostVisualModifier,
  createShieldVisualModifier,
} from '@/modifiers/visual/VisualModifiers';

/**
 * Reflect effect - bounces damage back to attacker
 */
export interface ReflectEffect {
  value: number;      // Percentage of damage to reflect (e.g., 0.3 = 30%)
  duration: number;
  remainingTime: number;
}

/**
 * Counter effect - fixed damage on being hit
 */
export interface CounterDamageEffect {
  value: number;      // Fixed damage to deal
  remainingTriggers: number;  // How many more times it can trigger
  duration: number;
  remainingTime: number;
}

/**
 * Counter freeze effect - freezes attacker
 */
export interface CounterFreezeEffect {
  duration: number;   // Freeze duration in ms
  remainingTriggers: number;  // How many more times it can trigger
  effectDuration: number;  // Total effect duration
  remainingTime: number;
}

export class Player extends Phaser.Physics.Arcade.Sprite implements IBuffable {
  public stats: PlayerStats;
  public skills: Skill[] = [];
  public ultimateSkills: Skill[] = []; // Separate slot for ultimate skills
  public passiveSkills: Skill[] = []; // Passive skills slot
  public skillCooldowns: Map<string, number> = new Map();

  // Skill slot limits
  public readonly MAX_BASIC_SKILLS = 4;
  public readonly MAX_ULTIMATE_SKILLS = 2;

  // 新增：修饰符栈
  public readonly modifierStack: ModifierStack;

  // 新增：实例 ID（用于 IBuffable.id）
  public readonly id: string;

  private lastDamageTime: number = 0;
  public isInvincible: boolean = false;
  private shieldValue: number = 0;

  // Reflect effects system
  private reflectEffects: ReflectEffect[] = [];

  // Counter damage effects system (火焰反击)
  private counterDamageEffects: CounterDamageEffect[] = [];

  // Counter freeze effects system (冰霜屏障)
  private counterFreezeEffects: CounterFreezeEffect[] = [];

  // Element resistance system
  public elementResistance: Partial<Record<Element, number>> = {};

  // Visual effect references
  private statusTint: number = 0xffffff;
  private particleEmitters: Map<string, Phaser.GameObjects.Particles.ParticleEmitter> = new Map();

  // 动画状态
  private currentAnim: 'idle' | 'move' | 'attack' = 'idle';
  private isAttacking: boolean = false;

  // IBuffable 要求的属性：基础属性（只读）
  public get baseAttributes(): Readonly<Record<string, number>> {
    return {
      maxHp: this.stats.maxHp,
      attack: this.stats.attack,
      defense: this.stats.defense,
      speed: this.stats.speed,
      lifesteal: this.stats.lifesteal,
    };
  }

  // IBuffable 要求的属性：isActive
  public get isActive(): boolean {
    return this.active;
  }

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // 优先使用新的精灵表纹理，否则回退到程序化生成的纹理
    const textureKey = scene.textures.exists('player_idle') ? 'player_idle' : 'player';
    super(scene, x, y, textureKey);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 初始化属性
    this.stats = { ...INITIAL_PLAYER_STATS };

    // 设置物理体
    this.setCollideWorldBounds(true);
    this.setDrag(0);
    this.setBounce(0);

    // 设置碰撞体大小
    this.body?.setSize(32, 32);

    // 设置深度
    this.setDepth(50);

    // 初始化实例 ID
    this.id = `player_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // 初始化修饰符栈
    this.modifierStack = new ModifierStack(this);

    // 初始化元素抗性
    this.initializeElementResistance();

    // 如果使用精灵表纹理，立即播放待机动画
    if (scene.textures.exists('player_idle') && scene.anims.exists('player_idle_anim')) {
      this.play('player_idle_anim');
    }

    // 设置荆棘策略的player引用
    getThornsStrategy().setPlayer(this);
  }

  /**
   * Initialize element resistance with default values
   * Counter elements have +25% resistance, weak elements have -25%
   */
  private initializeElementResistance(): void {
    // Default resistances (can be modified by skills/items)
    this.elementResistance = {
      fire: 0,
      water: 0,
      ice: 0,
      lightning: 0,
      holy: 0,
      shadow: 0,
      grass: 0,
      earth: 0,
    };
  }

  /**
   * 播放指定动画
   */
  private playAnimation(anim: 'idle' | 'move' | 'attack'): void {
    if (this.currentAnim === anim) return;

    const animKey = `player_${anim}_anim`;

    // 检查动画是否存在
    if (!this.scene.anims.exists(animKey)) {
      // 回退到静态纹理
      if (this.scene.textures.exists('player')) {
        this.setTexture('player');
      }
      return;
    }

    this.currentAnim = anim;
    this.play(animKey);

    // 攻击动画结束后回到待机
    if (anim === 'attack') {
      this.isAttacking = true;
      this.once('animationcomplete', () => {
        this.isAttacking = false;
        this.playAnimation('idle');
      });
    }
  }

  /**
   * 播放攻击动画（由技能系统调用）
   */
  public playAttackAnimation(): void {
    if (!this.isAttacking) {
      this.playAnimation('attack');
    }
  }

  // ==================== Skill Management ====================

  /**
   * Check if player can learn a new basic skill
   */
  canLearnBasicSkill(): boolean {
    return this.skills.filter(s => s.type !== 'ultimate').length < this.MAX_BASIC_SKILLS;
  }

  /**
   * Check if player can learn a new ultimate skill
   */
  canLearnUltimateSkill(): boolean {
    return this.ultimateSkills.length < this.MAX_ULTIMATE_SKILLS;
  }

  /**
   * Add a basic skill to the player
   * Returns true if skill was added, false if slot is full
   */
  addBasicSkill(skill: Skill): boolean {
    if (!this.canLearnBasicSkill()) {
      console.warn('[Player] Basic skill slots full (max 4)');
      return false;
    }
    this.skills.push(skill);
    this.skillCooldowns.set(skill.id, 0);
    return true;
  }

  /**
   * Add an ultimate skill to the player
   * Returns true if skill was added, false if slot is full
   */
  addUltimateSkill(skill: Skill): boolean {
    if (!this.canLearnUltimateSkill()) {
      console.warn('[Player] Ultimate skill slots full (max 2)');
      return false;
    }
    this.ultimateSkills.push(skill);
    this.skillCooldowns.set(skill.id, 0);
    return true;
  }

  /**
   * Get all skills (basic + ultimate) for display
   */
  getAllSkills(): Skill[] {
    return [...this.skills, ...this.ultimateSkills];
  }

  // ==================== Passive Skills ====================

  /**
   * Add a passive skill to the player
   */
  addPassiveSkill(skill: Skill): boolean {
    this.passiveSkills.push(skill);
    // Apply passive effect immediately
    this.applyPassiveEffect(skill);
    return true;
  }

  /**
   * Apply a passive skill effect
   */
  private applyPassiveEffect(skill: Skill): void {
    if (!skill.passiveEffect) return;

    const effect: PassiveEffectData = {
      type: skill.passiveEffect.type,
      value: skill.passiveEffect.value,
      element: skill.passiveEffect.element,
    };

    // 尝试使用策略模式
    if (passiveEffectStrategyRegistry.hasStrategy(effect.type)) {
      passiveEffectStrategyRegistry.execute(effect, this.stats);
    }
  }

  /**
   * Get all passive skills
   */
  getPassiveSkills(): Skill[] {
    return this.passiveSkills;
  }

  // ==================== Movement ====================

  move(velocityX: number, velocityY: number): void {
    // Root prevents movement
    if (this.hasStatusEffect('root')) {
      this.setVelocity(0, 0);
      return;
    }

    // Apply speed modifiers
    const effectiveSpeed = this.getEffectiveSpeed();
    const speedMultiplier = effectiveSpeed / this.stats.speed;

    this.setVelocity(velocityX * speedMultiplier, velocityY * speedMultiplier);
  }

  /**
   * 添加状态效果（便捷方法，使用新的修饰符系统）
   */
  addStatusEffect(effect: { type: string; value: number; duration: number; element?: Element }): void {
    switch (effect.type) {
      case 'burn':
        this.modifierStack.addModifier(
          createBurnVisualModifier(effect.value, effect.duration, effect.element)
        );
        break;
      case 'poison':
        this.modifierStack.addModifier(
          createPoisonVisualModifier(effect.value, effect.duration)
        );
        break;
      case 'slow':
        this.modifierStack.addModifier(
          createSlowVisualModifier(effect.value, effect.duration)
        );
        break;
      case 'root':
        this.modifierStack.addModifier(
          createRootVisualModifier(effect.duration)
        );
        break;
      case 'attack_boost':
        this.modifierStack.addModifier(
          createAttackBoostVisualModifier(effect.value, effect.duration)
        );
        break;
      case 'speed_boost':
        this.modifierStack.addModifier(
          createSpeedBoostVisualModifier(effect.value, effect.duration)
        );
        break;
      case 'shield':
        this.modifierStack.addModifier(
          createShieldVisualModifier(effect.value)
        );
        break;
      default:
        console.warn(`[Player] Unknown status effect type: ${effect.type}`);
    }
  }

  /**
   * 检查是否有特定状态效果
   * 便捷方法：封装 modifierStack.hasTag() 调用
   */
  hasStatusEffect(type: string): boolean {
    return this.modifierStack.hasTag(type);
  }

  /**
   * 更新持续效果（reflect、counter 等）
   * 在 update() 中调用
   */
  private updateDurationEffects(delta: number): void {
    // Update reflect effects
    this.reflectEffects = this.reflectEffects.filter(effect => {
      effect.remainingTime -= delta;
      return effect.remainingTime > 0;
    });

    // Update counter damage effects
    this.counterDamageEffects = this.counterDamageEffects.filter(effect => {
      effect.remainingTime -= delta;
      return effect.remainingTime > 0 && effect.remainingTriggers > 0;
    });

    // Update counter freeze effects
    this.counterFreezeEffects = this.counterFreezeEffects.filter(effect => {
      effect.remainingTime -= delta;
      return effect.remainingTime > 0 && effect.remainingTriggers > 0;
    });
  }

  /**
   * 清除所有减益效果
   */
  clearDebuffs(): void {
    // 使用 modifierStack 移除所有带有 debuff 标签的修饰符
    const debuffTags = ['burn', 'poison', 'slow', 'root', 'freeze', 'stun', 'defense_break'];
    this.modifierStack.removeByTags(debuffTags);

    // 重置视觉着色
    this.updateVisualTint();
  }

  /**
   * Update the visual tint based on all active status effects
   */
  public updateVisualTint(): void {
    // Priority: burn > poison > attack_boost > shield > default
    if (this.hasStatusEffect('burn')) {
      this.setTint(0xff8844);
    } else if (this.hasStatusEffect('poison')) {
      this.setTint(0x44ff44);
    } else if (this.hasStatusEffect('attack_boost')) {
      this.setTint(0xff4444);
    } else if (this.hasShield()) {
      this.setTint(0x88ccff);
    } else {
      this.setTint(0xffffff);
    }
  }

  /**
   * Create cyan trail particles for speed boost
   */
  public createSpeedTrailParticles(): void {
    // Check if particles texture exists
    if (!this.scene.textures.exists('particle')) {
      return;
    }

    const emitter = this.scene.add.particles(0, 0, 'particle', {
      follow: this,
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.6, end: 0 },
      speed: 0,
      lifespan: 300,
      tint: 0x00ffff, // Cyan
      frequency: 50,
    });
    emitter.setDepth(48);
    this.particleEmitters.set('speed_trail', emitter);
  }

  /**
   * Get a particle emitter by name
   */
  public getParticleEmitter(name: string): Phaser.GameObjects.Particles.ParticleEmitter | undefined {
    return this.particleEmitters.get(name);
  }

  /**
   * Get effective speed including status effect modifiers
   * 便捷方法：封装 modifierStack.getAttributeValue() 调用
   */
  getEffectiveSpeed(): number {
    const baseSpeed = this.stats.speed;
    return this.modifierStack.getAttributeValue('speed', baseSpeed);
  }

  /**
   * Get effective attack including status effect modifiers
   * 便捷方法：封装 modifierStack.getAttributeValue() 调用
   */
  getEffectiveAttack(): number {
    const baseAttack = this.stats.attack;

    // Apply berserker effect (attack increases as HP decreases)
    // This is a special passive effect, not a modifier
    const berserkerValue = (this.stats as any).berserkerValue || 0;
    if (berserkerValue > 0) {
      const hpPercent = this.stats.currentHp / this.stats.maxHp;
      const missingHpPercent = 1 - hpPercent;
      const berserkerBonus = baseAttack * berserkerValue * missingHpPercent;
      return this.modifierStack.getAttributeValue('attack', baseAttack + berserkerBonus);
    }

    return this.modifierStack.getAttributeValue('attack', baseAttack);
  }

  /**
   * Get element resistance for a specific element
   */
  getElementResistance(element: Element): number {
    return this.elementResistance[element] || 0;
  }

  /**
   * Set element resistance for a specific element
   */
  setElementResistance(element: Element, value: number): void {
    this.elementResistance[element] = value;
  }

  /**
   * Apply lifesteal healing when dealing damage
   * Called by external systems like CollisionSystem
   */
  applyLifesteal(damageDealt: number): void {
    if (this.stats.lifesteal > 0) {
      const healAmount = damageDealt * (this.stats.lifesteal / 100);
      this.heal(healAmount);
    }
  }

  takeDamage(amount: number): boolean {
    const now = Date.now();

    // 无敌状态不受伤
    if (this.isInvincible) {
      return false;
    }

    // 闪避判定
    const dodgeChance = (this.stats as any).dodgeChance || 0;
    if (Math.random() < dodgeChance) {
      // 闪避成功，显示闪避效果
      const dodgeText = this.scene.add.text(this.x, this.y - 30, '闪避', {
        fontSize: '16px',
        color: '#00ffff',
        fontStyle: 'bold',
      });
      dodgeText.setOrigin(0.5);
      dodgeText.setDepth(200);
      this.scene.tweens.add({
        targets: dodgeText,
        y: this.y - 60,
        alpha: 0,
        duration: 500,
        onComplete: () => dodgeText.destroy(),
      });
      return false;
    }

    // 碰撞伤害间隔限制
    if (now - this.lastDamageTime < 500) {
      return false;
    }

    let finalDamage = amount;

    // 先扣护盾
    if (this.shieldValue > 0) {
      if (this.shieldValue >= finalDamage) {
        this.shieldValue -= finalDamage;
        this.updateVisualTint();
        // Emit damage event (shield absorbed)
        this.scene?.events.emit('playerDamage', {
          x: this.x,
          y: this.y,
          damage: Math.floor(finalDamage),
          absorbed: true,
        });
        return false;
      } else {
        finalDamage -= this.shieldValue;
        this.shieldValue = 0;
        this.updateVisualTint();
      }
    }

    // 计算实际伤害(考虑防御)
    const actualDamage = Math.max(1, Math.floor(finalDamage - this.stats.defense * 0.5));
    this.stats.currentHp = Math.max(0, Math.floor(this.stats.currentHp - actualDamage));
    this.lastDamageTime = now;

    // Emit damage event for visual feedback
    this.scene?.events.emit('playerDamage', {
      x: this.x,
      y: this.y,
      damage: Math.floor(actualDamage),
    });

    // 受伤闪烁效果
    this.scene.tweens.add({
      targets: this,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 2,
    });

    // 检查死亡
    if (this.stats.currentHp <= 0) {
      this.die();
      return true;
    }

    return false;
  }

  /**
   * Take damage from a specific element (considers element resistance)
   */
  takeElementalDamage(amount: number, element: Element): boolean {
    const resistance = this.getElementResistance(element);
    const modifiedDamage = amount * (1 - resistance / 100);
    return this.takeDamage(modifiedDamage);
  }

  /**
   * 添加护盾
   */
  addShield(amount: number): void {
    this.shieldValue += amount;
    this.updateVisualTint();
    // Emit shield event for visual feedback
    this.scene?.events.emit('playerShield', {
      x: this.x,
      y: this.y,
      value: amount,
    });
  }

  /**
   * 检查是否有护盾
   */
  hasShield(): boolean {
    return this.shieldValue > 0;
  }

  /**
   * 获取当前护盾值
   */
  getShield(): number {
    return this.shieldValue;
  }

  /**
   * 添加反弹效果
   */
  addReflectEffect(effect: Omit<ReflectEffect, 'remainingTime'>): void {
    this.reflectEffects.push({
      ...effect,
      remainingTime: effect.duration,
    });
  }

  /**
   * 获取当前反弹伤害百分比
   * Returns the total reflect percentage (e.g., 0.3 = 30%)
   */
  getReflectValue(): number {
    if (this.reflectEffects.length === 0) return 0;
    // Sum all active reflect effects
    return this.reflectEffects.reduce((total, effect) => total + effect.value, 0);
  }

  /**
   * 检查是否有反弹效果
   */
  hasReflect(): boolean {
    return this.reflectEffects.length > 0;
  }

  /**
   * 添加反击伤害效果（火焰反击）
   */
  addCounterDamageEffect(effect: { value: number; duration: number; maxTriggers: number }): void {
    this.counterDamageEffects.push({
      value: effect.value,
      remainingTriggers: effect.maxTriggers,
      duration: effect.duration,
      remainingTime: effect.duration,
    });
  }

  /**
   * 检查是否有反击伤害效果
   */
  hasCounterDamage(): boolean {
    return this.counterDamageEffects.some(e => e.remainingTriggers > 0);
  }

  /**
   * 触发并消耗反击伤害效果
   * @returns 反击伤害值，如果没有可用的则返回0
   */
  triggerCounterDamage(): number {
    for (const effect of this.counterDamageEffects) {
      if (effect.remainingTriggers > 0) {
        effect.remainingTriggers--;
        return effect.value;
      }
    }
    return 0;
  }

  /**
   * 添加反击冻结效果（冰霜屏障）
   */
  addCounterFreezeEffect(effect: { duration: number; effectDuration: number; maxTriggers: number }): void {
    this.counterFreezeEffects.push({
      duration: effect.duration,
      remainingTriggers: effect.maxTriggers,
      effectDuration: effect.effectDuration,
      remainingTime: effect.effectDuration,
    });
  }

  /**
   * 检查是否有反击冻结效果
   */
  hasCounterFreeze(): boolean {
    return this.counterFreezeEffects.some(e => e.remainingTriggers > 0);
  }

  /**
   * 触发并消耗反击冻结效果
   * @returns 冻结持续时间（毫秒），如果没有可用的则返回0
   */
  triggerCounterFreeze(): number {
    for (const effect of this.counterFreezeEffects) {
      if (effect.remainingTriggers > 0) {
        effect.remainingTriggers--;
        return effect.duration;
      }
    }
    return 0;
  }

  heal(amount: number): void {
    const healAmount = Math.floor(amount);
    const oldHp = this.stats.currentHp;
    this.stats.currentHp = Math.min(
      this.stats.maxHp,
      Math.floor(this.stats.currentHp + healAmount)
    );
    // Emit heal event for UI updates
    const actualHeal = this.stats.currentHp - oldHp;
    if (actualHeal > 0) {
      this.emit('heal', actualHeal);
      this.scene?.events.emit('playerHeal', {
        x: this.x,
        y: this.y,
        value: actualHeal,
      });
    }
  }

  private die(): void {
    this.emit('death');
    this.setActive(false);
    this.setVisible(false);
  }

  reset(x: number, y: number): void {
    this.stats = { ...INITIAL_PLAYER_STATS };
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.skillCooldowns.clear();
    this.shieldValue = 0;
    this.isInvincible = false;
    this.reflectEffects = [];
    this.counterDamageEffects = [];
    this.counterFreezeEffects = [];
    this.initializeElementResistance();
    this.updateVisualTint();

    // Clean up particle emitters
    this.particleEmitters.forEach(emitter => emitter.destroy());
    this.particleEmitters.clear();
  }

  // IBuffable 要求的方法：更新修饰符栈
  updateModifiers(delta: number): void {
    this.modifierStack.update(delta);
  }

  update(delta: number): void {
    // 更新技能冷却
    this.skillCooldowns.forEach((cooldown, skillId) => {
      if (cooldown > 0) {
        this.skillCooldowns.set(skillId, Math.max(0, cooldown - delta));
      }
    });

    // 更新修饰符栈（状态效果现在由修饰符系统处理）
    this.updateModifiers(delta);

    // 更新其他持续效果（reflect、counter 等）
    this.updateDurationEffects(delta);

    // HP 回复（被动技能）
    const hpRegen = (this.stats as any).hpRegen || 0;
    if (hpRegen > 0) {
      const healAmount = Math.floor(hpRegen * (delta / 1000));
      if (healAmount > 0) {
        this.stats.currentHp = Math.min(this.stats.maxHp, Math.floor(this.stats.currentHp + healAmount));
      }
    }

    // 根据移动状态切换动画
    const isMoving = this.body?.velocity.x !== 0 || this.body?.velocity.y !== 0;

    if (!this.isAttacking) {
      if (isMoving) {
        this.playAnimation('move');
      } else {
        this.playAnimation('idle');
      }
    }

    // 根据移动方向翻转角色
    if (this.body?.velocity.x && this.body.velocity.x !== 0) {
      this.setFlipX(this.body.velocity.x < 0);
    }
  }

  destroy(): void {
    // Clean up particle emitters
    this.particleEmitters.forEach(emitter => emitter.destroy());
    this.particleEmitters.clear();
    super.destroy();
  }
}
