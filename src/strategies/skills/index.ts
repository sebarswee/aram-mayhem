import { skillStrategyRegistry } from '../SkillStrategyRegistry';
import { FlameWaveStrategy, FlameWaveVisualStrategy } from './area/fire/FlameWaveStrategy';
import { FrostNovaStrategy, FrostNovaVisualStrategy } from './area/ice/FrostNovaStrategy';
import { BlizzardStrategy, BlizzardVisualStrategy } from './area/ice/BlizzardStrategy';
import { ThunderStormStrategy, ThunderStormVisualStrategy } from './area/lightning/ThunderStormStrategy';
import { ArcLightningStrategy, ArcLightningVisualStrategy, StaticFieldStrategy, ShadowStepStrategy, ShadowStepVisualStrategy, IgniteStrategy, IgniteVisualStrategy } from './area/lightning/ArcLightningStrategy';
import { HolyLightStrategy, HolyLightVisualStrategy } from './area/holy/HolyLightStrategy';
import { PoisonCloudStrategy, PoisonCloudVisualStrategy } from './area/water/PoisonCloudStrategy';
import { TidalWaveStrategy, TidalWaveVisualStrategy } from './area/water/TidalWaveStrategy';
import { CurseAuraStrategy, CurseAuraVisualStrategy } from './area/shadow/CurseAuraStrategy';
import { RockSpikeStrategy, RockSpikeVisualStrategy } from './area/earth/RockSpikeStrategy';
import { SandstormStrategy, SandstormVisualStrategy, SeismicWaveStrategy, SeismicWaveVisualStrategy } from './area/earth/SandstormStrategy';
import {
  DragonBreathStrategy, DragonBreathVisualStrategy,
  InfernoStrategy, InfernoVisualStrategy,
  AbyssVortexStrategy, AbyssVortexVisualStrategy,
  FrozenDomainStrategy, FrozenDomainVisualStrategy,
  AbsoluteZeroStrategy, AbsoluteZeroVisualStrategy,
  ThunderApocalypseStrategy, ThunderApocalypseVisualStrategy,
  JudgmentLightStrategy, JudgmentLightVisualStrategy,
  ShadowDescentStrategy, ShadowDescentVisualStrategy,
  DeathDecayStrategy, DeathDecayVisualStrategy,
  MountainCollapseStrategy, MountainCollapseVisualStrategy,
  MeteorStrategy, MeteorVisualStrategy,
  TsunamiStrategy, TsunamiVisualStrategy,
  EarthquakeStrategy, EarthquakeVisualStrategy,
  OvergrowthStrategy, OvergrowthVisualStrategy,
  VoidRiftStrategy, VoidRiftVisualStrategy,
  BlackHoleStrategy,
  GroundSpikeStrategy,
} from './ultimate/UltimateStrategies';

/**
 * 初始化并注册所有技能策略
 * 在游戏启动时调用此函数
 */
