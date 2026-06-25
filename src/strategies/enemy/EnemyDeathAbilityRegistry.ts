import Phaser from 'phaser';
import { Enemy } from '@/entities/Enemy';

/**
 * 敌人死亡能力执行上下文
 */
export interface EnemyDeathContext {
  enemy: Enemy;
  scene: Phaser.Scene;
  params?: Record<string, any>;
}

/**
 * 敌人死亡能力策略接口
 */
export interface EnemyDeathAbilityStrategy {
  /**
   * 执行死亡能力
   */
  execute(context: EnemyDeathContext): void;
}

/**
 * 敌人死亡能力策略注册表
 */
export class EnemyDeathAbilityRegistry {
  private static instance: EnemyDeathAbilityRegistry;
  private strategies: Map<string, EnemyDeathAbilityStrategy> = new Map();

  private constructor() {}

  static getInstance(): EnemyDeathAbilityRegistry {
    if (!EnemyDeathAbilityRegistry.instance) {
      EnemyDeathAbilityRegistry.instance = new EnemyDeathAbilityRegistry();
    }
    return EnemyDeathAbilityRegistry.instance;
  }

  /**
   * 注册策略
   */
  register(type: string, strategy: EnemyDeathAbilityStrategy): void {
    this.strategies.set(type, strategy);
  }

  /**
   * 执行策略
   */
  execute(type: string, context: EnemyDeathContext): void {
    const strategy = this.strategies.get(type);
    if (strategy) {
      strategy.execute(context);
    }
  }

  /**
   * 检查是否已注册
   */
  hasStrategy(type: string): boolean {
    return this.strategies.has(type);
  }
}

export const enemyDeathAbilityRegistry = EnemyDeathAbilityRegistry.getInstance();

// ==================== 具体策略实现 ====================

/**
 * 死亡爆炸策略
 */
export class ExplodeOnDeathStrategy implements EnemyDeathAbilityStrategy {
  execute(context: EnemyDeathContext): void {
    const { enemy, scene, params } = context;
    const damage = params?.damage || 10;
    const radius = params?.radius || 50;

    // Visual effect
    const explosion = scene.add.circle(enemy.x, enemy.y, radius, 0xff4400, 0.6);
    explosion.setDepth(100);

    const shockwave = scene.add.circle(enemy.x, enemy.y, radius * 1.5, 0xffff00, 0.3);
    shockwave.setDepth(99);

    scene.tweens.add({
      targets: [explosion, shockwave],
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        explosion.destroy();
        shockwave.destroy();
      },
    });

    // Emit event for CollisionSystem to handle damage
    scene.events.emit('enemyExplosion', {
      x: enemy.x,
      y: enemy.y,
      radius,
      damage,
      sourceEnemy: enemy,
    });
  }
}

/**
 * 初始化敌人死亡能力策略
 */
export function initializeEnemyDeathAbilities(): void {
  enemyDeathAbilityRegistry.register('explode_on_death', new ExplodeOnDeathStrategy());
}
