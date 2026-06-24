import Phaser from 'phaser';
import { PlayerStats, Skill, Element } from '@/types';
import { INITIAL_PLAYER_STATS } from '@/config/balance.config';

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
 * Debuff types for identification
 */
const DEBUFF_TYPES = ['burn', 'poison', 'slow', 'root'];

export class Player extends Phaser.Physics.Arcade.Sprite {
  public stats: PlayerStats;
  public skills: Skill[] = [];
  public skillCooldowns: Map<string, number> = new Map();
  private lastDamageTime: number = 0;
  private glowSprite: Phaser.GameObjects.Sprite | null = null;
  public isInvincible: boolean = false;
  private shieldValue: number = 0;

  // Status effects system
  public statusEffects: PlayerStatusEffect[] = [];
  private statusEffectTickTimers: Map<string, number> = new Map();

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

    // 先扣护盾
    if (this.shieldValue > 0) {
      if (this.shieldValue >= amount) {
        this.shieldValue -= amount;
        this.updateVisualTint();
        return false;
      } else {
        amount -= this.shieldValue;
        this.shieldValue = 0;
        this.updateVisualTint();
      }
    }

    // 计算实际伤害(考虑防御)
    const actualDamage = Math.max(1, amount - this.stats.defense * 0.5);
    this.stats.currentHp = Math.max(0, this.stats.currentHp - actualDamage);
    this.lastDamageTime = now;

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