export function initializeStrategies(): void {
  console.log('[Strategies] Initializing skill strategies...');

  // ========== 火属性技能 ==========
  skillStrategyRegistry.registerBoth('flame_wave', new FlameWaveStrategy(), new FlameWaveVisualStrategy());

  // ========== 冰属性技能 ==========
  skillStrategyRegistry.registerBoth('frost_nova', new FrostNovaStrategy(), new FrostNovaVisualStrategy());
  skillStrategyRegistry.registerBoth('blizzard', new BlizzardStrategy(), new BlizzardVisualStrategy());

  // ========== 雷属性技能 ==========
  skillStrategyRegistry.registerBoth('thunder_storm', new ThunderStormStrategy(), new ThunderStormVisualStrategy());
  skillStrategyRegistry.registerBoth('arc_lightning', new ArcLightningStrategy(), new ArcLightningVisualStrategy());
  skillStrategyRegistry.registerBoth('static_field', new StaticFieldStrategy(), new ArcLightningVisualStrategy());
  skillStrategyRegistry.registerBoth('shadow_step', new ShadowStepStrategy(), new ShadowStepVisualStrategy());
  skillStrategyRegistry.registerBoth('ignite', new IgniteStrategy(), new IgniteVisualStrategy());

  // ========== 光属性技能 ==========
  skillStrategyRegistry.registerBoth('holy_light', new HolyLightStrategy(), new HolyLightVisualStrategy());

  // ========== 水属性技能 ==========
  skillStrategyRegistry.registerBoth('poison_cloud', new PoisonCloudStrategy(), new PoisonCloudVisualStrategy());
  skillStrategyRegistry.registerBoth('tidal_wave', new TidalWaveStrategy(), new TidalWaveVisualStrategy());

  // ========== 暗属性技能 ==========
  skillStrategyRegistry.registerBoth('curse_aura', new CurseAuraStrategy(), new CurseAuraVisualStrategy());

  // ========== 土属性技能 ==========
  skillStrategyRegistry.registerBoth('rock_spike', new RockSpikeStrategy(), new RockSpikeVisualStrategy());
  skillStrategyRegistry.registerBoth('sandstorm', new SandstormStrategy(), new SandstormVisualStrategy());
  skillStrategyRegistry.registerBoth('seismic_wave', new SeismicWaveStrategy(), new SeismicWaveVisualStrategy());

  // ========== 大招技能 ==========
  skillStrategyRegistry.registerBoth('dragon_breath', new DragonBreathStrategy(), new DragonBreathVisualStrategy());
  skillStrategyRegistry.registerBoth('inferno', new InfernoStrategy(), new InfernoVisualStrategy());
  skillStrategyRegistry.registerBoth('abyss_vortex', new AbyssVortexStrategy(), new AbyssVortexVisualStrategy());
  skillStrategyRegistry.registerBoth('frozen_domain', new FrozenDomainStrategy(), new FrozenDomainVisualStrategy());
  skillStrategyRegistry.registerBoth('absolute_zero', new AbsoluteZeroStrategy(), new AbsoluteZeroVisualStrategy());
  skillStrategyRegistry.registerBoth('thunder_apocalypse', new ThunderApocalypseStrategy(), new ThunderApocalypseVisualStrategy());
  skillStrategyRegistry.registerBoth('judgment_light', new JudgmentLightStrategy(), new JudgmentLightVisualStrategy());
  skillStrategyRegistry.registerBoth('shadow_descent', new ShadowDescentStrategy(), new ShadowDescentVisualStrategy());
  skillStrategyRegistry.registerBoth('death_decay', new DeathDecayStrategy(), new DeathDecayVisualStrategy());
  skillStrategyRegistry.registerBoth('mountain_collapse', new MountainCollapseStrategy(), new MountainCollapseVisualStrategy());
  skillStrategyRegistry.registerBoth('meteor', new MeteorStrategy(), new MeteorVisualStrategy());
  skillStrategyRegistry.registerBoth('tsunami', new TsunamiStrategy(), new TsunamiVisualStrategy());
  skillStrategyRegistry.registerBoth('earthquake', new EarthquakeStrategy(), new EarthquakeVisualStrategy());
  skillStrategyRegistry.registerBoth('overgrowth', new OvergrowthStrategy(), new OvergrowthVisualStrategy());
  skillStrategyRegistry.registerBoth('void_rift', new VoidRiftStrategy(), new VoidRiftVisualStrategy());

  // ========== 特殊技能（无视觉策略） ==========
  skillStrategyRegistry.register('black_hole', new BlackHoleStrategy());
  skillStrategyRegistry.register('ground_spike', new GroundSpikeStrategy());

  console.log('[Strategies] Registered skills:', skillStrategyRegistry.getRegisteredSkillIds());
}

// 导出所有策略类，方便其他模块使用
export {
  FlameWaveStrategy,
  FlameWaveVisualStrategy,
  FrostNovaStrategy,
  FrostNovaVisualStrategy,
  BlizzardStrategy,
  BlizzardVisualStrategy,
  ThunderStormStrategy,
  ThunderStormVisualStrategy,
  ArcLightningStrategy,
  ArcLightningVisualStrategy,
  StaticFieldStrategy,
  ShadowStepStrategy,
  ShadowStepVisualStrategy,
  IgniteStrategy,
  IgniteVisualStrategy,
  HolyLightStrategy,
  HolyLightVisualStrategy,
  PoisonCloudStrategy,
  PoisonCloudVisualStrategy,
  TidalWaveStrategy,
  TidalWaveVisualStrategy,
  CurseAuraStrategy,
  CurseAuraVisualStrategy,
  RockSpikeStrategy,
  RockSpikeVisualStrategy,
  SandstormStrategy,
  SandstormVisualStrategy,
  SeismicWaveStrategy,
  SeismicWaveVisualStrategy,
  // 大招
  DragonBreathStrategy,
  DragonBreathVisualStrategy,
  InfernoStrategy,
  InfernoVisualStrategy,
  AbyssVortexStrategy,
  AbyssVortexVisualStrategy,
  FrozenDomainStrategy,
  FrozenDomainVisualStrategy,
  AbsoluteZeroStrategy,
  AbsoluteZeroVisualStrategy,
  ThunderApocalypseStrategy,
  ThunderApocalypseVisualStrategy,
  JudgmentLightStrategy,
  JudgmentLightVisualStrategy,
  ShadowDescentStrategy,
  ShadowDescentVisualStrategy,
  DeathDecayStrategy,
  DeathDecayVisualStrategy,
  MountainCollapseStrategy,
  MountainCollapseVisualStrategy,
  MeteorStrategy,
  MeteorVisualStrategy,
  TsunamiStrategy,
  TsunamiVisualStrategy,
  EarthquakeStrategy,
  EarthquakeVisualStrategy,
  OvergrowthStrategy,
  OvergrowthVisualStrategy,
  VoidRiftStrategy,
  VoidRiftVisualStrategy,
  BlackHoleStrategy,
  GroundSpikeStrategy,
};