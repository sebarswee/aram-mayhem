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
  creationTime: number;  // 创建时间，用于碰撞保护
  // 连锁信息
  chainRemaining?: number;      // 剩余连锁次数
  chainRange?: number;          // 连锁范围
  chainDamageDecay?: number;    // 伤害衰减
  previousTargets?: Set<string>; // 已打击的目标ID
  // 穿透信息
  pierceCount?: number;         // 剩余穿透次数
  hitEnemies?: Set<string>;     // 已命中的敌人ID
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
    this.config.creationTime = Date.now();  // 记录创建时间
    this.startXY = { x, y };

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 确保物理体被正确激活
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setSize(16, 16);
      body.setEnable(true);
    }

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
    // 火球术爆炸效果
    if (this.config.skill.id === 'fireball') {
      this.createFireballExplosion();
    }

    if (this.trailParticles) {
      this.trailParticles.destroy();
    }
    super.destroy();
  }

  /**
   * 创建火球爆炸效果 - 范围伤害
   */
  private createFireballExplosion(): void {
    const explosionRadius = 60;

    // 爆炸视觉效果
    const explosion = this.scene.add.circle(this.x, this.y, 30, 0xff8800, 0.8);
    explosion.setDepth(41);

    const shockwave = this.scene.add.circle(this.x, this.y, 50, 0xff4400, 0.4);
    shockwave.setDepth(40);

    // 爆炸粒子
    const particles = this.scene.add.particles(this.x, this.y, 'particle_fire', {
      speed: { min: 100, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 300,
      quantity: 15,
      emitting: false,
    });
    particles.explode();
    particles.setDepth(42);

    // 动画
    this.scene.tweens.add({
      targets: [explosion, shockwave],
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 250,
      onComplete: () => {
        explosion.destroy();
        shockwave.destroy();
        particles.destroy();
      },
    });

    // 爆炸范围内敌人造成伤害
    const bodies = this.scene.physics.overlapCirc(
      this.x,
      this.y,
      explosionRadius
    ) as Phaser.Physics.Arcade.Body[];

    for (const body of bodies) {
      const enemy = body.gameObject;
      // 只对敌人类型造成伤害
      if (enemy && enemy.active && 'takeDamage' in enemy && 'config' in enemy) {
        const explosionDamage = Math.floor(this.config.damage * 0.5); // 爆炸造成50%伤害
        (enemy as any).takeDamage(explosionDamage);
      }
    }
  }
}
