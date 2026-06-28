import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../VisualEffectPool';

/**
 * 雷霆万钧效果配置
 */
export interface ThunderApocalypseEffectConfig extends VisualEffectConfig {
  /** 技能范围（用于云层大小） */
  rangeValue: number;
  /** 雷击次数 */
  strikeCount: number;
  /** 雷击间隔（毫秒） */
  strikeInterval: number;
  /** 云层配置 */
  cloudConfigs?: Array<{
    radiusMultiplier: number;
    color: number;
    alpha: number;
    yOffset: number;
  }>;
  /** 雷击回调（每次雷击时调用） */
  onStrike?: (strikeIndex: number, strikeX: number, strikeY: number) => void;
  /** 敌人查找函数 */
  findEnemiesInRange?: (x: number, y: number, range: number) => any[];
  /** 伤害应用函数 */
  applyDamageToEnemy?: (enemy: any, damage: number, skill: any) => void;
  /** 效果应用函数 */
  applyEffects?: (enemy: any, effects: any[]) => void;
  /** 技能对象（用于效果应用） */
  skill?: any;
  /** 伤害值 */
  damage?: number;
}

/**
 * 雷霆万钧效果对象池
 *
 * 管理 ThunderApocalypse 技能的视觉效果复用
 *
 * 池化元素：
 * - 3 层雷云圆 (Arc)
 * - 雷击定时器（托管）
 * - 备用清理定时器（托管）
 *
 * **重要设计决策**：
 * - 闪电和闪光是瞬态效果（180ms 生命周期），不适合池化
 * - 只池化云层，因为云层持续整个技能周期
 * - 使用托管定时器确保正确清理
 * - 保留备用清理机制，彻底解决云层残留问题
 */
export class ThunderApocalypseEffectPool extends VisualEffectPool<ThunderApocalypseEffectConfig> {
  /** 默认云层配置（3 层） */
  private static readonly DEFAULT_CLOUD_CONFIGS = [
    { radiusMultiplier: 0.60, color: 0x333355, alpha: 0.25, yOffset: -80 },
    { radiusMultiplier: 0.75, color: 0x333355, alpha: 0.20, yOffset: -80 },
    { radiusMultiplier: 0.90, color: 0x333355, alpha: 0.15, yOffset: -80 },
  ];

  constructor(scene: Phaser.Scene, initialSize: number = 3) {
    // 使用延迟绑定模式，避免在 createFn 赋值前调用 create()
    super(
      scene,
      () => (this as any)._createFn(),
      (obj, config) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'ThunderApocalypseEffectPool', skipInitialWarmUp: true }
    );

    (this as any)._createFn = this.createThunderApocalypseEffect.bind(this);
    (this as any)._resetFn = this.resetThunderApocalypseEffect.bind(this);

    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建雷霆万钧效果容器
   */
  private createThunderApocalypseEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建 3 层雷云圆
    for (let i = 0; i < 3; i++) {
      const cloud = this.scene.add.circle(0, 0, 100, 0x333355, 0.2);
      cloud.setName(`cloud_layer_${i}`);
      container.add(cloud);
    }

