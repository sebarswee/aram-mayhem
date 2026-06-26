import { skillStrategyRegistry } from '../SkillStrategyRegistry';
import { FlameWaveStrategy, FlameWaveVisualStrategy } from './area/fire/FlameWaveStrategy';
import { FrostNovaStrategy, FrostNovaVisualStrategy } from './area/ice/FrostNovaStrategy';
import { BlizzardStrategy, BlizzardVisualStrategy } from './area/ice/BlizzardStrategy';
import { IceWallStrategy, IceWallVisualStrategy } from './area/ice/IceWallStrategy';
import { ThunderStormStrategy, ThunderStormVisualStrategy } from './area/lightning/ThunderStormStrategy';
import { ArcLightningStrategy, ArcLightningVisualStrategy, StaticFieldStrategy, ShadowStepStrategy, ShadowStepVisualStrategy, IgniteStrategy, IgniteVisualStrategy } from './area/lightning/ArcLightningStrategy';
import { LightningFocusStrategy, LightningFocusVisualStrategy } from './area/lightning/LightningFocusStrategy';
import { ElectricFieldStrategy, ElectricFieldVisualStrategy } from './area/lightning/ElectricFieldStrategy';
import { HolyLightStrategy, HolyLightVisualStrategy } from './area/holy/HolyLightStrategy';
import { PoisonCloudStrategy, PoisonCloudVisualStrategy } from './area/water/PoisonCloudStrategy';
import { TidalWaveStrategy, TidalWaveVisualStrategy } from './area/water/TidalWaveStrategy';
import { WaterDashStrategy, WaterDashVisualStrategy } from './area/water/WaterDashStrategy';
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
  ForestRageStrategy, ForestRageVisualStrategy,
  VoidRiftStrategy, VoidRiftVisualStrategy,
  ThunderStrikeStrategy, ThunderStrikeVisualStrategy,
  HolyJudgmentStrategy, HolyJudgmentVisualStrategy,
  SanctuaryStrategy, SanctuaryVisualStrategy,
  ForceOfNatureStrategy, ForceOfNatureVisualStrategy,
  EarthGuardianStrategy, EarthGuardianVisualStrategy,
} from './ultimate/UltimateStrategies';
import {
  FireballStrategy, FireballVisualStrategy,
  WaterBulletStrategy, WaterBulletVisualStrategy,
  IceShardStrategy, IceShardVisualStrategy,
  LightningBoltStrategy, LightningBoltVisualStrategy,
  ShadowBoltStrategy, ShadowBoltVisualStrategy,
  VineWhipStrategy, VineWhipVisualStrategy,
  SeedBombStrategy, SeedBombVisualStrategy,
  HexStrategy, HexVisualStrategy,
} from './projectile/ProjectileStrategies';
import {
  DivineShieldStrategy, DivineShieldVisualStrategy,
  FlameShieldStrategy, FlameShieldVisualStrategy,
  StoneSkinStrategy, StoneSkinVisualStrategy,
  FrostArmorStrategy, FrostArmorVisualStrategy,
  HaloStrategy, HaloVisualStrategy,
  BlessingStrategy, BlessingVisualStrategy,
  ThornsStrategy, ThornsVisualStrategy,
  PurifyStrategy, PurifyVisualStrategy,
} from './buff/BuffStrategies';

/**
 * 初始化并注册所有技能策略
 * 在游戏启动时调用此函数
 */
