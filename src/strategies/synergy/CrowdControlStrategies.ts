import { SynergyEffectStrategy, SynergyExecutionContext } from './SynergyStrategyRegistry';
import { SynergyResult } from '@/types';
import { Enemy } from '@/entities/Enemy';
import Phaser from 'phaser';

/**
 * 冻结策略
 */
export class FreezeStrategy implements SynergyEffectStrategy {
  execute(synergy: SynergyResult, enemy: Enemy, _context: SynergyExecutionContext): void {
    enemy.addStatusEffect({
      type: 'freeze',
      value: 0,
      duration: synergy.duration || 3000,
      remainingTime: synergy.duration || 3000,
      source: 'synergy',
    });
  }
}

/**
 * 眩晕策略
 */
export class StunStrategy implements SynergyEffectStrategy {
  execute(synergy: SynergyResult, enemy: Enemy, _context: SynergyExecutionContext): void {
    enemy.addStatusEffect({
      type: 'stun',
      value: 0,
      duration: synergy.duration || 1500,
      remainingTime: synergy.duration || 1500,
      source: 'synergy',
    });
  }
}

/**
 * 减速策略
 */
export class SlowStrategy implements SynergyEffectStrategy {
  execute(synergy: SynergyResult, enemy: Enemy, _context: SynergyExecutionContext): void {
    enemy.addStatusEffect({
      type: 'slow',
      value: synergy.value || 0.3,
      duration: synergy.duration || 3000,
      remainingTime: synergy.duration || 3000,
      source: 'synergy',
    });
  }
}

/**
 * 定身策略
 */
export class RootStrategy implements SynergyEffectStrategy {
  execute(synergy: SynergyResult, enemy: Enemy, _context: SynergyExecutionContext): void {
    enemy.addStatusEffect({
      type: 'root',
      value: 0,
      duration: synergy.duration || 2000,
      remainingTime: synergy.duration || 2000,
      source: 'synergy',
    });
  }
}

/**
 * 击飞策略
 */
export class KnockupStrategy implements SynergyEffectStrategy {
  execute(synergy: SynergyResult, enemy: Enemy, context: SynergyExecutionContext): void {
    enemy.addStatusEffect({
      type: 'stun',
      value: 0,
      duration: 1000,
      remainingTime: 1000,
      source: 'synergy_knockup',
    });
    // 视觉击飞
    context.scene.tweens.add({
      targets: enemy,
      y: enemy.y - 30,
      duration: 200,
      yoyo: true,
      ease: 'Power2',
    });
  }
}

/**
 * 真实伤害+混乱策略
 */
export class TrueDamageConfuseStrategy implements SynergyEffectStrategy {
  execute(synergy: SynergyResult, enemy: Enemy, context: SynergyExecutionContext): void {
    const confuseDamage = Math.floor(context.baseDamage * 0.3);
    // 真实伤害绕过防御和克制，不传递元素
    enemy.takeDamage(confuseDamage);
    enemy.addStatusEffect({
      type: 'stun',
      value: 0,
      duration: synergy.duration || 2000,
      remainingTime: synergy.duration || 2000,
      source: 'synergy_confuse',
    });
  }
}