// 敌人能力策略导出
export {
  EnemyAttackAbilityRegistry,
  enemyAttackAbilityRegistry,
  BurnOnContactStrategy,
  SlowOnAttackStrategy,
  PoisonOnAttackStrategy,
  RootOnAttackStrategy,
  initializeEnemyAttackAbilities,
} from './EnemyAttackAbilityRegistry';

export type {
  EnemyAttackAbilityStrategy,
  EnemyAttackContext,
} from './EnemyAttackAbilityRegistry';

export {
  BuffSkillStrategyRegistry,
  buffSkillStrategyRegistry,
  PurifyStrategy,
  HaloStrategy,
  BlessingStrategy,
  SanctuaryStrategy,
  EarthGuardianStrategy,
  initializeBuffSkillStrategies,
} from './BuffSkillStrategyRegistry';

export type {
  BuffSkillStrategy,
  BuffSkillContext,
} from './BuffSkillStrategyRegistry';

export {
  EnemyAbilityStrategyRegistry,
  enemyAbilityStrategyRegistry,
  ChargeAbilityStrategy,
  ShootAbilityStrategy,
  SummonAbilityStrategy,
  ShieldAbilityStrategy,
  HealAbilityStrategy,
  RageAbilityStrategy,
  initializeEnemyAbilityStrategies,
} from './EnemyAbilityStrategyRegistry';

export type {
  EnemyAbilityStrategy,
  EnemyAbilityContext,
} from './EnemyAbilityStrategyRegistry';

// 敌人视觉策略
export {
  statusEffectColorRegistry,
  enemyTypeScaleRegistry,
} from './EnemyVisualRegistry';

// 敌人被动能力策略
export {
  enemyPassiveAbilityRegistry,
  HpBoostStrategy,
  SpeedBoostStrategy,
  DamageReductionStrategy,
  BurnOnContactPassiveStrategy,
  initializeEnemyPassiveAbilities,
} from './EnemyPassiveAbilityRegistry';

export type {
  EnemyPassiveAbilityStrategy,
  EnemyPassiveContext,
} from './EnemyPassiveAbilityRegistry';

// 敌人死亡能力策略
export {
  enemyDeathAbilityRegistry,
  ExplodeOnDeathStrategy,
  initializeEnemyDeathAbilities,
} from './EnemyDeathAbilityRegistry';

export type {
  EnemyDeathAbilityStrategy,
  EnemyDeathContext,
} from './EnemyDeathAbilityRegistry';

// 敌人元素死亡效果策略
export {
  enemyElementDeathRegistry,
  FireEnemyDeathStrategy,
  WaterEnemyDeathStrategy,
  IceEnemyDeathStrategy,
  LightningEnemyDeathStrategy,
  HolyEnemyDeathStrategy,
  ShadowEnemyDeathStrategy,
  GrassEnemyDeathStrategy,
  EarthEnemyDeathStrategy,
  initializeEnemyElementDeathStrategies,
} from './EnemyElementDeathRegistry';

export type {
  EnemyElementDeathStrategy,
  EnemyElementDeathContext,
} from './EnemyElementDeathRegistry';
