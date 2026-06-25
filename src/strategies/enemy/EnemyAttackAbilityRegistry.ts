import { Player } from '@/entities/Player';
import { Enemy } from '@/entities/Enemy';

/**
 * 敌人攻击能力执行上下文
 */
export interface EnemyAttackContext {
  enemy: Enemy;
  player: Player;
}

/**
 * 敌人攻击能力策略接口
 */
export interface EnemyAttackAbilityStrategy {
  /**
   * 执行攻击能力
   */
  execute(context: EnemyAttackContext, params?: Record<string, any>): void;
}

/**
 * 敌人攻击能力策略注册表
 */
export class EnemyAttackAbilityRegistry {
  private static instance: EnemyAttackAbilityRegistry;
  private strategies: Map<string, EnemyAttackAbilityStrategy> = new Map();

  private constructor() {}

  static getInstance(): EnemyAttackAbilityRegistry {
    if (!EnemyAttackAbilityRegistry.instance) {
      EnemyAttackAbilityRegistry.instance = new EnemyAttackAbilityRegistry();
    }
    return EnemyAttackAbilityRegistry.instance;
  }

  /**
   * 注册攻击能力策略
   */
  register(type: string, strategy: EnemyAttackAbilityStrategy): void {
    this.strategies.set(type, strategy);
  }

  /**
   * 执行攻击能力
   */
  execute(type: string, context: EnemyAttackContext, params?: Record<string, any>): void {
    const strategy = this.strategies.get(type);
    if (strategy) {
      strategy.execute(context, params);
    }
  }

  /**
   * 检查是否已注册
   */
  hasStrategy(type: string): boolean {
    return this.strategies.has(type);
  }
}

export const enemyAttackAbilityRegistry = EnemyAttackAbilityRegistry.getInstance();

// ==================== 具体策略实现 ====================

/**
 * 燃烧接触策略
 */
export class BurnOnContactStrategy implements EnemyAttackAbilityStrategy {
  execute(context: EnemyAttackContext, params?: Record<string, any>): void {
    const { player } = context;
    if (player.addStatusEffect) {
      player.addStatusEffect({
        type: 'burn',
        value: params?.damage || 5,
        duration: params?.duration || 2000,
      });
    }
  }
}

/**
 * 攻击减速策略
 */
export class SlowOnAttackStrategy implements EnemyAttackAbilityStrategy {
  execute(context: EnemyAttackContext, params?: Record<string, any>): void {
    const { player } = context;
    if (player.addStatusEffect) {
      player.addStatusEffect({
        type: 'slow',
        value: params?.slow || 0.3,
        duration: params?.duration || 1500,
      });
    }
  }
}

/**
 * 攻击中毒策略
 */
export class PoisonOnAttackStrategy implements EnemyAttackAbilityStrategy {
  execute(context: EnemyAttackContext, params?: Record<string, any>): void {
    const { player } = context;
    if (player.addStatusEffect) {
      player.addStatusEffect({
        type: 'poison',
        value: params?.damage || 5,
        duration: params?.duration || 3000,
      });
    }
  }
}

/**
 * 攻击定身策略
 */
export class RootOnAttackStrategy implements EnemyAttackAbilityStrategy {
  execute(context: EnemyAttackContext, params?: Record<string, any>): void {
    const { player } = context;
    if (player.addStatusEffect) {
      player.addStatusEffect({
        type: 'root',
        value: 1,
        duration: params?.duration || 500,
      });
    }
  }
}

/**
 * 初始化敌人攻击能力策略
 */
export function initializeEnemyAttackAbilities(): void {
  enemyAttackAbilityRegistry.register('burn_on_contact', new BurnOnContactStrategy());
  enemyAttackAbilityRegistry.register('slow_on_attack', new SlowOnAttackStrategy());
  enemyAttackAbilityRegistry.register('poison_on_attack', new PoisonOnAttackStrategy());
  enemyAttackAbilityRegistry.register('root_on_attack', new RootOnAttackStrategy());
}
