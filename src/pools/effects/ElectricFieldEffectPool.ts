import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../VisualEffectPool';

/**
 * 电场效果配置
 */
export interface ElectricFieldEffectConfig extends VisualEffectConfig {
  range: number;
  duration: number;
  tickInterval: number;
  layerConfigs: Array<{
    radius: number;
    color: number;
    alpha: number;
  }>;
  pulseRingConfigs: Array<{
    radius: number;
  }>;
}

/**
 * 电场效果对象池
 *
 * 管理 ElectricField 技能的视觉效果复用
 * - 3 层电场底层（circle）
 * - 3 个脉冲环（circle）
 * - 1 个电荷粒子发射器
 * - 6 个无限循环 tween
 */
export class ElectricFieldEffectPool extends VisualEffectPool<ElectricFieldEffectConfig> {
  constructor(scene: Phaser.Scene, initialSize: number = 5) {
    super(
      scene,
      () => (this as any)._createFn(),
      (obj, config: ElectricFieldEffectConfig) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'ElectricFieldEffectPool', skipInitialWarmUp: true }
    );

    (this as any)._createFn = this.createElectricFieldEffect.bind(this);
    (this as any)._resetFn = this.resetElectricFieldEffect.bind(this);

    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建电场效果容器
   */
  private createElectricFieldEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建3层电场底层
    for (let i = 0; i < 3; i++) {
      const layer = this.scene.add.circle(0, 0, 100, 0xffff00, 0.15);
      layer.setName(`electric_field_layer_${i}`);
      layer.setStrokeStyle(2, 0xffff00, 0.5);
      container.add(layer);
    }

    // 预创建3个脉冲环
    for (let i = 0; i < 3; i++) {
      const ring = this.scene.add.circle(0, 0, 50, 0xffff00, 0);
      ring.setStrokeStyle(3, 0xffffff, 0.8);
      ring.setName(`electric_pulse_ring_${i}`);
      container.add(ring);
    }

    container.setDepth(15);
    return container;
  }

  /**
   * 重置并配置电场效果
   */
  private resetElectricFieldEffect(
    container: Phaser.GameObjects.Container,
    config: ElectricFieldEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);

    // 重置电场底层
    config.layerConfigs.forEach((layerConfig, i) => {
      const layer = container.getByName(`electric_field_layer_${i}`) as Phaser.GameObjects.Arc;
      if (layer) {
        layer.setRadius(layerConfig.radius);
        layer.setFillStyle(layerConfig.color, layerConfig.alpha);
        layer.setStrokeStyle(2, 0xffff00, 0.5);
        layer.setPosition(0, 0);
        layer.setScale(1, 1);
        layer.setAlpha(layerConfig.alpha);
        layer.setDepth(15 + i);

        // 托管边界闪烁动画
        const flickerTween = this.scene.tweens.add({
          targets: layer,
          alpha: layerConfig.alpha * 1.5,
          duration: 200 + i * 50,
          yoyo: true,
          repeat: -1,
        });
        this.addManagedTween(container, flickerTween, {
          autoStop: true,
          tag: `flicker_layer_${i}`,
        });
      }
    });

    // 重置脉冲环
    config.pulseRingConfigs.forEach((ringConfig, i) => {
      const ring = container.getByName(`electric_pulse_ring_${i}`) as Phaser.GameObjects.Arc;
      if (ring) {
        ring.setRadius(ringConfig.radius);
        ring.setFillStyle(0xffff00, 0);
        ring.setStrokeStyle(3 - i * 0.5, 0xffffff, 0.8 - i * 0.15);
        ring.setPosition(0, 0);
        ring.setScale(1, 1);
        ring.setAlpha(0.8 - i * 0.15);

        // 托管持续脉冲动画
        const pulseTween = this.scene.tweens.add({
          targets: ring,
          scale: 1.15,
          alpha: 0.4,
          duration: config.tickInterval / 2,
          yoyo: true,
          repeat: -1,
          delay: i * 80,
        });
        this.addManagedTween(container, pulseTween, {
          autoStop: true,
          tag: `pulse_ring_${i}`,
        });
      }
    });

    // 创建电荷粒子发射器
    const chargeParticles = this.scene.add.particles(config.x, config.y, 'particle_lightning_arc', {
      speed: { min: 30, max: 80 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: [0xffff00, 0xffffff, 0xffffaa],
      lifespan: 600,
      frequency: 80,
      quantity: 2,
      emitting: false,
      emitZone: {
        type: 'random' as const,
        source: new Phaser.Geom.Circle(0, 0, config.range * 0.9) as Phaser.Types.GameObjects.Particles.RandomZoneSource,
      },
    });
    chargeParticles.setName('electric_charge_particles');
    chargeParticles.setDepth(18);
    chargeParticles.start();

    // 设置自动回收
    if (config.duration && config.duration > 0) {
      this.setEffectDuration(container, config.duration);
    }
  }

  /**
   * 停用效果时的额外清理
   */
  protected deactivate(obj: Phaser.GameObjects.Container): void {
    // 停止所有托管的 tweens
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
    const particlesObj = obj.getByName('electric_charge_particles');
    if (particlesObj && particlesObj instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
      const particles = particlesObj as Phaser.GameObjects.Particles.ParticleEmitter;
      particles.stop();
      particles.destroy();
    }

    // 调用父类方法进行基础清理
    super.deactivate(obj);
  }
}
