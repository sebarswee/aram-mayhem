import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../../VisualEffectPool';

/**
 * 火球效果配置
 */
export interface FireballEffectConfig extends VisualEffectConfig {
  /** 飞行角度 */
  angle: number;
  /** 持续时间 */
  duration?: number;
}

/**
 * 火球效果对象池
 *
 * 管理 Fireball 技能的视觉效果复用
 * - 7 层火焰核心（circle）
 * - 2 个火焰纹理细节（graphics）
 * - 拖尾粒子发射器
 * - 多个无限循环 tween（旋转、脉动、闪烁）
 *
 * 特点：飞行中有持续效果，需要管理无限 tween
 */
export class FireballEffectPool extends VisualEffectPool<FireballEffectConfig> {
  constructor(scene: Phaser.Scene, initialSize: number = 5) {
    super(
      scene,
      () => (this as any)._createFn(),
      (obj, config: FireballEffectConfig) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'FireballEffectPool', skipInitialWarmUp: true }
    );

    (this as any)._createFn = this.createFireballEffect.bind(this);
    (this as any)._resetFn = this.resetFireballEffect.bind(this);

    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建火球效果容器
   */
  private createFireballEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建 7 层火焰核心
    const coreCenter = this.scene.add.circle(0, 0, 6, 0xffffff, 1);
    coreCenter.setName('fire_core_center');
    container.add(coreCenter);

    const coreInner = this.scene.add.circle(0, 0, 10, 0xffff00, 0.95);
    coreInner.setName('fire_core_inner');
    container.add(coreInner);

    const coreMid = this.scene.add.circle(0, 0, 14, 0xffaa00, 0.85);
    coreMid.setName('fire_core_mid');
    container.add(coreMid);

    const coreOuter = this.scene.add.circle(0, 0, 18, 0xff6600, 0.7);
    coreOuter.setName('fire_core_outer');
    container.add(coreOuter);

    const glowInner = this.scene.add.circle(0, 0, 24, 0xff4400, 0.5);
    glowInner.setName('fire_glow_inner');
    container.add(glowInner);

    const glowMid = this.scene.add.circle(0, 0, 30, 0xff2200, 0.3);
    glowMid.setName('fire_glow_mid');
    container.add(glowMid);

    const glowOuter = this.scene.add.circle(0, 0, 38, 0xff0000, 0.15);
    glowOuter.setName('fire_glow_outer');
    container.add(glowOuter);

    // 预创建火焰纹理细节
    const flameDetail1 = this.scene.add.graphics();
    flameDetail1.setName('fire_flame_detail1');
    container.add(flameDetail1);

    const flameDetail2 = this.scene.add.graphics();
    flameDetail2.setName('fire_flame_detail2');
    container.add(flameDetail2);

