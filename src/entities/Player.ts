import Phaser from 'phaser';
import { PlayerStats, Skill, Element } from '@/types';
import { INITIAL_PLAYER_STATS } from '@/config/balance.config';
import { WORLD_WIDTH, WORLD_HEIGHT } from '@/config/game.config';

/**
 * Status effect types that can be applied to the player
 */
export interface PlayerStatusEffect {
  type: 'burn' | 'poison' | 'slow' | 'root' | 'shield' | 'attack_boost' | 'speed_boost';
  value: number;
  duration: number;
  remainingTime: number;
}

/**
 * Reflect effect - bounces damage back to attacker
 */
export interface ReflectEffect {
  value: number;      // Percentage of damage to reflect (e.g., 0.3 = 30%)
  duration: number;
  remainingTime: number;
}

/**
 * Debuff types for identification
 */
const DEBUFF_TYPES = ['burn', 'poison', 'slow', 'root'];

export class Player extends Phaser.Physics.Arcade.Sprite {
  public stats: PlayerStats;
  public skills: Skill[] = [];
  public ultimateSkills: Skill[] = []; // Separate slot for ultimate skills
  public passiveSkills: Skill[] = []; // Passive skills slot
  public skillCooldowns: Map<string, number> = new Map();

  // Skill slot limits
  public readonly MAX_BASIC_SKILLS = 4;
  public readonly MAX_ULTIMATE_SKILLS = 2;

  private lastDamageTime: number = 0;
  private glowSprite: Phaser.GameObjects.Sprite | null = null;
  public isInvincible: boolean = false;
  private shieldValue: number = 0;

  // Status effects system
  public statusEffects: PlayerStatusEffect[] = [];
  private statusEffectTickTimers: Map<string, number> = new Map();

  // Reflect effects system
  private reflectEffects: ReflectEffect[] = [];

  // Element resistance system
  public elementResistance: Partial<Record<Element, number>> = {};

  // Visual effect references
  private statusTint: number = 0xffffff;
  private particleEmitters: Map<string, Phaser.GameObjects.Particles.ParticleEmitter> = new Map();

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');

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

    // 初始化元素抗性
    this.initializeElementResistance();

    // 创建发光效果
    this.createGlowEffect();
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

