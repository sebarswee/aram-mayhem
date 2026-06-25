import Phaser from 'phaser';

/**
 * 元素死亡效果上下文
 */
export interface ElementDeathContext {
  x: number;
  y: number;
  scene: Phaser.Scene;
  damage: number;
}

/**
 * 元素死亡效果策略接口
 */
export interface ElementDeathStrategy {
  /**
   * 创建死亡效果
   */
  create(context: ElementDeathContext): void;
}

/**
 * 元素死亡效果策略注册表
 */
export class ElementDeathRegistry {
  private static instance: ElementDeathRegistry;
  private strategies: Map<string, ElementDeathStrategy> = new Map();

  private constructor() {}

  static getInstance(): ElementDeathRegistry {
    if (!ElementDeathRegistry.instance) {
      ElementDeathRegistry.instance = new ElementDeathRegistry();
    }
    return ElementDeathRegistry.instance;
  }

  /**
   * 注册策略
   */
  register(element: string, strategy: ElementDeathStrategy): void {
    this.strategies.set(element, strategy);
  }

  /**
   * 创建效果
   */
  create(element: string, context: ElementDeathContext): void {
    const strategy = this.strategies.get(element);
    if (strategy) {
      strategy.create(context);
    }
  }

  /**
   * 检查是否已注册
   */
  hasStrategy(element: string): boolean {
    return this.strategies.has(element);
  }
}

export const elementDeathRegistry = ElementDeathRegistry.getInstance();

// ==================== 具体策略实现 ====================

/**
 * 火焰死亡效果
 */
export class FireDeathStrategy implements ElementDeathStrategy {
  create(context: ElementDeathContext): void {
    const { x, y, scene, damage } = context;
    const explosionRadius = 60;

    const explosion = scene.add.circle(x, y, 30, 0xff8800, 0.8);
    explosion.setDepth(41);

    const shockwave = scene.add.circle(x, y, 50, 0xff4400, 0.4);
    shockwave.setDepth(40);

    const particles = scene.add.particles(x, y, 'particle_fire', {
      speed: { min: 100, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 300,
      quantity: 15,
      emitting: false,
    });
    particles.explode();
    particles.setDepth(42);

    scene.tweens.add({
      targets: [explosion, shockwave],
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 250,
      onComplete: () => {
        explosion.destroy();
        shockwave.destroy();
        particles.destroy();
      },
    });

    // 爆炸伤害
    const bodies = scene.physics.overlapCirc(x, y, explosionRadius) as Phaser.Physics.Arcade.Body[];
    for (const body of bodies) {
      const enemy = body.gameObject;
      if (enemy && enemy.active && 'takeDamage' in enemy && 'config' in enemy) {
        const explosionDamage = Math.floor(damage * 0.5);
        (enemy as any).takeDamage(explosionDamage);
      }
    }
  }
}

/**
 * 水死亡效果
 */
export class WaterDeathStrategy implements ElementDeathStrategy {
  create(context: ElementDeathContext): void {
    const { x, y, scene } = context;
    const ripple = scene.add.circle(x, y, 20, 0x4488ff, 0.5);
    ripple.setDepth(41);

    const ripple2 = scene.add.circle(x, y, 15, 0x66aaff, 0.6);
    ripple2.setDepth(42);

    scene.tweens.add({
      targets: [ripple, ripple2],
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        ripple.destroy();
        ripple2.destroy();
      },
    });

    const particles = scene.add.particles(x, y, 'particle_water', {
      speed: { min: 40, max: 80 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.7, end: 0 },
      lifespan: 400,
      quantity: 8,
      emitting: false,
    });
    particles.explode();
    particles.setDepth(42);

    scene.time.delayedCall(400, () => particles.destroy());
  }
}

/**
 * 冰死亡效果
 */
export class IceDeathStrategy implements ElementDeathStrategy {
  create(context: ElementDeathContext): void {
    const { x, y, scene } = context;
    const shards: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const shard = scene.add.circle(
        x + Math.cos(angle) * 5,
        y + Math.sin(angle) * 5,
        8,
        0x88ddff,
        0.8
      );
      shard.setDepth(41);
      shards.push(shard);

      scene.tweens.add({
        targets: shard,
        x: x + Math.cos(angle) * 40,
        y: y + Math.sin(angle) * 40,
        alpha: 0,
        scale: 0.3,
        duration: 200,
        onComplete: () => shard.destroy(),
      });
    }

    const flash = scene.add.circle(x, y, 25, 0xffffff, 0.9);
    flash.setDepth(40);
    scene.tweens.add({
      targets: flash,
      scale: 1.5,
      alpha: 0,
      duration: 150,
      onComplete: () => flash.destroy(),
    });
  }
}

