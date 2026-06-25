import Phaser from 'phaser';
import { Skill } from '@/types';
import { Player } from '@/entities/Player';
import { Enemy } from '@/entities/Enemy';

/**
 * 技能执行上下文 - 传递给策略的上下文信息
 */
export interface SkillExecutionContext {
  scene: Phaser.Scene;
  player: Player;
  damage: number;
  findEnemiesInRange: (x: number, y: number, range: number) => Enemy[];
  applyDamageToEnemy: (enemy: Enemy, damage: number, skill: Skill, isCrit?: boolean) => void;
  applyEffects: (enemy: Enemy, effects: Skill['effects']) => void;
  applyLifesteal: (damage: number) => void;
}

/**
 * 技能策略接口 - 所有技能策略必须实现此接口
 */
export interface SkillStrategy {
  /**
   * 执行技能逻辑
   */
  execute(skill: Skill, context: SkillExecutionContext): void;
}

/**
 * 视觉效果策略接口
 */
export interface VisualEffectStrategy {
  /**
   * 创建视觉效果
   */
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, element?: string): void;
}
