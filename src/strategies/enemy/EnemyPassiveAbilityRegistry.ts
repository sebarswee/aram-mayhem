import { Enemy } from '@/entities/Enemy';
import { EnemyAbility } from '@/types';

/**
 * 敌人被动能力执行上下文
 */
export interface EnemyPassiveContext {
  enemy: Enemy;
  ability: EnemyAbility;
}

/**
 * 敌人被动能力策略接口
 */
export interface EnemyPassiveAbilityStrategy {
  /**
   * 执行被动能力
   */
  execute(context: EnemyPassiveContext): void;
}

/**
 * 敌人被动能力策略注册表
 */
export class EnemyPassiveAbilityRegistry {
  private static instance: EnemyPassiveAbilityRegistry;
  private strategies: Map<string, EnemyPassiveAbilityStrategy> = new Map();

  private constructor() {}

  static getInstance(): EnemyPassiveAbilityRegistry {
    if (!EnemyPassiveAbilityRegistry.instance) {
      EnemyPassiveAbilityRegistry.instance = new EnemyPassiveAbilityRegistry();
    }
    return EnemyPassiveAbilityRegistry.instance;
  }

  /**
   * 注册策略
   */
  register(type: string, strategy: EnemyPassiveAbilityStrategy): void {
    this.strategies.set(type, strategy);
  }

  /**
   * 执行策略
   */
  execute(type: string, context: EnemyPassiveContext): void {
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

export const enemyPassiveAbilityRegistry = EnemyPassiveAbilityRegistry.getInstance();

// ==================== 具体策略实现 ====================

/**
 * 生命值提升策略
 */
export class HpBoostStrategy implements EnemyPassiveAbilityStrategy {
  execute(context: EnemyPassiveContext): void {
    const { enemy, ability } = context;
    const hpMultiplier = ability.params?.multiplier || 1.5;
    enemy.currentHp = Math.floor(enemy.config.hp * hpMultiplier);
    enemy.config = { ...enemy.config, hp: enemy.currentHp };
  }
}

/**
 * 速度提升策略
 */
export class SpeedBoostStrategy implements EnemyPassiveAbilityStrategy {
  execute(context: EnemyPassiveContext): void {
    const { enemy, ability } = context;
    const speedMultiplier = ability.params?.multiplier || 1.3;
    enemy.config = { ...enemy.config, speed: Math.floor(enemy.config.speed * speedMultiplier) };
  }
}

/**
 * 伤害减免策略
 */
export class DamageReductionStrategy implements EnemyPassiveAbilityStrategy {
  execute(_context: EnemyPassiveContext): void {
    // Handled in takeDamage
  }
}

/**
 * 接触燃烧策略
 */
export class BurnOnContactPassiveStrategy implements EnemyPassiveAbilityStrategy {
  execute(_context: EnemyPassiveContext): void {
    // Handled in CollisionSystem when enemy hits player
  }
}

/**
 * 初始化敌人被动能力策略
 */
export function initializeEnemyPassiveAbilities(): void {
  enemyPassiveAbilityRegistry.register('hp_boost', new HpBoostStrategy());
  enemyPassiveAbilityRegistry.register('speed_boost', new SpeedBoostStrategy());
  enemyPassiveAbilityRegistry.register('damage_reduction', new DamageReductionStrategy());
  enemyPassiveAbilityRegistry.register('burn_on_contact', new BurnOnContactPassiveStrategy());
}
