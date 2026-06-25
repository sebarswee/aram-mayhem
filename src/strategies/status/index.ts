import { statusEffectStrategyRegistry, StatusEffectStrategyRegistry } from './StatusEffectStrategyRegistry';
import { passiveEffectStrategyRegistry, PassiveEffectStrategyRegistry, ThornsStrategy } from './PassiveEffectStrategies';
import {
  BurnEffectStrategy,
  FreezeEffectStrategy,
  StunEffectStrategy,
  PoisonEffectStrategy,
  SlowEffectStrategy,
  KnockbackEffectStrategy,
  HealEffectStrategy,
  ShieldEffectStrategy,
  DefenseBreakEffectStrategy,
  DamageReflectEffectStrategy,
} from './EnemyEffectStrategies';
import {
  MaxHpStrategy,
  LifestealStrategy,
  DodgeStrategy,
  CritBoostStrategy,
  BerserkerStrategy,
  SpeedStrategy,
  CooldownReductionStrategy,
  RegenStrategy,
  ElementDamageStrategy,
  LuckStrategy,
  ShieldBoostStrategy,
  ElementBoostStrategy,
  AttackStrategy,
  DefenseStrategy,
} from './PassiveEffectStrategies';

// Thorns策略需要player引用，保存实例以便设置
const thornsStrategy = new ThornsStrategy();

/**
 * 初始化状态效果策略
 */
export function initializeStatusEffectStrategies(): void {
  console.log('[StatusStrategies] Initializing status effect strategies...');

  // ========== 敌人状态效果策略 ==========
  statusEffectStrategyRegistry.register('burn', new BurnEffectStrategy());
  statusEffectStrategyRegistry.register('freeze', new FreezeEffectStrategy());
  statusEffectStrategyRegistry.register('stun', new StunEffectStrategy());
  statusEffectStrategyRegistry.register('poison', new PoisonEffectStrategy());
  statusEffectStrategyRegistry.register('slow', new SlowEffectStrategy());
  statusEffectStrategyRegistry.register('knockback', new KnockbackEffectStrategy());
  statusEffectStrategyRegistry.register('heal', new HealEffectStrategy());
  statusEffectStrategyRegistry.register('shield', new ShieldEffectStrategy());
  statusEffectStrategyRegistry.register('defense_break', new DefenseBreakEffectStrategy());
  statusEffectStrategyRegistry.register('damage_reflect', new DamageReflectEffectStrategy());

  // ========== 被动效果策略 ==========
  passiveEffectStrategyRegistry.register('max_hp', new MaxHpStrategy());
  passiveEffectStrategyRegistry.register('lifesteal', new LifestealStrategy());
  passiveEffectStrategyRegistry.register('dodge', new DodgeStrategy());
  passiveEffectStrategyRegistry.register('crit_boost', new CritBoostStrategy());
  passiveEffectStrategyRegistry.register('berserker', new BerserkerStrategy());
  passiveEffectStrategyRegistry.register('speed', new SpeedStrategy());
  passiveEffectStrategyRegistry.register('cooldown_reduction', new CooldownReductionStrategy());
  passiveEffectStrategyRegistry.register('regen', new RegenStrategy());
  passiveEffectStrategyRegistry.register('element_damage', new ElementDamageStrategy());
  passiveEffectStrategyRegistry.register('luck', new LuckStrategy());
  passiveEffectStrategyRegistry.register('thorns', thornsStrategy);
  passiveEffectStrategyRegistry.register('shield_boost', new ShieldBoostStrategy());
  passiveEffectStrategyRegistry.register('element_boost', new ElementBoostStrategy());
  passiveEffectStrategyRegistry.register('attack', new AttackStrategy());
  passiveEffectStrategyRegistry.register('defense', new DefenseStrategy());

  console.log('[StatusStrategies] Registered status effects:', statusEffectStrategyRegistry['strategies'].size);
  console.log('[StatusStrategies] Registered passive effects:', passiveEffectStrategyRegistry['strategies'].size);
}

/**
 * 获取荆棘策略实例（用于设置player引用）
 */
export function getThornsStrategy(): ThornsStrategy {
  return thornsStrategy;
}

// 导出
export { statusEffectStrategyRegistry, StatusEffectStrategyRegistry } from './StatusEffectStrategyRegistry';
export { passiveEffectStrategyRegistry, PassiveEffectStrategyRegistry } from './PassiveEffectStrategies';
export type { StatusEffectStrategy, StatusEffectExecutionContext } from './StatusEffectStrategyRegistry';
export type { PassiveEffectStrategy, PassiveEffectData } from './PassiveEffectStrategies';
export * from './EnemyEffectStrategies';
export * from './PassiveEffectStrategies';