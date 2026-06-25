// src/systems/SpecialBehaviorRegistry.ts
// 特殊行为注册表 - 处理技能升级树中的特殊行为

import Phaser from 'phaser';
import { Skill, SkillEffect } from '@/types';
import { Projectile, ProjectileConfig } from '@/entities/Projectile';
import { Enemy } from '@/entities/Enemy';
import { specialBehaviorConfigRegistry } from '@/strategies';

/**
 * 特殊行为类型定义
 */
export type SpecialBehaviorType =
  | 'pierce' // 穿透
  | 'split' // 分裂
  | 'homing' // 追踪
  | 'chain' // 连锁
  | 'meteor_fall' // 陨石坠落
  | 'rapid_fire' // 连发
  | 'explode_on_hit' // 命中爆炸
  | 'instant_hit' // 瞬发
  | 'multicast' // 多重施法
  | 'chain_add' // 增加连锁次数
  | 'chain_decay' // 连锁衰减
  | 'chain_range' // 连锁范围
  | 'area_blizzard' // 区域暴风雪
  | 'leave_slow_field' // 留下减速区域
  | 'shatter' // 破碎效果
  | 'summon_lightning_storm' // 召唤雷暴
  | 'arc_between_targets' // 目标间电弧
  | 'unknown'; // 未知行为（向后兼容）

/**
 * 解析后的特殊行为
 */
export interface ParsedBehavior {
  id: SpecialBehaviorType;
  value?: number;
}

/**
 * 特殊行为处理器
 */
export type BehaviorHandler = (
  projectile: Projectile,
  scene: Phaser.Scene,
  value?: number
) => void;

/**
 * 特殊行为注册表
 * 管理所有技能特殊行为的注册和执行
 */
export class SpecialBehaviorRegistry {
  private static instance: SpecialBehaviorRegistry;
  private behaviors: Map<SpecialBehaviorType, BehaviorHandler> = new Map();

  private constructor() {
    this.registerDefaultBehaviors();
  }

  static getInstance(): SpecialBehaviorRegistry {
    if (!SpecialBehaviorRegistry.instance) {
      SpecialBehaviorRegistry.instance = new SpecialBehaviorRegistry();
    }
    return SpecialBehaviorRegistry.instance;
  }

  /**
   * 注册默认行为处理器
   */
  private registerDefaultBehaviors(): void {
    // 追踪行为 - 投射物自动追踪最近敌人
    this.register('homing', (projectile, scene, _value) => {
      const target = projectile.config.homingTarget;
      if (!target || !target.active) {
        // 寻找新的追踪目标
        const enemies = scene.physics.overlapCirc(
          projectile.x,
          projectile.y,
          300
        ) as Phaser.Physics.Arcade.Body[];

        let nearestEnemy: Enemy | null = null;
        let minDist = Infinity;

        for (const body of enemies) {
          const obj = body.gameObject;
          if (obj instanceof Enemy && obj.active) {
            const dist = Phaser.Math.Distance.Between(
              projectile.x,
              projectile.y,
              obj.x,
              obj.y
            );
            if (dist < minDist) {
              minDist = dist;
              nearestEnemy = obj;
            }
          }
        }

        if (nearestEnemy) {
          projectile.config.homingTarget = nearestEnemy;
        }
      }

      // 追踪目标
      if (projectile.config.homingTarget && projectile.config.homingTarget.active) {
        const target = projectile.config.homingTarget;
        const angle = Phaser.Math.Angle.Between(
          projectile.x,
          projectile.y,
          target.x,
          target.y
        );

        const body = projectile.body as Phaser.Physics.Arcade.Body;
        if (body) {
          const speed = projectile.config.speed;
          body.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
          );
          projectile.setRotation(angle);
        }
      }
    });

    // 分裂行为 - 命中时分裂
    this.register('split', (_projectile, _scene, _value) => {
      // 分裂行为在命中时触发，由 CollisionSystem 处理
    });

