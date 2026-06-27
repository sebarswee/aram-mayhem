// src/modifiers/modifiers/StatusEffectModifier.ts
import { Modifier, ModifierType, ModifierOp, StackingPolicy, ModifierPriority } from '../interfaces/ModifierTypes';
import { Element } from '@/types';

/**
 * 状态效果类型
 */
export enum StatusEffectType {
  // DoT效果
  BURN = 'burn',
  POISON = 'poison',

  // 控制效果
  FREEZE = 'freeze',
  STUN = 'stun',
  ROOT = 'root',
  SLOW = 'slow',

  // 增益效果
  SHIELD = 'shield',
  ATTACK_BOOST = 'attack_boost',
  SPEED_BOOST = 'speed_boost',
  DEFENSE_BOOST = 'defense_boost',

  // 特殊效果
  DEFENSE_BREAK = 'defense_break',
  TICK_SPEED_UP = 'tick_speed_up'
}

/**
 * 状态效果修饰符
 */
export interface StatusEffectModifier extends Modifier {
  type: ModifierType.STATUS_EFFECT;

  // 状态效果类型
  effectType: StatusEffectType;

  // DoT效果配置
  tickInterval?: number;    // 触发间隔（毫秒）
  lastTickTime?: number;    // 上次触发时间

  // 元素类型
  element?: Element;

  // 效果值（用于DoT伤害、减速百分比等）
  effectValue: number;
}

/**
 * 创建燃烧效果
 */
export function createBurnEffect(
  value: number,
  duration: number,
  source: string
): StatusEffectModifier {
  return {
    id: `burn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: ModifierType.STATUS_EFFECT,
    effectType: StatusEffectType.BURN,
    operation: ModifierOp.ADD,
    value,
    effectValue: value,
    duration,
    remainingTime: duration,
    tickInterval: 500,
    element: 'fire',
    source,
    tags: new Set(['burn', 'dot', 'fire', 'dispellable']),
    stacking: { policy: StackingPolicy.REFRESH_BY_SOURCE },
    priority: ModifierPriority.NORMAL
  };
}

/**
 * 创建减速效果
 */
export function createSlowEffect(
  value: number,
  duration: number,
  source: string
): StatusEffectModifier {
  return {
    id: `slow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: ModifierType.STATUS_EFFECT,
    effectType: StatusEffectType.SLOW,
    operation: ModifierOp.PERCENT_ADD,
    value: -value, // 负数表示减速
    effectValue: value,
    duration,
    remainingTime: duration,
    source,
    tags: new Set(['slow', 'ice', 'dispellable']),
    stacking: { policy: StackingPolicy.SINGLE_INSTANCE },
    priority: ModifierPriority.NORMAL
  };
}
