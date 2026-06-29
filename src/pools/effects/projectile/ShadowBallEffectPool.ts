import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../../VisualEffectPool';

/**
 * 暗影球效果配置
 */
export interface ShadowBallEffectConfig extends VisualEffectConfig {
  /** 飞行角度 */
  angle: number;
  /** 持续时间 */
  duration?: number;
}

/**
 * 暗影球效果对象池
 *
 * 管理 ShadowBolt 技能的视觉效果复用
 * - 6 层暗影核心（circle）
 * - 暗影漩涡纹理（graphics）
 * - 2 个暗影触手（graphics）
 * - 拖尾粒子发射器
 * - 多个无限循环 tween（旋转、脉动、闪烁、摆动）
 *
 * 特点：漩涡旋转，触手摆动
 */
export class ShadowBallEffectPool extends VisualEffectPool<ShadowBallEffectConfig> {
  constructor(scene: Phaser.Scene, initialSize: number = 5) {
    super(
      scene,
      () => (this as any)._createFn(),
      (obj, config: ShadowBallEffectConfig) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'ShadowBallEffectPool', skipInitialWarmUp: true }
    );

    (this as any)._createFn = this.createShadowBallEffect.bind(this);
    (this as any)._resetFn = this.resetShadowBallEffect.bind(this);

    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建暗影球效果容器
   */
  private createShadowBallEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建 6 层暗影核心
    const coreCenter = this.scene.add.circle(0, 0, 5, 0xaa44ff, 1);
    coreCenter.setName('shadow_core_center');
    container.add(coreCenter);

    const coreInner = this.scene.add.circle(0, 0, 9, 0x8800ff, 0.9);
    coreInner.setName('shadow_core_inner');
    container.add(coreInner);

    const coreMid = this.scene.add.circle(0, 0, 14, 0x6600cc, 0.7);
    coreMid.setName('shadow_core_mid');
    container.add(coreMid);

    const coreOuter = this.scene.add.circle(0, 0, 20, 0x4400aa, 0.5);
    coreOuter.setName('shadow_core_outer');
    container.add(coreOuter);

    const glowInner = this.scene.add.circle(0, 0, 26, 0x6600aa, 0.3);
    glowInner.setName('shadow_glow_inner');
    container.add(glowInner);

    const glowOuter = this.scene.add.circle(0, 0, 34, 0x440088, 0.15);
    glowOuter.setName('shadow_glow_outer');
    container.add(glowOuter);

    // 预创建暗影漩涡纹理
    const vortex = this.scene.add.graphics();
    vortex.setName('shadow_vortex');
    container.add(vortex);

    // 预创建暗影触手
    const tentacle1 = this.scene.add.graphics();
    tentacle1.setName('shadow_tentacle1');
    container.add(tentacle1);

    const tentacle2 = this.scene.add.graphics();
    tentacle2.setName('shadow_tentacle2');
    container.add(tentacle2);

