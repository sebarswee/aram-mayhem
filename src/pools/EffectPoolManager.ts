import Phaser from 'phaser';

// P0 大招效果池
import { InfernoEffectPool } from './effects/InfernoEffectPool';
import { DragonBreathEffectPool } from './effects/DragonBreathEffectPool';
import { AbyssVortexEffectPool } from './effects/AbyssVortexEffectPool';
import { FrozenDomainEffectPool } from './effects/FrozenDomainEffectPool';
import { ThunderApocalypseEffectPool } from './effects/ThunderApocalypseEffectPool';
import { ShadowRealmEffectPool } from './effects/ShadowRealmEffectPool';
import { DeathDecayEffectPool } from './effects/DeathDecayEffectPool';
import { EarthGuardianEffectPool } from './effects/EarthGuardianEffectPool';
import { VoidRiftEffectPool } from './effects/VoidRiftEffectPool';
import { BlackHoleEffectPool } from './effects/BlackHoleEffectPool';
import { SanctuaryEffectPool } from './effects/SanctuaryEffectPool';
import { HolyJudgmentEffectPool } from './effects/HolyJudgmentEffectPool';

// P1 区域持续技能效果池
import { ElectricFieldEffectPool } from './effects/ElectricFieldEffectPool';
import { BlizzardEffectPool } from './effects/BlizzardEffectPool';
import { PoisonCloudEffectPool } from './effects/PoisonCloudEffectPool';
import { IceWallEffectPool } from './effects/IceWallEffectPool';
import { RockSpikeEffectPool } from './effects/RockSpikeEffectPool';
import { SandstormEffectPool } from './effects/SandstormEffectPool';
import { ThunderStormEffectPool } from './effects/ThunderStormEffectPool';
import { FlameWaveEffectPool } from './effects/FlameWaveEffectPool';
import { FrostNovaEffectPool } from './effects/FrostNovaEffectPool';
import { TidalWaveEffectPool } from './effects/TidalWaveEffectPool';
import { ArcLightningEffectPool } from './effects/ArcLightningEffectPool';
import { LightningFocusEffectPool } from './effects/LightningFocusEffectPool';
import { ShadowStepEffectPool } from './effects/ShadowStepEffectPool';
import { WaterDashEffectPool } from './effects/WaterDashEffectPool';
import { HolyLightEffectPool } from './effects/HolyLightEffectPool';

// P2 投射物技能效果池
import {
  ProjectileTrailPool,
  FireballEffectPool,
  IceSpearEffectPool,
  LightningBoltEffectPool,
  WaterBulletEffectPool,
  ShadowBallEffectPool,
} from './effects/projectile';

// P3 增益技能效果池
import {
  ShieldEffectPool,
  StoneSkinEffectPool,
  BlessingEffectPool,
  RegenerationEffectPool,
} from './effects/buff';

/**
 * 效果池管理器
 *
 * 统一管理所有技能视觉效果的对象池
 * 提供集中式创建、获取和清理接口
 */
export class EffectPoolManager {
  // P0 大招效果池
  public inferno: InfernoEffectPool;
  public dragonBreath: DragonBreathEffectPool;
  public abyssVortex: AbyssVortexEffectPool;
  public frozenDomain: FrozenDomainEffectPool;
  public thunderApocalypse: ThunderApocalypseEffectPool;
  public shadowRealm: ShadowRealmEffectPool;
  public deathDecay: DeathDecayEffectPool;
  public earthGuardian: EarthGuardianEffectPool;
  public voidRift: VoidRiftEffectPool;
  public blackHole: BlackHoleEffectPool;
  public sanctuary: SanctuaryEffectPool;
  public holyJudgment: HolyJudgmentEffectPool;

  // P1 区域持续技能效果池
  public electricField: ElectricFieldEffectPool;
  public blizzard: BlizzardEffectPool;
  public poisonCloud: PoisonCloudEffectPool;
  public iceWall: IceWallEffectPool;
  public rockSpike: RockSpikeEffectPool;
  public sandstorm: SandstormEffectPool;
  public thunderStorm: ThunderStormEffectPool;
  public flameWave: FlameWaveEffectPool;
  public frostNova: FrostNovaEffectPool;
  public tidalWave: TidalWaveEffectPool;
  public arcLightning: ArcLightningEffectPool;
  public lightningFocus: LightningFocusEffectPool;
  public shadowStep: ShadowStepEffectPool;
  public waterDash: WaterDashEffectPool;
  public holyLight: HolyLightEffectPool;

