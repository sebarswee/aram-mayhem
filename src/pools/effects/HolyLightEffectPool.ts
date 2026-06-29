import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../VisualEffectPool';

/**
 * 圣光效果配置
 */
export interface HolyLightEffectConfig extends VisualEffectConfig {
  range: number;
  duration: number;
}

/**
 * 圣光效果对象池
 *
 * 管理 HolyLight 技能的视觉效果复用
 * - 中心爆发图形（graphics）
 * - 3 层光环（circle）
 * - 3 层光柱（rectangle）
 * - 12 个光芒射线（graphics）
 * - 瞬态效果（约 600ms）
 */
export class HolyLightEffectPool extends VisualEffectPool<HolyLightEffectConfig> {
  constructor(scene: Phaser.Scene, initialSize: number = 5) {
    super(
      scene,
      () => (this as any)._createFn(),
      (obj, config: HolyLightEffectConfig) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'HolyLightEffectPool', skipInitialWarmUp: true }
    );

    (this as any)._createFn = this.createHolyLightEffect.bind(this);
    (this as any)._resetFn = this.resetHolyLightEffect.bind(this);

    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建圣光效果容器
   */
  private createHolyLightEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建中心爆发图形
    const centerBurst = this.scene.add.graphics();
    centerBurst.setName('holy_center_burst');
    container.add(centerBurst);

    // 预创建3层光环
    for (let i = 0; i < 3; i++) {
      const ring = this.scene.add.circle(0, 0, 30 + i * 20, 0xffcc00, 0.4 - i * 0.1);
      ring.setName(`holy_ring_${i}`);
      container.add(ring);
    }

    // 预创建3层光柱
    for (let i = 0; i < 3; i++) {
      const beam = this.scene.add.rectangle(0, 0, 80 - i * 15, 200, 0xffcc00, 0.25 + i * 0.1);
      beam.setName(`holy_beam_${i}`);
      container.add(beam);
    }

    // 预创建12个光芒射线
    for (let i = 0; i < 12; i++) {
      const ray = this.scene.add.graphics();
      ray.setName(`holy_ray_${i}`);
      container.add(ray);
    }

    container.setDepth(20);
    return container;
  }

  /**
   * 重置并配置圣光效果
   */
  private resetHolyLightEffect(
    container: Phaser.GameObjects.Container,
    config: HolyLightEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);

    // 重置中心爆发图形
    const centerBurst = container.getByName('holy_center_burst') as Phaser.GameObjects.Graphics;
    if (centerBurst) {
      centerBurst.clear();
      centerBurst.fillStyle(0xffffff, 0.95);
      centerBurst.fillCircle(0, 0, 25);
      centerBurst.fillStyle(0xffcc00, 0.9);
      centerBurst.fillCircle(0, 0, 40);
      centerBurst.setDepth(95);

      // 中心爆发动画
      this.scene.tweens.add({
        targets: centerBurst,
        scale: 2,
        alpha: 0,
        duration: 400,
      });
    }

    // 重置光环
    for (let i = 0; i < 3; i++) {
      const ring = container.getByName(`holy_ring_${i}`) as Phaser.GameObjects.Arc;
      if (ring) {
        const ringRadius = 30 + i * 20;
        ring.setRadius(ringRadius);
        ring.setFillStyle(0xffcc00, 0.4 - i * 0.1);
        ring.setPosition(0, 0);
        ring.setScale(1, 1);
        ring.setAlpha(0.4 - i * 0.1);
        ring.setDepth(90 + i);

        // 光环扩散动画
        this.scene.tweens.add({
          targets: ring,
          scale: 4,
          alpha: 0,
          duration: 500 + i * 100,
          delay: i * 80,
        });
      }
    }

    // 重置光柱
    const beamConfigs = [
      { width: 80, height: config.range * 2, color: 0xffcc00, alpha: 0.25, depth: 20 },
      { width: 50, height: config.range * 2, color: 0xffdd44, alpha: 0.35, depth: 21 },
      { width: 25, height: config.range * 2, color: 0xffffff, alpha: 0.5, depth: 22 },
    ];

    beamConfigs.forEach((beamConfig, i) => {
      const beam = container.getByName(`holy_beam_${i}`) as Phaser.GameObjects.Rectangle;
      if (beam) {
        beam.setSize(beamConfig.width, beamConfig.height);
        beam.setFillStyle(beamConfig.color, beamConfig.alpha);
        beam.setPosition(0, 0);
        beam.setAlpha(beamConfig.alpha);
        beam.setDepth(beamConfig.depth);
      }
    });

    // 重置光芒射线
    for (let i = 0; i < 12; i++) {
      const ray = container.getByName(`holy_ray_${i}`) as Phaser.GameObjects.Graphics;
      if (ray) {
        const angle = (i / 12) * Math.PI * 2;
        ray.clear();
        ray.fillStyle(0xffffff, 0.7);
        ray.fillTriangle(0, 0, -6, config.range, 6, config.range);
        ray.setPosition(0, 0);
        ray.setRotation(angle);
        ray.setDepth(23);
      }
    }

    // 收集所有元素进行淡出动画
    const allElements: (Phaser.GameObjects.Rectangle | Phaser.GameObjects.Graphics)[] = [];
    for (let i = 0; i < 3; i++) {
      const beam = container.getByName(`holy_beam_${i}`) as Phaser.GameObjects.Rectangle;
      if (beam) allElements.push(beam);
    }
    for (let i = 0; i < 12; i++) {
      const ray = container.getByName(`holy_ray_${i}`) as Phaser.GameObjects.Graphics;
      if (ray) allElements.push(ray);
    }

    // 消失动画
    this.scene.tweens.add({
      targets: allElements,
      alpha: 0,
      scale: 1.2,
      duration: 600,
    });

    // 设置自动回收
    const duration = config.duration || 700;

    this.setEffectDuration(container, duration);
  }

  /**
   * 停用效果时的额外清理
   */
  protected deactivate(obj: Phaser.GameObjects.Container): void {
    // 清理 graphics
    const centerBurst = obj.getByName('holy_center_burst') as Phaser.GameObjects.Graphics;
    if (centerBurst) centerBurst.clear();

    for (let i = 0; i < 12; i++) {
      const ray = obj.getByName(`holy_ray_${i}`) as Phaser.GameObjects.Graphics;
      if (ray) ray.clear();
    }

    // 调用父类方法进行基础清理
    super.deactivate(obj);
  }
}
