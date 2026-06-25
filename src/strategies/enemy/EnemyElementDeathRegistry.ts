import { Element } from '@/types';

/**
 * 元素死亡效果上下文
 */
export interface EnemyElementDeathContext {
  x: number;
  y: number;
  scene: Phaser.Scene;
  color: number;
}

/**
 * 敌人元素死亡效果策略接口
 */
export interface EnemyElementDeathStrategy {
  /**
   * 创建死亡效果
   */
  create(context: EnemyElementDeathContext): void;
}

/**
 * 敌人元素死亡效果策略注册表
 */
export class EnemyElementDeathRegistry {
  private static instance: EnemyElementDeathRegistry;
  private strategies: Map<Element, EnemyElementDeathStrategy> = new Map();

  private constructor() {}

  static getInstance(): EnemyElementDeathRegistry {
    if (!EnemyElementDeathRegistry.instance) {
      EnemyElementDeathRegistry.instance = new EnemyElementDeathRegistry();
    }
    return EnemyElementDeathRegistry.instance;
  }

  /**
   * 注册策略
   */
  register(element: Element, strategy: EnemyElementDeathStrategy): void {
    this.strategies.set(element, strategy);
  }

  /**
   * 创建效果
   */
  create(element: Element, context: EnemyElementDeathContext): void {
    const strategy = this.strategies.get(element);
    if (strategy) {
      strategy.create(context);
    }
  }

  /**
   * 检查是否已注册
   */
  hasStrategy(element: Element): boolean {
    return this.strategies.has(element);
  }
}

export const enemyElementDeathRegistry = EnemyElementDeathRegistry.getInstance();

// ==================== 具体策略实现 ====================

/**
 * 火焰死亡效果
 */
export class FireEnemyDeathStrategy implements EnemyElementDeathStrategy {
  create(context: EnemyElementDeathContext): void {
    const { x, y, scene, color } = context;
    const particles = scene.add.particles(x, y, 'particle_glow', {
      speed: { min: 80, max: 200 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: color,
      lifespan: 600,
      quantity: 12,
      emitting: false,
    });
    particles.explode();
    scene.time.delayedCall(700, () => particles.destroy());
  }
}

/**
 * 水死亡效果
 */
export class WaterEnemyDeathStrategy implements EnemyElementDeathStrategy {
  create(context: EnemyElementDeathContext): void {
    const { x, y, scene, color } = context;
    const particles = scene.add.particles(x, y, 'particle_glow', {
      speed: { min: 50, max: 120 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.8, end: 0 },
      tint: color,
      lifespan: 500,
      quantity: 10,
      emitting: false,
    });
    particles.explode();
    scene.time.delayedCall(600, () => particles.destroy());
  }
}

/**
 * 冰死亡效果
 */
export class IceEnemyDeathStrategy implements EnemyElementDeathStrategy {
  create(context: EnemyElementDeathContext): void {
    const { x, y, scene, color } = context;
    // Ice shards
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const shard = scene.add.circle(
        x + Math.cos(angle) * 10,
        y + Math.sin(angle) * 10,
        8,
        color,
        0.8
      );
      shard.setDepth(100);

      scene.tweens.add({
        targets: shard,
        x: x + Math.cos(angle) * 40,
        y: y + Math.sin(angle) * 40,
        alpha: 0,
        scale: 0.3,
        duration: 300,
        onComplete: () => shard.destroy(),
      });
    }
  }
}

/**
 * 闪电死亡效果
 */
export class LightningEnemyDeathStrategy implements EnemyElementDeathStrategy {
  create(context: EnemyElementDeathContext): void {
    const { x, y, scene, color } = context;
    const particles = scene.add.particles(x, y, 'particle_glow', {
      speed: { min: 100, max: 250 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: color,
      lifespan: 400,
      quantity: 15,
      emitting: false,
    });
    particles.explode();
    scene.time.delayedCall(500, () => particles.destroy());
  }
}

/**
 * 神圣死亡效果
 */
export class HolyEnemyDeathStrategy implements EnemyElementDeathStrategy {
  create(context: EnemyElementDeathContext): void {
    const { x, y, scene, color } = context;
    const particles = scene.add.particles(x, y, 'particle_glow', {
      speed: { min: 40, max: 100 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: color,
      lifespan: 800,
      quantity: 10,
      emitting: false,
    });
    particles.explode();
    scene.time.delayedCall(900, () => particles.destroy());
  }
}

/**
 * 暗影死亡效果
 */
export class ShadowEnemyDeathStrategy implements EnemyElementDeathStrategy {
  create(context: EnemyElementDeathContext): void {
    const { x, y, scene, color } = context;
    const particles = scene.add.particles(x, y, 'particle_glow', {
      speed: { min: 30, max: 80 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.8, end: 0 },
      tint: color,
      lifespan: 700,
      quantity: 8,
      emitting: false,
    });
    particles.explode();
    scene.time.delayedCall(800, () => particles.destroy());
  }
}

/**
 * 草死亡效果
 */
export class GrassEnemyDeathStrategy implements EnemyElementDeathStrategy {
  create(context: EnemyElementDeathContext): void {
    const { x, y, scene, color } = context;
    const particles = scene.add.particles(x, y, 'particle_glow', {
      speed: { min: 50, max: 120 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.8, end: 0 },
      tint: color,
      lifespan: 600,
      quantity: 10,
      rotate: { min: 0, max: 360 },
      emitting: false,
    });
    particles.explode();
    scene.time.delayedCall(700, () => particles.destroy());
  }
}

/**
 * 土死亡效果
 */
export class EarthEnemyDeathStrategy implements EnemyElementDeathStrategy {
  create(context: EnemyElementDeathContext): void {
    const { x, y, scene, color } = context;
    // Rock fragments
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + Math.random() * 0.3;
      const rock = scene.add.circle(
        x,
        y,
        6 + Math.random() * 4,
        color,
        0.9
      );
      rock.setDepth(100);

      scene.tweens.add({
        targets: rock,
        x: x + Math.cos(angle) * 35,
        y: y + Math.sin(angle) * 35,
        alpha: 0,
        scale: 0.5,
        duration: 300,
        onComplete: () => rock.destroy(),
      });
    }
  }
}

/**
 * 初始化敌人元素死亡效果策略
 */
export function initializeEnemyElementDeathStrategies(): void {
  enemyElementDeathRegistry.register('fire', new FireEnemyDeathStrategy());
  enemyElementDeathRegistry.register('water', new WaterEnemyDeathStrategy());
  enemyElementDeathRegistry.register('ice', new IceEnemyDeathStrategy());
  enemyElementDeathRegistry.register('lightning', new LightningEnemyDeathStrategy());
  enemyElementDeathRegistry.register('holy', new HolyEnemyDeathStrategy());
  enemyElementDeathRegistry.register('shadow', new ShadowEnemyDeathStrategy());
  enemyElementDeathRegistry.register('grass', new GrassEnemyDeathStrategy());
  enemyElementDeathRegistry.register('earth', new EarthEnemyDeathStrategy());
}
