import { SynergyEffectStrategy, SynergyExecutionContext } from './SynergyStrategyRegistry';
import { SynergyResult } from '@/types';
import { Enemy } from '@/entities/Enemy';

/**
 * 真实伤害策略 - 基于百分比的额外伤害
 */
export class TrueDamageStrategy implements SynergyEffectStrategy {
  execute(synergy: SynergyResult, enemy: Enemy, context: SynergyExecutionContext): void {
    const trueDamage = Math.floor(context.baseDamage * (synergy.value || 0.2));
    enemy.takeDamage(trueDamage);
  }
}

/**
 * 双倍伤害策略 - 造成额外等同于基础伤害的伤害
 */
export class DoubleDamageStrategy implements SynergyEffectStrategy {
  execute(_synergy: SynergyResult, enemy: Enemy, context: SynergyExecutionContext): void {
    enemy.takeDamage(context.baseDamage);
  }
}

/**
 * 保证暴击策略 - 额外暴击伤害
 */
export class GuaranteedCritStrategy implements SynergyEffectStrategy {
  execute(synergy: SynergyResult, enemy: Enemy, context: SynergyExecutionContext): void {
    const critBonus = Math.floor(context.baseDamage * (synergy.value || 0.5));
    enemy.takeDamage(critBonus);
  }
}

/**
 * 伤害增加策略 - 给玩家增加伤害buff
 */
export class DamageIncreaseStrategy implements SynergyEffectStrategy {
  execute(synergy: SynergyResult, enemy: Enemy, context: SynergyExecutionContext): void {
    const damageBuffValue = synergy.value || 0.3;
    const damageBuffDuration = synergy.duration || 5000;
    context.player.addStatusEffect({
      type: 'attack_boost',
      value: damageBuffValue,
      duration: damageBuffDuration,
    });
    enemy.takeDamage(context.baseDamage);
  }
}

/**
 * 伤害提升(无治疗)策略
 */
export class DamageBoostNoHealStrategy implements SynergyEffectStrategy {
  execute(synergy: SynergyResult, enemy: Enemy, context: SynergyExecutionContext): void {
    const boostedDamage = Math.floor(context.baseDamage * (1 + (synergy.value || 0.5)));
    enemy.takeDamage(boostedDamage);
  }
}