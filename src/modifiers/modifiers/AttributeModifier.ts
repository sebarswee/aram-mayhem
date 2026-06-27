// src/modifiers/modifiers/AttributeModifier.ts
import { Modifier, ModifierType, ModifierOp, ModifierPriority, StackingPolicy } from '../interfaces/ModifierTypes';

/**
 * 属性修饰符
 * 用于修改攻击、防御、速度等属性
 */
export interface AttributeModifier extends Modifier {
  type: ModifierType.ATTRIBUTE;

  // 目标属性名称
  targetAttribute: string;  // 'attack', 'defense', 'speed', etc.
}

/**
 * 创建攻击力增加修饰符
 */
export function createAttackBoostModifier(
  value: number,
  duration: number,
  source: string
): AttributeModifier {
  return {
    id: `attack_boost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: ModifierType.ATTRIBUTE,
    targetAttribute: 'attack',
    operation: ModifierOp.ADD,
    value,
    duration,
    remainingTime: duration,
    source,
    tags: new Set(['buff', 'attack']),
    stacking: { policy: StackingPolicy.INDEPENDENT },
    priority: ModifierPriority.NORMAL
  };
}

/**
 * 创建速度增加修饰符
 */
export function createSpeedBoostModifier(
  value: number,
  duration: number,
  source: string
): AttributeModifier {
  return {
    id: `speed_boost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: ModifierType.ATTRIBUTE,
    targetAttribute: 'speed',
    operation: ModifierOp.PERCENT_ADD,
    value, // 正数表示加速百分比
    duration,
    remainingTime: duration,
    source,
    tags: new Set(['buff', 'speed']),
    stacking: { policy: StackingPolicy.INDEPENDENT },
    priority: ModifierPriority.NORMAL
  };
}