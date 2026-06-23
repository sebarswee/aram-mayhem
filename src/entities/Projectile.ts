import Phaser from 'phaser';
import { Skill, SkillEffect } from '@/types';
import { PROJECTILE_LIFETIME } from '@/config/balance.config';

export interface ProjectileConfig {
  skill: Skill;
  damage: number;
  speed: number;
  range: number;
  isFromPlayer: boolean;
  color: number;
}

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  public config: ProjectileConfig;
  private lifetime: number = 0;
  private startXY: { x: number; y: number };

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: ProjectileConfig
  ) {
    super(scene, x, y, '__DEFAULT');

    this.config = config;
    this.startXY = { x, y };

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 设置碰撞体
    this.body?.setSize(16, 16);

    // 绘制占位符
    this.drawPlaceholder(config.color);

    // 设置存活时间
    this.lifetime = PROJECTILE_LIFETIME;
  }

  private drawPlaceholder(color: number): void {
    const key = `projectile_${color}`;
    if (!this.scene.textures.exists(key)) {
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(color, 1);
      graphics.fillCircle(8, 8, 8);
      graphics.generateTexture(key, 16, 16);
      graphics.destroy();
    }
    this.setTexture(key);
  }

  fire(angle: number): void {
    const velocityX = Math.cos(angle) * this.config.speed;
    const velocityY = Math.sin(angle) * this.config.speed;
    this.setVelocity(velocityX, velocityY);
    this.setRotation(angle);
  }

  update(delta: number): void {
    // 检查存活时间
    this.lifetime -= delta;
    if (this.lifetime <= 0) {
      this.destroy();
      return;
    }

    // 检查射程
    const distance = Phaser.Math.Distance.Between(
      this.startXY.x,
      this.startXY.y,
      this.x,
      this.y
    );
    if (distance > this.config.range) {
      this.destroy();
    }
  }

  getDamage(): number {
    return this.config.damage;
  }

  getEffects(): SkillEffect[] {
    return this.config.skill.effects;
  }

  isPlayerProjectile(): boolean {
    return this.config.isFromPlayer;
  }
}
