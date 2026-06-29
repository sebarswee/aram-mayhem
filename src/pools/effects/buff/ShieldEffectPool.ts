import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../../VisualEffectPool';

/**
 * 护盾效果配置
 */
export interface ShieldEffectConfig extends VisualEffectConfig {
  /** 护盾半径 */
  radius?: number;
  /** 持续时间（-1 表示无限持续，需要手动释放） */
  duration?: number;
  /** 护盾颜色 */
  color?: number;
}

/**
 * 护盾效果对象池
 *
 * 管理 DivineShield 技能的视觉效果复用
 * - 护盾圆（circle）
 * - 脉动效果（无限 tween）
 *
 * 特点：可能有无限持续的 tween，需要正确管理
 */
export class ShieldEffectPool extends VisualEffectPool<ShieldEffectConfig> {
  constructor(scene: Phaser.Scene, initialSize: number = 3) {
    super(
      scene,
      () => (this as any)._createFn(),
      (obj, config: ShieldEffectConfig) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'ShieldEffectPool', skipInitialWarmUp: true }
    );

    (this as any)._createFn = this.createShieldEffect.bind(this);
    (this as any)._resetFn = this.resetShieldEffect.bind(this);

    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建护盾效果容器
   */
  private createShieldEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建护盾圆
    const shield = this.scene.add.circle(0, 0, 35, 0x66aaff, 0.3);
    shield.setName('shield_circle');
    shield.setStrokeStyle(2, 0x66aaff, 0.8);
    container.add(shield);

    // 预创建内层光环
    const innerGlow = this.scene.add.circle(0, 0, 30, 0x88ccff, 0.15);
    innerGlow.setName('shield_inner_glow');
    container.add(innerGlow);

    container.setDepth(48);
    return container;
  }

  /**
   * 重置并配置护盾效果
   */
  private resetShieldEffect(
    container: Phaser.GameObjects.Container,
    config: ShieldEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);
    container.setScale(1, 1);
    container.setAlpha(1);

    const radius = config.radius || 35;
    const color = config.color || 0x66aaff;

    // 重置护盾圆
    const shield = container.getByName('shield_circle') as Phaser.GameObjects.Arc;
    if (shield) {
      shield.setRadius(radius);
      shield.setFillStyle(color, 0.3);
      shield.setStrokeStyle(2, color, 0.8);
      shield.setScale(1, 1);
      shield.setAlpha(0.3);
    }

    // 重置内层光环
    const innerGlow = container.getByName('shield_inner_glow') as Phaser.GameObjects.Arc;
    if (innerGlow) {
      innerGlow.setRadius(radius * 0.85);
      innerGlow.setFillStyle(color, 0.15);
      innerGlow.setScale(1, 1);
      innerGlow.setAlpha(0.15);
    }

    // 脉动动画（无限）
    this.addManagedTween(container, {
      targets: shield,
      scale: 1.1,
      alpha: 0.4,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    this.addManagedTween(container, {
      targets: innerGlow,
      scale: 1.15,
      alpha: 0.2,
      duration: 600,
      yoyo: true,
      repeat: -1,
      delay: 100,
    });

    // 设置自动回收（如果指定了持续时间且不是无限）
    if (config.duration && config.duration > 0) {
      this.setEffectDuration(container, config.duration);
    }
  }

  /**
   * 手动释放护盾效果（用于无限持续的护盾）
   */
  releaseShield(container: Phaser.GameObjects.Container): void {
    this.release(container);
  }
}
