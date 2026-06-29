import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../VisualEffectPool';

/**
 * 死亡凋零效果配置
 */
export interface DeathDecayEffectConfig extends VisualEffectConfig {
  /** 领域半径 */
  radius: number;
  /** 持续时间（毫秒） */
  duration: number;
  /** 凋零图层配置 */
  layerConfigs?: Array<{
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
 * 死亡凋零效果对象池
 *
 * 管理 DeathDecay 技能的视觉效果复用
 *
 * 池化元素：
 * - 4 层凋零区域圆（外层到内层）
 * - 死亡粒子发射器
 * - **共 4 个无限循环 tween**（必须正确停止）:
 *   - 4 个脉动 tween（每个凋零层一个）
 *
 * **重要**: 此效果包含 4 个无限循环的 tween，必须在释放时正确停止
 */
export class DeathDecayEffectPool extends VisualEffectPool<DeathDecayEffectConfig> {
  /** 默认凋零图层配置（4 层） */
  private static readonly DEFAULT_LAYER_CONFIGS = [
    { radius: 1.1, color: 0x220022, alpha: 0.20 },
    { radius: 1.0, color: 0x440044, alpha: 0.35 },
    { radius: 0.8, color: 0x660066, alpha: 0.30 },
    { radius: 0.5, color: 0x880088, alpha: 0.25 },
  ];

  /** 默认粒子配置 */
  private static readonly DEFAULT_PARTICLE_CONFIG = {
    speedMin: 15,
    speedMax: 45,
    lifespan: 1400,
    frequency: 70,
    quantity: 2,
    colors: [0x660066, 0x880088, 0xaa00aa],
  };

  constructor(scene: Phaser.Scene, initialSize: number = 3) {
    // 第一步：先跳过父类的自动预热
    super(
      scene,
      // 使用延迟绑定模式
      () => (this as any)._createFn(),
      (obj, config) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'DeathDecayEffectPool', skipInitialWarmUp: true }
    );

    // 第二步：设置实际的创建和重置函数
    (this as any)._createFn = this.createDeathDecayEffect.bind(this);
    (this as any)._resetFn = this.resetDeathDecayEffect.bind(this);

    // 第三步：现在可以安全地预热池
    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建死亡凋零效果容器
   */
  private createDeathDecayEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建 4 层凋零区域圆
    for (let i = 0; i < 4; i++) {
      const layer = this.scene.add.circle(0, 0, 100, 0x660066, 0.3);
      layer.setName(`decay_layer_${i}`);
      container.add(layer);
    }

    // 预创建死亡粒子发射器
    const deathParticles = this.scene.add.particles(0, 0, 'particle_glow', {
      speed: { min: 15, max: 45 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.45, end: 0 },
      alpha: { start: 0.55, end: 0 },
      tint: [0x660066, 0x880088, 0xaa00aa],
      lifespan: 1400,
      frequency: 70,
      quantity: 2,
      emitting: false, // 初始不发射
    });
    deathParticles.setName('death_particles');
    container.add(deathParticles);

    container.setDepth(17); // 基础深度
    return container;
  }

  /**
   * 重置并配置死亡凋零效果
   */
  private resetDeathDecayEffect(
    container: Phaser.GameObjects.Container,
    config: DeathDecayEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);

    const radius = config.radius;
    const layerConfigs = config.layerConfigs ?? DeathDecayEffectPool.DEFAULT_LAYER_CONFIGS;
    const particleConfig = config.particleConfig ?? DeathDecayEffectPool.DEFAULT_PARTICLE_CONFIG;

    // 重置 4 层凋零区域并创建脉动 tween（4 个无限 tween）
    layerConfigs.forEach((layerConfig, i) => {
      const layer = container.getByName(`decay_layer_${i}`) as Phaser.GameObjects.Arc;
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
          scaleX: 1.06,
          scaleY: 1.06,
          alpha: layerConfig.alpha * 0.6,
          duration: 400,
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

    // 重置死亡粒子发射器
    const particlesObj = container.getByName('death_particles');
    if (particlesObj && particlesObj instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
      const deathParticles = particlesObj as Phaser.GameObjects.Particles.ParticleEmitter;

      // 设置发射区域
      const circle = new Phaser.Geom.Circle(0, 0, radius * 0.9);
      const randomZone = new Phaser.GameObjects.Particles.Zones.RandomZone(
        circle as Phaser.Types.GameObjects.Particles.RandomZoneSource
      );
      deathParticles.setEmitZone(randomZone);
      deathParticles.start();
      deathParticles.setDepth(22);

      // 托管粒子发射器
      this.addManagedParticle(container, deathParticles, {
        autoStop: true,
        autoDestroy: false, // 不销毁，因为要复用
        tag: 'death_particles',
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
   * **重要**: 必须正确停止所有 4 个无限 tween
   */
  protected deactivate(obj: Phaser.GameObjects.Container): void {
    // 停止所有托管的 tweens（包括 4 个脉动 tween）
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
    const deathParticles = obj.getByName('death_particles') as Phaser.GameObjects.Particles.ParticleEmitter;
    if (deathParticles) {
      deathParticles.stop();
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
   * 获取总 tween 数量（用于调试）
   */
  getTotalTweenCount(container: Phaser.GameObjects.Container): number {
    const tweens = this.managedTweens.get(container);
    return tweens ? tweens.length : 0;
  }

  /**
   * 验证所有 4 个 tween 是否存在（用于测试）
   */
  validateAllTweensExist(container: Phaser.GameObjects.Container): boolean {
    const tweens = this.managedTweens.get(container);
    if (!tweens) return false;

    // 验证 4 个脉动 tween
    for (let i = 0; i < 4; i++) {
      const found = tweens.some(t => t.tag === `pulse_layer_${i}`);
      if (!found) return false;
    }

    return true;
  }

  /**
   * 获取详细的 tween 状态（用于调试）
   */
  getDetailedTweenStatus(container: Phaser.GameObjects.Container): {
    pulseTweens: { tag: string; exists: boolean }[];
    total: number;
  } {
    const tweens = this.managedTweens.get(container);
    const tweenTags = tweens ? tweens.map(t => t.tag) : [];

    const pulseTweens = [0, 1, 2, 3].map(i => ({
      tag: `pulse_layer_${i}`,
      exists: tweenTags.includes(`pulse_layer_${i}`),
    }));

    return {
      pulseTweens,
      total: tweenTags.length,
    };
  }
}
