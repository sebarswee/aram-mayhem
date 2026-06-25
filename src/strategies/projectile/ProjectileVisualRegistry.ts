import Phaser from 'phaser';
import { Projectile } from '@/entities/Projectile';

/**
 * 投射物视觉上下文
 */
export interface ProjectileVisualContext {
  projectile: Projectile;
  scene: Phaser.Scene;
  element: string;
}

/**
 * 投射物视觉策略接口
 */
export interface ProjectileVisualStrategy {
  /**
   * 应用视觉效果
   */
  apply(context: ProjectileVisualContext): void;
}

/**
 * 投射物视觉策略注册表
 */
export class ProjectileVisualRegistry {
  private static instance: ProjectileVisualRegistry;
  private strategies: Map<string, ProjectileVisualStrategy> = new Map();

  private constructor() {}

  static getInstance(): ProjectileVisualRegistry {
    if (!ProjectileVisualRegistry.instance) {
      ProjectileVisualRegistry.instance = new ProjectileVisualRegistry();
    }
    return ProjectileVisualRegistry.instance;
  }

  /**
   * 注册策略
   */
  register(skillId: string, strategy: ProjectileVisualStrategy): void {
    this.strategies.set(skillId, strategy);
  }

  /**
   * 应用视觉效果
   */
  apply(skillId: string, context: ProjectileVisualContext): void {
    const strategy = this.strategies.get(skillId);
    if (strategy) {
      strategy.apply(context);
    }
  }

  /**
   * 检查是否已注册
   */
  hasStrategy(skillId: string): boolean {
    return this.strategies.has(skillId);
  }
}

export const projectileVisualRegistry = ProjectileVisualRegistry.getInstance();

// ==================== 具体策略实现 ====================

/**
 * 点燃视觉效果
 */
export class IgniteVisualStrategy implements ProjectileVisualStrategy {
  apply(context: ProjectileVisualContext): void {
    const { projectile } = context;
    projectile.setScale(0.6);
    projectile.setTint(0xff8800);
  }
}

/**
 * 电弧视觉效果
 */
export class ArcLightningVisualStrategy implements ProjectileVisualStrategy {
  apply(context: ProjectileVisualContext): void {
    const { projectile } = context;
    projectile.setScale(0.7);
    projectile.setTint(0xffff88);
  }
}

/**
 * 种子炸弹视觉效果
 */
export class SeedBombVisualStrategy implements ProjectileVisualStrategy {
  apply(context: ProjectileVisualContext): void {
    const { projectile } = context;
    projectile.setScale(1.2);
    projectile.setTint(0x44aa44);
  }
}

/**
 * 诅咒视觉效果
 */
export class HexVisualStrategy implements ProjectileVisualStrategy {
  apply(context: ProjectileVisualContext): void {
    const { projectile, scene } = context;
    projectile.setScale(0.8);
    projectile.setTint(0x8800ff);
    scene.tweens.add({
      targets: projectile,
      alpha: 0.6,
      duration: 100,
      yoyo: true,
      repeat: -1,
    });
  }
}

/**
 * 闪电箭视觉效果
 */
export class LightningBoltVisualStrategy implements ProjectileVisualStrategy {
  apply(context: ProjectileVisualContext): void {
    const { projectile } = context;
    projectile.setTint(0xffff00);
  }
}

/**
 * 暗影箭视觉效果
 */
export class ShadowBoltVisualStrategy implements ProjectileVisualStrategy {
  apply(context: ProjectileVisualContext): void {
    const { projectile } = context;
    projectile.setTint(0x6600aa);
  }
}

/**
 * 冰刺视觉效果
 */
export class IceShardVisualStrategy implements ProjectileVisualStrategy {
  apply(context: ProjectileVisualContext): void {
    const { projectile } = context;
    projectile.setTint(0x88ddff);
  }
}

/**
 * 水弹视觉效果
 */
export class WaterBulletVisualStrategy implements ProjectileVisualStrategy {
  apply(context: ProjectileVisualContext): void {
    const { projectile } = context;
    projectile.setTint(0x66aaff);
    projectile.setAlpha(0.8);
  }
}

/**
 * 藤蔓鞭视觉效果
 */
export class VineWhipVisualStrategy implements ProjectileVisualStrategy {
  apply(context: ProjectileVisualContext): void {
    const { projectile } = context;
    projectile.setScale(1.3, 0.7);
    projectile.setTint(0x44ff44);
  }
}

/**
 * 初始化投射物视觉策略
 */
export function initializeProjectileVisualStrategies(): void {
  projectileVisualRegistry.register('ignite', new IgniteVisualStrategy());
  projectileVisualRegistry.register('arc_lightning', new ArcLightningVisualStrategy());
  projectileVisualRegistry.register('seed_bomb', new SeedBombVisualStrategy());
  projectileVisualRegistry.register('hex', new HexVisualStrategy());
  projectileVisualRegistry.register('lightning_bolt', new LightningBoltVisualStrategy());
  projectileVisualRegistry.register('shadow_bolt', new ShadowBoltVisualStrategy());
  projectileVisualRegistry.register('ice_shard', new IceShardVisualStrategy());
  projectileVisualRegistry.register('water_bullet', new WaterBulletVisualStrategy());
  projectileVisualRegistry.register('vine_whip', new VineWhipVisualStrategy());
}
