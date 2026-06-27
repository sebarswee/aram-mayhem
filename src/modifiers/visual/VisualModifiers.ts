// src/modifiers/visual/VisualModifiers.ts
import { StatusEffectModifier, StatusEffectType } from '../modifiers/StatusEffectModifier';
import { ModifierType, ModifierOp, ModifierPriority, StackingPolicy } from '../interfaces/ModifierTypes';
import { IBuffable } from '../interfaces/IBuffable';
import { Player } from '@/entities/Player';
import { Enemy } from '@/entities/Enemy';
import { Element } from '@/types';

/**
 * 视觉效果修饰符工厂
 * 为每种状态效果创建包含视觉反馈的修饰符
 */

/**
 * 创建燃烧效果修饰符
 * @param value 每次tick的伤害值
 * @param duration 持续时间（毫秒）
 * @param element 元素类型（可选）
 */
export function createBurnVisualModifier(
  value: number,
  duration: number,
  element?: Element
): StatusEffectModifier {
  return {
    id: `burn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: ModifierType.STATUS_EFFECT,
    effectType: StatusEffectType.BURN,
    source: 'status_effect_system',
    operation: ModifierOp.ADD,
    value: value,
    effectValue: value,
    duration: duration,
    remainingTime: duration,
    priority: ModifierPriority.NORMAL,
    tags: new Set(['burn', 'dot', 'debuff']),
    stacking: {
      policy: StackingPolicy.REFRESH_BY_SOURCE,
      valueRefresh: true,
    },
    tickInterval: 500,
    lastTickTime: 0,
    element: element,

    onApply: (target: IBuffable) => {
      if (target instanceof Player) {
        target.setTint(0xff8844); // 橙色着色
      } else if (target instanceof Enemy) {
        target.setTint(0xff8844);
      }
    },

    onRemove: (target: IBuffable) => {
      if (target instanceof Player) {
        target.updateVisualTint();
      } else if (target instanceof Enemy) {
        target.applyElementTint();
      }
    },

    onUpdate: (target: IBuffable, delta: number) => {
      if (target instanceof Player) {
        target.takeDamage(value);
      } else if (target instanceof Enemy) {
        target.takeDamage(value);
      }
    },
  };
}

/**
 * 创建中毒效果修饰符
 * @param value 每次tick的伤害值
 * @param duration 持续时间（毫秒）
 */
export function createPoisonVisualModifier(
  value: number,
  duration: number
): StatusEffectModifier {
  return {
    id: `poison_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: ModifierType.STATUS_EFFECT,
    effectType: StatusEffectType.POISON,
    source: 'status_effect_system',
    operation: ModifierOp.ADD,
    value: value,
    effectValue: value,
    duration: duration,
    remainingTime: duration,
    priority: ModifierPriority.NORMAL,
    tags: new Set(['poison', 'dot', 'debuff']),
    stacking: {
      policy: StackingPolicy.REFRESH_BY_SOURCE,
      valueRefresh: true,
    },
    tickInterval: 1000,
    lastTickTime: 0,

    onApply: (target: IBuffable) => {
      if (target instanceof Player) {
        target.setTint(0x44ff44); // 绿色着色
      } else if (target instanceof Enemy) {
        target.setTint(0x44ff44);
      }
    },

    onRemove: (target: IBuffable) => {
      if (target instanceof Player) {
        target.updateVisualTint();
      } else if (target instanceof Enemy) {
        target.applyElementTint();
      }
    },

    onUpdate: (target: IBuffable, delta: number) => {
      if (target instanceof Player) {
        target.takeDamage(value);
      } else if (target instanceof Enemy) {
        target.takeDamage(value);
      }
    },
  };
}

/**
 * 创建冻结效果修饰符
 * @param duration 持续时间（毫秒）
 */
