export {
  projectileVisualRegistry,
  IgniteVisualStrategy,
  ArcLightningVisualStrategy,
  SeedBombVisualStrategy,
  HexVisualStrategy,
  LightningBoltVisualStrategy,
  ShadowBoltVisualStrategy,
  IceShardVisualStrategy,
  WaterBulletVisualStrategy,
  VineWhipVisualStrategy,
  initializeProjectileVisualStrategies,
} from './ProjectileVisualRegistry';

export type { ProjectileVisualStrategy, ProjectileVisualContext } from './ProjectileVisualRegistry';

export {
  elementDeathRegistry,
  FireDeathStrategy,
  WaterDeathStrategy,
  IceDeathStrategy,
  LightningDeathStrategy,
  HolyDeathStrategy,
  ShadowDeathStrategy,
  GrassDeathStrategy,
  EarthDeathStrategy,
  initializeElementDeathStrategies,
} from './ElementDeathRegistry';

export type { ElementDeathStrategy, ElementDeathContext } from './ElementDeathRegistry';

// 特殊行为配置策略
export {
  specialBehaviorConfigRegistry,
  PierceConfigStrategy,
  SplitConfigStrategy,
  ChainConfigStrategy,
  ChainAddConfigStrategy,
  ChainDecayConfigStrategy,
  ChainRangeConfigStrategy,
  HomingConfigStrategy,
  InstantHitConfigStrategy,
  ExplodeOnHitConfigStrategy,
  LeaveSlowFieldConfigStrategy,
  ShatterConfigStrategy,
  initializeSpecialBehaviorConfigStrategies,
} from './SpecialBehaviorConfigRegistry';

export type { SpecialBehaviorConfigStrategy } from './SpecialBehaviorConfigRegistry';
