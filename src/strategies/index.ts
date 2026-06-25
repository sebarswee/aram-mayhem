// 策略模式重构 - 主入口
// 导出所有策略相关模块

export type { SkillStrategy, VisualEffectStrategy, SkillExecutionContext } from './SkillStrategy';
export { SkillStrategyRegistry, skillStrategyRegistry } from './SkillStrategyRegistry';
export { initializeStrategies } from './skills';

// 协同效果策略
export { initializeSynergyStrategies } from './synergy';
export type { SynergyEffectStrategy, SynergyExecutionContext } from './synergy';
export { synergyStrategyRegistry } from './synergy';

// 状态效果策略
export { initializeStatusEffectStrategies, statusEffectStrategyRegistry, passiveEffectStrategyRegistry } from './status';
export type { StatusEffectStrategy, StatusEffectExecutionContext, PassiveEffectStrategy, PassiveEffectData } from './status';
export { getThornsStrategy } from './status';

// 敌人能力策略
export {
  enemyAttackAbilityRegistry,
  buffSkillStrategyRegistry,
  enemyAbilityStrategyRegistry,
  statusEffectColorRegistry,
  enemyTypeScaleRegistry,
  enemyPassiveAbilityRegistry,
  enemyDeathAbilityRegistry,
  enemyElementDeathRegistry,
  initializeEnemyAttackAbilities,
  initializeBuffSkillStrategies,
  initializeEnemyAbilityStrategies,
  initializeEnemyPassiveAbilities,
  initializeEnemyDeathAbilities,
  initializeEnemyElementDeathStrategies,
} from './enemy';
export type {
  EnemyAttackContext,
  EnemyAttackAbilityStrategy,
  BuffSkillContext,
  BuffSkillStrategy,
  EnemyAbilityContext,
  EnemyAbilityStrategy,
  EnemyPassiveContext,
  EnemyPassiveAbilityStrategy,
  EnemyDeathContext,
  EnemyDeathAbilityStrategy,
  EnemyElementDeathContext,
  EnemyElementDeathStrategy,
} from './enemy';

// 强化效果策略
export {
  enhancementStrategyRegistry,
  initializeEnhancementStrategies,
} from './enhancement';
export type { EnhancementStrategy } from './enhancement';

export {
  skillValueCalculatorRegistry,
  initializeSkillValueCalculators,
} from './enhancement';
export type { SkillValueCalculator } from './enhancement';

// 投射物视觉策略
export {
  projectileVisualRegistry,
  elementDeathRegistry,
  specialBehaviorConfigRegistry,
  initializeProjectileVisualStrategies,
  initializeElementDeathStrategies,
  initializeSpecialBehaviorConfigStrategies,
} from './projectile';
export type {
  ProjectileVisualStrategy,
  ProjectileVisualContext,
  ElementDeathStrategy,
  ElementDeathContext,
  SpecialBehaviorConfigStrategy,
} from './projectile';

// 重新导出所有策略类（排除重复命名）
export * from './skills';
export * from './synergy';
// 从status导出时排除与synergy重名的
export {
  // 状态效果策略
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
  // 被动效果策略
  MaxHpStrategy,
  LifestealStrategy as PassiveLifestealStrategy,
  DodgeStrategy,
  CritBoostStrategy,
  BerserkerStrategy,
  SpeedStrategy as PassiveSpeedStrategy,
  CooldownReductionStrategy,
  RegenStrategy,
  ElementDamageStrategy,
  LuckStrategy,
  ShieldBoostStrategy,
  ElementBoostStrategy,
  AttackStrategy,
  DefenseStrategy,
} from './status';