import { synergyStrategyRegistry } from './SynergyStrategyRegistry';

// 导入所有策略
import {
  TrueDamageStrategy,
  DoubleDamageStrategy,
  GuaranteedCritStrategy,
  DamageIncreaseStrategy,
  DamageBoostNoHealStrategy,
} from './DamageStrategies';

import {
  FreezeStrategy,
  StunStrategy,
  SlowStrategy,
  RootStrategy,
  KnockupStrategy,
  TrueDamageConfuseStrategy,
} from './CrowdControlStrategies';

import {
  ExplosionStrategy,
  ChainBoostStrategy,
  LifestealStrategy,
  DamageToShieldStrategy,
  BarrierStrategy,
  HealZoneStrategy,
  CooldownRefreshStrategy,
} from './SpecialEffectStrategies';

import {
  BurnSpreadStrategy,
  LavaZoneStrategy,
  SpreadDebuffStrategy,
  DispelAndDamageStrategy,
  DeathExplosionStrategy,
  RefractDamageStrategy,
  TickSpeedDoubleStrategy,
  Split3Strategy,
  DefenseReduceStrategy,
} from './AdvancedEffectStrategies';

/**
 * 初始化并注册所有协同效果策略
 */
export function initializeSynergyStrategies(): void {
  console.log('[SynergyStrategies] Initializing synergy strategies...');

  // 伤害类策略
  synergyStrategyRegistry.register('true_damage_percent', new TrueDamageStrategy());
  synergyStrategyRegistry.register('double_damage', new DoubleDamageStrategy());
  synergyStrategyRegistry.register('guaranteed_crit', new GuaranteedCritStrategy());
  synergyStrategyRegistry.register('damage_increase', new DamageIncreaseStrategy());
  synergyStrategyRegistry.register('damage_boost_no_heal', new DamageBoostNoHealStrategy());

  // 控制类策略
  synergyStrategyRegistry.register('freeze', new FreezeStrategy());
  synergyStrategyRegistry.register('stun', new StunStrategy());
  synergyStrategyRegistry.register('slow', new SlowStrategy());
  synergyStrategyRegistry.register('root', new RootStrategy());
  synergyStrategyRegistry.register('knockup', new KnockupStrategy());
  synergyStrategyRegistry.register('true_damage_confuse', new TrueDamageConfuseStrategy());

  // 特殊效果策略
  synergyStrategyRegistry.register('explosion', new ExplosionStrategy());
  synergyStrategyRegistry.register('chain_boost', new ChainBoostStrategy());
  synergyStrategyRegistry.register('lifesteal', new LifestealStrategy());
  synergyStrategyRegistry.register('damage_to_shield', new DamageToShieldStrategy());
  synergyStrategyRegistry.register('barrier', new BarrierStrategy());
  synergyStrategyRegistry.register('heal_zone', new HealZoneStrategy());
  synergyStrategyRegistry.register('cooldown_refresh', new CooldownRefreshStrategy());

  // 高级效果策略
  synergyStrategyRegistry.register('burn_spread', new BurnSpreadStrategy());
  synergyStrategyRegistry.register('lava_zone', new LavaZoneStrategy());
  synergyStrategyRegistry.register('spread_debuff', new SpreadDebuffStrategy());
  synergyStrategyRegistry.register('dispel_and_damage', new DispelAndDamageStrategy());
  synergyStrategyRegistry.register('death_explosion', new DeathExplosionStrategy());
  synergyStrategyRegistry.register('refract_damage', new RefractDamageStrategy());
  synergyStrategyRegistry.register('tick_speed_double', new TickSpeedDoubleStrategy());
  synergyStrategyRegistry.register('split_3', new Split3Strategy());
  synergyStrategyRegistry.register('defense_reduce', new DefenseReduceStrategy());

  console.log('[SynergyStrategies] Registered', synergyStrategyRegistry['strategies'].size, 'synergy strategies');
}

// 导出所有策略类
export * from './DamageStrategies';
export * from './CrowdControlStrategies';
export * from './SpecialEffectStrategies';
export * from './AdvancedEffectStrategies';
export { SynergyStrategyRegistry, synergyStrategyRegistry } from './SynergyStrategyRegistry';
export type { SynergyEffectStrategy, SynergyExecutionContext } from './SynergyStrategyRegistry';