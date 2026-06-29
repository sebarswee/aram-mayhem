import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../../VisualEffectPool';

/**
 * 水弹效果配置
 */
export interface WaterBulletEffectConfig extends VisualEffectConfig {
  /** 飞行角度 */
  angle: number;
  /** 持续时间 */
  duration?: number;
}

/**
 * 水弹效果对象池
 *
 * 管理 WaterBullet 技能的视觉效果复用
 * - 3 层水滴核心（graphics）
 * - 2 层水波纹（circle）
 * - 2 个高光点（circle）
 * - 水滴纹理线条（graphics）
 * - 拖尾粒子发射器
 * - 多个无限循环 tween（波动、波纹、闪烁）
 *
 * 特点：水滴波动效果，波纹扩散
 */
export class WaterBulletEffectPool extends VisualEffectPool<WaterBulletEffectConfig> {
  constructor(scene: Phaser.Scene, initialSize: number = 5) {
    super(
      scene,
      () => (this as any)._createFn(),
      (obj, config: WaterBulletEffectConfig) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'WaterBulletEffectPool', skipInitialWarmUp: true }
    );

    (this as any)._createFn = this.createWaterBulletEffect.bind(this);
    (this as any)._resetFn = this.resetWaterBulletEffect.bind(this);

    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建水弹效果容器
   */
  private createWaterBulletEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建水滴外层
    const dropOuter = this.scene.add.graphics();
    dropOuter.setName('water_drop_outer');
    container.add(dropOuter);

    // 预创建水滴中层
    const dropMid = this.scene.add.graphics();
    dropMid.setName('water_drop_mid');
    container.add(dropMid);

    // 预创建水滴内层
    const dropInner = this.scene.add.graphics();
    dropInner.setName('water_drop_inner');
    container.add(dropInner);

    // 预创建水波纹
    const ripple1 = this.scene.add.circle(0, 0, 18, 0x4488ff, 0.2);
    ripple1.setName('water_ripple1');
    container.add(ripple1);

    const ripple2 = this.scene.add.circle(0, 0, 24, 0x4488ff, 0.1);
    ripple2.setName('water_ripple2');
    container.add(ripple2);

    // 预创建高光点
    const highlight1 = this.scene.add.circle(-4, -4, 5, 0xffffff, 0.8);
    highlight1.setName('water_highlight1');
    container.add(highlight1);

    const highlight2 = this.scene.add.circle(-2, -6, 3, 0xffffff, 0.5);
    highlight2.setName('water_highlight2');
    container.add(highlight2);

    // 预创建水滴纹理线条
    const waterLines = this.scene.add.graphics();
    waterLines.setName('water_lines');
    container.add(waterLines);

