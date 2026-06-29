import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../VisualEffectPool';

/**
 * 火焰波效果配置
 */
export interface FlameWaveEffectConfig extends VisualEffectConfig {
  range: number;
  coneAngle: number;
  duration: number;
}

/**
 * 火焰波效果对象池
 *
 * 管理 FlameWave 技能的视觉效果复用
 * - 4 层锥形视觉（graphics）
 * - 2 个粒子发射器（火焰和火花）
 * - 持续约 1.5 秒
 */
export class FlameWaveEffectPool extends VisualEffectPool<FlameWaveEffectConfig> {
  constructor(scene: Phaser.Scene, initialSize: number = 5) {
    super(
      scene,
      () => (this as any)._createFn(),
      (obj, config: FlameWaveEffectConfig) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'FlameWaveEffectPool', skipInitialWarmUp: true }
    );

    (this as any)._createFn = this.createFlameWaveEffect.bind(this);
    (this as any)._resetFn = this.resetFlameWaveEffect.bind(this);

    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建火焰波效果容器
   */
  private createFlameWaveEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建4层锥形视觉
    for (let i = 0; i < 4; i++) {
      const cone = this.scene.add.graphics();
      cone.setName(`flame_cone_${i}`);
      container.add(cone);
    }

    container.setDepth(24);
    return container;
  }

  /**
   * 重置并配置火焰波效果
   */
  private resetFlameWaveEffect(
    container: Phaser.GameObjects.Container,
    config: FlameWaveEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);

    const coneAngle = config.coneAngle;
    const range = config.range;

    // 锥形配置
    const coneConfigs = [
      { radius: range * 1.1, color: 0xff2200, alpha: 0.25, depth: 24 },
      { radius: range * 0.85, color: 0xff6600, alpha: 0.35, depth: 25 },
      { radius: range * 0.6, color: 0xffaa00, alpha: 0.5, depth: 26 },
      { radius: range * 0.35, color: 0xffff00, alpha: 0.6, depth: 27 },
    ];

    // 重置锥形视觉
    coneConfigs.forEach((coneConfig, i) => {
      const cone = container.getByName(`flame_cone_${i}`) as Phaser.GameObjects.Graphics;
      if (cone) {
        cone.clear();
        cone.fillStyle(coneConfig.color, coneConfig.alpha);
        cone.beginPath();
        cone.moveTo(0, 0);
        cone.arc(0, 0, coneConfig.radius, -coneAngle / 2, coneAngle / 2);
        cone.closePath();
        cone.fill();
        cone.setDepth(coneConfig.depth);
      }
    });

    // 创建火焰粒子发射器
    const fireParticles = this.scene.add.particles(config.x, config.y, 'particle_fire_core', {
      speed: { min: 150, max: 350 },
      angle: { min: -coneAngle / 2 * 180 / Math.PI, max: coneAngle / 2 * 180 / Math.PI },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.9, end: 0 },
      tint: [0xff4400, 0xff6600, 0xffaa00, 0xffff00],
      lifespan: 400,
      frequency: 30,
      quantity: 3,
      emitting: false,
    });
    fireParticles.setName('flame_fire_particles');
    fireParticles.setDepth(28);
    fireParticles.start();

    // 创建火花粒子发射器
    const sparkParticles = this.scene.add.particles(config.x, config.y, 'particle_fire_spark', {
      speed: { min: 200, max: 400 },
      angle: { min: -coneAngle / 2 * 180 / Math.PI, max: coneAngle / 2 * 180 / Math.PI },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0xffffff, 0xffff00, 0xffaa00],
      lifespan: 300,
      frequency: 40,
      quantity: 2,
      emitting: false,
    });
    sparkParticles.setName('flame_spark_particles');
    sparkParticles.setDepth(29);
    sparkParticles.start();

    // 收集所有锥形
    const cones: Phaser.GameObjects.Graphics[] = [];
    for (let i = 0; i < 4; i++) {
      const cone = container.getByName(`flame_cone_${i}`) as Phaser.GameObjects.Graphics;
      if (cone) cones.push(cone);
    }

    // 消失动画
    this.scene.tweens.add({
      targets: cones,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 600,
    });

    // 设置自动回收
    const duration = config.duration || 1500;
    this.scene.time.delayedCall(duration, () => {
      this.release(container);
    });
  }

  /**
   * 停用效果时的额外清理
   */
  protected deactivate(obj: Phaser.GameObjects.Container): void {
    // 停止粒子发射
    const fireParticles = obj.getByName('flame_fire_particles') as Phaser.GameObjects.Particles.ParticleEmitter;
    if (fireParticles) {
      fireParticles.stop();
      fireParticles.destroy();
    }

    const sparkParticles = obj.getByName('flame_spark_particles') as Phaser.GameObjects.Particles.ParticleEmitter;
    if (sparkParticles) {
      sparkParticles.stop();
      sparkParticles.destroy();
    }

    // 清理 graphics
    for (let i = 0; i < 4; i++) {
      const cone = obj.getByName(`flame_cone_${i}`) as Phaser.GameObjects.Graphics;
      if (cone) cone.clear();
    }

    // 调用父类方法进行基础清理
    super.deactivate(obj);
  }
}
