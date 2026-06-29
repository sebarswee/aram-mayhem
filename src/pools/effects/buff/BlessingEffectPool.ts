import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../../VisualEffectPool';

/**
 * 祝福效果配置
 */
export interface BlessingEffectConfig extends VisualEffectConfig {
  /** 持续时间 */
  duration?: number;
}

/**
 * 祝福效果对象池
 *
 * 管理 Blessing 技能的视觉效果复用
 * - 祝福光环（circle）
 * - 4 个羽毛效果（graphics）
 * - 脉动和下落动画
 *
 * 特点：神圣光环，羽毛飘落效果
 */
export class BlessingEffectPool extends VisualEffectPool<BlessingEffectConfig> {
  constructor(scene: Phaser.Scene, initialSize: number = 3) {
    super(
      scene,
      () => (this as any)._createFn(),
      (obj, config: BlessingEffectConfig) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'BlessingEffectPool', skipInitialWarmUp: true }
    );

    (this as any)._createFn = this.createBlessingEffect.bind(this);
    (this as any)._resetFn = this.resetBlessingEffect.bind(this);

    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建祝福效果容器
   */
  private createBlessingEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建祝福光环
    const blessing = this.scene.add.circle(0, -20, 25, 0xffcc00, 0.5);
    blessing.setName('blessing_halo');
    container.add(blessing);

    // 预创建外层光环
    const outerGlow = this.scene.add.circle(0, -20, 32, 0xffdd00, 0.2);
    outerGlow.setName('blessing_outer_glow');
    container.add(outerGlow);

    // 预创建羽毛效果（4个）
    for (let i = 0; i < 4; i++) {
      const feather = this.scene.add.graphics();
      feather.setName(`blessing_feather_${i}`);
      container.add(feather);
    }

    container.setDepth(48);
    return container;
  }

  /**
   * 重置并配置祝福效果
   */
  private resetBlessingEffect(
    container: Phaser.GameObjects.Container,
    config: BlessingEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);
    container.setScale(1, 1);
    container.setAlpha(1);

    // 重置祝福光环
    const blessing = container.getByName('blessing_halo') as Phaser.GameObjects.Arc;
    if (blessing) {
      blessing.setRadius(25);
      blessing.setFillStyle(0xffcc00, 0.5);
      blessing.setPosition(0, -20);
      blessing.setScale(1, 1);
      blessing.setAlpha(0.5);
    }

    // 重置外层光环
    const outerGlow = container.getByName('blessing_outer_glow') as Phaser.GameObjects.Arc;
    if (outerGlow) {
      outerGlow.setRadius(32);
      outerGlow.setFillStyle(0xffdd00, 0.2);
      outerGlow.setPosition(0, -20);
      outerGlow.setScale(1, 1);
      outerGlow.setAlpha(0.2);
    }

    // 重置羽毛
    for (let i = 0; i < 4; i++) {
      const feather = container.getByName(`blessing_feather_${i}`) as Phaser.GameObjects.Graphics;
      if (feather) {
        feather.clear();
        feather.fillStyle(0xffffff, 0.8);
        feather.fillEllipse(0, 0, 4, 10);
        feather.setPosition((i - 1.5) * 15, -30);
        feather.setScale(1, 1);
        feather.setAlpha(0.8);
      }
    }

    // 光环脉动动画（无限）
    this.addManagedTween(container, {
      targets: blessing,
      scale: 1.15,
      alpha: 0.7,
      duration: 400,
      yoyo: true,
      repeat: -1,
    });

    this.addManagedTween(container, {
      targets: outerGlow,
      scale: 1.2,
      alpha: 0.35,
      duration: 500,
      yoyo: true,
      repeat: -1,
      delay: 100,
    });

    // 羽毛飘落动画（无限）
    for (let i = 0; i < 4; i++) {
      const feather = container.getByName(`blessing_feather_${i}`) as Phaser.GameObjects.Graphics;
      if (feather) {
        this.addManagedTween(container, {
          targets: feather,
          y: feather.y + 40,
          alpha: 0,
          duration: 600,
          delay: i * 100,
          repeat: -1,
          onRepeat: () => {
            // 重置羽毛位置
            feather.setPosition((i - 1.5) * 15, -30);
            feather.setAlpha(0.8);
          },
        });
      }
    }

    // 设置自动回收（如果指定了持续时间且不是无限）
    if (config.duration && config.duration > 0) {
      this.setEffectDuration(container, config.duration);
    }
  }

  /**
   * 停用效果时的额外清理
   */
  protected deactivate(obj: Phaser.GameObjects.Container): void {
    // 清理所有羽毛 graphics
    for (let i = 0; i < 4; i++) {
      const feather = obj.getByName(`blessing_feather_${i}`) as Phaser.GameObjects.Graphics;
      if (feather) feather.clear();
    }

    // 调用父类方法进行基础清理
    super.deactivate(obj);
  }
}
