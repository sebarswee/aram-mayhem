import Phaser from 'phaser';
import { Element } from '@/types';

/**
 * Enemy projectile configuration
 */
export interface EnemyProjectileConfig {
  damage: number;
  speed: number;
  range: number;
  color: number;
  effect?: 'burn' | 'slow' | 'poison' | 'root';
  effectValue?: number;
  effectDuration?: number;
  element?: Element;
}

/**
 * Enemy projectile - fired by enemies at the player
 */
export class EnemyProjectile extends Phaser.Physics.Arcade.Sprite {
  public config: EnemyProjectileConfig;
  private startX: number;
  private startY: number;
  private traveledDistance: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, config: EnemyProjectileConfig) {
    super(scene, x, y, 'particle_glow');

    this.config = config;
    this.startX = x;
    this.startY = y;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Set appearance
    this.setTint(config.color);
    this.setScale(0.6);
    this.setDepth(40);

    // Set physics body
    this.body?.setSize(12, 12);
  }

  /**
   * Fire projectile towards a target
   */
  fire(targetX: number, targetY: number): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    this.setRotation(angle);

    const velocityX = Math.cos(angle) * this.config.speed;
    const velocityY = Math.sin(angle) * this.config.speed;
    this.setVelocity(velocityX, velocityY);
  }

  /**
   * Update - check range limit
   */
  update(_time: number, _delta: number): void {
    // Check if exceeded range
    this.traveledDistance = Phaser.Math.Distance.Between(
      this.startX, this.startY, this.x, this.y
    );

    if (this.traveledDistance >= this.config.range) {
      this.destroy();
    }
  }

  /**
   * Get damage value
   */
  getDamage(): number {
    return this.config.damage;
  }

  /**
   * Get effect configuration
   */
  getEffect(): { type: string; value: number; duration: number } | null {
    if (!this.config.effect) return null;
    return {
      type: this.config.effect,
      value: this.config.effectValue || 5,
      duration: this.config.effectDuration || 2000,
    };
  }

  /**
   * Get element
   */
  getElement(): Element | undefined {
    return this.config.element;
  }
}