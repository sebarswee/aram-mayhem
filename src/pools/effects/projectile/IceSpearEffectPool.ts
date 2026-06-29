import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../../VisualEffectPool';

/**
 * 冰矛效果配置
 */
export interface IceSpearEffectConfig extends VisualEffectConfig {
  /** 飞行角度 */
  angle: number;
  /** 持续时间 */
  duration?: number;
}

/**
 * 冰矛效果对象池
 *
 * 管理 IceShard 技能的视觉效果复用
 * - 3 层冰霜光环（circle）
 * - 主冰晶图形（graphics）
 * - 2 个侧翼冰晶（graphics）
 * - 2 个小冰晶装饰（graphics）
 * - 拖尾粒子发射器
 * - 多个无限循环 tween（旋转、脉动、闪烁）
 *
 * 特点：快速旋转，冰霜光环脉动
 */
export class IceSpearEffectPool extends VisualEffectPool<IceSpearEffectConfig> {
  constructor(scene: Phaser.Scene, initialSize: number = 5) {
    super(
      scene,
      () => (this as any)._createFn(),
      (obj, config: IceSpearEffectConfig) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'IceSpearEffectPool', skipInitialWarmUp: true }
    );

    (this as any)._createFn = this.createIceSpearEffect.bind(this);
    (this as any)._resetFn = this.resetIceSpearEffect.bind(this);

    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建冰矛效果容器
   */
  private createIceSpearEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建 3 层冰霜光环
    const frostAuraOuter = this.scene.add.circle(0, 0, 30, 0x44ccff, 0.1);
    frostAuraOuter.setName('ice_aura_outer');
    container.add(frostAuraOuter);

    const frostAuraMid = this.scene.add.circle(0, 0, 24, 0x66ddff, 0.15);
    frostAuraMid.setName('ice_aura_mid');
    container.add(frostAuraMid);

    const frostAuraInner = this.scene.add.circle(0, 0, 18, 0x88eeff, 0.2);
    frostAuraInner.setName('ice_aura_inner');
    container.add(frostAuraInner);

    // 预创建主冰晶
    const crystal = this.scene.add.graphics();
    crystal.setName('ice_crystal');
    container.add(crystal);

    // 预创建侧翼冰晶
    const wing1 = this.scene.add.graphics();
    wing1.setName('ice_wing1');
    container.add(wing1);

    const wing2 = this.scene.add.graphics();
    wing2.setName('ice_wing2');
    container.add(wing2);

    // 预创建小冰晶装饰
    const miniCrystal1 = this.scene.add.graphics();
    miniCrystal1.setName('ice_mini1');
    container.add(miniCrystal1);

    const miniCrystal2 = this.scene.add.graphics();
    miniCrystal2.setName('ice_mini2');
    container.add(miniCrystal2);