    // 陨石坠落 - 抛物线轨迹
    this.register('meteor_fall', (projectile, scene, _value) => {
      // 创建陨石下落效果
      const shadow = scene.add.ellipse(
        projectile.x,
        projectile.y,
        40,
        20,
        0x000000,
        0.3
      );
      shadow.setDepth(35);

      // 投射物向上飞然后下落
      const startY = projectile.y - 200;
      projectile.y = startY;

      // 下落动画
      scene.tweens.add({
        targets: projectile,
        y: shadow.y,
        duration: 500,
        ease: 'Power2',
        onComplete: () => {
          shadow.destroy();
          // 爆炸效果
          const explosion = scene.add.circle(
            projectile.x,
            projectile.y,
            60,
            0xff6600,
            0.8
          );
          explosion.setDepth(50);
          scene.tweens.add({
            targets: explosion,
            scale: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => explosion.destroy(),
          });
        },
      });
    });

    // 连发 - 在投射物配置中处理
    this.register('rapid_fire', (_projectile, _scene, _value) => {
      // 连发在技能施放时处理
    });

    // 命中爆炸
    this.register('explode_on_hit', (_projectile, _scene, _value) => {
      // 在命中时触发，由 CollisionSystem 处理
    });

    // 瞬发行为
    this.register('instant_hit', (projectile, scene, _value) => {
      // 瞬发投射物立即到达目标
      const target = projectile.config.instantHitTarget;
      if (target) {
        projectile.setPosition(target.x, target.y);
        // 立即触发伤害
        const body = projectile.body as Phaser.Physics.Arcade.Body;
        if (body) {
          body.setVelocity(0, 0);
        }
      }
    });

    // 电弧效果
    this.register('arc_between_targets', (_projectile, _scene, _value) => {
      // 在命中时触发，创建电弧
    });
  }

  /**
   * 注册特殊行为处理器
   */
  register(type: SpecialBehaviorType, handler: BehaviorHandler): void {
    this.behaviors.set(type, handler);
  }

  /**
   * 执行特殊行为
   */
  execute(
    type: SpecialBehaviorType,
    projectile: Projectile,
    scene: Phaser.Scene,
    value?: number
  ): void {
    const handler = this.behaviors.get(type);
    if (handler) {
      handler(projectile, scene, value);
    }
  }

  /**
   * 解析特殊行为字符串
   * @param behavior 行为字符串，如 "pierce:2", "homing"
   */
  static parseBehavior(behavior: string): ParsedBehavior {
    const [id, valueStr] = behavior.split(':') as [SpecialBehaviorType, string | undefined];
    return {
      id,
      value: valueStr ? parseFloat(valueStr) : undefined,
    };
  }

  /**
   * 检查技能是否有特定行为
   */
  hasBehavior(skill: Skill, behaviorId: SpecialBehaviorType): boolean {
    if (!skill.specialBehaviors) return false;
    return skill.specialBehaviors.some(b => {
      const parsed = this.parseBehavior(b);
      return parsed.id === behaviorId;
    });
  }

  /**
   * 获取技能特定行为的值
   */
  getBehaviorValue(skill: Skill, behaviorId: SpecialBehaviorType): number | undefined {
    if (!skill.specialBehaviors) return undefined;
    for (const b of skill.specialBehaviors) {
      const parsed = this.parseBehavior(b);
      if (parsed.id === behaviorId) {
        return parsed.value;
      }
    }
    return undefined;
  }

  /**
   * 解析行为（实例方法）
   */
  parseBehavior(behavior: string): ParsedBehavior {
    return SpecialBehaviorRegistry.parseBehavior(behavior);
  }

  /**
   * 应用特殊行为到投射物配置
   */
  applyToConfig(skill: Skill, config: ProjectileConfig): void {
    if (!skill.specialBehaviors) return;

    for (const behavior of skill.specialBehaviors) {
      const parsed = this.parseBehavior(behavior);

      // 使用策略模式
      if (specialBehaviorConfigRegistry.hasStrategy(parsed.id)) {
        specialBehaviorConfigRegistry.apply(parsed.id, config, parsed);
      }
    }
  }

  /**
   * 更新投射物的特殊行为（每帧调用）
   */
  updateProjectile(projectile: Projectile, scene: Phaser.Scene): void {
    const skill = projectile.config.skill;
    if (!skill.specialBehaviors) return;

    for (const behavior of skill.specialBehaviors) {
      const parsed = this.parseBehavior(behavior);

      // 追踪行为需要每帧更新
      if (parsed.id === 'homing') {
        this.execute('homing', projectile, scene, parsed.value);
      }
    }
  }
}

// 导出单例
export const specialBehaviorRegistry = SpecialBehaviorRegistry.getInstance();
