import Phaser from 'phaser';
import { Skill, SkillEffect } from '@/types';
import { Player } from '@/entities/Player';
import { Enemy } from '@/entities/Enemy';
import type { ProjectileConfig } from '@/entities/Projectile';

/**
 * 技能执行上下文 - 传递给策略的上下文信息
 */
export interface SkillExecutionContext {
  scene: Phaser.Scene;
  player: Player;
  damage: number;
  isCrit: boolean; // 当前技能是否暴击
  findEnemiesInRange: (x: number, y: number, range: number) => Enemy[];
  findNearestEnemy: (x: number, y: number, range: number) => Enemy | null;
  applyDamageToEnemy: (enemy: Enemy, damage: number, skill: Skill, isCrit?: boolean) => void;
  applyEffects: (enemy: Enemy, effects: SkillEffect[]) => void;
  applyLifesteal: (damage: number) => void;
  createProjectile: (config: ProjectileConfig) => Phaser.GameObjects.Container;
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

/**
 * 投射物视觉策略接口
 */
export interface ProjectileVisualStrategy {
  /**
   * 创建投射物视觉效果
   */
  createProjectileEffect(container: Phaser.GameObjects.Container, scene: Phaser.Scene, element: string, angle: number): void;
}

/**
 * 增益技能策略接口
 */
export interface BuffStrategy {
  /**
   * 执行增益技能
   */
  execute(skill: Skill, context: SkillExecutionContext): void;
}
