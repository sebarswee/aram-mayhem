import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../VisualEffectPool';

/**
 * 雷暴效果配置
 */
export interface ThunderStormEffectConfig extends VisualEffectConfig {
  range: number;
  strikeCount: number;
  strikeDelay: number;
}

/**
 * 雷暴效果对象池
 *
 * 管理 ThunderStorm 技能的视觉效果复用
 * - 3 层预警区域（circle）用于每个目标
 * - 多层闪电光束（graphics）
 * - 多层闪光效果（circle）
 * - 电弧分支（graphics）
 */
export class ThunderStormEffectPool extends VisualEffectPool<ThunderStormEffectConfig> {
  constructor(scene: Phaser.Scene, initialSize: number = 5) {
    super(
      scene,
      () => (this as any)._createFn(),
      (obj, config: ThunderStormEffectConfig) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'ThunderStormEffectPool', skipInitialWarmUp: true }
    );

    (this as any)._createFn = this.createThunderStormEffect.bind(this);
    (this as any)._resetFn = this.resetThunderStormEffect.bind(this);

    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建雷暴效果容器
   */
  private createThunderStormEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);
    container.setName('thunder_storm_container');
    container.setDepth(20);
    return container;
  }

  /**
   * 重置并配置雷暴效果
   */
  private resetThunderStormEffect(
    container: Phaser.GameObjects.Container,
    config: ThunderStormEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);

    // 雷暴是一个瞬态效果，这里创建预警区域
    const warningLayers = [
      { radius: config.range * 1.2, alpha: 0.1, depth: 18 },
      { radius: config.range, alpha: 0.15, depth: 19 },
      { radius: config.range * 0.8, alpha: 0.2, depth: 20 },
    ];

    const warnings: Phaser.GameObjects.Arc[] = [];
    warningLayers.forEach((layer, i) => {
      const warning = this.scene.add.circle(0, 0, layer.radius, 0xffff00, layer.alpha);
      warning.setDepth(layer.depth);
      warnings.push(warning);
      container.add(warning);
    });

    // 预警脉动
    this.scene.tweens.add({
      targets: warnings,
      scale: 1.1,
      alpha: 0.4,
      duration: 200,
      yoyo: true,
      repeat: 2,
    });

    // 设置自动回收
    if (config.strikeDelay && config.strikeDelay > 0) {
      this.scene.time.delayedCall(config.strikeDelay + 500, () => {
        this.release(container);
      });
    }
  }

  /**
   * 停用效果时的额外清理
   */
  protected deactivate(obj: Phaser.GameObjects.Container): void {
    // 调用父类方法进行基础清理
    super.deactivate(obj);
  }
}
