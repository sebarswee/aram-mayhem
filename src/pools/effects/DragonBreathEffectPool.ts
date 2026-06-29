import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../VisualEffectPool';

/**
 * 炎龙吐息效果配置
 */
export interface DragonBreathEffectConfig extends VisualEffectConfig {
  /** 扇形半径 */
  radius: number;
  /** 扇形角度（弧度） */
  angleSpread: number;
  /** 玩家朝向角度（弧度） */
  playerAngle: number;
  /** 持续时间（毫秒） */
  duration: number;
  /** 图层配置 */
  layerConfigs: Array<{
    radius: number;
    color: number;
    alpha: number;
  }>;
  /** 火焰粒子配置 */
  fireParticleConfig: {
    speedMin: number;
    speedMax: number;
    lifespan: number;
    frequency: number;
    quantity: number;
  };
  /** 火花粒子配置 */
  sparkParticleConfig: {
    speedMin: number;
    speedMax: number;
    lifespan: number;
    frequency: number;
    quantity: number;
  };
}

/**
 * 炎龙吐息效果对象池
 *
 * 管理 DragonBreath 技能的视觉效果复用
 *
 * 池化元素：
 * - 4 层锥形火焰图层 (Graphics)
 * - 火焰粒子发射器
 * - 火花粒子发射器
 */
export class DragonBreathEffectPool extends VisualEffectPool<DragonBreathEffectConfig> {
  constructor(scene: Phaser.Scene, initialSize: number = 3) {
    // 第一步：先跳过父类的自动预热
    super(
      scene,
      // 延迟绑定，warmUp 时才会调用
      () => (this as any)._createFn(),
      (obj, config: DragonBreathEffectConfig) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'DragonBreathEffectPool', skipInitialWarmUp: true }
    );

    // 第二步：设置实际的创建和重置函数
    (this as any)._createFn = this.createDragonBreathEffect.bind(this);
    (this as any)._resetFn = this.resetDragonBreathEffect.bind(this);

    // 第三步：手动预热
    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建炎龙吐息效果容器
   */
  private createDragonBreathEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 创建龙头精灵
    const dragonHead = this.scene.add.image(0, 0, 'dragon_head');
    dragonHead.setName('dragon_head_sprite');
    dragonHead.setScale(0.8, 0.8);
    dragonHead.setOrigin(0.5, 0.5);
    dragonHead.setDepth(44);
    container.add(dragonHead);

    // 创建龙眼发光粒子发射器
    const eyeGlow = this.scene.add.particles(0, 0, 'particle_fire_core', {
      speed: { min: 10, max: 30 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.8, end: 0 },
      tint: [0xffff00, 0xffaa00, 0xff6600],
      lifespan: 300,
      frequency: 100,
      quantity: 1,
      emitting: false, // 初始不发射
    });
    eyeGlow.setName('eye_glow_particles');
    container.add(eyeGlow);

    // 预创建4个锥形火焰图层（使用 Graphics，因为需要绘制扇形）
    for (let i = 0; i < 4; i++) {
      const layer = this.scene.add.graphics();
      layer.setName(`breath_layer_${i}`);
      container.add(layer);
    }

    // 预创建火焰粒子发射器
    const fireParticles = this.scene.add.particles(0, 0, 'particle_fire_core', {
      speed: { min: 200, max: 450 },
      angle: { min: -30, max: 30 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0xff4400, 0xff6600, 0xffaa00, 0xffff00],
      lifespan: 500,
      frequency: 20,
      quantity: 4,
      emitting: false, // 初始不发射
    });
    fireParticles.setName('fire_particles');
    container.add(fireParticles);

    // 预创建火花粒子发射器
    const sparkParticles = this.scene.add.particles(0, 0, 'particle_fire_spark', {
      speed: { min: 250, max: 500 },
      angle: { min: -30, max: 30 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0xffffff, 0xffff00, 0xffaa00],
      lifespan: 400,
      frequency: 30,
      quantity: 3,
      emitting: false, // 初始不发射
    });
    sparkParticles.setName('spark_particles');
    container.add(sparkParticles);

