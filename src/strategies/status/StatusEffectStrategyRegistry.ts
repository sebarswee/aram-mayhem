import { Enemy } from '@/entities/Enemy';
import { Player } from '@/entities/Player';
import { SkillEffect } from '@/types';
import Phaser from 'phaser';

/**
 * 状态效果执行上下文
 */
export interface StatusEffectExecutionContext {
  scene: Phaser.Scene;
  player: Player;
  enemy?: Enemy;
}

/**
 * 状态效果策略接口
 */
export interface StatusEffectStrategy {
  /**
   * 执行状态效果
   */
  execute(effect: SkillEffect, context: StatusEffectExecutionContext): void;
}

/**
 * 状态效果策略注册表
 */
export class StatusEffectStrategyRegistry {
  private static instance: StatusEffectStrategyRegistry;
  private strategies: Map<string, StatusEffectStrategy> = new Map();

  private constructor() {}

  static getInstance(): StatusEffectStrategyRegistry {
    if (!StatusEffectStrategyRegistry.instance) {
      StatusEffectStrategyRegistry.instance = new StatusEffectStrategyRegistry();
    }
    return StatusEffectStrategyRegistry.instance;
  }

  register(effectType: string, strategy: StatusEffectStrategy): void {
    this.strategies.set(effectType, strategy);
  }

  get(effectType: string): StatusEffectStrategy | undefined {
    return this.strategies.get(effectType);
  }

  execute(effect: SkillEffect, context: StatusEffectExecutionContext): boolean {
    const strategy = this.strategies.get(effect.type);
    if (strategy) {
      strategy.execute(effect, context);
      return true;
    }
    return false;
  }

  hasStrategy(effectType: string): boolean {
    return this.strategies.has(effectType);
  }
}

export const statusEffectStrategyRegistry = StatusEffectStrategyRegistry.getInstance();