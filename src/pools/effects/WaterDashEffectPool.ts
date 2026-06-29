import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../VisualEffectPool';

/**
 * 水流冲刺效果配置
 */
export interface WaterDashEffectConfig extends VisualEffectConfig {
  dashDistance: number;
  trailWidth: number;
  duration: number;
}

/**
 * 水流冲刺效果对象池
 *
 * 管理 WaterDash 技能的视觉效果复用
 * - 3 层水迹轨迹（graphics）
 * - 1 个水花粒子发射器
 * - 持续约 2 秒
 */
export class WaterDashEffectPool extends VisualEffectPool<WaterDashEffectConfig> {
  constructor(scene: Phaser.Scene, initialSize: number = 5) {
    super(
      scene,
      () => (this as any)._createFn(),
      (obj, config: WaterDashEffectConfig) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'WaterDashEffectPool', skipInitialWarmUp: true }
    );

    (this as any)._createFn = this.createWaterDashEffect.bind(this);
    (this as any)._resetFn = this.resetWaterDashEffect.bind(this);

    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建水流冲刺效果容器
   */
  private createWaterDashEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建3层水迹轨迹
    const trailOuter = this.scene.add.graphics();
    trailOuter.setName('water_trail_outer');
    container.add(trailOuter);

    const trailMid = this.scene.add.graphics();
    trailMid.setName('water_trail_mid');
    container.add(trailMid);

    const trailInner = this.scene.add.graphics();
    trailInner.setName('water_trail_inner');
    container.add(trailInner);

    container.setDepth(16);
    return container;
  }

  /**
   * 重置并配置水流冲刺效果
   */
  private resetWaterDashEffect(
    container: Phaser.GameObjects.Container,
    config: WaterDashEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);

    const dashDistance = config.dashDistance;
    const trailWidth = config.trailWidth;

    // 重置外层水迹
    const trailOuter = container.getByName('water_trail_outer') as Phaser.GameObjects.Graphics;
    if (trailOuter) {
      trailOuter.clear();
      trailOuter.fillStyle(0x2266cc, 0.25);
      trailOuter.fillRect(
        -dashDistance / 2 - trailWidth / 2 - 10,
        -trailWidth / 2 - 10,
        dashDistance + trailWidth + 20,
        trailWidth + 20
      );
      trailOuter.setDepth(16);
    }

    // 重置中层水迹
    const trailMid = container.getByName('water_trail_mid') as Phaser.GameObjects.Graphics;
    if (trailMid) {
      trailMid.clear();
      trailMid.fillStyle(0x4488ff, 0.35);
      trailMid.fillRect(
        -dashDistance / 2 - trailWidth / 2,
        -trailWidth / 2,
        dashDistance + trailWidth,
        trailWidth
      );
      trailMid.setDepth(17);
    }

    // 重置内层水迹
    const trailInner = container.getByName('water_trail_inner') as Phaser.GameObjects.Graphics;
    if (trailInner) {
      trailInner.clear();
      trailInner.fillStyle(0x66aaff, 0.45);
      trailInner.fillRect(
        -dashDistance / 2 - trailWidth / 2 + 10,
        -trailWidth / 2 + 10,
        dashDistance + trailWidth - 20,
        trailWidth - 20
      );
      trailInner.setDepth(18);
    }

    // 创建水花粒子发射器
    const splashParticles = this.scene.add.particles(config.x, config.y, 'particle_glow', {
      speed: { min: 50, max: 120 },
      angle: { min: 60, max: 120 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: [0x4488ff, 0x66aaff, 0x88ccff],
      lifespan: 600,
      frequency: 50,
      quantity: 2,
      emitting: false,
    });
    splashParticles.setName('water_splash_particles');
    splashParticles.setDepth(19);
    splashParticles.start();

    // 设置自动回收
    const duration = config.duration || 2000;

    this.setEffectDuration(container, duration);
  }

  /**
   * 停用效果时的额外清理
   */
  protected deactivate(obj: Phaser.GameObjects.Container): void {
    // 停止粒子发射
    const particlesObj = obj.getByName('water_splash_particles');
    if (particlesObj && particlesObj instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
      const particles = particlesObj as Phaser.GameObjects.Particles.ParticleEmitter;
      particles.stop();
      particles.destroy();
    }

    // 清理 graphics
    const trailOuter = obj.getByName('water_trail_outer') as Phaser.GameObjects.Graphics;
    if (trailOuter) trailOuter.clear();

    const trailMid = obj.getByName('water_trail_mid') as Phaser.GameObjects.Graphics;
    if (trailMid) trailMid.clear();

    const trailInner = obj.getByName('water_trail_inner') as Phaser.GameObjects.Graphics;
    if (trailInner) trailInner.clear();

    // 调用父类方法进行基础清理
    super.deactivate(obj);
  }
}