export function initializeStrategies(): void {
  console.log('[Strategies] Initializing skill strategies...');

  // ========== 火属性技能 ==========
  skillStrategyRegistry.registerProjectile('fireball', new FireballStrategy(), new FireballVisualStrategy());
  skillStrategyRegistry.registerBoth('flame_wave', new FlameWaveStrategy(), new FlameWaveVisualStrategy());
  skillStrategyRegistry.registerBuff('flame_shield', new FlameShieldStrategy(), new FlameShieldVisualStrategy());
  skillStrategyRegistry.register('ignite', new IgniteStrategy());

  // ========== 水属性技能 ==========
  skillStrategyRegistry.registerProjectile('water_bullet', new WaterBulletStrategy(), new WaterBulletVisualStrategy());
  skillStrategyRegistry.registerBoth('tidal_wave', new TidalWaveStrategy(), new TidalWaveVisualStrategy());
  skillStrategyRegistry.registerBoth('poison_cloud', new PoisonCloudStrategy(), new PoisonCloudVisualStrategy());
  skillStrategyRegistry.registerBoth('water_dash', new WaterDashStrategy(), new WaterDashVisualStrategy());

  // ========== 冰属性技能 ==========
  skillStrategyRegistry.registerProjectile('ice_shard', new IceShardStrategy(), new IceShardVisualStrategy());
  skillStrategyRegistry.registerBoth('frost_nova', new FrostNovaStrategy(), new FrostNovaVisualStrategy());
  skillStrategyRegistry.registerBoth('blizzard', new BlizzardStrategy(), new BlizzardVisualStrategy());
  skillStrategyRegistry.registerBoth('ice_wall', new IceWallStrategy(), new IceWallVisualStrategy());
  skillStrategyRegistry.registerBuff('frost_armor', new FrostArmorStrategy(), new FrostArmorVisualStrategy());

  // ========== 雷属性技能 ==========
  skillStrategyRegistry.registerProjectile('lightning_bolt', new LightningBoltStrategy(), new LightningBoltVisualStrategy());
  skillStrategyRegistry.registerBoth('thunder_storm', new ThunderStormStrategy(), new ThunderStormVisualStrategy());
  skillStrategyRegistry.registerBoth('arc_lightning', new ArcLightningStrategy(), new ArcLightningVisualStrategy());
  skillStrategyRegistry.registerBoth('static_field', new StaticFieldStrategy(), new ArcLightningVisualStrategy());
  skillStrategyRegistry.registerBoth('lightning_focus', new LightningFocusStrategy(), new LightningFocusVisualStrategy());
  skillStrategyRegistry.registerBoth('electric_field', new ElectricFieldStrategy(), new ElectricFieldVisualStrategy());

  // ========== 光属性技能 ==========
  skillStrategyRegistry.registerBoth('holy_light', new HolyLightStrategy(), new HolyLightVisualStrategy());
  skillStrategyRegistry.registerBuff('divine_shield', new DivineShieldStrategy(), new DivineShieldVisualStrategy());
  skillStrategyRegistry.registerBuff('halo', new HaloStrategy(), new HaloVisualStrategy());
  skillStrategyRegistry.registerBuff('blessing', new BlessingStrategy(), new BlessingVisualStrategy());
  skillStrategyRegistry.registerBuff('purify', new PurifyStrategy(), new PurifyVisualStrategy());

  // ========== 暗属性技能 ==========
  skillStrategyRegistry.registerProjectile('shadow_bolt', new ShadowBoltStrategy(), new ShadowBoltVisualStrategy());
  skillStrategyRegistry.registerBoth('curse_aura', new CurseAuraStrategy(), new CurseAuraVisualStrategy());
  skillStrategyRegistry.registerBoth('shadow_step', new ShadowStepStrategy(), new ShadowStepVisualStrategy());
  skillStrategyRegistry.registerProjectile('hex', new HexStrategy(), new HexVisualStrategy());

  // ========== 草属性技能 ==========
  skillStrategyRegistry.registerProjectile('vine_whip', new VineWhipStrategy(), new VineWhipVisualStrategy());
  skillStrategyRegistry.registerProjectile('seed_bomb', new SeedBombStrategy(), new SeedBombVisualStrategy());
  skillStrategyRegistry.registerBuff('thorns', new ThornsStrategy(), new ThornsVisualStrategy());

  // ========== 土属性技能 ==========
  skillStrategyRegistry.registerBoth('rock_spike', new RockSpikeStrategy(), new RockSpikeVisualStrategy());
  skillStrategyRegistry.registerBoth('sandstorm', new SandstormStrategy(), new SandstormVisualStrategy());
  skillStrategyRegistry.registerBoth('seismic_wave', new SeismicWaveStrategy(), new SeismicWaveVisualStrategy());
  skillStrategyRegistry.registerBuff('stone_skin', new StoneSkinStrategy(), new StoneSkinVisualStrategy());

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
  skillStrategyRegistry.registerBoth('forest_rage', new ForestRageStrategy(), new ForestRageVisualStrategy());
  skillStrategyRegistry.registerBoth('void_rift', new VoidRiftStrategy(), new VoidRiftVisualStrategy());
  skillStrategyRegistry.registerBoth('thunder_strike', new ThunderStrikeStrategy(), new ThunderStrikeVisualStrategy());
  skillStrategyRegistry.registerBoth('holy_judgment', new HolyJudgmentStrategy(), new HolyJudgmentVisualStrategy());
  skillStrategyRegistry.registerBoth('sanctuary', new SanctuaryStrategy(), new SanctuaryVisualStrategy());
  skillStrategyRegistry.registerBoth('force_of_nature', new ForceOfNatureStrategy(), new ForceOfNatureVisualStrategy());
  skillStrategyRegistry.registerBoth('earth_guardian', new EarthGuardianStrategy(), new EarthGuardianVisualStrategy());

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
  LightningFocusStrategy,
  LightningFocusVisualStrategy,
  ElectricFieldStrategy,
  ElectricFieldVisualStrategy,
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
};