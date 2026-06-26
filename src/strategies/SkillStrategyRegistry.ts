import { SkillStrategy, VisualEffectStrategy, ProjectileVisualStrategy, BuffStrategy, SkillExecutionContext } from './SkillStrategy';
import { Skill } from '@/types';
import Phaser from 'phaser';

/**
 * 技能策略注册表 - 管理所有技能策略
 * 使用单例模式确保全局唯一
 */
export class SkillStrategyRegistry {
  private static instance: SkillStrategyRegistry;
  private strategies: Map<string, SkillStrategy> = new Map();
  private visualStrategies: Map<string, VisualEffectStrategy> = new Map();
  private projectileVisualStrategies: Map<string, ProjectileVisualStrategy> = new Map();
  private buffStrategies: Map<string, BuffStrategy> = new Map();

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): SkillStrategyRegistry {
    if (!SkillStrategyRegistry.instance) {
      SkillStrategyRegistry.instance = new SkillStrategyRegistry();
    }
    return SkillStrategyRegistry.instance;
  }

  /**
   * 注册技能策略
   */
  register(skillId: string, strategy: SkillStrategy): void {
    this.strategies.set(skillId, strategy);
  }

  /**
   * 注册视觉效果策略
   */
  registerVisual(skillId: string, strategy: VisualEffectStrategy): void {
    this.visualStrategies.set(skillId, strategy);
  }

  /**
   * 注册投射物视觉策略
   */
  registerProjectileVisual(skillId: string, strategy: ProjectileVisualStrategy): void {
    this.projectileVisualStrategies.set(skillId, strategy);
  }

  /**
   * 批量注册（同时注册行为和视觉策略）
   */
  registerBoth(skillId: string, strategy: SkillStrategy, visualStrategy: VisualEffectStrategy): void {
    this.strategies.set(skillId, strategy);
    this.visualStrategies.set(skillId, visualStrategy);
  }

  /**
   * 批量注册投射物策略
   */
  registerProjectile(skillId: string, strategy: SkillStrategy, visualStrategy: ProjectileVisualStrategy): void {
    this.strategies.set(skillId, strategy);
    this.projectileVisualStrategies.set(skillId, visualStrategy);
  }

  /**
   * 批量注册增益技能策略
   */
  registerBuff(skillId: string, strategy: BuffStrategy, visualStrategy: VisualEffectStrategy): void {
    this.buffStrategies.set(skillId, strategy);
    this.visualStrategies.set(skillId, visualStrategy);
  }

  /**
   * 获取技能策略
   */
  get(skillId: string): SkillStrategy | undefined {
    return this.strategies.get(skillId);
  }

  /**
   * 获取视觉效果策略
   */
  getVisual(skillId: string): VisualEffectStrategy | undefined {
    return this.visualStrategies.get(skillId);
  }

  /**
   * 获取投射物视觉策略
   */
  getProjectileVisual(skillId: string): ProjectileVisualStrategy | undefined {
    return this.projectileVisualStrategies.get(skillId);
  }

  /**
   * 获取增益技能策略
   */
  getBuff(skillId: string): BuffStrategy | undefined {
    return this.buffStrategies.get(skillId);
  }

  /**
   * 执行技能策略
   */
  execute(skill: Skill, context: SkillExecutionContext): boolean {
    const strategy = this.strategies.get(skill.id);
    if (strategy) {
      strategy.execute(skill, context);
      return true;
    }
    return false;
  }

  /**
   * 创建视觉效果
   */
  createVisualEffect(skillId: string, scene: Phaser.Scene, x: number, y: number, radius: number, element?: string): boolean {
    const strategy = this.visualStrategies.get(skillId);
    if (strategy) {
      strategy.createEffect(scene, x, y, radius, element);
      return true;
    }
    return false;
  }

  /**
   * 创建投射物视觉效果
   */
  createProjectileVisualEffect(skillId: string, container: Phaser.GameObjects.Container, scene: Phaser.Scene, element: string, angle: number): boolean {
    const strategy = this.projectileVisualStrategies.get(skillId);
    if (strategy) {
      strategy.createProjectileEffect(container, scene, element, angle);
      return true;
    }
    return false;
  }

  /**
   * 检查是否已注册技能策略
   */
  hasStrategy(skillId: string): boolean {
    return this.strategies.has(skillId);
  }

  /**
   * 检查是否已注册视觉策略
   */
  hasVisualStrategy(skillId: string): boolean {
    return this.visualStrategies.has(skillId);
  }

  /**
   * 检查是否已注册投射物视觉策略
   */
  hasProjectileVisualStrategy(skillId: string): boolean {
    return this.projectileVisualStrategies.has(skillId);
  }

  /**
   * 检查是否已注册增益技能策略
   */
  hasBuffStrategy(skillId: string): boolean {
    return this.buffStrategies.has(skillId);
  }

  /**
   * 获取所有已注册的技能ID
   */
  getRegisteredSkillIds(): string[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * 清空所有注册（用于测试）
   */
  clear(): void {
    this.strategies.clear();
    this.visualStrategies.clear();
    this.projectileVisualStrategies.clear();
    this.buffStrategies.clear();
  }
}

/**
 * 导出单例实例，方便直接使用
 */
export const skillStrategyRegistry = SkillStrategyRegistry.getInstance();
