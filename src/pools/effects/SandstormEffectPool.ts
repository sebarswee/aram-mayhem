import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../VisualEffectPool';

/**
 * 沙暴效果配置
 */
export interface SandstormEffectConfig extends VisualEffectConfig {
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
 * 沙暴效果对象池
 *
 * 管理 Sandstorm 技能的视觉效果复用
 * - 4 层流沙区域（circle）
 * - 1 个沙尘粒子发射器
 * - 1 个漩涡容器（4个旋转环）
 * - 4 个无限循环 tween（旋转）
 */
export class SandstormEffectPool extends VisualEffectPool<SandstormEffectConfig> {
  constructor(scene: Phaser.Scene, initialSize: number = 5) {
    super(
      scene,
      () => (this as any)._createFn(),
      (obj, config: SandstormEffectConfig) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'SandstormEffectPool', skipInitialWarmUp: true }
    );

    (this as any)._createFn = this.createSandstormEffect.bind(this);
    (this as any)._resetFn = this.resetSandstormEffect.bind(this);

    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建沙暴效果容器
   */
  private createSandstormEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建4层流沙区域
    for (let i = 0; i < 4; i++) {
      const layer = this.scene.add.circle(0, 0, 100, 0x886633, 0.35);
      layer.setName(`sandstorm_layer_${i}`);
      container.add(layer);
    }

    // 预创建漩涡容器
    const vortex = this.scene.add.container(0, 0);
    vortex.setName('sandstorm_vortex');
    vortex.setDepth(18);

    // 预创建4个旋转环
    for (let i = 0; i < 4; i++) {
      const ring = this.scene.add.graphics();
      ring.lineStyle(3 - i * 0.5, 0x997744, 0.5 - i * 0.1);
      ring.strokeCircle(0, 0, 50);
      ring.setName(`sandstorm_ring_${i}`);
      vortex.add(ring);
    }
    container.add(vortex);

    container.setDepth(17);
    return container;
  }

  /**
   * 重置并配置沙暴效果
   */
  private resetSandstormEffect(
    container: Phaser.GameObjects.Container,
    config: SandstormEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);

    // 重置流沙区域
    config.layerConfigs.forEach((layerConfig, i) => {
      const layer = container.getByName(`sandstorm_layer_${i}`) as Phaser.GameObjects.Arc;
      if (layer) {
        layer.setRadius(layerConfig.radius);
        layer.setFillStyle(layerConfig.color, layerConfig.alpha);
        layer.setPosition(0, 0);
        layer.setScale(1, 1);
        layer.setAlpha(layerConfig.alpha);
        layer.setDepth(17 + i);
      }
    });

    // 重置漩涡环
    const vortex = container.getByName('sandstorm_vortex') as Phaser.GameObjects.Container;
    if (vortex) {
      vortex.list.forEach((ring, i) => {
        const graphics = ring as Phaser.GameObjects.Graphics;
        graphics.clear();
        graphics.lineStyle(3 - i * 0.5, 0x997744, 0.5 - i * 0.1);
        graphics.strokeCircle(0, 0, config.radius * (0.3 + i * 0.2));
        graphics.setAngle(0);

        // 旋转动画（无限循环 tween 需要托管以便正确清理）
        const tween = this.scene.tweens.add({
          targets: graphics,
          angle: 360 * (i % 2 === 0 ? 1 : -1),
          duration: 1500 + i * 300,
          repeat: -1,
        });
        this.addManagedTween(container, tween, { autoStop: true, tag: 'vortex_rotation' });
      });
    }

    // 创建沙尘粒子发射器
    const sandParticles = this.scene.add.particles(config.x, config.y, 'particle_glow', {
      speed: { min: 20, max: 60 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.5, end: 0 },
      tint: [0x886633, 0x997744, 0xaa8855],
      lifespan: 1000,
      frequency: 60,
      quantity: 3,
      emitting: false,
      emitZone: {
        type: 'random' as const,
        source: new Phaser.Geom.Circle(0, 0, config.radius * 0.9) as Phaser.Types.GameObjects.Particles.RandomZoneSource,
      },
    });
    sandParticles.setName('sandstorm_particles');
    sandParticles.setDepth(22);
    sandParticles.start();

    // 设置自动回收
    if (config.duration && config.duration > 0) {
      this.setEffectDuration(container, config.duration);
    }
  }

  /**
   * 停用效果时的额外清理
   */
  protected deactivate(obj: Phaser.GameObjects.Container): void {
    // 停止并清理托管的旋转 tween
    this.stopTweensByTag(obj, 'vortex_rotation');

    // 停止粒子发射
    const particlesObj = obj.getByName('sandstorm_particles');
    if (particlesObj && particlesObj instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
      const particles = particlesObj as Phaser.GameObjects.Particles.ParticleEmitter;
      particles.stop();
      particles.destroy();
    }

    // 调用父类方法进行基础清理
    super.deactivate(obj);
  }
}
