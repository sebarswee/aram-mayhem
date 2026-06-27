// src/modifiers/interfaces/IBuffable.ts
import { Modifier } from './ModifierTypes';

/**
 * 可接受 Buff 的实体接口
 * Player 和 Enemy 都实现此接口
 */
export interface IBuffable {
  // 修饰符栈
  readonly modifierStack: any; // 使用 any 避免循环依赖，实际类型为 ModifierStack

  // 基础属性（只读）
  readonly baseAttributes: Readonly<Record<string, number>>;

  // 生命周期
  updateModifiers(delta: number): void;

  // 事件回调（可选）
  onModifierAdded?(modifier: Modifier): void;
  onModifierRemoved?(modifier: Modifier): void;

  // 实体信息
  readonly id: string;
  readonly isActive: boolean;
}