    container.setDepth(40);
    return container;
  }

  /**
   * 重置并配置火球效果
   */
  private resetFireballEffect(
    container: Phaser.GameObjects.Container,
    config: FireballEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);
    container.setRotation(config.angle);

    // 重置火焰核心层
    const coreCenter = container.getByName('fire_core_center') as Phaser.GameObjects.Arc;
    if (coreCenter) {
      coreCenter.setRadius(6);
      coreCenter.setFillStyle(0xffffff, 1);
      coreCenter.setScale(1, 1);
      coreCenter.setAlpha(1);
    }

    const coreInner = container.getByName('fire_core_inner') as Phaser.GameObjects.Arc;
    if (coreInner) {
      coreInner.setRadius(10);
      coreInner.setFillStyle(0xffff00, 0.95);
      coreInner.setScale(1, 1);
      coreInner.setAlpha(0.95);
    }

    const coreMid = container.getByName('fire_core_mid') as Phaser.GameObjects.Arc;
    if (coreMid) {
      coreMid.setRadius(14);
      coreMid.setFillStyle(0xffaa00, 0.85);
      coreMid.setScale(1, 1);
      coreMid.setAlpha(0.85);
    }

    const coreOuter = container.getByName('fire_core_outer') as Phaser.GameObjects.Arc;
    if (coreOuter) {
      coreOuter.setRadius(18);
      coreOuter.setFillStyle(0xff6600, 0.7);
      coreOuter.setScale(1, 1);
      coreOuter.setAlpha(0.7);
    }

    const glowInner = container.getByName('fire_glow_inner') as Phaser.GameObjects.Arc;
    if (glowInner) {
      glowInner.setRadius(24);
      glowInner.setFillStyle(0xff4400, 0.5);
      glowInner.setScale(1, 1);
      glowInner.setAlpha(0.5);
    }

    const glowMid = container.getByName('fire_glow_mid') as Phaser.GameObjects.Arc;
    if (glowMid) {
      glowMid.setRadius(30);
      glowMid.setFillStyle(0xff2200, 0.3);
      glowMid.setScale(1, 1);
      glowMid.setAlpha(0.3);
    }

    const glowOuter = container.getByName('fire_glow_outer') as Phaser.GameObjects.Arc;
    if (glowOuter) {
      glowOuter.setRadius(38);
      glowOuter.setFillStyle(0xff0000, 0.15);
      glowOuter.setScale(1, 1);
      glowOuter.setAlpha(0.15);
    }

    // 重置火焰纹理细节
    const flameDetail1 = container.getByName('fire_flame_detail1') as Phaser.GameObjects.Graphics;
    if (flameDetail1) {
      flameDetail1.clear();
      flameDetail1.fillStyle(0xffff00, 0.6);
      flameDetail1.fillTriangle(0, -12, -4, -4, 4, -4);
      flameDetail1.fillTriangle(0, 12, -4, 4, 4, 4);
    }

    const flameDetail2 = container.getByName('fire_flame_detail2') as Phaser.GameObjects.Graphics;
    if (flameDetail2) {
      flameDetail2.clear();
      flameDetail2.fillStyle(0xffaa00, 0.5);
      flameDetail2.fillTriangle(-8, 0, -14, -6, -14, 6);
      flameDetail2.fillTriangle(8, 0, 14, -6, 14, 6);
    }

    // 创建拖尾粒子发射器
    const trailParticles = this.scene.add.particles(0, 0, 'particle_fire_spark', {
      speed: { min: 20, max: 60 },
      angle: { min: 160, max: 200 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.8, end: 0 },
      tint: [0xff4400, 0xff6600, 0xffaa00, 0xffff00],
      lifespan: 300,
      frequency: 30,
      quantity: 2,
    });
    container.add(trailParticles);
    this.addManagedParticle(container, trailParticles, { autoStop: true, autoDestroy: true });

    // 添加动画
    // 主旋转动画（无限）
    this.addManagedTween(container, {
      targets: container,
      angle: container.angle + 360,
      duration: 400,
      repeat: -1,
    });

    // 多层脉动效果（无限）
    this.addManagedTween(container, {
      targets: [coreOuter, glowInner],
      scaleX: 1.15,
      scaleY: 1.15,
      alpha: 0.6,
      duration: 150,
      yoyo: true,
      repeat: -1,
    });

    this.addManagedTween(container, {
      targets: [glowMid, glowOuter],
      scaleX: 1.25,
      scaleY: 1.25,
      alpha: 0.2,
      duration: 200,
      yoyo: true,
      repeat: -1,
      delay: 50,
    });

    // 火焰细节摆动（无限）
    this.addManagedTween(container, {
      targets: [flameDetail1, flameDetail2],
      scaleX: 1.1,
      scaleY: 0.9,
      duration: 100,
      yoyo: true,
      repeat: -1,
    });

    // 核心闪烁（无限）
    this.addManagedTween(container, {
      targets: coreCenter,
      alpha: 0.8,
      scale: 1.3,
      duration: 80,
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
    const flameDetail1 = obj.getByName('fire_flame_detail1') as Phaser.GameObjects.Graphics;
    if (flameDetail1) flameDetail1.clear();

    const flameDetail2 = obj.getByName('fire_flame_detail2') as Phaser.GameObjects.Graphics;
    if (flameDetail2) flameDetail2.clear();

    // 调用父类方法进行基础清理
    super.deactivate(obj);
  }
}
