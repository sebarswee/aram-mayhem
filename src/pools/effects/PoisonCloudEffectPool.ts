import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../VisualEffectPool';

/**
 * 毒云效果配置
 */
export interface PoisonCloudEffectConfig extends VisualEffectConfig {
  radius: number;
  duration: number;
  tickInterval: number;
  layerConfigs: Array<{
    radius: number;
    color: number;
    alpha: number;
  }>;
}

/**
 * 毒云效果对象池
 *
 * 管理 PoisonCloud 技能的视觉效果复用
 * - 3 层毒雾区域（circle）
 * - 1 个毒雾粒子发射器
 * - 1 个上升毒气粒子发射器
 * - 3 个无限循环 tween（脉动）
 */
export class PoisonCloudEffectPool extends VisualEffectPool<PoisonCloudEffectConfig> {
  constructor(scene: Phaser.Scene, initialSize: number = 5) {
    super(
      scene,
      () => (this as any)._createFn(),
      (obj, config: PoisonCloudEffectConfig) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'PoisonCloudEffectPool', skipInitialWarmUp: true }
    );

    (this as any)._createFn = this.createPoisonCloudEffect.bind(this);
    (this as any)._resetFn = this.resetPoisonCloudEffect.bind(this);

    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建毒云效果容器
   */
  private createPoisonCloudEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建3层毒雾区域
    for (let i = 0; i < 3; i++) {
      const layer = this.scene.add.circle(0, 0, 100, 0x44cc44, 0.25);
      layer.setName(`poison_layer_${i}`);
      container.add(layer);
    }

    container.setDepth(17);
    return container;
  }

  /**
   * 重置并配置毒云效果
   */
  private resetPoisonCloudEffect(
    container: Phaser.GameObjects.Container,
    config: PoisonCloudEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);

    // 重置毒雾区域
    config.layerConfigs.forEach((layerConfig, i) => {
      const layer = container.getByName(`poison_layer_${i}`) as Phaser.GameObjects.Arc;
      if (layer) {
        layer.setRadius(layerConfig.radius);
        layer.setFillStyle(layerConfig.color, layerConfig.alpha);
        layer.setPosition(0, 0);
        layer.setScale(1, 1);
        layer.setAlpha(layerConfig.alpha);
        layer.setDepth(17 + i);

        // 脉动动画
        const tween = this.scene.tweens.add({
          targets: layer,
          scaleX: 1.08,
          scaleY: 1.08,
          alpha: layerConfig.alpha * 0.6,
          duration: 400 + i * 100,
          yoyo: true,
          repeat: -1,
        });
        this.addManagedTween(container, tween, { autoStop: true, tag: 'pulse' });
      }
    });

    // 创建毒雾粒子发射器
    const poisonParticles = this.scene.add.particles(config.x, config.y, 'particle_glow', {
      speed: { min: 20, max: 60 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: [0x44ff44, 0x66ff66, 0x88ff88, 0xaaffaa],
      lifespan: 1200,
      frequency: 80,
      quantity: 3,
      emitting: false,
      emitZone: {
        type: 'random' as const,
        source: new Phaser.Geom.Circle(0, 0, config.radius * 0.9) as Phaser.Types.GameObjects.Particles.RandomZoneSource,
      },
    });
    poisonParticles.setName('poison_particles');
    poisonParticles.setDepth(20);
    poisonParticles.start();

    // 创建上升毒气粒子发射器
    const risingParticles = this.scene.add.particles(config.x, config.y, 'particle_glow', {
      speed: { min: 30, max: 60 },
      angle: { min: 250, max: 290 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.5, end: 0 },
      tint: [0x44ff44, 0x66ff66],
      lifespan: 1500,
      frequency: 100,
      quantity: 2,
      emitting: false,
      emitZone: {
        type: 'random' as const,
        source: new Phaser.Geom.Circle(0, 0, config.radius) as Phaser.Types.GameObjects.Particles.RandomZoneSource,
      },
    });
    risingParticles.setName('poison_rising_particles');
    risingParticles.setDepth(21);
    risingParticles.start();

    // 设置自动回收
    if (config.duration && config.duration > 0) {
      this.setEffectDuration(container, config.duration);
    }
  }

  /**
   * 停用效果时的额外清理
   */
  protected deactivate(obj: Phaser.GameObjects.Container): void {
    // 清理托管的脉动 tween
    this.stopTweensByTag(obj, 'pulse');

    // 停止粒子发射
    const poisonParticlesObj = obj.getByName('poison_particles');
    if (poisonParticlesObj && poisonParticlesObj instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
      const poisonParticles = poisonParticlesObj as Phaser.GameObjects.Particles.ParticleEmitter;
      poisonParticles.stop();
      poisonParticles.destroy();
    }

    const risingParticlesObj = obj.getByName('poison_rising_particles');
    if (risingParticlesObj && risingParticlesObj instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
      const risingParticles = risingParticlesObj as Phaser.GameObjects.Particles.ParticleEmitter;
      risingParticles.stop();
      risingParticles.destroy();
    }

    // 调用父类方法进行基础清理
    super.deactivate(obj);
  }
}