  private createGlowEffect(): void {
    this.glowSprite = this.scene.add.sprite(this.x, this.y, 'player');
    this.glowSprite.setAlpha(0.3);
    this.glowSprite.setTint(0x66ccff);
    this.glowSprite.setScale(1.3);
    this.glowSprite.setDepth(49);
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

    const effect = skill.passiveEffect;
    switch (effect.type) {
      case 'max_hp':
        this.stats.maxHp *= (1 + effect.value);
        this.stats.currentHp *= (1 + effect.value);
        break;
      case 'lifesteal':
        this.stats.lifesteal += effect.value * 100;
        break;
      case 'dodge':
        // Store dodge chance in stats (need to add to PlayerStats)
        (this.stats as any).dodgeChance = ((this.stats as any).dodgeChance || 0) + effect.value;
        break;
      case 'crit_boost':
        this.stats.critRate += effect.value;
        this.stats.critDamage += effect.value;
        break;
      case 'speed':
        this.stats.speed *= (1 + effect.value);
        break;
      case 'cooldown_reduction':
        this.stats.cooldownReduction = (this.stats.cooldownReduction || 0) + effect.value;
        break;
      case 'regen':
        // Store regen value for update loop
        (this.stats as any).hpRegen = ((this.stats as any).hpRegen || 0) + effect.value;
        break;
      case 'element_damage':
        this.stats.skillDamageBonus = (this.stats.skillDamageBonus || 0) + effect.value;
        break;
      case 'luck':
        (this.stats as any).luck = ((this.stats as any).luck || 0) + effect.value;
        break;
      case 'thorns':
        this.addReflectEffect({ value: effect.value, duration: 999999999 });
        break;
      case 'shield_boost':
        (this.stats as any).shieldBoost = ((this.stats as any).shieldBoost || 0) + effect.value;
        break;
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
   * Add a status effect to the player
   */
  addStatusEffect(effect: Omit<PlayerStatusEffect, 'remainingTime'>): void {
    const existingIndex = this.statusEffects.findIndex(e => e.type === effect.type);

    if (existingIndex >= 0) {
      // Refresh or extend existing effect
      const existing = this.statusEffects[existingIndex];
      existing.value = Math.max(existing.value, effect.value);
      existing.duration = Math.max(existing.duration, effect.duration);
      existing.remainingTime = effect.duration;
    } else {
      // Add new effect
      this.statusEffects.push({
        ...effect,
        remainingTime: effect.duration,
      });

      // Initialize tick timer for DoT effects
      if (effect.type === 'burn' || effect.type === 'poison') {
        this.statusEffectTickTimers.set(effect.type, 0);
      }

      // Create visual feedback
      this.applyStatusEffectVisual(effect.type);
    }

    // Shield is a special case - add to shield value
    if (effect.type === 'shield') {
      this.addShield(effect.value);
      // Remove from status effects array since we track shield separately
      this.statusEffects = this.statusEffects.filter(e => e.type !== 'shield');
    }
  }

  /**
   * Check if player has a specific status effect
   */
  hasStatusEffect(type: PlayerStatusEffect['type']): boolean {
    return this.statusEffects.some(e => e.type === type);
  }

  /**
   * Get the value of a specific status effect (returns 0 if not found)
   */
  getStatusEffectValue(type: PlayerStatusEffect['type']): number {
    const effect = this.statusEffects.find(e => e.type === type);
    return effect ? effect.value : 0;
  }

  /**
   * Update all active status effects (called in update loop)
   */
  updateStatusEffects(delta: number): void {
    const effectsToRemove: string[] = [];

    for (const effect of this.statusEffects) {
      effect.remainingTime -= delta;

      // Process DoT effects (burn, poison)
      if (effect.type === 'burn' || effect.type === 'poison') {
        const tickTimer = this.statusEffectTickTimers.get(effect.type) || 0;
        const newTimer = tickTimer + delta;

        // Tick every 500ms
        if (newTimer >= 500) {
          this.takeDamage(effect.value);
          this.statusEffectTickTimers.set(effect.type, newTimer - 500);
        } else {
          this.statusEffectTickTimers.set(effect.type, newTimer);
        }
      }

      // Remove expired effects
      if (effect.remainingTime <= 0) {
        effectsToRemove.push(effect.type);
      }
    }

    // Remove expired effects and their visuals
    for (const type of effectsToRemove) {
      this.removeStatusEffectVisual(type as PlayerStatusEffect['type']);
      this.statusEffects = this.statusEffects.filter(e => e.type !== type);
      this.statusEffectTickTimers.delete(type);
    }

    // Update reflect effects
    this.reflectEffects = this.reflectEffects.filter(effect => {
      effect.remainingTime -= delta;
      return effect.remainingTime > 0;
    });
  }

  /**
   * Clear all debuffs (called by golden apple special food)
   */
  clearDebuffs(): void {
    const debuffsToRemove = this.statusEffects.filter(e =>
      DEBUFF_TYPES.includes(e.type)
    );

    for (const debuff of debuffsToRemove) {
      this.removeStatusEffectVisual(debuff.type);
      this.statusEffectTickTimers.delete(debuff.type);
    }

    this.statusEffects = this.statusEffects.filter(e =>
      !DEBUFF_TYPES.includes(e.type)
    );

    // Reset visual tint
    this.updateVisualTint();
  }

  /**
   * Apply visual feedback for a status effect
   */
  private applyStatusEffectVisual(type: PlayerStatusEffect['type']): void {
    switch (type) {
      case 'burn':
        this.setTint(0xff8844); // Orange tint
        break;
      case 'poison':
        this.setTint(0x44ff44); // Green tint
        break;
      case 'shield':
        // Blue glow for shield is handled by glowSprite
        if (this.glowSprite) {
          this.glowSprite.setTint(0x4488ff);
        }
        break;
      case 'speed_boost':
        this.createSpeedTrailParticles();
        break;
      case 'attack_boost':
        this.setTint(0xff4444); // Red tint
        break;
    }
    this.updateVisualTint();
  }

  /**
   * Remove visual feedback for a status effect
   */
  private removeStatusEffectVisual(type: PlayerStatusEffect['type']): void {
    switch (type) {
      case 'speed_boost':
        const emitter = this.particleEmitters.get('speed_trail');
        if (emitter) {
          emitter.destroy();
          this.particleEmitters.delete('speed_trail');
        }
        break;
    }
    this.updateVisualTint();
  }

  /**
   * Update the visual tint based on all active status effects
   */
  private updateVisualTint(): void {
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

    // Update glow based on shield
    if (this.glowSprite) {
      if (this.hasShield()) {
        this.glowSprite.setTint(0x4488ff);
        this.glowSprite.setAlpha(0.4);
      } else if (this.hasStatusEffect('attack_boost')) {
        this.glowSprite.setTint(0xff4444);
        this.glowSprite.setAlpha(0.35);
      } else {
        this.glowSprite.setTint(0x66ccff);
        this.glowSprite.setAlpha(0.3);
      }
    }
  }

  /**
   * Create cyan trail particles for speed boost
   */
  private createSpeedTrailParticles(): void {
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
   * Get effective speed including status effect modifiers
   */
  getEffectiveSpeed(): number {
    let speed = this.stats.speed;

    // Apply slow effect
    if (this.hasStatusEffect('slow')) {
      const slowValue = this.getStatusEffectValue('slow');
      speed *= (1 - slowValue / 100);
    }

    // Apply speed boost effect
    if (this.hasStatusEffect('speed_boost')) {
      const boostValue = this.getStatusEffectValue('speed_boost');
      speed *= (1 + boostValue / 100);
    }

    return speed;
  }

  /**
   * Get effective attack including status effect modifiers
   */
  getEffectiveAttack(): number {
    let attack = this.stats.attack;

    // Apply attack boost effect
    if (this.hasStatusEffect('attack_boost')) {
      const boostValue = this.getStatusEffectValue('attack_boost');
      attack *= (1 + boostValue / 100);
    }

    return attack;
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
    const actualDamage = Math.max(1, finalDamage - this.stats.defense * 0.5);
    this.stats.currentHp = Math.max(0, this.stats.currentHp - actualDamage);
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

  heal(amount: number): void {
    const oldHp = this.stats.currentHp;
    this.stats.currentHp = Math.min(
      this.stats.maxHp,
      this.stats.currentHp + amount
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
    this.statusEffects = [];
    this.statusEffectTickTimers.clear();
    this.shieldValue = 0;
    this.isInvincible = false;
    this.initializeElementResistance();
    this.updateVisualTint();

    // Clean up particle emitters
    this.particleEmitters.forEach(emitter => emitter.destroy());
    this.particleEmitters.clear();
  }

  update(delta: number): void {
    // 更新技能冷却
    this.skillCooldowns.forEach((cooldown, skillId) => {
      if (cooldown > 0) {
        this.skillCooldowns.set(skillId, Math.max(0, cooldown - delta));
      }
    });

    // 更新状态效果
    this.updateStatusEffects(delta);

    // HP 回复（被动技能）
    const hpRegen = (this.stats as any).hpRegen || 0;
    if (hpRegen > 0) {
      const healAmount = hpRegen * (delta / 1000);
      this.stats.currentHp = Math.min(this.stats.maxHp, this.stats.currentHp + healAmount);
    }

    // 更新发光效果位置
    if (this.glowSprite) {
      this.glowSprite.setPosition(this.x, this.y);
      // 轻微的脉动效果
      this.glowSprite.setAlpha(0.2 + Math.sin(Date.now() / 300) * 0.1);
    }
  }

  destroy(): void {
    if (this.glowSprite) {
      this.glowSprite.destroy();
    }
    // Clean up particle emitters
    this.particleEmitters.forEach(emitter => emitter.destroy());
    this.particleEmitters.clear();
    super.destroy();
  }
}
