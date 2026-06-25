// 策略模式重构 - 主入口
// 导出所有策略相关模块

export type { SkillStrategy, VisualEffectStrategy, SkillExecutionContext } from './SkillStrategy';
export { SkillStrategyRegistry, skillStrategyRegistry } from './SkillStrategyRegistry';
export { initializeStrategies } from './skills';

// 重新导出所有策略类
export * from './skills';