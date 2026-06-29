import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../VisualEffectPool';

/**
 * 神圣审判效果配置
 */
export interface HolyJudgmentEffectConfig extends VisualEffectConfig {
  /** 目标敌人位置 */
  targetX: number;
  targetY: number;
  /** 光柱高度 */
  pillarHeight?: number;
  /** 效果持续时间（毫秒） */
  duration?: number;
}

/**
 * 神圣审判效果对象池
 *
 * 管理 HolyJudgment 技能的视觉效果复用
 *
 * 池化元素：
 * - 3 层光柱 Rectangle（外层、中层、内层）
 * - 击中闪光圆
 *
 * **注意**: 此效果不包含无限循环的 tween，所有 tween 都是一次性的淡出效果
 */
export class HolyJudgmentEffectPool extends VisualEffectPool<HolyJudgmentEffectConfig> {
  /** 默认光柱配置（3 层） */
  private static readonly DEFAULT_PILLAR_CONFIGS = [
    { width: 50, height: 200, color: 0xffcc00, alpha: 0.30 },
    { width: 35, height: 200, color: 0xffdd44, alpha: 0.50 },
    { width: 18, height: 200, color: 0xffffff, alpha: 0.75 },
  ];

  /** 默认闪光配置 */
  private static readonly DEFAULT_FLASH_CONFIG = {
    radius: 25,
    color: 0xffffff,
    alpha: 0.80,
  };

  /** 默认效果持续时间 */
  private static readonly DEFAULT_DURATION = 550;

  constructor(scene: Phaser.Scene, initialSize: number = 3) {
    // 第一步：先跳过父类的自动预热
    super(
      scene,
      // 使用延迟绑定模式
      () => (this as any)._createFn(),
      (obj, config) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'HolyJudgmentEffectPool', skipInitialWarmUp: true }
    );

    // 第二步：设置实际的创建和重置函数
    (this as any)._createFn = this.createHolyJudgmentEffect.bind(this);
    (this as any)._resetFn = this.resetHolyJudgmentEffect.bind(this);

    // 第三步：现在可以安全地预热池
    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建神圣审判效果容器
   */
  private createHolyJudgmentEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建 3 层光柱 Rectangle
    for (let i = 0; i < 3; i++) {
      const pillar = this.scene.add.rectangle(0, 0, 50, 200, 0xffcc00, 0.5);
      pillar.setName(`pillar_layer_${i}`);
      container.add(pillar);
    }

    // 预创建击中闪光圆
    const flash = this.scene.add.circle(0, 0, 25, 0xffffff, 0.8);
    flash.setName('flash_circle');
    container.add(flash);

    container.setDepth(48); // 基础深度
    return container;
  }

  /**
   * 重置并配置神圣审判效果
   */
  private resetHolyJudgmentEffect(
    container: Phaser.GameObjects.Container,
    config: HolyJudgmentEffectConfig
  ): void {
    // 光柱位置（目标敌人上方）
    const pillarX = config.targetX;
    const pillarY = config.targetY - 100;
    const pillarHeight = config.pillarHeight ?? 200;
    const pillarConfigs = HolyJudgmentEffectPool.DEFAULT_PILLAR_CONFIGS;
    const flashConfig = HolyJudgmentEffectPool.DEFAULT_FLASH_CONFIG;
    const duration = config.duration ?? HolyJudgmentEffectPool.DEFAULT_DURATION;

    container.setPosition(pillarX, pillarY);
    container.setActive(true);
    container.setVisible(true);

    // 重置 3 层光柱
    pillarConfigs.forEach((pillarConfig, i) => {
      const pillar = container.getByName(`pillar_layer_${i}`) as Phaser.GameObjects.Rectangle;
      if (pillar) {
        pillar.setSize(pillarConfig.width, pillarHeight);
        pillar.setFillStyle(pillarConfig.color, pillarConfig.alpha);
        pillar.setPosition(0, 0);
        pillar.setScale(1, 1);
        pillar.setAlpha(pillarConfig.alpha);
        pillar.setDepth(48 + i);
      }
    });

    // 重置击中闪光圆（位于目标敌人位置）
    const flash = container.getByName('flash_circle') as Phaser.GameObjects.Arc;
    if (flash) {
      // 闪光圆位于敌人位置（相对容器位置偏移）
      flash.setRadius(flashConfig.radius);
      flash.setFillStyle(flashConfig.color, flashConfig.alpha);
      flash.setPosition(0, 100); // 偏移到敌人位置
      flash.setScale(1, 1);
      flash.setAlpha(flashConfig.alpha);
      flash.setDepth(51);
    }

    // 创建淡出动画（非无限循环）
    const fadeOutTween = this.scene.tweens.add({
      targets: [container.getByName('pillar_layer_0'), container.getByName('pillar_layer_1'), container.getByName('pillar_layer_2'), flash],
      alpha: 0,
      scaleX: 2.2,
      duration: duration,
      onComplete: () => {
        this.release(container);
      },
    });

    // 托管 tween（虽然是非无限循环，但为了安全清理）
    this.addManagedTween(container, fadeOutTween, {
      autoStop: true,
      tag: 'fade_out',
    });
  }

  /**
   * 停用效果时的额外清理
   */
  protected deactivate(obj: Phaser.GameObjects.Container): void {
    // 停止所有托管的 tweens
    const tweens = this.managedTweens.get(obj);
    if (tweens) {
      tweens.forEach(managed => {
        if (managed.autoStop && managed.tween) {
          if (managed.tween.isPlaying()) {
            managed.tween.stop();
          }
          this.scene.tweens.remove(managed.tween);
        }
      });
    }

    // 调用父类方法进行基础清理
    super.deactivate(obj);
  }

  /**
   * 获取总 tween 数量（用于调试）
   */
  getTotalTweenCount(container: Phaser.GameObjects.Container): number {
    const tweens = this.managedTweens.get(container);
    return tweens ? tweens.length : 0;
  }
}