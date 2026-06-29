import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../VisualEffectPool';

/**
 * 烈焰风暴效果配置
 */
export interface InfernoEffectConfig extends VisualEffectConfig {
  radius: number;
  layerConfigs: Array<{
    radius: number;
    color: number;
    alpha: number;
  }>;
}

/**
 * 烈焰风暴效果对象池
 *
 * 管理 Inferno 技能的视觉效果复用
 */
export class InfernoEffectPool extends VisualEffectPool<InfernoEffectConfig> {
  constructor(scene: Phaser.Scene, initialSize: number = 3) {
    // 第一步：先跳过父类的自动预热
    super(
      scene,
      // 延迟绑定，warmUp 时才会调用
      () => (this as any)._createFn(),
      (obj, config: InfernoEffectConfig) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'InfernoEffectPool', skipInitialWarmUp: true }
    );

    // 第二步：设置实际的创建和重置函数
    (this as any)._createFn = this.createInfernoEffect.bind(this);
    (this as any)._resetFn = this.resetInfernoEffect.bind(this);

    // 第三步：手动预热
    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建烈焰风暴效果容器
   */
  private createInfernoEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建4个火焰图层（复用）
    for (let i = 0; i < 4; i++) {
      const layer = this.scene.add.circle(0, 0, 100, 0xff4400, 0.3);
      layer.setName(`inferno_layer_${i}`);
      container.add(layer);
    }

    // 预创建火焰粒子发射器
    const particles = this.scene.add.particles(0, 0, 'particle_fire_core', {
      speed: { min: 30, max: 80 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.7, end: 0 },
      tint: [0xff4400, 0xff6600, 0xffaa00, 0xffff00],
      lifespan: 1200,
      frequency: 60,
      quantity: 3,
      emitting: false, // 初始不发射
    });
    particles.setName('inferno_particles');
    container.add(particles);

    container.setDepth(20);
    return container;
  }

  /**
   * 重置并配置烈焰风暴效果
   */
  private resetInfernoEffect(
    container: Phaser.GameObjects.Container,
    config: InfernoEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);

    // 重置图层
    config.layerConfigs.forEach((layerConfig, i) => {
      const layer = container.getByName(`inferno_layer_${i}`) as Phaser.GameObjects.Arc;
      if (layer) {
        layer.setRadius(layerConfig.radius);
        layer.setFillStyle(layerConfig.color, layerConfig.alpha);
        layer.setPosition(0, 0);
        layer.setScale(1, 1);
        layer.setAlpha(layerConfig.alpha);
        layer.setDepth(17 + i);

        // 托管无限脉动 tween
        const pulseTween = this.scene.tweens.add({
          targets: layer,
          scaleX: 1.08,
          scaleY: 1.08,
          alpha: layerConfig.alpha * 0.6,
          duration: 400,
          yoyo: true,
          repeat: -1,
        });
        this.addManagedTween(container, pulseTween, {
          autoStop: true,
          tag: `pulse_layer_${i}`,
        });
      }
    });

    // 重置粒子 - Phaser 3.60+
    const particlesObj = container.getByName('inferno_particles');
    if (particlesObj && particlesObj instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
      const particles = particlesObj as Phaser.GameObjects.Particles.ParticleEmitter;
      // 创建新的 RandomZone 实例
      // 使用类型断言解决 Phaser 类型定义问题
      const circle = new Phaser.Geom.Circle(0, 0, config.radius * 0.9);
      const randomZone = new Phaser.GameObjects.Particles.Zones.RandomZone(
        circle as Phaser.Types.GameObjects.Particles.RandomZoneSource
      );
      particles.setEmitZone(randomZone);
      particles.start();
      particles.setDepth(22);
    }

    // 设置自动回收（使用托管定时器）
    if (config.duration && config.duration > 0) {
      this.setEffectDuration(container, config.duration);
    }
  }

  /**
   * 停用效果时的额外清理
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
    const particlesObj = obj.getByName('inferno_particles');
    if (particlesObj && particlesObj instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
      const particles = particlesObj as Phaser.GameObjects.Particles.ParticleEmitter;
      particles.stop();
    }

    // 调用父类方法进行基础清理
    super.deactivate(obj);
  }
}