import Phaser from 'phaser';
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

/**
 * 效果池管理器
 *
 * 统一管理所有技能视觉效果的对象池
 * 提供集中式创建、获取和清理接口
 */
export class EffectPoolManager {
  // 大招效果池 (P0 优先级)
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
  // public thunder: ThunderEffectPool;
  // public blizzard: BlizzardEffectPool;

  // P1 优先级效果池
  // public poisonCloud: PoisonCloudEffectPool;
  // public electricField: ElectricFieldEffectPool;

  // P2 优先级效果池
  // 其他技能效果池...

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
    // this.thunder = new ThunderEffectPool(scene, 3);
    // this.blizzard = new BlizzardEffectPool(scene, 3);

    // 初始化 P1 效果池
    // this.poisonCloud = new PoisonCloudEffectPool(scene, 5);
    // this.electricField = new ElectricFieldEffectPool(scene, 5);

    // 初始化 P2 效果池
    // ...
  }

  /**
   * 清空所有池
   *
   * 在场景关闭或重置时调用
   */
  clearAll(): void {
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
    // this.thunder.clear();
    // this.blizzard.clear();
    // this.poisonCloud.clear();
    // this.electricField.clear();
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
    // stats.thunder = this.thunder.getStats();
    // stats.blizzard = this.blizzard.getStats();

    // P1 效果
    // stats.poisonCloud = this.poisonCloud.getStats();
    // stats.electricField = this.electricField.getStats();

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