    container.setDepth(40);
    return container;
  }

  /**
   * 重置并配置水弹效果
   */
  private resetWaterBulletEffect(
    container: Phaser.GameObjects.Container,
    config: WaterBulletEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);
    container.setScale(1, 1);
    container.setAlpha(1);

    // 重置水滴外层
    const dropOuter = container.getByName('water_drop_outer') as Phaser.GameObjects.Graphics;
    if (dropOuter) {
      dropOuter.clear();
      dropOuter.fillStyle(0x2266cc, 0.6);
      dropOuter.fillCircle(0, 2, 14);
      dropOuter.fillTriangle(0, -16, -10, 0, 10, 0);
    }

    // 重置水滴中层
    const dropMid = container.getByName('water_drop_mid') as Phaser.GameObjects.Graphics;
    if (dropMid) {
      dropMid.clear();
      dropMid.fillStyle(0x4488ff, 0.85);
      dropMid.fillCircle(0, 2, 11);
      dropMid.fillTriangle(0, -14, -8, 0, 8, 0);
    }

    // 重置水滴内层
    const dropInner = container.getByName('water_drop_inner') as Phaser.GameObjects.Graphics;
    if (dropInner) {
      dropInner.clear();
      dropInner.fillStyle(0x66aaff, 0.95);
      dropInner.fillCircle(0, 2, 8);
      dropInner.fillTriangle(0, -12, -6, 0, 6, 0);
    }

    // 重置水波纹
    const ripple1 = container.getByName('water_ripple1') as Phaser.GameObjects.Arc;
    if (ripple1) {
      ripple1.setRadius(18);
      ripple1.setFillStyle(0x4488ff, 0.2);
      ripple1.setScale(1, 1);
      ripple1.setAlpha(0.2);
    }

    const ripple2 = container.getByName('water_ripple2') as Phaser.GameObjects.Arc;
    if (ripple2) {
      ripple2.setRadius(24);
      ripple2.setFillStyle(0x4488ff, 0.1);
      ripple2.setScale(1, 1);
      ripple2.setAlpha(0.1);
    }

    // 重置高光点
    const highlight1 = container.getByName('water_highlight1') as Phaser.GameObjects.Arc;
    if (highlight1) {
      highlight1.setRadius(5);
      highlight1.setFillStyle(0xffffff, 0.8);
      highlight1.setPosition(-4, -4);
      highlight1.setAlpha(0.8);
    }

    const highlight2 = container.getByName('water_highlight2') as Phaser.GameObjects.Arc;
    if (highlight2) {
      highlight2.setRadius(3);
      highlight2.setFillStyle(0xffffff, 0.5);
      highlight2.setPosition(-2, -6);
      highlight2.setAlpha(0.5);
    }

    // 重置水滴纹理线条
    const waterLines = container.getByName('water_lines') as Phaser.GameObjects.Graphics;
    if (waterLines) {
      waterLines.clear();
      waterLines.lineStyle(1, 0xffffff, 0.3);
      waterLines.lineBetween(-4, 0, -2, -8);
      waterLines.lineBetween(0, -2, 0, -10);
    }

    // 创建拖尾粒子发射器
    const trailParticles = this.scene.add.particles(0, 0, 'particle_glow', {
      speed: { min: 10, max: 30 },
      angle: { min: 160, max: 200 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: [0x4488ff, 0x66aaff],
      lifespan: 400,
      frequency: 40,
      quantity: 1,
    });
    container.add(trailParticles);
    this.addManagedParticle(container, trailParticles, { autoStop: true, autoDestroy: true });

    // 添加动画
    // 水滴波动动画（无限）
    this.addManagedTween(container, {
      targets: container,
      scaleX: 1.08,
      scaleY: 0.92,
      duration: 120,
      yoyo: true,
      repeat: -1,
    });

    // 水波纹扩散（无限）
    this.addManagedTween(container, {
      targets: ripple1,
      scale: 1.3,
      alpha: 0,
      duration: 600,
      repeat: -1,
      onRepeat: () => {
        ripple1.setScale(1);
        ripple1.setAlpha(0.2);
      },
    });

    this.addManagedTween(container, {
      targets: ripple2,
      scale: 1.4,
      alpha: 0,
      duration: 800,
      delay: 200,
      repeat: -1,
      onRepeat: () => {
        ripple2.setScale(1);
        ripple2.setAlpha(0.1);
      },
    });

    // 高光闪烁（无限）
    this.addManagedTween(container, {
      targets: [highlight1, highlight2],
      alpha: 0.3,
      scale: 0.8,
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
    const dropOuter = obj.getByName('water_drop_outer') as Phaser.GameObjects.Graphics;
    if (dropOuter) dropOuter.clear();

    const dropMid = obj.getByName('water_drop_mid') as Phaser.GameObjects.Graphics;
    if (dropMid) dropMid.clear();

    const dropInner = obj.getByName('water_drop_inner') as Phaser.GameObjects.Graphics;
    if (dropInner) dropInner.clear();

    const waterLines = obj.getByName('water_lines') as Phaser.GameObjects.Graphics;
    if (waterLines) waterLines.clear();

    // 调用父类方法进行基础清理
    super.deactivate(obj);
  }
}
