import { SynergyEffectStrategy, SynergyExecutionContext } from './SynergyStrategyRegistry';
import { SynergyResult } from '@/types';
import { Enemy } from '@/entities/Enemy';
import Phaser from 'phaser';
import {
  createFreezeVisualModifier,
  createStunVisualModifier,
  createSlowVisualModifier,
  createRootVisualModifier,
} from '@/modifiers/visual/VisualModifiers';

/**
 * 冻结策略
 */
export class FreezeStrategy implements SynergyEffectStrategy {
  execute(synergy: SynergyResult, enemy: Enemy, _context: SynergyExecutionContext): void {
    enemy.modifierStack.addModifier(
      createFreezeVisualModifier(synergy.duration || 3000)
    );
  }
}

/**
 * 眩晕策略
 */
export class StunStrategy implements SynergyEffectStrategy {
  execute(synergy: SynergyResult, enemy: Enemy, _context: SynergyExecutionContext): void {
    enemy.modifierStack.addModifier(
      createStunVisualModifier(synergy.duration || 1500)
    );
  }
}

/**
 * 减速策略
 */
export class SlowStrategy implements SynergyEffectStrategy {
  execute(synergy: SynergyResult, enemy: Enemy, _context: SynergyExecutionContext): void {
    enemy.modifierStack.addModifier(
      createSlowVisualModifier(synergy.value || 30, synergy.duration || 3000)
    );
  }
}

/**
 * 定身策略
 */
export class RootStrategy implements SynergyEffectStrategy {
  execute(synergy: SynergyResult, enemy: Enemy, _context: SynergyExecutionContext): void {
    enemy.modifierStack.addModifier(
      createRootVisualModifier(synergy.duration || 2000)
    );
  }
}

/**
 * 击飞策略
 */
export class KnockupStrategy implements SynergyEffectStrategy {
  execute(synergy: SynergyResult, enemy: Enemy, context: SynergyExecutionContext): void {
    enemy.modifierStack.addModifier(
      createStunVisualModifier(1000)
    );
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
    enemy.modifierStack.addModifier(
      createStunVisualModifier(synergy.duration || 2000)
    );
  }
}