/**
 * 闪电死亡效果
 */
export class LightningDeathStrategy implements ElementDeathStrategy {
  create(context: ElementDeathContext): void {
    const { x, y, scene } = context;
    const flash = scene.add.circle(x, y, 30, 0xffff00, 0.9);
    flash.setDepth(41);

    const particles = scene.add.particles(x, y, 'particle_lightning', {
      speed: { min: 80, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 200,
      quantity: 10,
      emitting: false,
    });
    particles.explode();
    particles.setDepth(42);

    scene.tweens.add({
      targets: [flash],
      alpha: 0,
      scale: 1.5,
      duration: 100,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        flash.destroy();
        particles.destroy();
      },
    });
  }
}

/**
 * 神圣死亡效果
 */
export class HolyDeathStrategy implements ElementDeathStrategy {
  create(context: ElementDeathContext): void {
    const { x, y, scene } = context;
    const ring = scene.add.circle(x, y, 25, 0xffcc00, 0.6);
    ring.setDepth(41);

    const particles = scene.add.particles(x, y, 'particle_holy', {
      speed: { min: 30, max: 60 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 350,
      quantity: 8,
      emitting: false,
    });
    particles.explode();
    particles.setDepth(42);

    scene.tweens.add({
      targets: ring,
      scaleX: 2.5,
      scaleY: 2.5,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        ring.destroy();
        particles.destroy();
      },
    });
  }
}

/**
 * 暗影死亡效果
 */
export class ShadowDeathStrategy implements ElementDeathStrategy {
  create(context: ElementDeathContext): void {
    const { x, y, scene } = context;
    const shadow = scene.add.circle(x, y, 35, 0x8800ff, 0.5);
    shadow.setDepth(41);

    const particles = scene.add.particles(x, y, 'particle_shadow', {
      speed: { min: 20, max: 50 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 500,
      quantity: 12,
      emitting: false,
    });
    particles.explode();
    particles.setDepth(42);

    scene.tweens.add({
      targets: shadow,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 400,
      onComplete: () => {
        shadow.destroy();
        particles.destroy();
      },
    });
  }
}

/**
 * 草死亡效果
 */
export class GrassDeathStrategy implements ElementDeathStrategy {
  create(context: ElementDeathContext): void {
    const { x, y, scene } = context;
    const particles = scene.add.particles(x, y, 'particle_grass', {
      speed: { min: 30, max: 60 },
      angle: { min: 200, max: 340 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 600,
      quantity: 8,
      rotate: { min: 0, max: 360 },
      emitting: false,
    });
    particles.explode();
    particles.setDepth(42);

    const glow = scene.add.circle(x, y, 20, 0x44ff44, 0.4);
    glow.setDepth(41);

    scene.tweens.add({
      targets: glow,
      scale: 1.5,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        glow.destroy();
        particles.destroy();
      },
    });
  }
}

/**
 * 土死亡效果
 */
export class EarthDeathStrategy implements ElementDeathStrategy {
  create(context: ElementDeathContext): void {
    const { x, y, scene } = context;
    const rocks: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + Math.random() * 0.5;
      const rock = scene.add.circle(x, y, 6 + Math.random() * 4, 0xaa8844, 0.9);
      rock.setDepth(41);
      rocks.push(rock);

      scene.tweens.add({
        targets: rock,
        x: x + Math.cos(angle) * 35,
        y: y + Math.sin(angle) * 35,
        alpha: 0,
        scale: 0.5,
        duration: 250,
        onComplete: () => rock.destroy(),
      });
    }

    const dust = scene.add.circle(x, y, 30, 0x886633, 0.4);
    dust.setDepth(40);

    scene.tweens.add({
      targets: dust,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 300,
      onComplete: () => dust.destroy(),
    });
  }
}

/**
 * 初始化元素死亡效果策略
 */
export function initializeElementDeathStrategies(): void {
  elementDeathRegistry.register('fire', new FireDeathStrategy());
  elementDeathRegistry.register('water', new WaterDeathStrategy());
  elementDeathRegistry.register('ice', new IceDeathStrategy());
  elementDeathRegistry.register('lightning', new LightningDeathStrategy());
  elementDeathRegistry.register('holy', new HolyDeathStrategy());
  elementDeathRegistry.register('shadow', new ShadowDeathStrategy());
  elementDeathRegistry.register('grass', new GrassDeathStrategy());
  elementDeathRegistry.register('earth', new EarthDeathStrategy());
}
