import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../VisualEffectPool';

/**
 * 深渊漩涡效果配置
 */
export interface AbyssVortexEffectConfig extends VisualEffectConfig {
  /** 漩涡半径 */
  radius: number;
  /** 持续时间（毫秒） */
  duration: number;
  /** 旋转环配置 */
  ringConfigs?: Array<{
    lineWidth: number;
    color: number;
    alpha: number;
    radiusMultiplier: number;
    rotationDuration: number;
    direction: 1 | -1;
  }>;
  /** 深渊圆配置 */
  abyssConfigs?: Array<{
    radius: number;
    color: number;
    alpha: number;
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
 * 深渊漩涡效果对象池
 *
 * 管理 AbyssVortex 技能的视觉效果复用
 *
 * 池化元素：
 * - 漩涡容器（包含 5 个旋转环 Graphics）
 * - 3 层深渊圆（外层、中层、内层）
 * - 吸入粒子发射器
 * - 5 个无限旋转 tween（必须正确停止）
 *
 * **重要**: 此效果包含 5 个无限循环的 tween，必须在释放时正确停止
 */
export class AbyssVortexEffectPool extends VisualEffectPool<AbyssVortexEffectConfig> {
  /** 默认旋转环配置 */
  private static readonly DEFAULT_RING_CONFIGS = [
    { lineWidth: 4.0, color: 0x4488ff, alpha: 0.50, radiusMultiplier: 0.30, rotationDuration: 800, direction: 1 as const },
    { lineWidth: 3.5, color: 0x4488ff, alpha: 0.42, radiusMultiplier: 0.48, rotationDuration: 1000, direction: -1 as const },
    { lineWidth: 3.0, color: 0x4488ff, alpha: 0.34, radiusMultiplier: 0.66, rotationDuration: 1200, direction: 1 as const },
    { lineWidth: 2.5, color: 0x4488ff, alpha: 0.26, radiusMultiplier: 0.84, rotationDuration: 1400, direction: -1 as const },
    { lineWidth: 2.0, color: 0x4488ff, alpha: 0.18, radiusMultiplier: 1.02, rotationDuration: 1600, direction: 1 as const },
  ];

  /** 默认深渊圆配置 */
  private static readonly DEFAULT_ABYSS_CONFIGS = [
    { radius: 40, color: 0x2244aa, alpha: 0.6 },
    { radius: 28, color: 0x3366cc, alpha: 0.75 },
    { radius: 16, color: 0x4488ff, alpha: 0.9 },
  ];

  /** 默认粒子配置 */
  private static readonly DEFAULT_PARTICLE_CONFIG = {
    speedMin: 50,
    speedMax: 120,
    lifespan: 600,
    frequency: 40,
    quantity: 2,
    colors: [0x4488ff, 0x66aaff],
  };

  constructor(scene: Phaser.Scene, initialSize: number = 3) {
    super(
      scene,
      // 创建函数
      () => this.createAbyssVortexEffect(),
      // 重置函数
      (obj, config: AbyssVortexEffectConfig) => this.resetAbyssVortexEffect(obj, config),
      // 配置选项
      { initialSize, name: 'AbyssVortexEffectPool' }
    );
  }

  /**
   * 创建深渊漩涡效果容器
   */
  private createAbyssVortexEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建 5 个旋转环（使用 Graphics）
    for (let i = 0; i < 5; i++) {
      const ring = this.scene.add.graphics();
      ring.setName(`vortex_ring_${i}`);
      container.add(ring);
    }

    // 预创建 3 层深渊圆
    for (let i = 0; i < 3; i++) {
      const abyss = this.scene.add.circle(0, 0, 40, 0x2244aa, 0.6);
      abyss.setName(`abyss_layer_${i}`);
      container.add(abyss);
    }

    // 预创建吸入粒子发射器
    const pullParticles = this.scene.add.particles(0, 0, 'particle_glow', {
      speed: { min: 50, max: 120 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: [0x4488ff, 0x66aaff],
      lifespan: 600,
      frequency: 40,
      quantity: 2,
      emitting: false, // 初始不发射
    });
    pullParticles.setName('pull_particles');
    container.add(pullParticles);

    container.setDepth(17); // 基础深度
    return container;
  }

  /**
   * 重置并配置深渊漩涡效果
   */
  private resetAbyssVortexEffect(
    container: Phaser.GameObjects.Container,
    config: AbyssVortexEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);

    const radius = config.radius;
    const ringConfigs = config.ringConfigs ?? AbyssVortexEffectPool.DEFAULT_RING_CONFIGS;
    const abyssConfigs = config.abyssConfigs ?? AbyssVortexEffectPool.DEFAULT_ABYSS_CONFIGS;
    const particleConfig = config.particleConfig ?? AbyssVortexEffectPool.DEFAULT_PARTICLE_CONFIG;

    // 重置旋转环并创建无限旋转 tween
    ringConfigs.forEach((ringConfig, i) => {
      const ring = container.getByName(`vortex_ring_${i}`) as Phaser.GameObjects.Graphics;
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
        ring.setDepth(18 + i);

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

    // 重置深渊圆
    abyssConfigs.forEach((abyssConfig, i) => {
      const abyss = container.getByName(`abyss_layer_${i}`) as Phaser.GameObjects.Arc;
      if (abyss) {
        abyss.setRadius(abyssConfig.radius);
        abyss.setFillStyle(abyssConfig.color, abyssConfig.alpha);
        abyss.setPosition(0, 0);
        abyss.setScale(1, 1);
        abyss.setAlpha(abyssConfig.alpha);
        abyss.setDepth(19 + i);
      }
    });

    // 重置粒子发射器
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
   * **重要**: 必须正确停止所有 5 个无限旋转 tween
   */
  protected deactivate(obj: Phaser.GameObjects.Container): void {
    // 停止所有托管的 tweens（包括 5 个无限旋转 tween）
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
    for (let i = 0; i < 5; i++) {
      const ring = obj.getByName(`vortex_ring_${i}`) as Phaser.GameObjects.Graphics;
      if (ring) {
        ring.clear();
      }
    }

    // 调用父类方法进行基础清理
    super.deactivate(obj);
  }

  /**
   * 获取旋转环 tween 数量（用于调试）
   */
  getRotationTweenCount(container: Phaser.GameObjects.Container): number {
    const tweens = this.managedTweens.get(container);
    if (!tweens) return 0;
    return tweens.filter(t => t.tag?.startsWith('rotation_ring_')).length;
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
}
