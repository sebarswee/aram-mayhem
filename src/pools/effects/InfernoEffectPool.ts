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
    super(
      scene,
      // 创建函数
      () => this.createInfernoEffect(),
      // 重置函数
      (obj, config: InfernoEffectConfig) => this.resetInfernoEffect(obj, config),
      // 配置选项
      { initialSize, name: 'InfernoEffectPool' }
    );
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

        // 重新应用脉动 tween
        this.scene.tweens.add({
          targets: layer,
          scaleX: 1.08,
          scaleY: 1.08,
          alpha: layerConfig.alpha * 0.6,
          duration: 400,
          yoyo: true,
          repeat: -1,
        });
      }
    });

    // 重置粒子 - Phaser 3.60+
    const particles = container.getByName('inferno_particles') as Phaser.GameObjects.Particles.ParticleEmitter;
    if (particles) {
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
    const particles = obj.getByName('inferno_particles') as Phaser.GameObjects.Particles.ParticleEmitter;
    if (particles) {
      particles.stop();
    }

    // 调用父类方法进行基础清理
    super.deactivate(obj);
  }
}