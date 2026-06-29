import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../../VisualEffectPool';

/**
 * 石肤效果配置
 */
export interface StoneSkinEffectConfig extends VisualEffectConfig {
  /** 岩石数量 */
  rockCount?: number;
  /** 持续时间 */
  duration?: number;
}

/**
 * 石肤效果对象池
 *
 * 管理 StoneSkin 技能的视觉效果复用
 * - 6 个岩石块（graphics）
 * - 脉动效果
 *
 * 特点：岩石纹理效果，环绕玩家
 */
export class StoneSkinEffectPool extends VisualEffectPool<StoneSkinEffectConfig> {
  constructor(scene: Phaser.Scene, initialSize: number = 3) {
    super(
      scene,
      () => (this as any)._createFn(),
      (obj, config: StoneSkinEffectConfig) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'StoneSkinEffectPool', skipInitialWarmUp: true }
    );

    (this as any)._createFn = this.createStoneSkinEffect.bind(this);
    (this as any)._resetFn = this.resetStoneSkinEffect.bind(this);

    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建石肤效果容器
   */
  private createStoneSkinEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建岩石块（6个）
    for (let i = 0; i < 6; i++) {
      const rock = this.scene.add.graphics();
      rock.setName(`stone_rock_${i}`);
      container.add(rock);
    }

    // 预创建中心光环
    const aura = this.scene.add.circle(0, 0, 28, 0x886644, 0.2);
    aura.setName('stone_aura');
    container.add(aura);

    container.setDepth(47);
    return container;
  }

  /**
   * 重置并配置石肤效果
   */
  private resetStoneSkinEffect(
    container: Phaser.GameObjects.Container,
    config: StoneSkinEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);
    container.setScale(1, 1);
    container.setAlpha(1);

    const rockCount = config.rockCount || 6;

    // 重置岩石块
    for (let i = 0; i < rockCount; i++) {
      const rock = container.getByName(`stone_rock_${i}`) as Phaser.GameObjects.Graphics;
      if (rock) {
        rock.clear();
        rock.fillStyle(0x886644, 0.8);
        rock.fillRoundedRect(-6, -6, 12, 12, 3);

        const angle = (i / rockCount) * Math.PI * 2;
        rock.setPosition(Math.cos(angle) * 25, Math.sin(angle) * 25);
        rock.setScale(1, 1);
        rock.setAlpha(0.8);
      }
    }

    // 重置中心光环
    const aura = container.getByName('stone_aura') as Phaser.GameObjects.Arc;
    if (aura) {
      aura.setRadius(28);
      aura.setFillStyle(0x886644, 0.2);
      aura.setScale(1, 1);
      aura.setAlpha(0.2);
    }

    // 岩石脉动动画（无限）
    for (let i = 0; i < rockCount; i++) {
      const rock = container.getByName(`stone_rock_${i}`) as Phaser.GameObjects.Graphics;
      if (rock) {
        this.addManagedTween(container, {
          targets: rock,
          scale: 1.2,
          alpha: 0.6,
          duration: 400,
          yoyo: true,
          repeat: -1,
          delay: i * 50,
        });
      }
    }

    // 光环脉动（无限）
    this.addManagedTween(container, {
      targets: aura,
      scale: 1.15,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // 设置自动回收（如果指定了持续时间且不是无限）
    if (config.duration && config.duration > 0) {
      this.setEffectDuration(container, config.duration);
    }
  }

  /**
   * 停用效果时的额外清理
   */
  protected deactivate(obj: Phaser.GameObjects.Container): void {
    // 清理所有岩石 graphics
    for (let i = 0; i < 6; i++) {
      const rock = obj.getByName(`stone_rock_${i}`) as Phaser.GameObjects.Graphics;
      if (rock) rock.clear();
    }

    // 调用父类方法进行基础清理
    super.deactivate(obj);
  }
}
