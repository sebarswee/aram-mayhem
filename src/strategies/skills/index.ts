import { skillStrategyRegistry } from '../SkillStrategyRegistry';
import { FlameWaveStrategy, FlameWaveVisualStrategy } from './area/fire/FlameWaveStrategy';
import { FrostNovaStrategy, FrostNovaVisualStrategy } from './area/ice/FrostNovaStrategy';
import { BlizzardStrategy, BlizzardVisualStrategy } from './area/ice/BlizzardStrategy';
import { ThunderStormStrategy, ThunderStormVisualStrategy } from './area/lightning/ThunderStormStrategy';
import { HolyLightStrategy, HolyLightVisualStrategy } from './area/holy/HolyLightStrategy';
import { PoisonCloudStrategy, PoisonCloudVisualStrategy } from './area/water/PoisonCloudStrategy';

/**
 * 初始化并注册所有技能策略
 * 在游戏启动时调用此函数
 */
export function initializeStrategies(): void {
  console.log('[Strategies] Initializing skill strategies...');

  // 注册火焰喷射
  skillStrategyRegistry.registerBoth('flame_wave', new FlameWaveStrategy(), new FlameWaveVisualStrategy());

  // 注册冰晶爆发
  skillStrategyRegistry.registerBoth('frost_nova', new FrostNovaStrategy(), new FrostNovaVisualStrategy());

  // 注册暴风雪
  skillStrategyRegistry.registerBoth('blizzard', new BlizzardStrategy(), new BlizzardVisualStrategy());

  // 注册雷击阵
  skillStrategyRegistry.registerBoth('thunder_storm', new ThunderStormStrategy(), new ThunderStormVisualStrategy());

  // 注册圣光
  skillStrategyRegistry.registerBoth('holy_light', new HolyLightStrategy(), new HolyLightVisualStrategy());

  // 注册毒雾
  skillStrategyRegistry.registerBoth('poison_cloud', new PoisonCloudStrategy(), new PoisonCloudVisualStrategy());

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
  HolyLightStrategy,
  HolyLightVisualStrategy,
  PoisonCloudStrategy,
  PoisonCloudVisualStrategy,
};