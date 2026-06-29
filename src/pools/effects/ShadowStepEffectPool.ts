import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../VisualEffectPool';

/**
 * 暗影步效果配置
 */
export interface ShadowStepEffectConfig extends VisualEffectConfig {
  duration: number;
}

/**
 * 暗影步效果对象池
 *
 * 管理 ShadowStep 技能的视觉效果复用
 * - 4 层分身视觉（circle）
 * - 1 个无限循环 tween（脉动）
 * - 持续 3 秒
 */
export class ShadowStepEffectPool extends VisualEffectPool<ShadowStepEffectConfig> {
  constructor(scene: Phaser.Scene, initialSize: number = 5) {
    super(
      scene,
      () => (this as any)._createFn(),
      (obj, config: ShadowStepEffectConfig) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'ShadowStepEffectPool', skipInitialWarmUp: true }
    );

    (this as any)._createFn = this.createShadowStepEffect.bind(this);
    (this as any)._resetFn = this.resetShadowStepEffect.bind(this);

    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建暗影步效果容器
   */
  private createShadowStepEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建4层分身视觉
    const bodyOuter = this.scene.add.circle(0, 0, 22, 0x4400aa, 0.35);
    bodyOuter.setName('shadow_body_outer');
    container.add(bodyOuter);

    const bodyMid = this.scene.add.circle(0, 0, 17, 0x6600cc, 0.5);
    bodyMid.setName('shadow_body_mid');
    container.add(bodyMid);

    const bodyInner = this.scene.add.circle(0, 0, 12, 0x8800ff, 0.7);
    bodyInner.setName('shadow_body_inner');
    container.add(bodyInner);

    const bodyCore = this.scene.add.circle(0, 0, 6, 0xaa44ff, 0.9);
    bodyCore.setName('shadow_body_core');
    container.add(bodyCore);

    container.setDepth(40);
    return container;
  }

  /**
   * 重置并配置暗影步效果
   */
  private resetShadowStepEffect(
    container: Phaser.GameObjects.Container,
    config: ShadowStepEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);

    // 重置分身视觉
    const bodyOuter = container.getByName('shadow_body_outer') as Phaser.GameObjects.Arc;
    if (bodyOuter) {
      bodyOuter.setRadius(22);
      bodyOuter.setFillStyle(0x4400aa, 0.35);
      bodyOuter.setPosition(0, 0);
      bodyOuter.setScale(1, 1);
      bodyOuter.setAlpha(0.35);
    }

    const bodyMid = container.getByName('shadow_body_mid') as Phaser.GameObjects.Arc;
    if (bodyMid) {
      bodyMid.setRadius(17);
      bodyMid.setFillStyle(0x6600cc, 0.5);
      bodyMid.setPosition(0, 0);
      bodyMid.setScale(1, 1);
      bodyMid.setAlpha(0.5);
    }

    const bodyInner = container.getByName('shadow_body_inner') as Phaser.GameObjects.Arc;
    if (bodyInner) {
      bodyInner.setRadius(12);
      bodyInner.setFillStyle(0x8800ff, 0.7);
      bodyInner.setPosition(0, 0);
      bodyInner.setScale(1, 1);
      bodyInner.setAlpha(0.7);
    }

    const bodyCore = container.getByName('shadow_body_core') as Phaser.GameObjects.Arc;
    if (bodyCore) {
      bodyCore.setRadius(6);
      bodyCore.setFillStyle(0xaa44ff, 0.9);
      bodyCore.setPosition(0, 0);
      bodyCore.setScale(1, 1);
      bodyCore.setAlpha(0.9);
    }

    // 脉动效果
    this.scene.tweens.add({
      targets: container,
      alpha: 0.6,
      scale: 1.08,
      duration: 300,
      yoyo: true,
      repeat: -1,
    });

    // 设置自动回收
    const duration = config.duration || 3000;

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
