import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../VisualEffectPool';

/**
 * 霜冻新星效果配置
 */
export interface FrostNovaEffectConfig extends VisualEffectConfig {
  range: number;
  crystalCount: number;
  duration: number;
}

/**
 * 霜冻新星效果对象池
 *
 * 管理 FrostNova 技能的视觉效果复用
 * - 中心爆发图形（graphics）
 * - 3 层冰霜环（circle）
 * - 8 个冰晶容器（包含 graphics 和 circle）
 * - 冰霜粒子拖尾
 * - 瞬态效果（约 400ms）
 */
export class FrostNovaEffectPool extends VisualEffectPool<FrostNovaEffectConfig> {
  constructor(scene: Phaser.Scene, initialSize: number = 5) {
    super(
      scene,
      () => (this as any)._createFn(),
      (obj, config: FrostNovaEffectConfig) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'FrostNovaEffectPool', skipInitialWarmUp: true }
    );

    (this as any)._createFn = this.createFrostNovaEffect.bind(this);
    (this as any)._resetFn = this.resetFrostNovaEffect.bind(this);

    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建霜冻新星效果容器
   */
  private createFrostNovaEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建中心爆发图形
    const centerBurst = this.scene.add.graphics();
    centerBurst.setName('frost_center_burst');
    container.add(centerBurst);

    // 预创建3层冰霜环
    for (let i = 0; i < 3; i++) {
      const ring = this.scene.add.circle(0, 0, 20 + i * 15, 0x66ddff, 0.4 - i * 0.1);
      ring.setName(`frost_ring_${i}`);
      container.add(ring);
    }

    container.setDepth(37);
    return container;
  }

  /**
   * 重置并配置霜冻新星效果
   */
  private resetFrostNovaEffect(
    container: Phaser.GameObjects.Container,
    config: FrostNovaEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);

    // 重置中心爆发图形
    const centerBurst = container.getByName('frost_center_burst') as Phaser.GameObjects.Graphics;
    if (centerBurst) {
      centerBurst.clear();
      centerBurst.fillStyle(0x88eeff, 0.9);
      centerBurst.fillCircle(0, 0, 30);
      centerBurst.fillStyle(0xffffff, 0.95);
      centerBurst.fillCircle(0, 0, 18);
      centerBurst.setDepth(38);

      // 中心爆发动画
      this.scene.tweens.add({
        targets: centerBurst,
        scale: 2,
        alpha: 0,
        duration: 300,
      });
    }

    // 重置冰霜环
    for (let i = 0; i < 3; i++) {
      const ring = container.getByName(`frost_ring_${i}`) as Phaser.GameObjects.Arc;
      if (ring) {
        const ringRadius = 20 + i * 15;
        ring.setRadius(ringRadius);
        ring.setFillStyle(0x66ddff, 0.4 - i * 0.1);
        ring.setPosition(0, 0);
        ring.setScale(1, 1);
        ring.setAlpha(0.4 - i * 0.1);
        ring.setDepth(37);

        // 冰霜环扩散动画
        this.scene.tweens.add({
          targets: ring,
          scale: 3,
          alpha: 0,
          duration: 400 + i * 100,
        });
      }
    }

    // 创建冰晶发射（每个冰晶是一个独立的容器）
    const crystalCount = config.crystalCount || 8;
    const angleStep = (Math.PI * 2) / crystalCount;

    for (let i = 0; i < crystalCount; i++) {
      const angle = angleStep * i;

      // 创建冰晶容器
      const crystalContainer = this.scene.add.container(config.x, config.y);
      crystalContainer.setDepth(40);

      // 冰晶光晕
      const crystalGlow = this.scene.add.circle(0, 0, 20, 0x88ddff, 0.3);

      // 冰晶图形
      const crystal = this.scene.add.graphics();
      crystal.fillStyle(0x66ccff, 0.95);
      crystal.fillTriangle(0, -18, -10, 12, 10, 12);
      crystal.fillStyle(0xaaeeff, 0.9);
      crystal.fillTriangle(0, -14, -6, 8, 6, 8);
      crystal.fillStyle(0xffffff, 0.85);
      crystal.fillTriangle(0, -10, -3, 5, 3, 5);

      crystalContainer.add([crystalGlow, crystal]);
      crystalContainer.setRotation(angle);

      // 冰霜粒子拖尾
      const trailParticles = this.scene.add.particles(config.x, config.y, 'particle_ice_crystal', {
        speed: { min: 10, max: 30 },
        angle: { min: 160, max: 200 },
        scale: { start: 0.4, end: 0 },
        alpha: { start: 0.6, end: 0 },
        tint: [0x88ddff, 0xaaeeff, 0xffffff],
        lifespan: 300,
        frequency: 25,
        quantity: 1,
        emitting: false,
      });
      trailParticles.start();

      // 冰晶飞行动画
      this.scene.tweens.add({
        targets: crystalContainer,
        x: config.x + Math.cos(angle) * config.range,
        y: config.y + Math.sin(angle) * config.range,
        alpha: 0.5,
        duration: 400,
        onComplete: () => {
          crystalContainer.destroy();
          trailParticles.destroy();
        },
      });
    }

    // 设置自动回收
    const duration = config.duration || 500;

    this.setEffectDuration(container, duration);
  }

  /**
   * 停用效果时的额外清理
   */
  protected deactivate(obj: Phaser.GameObjects.Container): void {
    // 清理 graphics
    const centerBurst = obj.getByName('frost_center_burst') as Phaser.GameObjects.Graphics;
    if (centerBurst) centerBurst.clear();

    // 调用父类方法进行基础清理
    super.deactivate(obj);
  }
}
