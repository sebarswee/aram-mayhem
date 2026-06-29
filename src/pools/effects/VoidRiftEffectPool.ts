import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../VisualEffectPool';

/**
 * 虚空裂隙效果配置
 */
export interface VoidRiftEffectConfig extends VisualEffectConfig {
  /** 裂隙半径 */
  radius: number;
  /** 持续时间（毫秒） */
  duration: number;
  /** 裂隙核心配置 */
  riftConfigs?: Array<{
    radius: number;
    color: number;
    alpha: number;
  }>;
  /** 虚空环配置 */
  ringConfigs?: Array<{
    lineWidth: number;
    color: number;
    alpha: number;
    radiusMultiplier: number;
    rotationDuration: number;
    direction: 1 | -1;
  }>;
  /** 粒子配置 */
  particleConfig?: {
    speedMin: number;
    speedMax: number;
    lifespan: number;
    frequency: number;
    quantity: number;
    colors: number[];
  };
}

/**
 * 虚空裂隙效果对象池
 *
 * 管理 VoidRift 技能的视觉效果复用
 *
 * 池化元素：
 * - 3 层虚空裂隙核心圆（外层、中层、内层）
 * - 虚空环容器内的 5 个旋转环 Graphics
 * - 吸入粒子发射器
 * - **共 5 个无限循环 tween**（必须正确停止）:
 *   - 5 个旋转 tween（每个虚空环一个）
 *
 * **重要**: 此效果包含 5 个无限循环的 tween，必须在释放时正确停止
 */
export class VoidRiftEffectPool extends VisualEffectPool<VoidRiftEffectConfig> {
  /** 默认虚空裂隙核心配置（3 层） */
  private static readonly DEFAULT_RIFT_CONFIGS = [
    { radius: 50, color: 0x4400aa, alpha: 0.50 },
    { radius: 35, color: 0x6600cc, alpha: 0.70 },
    { radius: 20, color: 0x8800ff, alpha: 0.90 },
  ];

  /** 默认虚空环配置（5 个） */
  private static readonly DEFAULT_RING_CONFIGS = [
    { lineWidth: 4.0, color: 0x8800ff, alpha: 0.45, radiusMultiplier: 0.25, rotationDuration: 700, direction: 1 as const },
    { lineWidth: 3.5, color: 0x8800ff, alpha: 0.39, radiusMultiplier: 0.45, rotationDuration: 850, direction: -1 as const },
    { lineWidth: 3.0, color: 0x8800ff, alpha: 0.33, radiusMultiplier: 0.65, rotationDuration: 1000, direction: 1 as const },
    { lineWidth: 2.5, color: 0x8800ff, alpha: 0.27, radiusMultiplier: 0.85, rotationDuration: 1150, direction: -1 as const },
    { lineWidth: 2.0, color: 0x8800ff, alpha: 0.21, radiusMultiplier: 1.05, rotationDuration: 1300, direction: 1 as const },
  ];

  /** 默认粒子配置 */
  private static readonly DEFAULT_PARTICLE_CONFIG = {
    speedMin: 40,
    speedMax: 100,
    lifespan: 700,
    frequency: 45,
    quantity: 2,
    colors: [0x6600aa, 0x8800cc, 0xaa00ff],
  };

  constructor(scene: Phaser.Scene, initialSize: number = 3) {
    // 第一步：先跳过父类的自动预热
    super(
      scene,
      // 使用延迟绑定模式
      () => (this as any)._createFn(),
      (obj, config) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'VoidRiftEffectPool', skipInitialWarmUp: true }
    );

    // 第二步：设置实际的创建和重置函数
    (this as any)._createFn = this.createVoidRiftEffect.bind(this);
    (this as any)._resetFn = this.resetVoidRiftEffect.bind(this);

    // 第三步：现在可以安全地预热池
    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建虚空裂隙效果容器
   */
  private createVoidRiftEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建虚空环容器
    const voidRings = this.scene.add.container(0, 0);
    voidRings.setName('void_rings_container');
    container.add(voidRings);