    container.setDepth(38);
    return container;
  }

  /**
   * 重置并配置炎龙吐息效果
   */
  private resetDragonBreathEffect(
    container: Phaser.GameObjects.Container,
    config: DragonBreathEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);

    const playerAngle = config.playerAngle;
    const angleSpread = config.angleSpread;

    // 重置龙头精灵
    const dragonHead = container.getByName('dragon_head_sprite') as Phaser.GameObjects.Image;
    if (dragonHead) {
      dragonHead.setPosition(0, 0);
      dragonHead.setRotation(playerAngle + Math.PI / 2);
      dragonHead.setAlpha(1);
      dragonHead.setScale(0.8, 0.8);
      dragonHead.setVisible(true);
    }

    // 重置龙眼发光粒子
    const eyeGlowObj = container.getByName('eye_glow_particles');
    if (eyeGlowObj && eyeGlowObj instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
      const eyeGlow = eyeGlowObj as Phaser.GameObjects.Particles.ParticleEmitter;
      eyeGlow.setPosition(0, 0);
      eyeGlow.start();
    }

    // 重置锥形火焰图层
    config.layerConfigs.forEach((layerConfig, i) => {
      const layer = container.getByName(`breath_layer_${i}`) as Phaser.GameObjects.Graphics;
      if (layer) {
        // 清除之前的绘制
        layer.clear();

        // 重置位置和样式
        layer.setPosition(0, 0);
        layer.fillStyle(layerConfig.color, layerConfig.alpha);

        // 绘制扇形
        layer.beginPath();
        layer.moveTo(0, 0);
        layer.arc(0, 0, layerConfig.radius, playerAngle - angleSpread / 2, playerAngle + angleSpread / 2);
        layer.closePath();
        layer.fill();

        layer.setDepth(38 + i);
        layer.setAlpha(layerConfig.alpha);
        layer.setScale(1, 1);
        layer.setAngle(0);
      }
    });

    // 重置火焰粒子发射器
    const fireParticlesObj = container.getByName('fire_particles');
    if (fireParticlesObj && fireParticlesObj instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
      const fireParticles = fireParticlesObj as Phaser.GameObjects.Particles.ParticleEmitter;
      // 计算粒子发射角度范围（转换为度数）
      const angleMin = (playerAngle - angleSpread / 2) * 180 / Math.PI;
      const angleMax = (playerAngle + angleSpread / 2) * 180 / Math.PI;

      // 直接设置粒子属性（Phaser 3.60+ API）
      (fireParticles as any).angle = { min: angleMin, max: angleMax };
      (fireParticles as any).speed = { min: config.fireParticleConfig.speedMin, max: config.fireParticleConfig.speedMax };
      (fireParticles as any).lifespan = config.fireParticleConfig.lifespan;
      (fireParticles as any).frequency = config.fireParticleConfig.frequency;
      (fireParticles as any).quantity = config.fireParticleConfig.quantity;
      fireParticles.setPosition(0, 0);
      fireParticles.setDepth(42);
      fireParticles.start();
    }

    // 重置火花粒子发射器
    const sparkParticlesObj = container.getByName('spark_particles');
    if (sparkParticlesObj && sparkParticlesObj instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
      const sparkParticles = sparkParticlesObj as Phaser.GameObjects.Particles.ParticleEmitter;
      const angleMin = (playerAngle - angleSpread / 2) * 180 / Math.PI;
      const angleMax = (playerAngle + angleSpread / 2) * 180 / Math.PI;

      (sparkParticles as any).angle = { min: angleMin, max: angleMax };
      (sparkParticles as any).speed = { min: config.sparkParticleConfig.speedMin, max: config.sparkParticleConfig.speedMax };
      (sparkParticles as any).lifespan = config.sparkParticleConfig.lifespan;
      (sparkParticles as any).frequency = config.sparkParticleConfig.frequency;
      (sparkParticles as any).quantity = config.sparkParticleConfig.quantity;
      sparkParticles.setPosition(0, 0);
      sparkParticles.setDepth(43);
      sparkParticles.start();
    }

    // 设置自动回收（使用托管定时器）
    if (config.duration && config.duration > 0) {
      this.setEffectDuration(container, config.duration);
    }
  }

  /**
   * 更新效果位置和角度（用于跟随玩家）
   *
   * @param container 效果容器
   * @param x 新 X 坐标
   * @param y 新 Y 坐标
   * @param playerAngle 新角度
   * @param angleSpread 角度范围
   * @param layerConfigs 图层配置
   */
  updateEffectTransform(
    container: Phaser.GameObjects.Container,
    x: number,
    y: number,
    playerAngle: number,
    angleSpread: number,
    layerConfigs: DragonBreathEffectConfig['layerConfigs']
  ): void {
    container.setPosition(x, y);

    // 更新龙头位置和旋转
    const dragonHead = container.getByName('dragon_head_sprite') as Phaser.GameObjects.Image;
    if (dragonHead) {
      dragonHead.setRotation(playerAngle + Math.PI / 2);
    }

    // 更新龙眼发光位置
    const eyeGlowObj = container.getByName('eye_glow_particles');
    if (eyeGlowObj && eyeGlowObj instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
      const eyeGlow = eyeGlowObj as Phaser.GameObjects.Particles.ParticleEmitter;
      eyeGlow.setPosition(0, 0);
    }

    // 重绘锥形火焰图层
    layerConfigs.forEach((layerConfig, i) => {
      const layer = container.getByName(`breath_layer_${i}`) as Phaser.GameObjects.Graphics;
      if (layer) {
        layer.clear();
        layer.fillStyle(layerConfig.color, layerConfig.alpha);
        layer.beginPath();
        layer.moveTo(0, 0);
        layer.arc(0, 0, layerConfig.radius, playerAngle - angleSpread / 2, playerAngle + angleSpread / 2);
        layer.closePath();
        layer.fill();
      }
    });

    // 更新粒子发射角度
    const angleMin = (playerAngle - angleSpread / 2) * 180 / Math.PI;
    const angleMax = (playerAngle + angleSpread / 2) * 180 / Math.PI;

    const fireParticlesObj = container.getByName('fire_particles');
    if (fireParticlesObj && fireParticlesObj instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
      const fireParticles = fireParticlesObj as Phaser.GameObjects.Particles.ParticleEmitter;
      (fireParticles as any).angle = { min: angleMin, max: angleMax };
    }

    const sparkParticlesObj = container.getByName('spark_particles');
    if (sparkParticlesObj && sparkParticlesObj instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
      const sparkParticles = sparkParticlesObj as Phaser.GameObjects.Particles.ParticleEmitter;
      (sparkParticles as any).angle = { min: angleMin, max: angleMax };
    }
  }

  /**
   * 停用效果时的额外清理
   */
  protected deactivate(obj: Phaser.GameObjects.Container): void {
    // 停止火焰粒子发射
    const fireParticlesObj = obj.getByName('fire_particles');
    if (fireParticlesObj && fireParticlesObj instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
      const fireParticles = fireParticlesObj as Phaser.GameObjects.Particles.ParticleEmitter;
      fireParticles.stop();
    }

    // 停止火花粒子发射
    const sparkParticlesObj = obj.getByName('spark_particles');
    if (sparkParticlesObj && sparkParticlesObj instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
      const sparkParticles = sparkParticlesObj as Phaser.GameObjects.Particles.ParticleEmitter;
      sparkParticles.stop();
    }

    // 停止龙眼发光粒子
    const eyeGlowObj = obj.getByName('eye_glow_particles');
    if (eyeGlowObj && eyeGlowObj instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
      const eyeGlow = eyeGlowObj as Phaser.GameObjects.Particles.ParticleEmitter;
      eyeGlow.stop();
    }

    // 重置龙头精灵
    const dragonHead = obj.getByName('dragon_head_sprite') as Phaser.GameObjects.Image;
    if (dragonHead) {
      dragonHead.setAlpha(0);
      dragonHead.setRotation(0);
    }

    // 清除所有 Graphics 的绘制
    for (let i = 0; i < 4; i++) {
      const layer = obj.getByName(`breath_layer_${i}`) as Phaser.GameObjects.Graphics;
      if (layer) {
        layer.clear();
      }
    }

    // 调用父类方法进行基础清理
    super.deactivate(obj);
  }
}
