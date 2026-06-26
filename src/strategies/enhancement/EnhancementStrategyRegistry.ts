import { Skill, SkillEnhancement } from '@/types';

/**
 * 强化效果策略接口
 */
export interface EnhancementStrategy {
  /**
   * 应用强化效果到技能
   */
  apply(skill: Skill, enhancement: SkillEnhancement): void;
}

/**
 * 强化效果策略注册表
 */
export class EnhancementStrategyRegistry {
  private static instance: EnhancementStrategyRegistry;
  private strategies: Map<string, EnhancementStrategy> = new Map();

  private constructor() {}

  static getInstance(): EnhancementStrategyRegistry {
    if (!EnhancementStrategyRegistry.instance) {
      EnhancementStrategyRegistry.instance = new EnhancementStrategyRegistry();
    }
    return EnhancementStrategyRegistry.instance;
  }

  /**
   * 注册强化策略
   */
  register(type: string, strategy: EnhancementStrategy): void {
    this.strategies.set(type, strategy);
  }

  /**
   * 应用强化效果
   */
  apply(type: string, skill: Skill, enhancement: SkillEnhancement): void {
    const strategy = this.strategies.get(type);
    if (strategy) {
      strategy.apply(skill, enhancement);
    }
  }

  /**
   * 检查是否已注册
   */
  hasStrategy(type: string): boolean {
    return this.strategies.has(type);
  }
}

export const enhancementStrategyRegistry = EnhancementStrategyRegistry.getInstance();

// ==================== 具体策略实现 ====================

/**
 * 范围强化策略
 * 注意：每次应用都从 baseValues 重新计算，所有强化效果叠加
 */
export class RangeEnhancementStrategy implements EnhancementStrategy {
  apply(skill: Skill, _enhancement: SkillEnhancement): void {
    // 计算所有范围强化的总加成
    let totalBonus = 0;
    for (const enhancement of skill.enhancements) {
      if (enhancement.type === 'range') {
        totalBonus += enhancement.value;
      }
    }
    skill.rangeValue = Math.floor(skill.baseValues.range * (1 + totalBonus));
  }
}

/**
 * 伤害强化策略
 * 注意：每次应用都从 baseValues 重新计算，所有强化效果叠加
 */
export class DamageEnhancementStrategy implements EnhancementStrategy {
  apply(skill: Skill, _enhancement: SkillEnhancement): void {
    // 计算所有伤害强化的总加成
    let totalBonus = 0;
    for (const enhancement of skill.enhancements) {
      if (enhancement.type === 'damage') {
        totalBonus += enhancement.value;
      }
    }
    skill.damage = Math.floor(skill.baseValues.damage * (1 + totalBonus));
  }
}

/**
 * 冷却强化策略
 * 注意：每次应用都从 baseValues 重新计算，所有强化效果叠加
 */
export class CooldownEnhancementStrategy implements EnhancementStrategy {
  apply(skill: Skill, _enhancement: SkillEnhancement): void {
    // 计算所有冷却强化的总减少
    let totalReduction = 0;
    for (const enhancement of skill.enhancements) {
      if (enhancement.type === 'cooldown') {
        totalReduction += enhancement.value;
      }
    }
    // 限制最大减少量，避免冷却时间为负
    totalReduction = Math.min(totalReduction, 0.8);
    skill.cooldown = Math.floor(skill.baseValues.cooldown * (1 - totalReduction));
  }
}

/**
 * 穿透强化策略
 */
export class PierceEnhancementStrategy implements EnhancementStrategy {
  apply(_skill: Skill, _enhancement: SkillEnhancement): void {
    // 穿透效果在投射物系统中处理
  }
}

/**
 * 分裂强化策略
 */
export class SplitEnhancementStrategy implements EnhancementStrategy {
  apply(_skill: Skill, _enhancement: SkillEnhancement): void {
    // 分裂效果在投射物系统中处理
  }
}

/**
 * 连射强化策略
 */
export class MulticastEnhancementStrategy implements EnhancementStrategy {
  apply(_skill: Skill, _enhancement: SkillEnhancement): void {
    // 连射效果在技能系统中处理
  }
}

/**
 * 投射物数量强化策略
 * 注意：不直接修改 baseValues，由 getProjectileCount 方法从 enhancements 数组计算
 */
export class ProjectileCountEnhancementStrategy implements EnhancementStrategy {
  apply(_skill: Skill, _enhancement: SkillEnhancement): void {
    // 投射物数量由 getProjectileCount 方法从 enhancements 数组计算
    // 不在这里直接修改 baseValues，避免双重叠加
  }
}

/**
 * 效果强化策略
 */
export class EffectEnhancementStrategy implements EnhancementStrategy {
  apply(_skill: Skill, _enhancement: SkillEnhancement): void {
    // 效果附加在碰撞系统中处理
  }
}

/**
 * 初始化强化效果策略
 */
export function initializeEnhancementStrategies(): void {
  enhancementStrategyRegistry.register('range', new RangeEnhancementStrategy());
  enhancementStrategyRegistry.register('damage', new DamageEnhancementStrategy());
  enhancementStrategyRegistry.register('cooldown', new CooldownEnhancementStrategy());
  enhancementStrategyRegistry.register('pierce', new PierceEnhancementStrategy());
  enhancementStrategyRegistry.register('split', new SplitEnhancementStrategy());
  enhancementStrategyRegistry.register('multicast', new MulticastEnhancementStrategy());
  enhancementStrategyRegistry.register('projectile_count', new ProjectileCountEnhancementStrategy());
  enhancementStrategyRegistry.register('effect', new EffectEnhancementStrategy());
}