  // P2 投射物技能效果池
  public projectileTrail: ProjectileTrailPool;
  public fireball: FireballEffectPool;
  public iceSpear: IceSpearEffectPool;
  public lightningBolt: LightningBoltEffectPool;
  public waterBullet: WaterBulletEffectPool;
  public shadowBall: ShadowBallEffectPool;

  // P3 增益技能效果池
  public shield: ShieldEffectPool;
  public stoneSkin: StoneSkinEffectPool;
  public blessing: BlessingEffectPool;
  public regeneration: RegenerationEffectPool;

  constructor(private scene: Phaser.Scene) {
    // 初始化 P0 大招效果池（初始大小 3，根据使用频率调整）
    this.inferno = new InfernoEffectPool(scene, 3);
    this.dragonBreath = new DragonBreathEffectPool(scene, 3);
    this.abyssVortex = new AbyssVortexEffectPool(scene, 3);
    this.frozenDomain = new FrozenDomainEffectPool(scene, 3);
    this.thunderApocalypse = new ThunderApocalypseEffectPool(scene, 3);
    this.shadowRealm = new ShadowRealmEffectPool(scene, 3);
    this.deathDecay = new DeathDecayEffectPool(scene, 3);
    this.earthGuardian = new EarthGuardianEffectPool(scene, 3);
    this.voidRift = new VoidRiftEffectPool(scene, 3);
    this.blackHole = new BlackHoleEffectPool(scene, 3);
    this.sanctuary = new SanctuaryEffectPool(scene, 3);
    this.holyJudgment = new HolyJudgmentEffectPool(scene, 3);

    // 初始化 P1 区域持续技能效果池（初始大小 5，使用频率更高）
    this.electricField = new ElectricFieldEffectPool(scene, 5);
    this.blizzard = new BlizzardEffectPool(scene, 5);
    this.poisonCloud = new PoisonCloudEffectPool(scene, 5);
    this.iceWall = new IceWallEffectPool(scene, 5);
    this.rockSpike = new RockSpikeEffectPool(scene, 5);
    this.sandstorm = new SandstormEffectPool(scene, 5);
    this.thunderStorm = new ThunderStormEffectPool(scene, 5);
    this.flameWave = new FlameWaveEffectPool(scene, 5);
    this.frostNova = new FrostNovaEffectPool(scene, 5);
    this.tidalWave = new TidalWaveEffectPool(scene, 5);
    this.arcLightning = new ArcLightningEffectPool(scene, 5);
    this.lightningFocus = new LightningFocusEffectPool(scene, 5);
    this.shadowStep = new ShadowStepEffectPool(scene, 5);
    this.waterDash = new WaterDashEffectPool(scene, 5);
    this.holyLight = new HolyLightEffectPool(scene, 5);

    // 初始化 P2 投射物技能效果池（初始大小 10，使用频率极高）
    this.projectileTrail = new ProjectileTrailPool(scene, 10);
    this.fireball = new FireballEffectPool(scene, 7);
    this.iceSpear = new IceSpearEffectPool(scene, 7);
    this.lightningBolt = new LightningBoltEffectPool(scene, 7);
    this.waterBullet = new WaterBulletEffectPool(scene, 7);
    this.shadowBall = new ShadowBallEffectPool(scene, 7);

    // 初始化 P3 增益技能效果池（初始大小 3，使用频率较低）
    this.shield = new ShieldEffectPool(scene, 3);
    this.stoneSkin = new StoneSkinEffectPool(scene, 3);
    this.blessing = new BlessingEffectPool(scene, 3);
    this.regeneration = new RegenerationEffectPool(scene, 3);
  }

