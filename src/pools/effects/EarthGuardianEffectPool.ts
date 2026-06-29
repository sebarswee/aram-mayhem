import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../VisualEffectPool';

/**
 * 大地守护者效果配置
 */
export interface EarthGuardianEffectConfig extends VisualEffectConfig {
  /** 护盾半径 */
  radius?: number;
  /** 持续时间（毫秒） */
  duration: number;
  /** 防御提升值 */
  defenseBoost?: number;
  /** 护盾值 */
  shieldValue?: number;
}

/**
 * 大地守护者效果对象池
 *
 * 管理 EarthGuardian 技能的视觉效果复用
 *
 * 池化元素：
 * - 3 层石像护盾圆（外层、中层、内层）
 * - 8 个岩石碎片 Graphics（环绕玩家）
 * - **共 8 个无限循环 tween**（必须正确停止）:
 *   - 8 个岩石轨道动画 tween
 *
 * **重要**: 此效果包含 8 个无限循环的 tween，必须在释放时正确停止
 */
export class EarthGuardianEffectPool extends VisualEffectPool<EarthGuardianEffectConfig> {
  /** 默认护盾配置（3 层） */
  private static readonly DEFAULT_SHIELD_CONFIGS = [
    { radius: 55, color: 0x665544, alpha: 0.25, strokeStyle: { width: 5, color: 0xaa8866, alpha: 0.65 } },
    { radius: 45, color: 0x776655, alpha: 0.40, strokeStyle: { width: 3, color: 0xaa8866, alpha: 0.80 } },
    { radius: 35, color: 0x887766, alpha: 0.55, strokeStyle: { width: 2, color: 0xaa8866, alpha: 0.90 } },
  ];

  /** 默认岩石数量 */
  private static readonly DEFAULT_ROCK_COUNT = 8;

  constructor(scene: Phaser.Scene, initialSize: number = 3) {
    // 第一步：先跳过父类的自动预热
    super(
      scene,
      // 使用延迟绑定模式
      () => (this as any)._createFn(),
      (obj, config) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'EarthGuardianEffectPool', skipInitialWarmUp: true }
    );

    // 第二步：设置实际的创建和重置函数
    (this as any)._createFn = this.createEarthGuardianEffect.bind(this);
    (this as any)._resetFn = this.resetEarthGuardianEffect.bind(this);

    // 第三步：现在可以安全地预热池
    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建大地守护者效果容器
   */
  private createEarthGuardianEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建 3 层石像护盾圆
    for (let i = 0; i < 3; i++) {
      const shield = this.scene.add.circle(0, 0, 50, 0x776655, 0.4);
      shield.setName(`shield_layer_${i}`);
      container.add(shield);
    }

    // 预创建 8 个岩石碎片 Graphics
    for (let i = 0; i < 8; i++) {
      const rock = this.scene.add.graphics();
      rock.setName(`rock_${i}`);
      container.add(rock);
    }

