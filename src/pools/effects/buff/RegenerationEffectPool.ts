import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../../VisualEffectPool';

/**
 * 再生效果配置
 */
export interface RegenerationEffectConfig extends VisualEffectConfig {
  /** 持续时间 */
  duration?: number;
  /** 治疗间隔 */
  tickInterval?: number;
}

/**
 * 再生效果对象池
 *
 * 管理 Regeneration 技能的视觉效果复用
 * - 再生光环（circle）
 * - 治疗粒子发射器
 * - 脉动效果
 *
 * 特点：持续治疗效果，绿色光环
 */
export class RegenerationEffectPool extends VisualEffectPool<RegenerationEffectConfig> {
  constructor(scene: Phaser.Scene, initialSize: number = 3) {
    super(
      scene,
      () => (this as any)._createFn(),
      (obj, config: RegenerationEffectConfig) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'RegenerationEffectPool', skipInitialWarmUp: true }
    );

    (this as any)._createFn = this.createRegenerationEffect.bind(this);
    (this as any)._resetFn = this.resetRegenerationEffect.bind(this);

    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建再生效果容器
   */
  private createRegenerationEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建再生光环
    const regenAura = this.scene.add.circle(0, 0, 28, 0x44ff44, 0.25);
    regenAura.setName('regen_aura');
    container.add(regenAura);

    // 预创建内层光环
    const innerGlow = this.scene.add.circle(0, 0, 22, 0x66ff66, 0.35);
    innerGlow.setName('regen_inner_glow');
    container.add(innerGlow);

    // 预创建十字标记（治疗符号）
    const cross = this.scene.add.graphics();
    cross.setName('regen_cross');
    container.add(cross);

    container.setDepth(46);
    return container;
  }

  /**
   * 重置并配置再生效果
   */
  private resetRegenerationEffect(
    container: Phaser.GameObjects.Container,
    config: RegenerationEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);
    container.setScale(1, 1);
    container.setAlpha(1);

    // 重置再生光环
    const regenAura = container.getByName('regen_aura') as Phaser.GameObjects.Arc;
    if (regenAura) {
      regenAura.setRadius(28);
      regenAura.setFillStyle(0x44ff44, 0.25);
      regenAura.setScale(1, 1);
      regenAura.setAlpha(0.25);
    }

    // 重置内层光环
    const innerGlow = container.getByName('regen_inner_glow') as Phaser.GameObjects.Arc;
    if (innerGlow) {
      innerGlow.setRadius(22);
      innerGlow.setFillStyle(0x66ff66, 0.35);
      innerGlow.setScale(1, 1);
      innerGlow.setAlpha(0.35);
    }

    // 重置十字标记
    const cross = container.getByName('regen_cross') as Phaser.GameObjects.Graphics;
    if (cross) {
      cross.clear();
      cross.fillStyle(0x88ff88, 0.9);
      // 横杠
      cross.fillRect(-8, -2, 16, 4);
      // 竖杠
      cross.fillRect(-2, -8, 4, 16);
    }

    // 创建治疗粒子发射器
    const healParticles = this.scene.add.particles(0, 0, 'particle_glow', {
      speed: { min: 20, max: 50 },
      angle: { min: 230, max: 310 },  // 向上飘
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.7, end: 0 },
      tint: [0x44ff44, 0x66ff66, 0x88ff88],
      lifespan: 600,
      frequency: 200,
      quantity: 1,
    });
    container.add(healParticles);
    this.addManagedParticle(container, healParticles, { autoStop: true, autoDestroy: true });

    // 光环脉动动画（无限）
    this.addManagedTween(container, {
      targets: regenAura,
      scale: 1.15,
      alpha: 0.35,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.addManagedTween(container, {
      targets: innerGlow,
      scale: 1.2,
      alpha: 0.45,
      duration: 500,
      yoyo: true,
      repeat: -1,
      delay: 150,
    });

    // 十字闪烁动画（无限）
    this.addManagedTween(container, {
      targets: cross,
      alpha: 0.5,
      scale: 1.2,
      duration: 400,
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
    // 清理十字 graphics
    const cross = obj.getByName('regen_cross') as Phaser.GameObjects.Graphics;
    if (cross) cross.clear();

    // 调用父类方法进行基础清理
    super.deactivate(obj);
  }
}
