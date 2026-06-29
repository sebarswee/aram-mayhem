import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../VisualEffectPool';
import { VisualEffectUtils } from '@/graphics/VisualEffectUtils';
import { Skill } from '@/types';

/**
 * 陨石坠落效果配置
 */
export interface MeteorEffectConfig extends VisualEffectConfig {
  radius: number;
  damage: number;
  skill: Skill;
  /** 预警持续时间（毫秒），默认 500 */
  warningDuration?: number;
  /** 爆炸持续时间（毫秒），默认 1000 */
  explosionDuration?: number;
  /** 总持续时间（毫秒），默认 1500（预警 + 爆炸） */
  duration?: number;
  /** 预警图层配置 */
  warningLayerConfigs?: Array<{
    radiusMultiplier: number;
    color: number;
    alpha: number;
  }>;
  /** 爆炸图层配置 */
  explosionLayerConfigs?: Array<{
    radiusMultiplier: number;
    color: number;
    alpha: number;
  }>;
  /** 应用伤害回调 */
  applyDamage?: (enemies: Phaser.GameObjects.GameObject[]) => void;
}

/**
 * 陨石坠落效果对象池
 *
 * 管理 Meteor 技能的视觉效果复用
 *
 * 池化元素：
 * - 3 层预警圆 (warning_layer_0, warning_layer_1, warning_layer_2)
 * - 4 层爆炸圆 (explosion_layer_0 到 3)
 * - 1 个火焰粒子发射器 (explosion_particles)
 */
export class MeteorEffectPool extends VisualEffectPool<MeteorEffectConfig> {
  constructor(scene: Phaser.Scene, initialSize: number = 3) {
    // 第一步：先跳过父类的自动预热
    super(
      scene,
      // 延迟绑定，warmUp 时才会调用
      () => (this as any)._createFn(),
      (obj, config: MeteorEffectConfig) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'MeteorEffectPool', skipInitialWarmUp: true }
    );

    // 第二步：设置实际的创建和重置函数
    (this as any)._createFn = this.createMeteorEffect.bind(this);
    (this as any)._resetFn = this.resetMeteorEffect.bind(this);

    // 第三步：手动预热
    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建陨石坠落效果容器
   */
  private createMeteorEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建 3 层预警圆
    for (let i = 0; i < 3; i++) {
      const warningLayer = this.scene.add.circle(0, 0, 100, 0xff4400, 0.15);
      warningLayer.setName(`warning_layer_${i}`);
      container.add(warningLayer);
    }

    // 预创建 4 层爆炸圆
    for (let i = 0; i < 4; i++) {
      const explosionLayer = this.scene.add.circle(0, 0, 100, 0xff4400, 0.5);
      explosionLayer.setName(`explosion_layer_${i}`);
      explosionLayer.setVisible(false); // 初始隐藏
      container.add(explosionLayer);
    }

    // 预创建火焰粒子发射器
    const particles = this.scene.add.particles(0, 0, 'particle_fire_core', {
      speed: { min: 150, max: 350 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      alpha: { start: 0.7, end: 0 },
      tint: [0xff4400, 0xff6600, 0xffaa00, 0xffffff],
      lifespan: 550,
      frequency: 20,
      quantity: 4,
      emitting: false, // 初始不发射
    });
    particles.setName('explosion_particles');
    container.add(particles);

    container.setDepth(95);
    return container;
  }

  /**
   * 重置并配置陨石坠落效果
   */
  private resetMeteorEffect(
    container: Phaser.GameObjects.Container,
    config: MeteorEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);

    const radius = config.radius;
    const warningDuration = config.warningDuration ?? 500;
    const explosionDuration = config.explosionDuration ?? 1000;
    const totalDuration = config.duration ?? (warningDuration + explosionDuration);

    // 默认预警图层配置
    const warningLayerConfigs = config.warningLayerConfigs ?? [
      { radiusMultiplier: 0.6, color: 0xff4400, alpha: 0.15 },
      { radiusMultiplier: 0.8, color: 0xff4400, alpha: 0.23 },
      { radiusMultiplier: 1.0, color: 0xff4400, alpha: 0.31 },
    ];

    // 默认爆炸图层配置
    const explosionLayerConfigs = config.explosionLayerConfigs ?? [
      { radiusMultiplier: 1.1, color: 0xff2200, alpha: 0.5 },
      { radiusMultiplier: 1.0, color: 0xff6600, alpha: 0.7 },
      { radiusMultiplier: 0.7, color: 0xffaa00, alpha: 0.85 },
      { radiusMultiplier: 0.4, color: 0xffffff, alpha: 0.95 },
    ];

    // 重置预警图层
    warningLayerConfigs.forEach((layerConfig, i) => {
      const layer = container.getByName(`warning_layer_${i}`) as Phaser.GameObjects.Arc;
      if (layer) {
        layer.setRadius(radius * layerConfig.radiusMultiplier);
        layer.setFillStyle(layerConfig.color, layerConfig.alpha);
        layer.setPosition(0, 0);
        layer.setScale(1, 1);
        layer.setAlpha(layerConfig.alpha);
        layer.setDepth(18 + i);
        layer.setVisible(true);
      }
    });

