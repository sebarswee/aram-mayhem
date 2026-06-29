import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../../VisualEffectPool';

/**
 * 闪电箭效果配置
 */
export interface LightningBoltEffectConfig extends VisualEffectConfig {
  /** 飞行角度 */
  angle: number;
  /** 持续时间 */
  duration?: number;
}

/**
 * 闪电箭效果对象池
 *
 * 管理 LightningBolt 技能的视觉效果复用
 * - 2 层电光光晕（circle）
 * - 主闪电体图形（graphics）
 * - 电弧细节（graphics）
 * - 电荷粒子发射器
 * - 多个无限循环 tween（闪烁、脉动、抖动）
 *
 * 特点：快速闪烁，电弧抖动效果
 */
export class LightningBoltEffectPool extends VisualEffectPool<LightningBoltEffectConfig> {
  constructor(scene: Phaser.Scene, initialSize: number = 5) {
    super(
      scene,
      () => (this as any)._createFn(),
      (obj, config: LightningBoltEffectConfig) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'LightningBoltEffectPool', skipInitialWarmUp: true }
    );

    (this as any)._createFn = this.createLightningBoltEffect.bind(this);
    (this as any)._resetFn = this.resetLightningBoltEffect.bind(this);

    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建闪电箭效果容器
   */
  private createLightningBoltEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建电光光晕
    const outerGlow = this.scene.add.circle(0, 0, 22, 0xffff00, 0.15);
    outerGlow.setName('lightning_outer_glow');
    container.add(outerGlow);

    const midGlow = this.scene.add.circle(0, 0, 16, 0xffff00, 0.25);
    midGlow.setName('lightning_mid_glow');
    container.add(midGlow);

    // 预创建主闪电体
    const bolt = this.scene.add.graphics();
    bolt.setName('lightning_bolt');
    container.add(bolt);

    // 预创建电弧细节
    const arcDetail = this.scene.add.graphics();
    arcDetail.setName('lightning_arc');
    container.add(arcDetail);

    container.setDepth(40);
    return container;
  }

  /**
   * 重置并配置闪电箭效果
   */
  private resetLightningBoltEffect(
    container: Phaser.GameObjects.Container,
    config: LightningBoltEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);
    container.setRotation(config.angle);
    container.setAlpha(1);

    // 重置光晕
    const outerGlow = container.getByName('lightning_outer_glow') as Phaser.GameObjects.Arc;
    if (outerGlow) {
      outerGlow.setRadius(22);
      outerGlow.setFillStyle(0xffff00, 0.15);
      outerGlow.setScale(1, 1);
      outerGlow.setAlpha(0.15);
    }

    const midGlow = container.getByName('lightning_mid_glow') as Phaser.GameObjects.Arc;
    if (midGlow) {
      midGlow.setRadius(16);
      midGlow.setFillStyle(0xffff00, 0.25);
      midGlow.setScale(1, 1);
      midGlow.setAlpha(0.25);
    }

    // 重置主闪电体
    const bolt = container.getByName('lightning_bolt') as Phaser.GameObjects.Graphics;
    if (bolt) {
      bolt.clear();
      // 核心闪电
      bolt.fillStyle(0xffffff, 1);
      bolt.fillRect(-1, -20, 2, 10);
      bolt.fillRect(-3, -10, 6, 4);
      bolt.fillRect(1, -8, 4, 8);
      bolt.fillRect(-3, -2, 6, 4);
      bolt.fillRect(-1, 0, 2, 20);

      // 外层闪电
      bolt.fillStyle(0xffff00, 0.9);
      bolt.fillRect(-3, -18, 6, 8);
      bolt.fillRect(-5, -12, 10, 6);
      bolt.fillRect(-1, -10, 8, 10);
      bolt.fillRect(-5, -4, 10, 6);
      bolt.fillRect(-3, 0, 6, 18);
    }

    // 重置电弧细节
    const arcDetail = container.getByName('lightning_arc') as Phaser.GameObjects.Graphics;
    if (arcDetail) {
      arcDetail.clear();
      arcDetail.lineStyle(2, 0xffffff, 0.8);
      arcDetail.lineBetween(-8, -14, -4, -10);
      arcDetail.lineBetween(8, -6, 4, -2);
      arcDetail.lineBetween(-6, 4, -2, 8);
      arcDetail.lineBetween(6, 10, 10, 6);
    }

    // 创建电荷粒子发射器
    const chargeParticles = this.scene.add.particles(0, 0, 'particle_lightning_arc', {
      speed: { min: 30, max: 80 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0xffff00, 0xffffff, 0xffffaa],
      lifespan: 200,
      frequency: 20,
      quantity: 3,
    });
    container.add(chargeParticles);
    this.addManagedParticle(container, chargeParticles, { autoStop: true, autoDestroy: true });

    // 添加动画
    // 快速闪烁（无限）
    this.addManagedTween(container, {
      targets: container,
      alpha: 0.6,
      duration: 40,
      yoyo: true,
      repeat: -1,
    });

    // 光晕脉动（无限）
    this.addManagedTween(container, {
      targets: [outerGlow, midGlow],
      scale: 1.3,
      alpha: 0.1,
      duration: 100,
      yoyo: true,
      repeat: -1,
    });

    // 电弧抖动（无限）
    this.addManagedTween(container, {
      targets: arcDetail,
      x: { from: -2, to: 2 },
      duration: 30,
      yoyo: true,
      repeat: -1,
    });

    // 设置自动回收
    const duration = config.duration || 5000;
    this.setEffectDuration(container, duration);
  }

  /**
   * 停用效果时的额外清理
   */
  protected deactivate(obj: Phaser.GameObjects.Container): void {
    // 清理 graphics
    const bolt = obj.getByName('lightning_bolt') as Phaser.GameObjects.Graphics;
    if (bolt) bolt.clear();

    const arcDetail = obj.getByName('lightning_arc') as Phaser.GameObjects.Graphics;
    if (arcDetail) arcDetail.clear();

    // 调用父类方法进行基础清理
    super.deactivate(obj);
  }
}
