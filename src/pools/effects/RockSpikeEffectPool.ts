import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../VisualEffectPool';

/**
 * 岩石尖刺效果配置
 */
export interface RockSpikeEffectConfig extends VisualEffectConfig {
  trapRadius: number;
  duration: number;
}

/**
 * 岩石尖刺效果对象池
 *
 * 管理 RockSpike 技能的视觉效果复用
 * - 3 层陷阱视觉（circle）
 * - 1 个地面裂缝（graphics）
 * - 2 个无限循环 tween（脉动）
 */
export class RockSpikeEffectPool extends VisualEffectPool<RockSpikeEffectConfig> {
  constructor(scene: Phaser.Scene, initialSize: number = 5) {
    super(
      scene,
      () => (this as any)._createFn(),
      (obj, config: RockSpikeEffectConfig) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'RockSpikeEffectPool', skipInitialWarmUp: true }
    );

    (this as any)._createFn = this.createRockSpikeEffect.bind(this);
    (this as any)._resetFn = this.resetRockSpikeEffect.bind(this);

    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建岩石尖刺效果容器
   */
  private createRockSpikeEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建3层陷阱视觉
    const trapOuter = this.scene.add.circle(0, 0, 35, 0x664422, 0.3);
    trapOuter.setName('rock_trap_outer');
    container.add(trapOuter);

    const trapMid = this.scene.add.circle(0, 0, 28, 0x886644, 0.4);
    trapMid.setName('rock_trap_mid');
    container.add(trapMid);

    const trapInner = this.scene.add.circle(0, 0, 20, 0xaa8866, 0.5);
    trapInner.setName('rock_trap_inner');
    container.add(trapInner);

    // 预创建地面裂缝
    const crack = this.scene.add.graphics();
    crack.setName('rock_crack');
    container.add(crack);

    container.setDepth(18);
    return container;
  }

  /**
   * 重置并配置岩石尖刺效果
   */
  private resetRockSpikeEffect(
    container: Phaser.GameObjects.Container,
    config: RockSpikeEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);

    // 重置陷阱层
    const trapOuter = container.getByName('rock_trap_outer') as Phaser.GameObjects.Arc;
    if (trapOuter) {
      trapOuter.setRadius(35);
      trapOuter.setFillStyle(0x664422, 0.3);
      trapOuter.setPosition(0, 0);
      trapOuter.setScale(1, 1);
      trapOuter.setAlpha(0.3);
      trapOuter.setDepth(18);
    }

    const trapMid = container.getByName('rock_trap_mid') as Phaser.GameObjects.Arc;
    if (trapMid) {
      trapMid.setRadius(28);
      trapMid.setFillStyle(0x886644, 0.4);
      trapMid.setPosition(0, 0);
      trapMid.setScale(1, 1);
      trapMid.setAlpha(0.4);
      trapMid.setDepth(19);
    }

    const trapInner = container.getByName('rock_trap_inner') as Phaser.GameObjects.Arc;
    if (trapInner) {
      trapInner.setRadius(20);
      trapInner.setFillStyle(0xaa8866, 0.5);
      trapInner.setPosition(0, 0);
      trapInner.setScale(1, 1);
      trapInner.setAlpha(0.5);
      trapInner.setDepth(20);
    }

    // 多层脉动动画
    this.scene.tweens.add({
      targets: [trapOuter, trapMid],
      scale: 1.15,
      alpha: 0.6,
      duration: 400,
      yoyo: true,
      repeat: -1,
    });

    this.scene.tweens.add({
      targets: trapInner,
      scale: 1.25,
      alpha: 0.7,
      duration: 300,
      yoyo: true,
      repeat: -1,
    });

    // 重置地面裂缝
    const crack = container.getByName('rock_crack') as Phaser.GameObjects.Graphics;
    if (crack) {
      crack.clear();
      crack.lineStyle(2, 0x553311, 0.6);
      for (let j = 0; j < 6; j++) {
        const crackAngle = (j / 6) * Math.PI * 2;
        const len = 15 + Math.random() * 10;
        crack.lineBetween(0, 0, Math.cos(crackAngle) * len, Math.sin(crackAngle) * len);
      }
      crack.setDepth(17);
    }

    // 设置自动回收
    if (config.duration && config.duration > 0) {
      this.setEffectDuration(container, config.duration);
    }
  }

  /**
   * 停用效果时的额外清理
   */
  protected deactivate(obj: Phaser.GameObjects.Container): void {
    // 清理 graphics
    const crack = obj.getByName('rock_crack') as Phaser.GameObjects.Graphics;
    if (crack) crack.clear();

    // 调用父类方法进行基础清理
    super.deactivate(obj);
  }
}