    // 隐藏爆炸图层（等待预警结束）
    explosionLayerConfigs.forEach((_, i) => {
      const layer = container.getByName(`explosion_layer_${i}`) as Phaser.GameObjects.Arc;
      if (layer) {
        layer.setVisible(false);
        layer.setRadius(100); // 重置为默认值
      }
    });

    // 停止粒子发射
    const particlesObj = container.getByName('explosion_particles');
    if (particlesObj && particlesObj instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
      const particles = particlesObj as Phaser.GameObjects.Particles.ParticleEmitter;
      particles.stop();
    }

    // 预警脉动 tween（repeat: 2，有限次数）
    const warningLayers = warningLayerConfigs.map((_, i) =>
      container.getByName(`warning_layer_${i}`) as Phaser.GameObjects.Arc
    ).filter(l => l);

    const pulseTween = this.scene.tweens.add({
      targets: warningLayers,
      scale: 1.1,
      alpha: 0.5,
      duration: 200,
      yoyo: true,
      repeat: 2,
    });
    this.addManagedTween(container, pulseTween, {
      autoStop: true,
      tag: 'warning_pulse',
    });

    // 预警结束后触发爆炸
    this.createDelayedCall(container, warningDuration, () => {
      // 隐藏预警图层
      warningLayers.forEach(layer => {
        if (layer) {
          layer.setVisible(false);
        }
      });

      // 显示并配置爆炸图层
      explosionLayerConfigs.forEach((layerConfig, i) => {
        const layer = container.getByName(`explosion_layer_${i}`) as Phaser.GameObjects.Arc;
        if (layer) {
          layer.setRadius(radius * layerConfig.radiusMultiplier);
          layer.setFillStyle(layerConfig.color, layerConfig.alpha);
          layer.setPosition(0, 0);
          layer.setScale(1, 1);
          layer.setAlpha(layerConfig.alpha);
          layer.setDepth(95 + i);
          layer.setVisible(true);
        }
      });

      // 屏幕震动和闪光
      VisualEffectUtils.screenShake(this.scene, { intensity: 0.025, duration: 250 });
      VisualEffectUtils.screenFlash(this.scene, { color: 0xff6600, intensity: 0.5, duration: 180 });

      // 冲击波效果（使用 VisualEffectUtils 创建瞬发效果）
      VisualEffectUtils.createShockwave(this.scene, config.x, config.y, {
        color: 0xff6600,
        radius: radius * 1.2,
        rings: 5,
        duration: 450,
      });

      // 启动粒子发射器
      const particlesObj = container.getByName('explosion_particles');
      if (particlesObj && particlesObj instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
        const particles = particlesObj as Phaser.GameObjects.Particles.ParticleEmitter;
        // 设置发射区域
        const circle = new Phaser.Geom.Circle(0, 0, radius * 0.8);
        const randomZone = new Phaser.GameObjects.Particles.Zones.RandomZone(
          circle as Phaser.Types.GameObjects.Particles.RandomZoneSource
        );
        particles.setEmitZone(randomZone);
        particles.explode(60); // 爆发 60 个粒子
        particles.setDepth(100);
      }

      // 应用伤害（如果有回调）
      if (config.applyDamage) {
        // 使用场景物理引擎检测范围内的敌人
        const bodies = this.scene.physics.overlapCirc(config.x, config.y, radius);
        config.applyDamage(bodies.map(b => b.gameObject));
      }

      // 爆炸消散 tween
      const explosionLayers = explosionLayerConfigs.map((_, i) =>
        container.getByName(`explosion_layer_${i}`) as Phaser.GameObjects.Arc
      ).filter(l => l && l.visible);

      const fadeTween = this.scene.tweens.add({
        targets: explosionLayers,
        alpha: 0,
        scale: 1.3,
        duration: 550,
      });
      this.addManagedTween(container, fadeTween, {
        autoStop: true,
        tag: 'explosion_fade',
      });
    }, { tag: 'explosion_trigger' });

    // 设置自动回收
    if (totalDuration > 0) {
      this.setEffectDuration(container, totalDuration);
    }
  }

  /**
   * 停用效果时的额外清理
   */
  protected deactivate(obj: Phaser.GameObjects.Container): void {
    // 停止所有托管的 tweens（包括预警脉动和爆炸消散）
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

    // 停止粒子发射
    const particlesObj = obj.getByName('explosion_particles');
    if (particlesObj && particlesObj instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
      const particles = particlesObj as Phaser.GameObjects.Particles.ParticleEmitter;
      particles.stop();
    }

    // 隐藏所有图层
    for (let i = 0; i < 3; i++) {
      const layer = obj.getByName(`warning_layer_${i}`) as Phaser.GameObjects.Arc;
      if (layer) {
        layer.setVisible(false);
      }
    }
    for (let i = 0; i < 4; i++) {
      const layer = obj.getByName(`explosion_layer_${i}`) as Phaser.GameObjects.Arc;
      if (layer) {
        layer.setVisible(false);
      }
    }

    // 调用父类方法进行基础清理
    super.deactivate(obj);
  }
}