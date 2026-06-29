import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../VisualEffectPool';

/**
 * 黑洞效果配置
 */
export interface BlackHoleEffectConfig extends VisualEffectConfig {
  /** 黑洞半径 */
  radius: number;
  /** 持续时间（毫秒） */
  duration: number;
  /** 黑洞核心配置 */
  coreConfigs?: Array<{
    radius: number;
    color: number;
    alpha: number;
  }>;
  /** 引力环配置 */
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
 * 黑洞效果对象池
 *
 * 管理 BlackHole 技能的视觉效果复用
 *
 * 池化元素：
 * - 3 层黑洞核心圆（外层、中层、内层）
 * - 引力环容器内的 6 个旋转环 Graphics
 * - 吸入粒子发射器
 * - **共 6 个无限循环 tween**（必须正确停止）:
 *   - 6 个旋转 tween（每个引力环一个）
 *
 * **重要**: 此效果包含 6 个无限循环的 tween，必须在释放时正确停止
 */
export class BlackHoleEffectPool extends VisualEffectPool<BlackHoleEffectConfig> {
  /** 默认黑洞核心配置（3 层） */
  private static readonly DEFAULT_CORE_CONFIGS = [
    { radius: 55, color: 0x220066, alpha: 0.60 },
    { radius: 40, color: 0x330088, alpha: 0.75 },
    { radius: 25, color: 0x4400aa, alpha: 0.90 },
  ];

  /** 默认引力环配置（6 个） */
  private static readonly DEFAULT_RING_CONFIGS = [
    { lineWidth: 4.0, color: 0x6600cc, alpha: 0.40, radiusMultiplier: 0.20, rotationDuration: 600, direction: 1 as const },
    { lineWidth: 3.5, color: 0x6600cc, alpha: 0.35, radiusMultiplier: 0.35, rotationDuration: 700, direction: -1 as const },
    { lineWidth: 3.0, color: 0x6600cc, alpha: 0.30, radiusMultiplier: 0.50, rotationDuration: 800, direction: 1 as const },
    { lineWidth: 2.5, color: 0x6600cc, alpha: 0.25, radiusMultiplier: 0.65, rotationDuration: 900, direction: -1 as const },
    { lineWidth: 2.0, color: 0x6600cc, alpha: 0.20, radiusMultiplier: 0.80, rotationDuration: 1000, direction: 1 as const },
    { lineWidth: 1.5, color: 0x6600cc, alpha: 0.15, radiusMultiplier: 0.95, rotationDuration: 1100, direction: -1 as const },
  ];

  /** 默认粒子配置 */
  private static readonly DEFAULT_PARTICLE_CONFIG = {
    speedMin: 50,
    speedMax: 120,
    lifespan: 550,
    frequency: 35,
    quantity: 2,
    colors: [0x6600cc, 0x8800ee, 0xaa00ff],
  };

  constructor(scene: Phaser.Scene, initialSize: number = 3) {
    // 第一步：先跳过父类的自动预热
    super(
      scene,
      // 使用延迟绑定模式
      () => (this as any)._createFn(),
      (obj, config) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'BlackHoleEffectPool', skipInitialWarmUp: true }
    );

    // 第二步：设置实际的创建和重置函数
    (this as any)._createFn = this.createBlackHoleEffect.bind(this);
    (this as any)._resetFn = this.resetBlackHoleEffect.bind(this);

    // 第三步：现在可以安全地预热池
    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建黑洞效果容器
   */
  private createBlackHoleEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建引力环容器
    const gravityRings = this.scene.add.container(0, 0);
    gravityRings.setName('gravity_rings_container');
    container.add(gravityRings);

    // 预创建 6 个旋转环 Graphics
    for (let i = 0; i < 6; i++) {
      const ring = this.scene.add.graphics();
      ring.setName(`gravity_ring_${i}`);
      gravityRings.add(ring);
    }

