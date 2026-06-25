import Phaser from 'phaser';
import { Skill, SkillEffect } from '@/types';
import { PROJECTILE_LIFETIME } from '@/config/balance.config';
import { specialBehaviorRegistry } from '@/systems/SpecialBehaviorRegistry';
import { Enemy } from '@/entities/Enemy';
import { projectileVisualRegistry, elementDeathRegistry } from '@/strategies';

// 元素到投射物纹理的映射（8元素系统）
const ELEMENT_TEXTURE_MAP: Record<string, string> = {
  fire: 'projectile_fire',
  water: 'projectile_water',
  ice: 'projectile_ice',
  lightning: 'projectile_lightning',
  holy: 'projectile_holy',
  shadow: 'projectile_shadow',
  grass: 'projectile_grass',
  earth: 'projectile_earth',
  physical: 'projectile_holy', // fallback for physical attacks
};

export interface ProjectileConfig {
  skill: Skill;
  damage: number;
  speed: number;
  range: number;
  isFromPlayer: boolean;
  color: number;
  creationTime?: number;  // 创建时间，用于碰撞保护（可选，会在构造函数中设置）
  // 连锁信息
  chainRemaining?: number;      // 剩余连锁次数
  chainRange?: number;          // 连锁范围
  chainDamageDecay?: number;    // 伤害衰减
  previousTargets?: Set<string>; // 已打击的目标ID
  // 穿透信息
  pierceCount?: number;         // 剩余穿透次数
  hitEnemies?: Set<string>;     // 已命中的敌人ID
  // 特殊行为
  isHoming?: boolean;           // 是否追踪
  homingTarget?: Enemy | null;  // 追踪目标
  isInstant?: boolean;          // 是否瞬发
  instantHitTarget?: { x: number; y: number } | null; // 瞬发目标位置
  splitCount?: number;          // 分裂数量
  explodeOnHit?: boolean;       // 命中时爆炸
  explodeRadius?: number;       // 爆炸半径
  explodeDamage?: number;       // 爆炸伤害比例
  shatterMultiplier?: number;   // 破碎伤害倍率
  leaveSlowField?: boolean;     // 留下减速区域
  slowFieldValue?: number;      // 减速值
  slowFieldDuration?: number;   // 减速持续时间
}

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  public config: ProjectileConfig;
  private lifetime: number;
  private startXY: { x: number; y: number };
  private trailParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private lastTime: number = 0;  // 记录上一帧的时间

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: ProjectileConfig
  ) {
    // 检查纹理是否存在
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
    this.lastTime = 0;  // 初始化为 0，第一次 update 时会设置

    // 根据技能ID定制外观
    this.applySkillSpecificVisual(element);

    // 创建尾迹粒子
    this.createTrailParticles(element);
  }

  /**
   * 根据技能ID应用特定视觉效果
   */
  private applySkillSpecificVisual(element: string): void {
    const skillId = this.config.skill.id;

    // 使用策略模式
    const context = {
      projectile: this,
      scene: this.scene,
      element,
    };

    if (projectileVisualRegistry.hasStrategy(skillId)) {
      projectileVisualRegistry.apply(skillId, context);
    }
  }

  private createTrailParticles(element: string): void {
    // 根据元素选择粒子纹理
    const particleTexture = `particle_${element}` as string;
    const texture = this.scene.textures.exists(particleTexture) ? particleTexture : 'particle_glow';

    // 元素特定的粒子效果配置
    const elementConfig = this.getElementParticleConfig(element);

    this.trailParticles = this.scene.add.particles(this.x, this.y, texture, {
      speed: elementConfig.speed,
      scale: elementConfig.scale,
      alpha: elementConfig.alpha,
      tint: this.config.color,
      lifespan: elementConfig.lifespan,
      frequency: elementConfig.frequency,
      quantity: elementConfig.quantity,
      rotate: elementConfig.rotate,
    });
    this.trailParticles.setDepth(39);
  }

  /**
   * 获取元素特定的粒子效果配置
   */
  private getElementParticleConfig(element: string): {
    speed: { min: number; max: number };
    scale: { start: number; end: number };
    alpha: { start: number; end: number };
    lifespan: number;
    frequency: number;
    quantity: number;
    rotate?: { min: number; max: number };
  } {
    const configs: Record<string, ReturnType<typeof this.getElementParticleConfig>> = {
      // 火焰：快速散开的火星
      fire: {
        speed: { min: 30, max: 60 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 250,
        frequency: 25,
        quantity: 2,
      },
      // 水：缓慢扩散的水滴
      water: {
        speed: { min: 15, max: 30 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 0.6, end: 0 },
        lifespan: 300,
        frequency: 35,
        quantity: 1,
      },
      // 冰：闪烁的冰晶
      ice: {
        speed: { min: 10, max: 25 },
        scale: { start: 0.4, end: 0 },
        alpha: { start: 0.9, end: 0 },
        lifespan: 200,
        frequency: 30,
        quantity: 1,
      },
      // 闪电：快速闪烁的电弧
      lightning: {
        speed: { min: 50, max: 100 },
        scale: { start: 0.3, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 150,
        frequency: 20,
        quantity: 3,
        rotate: { min: 0, max: 360 },
      },
      // 神圣：金光闪烁
      holy: {
        speed: { min: 20, max: 40 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 250,
        frequency: 30,
        quantity: 2,
      },
      // 暗影：紫色雾气
      shadow: {
        speed: { min: 10, max: 20 },
        scale: { start: 0.7, end: 0 },
        alpha: { start: 0.5, end: 0 },
        lifespan: 350,
        frequency: 40,
        quantity: 1,
      },
      // 草：飘落的叶片
      grass: {
        speed: { min: 15, max: 35 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 0.7, end: 0 },
        lifespan: 300,
        frequency: 35,
        quantity: 1,
        rotate: { min: -180, max: 180 },
      },
      // 土：飞溅的碎石
      earth: {
        speed: { min: 25, max: 50 },
        scale: { start: 0.4, end: 0 },
        alpha: { start: 0.7, end: 0 },
        lifespan: 250,
        frequency: 35,
        quantity: 2,
      },
    };

    return configs[element] || {
      speed: { min: 20, max: 40 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 200,
      frequency: 30,
      quantity: 1,
    };
  }

  fire(angle: number): void {
    const velocityX = Math.cos(angle) * this.config.speed;
    const velocityY = Math.sin(angle) * this.config.speed;
    this.setVelocity(velocityX, velocityY);
    this.setRotation(angle);
  }

  update(_time: number): void {
    // 注意：_time 是游戏开始以来的总时间，不是 delta
    // 我们需要自己计算 delta
    const currentTime = _time;
    const delta = this.lastTime === 0 ? 0 : currentTime - this.lastTime;
    this.lastTime = currentTime;

    // 更新尾迹粒子位置
    if (this.trailParticles) {
      this.trailParticles.setPosition(this.x, this.y);
    }

    // 执行特殊行为（如追踪）
    if (this.config.isHoming) {
      specialBehaviorRegistry.updateProjectile(this, this.scene);
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
    // 根据元素类型创建不同的死亡效果
    this.createElementDeathEffect();

    if (this.trailParticles) {
      this.trailParticles.destroy();
    }
    super.destroy();
  }

  /**
   * 创建元素死亡效果
   */
  private createElementDeathEffect(): void {
    const element = this.config.skill.elements[0] || 'fire';

    // 使用策略模式
    const context = {
      x: this.x,
      y: this.y,
      scene: this.scene,
      damage: this.config.damage,
    };

    if (elementDeathRegistry.hasStrategy(element)) {
      elementDeathRegistry.create(element, context);
    }
  }
}