    container.setDepth(40);
    return container;
  }

  /**
   * 重置并配置暗影球效果
   */
  private resetShadowBallEffect(
    container: Phaser.GameObjects.Container,
    config: ShadowBallEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);
    container.setRotation(config.angle);
    container.setAlpha(1);

    // 重置暗影核心层
    const coreCenter = container.getByName('shadow_core_center') as Phaser.GameObjects.Arc;
    if (coreCenter) {
      coreCenter.setRadius(5);
      coreCenter.setFillStyle(0xaa44ff, 1);
      coreCenter.setScale(1, 1);
      coreCenter.setAlpha(1);
    }

    const coreInner = container.getByName('shadow_core_inner') as Phaser.GameObjects.Arc;
    if (coreInner) {
      coreInner.setRadius(9);
      coreInner.setFillStyle(0x8800ff, 0.9);
      coreInner.setScale(1, 1);
      coreInner.setAlpha(0.9);
    }

    const coreMid = container.getByName('shadow_core_mid') as Phaser.GameObjects.Arc;
    if (coreMid) {
      coreMid.setRadius(14);
      coreMid.setFillStyle(0x6600cc, 0.7);
      coreMid.setScale(1, 1);
      coreMid.setAlpha(0.7);
    }

    const coreOuter = container.getByName('shadow_core_outer') as Phaser.GameObjects.Arc;
    if (coreOuter) {
      coreOuter.setRadius(20);
      coreOuter.setFillStyle(0x4400aa, 0.5);
      coreOuter.setScale(1, 1);
      coreOuter.setAlpha(0.5);
    }

    const glowInner = container.getByName('shadow_glow_inner') as Phaser.GameObjects.Arc;
    if (glowInner) {
      glowInner.setRadius(26);
      glowInner.setFillStyle(0x6600aa, 0.3);
      glowInner.setScale(1, 1);
      glowInner.setAlpha(0.3);
    }

    const glowOuter = container.getByName('shadow_glow_outer') as Phaser.GameObjects.Arc;
    if (glowOuter) {
      glowOuter.setRadius(34);
      glowOuter.setFillStyle(0x440088, 0.15);
      glowOuter.setScale(1, 1);
      glowOuter.setAlpha(0.15);
    }

    // 重置暗影漩涡纹理
    const vortex = container.getByName('shadow_vortex') as Phaser.GameObjects.Graphics;
    if (vortex) {
      vortex.clear();
      vortex.lineStyle(2, 0x8800ff, 0.6);
      for (let i = 0; i < 3; i++) {
        const radius = 10 + i * 4;
        vortex.strokeCircle(0, 0, radius);
      }
    }

    // 重置暗影触手
    const tentacle1 = container.getByName('shadow_tentacle1') as Phaser.GameObjects.Graphics;
    if (tentacle1) {
      tentacle1.clear();
      tentacle1.fillStyle(0x6600aa, 0.6);
      tentacle1.fillTriangle(-12, -6, -20, -10, -18, 2);
    }

    const tentacle2 = container.getByName('shadow_tentacle2') as Phaser.GameObjects.Graphics;
    if (tentacle2) {
      tentacle2.clear();
      tentacle2.fillStyle(0x6600aa, 0.6);
      tentacle2.fillTriangle(12, 6, 20, 2, 18, 14);
    }

    // 创建拖尾粒子发射器
    const trailParticles = this.scene.add.particles(0, 0, 'particle_glow', {
      speed: { min: 10, max: 40 },
      angle: { min: 160, max: 200 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: [0x8800ff, 0x6600cc, 0xaa44ff],
      lifespan: 400,
      frequency: 35,
      quantity: 2,
    });
    container.add(trailParticles);
    this.addManagedParticle(container, trailParticles, { autoStop: true, autoDestroy: true });

    // 添加动画
    // 漩涡旋转（无限）
    this.addManagedTween(container, {
      targets: vortex,
      angle: 360,
      duration: 800,
      repeat: -1,
    });

    // 多层脉动（无限）
    this.addManagedTween(container, {
      targets: [coreMid, coreOuter],
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0.4,
      duration: 250,
      yoyo: true,
      repeat: -1,
    });

    this.addManagedTween(container, {
      targets: [glowInner, glowOuter],
      scaleX: 1.35,
      scaleY: 1.35,
      alpha: 0.08,
      duration: 350,
      yoyo: true,
      repeat: -1,
      delay: 100,
    });

    // 核心闪烁（无限）
    this.addManagedTween(container, {
      targets: coreCenter,
      alpha: 0.6,
      scale: 1.4,
      duration: 150,
      yoyo: true,
      repeat: -1,
    });

    // 触手摆动（无限）
    this.addManagedTween(container, {
      targets: [tentacle1, tentacle2],
      angle: { from: -15, to: 15 },
      duration: 200,
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
    // 清理所有 graphics
    const vortex = obj.getByName('shadow_vortex') as Phaser.GameObjects.Graphics;
    if (vortex) vortex.clear();

    const tentacle1 = obj.getByName('shadow_tentacle1') as Phaser.GameObjects.Graphics;
    if (tentacle1) tentacle1.clear();

    const tentacle2 = obj.getByName('shadow_tentacle2') as Phaser.GameObjects.Graphics;
    if (tentacle2) tentacle2.clear();

    // 调用父类方法进行基础清理
    super.deactivate(obj);
  }
}