    container.setDepth(40);
    return container;
  }

  /**
   * 重置并配置冰矛效果
   */
  private resetIceSpearEffect(
    container: Phaser.GameObjects.Container,
    config: IceSpearEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);
    container.setRotation(config.angle);

    // 重置冰霜光环
    const frostAuraOuter = container.getByName('ice_aura_outer') as Phaser.GameObjects.Arc;
    if (frostAuraOuter) {
      frostAuraOuter.setRadius(30);
      frostAuraOuter.setFillStyle(0x44ccff, 0.1);
      frostAuraOuter.setScale(1, 1);
      frostAuraOuter.setAlpha(0.1);
    }

    const frostAuraMid = container.getByName('ice_aura_mid') as Phaser.GameObjects.Arc;
    if (frostAuraMid) {
      frostAuraMid.setRadius(24);
      frostAuraMid.setFillStyle(0x66ddff, 0.15);
      frostAuraMid.setScale(1, 1);
      frostAuraMid.setAlpha(0.15);
    }

    const frostAuraInner = container.getByName('ice_aura_inner') as Phaser.GameObjects.Arc;
    if (frostAuraInner) {
      frostAuraInner.setRadius(18);
      frostAuraInner.setFillStyle(0x88eeff, 0.2);
      frostAuraInner.setScale(1, 1);
      frostAuraInner.setAlpha(0.2);
    }

    // 重置主冰晶
    const crystal = container.getByName('ice_crystal') as Phaser.GameObjects.Graphics;
    if (crystal) {
      crystal.clear();
      crystal.fillStyle(0x66ccff, 0.9);
      crystal.fillTriangle(0, -22, -10, 12, 10, 12);
      crystal.fillStyle(0xaaeeff, 1);
      crystal.fillTriangle(0, -18, -6, 8, 6, 8);
      crystal.fillStyle(0xffffff, 0.9);
      crystal.fillTriangle(0, -14, -3, 4, 3, 4);
    }

    // 重置侧翼冰晶
    const wing1 = container.getByName('ice_wing1') as Phaser.GameObjects.Graphics;
    if (wing1) {
      wing1.clear();
      wing1.fillStyle(0x88ddff, 0.85);
      wing1.fillTriangle(-14, 0, -22, -8, -22, 8);
      wing1.fillStyle(0xccffff, 0.7);
      wing1.fillTriangle(-14, 0, -18, -4, -18, 4);
    }

    const wing2 = container.getByName('ice_wing2') as Phaser.GameObjects.Graphics;
    if (wing2) {
      wing2.clear();
      wing2.fillStyle(0x88ddff, 0.85);
      wing2.fillTriangle(14, 0, 22, -8, 22, 8);
      wing2.fillStyle(0xccffff, 0.7);
      wing2.fillTriangle(14, 0, 18, -4, 18, 4);
    }

    // 重置小冰晶
    const miniCrystal1 = container.getByName('ice_mini1') as Phaser.GameObjects.Graphics;
    if (miniCrystal1) {
      miniCrystal1.clear();
      miniCrystal1.fillStyle(0xaaffff, 0.8);
      miniCrystal1.fillTriangle(-6, -16, -10, -12, -2, -12);
    }

    const miniCrystal2 = container.getByName('ice_mini2') as Phaser.GameObjects.Graphics;
    if (miniCrystal2) {
      miniCrystal2.clear();
      miniCrystal2.fillStyle(0xaaffff, 0.8);
      miniCrystal2.fillTriangle(6, -16, 2, -12, 10, -12);
    }

    // 创建拖尾粒子发射器
    const trailParticles = this.scene.add.particles(0, 0, 'particle_ice_crystal', {
      speed: { min: 15, max: 40 },
      angle: { min: 160, max: 200 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.7, end: 0 },
      tint: [0x88ddff, 0xaaeeff, 0xffffff],
      lifespan: 350,
      frequency: 25,
      quantity: 2,
    });
    container.add(trailParticles);
    this.addManagedParticle(container, trailParticles, { autoStop: true, autoDestroy: true });

    // 添加动画
    // 快速旋转（无限）
    this.addManagedTween(container, {
      targets: container,
      angle: container.angle + 360,
      duration: 600,
      repeat: -1,
    });

    // 冰霜光环脉动（无限）
    this.addManagedTween(container, {
      targets: [frostAuraMid, frostAuraOuter],
      scale: 1.2,
      alpha: 0.05,
      duration: 300,
      yoyo: true,
      repeat: -1,
    });

    // 侧翼冰晶摆动（无限）
    this.addManagedTween(container, {
      targets: [wing1, wing2],
      scaleX: 1.1,
      duration: 150,
      yoyo: true,
      repeat: -1,
    });

    // 小冰晶闪烁（无限）
    this.addManagedTween(container, {
      targets: [miniCrystal1, miniCrystal2],
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: -1,
      delay: 50,
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
    const crystal = obj.getByName('ice_crystal') as Phaser.GameObjects.Graphics;
    if (crystal) crystal.clear();

    const wing1 = obj.getByName('ice_wing1') as Phaser.GameObjects.Graphics;
    if (wing1) wing1.clear();

    const wing2 = obj.getByName('ice_wing2') as Phaser.GameObjects.Graphics;
    if (wing2) wing2.clear();

    const miniCrystal1 = obj.getByName('ice_mini1') as Phaser.GameObjects.Graphics;
    if (miniCrystal1) miniCrystal1.clear();

    const miniCrystal2 = obj.getByName('ice_mini2') as Phaser.GameObjects.Graphics;
    if (miniCrystal2) miniCrystal2.clear();

    // 调用父类方法进行基础清理
    super.deactivate(obj);
  }
}