  /**
   * 清空所有池
   *
   * 在场景关闭或重置时调用
   */
  clearAll(): void {
    // P0 大招
    this.inferno.clear();
    this.dragonBreath.clear();
    this.abyssVortex.clear();
    this.frozenDomain.clear();
    this.thunderApocalypse.clear();
    this.shadowRealm.clear();
    this.deathDecay.clear();
    this.earthGuardian.clear();
    this.voidRift.clear();
    this.blackHole.clear();
    this.sanctuary.clear();
    this.holyJudgment.clear();

    // P1 区域持续技能
    this.electricField.clear();
    this.blizzard.clear();
    this.poisonCloud.clear();
    this.iceWall.clear();
    this.rockSpike.clear();
    this.sandstorm.clear();
    this.thunderStorm.clear();
    this.flameWave.clear();
    this.frostNova.clear();
    this.tidalWave.clear();
    this.arcLightning.clear();
    this.lightningFocus.clear();
    this.shadowStep.clear();
    this.waterDash.clear();
    this.holyLight.clear();

    // P2 投射物技能
    this.projectileTrail.clear();
    this.fireball.clear();
    this.iceSpear.clear();
    this.lightningBolt.clear();
    this.waterBullet.clear();
    this.shadowBall.clear();

    // P3 增益技能
    this.shield.clear();
    this.stoneSkin.clear();
    this.blessing.clear();
    this.regeneration.clear();
  }

  /**
   * 获取所有池的统计信息
   *
   * 用于调试和性能监控
   */
  getAllStats(): Record<string, { pooled: number; active: number; total: number }> {
    const stats: Record<string, { pooled: number; active: number; total: number }> = {};

    // P0 大招
    stats.inferno = this.inferno.getStats();
    stats.dragonBreath = this.dragonBreath.getStats();
    stats.abyssVortex = this.abyssVortex.getStats();
    stats.frozenDomain = this.frozenDomain.getStats();
    stats.thunderApocalypse = this.thunderApocalypse.getStats();
    stats.shadowRealm = this.shadowRealm.getStats();
    stats.deathDecay = this.deathDecay.getStats();
    stats.earthGuardian = this.earthGuardian.getStats();
    stats.voidRift = this.voidRift.getStats();
    stats.blackHole = this.blackHole.getStats();
    stats.sanctuary = this.sanctuary.getStats();
    stats.holyJudgment = this.holyJudgment.getStats();

    // P1 区域持续技能
    stats.electricField = this.electricField.getStats();
    stats.blizzard = this.blizzard.getStats();
    stats.poisonCloud = this.poisonCloud.getStats();
    stats.iceWall = this.iceWall.getStats();
    stats.rockSpike = this.rockSpike.getStats();
    stats.sandstorm = this.sandstorm.getStats();
    stats.thunderStorm = this.thunderStorm.getStats();
    stats.flameWave = this.flameWave.getStats();
    stats.frostNova = this.frostNova.getStats();
    stats.tidalWave = this.tidalWave.getStats();
    stats.arcLightning = this.arcLightning.getStats();
    stats.lightningFocus = this.lightningFocus.getStats();
    stats.shadowStep = this.shadowStep.getStats();
    stats.waterDash = this.waterDash.getStats();
    stats.holyLight = this.holyLight.getStats();

    // P2 投射物技能
    stats.projectileTrail = this.projectileTrail.getStats();
    stats.fireball = this.fireball.getStats();
    stats.iceSpear = this.iceSpear.getStats();
    stats.lightningBolt = this.lightningBolt.getStats();
    stats.waterBullet = this.waterBullet.getStats();
    stats.shadowBall = this.shadowBall.getStats();

    // P3 增益技能
    stats.shield = this.shield.getStats();
    stats.stoneSkin = this.stoneSkin.getStats();
    stats.blessing = this.blessing.getStats();
    stats.regeneration = this.regeneration.getStats();

    return stats;
  }

  /**
   * 打印所有池的统计信息（调试用）
   */
  logStats(): void {
    const stats = this.getAllStats();
    console.log('=== Effect Pool Stats ===');
    for (const [name, stat] of Object.entries(stats)) {
      console.log(`${name}: pooled=${stat.pooled}, active=${stat.active}, total=${stat.total}`);
    }
  }
}
