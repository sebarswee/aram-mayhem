// 策略模式重构 - 主入口
// 导出所有策略相关模块

export type { SkillStrategy, VisualEffectStrategy, SkillExecutionContext } from './SkillStrategy';
export { SkillStrategyRegistry, skillStrategyRegistry } from './SkillStrategyRegistry';
export { initializeStrategies } from './skills';

// 协同效果策略
export { initializeSynergyStrategies } from './synergy';
export type { SynergyEffectStrategy, SynergyExecutionContext } from './synergy';
export { synergyStrategyRegistry } from './synergy';

// 重新导出所有策略类
export * from './skills';
export * from './synergy';