    container.setDepth(15); // 基础深度
    return container;
  }

  /**
   * 重置并配置雷霆万钧效果
   */
  private resetThunderApocalypseEffect(
    container: Phaser.GameObjects.Container,
    config: ThunderApocalypseEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);

    const rangeValue = config.rangeValue;
    const strikeCount = config.strikeCount ?? 12;
    const strikeInterval = config.strikeInterval ?? 200;
    const cloudConfigs = config.cloudConfigs ?? ThunderApocalypseEffectPool.DEFAULT_CLOUD_CONFIGS;

    // 重置 3 层雷云
    cloudConfigs.forEach((cloudConfig, i) => {
      const cloud = container.getByName(`cloud_layer_${i}`) as Phaser.GameObjects.Arc;
      if (cloud) {
        const actualRadius = rangeValue * cloudConfig.radiusMultiplier;
        cloud.setRadius(actualRadius);
        cloud.setFillStyle(cloudConfig.color, cloudConfig.alpha);
        cloud.setPosition(0, cloudConfig.yOffset);
        cloud.setDepth(15 + i);
        cloud.setScale(1, 1);
        cloud.setAlpha(cloudConfig.alpha);
      }
    });

    // 雷击状态追踪
    let currentStrike = 0;

    // 创建雷击定时器
    const strikeTimer = this.scene.time.addEvent({
      delay: strikeInterval,
      callback: () => {
        currentStrike++;

        if (currentStrike > strikeCount) {
          // 雷击完成，开始淡出云层
          strikeTimer.destroy();

          // 云层淡出动画
          this.scene.tweens.add({
            targets: container.list,
            alpha: 0,
            duration: 300,
            onComplete: () => {
              this.release(container);
            },
          });
          return;
        }

        // 检查云层是否仍然有效
        if (!container.active) {
          strikeTimer.destroy();
          return;
        }

        // 计算雷击位置
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * rangeValue * 0.8;
        const strikeX = config.x + Math.cos(angle) * dist;
        const strikeY = config.y + Math.sin(angle) * dist;

        // 创建瞬态闪电效果（不池化，生命周期短）
        this.createLightningBolt(strikeX, strikeY);

        // 创建瞬态闪光效果（不池化，生命周期短）
        this.createFlashEffect(strikeX, strikeY);

        // 调用雷击回调
        if (config.onStrike) {
          config.onStrike(currentStrike, strikeX, strikeY);
        }

        // 应用伤害和效果
        if (config.findEnemiesInRange && config.applyDamageToEnemy) {
          const enemies = config.findEnemiesInRange(strikeX, strikeY, 60);
          for (const enemy of enemies) {
            config.applyDamageToEnemy(enemy, config.damage ?? 0, config.skill);

            // 应用眩晕效果
            if (config.applyEffects && config.skill?.effects) {
              const stunEffect = config.skill.effects.find((e: any) => e.type === 'stun');
              if (stunEffect) {
                config.applyEffects(enemy, [stunEffect]);
              }
            }
          }
        }
      },
      repeat: strikeCount, // 包括第一次调用，总共 strikeCount + 1 次触发
    });

    // 托管雷击定时器
    this.addManagedTimer(container, strikeTimer, {
      autoDestroy: true,
      tag: 'strike_timer',
    });

    // **备用清理机制**：确保云层一定会被销毁
    // 这是解决云层残留问题的关键保障
    const totalDuration = (strikeCount + 1) * strikeInterval + 500;
    const backupCleanupTimer = this.scene.time.delayedCall(totalDuration, () => {
      // 如果容器还活跃，强制释放
      if (container.active) {
        this.logDebug('ThunderApocalypse: backup cleanup triggered');
        this.release(container);
      }
    });

    // 托管备用清理定时器
    this.addManagedTimer(container, backupCleanupTimer, {
      autoDestroy: true,
      tag: 'backup_cleanup',
    });
  }

  /**
   * 创建闪电效果（瞬态，不池化）
   */
  private createLightningBolt(strikeX: number, strikeY: number): void {
    // 多层闪电
    const lightningOuter = this.scene.add.graphics();
    lightningOuter.lineStyle(12, 0xffff00, 0.3);
    lightningOuter.lineBetween(strikeX, strikeY - 150, strikeX, strikeY);
    lightningOuter.setDepth(98);

    const lightningMid = this.scene.add.graphics();
    lightningMid.lineStyle(5, 0xffff00, 0.7);
    lightningMid.lineBetween(strikeX, strikeY - 140, strikeX, strikeY);
    lightningMid.setDepth(99);

    const lightningCore = this.scene.add.graphics();
    lightningCore.lineStyle(2, 0xffffff, 1);
    lightningCore.lineBetween(strikeX, strikeY - 130, strikeX, strikeY);
    lightningCore.setDepth(100);

    // 消失动画
    this.scene.tweens.add({
      targets: [lightningOuter, lightningMid, lightningCore],
      alpha: 0,
      duration: 180,
      onComplete: () => {
        lightningOuter.destroy();
        lightningMid.destroy();
        lightningCore.destroy();
      },
    });
  }

  /**
   * 创建闪光效果（瞬态，不池化）
   */
  private createFlashEffect(strikeX: number, strikeY: number): void {
    // 击中点闪光
    const flashOuter = this.scene.add.circle(strikeX, strikeY, 50, 0xffff00, 0.5);
    const flashInner = this.scene.add.circle(strikeX, strikeY, 25, 0xffffff, 0.9);
    flashOuter.setDepth(101);
    flashInner.setDepth(102);

    // 消失动画
    this.scene.tweens.add({
      targets: [flashOuter, flashInner],
      alpha: 0,
      duration: 180,
      onComplete: () => {
        flashOuter.destroy();
        flashInner.destroy();
      },
    });
  }

  /**
   * 停用效果时的额外清理
   */
  protected deactivate(obj: Phaser.GameObjects.Container): void {
    // 重置云层状态
    for (let i = 0; i < 3; i++) {
      const cloud = obj.getByName(`cloud_layer_${i}`) as Phaser.GameObjects.Arc;
      if (cloud) {
        cloud.setAlpha(0);
        cloud.setScale(1, 1);
        cloud.setPosition(0, 0);
      }
    }

    // 调用父类方法进行基础清理
    super.deactivate(obj);
  }

  /**
   * 获取云层数量（用于调试）
   */
  getCloudLayerCount(container: Phaser.GameObjects.Container): number {
    let count = 0;
    for (let i = 0; i < 3; i++) {
      const cloud = container.getByName(`cloud_layer_${i}`);
      if (cloud) count++;
    }
    return count;
  }

  /**
   * 验证所有云层是否存在（用于测试）
   */
  validateAllCloudsExist(container: Phaser.GameObjects.Container): boolean {
    for (let i = 0; i < 3; i++) {
      const cloud = container.getByName(`cloud_layer_${i}`);
      if (!cloud) return false;
    }
    return true;
  }

  /**
   * 强制释放所有活跃效果
   *
   * 用于场景切换等需要立即清理的情况
   */
  releaseAll(): void {
    this.active.forEach(container => {
      this.release(container);
    });
  }
}
