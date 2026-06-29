import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../../VisualEffectPool';

/**
 * 投射物拖尾效果配置
 */
export interface ProjectileTrailConfig extends VisualEffectConfig {
  /** 粒子颜色数组 */
  colors: number[];
  /** 粒子速度范围 */
  speed?: { min: number; max: number };
  /** 粒子大小范围 */
  scale?: { start: number; end: number };
  /** 粒子生命周期 */
  lifespan?: number;
  /** 发射频率 */
  frequency?: number;
  /** 每次发射数量 */
  quantity?: number;
  /** 纹理键 */
  texture?: string;
}

/**
 * 投射物拖尾效果对象池
 *
 * 管理投射物拖尾粒子效果的复用
 * - 高频率使用（每次投射物都需要）
 * - 粒子发射器管理
 * - 支持多种颜色配置
 *
 * 使用频率：极高（所有投射物都需要）
 */
export class ProjectileTrailPool extends VisualEffectPool<ProjectileTrailConfig> {
  constructor(scene: Phaser.Scene, initialSize: number = 10) {
    super(
      scene,
      () => (this as any)._createFn(),
      (obj, config: ProjectileTrailConfig) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'ProjectileTrailPool', skipInitialWarmUp: true }
    );

    (this as any)._createFn = this.createTrailEffect.bind(this);
    (this as any)._resetFn = this.resetTrailEffect.bind(this);

    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建拖尾效果容器
   */
  private createTrailEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建粒子发射器占位
    // 实际粒子发射器在 reset 时创建，因为配置需要动态
    container.setDepth(39);
    return container;
  }

  /**
   * 重置并配置拖尾效果
   */
  private resetTrailEffect(
    container: Phaser.GameObjects.Container,
    config: ProjectileTrailConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);

    // 清理旧的粒子发射器
    container.each((child: Phaser.GameObjects.GameObject) => {
      if ('destroy' in child) {
        (child as any).destroy();
      }
    });
    container.removeAll(true);

    // 创建新的粒子发射器
    const emitter = this.scene.add.particles(0, 0, config.texture || 'particle_glow', {
      speed: config.speed || { min: 20, max: 60 },
      angle: { min: 160, max: 200 },
      scale: config.scale || { start: 0.5, end: 0 },
      alpha: { start: 0.7, end: 0 },
      tint: config.colors,
      lifespan: config.lifespan || 300,
      frequency: config.frequency || 30,
      quantity: config.quantity || 2,
    });

    container.add(emitter);

    // 托管粒子发射器
    this.addManagedParticle(container, emitter, {
      autoStop: true,
      autoDestroy: true,
      tag: 'trail',
    });

    // 设置自动回收（拖尾效果跟随投射物生命周期）
    const duration = config.duration || 5000;
    this.setEffectDuration(container, duration);
  }

  /**
   * 停用效果时的额外清理
   */
  protected deactivate(obj: Phaser.GameObjects.Container): void {
    // 清理所有子对象（粒子发射器）
    obj.each((child: Phaser.GameObjects.GameObject) => {
      if ('stop' in child && typeof (child as any).stop === 'function') {
        (child as any).stop();
      }
    });

    // 调用父类方法进行基础清理
    super.deactivate(obj);
  }

  /**
   * 快速获取火元素拖尾
   */
  acquireFireTrail(x: number, y: number, duration?: number): Phaser.GameObjects.Container | null {
    return this.acquireWithConfig({
      x,
      y,
      colors: [0xff4400, 0xff6600, 0xffaa00, 0xffff00],
      texture: 'particle_fire_spark',
      duration: duration || 5000,
    });
  }

  /**
   * 快速获取冰元素拖尾
   */
  acquireIceTrail(x: number, y: number, duration?: number): Phaser.GameObjects.Container | null {
    return this.acquireWithConfig({
      x,
      y,
      colors: [0x88ddff, 0xaaeeff, 0xffffff],
      texture: 'particle_ice_crystal',
      speed: { min: 15, max: 40 },
      duration: duration || 5000,
    });
  }

  /**
   * 快速获取闪电元素拖尾
   */
  acquireLightningTrail(x: number, y: number, duration?: number): Phaser.GameObjects.Container | null {
    return this.acquireWithConfig({
      x,
      y,
      colors: [0xffff00, 0xffffff, 0xffffaa],
      texture: 'particle_lightning_arc',
      speed: { min: 30, max: 80 },
      scale: { start: 0.4, end: 0 },
      lifespan: 200,
      frequency: 20,
      quantity: 3,
      duration: duration || 5000,
    });
  }

  /**
   * 快速获取水元素拖尾
   */
  acquireWaterTrail(x: number, y: number, duration?: number): Phaser.GameObjects.Container | null {
    return this.acquireWithConfig({
      x,
      y,
      colors: [0x4488ff, 0x66aaff],
      texture: 'particle_glow',
      speed: { min: 10, max: 30 },
      scale: { start: 0.4, end: 0 },
      lifespan: 400,
      frequency: 40,
      quantity: 1,
      duration: duration || 5000,
    });
  }

  /**
   * 快速获取暗影元素拖尾
   */
  acquireShadowTrail(x: number, y: number, duration?: number): Phaser.GameObjects.Container | null {
    return this.acquireWithConfig({
      x,
      y,
      colors: [0x8800ff, 0x6600cc, 0xaa44ff],
      texture: 'particle_glow',
      speed: { min: 10, max: 40 },
      scale: { start: 0.5, end: 0 },
      lifespan: 400,
      frequency: 35,
      quantity: 2,
      duration: duration || 5000,
    });
  }
}
