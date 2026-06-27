// src/modifiers/core/ModifierFactory.ts
import { Modifier } from '../interfaces/ModifierTypes';
import { createBurnEffect, createSlowEffect } from '../modifiers/StatusEffectModifier';
import { createAttackBoostModifier, createSpeedBoostModifier } from '../modifiers/AttributeModifier';
import { createCounterDamageTrigger } from '../modifiers/TriggerModifier';

/**
 * 修饰符工厂类
 * 提供创建各种修饰符的便捷方法
 */
export class ModifierFactory {
  /**
   * 创建燃烧效果
   */
  static createBurn(value: number, duration: number, source: string): Modifier {
    return createBurnEffect(value, duration, source);
  }

  /**
   * 创建减速效果
   */
  static createSlow(value: number, duration: number, source: string): Modifier {
    return createSlowEffect(value, duration, source);
  }

  /**
   * 创建攻击力增益
   */
  static createAttackBoost(value: number, duration: number, source: string): Modifier {
    return createAttackBoostModifier(value, duration, source);
  }

  /**
   * 创建速度增益
   */
  static createSpeedBoost(value: number, duration: number, source: string): Modifier {
    return createSpeedBoostModifier(value, duration, source);
  }

  /**
   * 创建反击伤害触发器
   */
  static createCounterDamage(value: number, maxTriggers: number, duration: number, source: string): Modifier {
    return createCounterDamageTrigger(value, maxTriggers, duration, source);
  }
}
