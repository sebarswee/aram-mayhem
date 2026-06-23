import Phaser from 'phaser';
import { Skill, SkillEffect } from '@/types';
import { PROJECTILE_LIFETIME } from '@/config/balance.config';

// 元素到投射物纹理的映射
const ELEMENT_TEXTURE_MAP: Record<string, string> = {
  fire: 'projectile_fire',
  ice: 'projectile_ice',
  lightning: 'projectile_lightning',
  shadow: 'projectile_shadow',
  holy: 'projectile_holy',
  physical: 'projectile_holy',
};

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
  private trailParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: ProjectileConfig
  ) {
    // 根据元素选择纹理
    const element = config.skill.elements[0] || 'fire';
    const textureKey = ELEMENT_TEXTURE_MAP[element] || 'projectile_fire';

    super(scene, x, y, textureKey);

    this.config = config;
    this.startXY = { x, y };

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 设置碰撞体
    this.body?.setSize(16, 16);

    // 设置深度
    this.setDepth(40);

    // 设置存活时间
    this.lifetime = PROJECTILE_LIFETIME;

    // 创建尾迹粒子
    this.createTrailParticles(element);
  }

  private createTrailParticles(element: string): void {
    // 根据元素选择粒子纹理
    const particleTexture = `particle_${element}` as string;
    const texture = this.scene.textures.exists(particleTexture) ? particleTexture : 'particle_glow';

    this.trailParticles = this.scene.add.particles(this.x, this.y, texture, {
      speed: 20,
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: this.config.color,
      lifespan: 200,
      frequency: 30,
      quantity: 1,
    });
    this.trailParticles.setDepth(39);
  }

  fire(angle: number): void {
    const velocityX = Math.cos(angle) * this.config.speed;
    const velocityY = Math.sin(angle) * this.config.speed;
    this.setVelocity(velocityX, velocityY);
    this.setRotation(angle);
  }

  update(delta: number): void {
    // 更新尾迹粒子位置
    if (this.trailParticles) {
      this.trailParticles.setPosition(this.x, this.y);
    }

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

  destroy(): void {
    if (this.trailParticles) {
      this.trailParticles.destroy();
    }
    super.destroy();
  }
}