    container.setDepth(45); // 基础深度
    return container;
  }

  /**
   * 重置并配置大地守护者效果
   */
  private resetEarthGuardianEffect(
    container: Phaser.GameObjects.Container,
    config: EarthGuardianEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);

    const baseRadius = config.radius ?? 50;
    const shieldConfigs = EarthGuardianEffectPool.DEFAULT_SHIELD_CONFIGS;

    // 重置 3 层石像护盾
    shieldConfigs.forEach((shieldConfig, i) => {
      const shield = container.getByName(`shield_layer_${i}`) as Phaser.GameObjects.Arc;
      if (shield) {
        const actualRadius = shieldConfig.radius;
        shield.setRadius(actualRadius);
        shield.setFillStyle(shieldConfig.color, shieldConfig.alpha);
        shield.setStrokeStyle(shieldConfig.strokeStyle.width, shieldConfig.strokeStyle.color, shieldConfig.strokeStyle.alpha);
        shield.setPosition(0, 0);
        shield.setScale(1, 1);
        shield.setAlpha(shieldConfig.alpha);
        shield.setDepth(46 + i);
      }
    });

    // 重置 8 个岩石碎片并创建轨道动画
    const rockCount = EarthGuardianEffectPool.DEFAULT_ROCK_COUNT;
    for (let i = 0; i < rockCount; i++) {
      const rock = container.getByName(`rock_${i}`) as Phaser.GameObjects.Graphics;
      if (rock) {
        // 清除之前的绘制
        rock.clear();

        // 绘制岩石
        rock.fillStyle(0x665544, 0.9);
        rock.fillRoundedRect(-10, -10, 20, 20, 5);
        rock.fillStyle(0x887766, 0.7);
        rock.fillRoundedRect(-6, -6, 12, 12, 3);

        // 重置位置和角度
        rock.setPosition(config.x, config.y);
        rock.setAngle(0);
        rock.setAlpha(1);
        rock.setDepth(45);

        // 计算轨道参数
        const orbitAngle = (i / rockCount) * Math.PI * 2;
        const orbitRadius = 50;

        // 创建无限轨道动画 tween
        const orbitTween = this.scene.tweens.add({
          targets: rock,
          x: config.x + Math.cos(orbitAngle) * orbitRadius,
          y: config.y + Math.sin(orbitAngle) * orbitRadius,
          angle: 360,
          duration: 3000,
          repeat: -1, // 无限循环
        });

        // 托管 tween 以便正确清理
        this.addManagedTween(container, orbitTween, {
          autoStop: true,
          tag: `orbit_rock_${i}`,
        });
      }
    }

    // 设置自动回收
    if (config.duration && config.duration > 0) {
      this.setEffectDuration(container, config.duration);
    }
  }

  /**
   * 停用效果时的额外清理
   *
   * **重要**: 必须正确停止所有 8 个无限轨道 tween
   */
  protected deactivate(obj: Phaser.GameObjects.Container): void {
    // 停止所有托管的 tweens（包括 8 个轨道 tween）
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

    // 清除所有岩石 Graphics 的绘制
    for (let i = 0; i < 8; i++) {
      const rock = obj.getByName(`rock_${i}`) as Phaser.GameObjects.Graphics;
      if (rock) {
        rock.clear();
      }
    }

    // 调用父类方法进行基础清理
    super.deactivate(obj);
  }

  /**
   * 获取轨道 tween 数量（用于调试）
   */
  getOrbitTweenCount(container: Phaser.GameObjects.Container): number {
    const tweens = this.managedTweens.get(container);
    if (!tweens) return 0;
    return tweens.filter(t => t.tag?.startsWith('orbit_rock_')).length;
  }

  /**
   * 获取总 tween 数量（用于调试）
   */
  getTotalTweenCount(container: Phaser.GameObjects.Container): number {
    const tweens = this.managedTweens.get(container);
    return tweens ? tweens.length : 0;
  }

  /**
   * 验证所有 8 个轨道 tween 是否存在（用于测试）
   */
  validateAllOrbitTweensExist(container: Phaser.GameObjects.Container): boolean {
    const tweens = this.managedTweens.get(container);
    if (!tweens) return false;

    for (let i = 0; i < 8; i++) {
      const found = tweens.some(t => t.tag === `orbit_rock_${i}`);
      if (!found) return false;
    }

    return true;
  }

  /**
   * 获取详细的 tween 状态（用于调试）
   */
  getDetailedTweenStatus(container: Phaser.GameObjects.Container): {
    orbitTweens: { tag: string; exists: boolean }[];
    total: number;
  } {
    const tweens = this.managedTweens.get(container);
    const tweenTags = tweens ? tweens.map(t => t.tag) : [];

    const orbitTweens = [0, 1, 2, 3, 4, 5, 6, 7].map(i => ({
      tag: `orbit_rock_${i}`,
      exists: tweenTags.includes(`orbit_rock_${i}`),
    }));

    return {
      orbitTweens,
      total: tweenTags.length,
    };
  }
}
