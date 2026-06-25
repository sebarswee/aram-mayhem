import { StatusEffectStrategy, StatusEffectExecutionContext } from './StatusEffectStrategyRegistry';
import { Skill } from '@/types';

/**
 * 被动效果数据
 */
export interface PassiveEffectData {
  type: string;
  value: number;
  element?: string;
}

/**
 * 被动效果策略接口
 */
export interface PassiveEffectStrategy {
  execute(effect: PassiveEffectData, stats: any): void;
}

/**
 * 被动效果策略注册表
 */
export class PassiveEffectStrategyRegistry {
  private static instance: PassiveEffectStrategyRegistry;
  private strategies: Map<string, PassiveEffectStrategy> = new Map();

  private constructor() {}

  static getInstance(): PassiveEffectStrategyRegistry {
    if (!PassiveEffectStrategyRegistry.instance) {
      PassiveEffectStrategyRegistry.instance = new PassiveEffectStrategyRegistry();
    }
    return PassiveEffectStrategyRegistry.instance;
  }

  register(effectType: string, strategy: PassiveEffectStrategy): void {
    this.strategies.set(effectType, strategy);
  }

  execute(effect: PassiveEffectData, stats: any): boolean {
    const strategy = this.strategies.get(effect.type);
    if (strategy) {
      strategy.execute(effect, stats);
      return true;
    }
    return false;
  }

  hasStrategy(effectType: string): boolean {
    return this.strategies.has(effectType);
  }
}

export const passiveEffectStrategyRegistry = PassiveEffectStrategyRegistry.getInstance();

// ==================== 被动效果策略实现 ====================

/**
 * 最大生命值提升策略
 */
export class MaxHpStrategy implements PassiveEffectStrategy {
  execute(effect: PassiveEffectData, stats: any): void {
    stats.maxHp *= (1 + effect.value);
    stats.currentHp *= (1 + effect.value);
  }
}

/**
 * 生命偷取策略
 */
export class LifestealStrategy implements PassiveEffectStrategy {
  execute(effect: PassiveEffectData, stats: any): void {
    stats.lifesteal += effect.value * 100;
  }
}

/**
 * 闪避策略
 */
export class DodgeStrategy implements PassiveEffectStrategy {
  execute(effect: PassiveEffectData, stats: any): void {
    stats.dodgeChance = (stats.dodgeChance || 0) + effect.value;
  }
}

/**
 * 暴击提升策略
 */
export class CritBoostStrategy implements PassiveEffectStrategy {
  execute(effect: PassiveEffectData, stats: any): void {
    stats.critRate += effect.value;
    stats.critDamage += effect.value;
  }
}

/**
 * 狂战士策略
 */
export class BerserkerStrategy implements PassiveEffectStrategy {
  execute(effect: PassiveEffectData, stats: any): void {
    stats.berserkerValue = (stats.berserkerValue || 0) + effect.value;
  }
}

/**
 * 速度提升策略
 */
export class SpeedStrategy implements PassiveEffectStrategy {
  execute(effect: PassiveEffectData, stats: any): void {
    stats.speed *= (1 + effect.value);
  }
}

/**
 * 冷却缩减策略
 */
export class CooldownReductionStrategy implements PassiveEffectStrategy {
  execute(effect: PassiveEffectData, stats: any): void {
    stats.cooldownReduction = (stats.cooldownReduction || 0) + effect.value;
  }
}

/**
 * 生命回复策略
 */
export class RegenStrategy implements PassiveEffectStrategy {
  execute(effect: PassiveEffectData, stats: any): void {
    stats.hpRegen = (stats.hpRegen || 0) + effect.value;
  }
}

/**
 * 元素伤害策略
 */
export class ElementDamageStrategy implements PassiveEffectStrategy {
  execute(effect: PassiveEffectData, stats: any): void {
    stats.skillDamageBonus = (stats.skillDamageBonus || 0) + effect.value;
  }
}

/**
 * 幸运策略
 */
export class LuckStrategy implements PassiveEffectStrategy {
  execute(effect: PassiveEffectData, stats: any): void {
    stats.luck = (stats.luck || 0) + effect.value;
  }
}

/**
 * 荆棘策略
 */
export class ThornsStrategy implements PassiveEffectStrategy {
  private player: any;

  setPlayer(player: any): void {
    this.player = player;
  }

  execute(effect: PassiveEffectData, _stats: any): void {
    if (this.player) {
      this.player.addReflectEffect({ value: effect.value, duration: 999999999 });
    }
  }
}

/**
 * 护盾增强策略
 */
export class ShieldBoostStrategy implements PassiveEffectStrategy {
  execute(effect: PassiveEffectData, stats: any): void {
    stats.shieldBoost = (stats.shieldBoost || 0) + effect.value;
  }
}

/**
 * 元素增强策略
 */
export class ElementBoostStrategy implements PassiveEffectStrategy {
  execute(effect: PassiveEffectData, stats: any): void {
    if (effect.element) {
      const key = `elementBoost_${effect.element}`;
      stats[key] = (stats[key] || 0) + effect.value;
    }
  }
}

/**
 * 攻击力策略
 */
export class AttackStrategy implements PassiveEffectStrategy {
  execute(effect: PassiveEffectData, stats: any): void {
    stats.attack = (stats.attack || 0) + effect.value;
  }
}

/**
 * 防御力策略
 */
export class DefenseStrategy implements PassiveEffectStrategy {
  execute(effect: PassiveEffectData, stats: any): void {
    stats.defense = (stats.defense || 0) + effect.value;
  }
}