export function createFreezeVisualModifier(duration: number): StatusEffectModifier {
  return {
    id: `freeze_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: ModifierType.STATUS_EFFECT,
    effectType: StatusEffectType.FREEZE,
    source: 'status_effect_system',
    operation: ModifierOp.ADD,
    value: 0,
    effectValue: 0,
    duration: duration,
    remainingTime: duration,
    priority: ModifierPriority.HIGH,
    tags: new Set(['freeze', 'control', 'debuff']),
    stacking: {
      policy: StackingPolicy.REFRESH_BY_SOURCE,
    },

    onApply: (target: IBuffable) => {
      if (target instanceof Player) {
        target.setTint(0x88ddff); // 冰蓝色着色
      } else if (target instanceof Enemy) {
        target.setTint(0x88ddff);
      }
    },

    onRemove: (target: IBuffable) => {
      if (target instanceof Player) {
        target.updateVisualTint();
      } else if (target instanceof Enemy) {
        target.applyElementTint();
      }
    },
  };
}

/**
 * 创建眩晕效果修饰符
 * @param duration 持续时间（毫秒）
 */
export function createStunVisualModifier(duration: number): StatusEffectModifier {
  return {
    id: `stun_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: ModifierType.STATUS_EFFECT,
    effectType: StatusEffectType.STUN,
    source: 'status_effect_system',
    operation: ModifierOp.ADD,
    value: 0,
    effectValue: 0,
    duration: duration,
    remainingTime: duration,
    priority: ModifierPriority.HIGH,
    tags: new Set(['stun', 'control', 'debuff']),
    stacking: {
      policy: StackingPolicy.REFRESH_BY_SOURCE,
    },

    onApply: (target: IBuffable) => {
      if (target instanceof Player) {
        target.setTint(0xffff00); // 黄色着色
      } else if (target instanceof Enemy) {
        target.setTint(0xffff00);
      }
    },

    onRemove: (target: IBuffable) => {
      if (target instanceof Player) {
        target.updateVisualTint();
      } else if (target instanceof Enemy) {
        target.applyElementTint();
      }
    },
  };
}

/**
 * 创建定身效果修饰符
 * @param duration 持续时间（毫秒）
 */
export function createRootVisualModifier(duration: number): StatusEffectModifier {
  return {
    id: `root_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: ModifierType.STATUS_EFFECT,
    effectType: StatusEffectType.ROOT,
    source: 'status_effect_system',
    operation: ModifierOp.ADD,
    value: 0,
    effectValue: 0,
    duration: duration,
    remainingTime: duration,
    priority: ModifierPriority.NORMAL,
    tags: new Set(['root', 'control', 'debuff']),
    stacking: {
      policy: StackingPolicy.REFRESH_BY_SOURCE,
    },

    onRemove: (target: IBuffable) => {
      // 定身没有视觉效果，仅由移动逻辑检查
    },
  };
}

/**
 * 创建减速效果修饰符
 * @param value 减速百分比（0-100）
 * @param duration 持续时间（毫秒）
 */
export function createSlowVisualModifier(
  value: number,
  duration: number
): StatusEffectModifier {
  return {
    id: `slow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: ModifierType.STATUS_EFFECT,
    effectType: StatusEffectType.SLOW,
    source: 'status_effect_system',
    operation: ModifierOp.ADD,
    value: value,
    effectValue: value,
    duration: duration,
    remainingTime: duration,
    priority: ModifierPriority.NORMAL,
    tags: new Set(['slow', 'debuff']),
    stacking: {
      policy: StackingPolicy.REFRESH_BY_SOURCE,
      valueRefresh: true,
    },

    onRemove: (target: IBuffable) => {
      // 减速没有视觉效果，由 getSpeedMultiplier() 计算
    },
  };
}

/**
 * 创建攻击加成效果修饰符
 * @param value 攻击力加成百分比
 * @param duration 持续时间（毫秒）
 */
