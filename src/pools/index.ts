// 基类
export { ObjectPool } from './ObjectPool';
export type { ObjectPoolOptions, ObjectPoolMetrics } from './ObjectPool';
export { VisualEffectPool, type VisualEffectConfig } from './VisualEffectPool';

// 管理器
export { EffectPoolManager } from './EffectPoolManager';

// 具体效果池
export { InfernoEffectPool, type InfernoEffectConfig } from './effects/InfernoEffectPool';
export { DragonBreathEffectPool, type DragonBreathEffectConfig } from './effects/DragonBreathEffectPool';
export { AbyssVortexEffectPool, type AbyssVortexEffectConfig } from './effects/AbyssVortexEffectPool';
export { FrozenDomainEffectPool, type FrozenDomainEffectConfig } from './effects/FrozenDomainEffectPool';
export { ThunderApocalypseEffectPool, type ThunderApocalypseEffectConfig } from './effects/ThunderApocalypseEffectPool';
export { ShadowRealmEffectPool, type ShadowRealmEffectConfig } from './effects/ShadowRealmEffectPool';
export { DeathDecayEffectPool, type DeathDecayEffectConfig } from './effects/DeathDecayEffectPool';
export { EarthGuardianEffectPool, type EarthGuardianEffectConfig } from './effects/EarthGuardianEffectPool';
export { VoidRiftEffectPool, type VoidRiftEffectConfig } from './effects/VoidRiftEffectPool';
export { BlackHoleEffectPool, type BlackHoleEffectConfig } from './effects/BlackHoleEffectPool';
export { SanctuaryEffectPool, type SanctuaryEffectConfig } from './effects/SanctuaryEffectPool';
export { HolyJudgmentEffectPool, type HolyJudgmentEffectConfig } from './effects/HolyJudgmentEffectPool';
