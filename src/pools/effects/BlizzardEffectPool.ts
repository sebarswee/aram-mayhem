import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../VisualEffectPool';

/**
 * 暴风雪效果配置
 */
export interface BlizzardEffectConfig extends VisualEffectConfig {
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
 * 暴风雪效果对象池
 *
 * 管理 Blizzard 技能的视觉效果复用
 * - 3 层霜冻区域（circle）
 * - 1 个霜冻粒子发射器
 * - 1 个雪花粒子发射器
 * - 3 层无限循环 tween（脉动）
 * - 3 层无限循环 tween（旋风旋转）
 */
export class BlizzardEffectPool extends VisualEffectPool<BlizzardEffectConfig> {
  constructor(scene: Phaser.Scene, initialSize: number = 5) {
    super(
      scene,
      () => (this as any)._createFn(),
      (obj, config: BlizzardEffectConfig) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'BlizzardEffectPool', skipInitialWarmUp: true }
    );

    (this as any)._createFn = this.createBlizzardEffect.bind(this);
    (this as any)._resetFn = this.resetBlizzardEffect.bind(this);

    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建暴风雪效果容器
   */
  private createBlizzardEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建3层霜冻区域
    for (let i = 0; i < 3; i++) {
      const layer = this.scene.add.circle(0, 0, 100, 0x88ddff, 0.18);
      layer.setName(`blizzard_layer_${i}`);
      container.add(layer);
    }

    // 预创建旋风容器
    const vortex = this.scene.add.container(0, 0);
    vortex.setName('blizzard_vortex');
    vortex.setDepth(19);

    // 预创建3个旋转环
    for (let i = 0; i < 3; i++) {
      const ring = this.scene.add.graphics();
      ring.lineStyle(2 - i * 0.5, 0x88ddff, 0.4 - i * 0.1);
      ring.strokeCircle(0, 0, 50);
      ring.setName(`blizzard_ring_${i}`);
      vortex.add(ring);
    }
    container.add(vortex);

    container.setDepth(17);
    return container;
  }

  /**
   * 重置并配置暴风雪效果
   */
  private resetBlizzardEffect(
    container: Phaser.GameObjects.Container,
    config: BlizzardEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);

    // 重置霜冻区域
    config.layerConfigs.forEach((layerConfig, i) => {
      const layer = container.getByName(`blizzard_layer_${i}`) as Phaser.GameObjects.Arc;
      if (layer) {
        layer.setRadius(layerConfig.radius);
        layer.setFillStyle(layerConfig.color, layerConfig.alpha);
        layer.setPosition(0, 0);
        layer.setScale(1, 1);
        layer.setAlpha(layerConfig.alpha);
        layer.setDepth(17 + i);

        // 脉动动画
        this.scene.tweens.add({
          targets: layer,
          scaleX: 1.05,
          scaleY: 1.05,
          alpha: layerConfig.alpha * 0.6,
          duration: 400,
          yoyo: true,
          repeat: -1,
        });
      }
    });

    // 重置旋风环
    const vortex = container.getByName('blizzard_vortex') as Phaser.GameObjects.Container;
    if (vortex) {
      vortex.list.forEach((ring, i) => {
        const graphics = ring as Phaser.GameObjects.Graphics;
        graphics.clear();
        graphics.lineStyle(2 - i * 0.5, 0x88ddff, 0.4 - i * 0.1);
        graphics.strokeCircle(0, 0, config.radius * (0.4 + i * 0.2));

        // 旋转动画
        this.scene.tweens.add({
          targets: graphics,
          angle: 360 * (i % 2 === 0 ? 1 : -1),
          duration: 2000 + i * 500,
          repeat: -1,
        });
      });
    }

    // 创建霜冻粒子发射器
    const frostParticles = this.scene.add.particles(config.x, config.y, 'particle_ice_crystal', {
      speed: { min: 30, max: 80 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.7, end: 0 },
      tint: [0x88ddff, 0xaaeeff, 0xffffff],
      lifespan: 1200,
      frequency: 60,
      quantity: 3,
      emitting: false,
      emitZone: {
        type: 'random' as const,
        source: new Phaser.Geom.Circle(0, 0, config.radius * 0.9) as Phaser.Types.GameObjects.Particles.RandomZoneSource,
      },
    });
    frostParticles.setName('blizzard_frost_particles');
    frostParticles.setDepth(20);
    frostParticles.start();

    // 创建雪花粒子发射器
    const snowParticles = this.scene.add.particles(config.x, config.y, 'particle_glow', {
      speed: { min: 20, max: 50 },
      angle: { min: 200, max: 340 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: [0xffffff, 0xeeffff, 0xddffff],
      lifespan: 2000,
      frequency: 80,
      quantity: 2,
      emitting: false,
      emitZone: {
        type: 'random' as const,
        source: new Phaser.Geom.Circle(0, 0, config.radius) as Phaser.Types.GameObjects.Particles.RandomZoneSource,
      },
    });
    snowParticles.setName('blizzard_snow_particles');
    snowParticles.setDepth(21);
    snowParticles.start();

    // 设置自动回收
    if (config.duration && config.duration > 0) {
      this.scene.time.delayedCall(config.duration, () => {
        this.release(container);
      });
    }
  }

  /**
   * 停用效果时的额外清理
   */
  protected deactivate(obj: Phaser.GameObjects.Container): void {
    // 停止粒子发射
    const frostParticlesObj = obj.getByName('blizzard_frost_particles');
    if (frostParticlesObj && frostParticlesObj instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
      const frostParticles = frostParticlesObj as Phaser.GameObjects.Particles.ParticleEmitter;
      frostParticles.stop();
      frostParticles.destroy();
    }

    const snowParticlesObj = obj.getByName('blizzard_snow_particles');
    if (snowParticlesObj && snowParticlesObj instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
      const snowParticles = snowParticlesObj as Phaser.GameObjects.Particles.ParticleEmitter;
      snowParticles.stop();
      snowParticles.destroy();
    }

    // 调用父类方法进行基础清理
    super.deactivate(obj);
  }
}