    // 预创建 5 个旋转环 Graphics
    for (let i = 0; i < 5; i++) {
      const ring = this.scene.add.graphics();
      ring.setName(`void_ring_${i}`);
      voidRings.add(ring);
    }

    // 预创建 3 层虚空裂隙核心圆
    for (let i = 0; i < 3; i++) {
      const rift = this.scene.add.circle(0, 0, 50, 0x6600cc, 0.6);
      rift.setName(`rift_core_${i}`);
      container.add(rift);
    }

    // 预创建吸入粒子发射器
    const pullParticles = this.scene.add.particles(0, 0, 'particle_glow', {
      speed: { min: 40, max: 100 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.45, end: 0 },
      alpha: { start: 0.55, end: 0 },
      tint: [0x6600aa, 0x8800cc, 0xaa00ff],
      lifespan: 700,
      frequency: 45,
      quantity: 2,
      emitting: false, // 初始不发射
    });
    pullParticles.setName('pull_particles');
    container.add(pullParticles);

    container.setDepth(17); // 基础深度
    return container;
  }

  /**
   * 重置并配置虚空裂隙效果
   */
  private resetVoidRiftEffect(
    container: Phaser.GameObjects.Container,
    config: VoidRiftEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);

    const radius = config.radius;
    const riftConfigs = config.riftConfigs ?? VoidRiftEffectPool.DEFAULT_RIFT_CONFIGS;
    const ringConfigs = config.ringConfigs ?? VoidRiftEffectPool.DEFAULT_RING_CONFIGS;
    const particleConfig = config.particleConfig ?? VoidRiftEffectPool.DEFAULT_PARTICLE_CONFIG;

    // 重置虚空环容器
    const voidRingsContainer = container.getByName('void_rings_container') as Phaser.GameObjects.Container;
    if (voidRingsContainer) {
      voidRingsContainer.setPosition(0, 0);
      voidRingsContainer.setDepth(18);

      // 重置 5 个旋转环并创建旋转 tween（5 个无限 tween）
      ringConfigs.forEach((ringConfig, i) => {
        const ring = voidRingsContainer.getByName(`void_ring_${i}`) as Phaser.GameObjects.Graphics;
        if (ring) {
          // 清除之前的绘制
          ring.clear();

          // 设置线条样式
          ring.lineStyle(ringConfig.lineWidth, ringConfig.color, ringConfig.alpha);

          // 绘制圆形环
          const ringRadius = radius * ringConfig.radiusMultiplier;
          ring.strokeCircle(0, 0, ringRadius);

          // 重置变换
          ring.setPosition(0, 0);
          ring.setAngle(0);
          ring.setAlpha(ringConfig.alpha);

          // 创建无限旋转 tween
          const rotationTween = this.scene.tweens.add({
            targets: ring,
            angle: 360 * ringConfig.direction,
            duration: ringConfig.rotationDuration,
            repeat: -1, // 无限循环
          });

          // 托管 tween 以便正确清理
          this.addManagedTween(container, rotationTween, {
            autoStop: true,
            tag: `rotation_ring_${i}`,
          });
        }
      });
    }

    // 重置 3 层虚空裂隙核心
    riftConfigs.forEach((riftConfig, i) => {
      const rift = container.getByName(`rift_core_${i}`) as Phaser.GameObjects.Arc;
      if (rift) {
        rift.setRadius(riftConfig.radius);
        rift.setFillStyle(riftConfig.color, riftConfig.alpha);
        rift.setPosition(0, 0);
        rift.setScale(1, 1);
        rift.setAlpha(riftConfig.alpha);
        rift.setDepth(20 + i);
      }
    });

    // 重置吸入粒子发射器
    const pullParticlesObj = container.getByName('pull_particles');
    if (pullParticlesObj && pullParticlesObj instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
      const pullParticles = pullParticlesObj as Phaser.GameObjects.Particles.ParticleEmitter;
      // 更新粒子配置
      (pullParticles as any).speed = { min: particleConfig.speedMin, max: particleConfig.speedMax };
      (pullParticles as any).lifespan = particleConfig.lifespan;
      (pullParticles as any).frequency = particleConfig.frequency;
      (pullParticles as any).quantity = particleConfig.quantity;
      (pullParticles as any).tint = particleConfig.colors;
      pullParticles.setPosition(0, 0);
      pullParticles.setDepth(17);
      pullParticles.start();

      // 托管粒子发射器
      this.addManagedParticle(container, pullParticles, {
        autoStop: true,
        autoDestroy: false, // 不销毁，因为要复用
        tag: 'pull_particles',
      });
    }

    // 设置自动回收
    if (config.duration && config.duration > 0) {
      this.setEffectDuration(container, config.duration);
    }
  }

  /**
   * 停用效果时的额外清理
   *
   * **重要**: 必须正确停止所有 5 个无限旋转 tween
   */
  protected deactivate(obj: Phaser.GameObjects.Container): void {
    // 停止所有托管的 tweens（包括 5 个旋转 tween）
    const tweens = this.managedTweens.get(obj);
    if (tweens) {
      tweens.forEach(managed => {
        if (managed.autoStop && managed.tween) {
          if (managed.tween.isPlaying()) {
            managed.tween.stop();
          }
          this.scene.tweens.remove(managed.tween);
        }
      });
    }

    // 停止粒子发射
    const pullParticlesObj = obj.getByName('pull_particles');
    if (pullParticlesObj && pullParticlesObj instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
      const pullParticles = pullParticlesObj as Phaser.GameObjects.Particles.ParticleEmitter;
      pullParticles.stop();
    }

    // 清除所有 Graphics 的绘制
    const voidRingsContainer = obj.getByName('void_rings_container') as Phaser.GameObjects.Container;
    if (voidRingsContainer) {
      for (let i = 0; i < 5; i++) {
        const ring = voidRingsContainer.getByName(`void_ring_${i}`) as Phaser.GameObjects.Graphics;
        if (ring) {
          ring.clear();
        }
      }
    }

    // 调用父类方法进行基础清理
    super.deactivate(obj);
  }

  /**
   * 获取旋转 tween 数量（用于调试）
   */
  getRotationTweenCount(container: Phaser.GameObjects.Container): number {
    const tweens = this.managedTweens.get(container);
    if (!tweens) return 0;
    return tweens.filter(t => t.tag?.startsWith('rotation_ring_')).length;
  }

  /**
   * 获取总 tween 数量（用于调试）
   */
  getTotalTweenCount(container: Phaser.GameObjects.Container): number {
    const tweens = this.managedTweens.get(container);
    return tweens ? tweens.length : 0;
  }

  /**
   * 验证所有 5 个旋转 tween 是否存在（用于测试）
   */
  validateAllRotationTweensExist(container: Phaser.GameObjects.Container): boolean {
    const tweens = this.managedTweens.get(container);
    if (!tweens) return false;

    for (let i = 0; i < 5; i++) {
      const found = tweens.some(t => t.tag === `rotation_ring_${i}`);
      if (!found) return false;
    }

    return true;
  }

  /**
   * 获取详细的 tween 状态（用于调试）
   */
  getDetailedTweenStatus(container: Phaser.GameObjects.Container): {
    rotationTweens: { tag: string; exists: boolean }[];
    total: number;
  } {
    const tweens = this.managedTweens.get(container);
    const tweenTags = tweens ? tweens.map(t => t.tag) : [];

    const rotationTweens = [0, 1, 2, 3, 4].map(i => ({
      tag: `rotation_ring_${i}`,
      exists: tweenTags.includes(`rotation_ring_${i}`),
    }));

    return {
      rotationTweens,
      total: tweenTags.length,
    };
  }
}
