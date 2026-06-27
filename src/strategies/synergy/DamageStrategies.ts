import { SynergyEffectStrategy, SynergyExecutionContext } from './SynergyStrategyRegistry';
import { SynergyResult } from '@/types';
import { Enemy } from '@/entities/Enemy';
import { createAttackBoostVisualModifier } from '@/modifiers/visual/VisualModifiers';

/**
 * 真实伤害策略 - 基于百分比的额外伤害
 * 注意：真实伤害通常不触发元素效果，直接造成伤害
 */
export class TrueDamageStrategy implements SynergyEffectStrategy {
  execute(synergy: SynergyResult, enemy: Enemy, context: SynergyExecutionContext): void {
    const trueDamage = Math.floor(context.baseDamage * (synergy.value || 0.2));
    // 真实伤害绕过防御和克制，不传递元素
    enemy.takeDamage(trueDamage);
  }
}

/**
 * 双倍伤害策略 - 造成额外等同于基础伤害的伤害
 */
export class DoubleDamageStrategy implements SynergyEffectStrategy {
  execute(_synergy: SynergyResult, enemy: Enemy, context: SynergyExecutionContext): void {
    // 传递元素信息以触发克制加成
    enemy.takeDamage(context.baseDamage, context.skillElement);
  }
}

/**
 * 保证暴击策略 - 额外暴击伤害
 */
export class GuaranteedCritStrategy implements SynergyEffectStrategy {
  execute(synergy: SynergyResult, enemy: Enemy, context: SynergyExecutionContext): void {
    const critBonus = Math.floor(context.baseDamage * (synergy.value || 0.5));
    // 传递元素信息以触发克制加成
    enemy.takeDamage(critBonus, context.skillElement);
  }
}

/**
 * 伤害增加策略 - 给玩家增加伤害buff
 */
export class DamageIncreaseStrategy implements SynergyEffectStrategy {
  execute(synergy: SynergyResult, enemy: Enemy, context: SynergyExecutionContext): void {
    const damageBuffValue = synergy.value || 30;
    const damageBuffDuration = synergy.duration || 5000;
    context.player.modifierStack.addModifier(
      createAttackBoostVisualModifier(damageBuffValue, damageBuffDuration)
    );
    // 传递元素信息以触发克制加成
    enemy.takeDamage(context.baseDamage, context.skillElement);
  }
}

/**
 * 伤害提升(无治疗)策略
 */
export class DamageBoostNoHealStrategy implements SynergyEffectStrategy {
  execute(synergy: SynergyResult, enemy: Enemy, context: SynergyExecutionContext): void {
    const boostedDamage = Math.floor(context.baseDamage * (1 + (synergy.value || 0.5)));
    // 传递元素信息以触发克制加成
    enemy.takeDamage(boostedDamage, context.skillElement);
  }
}