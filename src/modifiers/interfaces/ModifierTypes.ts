// src/modifiers/interfaces/ModifierTypes.ts
import { Element } from '@/types';

/**
 * 修饰符类型
 */
export enum ModifierType {
  ATTRIBUTE = 'attribute',        // 属性修饰符
  STATUS_EFFECT = 'status_effect', // 状态效果
  TRIGGER = 'trigger'             // 触发器
}

/**
 * 修饰符操作类型
 */
export enum ModifierOp {
  ADD = 'add',                   // 加法: base + value
  MULTIPLY = 'multiply',         // 乘法: base * value
  PERCENT_ADD = 'percent_add',   // 百分比: base * (1 + value%)
  OVERRIDE = 'override'          // 覆盖: value
}

/**
 * 修饰符优先级
 */
export enum ModifierPriority {
  LOWEST = 0,
  LOW = 25,
  NORMAL = 50,
  HIGH = 75,
  HIGHEST = 100,
  OVERRIDE = 200  // 覆盖操作总是最后执行
}

/**
 * 叠加策略
 */
export enum StackingPolicy {
  INDEPENDENT = 'independent',          // 独立叠加
  REFRESH_BY_SOURCE = 'refresh_by_source', // 按源刷新
  SINGLE_INSTANCE = 'single_instance',  // 单实例
  MAX_STACKS = 'max_stacks'             // 最大层数
}

/**
 * 叠加配置
 */
export interface StackingConfig {
  policy: StackingPolicy;
  maxStacks?: number;
  durationRefresh?: boolean;
  valueRefresh?: boolean;
}

/**
 * 基础修饰符接口
 */
export interface Modifier {
  // 基础信息
  id: string;
  type: ModifierType;
  source: string;

  // 数值
  operation: ModifierOp;
  value: number;
  priority: number;

  // 目标属性（属性修饰符用）
  targetAttribute?: string;

  // 持续时间
  duration: number;  // -1 = 永久
  remainingTime: number;

  // 标签系统
  tags: Set<string>;

  // 叠加规则
  stacking: StackingConfig;

  // 生命周期回调
  onApply?(target: IBuffable): void;
  onRemove?(target: IBuffable): void;
  onUpdate?(target: IBuffable, delta: number): void;
}

// 前向声明（不导出，实际的 IBuffable 在 IBuffable.ts 中定义）
interface IBuffable {
  readonly modifierStack: any; // ModifierStack
  readonly baseAttributes: Readonly<Record<string, number>>;
  updateModifiers(delta: number): void;
  onModifierAdded?(modifier: Modifier): void;
  onModifierRemoved?(modifier: Modifier): void;
  readonly id: string;
  readonly isActive: boolean;
}
