// src/modifiers/index.ts
// 核心类
export { ModifierStack } from './core/ModifierStack';
export { ModifierFactory } from './core/ModifierFactory';

// 接口
export * from './interfaces/ModifierTypes';
export * from './interfaces/IBuffable';

// 修饰符类型
export * from './modifiers/StatusEffectModifier';
export * from './modifiers/AttributeModifier';
export * from './modifiers/TriggerModifier';
