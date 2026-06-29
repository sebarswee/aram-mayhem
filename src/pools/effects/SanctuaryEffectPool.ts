import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../VisualEffectPool';

/**
 * 圣域效果配置
 */
export interface SanctuaryEffectConfig extends VisualEffectConfig {
  /** 圣域半径 */
  radius: number;
  /** 持续时间（毫秒） */
  duration: number;
  /** 圣域图层配置 */
  layerConfigs?: Array<{
    radius: number;
    color: number;
    alpha: number;
  }>;
  /** 旋转光环配置 */
  ringConfigs?: Array<{
    lineWidth: number;
    color: number;
    alpha: number;
    radiusMultiplier: number;
    rotationDuration: number;
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
 * 圣域效果对象池
 *
 * 管理 Sanctuary 技能的视觉效果复用
 *
 * 池化元素：
 * - 4 层圣域区域圆（外层到内层）
 * - 旋转光环容器内的 3 个环 Graphics
 * - 神圣粒子发射器
 * - **共 3 个无限循环 tween**（必须正确停止）:
 *   - 3 个旋转 tween（每个光环一个）
 *
 * **重要**: 此效果包含 3 个无限循环的 tween，必须在释放时正确停止
 */
export class SanctuaryEffectPool extends VisualEffectPool<SanctuaryEffectConfig> {
  /** 默认圣域图层配置（4 层） */
  private static readonly DEFAULT_LAYER_CONFIGS = [
    { radius: 1.1, color: 0xffcc00, alpha: 0.12 },
    { radius: 1.0, color: 0xffdd44, alpha: 0.20 },
    { radius: 0.8, color: 0xffee88, alpha: 0.18 },
    { radius: 0.5, color: 0xffffaa, alpha: 0.15 },
  ];

  /** 默认旋转光环配置（3 个） */
  private static readonly DEFAULT_RING_CONFIGS = [
    { lineWidth: 2, color: 0xffdd44, alpha: 0.45, radiusMultiplier: 0.40, rotationDuration: 2000 },
    { lineWidth: 2, color: 0xffdd44, alpha: 0.45, radiusMultiplier: 0.65, rotationDuration: 2400 },
    { lineWidth: 2, color: 0xffdd44, alpha: 0.45, radiusMultiplier: 0.90, rotationDuration: 2800 },
  ];

  /** 默认粒子配置 */
  private static readonly DEFAULT_PARTICLE_CONFIG = {
    speedMin: 15,
    speedMax: 40,
    lifespan: 1400,
    frequency: 80,
    quantity: 2,
    colors: [0xffcc00, 0xffdd44, 0xffffff],
  };

  constructor(scene: Phaser.Scene, initialSize: number = 3) {
    // 第一步：先跳过父类的自动预热
    super(
      scene,
      // 使用延迟绑定模式
      () => (this as any)._createFn(),
      (obj, config) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'SanctuaryEffectPool', skipInitialWarmUp: true }
    );

    // 第二步：设置实际的创建和重置函数
    (this as any)._createFn = this.createSanctuaryEffect.bind(this);
    (this as any)._resetFn = this.resetSanctuaryEffect.bind(this);

    // 第三步：现在可以安全地预热池
    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建圣域效果容器
   */
  private createSanctuaryEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建 4 层圣域区域圆
    for (let i = 0; i < 4; i++) {
      const layer = this.scene.add.circle(0, 0, 100, 0xffdd44, 0.2);
      layer.setName(`sanctuary_layer_${i}`);
      container.add(layer);
    }

    // 预创建旋转光环容器
    const sanctuaryRings = this.scene.add.container(0, 0);
    sanctuaryRings.setName('sanctuary_rings_container');
    container.add(sanctuaryRings);

    // 预创建 3 个旋转环 Graphics
    for (let i = 0; i < 3; i++) {
      const ring = this.scene.add.graphics();
      ring.setName(`sanctuary_ring_${i}`);
      sanctuaryRings.add(ring);
    }

    // 预创建神圣粒子发射器
    const holyParticles = this.scene.add.particles(0, 0, 'particle_glow', {
      speed: { min: 15, max: 40 },
      angle: { min: 250, max: 290 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.5, end: 0 },
      tint: [0xffcc00, 0xffdd44, 0xffffff],
      lifespan: 1400,
      frequency: 80,
      quantity: 2,
      emitting: false, // 初始不发射
    });
    holyParticles.setName('holy_particles');
    container.add(holyParticles);

    container.setDepth(17); // 基础深度
    return container;
  }

  /**
   * 重置并配置圣域效果
   */
  private resetSanctuaryEffect(
    container: Phaser.GameObjects.Container,
    config: SanctuaryEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);

    const radius = config.radius;
    const layerConfigs = config.layerConfigs ?? SanctuaryEffectPool.DEFAULT_LAYER_CONFIGS;
    const ringConfigs = config.ringConfigs ?? SanctuaryEffectPool.DEFAULT_RING_CONFIGS;
    const particleConfig = config.particleConfig ?? SanctuaryEffectPool.DEFAULT_PARTICLE_CONFIG;

    // 重置 4 层圣域区域
    layerConfigs.forEach((layerConfig, i) => {
      const layer = container.getByName(`sanctuary_layer_${i}`) as Phaser.GameObjects.Arc;
      if (layer) {
        const actualRadius = radius * layerConfig.radius;
        layer.setRadius(actualRadius);
        layer.setFillStyle(layerConfig.color, layerConfig.alpha);
        layer.setStrokeStyle(2, 0xffcc00, 0.5);
        layer.setPosition(0, 0);
        layer.setScale(1, 1);
        layer.setAlpha(layerConfig.alpha);
        layer.setDepth(17 + i);
      }
    });

    // 重置旋转光环容器
    const sanctuaryRingsContainer = container.getByName('sanctuary_rings_container') as Phaser.GameObjects.Container;
    if (sanctuaryRingsContainer) {
      sanctuaryRingsContainer.setPosition(0, 0);
      sanctuaryRingsContainer.setDepth(18);

      // 重置 3 个旋转环并创建旋转 tween（3 个无限 tween）
      ringConfigs.forEach((ringConfig, i) => {
        const ring = sanctuaryRingsContainer.getByName(`sanctuary_ring_${i}`) as Phaser.GameObjects.Graphics;
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
            angle: 360,
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

    // 重置神圣粒子发射器
    const holyParticlesObj = container.getByName('holy_particles');
    if (holyParticlesObj && holyParticlesObj instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
      const holyParticles = holyParticlesObj as Phaser.GameObjects.Particles.ParticleEmitter;
      // 更新粒子配置
      (holyParticles as any).speed = { min: particleConfig.speedMin, max: particleConfig.speedMax };
      (holyParticles as any).lifespan = particleConfig.lifespan;
      (holyParticles as any).frequency = particleConfig.frequency;
      (holyParticles as any).quantity = particleConfig.quantity;
      (holyParticles as any).tint = particleConfig.colors;
      holyParticles.setPosition(0, 0);
      holyParticles.setDepth(22);

      // 设置发射区域
      const circle = new Phaser.Geom.Circle(0, 0, radius * 0.9);
      const randomZone = new Phaser.GameObjects.Particles.Zones.RandomZone(
        circle as Phaser.Types.GameObjects.Particles.RandomZoneSource
      );
      holyParticles.setEmitZone(randomZone);
      holyParticles.start();

      // 托管粒子发射器
      this.addManagedParticle(container, holyParticles, {
        autoStop: true,
        autoDestroy: false, // 不销毁，因为要复用
        tag: 'holy_particles',
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
   * **重要**: 必须正确停止所有 3 个无限旋转 tween
   */
  protected deactivate(obj: Phaser.GameObjects.Container): void {
    // 停止所有托管的 tweens（包括 3 个旋转 tween）
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
    const holyParticlesObj = obj.getByName('holy_particles');
    if (holyParticlesObj && holyParticlesObj instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
      const holyParticles = holyParticlesObj as Phaser.GameObjects.Particles.ParticleEmitter;
      holyParticles.stop();
    }

    // 清除所有 Graphics 的绘制
    const sanctuaryRingsContainer = obj.getByName('sanctuary_rings_container') as Phaser.GameObjects.Container;
    if (sanctuaryRingsContainer) {
      for (let i = 0; i < 3; i++) {
        const ring = sanctuaryRingsContainer.getByName(`sanctuary_ring_${i}`) as Phaser.GameObjects.Graphics;
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
   * 验证所有 3 个旋转 tween 是否存在（用于测试）
   */
  validateAllRotationTweensExist(container: Phaser.GameObjects.Container): boolean {
    const tweens = this.managedTweens.get(container);
    if (!tweens) return false;

    for (let i = 0; i < 3; i++) {
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

    const rotationTweens = [0, 1, 2].map(i => ({
      tag: `rotation_ring_${i}`,
      exists: tweenTags.includes(`rotation_ring_${i}`),
    }));

    return {
      rotationTweens,
      total: tweenTags.length,
    };
  }
}
