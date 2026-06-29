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
 * - 陨石下落图像 (meteor_sprite)
 * - 3 层预警圆 (warning_layer_0, warning_layer_1, warning_layer_2)
 * - 4 层爆炸圆 (explosion_layer_0 到 3)
 * - 岩浆粒子发射器 (magma_particles)
 * - 岩石粒子发射器 (rock_particles)
 * - 火焰粒子发射器 (fire_particles)
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

    // 陨石下落图像（使用 meteor_falling 纹理）
    const meteorSprite = this.scene.add.image(0, 0, 'meteor_falling');
    meteorSprite.setName('meteor_sprite');
    meteorSprite.setVisible(false); // 初始隐藏，在预警阶段显示
    meteorSprite.setScale(1.2); // 增大陨石尺寸
    container.add(meteorSprite);

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

    // 预创建岩浆粒子发射器
    const magmaParticles = this.scene.add.particles(0, 0, 'particle_magma', {
      speed: { min: 100, max: 280 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.9, end: 0 },
      tint: [0xff2200, 0xff4400, 0xff6600, 0xff8800],
      lifespan: 600,
      frequency: 25,
      quantity: 3,
      emitting: false,
    });
    magmaParticles.setName('magma_particles');
    container.add(magmaParticles);

    // 预创建岩石粒子发射器
    const rockParticles = this.scene.add.particles(0, 0, 'particle_rock', {
      speed: { min: 200, max: 450 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0.1 },
      alpha: { start: 1, end: 0.3 },
      rotate: { min: 0, max: 360 },
      lifespan: 800,
      frequency: 30,
      quantity: 2,
      emitting: false,
    });
    rockParticles.setName('rock_particles');
    container.add(rockParticles);

    // 预创建火焰粒子发射器（保留原有的火焰效果）
    const fireParticles = this.scene.add.particles(0, 0, 'particle_fire_core', {
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
    fireParticles.setName('fire_particles');
    container.add(fireParticles);

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

    // 重置陨石精灵（从上方落下）
    const meteorSprite = container.getByName('meteor_sprite') as Phaser.GameObjects.Image;
    if (meteorSprite) {
      // 检查纹理是否存在
      if (this.scene.textures.exists('meteor_falling')) {
        meteorSprite.setVisible(true);
        meteorSprite.setPosition(0, -radius * 3); // 从上方开始
        meteorSprite.setAlpha(1);
        meteorSprite.setScale(1.0); // 初始缩放
        meteorSprite.setAngle(0);
        meteorSprite.setDepth(94);

        // 陨石下落动画（下落过程中逐渐变大）
        const fallTween = this.scene.tweens.add({
          targets: meteorSprite,
          y: 0,
          angle: 360,
          scale: 1.5, // 落地时更大
          duration: warningDuration,
          ease: 'Quad.easeIn',
        });
        this.addManagedTween(container, fallTween, {
          autoStop: true,
          tag: 'meteor_fall',
        });
      } else {
        meteorSprite.setVisible(false);
      }
    }

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

    // 停止所有粒子发射器
    const particleNames = ['magma_particles', 'rock_particles', 'fire_particles', 'explosion_particles'];
    particleNames.forEach(name => {
      const particlesObj = container.getByName(name);
      if (particlesObj && particlesObj instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
        const particles = particlesObj as Phaser.GameObjects.Particles.ParticleEmitter;
        particles.stop();
      }
    });

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
      // 隐藏陨石精灵
      if (meteorSprite) {
        meteorSprite.setVisible(false);
      }

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

      // 设置发射区域
      const circle = new Phaser.Geom.Circle(0, 0, radius * 0.8);
      const randomZone = new Phaser.GameObjects.Particles.Zones.RandomZone(
        circle as Phaser.Types.GameObjects.Particles.RandomZoneSource
      );

      // 启动岩浆粒子发射器
      const magmaParticles = container.getByName('magma_particles');
      if (magmaParticles && magmaParticles instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
        const particles = magmaParticles as Phaser.GameObjects.Particles.ParticleEmitter;
        particles.setEmitZone(randomZone);
        particles.explode(40);
        particles.setDepth(100);
      }

      // 启动岩石粒子发射器
      const rockParticles = container.getByName('rock_particles');
      if (rockParticles && rockParticles instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
        const particles = rockParticles as Phaser.GameObjects.Particles.ParticleEmitter;
        particles.setEmitZone(randomZone);
        particles.explode(25);
        particles.setDepth(101);
      }

      // 启动火焰粒子发射器
      const fireParticles = container.getByName('fire_particles');
      if (fireParticles && fireParticles instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
        const particles = fireParticles as Phaser.GameObjects.Particles.ParticleEmitter;
        particles.setEmitZone(randomZone);
        particles.explode(35);
        particles.setDepth(99);
      }

      // 兼容旧版粒子发射器（如果存在）
      const oldParticlesObj = container.getByName('explosion_particles');
      if (oldParticlesObj && oldParticlesObj instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
        const particles = oldParticlesObj as Phaser.GameObjects.Particles.ParticleEmitter;
        particles.setEmitZone(randomZone);
        particles.explode(60);
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
    // 停止所有托管的 tweens（包括预警脉动、陨石下落和爆炸消散）
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

    // 停止所有粒子发射器
    const particleNames = ['magma_particles', 'rock_particles', 'fire_particles', 'explosion_particles'];
    particleNames.forEach(name => {
      const particlesObj = obj.getByName(name);
      if (particlesObj && particlesObj instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
        const particles = particlesObj as Phaser.GameObjects.Particles.ParticleEmitter;
        particles.stop();
      }
    });

    // 隐藏陨石精灵
    const meteorSprite = obj.getByName('meteor_sprite') as Phaser.GameObjects.Image;
    if (meteorSprite) {
      meteorSprite.setVisible(false);
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