export function createAttackBoostVisualModifier(
  value: number,
  duration: number
): StatusEffectModifier {
  return {
    id: `attack_boost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: ModifierType.STATUS_EFFECT,
    effectType: StatusEffectType.ATTACK_BOOST,
    source: 'status_effect_system',
    operation: ModifierOp.ADD,
    value: value,
    effectValue: value,
    duration: duration,
    remainingTime: duration,
    priority: ModifierPriority.NORMAL,
    tags: new Set(['attack_boost', 'buff']),
    stacking: {
      policy: StackingPolicy.REFRESH_BY_SOURCE,
      valueRefresh: true,
    },

    onApply: (target: IBuffable) => {
      if (target instanceof Player) {
        target.setTint(0xff4444); // 红色着色
      }
    },

    onRemove: (target: IBuffable) => {
      if (target instanceof Player) {
        target.updateVisualTint();
      }
    },
  };
}

/**
 * 创建速度加成效果修饰符
 * @param value 速度加成百分比
 * @param duration 持续时间（毫秒）
 */
export function createSpeedBoostVisualModifier(
  value: number,
  duration: number
): StatusEffectModifier {
  return {
    id: `speed_boost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: ModifierType.STATUS_EFFECT,
    effectType: StatusEffectType.SPEED_BOOST,
    source: 'status_effect_system',
    operation: ModifierOp.ADD,
    value: value,
    effectValue: value,
    duration: duration,
    remainingTime: duration,
    priority: ModifierPriority.NORMAL,
    tags: new Set(['speed_boost', 'buff']),
    stacking: {
      policy: StackingPolicy.REFRESH_BY_SOURCE,
      valueRefresh: true,
    },

    onApply: (target: IBuffable) => {
      if (target instanceof Player) {
        target.createSpeedTrailParticles();
      }
    },

    onRemove: (target: IBuffable) => {
      if (target instanceof Player) {
        const emitter = target.getParticleEmitter('speed_trail');
        if (emitter) {
          emitter.destroy();
        }
      }
    },
  };
}

/**
 * 创建破甲效果修饰符
 * @param value 破甲百分比（增加受到的伤害）
 * @param duration 持续时间（毫秒）
 */
export function createDefenseBreakVisualModifier(
  value: number,
  duration: number
): StatusEffectModifier {
  return {
    id: `defense_break_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: ModifierType.STATUS_EFFECT,
    effectType: StatusEffectType.DEFENSE_BREAK,
    source: 'status_effect_system',
    operation: ModifierOp.ADD,
    value: value,
    effectValue: value,
    duration: duration,
    remainingTime: duration,
    priority: ModifierPriority.NORMAL,
    tags: new Set(['defense_break', 'debuff']),
    stacking: {
      policy: StackingPolicy.REFRESH_BY_SOURCE,
      valueRefresh: true,
    },

    onRemove: (target: IBuffable) => {
      // 破甲没有视觉效果，由 takeDamage 计算
    },
  };
}

/**
 * 创建护盾效果修饰符
 * 注意：护盾是独立数值，不纳入属性计算，这里仅作为效果标记
 * @param value 护盾值
 */
export function createShieldVisualModifier(value: number): StatusEffectModifier {
  return {
    id: `shield_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: ModifierType.STATUS_EFFECT,
    effectType: StatusEffectType.SHIELD,
    source: 'status_effect_system',
    operation: ModifierOp.ADD,
    value: value,
    effectValue: value,
    duration: -1, // 护盾无时间限制，由伤害消耗
    remainingTime: -1,
    priority: ModifierPriority.NORMAL,
    tags: new Set(['shield', 'buff']),
    stacking: {
      policy: StackingPolicy.INDEPENDENT,
    },

    onApply: (target: IBuffable) => {
      if (target instanceof Player) {
        target.addShield(value);
      } else if (target instanceof Enemy) {
        target.addShield(value);
      }
    },

    onRemove: (target: IBuffable) => {
      // 护盾由伤害逻辑移除，这里不需要处理
    },
  };
}
