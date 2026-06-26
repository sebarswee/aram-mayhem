import { Enemy } from '@/entities/Enemy';
import { SynergyResult, Element } from '@/types';
import Phaser from 'phaser';

/**
 * 协同效果执行上下文
 */
export interface SynergyExecutionContext {
  scene: Phaser.Scene;
  player: any; // Player type
  baseDamage: number;
  skillElement?: Element; // 技能元素，用于传递给伤害计算
  findEnemiesInRange: (x: number, y: number, range: number) => Enemy[];
}

/**
 * 协同效果策略接口
 */
export interface SynergyEffectStrategy {
  /**
   * 执行协同效果
   */
  execute(synergy: SynergyResult, enemy: Enemy, context: SynergyExecutionContext): void;
}

/**
 * 协同效果策略注册表
 */
export class SynergyStrategyRegistry {
  private static instance: SynergyStrategyRegistry;
  private strategies: Map<string, SynergyEffectStrategy> = new Map();

  private constructor() {
    this.registerDefaultStrategies();
  }

  static getInstance(): SynergyStrategyRegistry {
    if (!SynergyStrategyRegistry.instance) {
      SynergyStrategyRegistry.instance = new SynergyStrategyRegistry();
    }
    return SynergyStrategyRegistry.instance;
  }

  /**
   * 注册默认策略
   */
  private registerDefaultStrategies(): void {
    // 将在后续文件中导入并注册
  }

  /**
   * 注册策略
   */
  register(effectType: string, strategy: SynergyEffectStrategy): void {
    this.strategies.set(effectType, strategy);
  }

  /**
   * 获取策略
   */
  get(effectType: string): SynergyEffectStrategy | undefined {
    return this.strategies.get(effectType);
  }

  /**
   * 执行策略
   */
  execute(synergy: SynergyResult, enemy: Enemy, context: SynergyExecutionContext): boolean {
    const strategy = this.strategies.get(synergy.effect);
    if (strategy) {
      strategy.execute(synergy, enemy, context);
      return true;
    }
    return false;
  }

  /**
   * 检查是否已注册
   */
  hasStrategy(effectType: string): boolean {
    return this.strategies.has(effectType);
  }
}

export const synergyStrategyRegistry = SynergyStrategyRegistry.getInstance();