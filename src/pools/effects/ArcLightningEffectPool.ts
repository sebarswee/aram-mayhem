import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../VisualEffectPool';

/**
 * 电弧闪电效果配置
 */
export interface ArcLightningEffectConfig extends VisualEffectConfig {
  range: number;
  pulseWidth: number;
  duration: number;
}

/**
 * 电弧闪电效果对象池
 *
 * 管理 ArcLightning 技能的视觉效果复用
 * - 4 层脉冲环（circle）
 * - 中心爆发图形（graphics）
 * - 电荷粒子发射器
 * - 瞬态效果（约 650ms）
 */
export class ArcLightningEffectPool extends VisualEffectPool<ArcLightningEffectConfig> {
  constructor(scene: Phaser.Scene, initialSize: number = 5) {
    super(
      scene,
      () => (this as any)._createFn(),
      (obj, config: ArcLightningEffectConfig) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'ArcLightningEffectPool', skipInitialWarmUp: true }
    );

    (this as any)._createFn = this.createArcLightningEffect.bind(this);
    (this as any)._resetFn = this.resetArcLightningEffect.bind(this);

    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建电弧闪电效果容器
   */
  private createArcLightningEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建中心爆发图形
    const centerBurst = this.scene.add.graphics();
    centerBurst.setName('arc_center_burst');
    container.add(centerBurst);

    // 预创建4层脉冲环
    for (let i = 0; i < 4; i++) {
      const pulse = this.scene.add.circle(0, 0, 25, 0xffff00, 0.5 - i * 0.1);
      pulse.setStrokeStyle(5 - i, 0xffffff, 0.9 - i * 0.15);
      pulse.setName(`arc_pulse_${i}`);
      container.add(pulse);
    }

    container.setDepth(98);
    return container;
  }

  /**
   * 重置并配置电弧闪电效果
   */
  private resetArcLightningEffect(
    container: Phaser.GameObjects.Container,
    config: ArcLightningEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);

    // 重置中心爆发图形
    const centerBurst = container.getByName('arc_center_burst') as Phaser.GameObjects.Graphics;
    if (centerBurst) {
      centerBurst.clear();
      centerBurst.fillStyle(0xffffff, 0.95);
      centerBurst.fillCircle(0, 0, 20);
      centerBurst.fillStyle(0xffff00, 0.9);
      centerBurst.fillCircle(0, 0, 30);
      centerBurst.setDepth(98);

      // 中心闪光动画
      this.scene.tweens.add({
        targets: centerBurst,
        scale: 1.5,
        alpha: 0,
        duration: 200,
      });
    }

    // 收集所有脉冲环
    const pulses: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 4; i++) {
      const pulse = container.getByName(`arc_pulse_${i}`) as Phaser.GameObjects.Arc;
      if (pulse) {
        pulse.setRadius(25);
        pulse.setFillStyle(0xffff00, 0.5 - i * 0.1);
        pulse.setStrokeStyle(5 - i, 0xffffff, 0.9 - i * 0.15);
        pulse.setPosition(0, 0);
        pulse.setScale(1, 1);
        pulse.setAlpha(0.9 - i * 0.15);
        pulse.setDepth(99 + i);
        pulses.push(pulse);
      }
    }

    // 脉冲扩散动画
    this.scene.tweens.add({
      targets: pulses,
      radius: config.range,
      alpha: 0,
      duration: 650,
    });

    // 创建电荷粒子发射器
    const chargeParticles = this.scene.add.particles(config.x, config.y, 'particle_lightning_arc', {
      speed: { min: 100, max: 250 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.8, end: 0 },
      tint: [0xffff00, 0xffffff, 0xffffaa],
      lifespan: 300,
      frequency: 20,
      quantity: 5,
      emitting: false,
    });
    chargeParticles.setName('arc_charge_particles');
    chargeParticles.setDepth(103);
    chargeParticles.start();

    // 设置自动回收
    const duration = config.duration || 700;
    this.scene.time.delayedCall(duration, () => {
      this.release(container);
    });
  }

  /**
   * 停用效果时的额外清理
   */
  protected deactivate(obj: Phaser.GameObjects.Container): void {
    // 停止粒子发射
    const particlesObj = obj.getByName('arc_charge_particles');
    if (particlesObj && particlesObj instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
      const particles = particlesObj as Phaser.GameObjects.Particles.ParticleEmitter;
      particles.stop();
      particles.destroy();
    }

    // 清理 graphics
    const centerBurst = obj.getByName('arc_center_burst') as Phaser.GameObjects.Graphics;
    if (centerBurst) centerBurst.clear();

    // 调用父类方法进行基础清理
    super.deactivate(obj);
  }
}
