import { StatusEffectStrategy, StatusEffectExecutionContext } from './StatusEffectStrategyRegistry';
import { SkillEffect } from '@/types';
import Phaser from 'phaser';

/**
 * 燃烧效果策略
 */
export class BurnEffectStrategy implements StatusEffectStrategy {
  execute(effect: SkillEffect, context: StatusEffectExecutionContext): void {
    if (context.enemy) {
      context.enemy.addStatusEffect({
        type: 'burn',
        value: effect.value,
        duration: effect.duration || 3000,
        remainingTime: effect.duration || 3000,
        source: 'skill',
      });
    }
  }
}

/**
 * 冻结效果策略
 */
export class FreezeEffectStrategy implements StatusEffectStrategy {
  execute(effect: SkillEffect, context: StatusEffectExecutionContext): void {
    if (context.enemy) {
      context.enemy.addStatusEffect({
        type: 'freeze',
        value: 0,
        duration: effect.duration || 1000,
        remainingTime: effect.duration || 1000,
        source: 'skill',
      });
    }
  }
}

/**
 * 眩晕效果策略
 */
export class StunEffectStrategy implements StatusEffectStrategy {
  execute(effect: SkillEffect, context: StatusEffectExecutionContext): void {
    if (context.enemy) {
      context.enemy.addStatusEffect({
        type: 'stun',
        value: 0,
        duration: effect.duration || 1000,
        remainingTime: effect.duration || 1000,
        source: 'skill',
      });
    }
  }
}

/**
 * 中毒效果策略
 */
export class PoisonEffectStrategy implements StatusEffectStrategy {
  execute(effect: SkillEffect, context: StatusEffectExecutionContext): void {
    if (context.enemy) {
      context.enemy.addStatusEffect({
        type: 'poison',
        value: effect.value,
        duration: effect.duration || 3000,
        remainingTime: effect.duration || 3000,
        source: 'skill',
      });
    }
  }
}

/**
 * 减速效果策略
 */
export class SlowEffectStrategy implements StatusEffectStrategy {
  execute(effect: SkillEffect, context: StatusEffectExecutionContext): void {
    if (context.enemy) {
      context.enemy.addStatusEffect({
        type: 'slow',
        value: effect.value,
        duration: effect.duration || 2000,
        remainingTime: effect.duration || 2000,
        source: 'skill',
      });
    }
  }
}

/**
 * 击退效果策略
 */
export class KnockbackEffectStrategy implements StatusEffectStrategy {
  execute(effect: SkillEffect, context: StatusEffectExecutionContext): void {
    if (context.enemy && context.player) {
      const angle = Phaser.Math.Angle.Between(
        context.player.x,
        context.player.y,
        context.enemy.x,
        context.enemy.y
      );
      const knockbackDistance = effect.value || 100;
      context.enemy.x += Math.cos(angle) * knockbackDistance;
      context.enemy.y += Math.sin(angle) * knockbackDistance;
    }
  }
}

/**
 * 治疗效果策略
 */
export class HealEffectStrategy implements StatusEffectStrategy {
  execute(effect: SkillEffect, context: StatusEffectExecutionContext): void {
    context.player.heal(effect.value || 10);
  }
}

/**
 * 护盾效果策略
 */
export class ShieldEffectStrategy implements StatusEffectStrategy {
  execute(effect: SkillEffect, context: StatusEffectExecutionContext): void {
    context.player.addShield(effect.value || 50);
  }
}

/**
 * 破防效果策略
 */
export class DefenseBreakEffectStrategy implements StatusEffectStrategy {
  execute(effect: SkillEffect, context: StatusEffectExecutionContext): void {
    if (context.enemy) {
      context.enemy.addStatusEffect({
        type: 'defense_break',
        value: effect.value || 0.3,
        duration: effect.duration || 5000,
        remainingTime: effect.duration || 5000,
        source: 'skill',
      });
    }
  }
}

/**
 * 反伤效果策略
 */
export class DamageReflectEffectStrategy implements StatusEffectStrategy {
  execute(effect: SkillEffect, context: StatusEffectExecutionContext): void {
    context.player.addReflectEffect({
      value: effect.value || 0.3,
      duration: effect.duration || 8000,
    });
  }
}