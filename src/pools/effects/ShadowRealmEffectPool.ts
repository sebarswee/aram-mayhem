import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../VisualEffectPool';

/**
 * 暗影领域效果配置
 */
export interface ShadowRealmEffectConfig extends VisualEffectConfig {
  /** 领域半径 */
  radius: number;
  /** 持续时间（毫秒） */
  duration: number;
  /** 暗影图层配置 */
  layerConfigs?: Array<{
    radius: number;
    color: number;
    alpha: number;
  }>;
  /** 暗影漩涡环配置 */
  vortexConfigs?: Array<{
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
 * 暗影领域效果对象池
 *
 * 管理 ShadowRealm/ShadowDescent 技能的视觉效果复用
 *
 * 池化元素：
 * - 4 层暗影区域圆（外层到内层）
 * - 暗影粒子发射器
 * - 暗影漩涡容器内的 3 个旋转环 Graphics
 * - **共 7 个无限循环 tween**（必须正确停止）:
 *   - 4 个脉动 tween（每个暗影层一个）
 *   - 3 个旋转 tween（每个漩涡环一个）
 *
 * **重要**: 此效果包含 7 个无限循环的 tween，必须在释放时正确停止
 */
export class ShadowRealmEffectPool extends VisualEffectPool<ShadowRealmEffectConfig> {
  /** 默认暗影图层配置（4 层） */
  private static readonly DEFAULT_LAYER_CONFIGS = [
    { radius: 1.1, color: 0x220044, alpha: 0.20 },
    { radius: 1.0, color: 0x440066, alpha: 0.35 },
    { radius: 0.8, color: 0x660088, alpha: 0.30 },
    { radius: 0.5, color: 0x8800aa, alpha: 0.25 },
  ];

  /** 默认漩涡环配置（3 个） */
  private static readonly DEFAULT_VORTEX_CONFIGS = [
    { lineWidth: 2.0, color: 0x8800ff, alpha: 0.40, radiusMultiplier: 0.40, rotationDuration: 1500, direction: 1 as const },
    { lineWidth: 2.0, color: 0x8800ff, alpha: 0.40, radiusMultiplier: 0.65, rotationDuration: 1800, direction: -1 as const },
    { lineWidth: 2.0, color: 0x8800ff, alpha: 0.40, radiusMultiplier: 0.90, rotationDuration: 2100, direction: 1 as const },
  ];

  /** 默认粒子配置 */
  private static readonly DEFAULT_PARTICLE_CONFIG = {
    speedMin: 20,
    speedMax: 50,
    lifespan: 1200,
    frequency: 60,
    quantity: 3,
    colors: [0x660088, 0x8800aa, 0xaa00cc],
  };

  constructor(scene: Phaser.Scene, initialSize: number = 3) {
    // 第一步：先跳过父类的自动预热
    super(
      scene,
      // 使用延迟绑定模式
      () => (this as any)._createFn(),
      (obj, config) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'ShadowRealmEffectPool', skipInitialWarmUp: true }
    );

    // 第二步：设置实际的创建和重置函数
    (this as any)._createFn = this.createShadowRealmEffect.bind(this);
    (this as any)._resetFn = this.resetShadowRealmEffect.bind(this);

    // 第三步：现在可以安全地预热池
    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建暗影领域效果容器
   */
  private createShadowRealmEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建 4 层暗影区域圆
    for (let i = 0; i < 4; i++) {
      const layer = this.scene.add.circle(0, 0, 100, 0x660088, 0.3);
      layer.setName(`shadow_layer_${i}`);
      container.add(layer);
    }

    // 预创建暗影粒子发射器
    const shadowParticles = this.scene.add.particles(0, 0, 'particle_glow', {
      speed: { min: 20, max: 50 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: [0x660088, 0x8800aa, 0xaa00cc],
      lifespan: 1200,
      frequency: 60,
      quantity: 3,
      emitting: false, // 初始不发射
    });
    shadowParticles.setName('shadow_particles');
    container.add(shadowParticles);

    // 预创建暗影漩涡容器
    const vortexContainer = this.scene.add.container(0, 0);
    vortexContainer.setName('vortex_container');
    container.add(vortexContainer);

    // 预创建 3 个旋转环 Graphics
    for (let i = 0; i < 3; i++) {
      const ring = this.scene.add.graphics();
      ring.setName(`vortex_ring_${i}`);
      vortexContainer.add(ring);
    }

    container.setDepth(17); // 基础深度
    return container;
  }

  /**
   * 重置并配置暗影领域效果
   */
  private resetShadowRealmEffect(
    container: Phaser.GameObjects.Container,
    config: ShadowRealmEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);

    const radius = config.radius;
    const layerConfigs = config.layerConfigs ?? ShadowRealmEffectPool.DEFAULT_LAYER_CONFIGS;
    const vortexConfigs = config.vortexConfigs ?? ShadowRealmEffectPool.DEFAULT_VORTEX_CONFIGS;
    const particleConfig = config.particleConfig ?? ShadowRealmEffectPool.DEFAULT_PARTICLE_CONFIG;

    // 重置 4 层暗影区域并创建脉动 tween（4 个无限 tween）
    layerConfigs.forEach((layerConfig, i) => {
      const layer = container.getByName(`shadow_layer_${i}`) as Phaser.GameObjects.Arc;
      if (layer) {
        const actualRadius = radius * layerConfig.radius;
        layer.setRadius(actualRadius);
        layer.setFillStyle(layerConfig.color, layerConfig.alpha);
        layer.setPosition(0, 0);
        layer.setScale(1, 1);
        layer.setAlpha(layerConfig.alpha);
        layer.setDepth(17 + i);

        // 创建无限脉动 tween
        const pulseTween = this.scene.tweens.add({
          targets: layer,
          scaleX: 1.08,
          scaleY: 1.08,
          alpha: layerConfig.alpha * 0.6,
          duration: 450,
          yoyo: true,
          repeat: -1, // 无限循环
        });

        // 托管 tween 以便正确清理
        this.addManagedTween(container, pulseTween, {
          autoStop: true,
          tag: `pulse_layer_${i}`,
        });
      }
    });

    // 重置暗影粒子发射器
    const shadowParticles = container.getByName('shadow_particles') as Phaser.GameObjects.Particles.ParticleEmitter;
    if (shadowParticles) {
      // 更新粒子配置
      (shadowParticles as any).speed = { min: particleConfig.speedMin, max: particleConfig.speedMax };
      (shadowParticles as any).lifespan = particleConfig.lifespan;
      (shadowParticles as any).frequency = particleConfig.frequency;
      (shadowParticles as any).quantity = particleConfig.quantity;
      (shadowParticles as any).tint = particleConfig.colors;
      shadowParticles.setPosition(0, 0);
      shadowParticles.setDepth(22);

      // 设置发射区域
      const circle = new Phaser.Geom.Circle(0, 0, radius * 0.9);
      const randomZone = new Phaser.GameObjects.Particles.Zones.RandomZone(
        circle as Phaser.Types.GameObjects.Particles.RandomZoneSource
      );
      shadowParticles.setEmitZone(randomZone);
      shadowParticles.start();

      // 托管粒子发射器
      this.addManagedParticle(container, shadowParticles, {
        autoStop: true,
        autoDestroy: false, // 不销毁，因为要复用
        tag: 'shadow_particles',
      });
    }

    // 重置暗影漩涡容器
    const vortexContainer = container.getByName('vortex_container') as Phaser.GameObjects.Container;
    if (vortexContainer) {
      vortexContainer.setPosition(0, 0);
      vortexContainer.setDepth(18);

      // 重置 3 个旋转环并创建旋转 tween（3 个无限 tween）
      vortexConfigs.forEach((vortexConfig, i) => {
        const ring = vortexContainer.getByName(`vortex_ring_${i}`) as Phaser.GameObjects.Graphics;
        if (ring) {
          // 清除之前的绘制
          ring.clear();

          // 设置线条样式
          ring.lineStyle(vortexConfig.lineWidth, vortexConfig.color, vortexConfig.alpha);

          // 绘制圆形环
          const ringRadius = radius * vortexConfig.radiusMultiplier;
          ring.strokeCircle(0, 0, ringRadius);

          // 重置变换
          ring.setPosition(0, 0);
          ring.setAngle(0);
          ring.setAlpha(vortexConfig.alpha);

          // 创建无限旋转 tween
          const rotationTween = this.scene.tweens.add({
            targets: ring,
            angle: 360 * vortexConfig.direction,
            duration: vortexConfig.rotationDuration,
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

    // 设置自动回收
    if (config.duration && config.duration > 0) {
      this.setEffectDuration(container, config.duration);
    }
  }

  /**
   * 停用效果时的额外清理
   *
   * **重要**: 必须正确停止所有 7 个无限 tween
   */
  protected deactivate(obj: Phaser.GameObjects.Container): void {
    // 停止所有托管的 tweens（包括 4 个脉动 tween 和 3 个旋转 tween）
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
    const shadowParticles = obj.getByName('shadow_particles') as Phaser.GameObjects.Particles.ParticleEmitter;
    if (shadowParticles) {
      shadowParticles.stop();
    }

    // 清除所有 Graphics 的绘制
    const vortexContainer = obj.getByName('vortex_container') as Phaser.GameObjects.Container;
    if (vortexContainer) {
      for (let i = 0; i < 3; i++) {
        const ring = vortexContainer.getByName(`vortex_ring_${i}`) as Phaser.GameObjects.Graphics;
        if (ring) {
          ring.clear();
        }
      }
    }

    // 调用父类方法进行基础清理
    super.deactivate(obj);
  }

  /**
   * 获取脉动 tween 数量（用于调试）
   */
  getPulseTweenCount(container: Phaser.GameObjects.Container): number {
    const tweens = this.managedTweens.get(container);
    if (!tweens) return 0;
    return tweens.filter(t => t.tag?.startsWith('pulse_layer_')).length;
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
   * 验证所有 7 个 tween 是否存在（用于测试）
   */
  validateAllTweensExist(container: Phaser.GameObjects.Container): boolean {
    const tweens = this.managedTweens.get(container);
    if (!tweens) return false;

    // 验证 4 个脉动 tween
    for (let i = 0; i < 4; i++) {
      const found = tweens.some(t => t.tag === `pulse_layer_${i}`);
      if (!found) return false;
    }

    // 验证 3 个旋转 tween
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
    pulseTweens: { tag: string; exists: boolean }[];
    rotationTweens: { tag: string; exists: boolean }[];
    total: number;
  } {
    const tweens = this.managedTweens.get(container);
    const tweenTags = tweens ? tweens.map(t => t.tag) : [];

    const pulseTweens = [0, 1, 2, 3].map(i => ({
      tag: `pulse_layer_${i}`,
      exists: tweenTags.includes(`pulse_layer_${i}`),
    }));

    const rotationTweens = [0, 1, 2].map(i => ({
      tag: `rotation_ring_${i}`,
      exists: tweenTags.includes(`rotation_ring_${i}`),
    }));

    return {
      pulseTweens,
      rotationTweens,
      total: tweenTags.length,
    };
  }
}
