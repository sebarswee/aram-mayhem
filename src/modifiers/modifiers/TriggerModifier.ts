// src/modifiers/modifiers/TriggerModifier.ts
import { Modifier, ModifierType, ModifierOp, ModifierPriority, StackingPolicy } from '../interfaces/ModifierTypes';

/**
 * 触发器类型
 */
export enum TriggerType {
  ON_HIT = 'on_hit',                 // 被击中时
  ON_DAMAGE_DEALT = 'on_damage_dealt', // 造成伤害时
  ON_KILL = 'on_kill',               // 击杀时
  ON_TAKE_DAMAGE = 'on_take_damage'  // 受到伤害时
}

/**
 * 触发效果
 */
export interface TriggerEffect {
  type: 'damage' | 'heal' | 'freeze' | 'reflect';
  value: number;
  target?: 'self' | 'attacker' | 'victim';
}

/**
 * 触发器修饰符
 */
export interface TriggerModifier extends Modifier {
  type: ModifierType.TRIGGER;

  // 触发条件
  triggerType: TriggerType;

  // 触发次数限制
  maxTriggers: number;
  remainingTriggers: number;

  // 触发效果
  triggerEffect: TriggerEffect;
}

/**
 * 创建反击伤害触发器
 */
export function createCounterDamageTrigger(
  value: number,
  maxTriggers: number,
  duration: number,
  source: string
): TriggerModifier {
  return {
    id: `counter_damage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: ModifierType.TRIGGER,
    triggerType: TriggerType.ON_HIT,
    maxTriggers,
    remainingTriggers: maxTriggers,
    duration,
    remainingTime: duration,
    source,
    tags: new Set(['counter', 'trigger']),
    stacking: { policy: StackingPolicy.SINGLE_INSTANCE },
    priority: ModifierPriority.NORMAL,
    operation: ModifierOp.ADD,
    value,
    triggerEffect: {
      type: 'damage',
      value,
      target: 'attacker'
    }
  };
}
