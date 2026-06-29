import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../VisualEffectPool';

/**
 * 闪电聚焦效果配置
 */
export interface LightningFocusEffectConfig extends VisualEffectConfig {
  range: number;
  duration: number;
}

/**
 * 闪电聚焦效果对象池
 *
 * 管理 LightningFocus 技能的视觉效果复用
 * - 3 层聚焦蓄力视觉（circle）
 * - 多层雷电束（graphics）
 * - 多层闪光效果（circle）
 * - 电弧分支（graphics）
 * - 瞬态效果（约 400ms）
 */
export class LightningFocusEffectPool extends VisualEffectPool<LightningFocusEffectConfig> {
  constructor(scene: Phaser.Scene, initialSize: number = 5) {
    super(
      scene,
      () => (this as any)._createFn(),
      (obj, config: LightningFocusEffectConfig) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'LightningFocusEffectPool', skipInitialWarmUp: true }
    );

    (this as any)._createFn = this.createLightningFocusEffect.bind(this);
    (this as any)._resetFn = this.resetLightningFocusEffect.bind(this);

    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建闪电聚焦效果容器
   */
  private createLightningFocusEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建3层聚焦蓄力视觉
    for (let i = 0; i < 3; i++) {
      const charge = this.scene.add.circle(0, 0, 28 - i * 6, 0xffff00, 0.35 + i * 0.15);
      charge.setStrokeStyle(4 - i, 0xffffff, 0.6 + i * 0.15);
      charge.setName(`focus_charge_${i}`);
      container.add(charge);
    }

    container.setDepth(98);
    return container;
  }

  /**
   * 重置并配置闪电聚焦效果
   */
  private resetLightningFocusEffect(
    container: Phaser.GameObjects.Container,
    config: LightningFocusEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);

    // 重置聚焦蓄力视觉
    const chargeConfigs = [
      { radius: 28, alpha: 0.35, strokeStyle: 4, depth: 98 },
      { radius: 22, alpha: 0.5, strokeStyle: 3, depth: 99 },
      { radius: 16, alpha: 0.7, strokeStyle: 2, depth: 100 },
    ];

    chargeConfigs.forEach((chargeConfig, i) => {
      const charge = container.getByName(`focus_charge_${i}`) as Phaser.GameObjects.Arc;
      if (charge) {
        charge.setRadius(chargeConfig.radius);
        charge.setFillStyle(0xffff00, chargeConfig.alpha);
        charge.setStrokeStyle(chargeConfig.strokeStyle, 0xffffff, 0.6 + i * 0.15);
        charge.setPosition(0, 0);
        charge.setScale(1, 1);
        charge.setAlpha(chargeConfig.alpha);
        charge.setDepth(chargeConfig.depth);
      }
    });

    // 收集所有聚焦层
    const charges: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 3; i++) {
      const charge = container.getByName(`focus_charge_${i}`) as Phaser.GameObjects.Arc;
      if (charge) charges.push(charge);
    }

    // 蓄力动画
    this.scene.tweens.add({
      targets: charges,
      scale: 1.6,
      alpha: 0.9,
      duration: 150,
    });

    // 设置自动回收
    const duration = config.duration || 400;

    this.setEffectDuration(container, duration);
  }

  /**
   * 停用效果时的额外清理
   */
  protected deactivate(obj: Phaser.GameObjects.Container): void {
    // 调用父类方法进行基础清理
    super.deactivate(obj);
  }
}