    // 预创建 3 层黑洞核心圆
    for (let i = 0; i < 3; i++) {
      const core = this.scene.add.circle(0, 0, 50, 0x330088, 0.7);
      core.setName(`blackhole_core_${i}`);
      container.add(core);
    }

    // 预创建吸入粒子发射器
    const pullParticles = this.scene.add.particles(0, 0, 'particle_glow', {
      speed: { min: 50, max: 120 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: [0x6600cc, 0x8800ee, 0xaa00ff],
      lifespan: 550,
      frequency: 35,
      quantity: 2,
      emitting: false, // 初始不发射
    });
    pullParticles.setName('pull_particles');
    container.add(pullParticles);

    container.setDepth(17); // 基础深度
    return container;
  }

  /**
   * 重置并配置黑洞效果
   */
  private resetBlackHoleEffect(
    container: Phaser.GameObjects.Container,
    config: BlackHoleEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);

    const radius = config.radius;
    const coreConfigs = config.coreConfigs ?? BlackHoleEffectPool.DEFAULT_CORE_CONFIGS;
    const ringConfigs = config.ringConfigs ?? BlackHoleEffectPool.DEFAULT_RING_CONFIGS;
    const particleConfig = config.particleConfig ?? BlackHoleEffectPool.DEFAULT_PARTICLE_CONFIG;

    // 重置引力环容器
    const gravityRingsContainer = container.getByName('gravity_rings_container') as Phaser.GameObjects.Container;
    if (gravityRingsContainer) {
      gravityRingsContainer.setPosition(0, 0);
      gravityRingsContainer.setDepth(18);

      // 重置 6 个旋转环并创建旋转 tween（6 个无限 tween）
      ringConfigs.forEach((ringConfig, i) => {
        const ring = gravityRingsContainer.getByName(`gravity_ring_${i}`) as Phaser.GameObjects.Graphics;
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

    // 重置 3 层黑洞核心
    coreConfigs.forEach((coreConfig, i) => {
      const core = container.getByName(`blackhole_core_${i}`) as Phaser.GameObjects.Arc;
      if (core) {
        core.setRadius(coreConfig.radius);
        core.setFillStyle(coreConfig.color, coreConfig.alpha);
        core.setPosition(0, 0);
        core.setScale(1, 1);
        core.setAlpha(coreConfig.alpha);
        core.setDepth(20 + i);
      }
    });

    // 重置吸入粒子发射器
    const pullParticles = container.getByName('pull_particles') as Phaser.GameObjects.Particles.ParticleEmitter;
    if (pullParticles) {
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
   * **重要**: 必须正确停止所有 6 个无限旋转 tween
   */
  protected deactivate(obj: Phaser.GameObjects.Container): void {
    // 停止所有托管的 tweens（包括 6 个旋转 tween）
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
    const pullParticles = obj.getByName('pull_particles') as Phaser.GameObjects.Particles.ParticleEmitter;
    if (pullParticles) {
      pullParticles.stop();
    }

    // 清除所有 Graphics 的绘制
    const gravityRingsContainer = obj.getByName('gravity_rings_container') as Phaser.GameObjects.Container;
    if (gravityRingsContainer) {
      for (let i = 0; i < 6; i++) {
        const ring = gravityRingsContainer.getByName(`gravity_ring_${i}`) as Phaser.GameObjects.Graphics;
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
   * 验证所有 6 个旋转 tween 是否存在（用于测试）
   */
  validateAllRotationTweensExist(container: Phaser.GameObjects.Container): boolean {
    const tweens = this.managedTweens.get(container);
    if (!tweens) return false;

    for (let i = 0; i < 6; i++) {
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

    const rotationTweens = [0, 1, 2, 3, 4, 5].map(i => ({
      tag: `rotation_ring_${i}`,
      exists: tweenTags.includes(`rotation_ring_${i}`),
    }));

    return {
      rotationTweens,
      total: tweenTags.length,
    };
  }
}
