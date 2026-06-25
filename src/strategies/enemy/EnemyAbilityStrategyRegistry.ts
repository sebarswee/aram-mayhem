import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { Enemy } from '@/entities/Enemy';
import { EnemyProjectile, EnemyProjectileConfig } from '@/entities/EnemyProjectile';
import { EnemyAbility } from '@/types';
import { ELEMENT_COLORS } from '@/data/elements';

/**
 * 敌人能力执行上下文
 */
export interface EnemyAbilityContext {
  scene: Phaser.Scene;
  player: Player;
  enemy: Enemy;
  projectileGroup: Phaser.Physics.Arcade.Group;
}

/**
 * 敌人能力策略接口
 */
export interface EnemyAbilityStrategy {
  /**
   * 检查能力是否可以执行（条件判断）
   */
  checkConditions(context: EnemyAbilityContext): boolean;

  /**
   * 执行能力
   */
  execute(context: EnemyAbilityContext, params: Record<string, any>): void;

  /**
   * 获取警告延迟时间
   */
  getWarningDelay(): number;

  /**
   * 显示警告效果
   */
  showWarning(context: EnemyAbilityContext): void;
}

/**
 * 敌人能力策略注册表
 */
export class EnemyAbilityStrategyRegistry {
  private static instance: EnemyAbilityStrategyRegistry;
  private strategies: Map<string, EnemyAbilityStrategy> = new Map();

  private constructor() {}

  static getInstance(): EnemyAbilityStrategyRegistry {
    if (!EnemyAbilityStrategyRegistry.instance) {
      EnemyAbilityStrategyRegistry.instance = new EnemyAbilityStrategyRegistry();
    }
    return EnemyAbilityStrategyRegistry.instance;
  }

  /**
   * 注册能力策略
   */
  register(type: string, strategy: EnemyAbilityStrategy): void {
    this.strategies.set(type, strategy);
  }

  /**
   * 获取能力策略
   */
  get(type: string): EnemyAbilityStrategy | undefined {
    return this.strategies.get(type);
  }

  /**
   * 检查是否已注册
   */
  hasStrategy(type: string): boolean {
    return this.strategies.has(type);
  }
}

export const enemyAbilityStrategyRegistry = EnemyAbilityStrategyRegistry.getInstance();

// ==================== 具体策略实现 ====================

/**
 * 冲锋策略 - 冲向玩家
 */
export class ChargeAbilityStrategy implements EnemyAbilityStrategy {
  getWarningDelay(): number {
    return 500;
  }

  checkConditions(context: EnemyAbilityContext): boolean {
    const { player, enemy } = context;
    const distanceToPlayer = Phaser.Math.Distance.Between(
      enemy.x, enemy.y, player.x, player.y
    );
    return distanceToPlayer > 100 && distanceToPlayer < 400;
  }

  showWarning(context: EnemyAbilityContext): void {
    const { scene, player, enemy } = context;
    const line = scene.add.graphics();
    line.lineStyle(4, 0xff4444, 0.6);
    line.lineBetween(enemy.x, enemy.y, player.x, player.y);
    scene.tweens.add({
      targets: line,
      alpha: 0,
      duration: 500,
      onComplete: () => line.destroy(),
    });
  }

  execute(context: EnemyAbilityContext, params: Record<string, any>): void {
    const { scene, player, enemy } = context;
    const speed = params.speed || 400;
    const duration = params.duration || 800;

    const angle = Phaser.Math.Angle.Between(
      enemy.x, enemy.y, player.x, player.y
    );

    const originalSpeed = enemy.config.speed;
    enemy.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    // 冲锋轨迹
    const trailTimer = scene.time.addEvent({
      delay: 50,
      callback: () => {
        if (!enemy.active) {
          trailTimer.destroy();
          return;
        }
        const trail = scene.add.circle(enemy.x, enemy.y, 15, 0xff4400, 0.4);
        trail.setDepth(29);
        scene.tweens.add({
          targets: trail,
          alpha: 0,
          scale: 0.5,
          duration: 150,
          onComplete: () => trail.destroy(),
        });
      },
      repeat: Math.floor(duration / 50) - 1,
    });

    scene.time.delayedCall(duration, () => {
      if (enemy.active) {
        enemy.setVelocity(0, 0);
        enemy.setTarget(player);
      }
    });
  }
}

/**
 * 射击策略 - 发射投射物
 */
export class ShootAbilityStrategy implements EnemyAbilityStrategy {
  getWarningDelay(): number {
    return 200;
  }

  checkConditions(context: EnemyAbilityContext): boolean {
    const { player, enemy } = context;
    const distanceToPlayer = Phaser.Math.Distance.Between(
      enemy.x, enemy.y, player.x, player.y
    );
    return distanceToPlayer < 500;
  }

  showWarning(context: EnemyAbilityContext): void {
    const { scene, enemy } = context;
    const glow = scene.add.circle(enemy.x, enemy.y, 25, 0xffff00, 0.5);
    glow.setDepth(31);
    scene.tweens.add({
      targets: glow,
      scale: 1.5,
      alpha: 0,
      duration: 200,
      onComplete: () => glow.destroy(),
    });
  }

  execute(context: EnemyAbilityContext, params: Record<string, any>): void {
    const { scene, player, enemy, projectileGroup } = context;
    const damage = params.damage || 15;
    const speed = params.speed || 200;
    const range = params.range || 400;
    const count = params.count || 1;
    const effect = params.effect;
    const effectValue = params.effectValue;
    const effectDuration = params.effectDuration;

    const elementColor = ELEMENT_COLORS[enemy.element] || 0xffffff;

    for (let i = 0; i < count; i++) {
      let targetX = player.x;
      let targetY = player.y;

      if (count > 1) {
        const spreadAngle = ((i - (count - 1) / 2) / count) * Math.PI * 0.3;
        const baseAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, targetX, targetY);
        targetX = enemy.x + Math.cos(baseAngle + spreadAngle) * 300;
        targetY = enemy.y + Math.sin(baseAngle + spreadAngle) * 300;
      }

      const config: EnemyProjectileConfig = {
        damage,
        speed,
        range,
        color: elementColor,
        effect,
        effectValue,
        effectDuration,
        element: enemy.element,
      };

      const projectile = new EnemyProjectile(scene, enemy.x, enemy.y, config);
      projectileGroup.add(projectile);
      projectile.fire(targetX, targetY);

      // 枪口闪光
      const flash = scene.add.circle(enemy.x, enemy.y, 20, elementColor, 0.7);
      flash.setDepth(41);
      scene.tweens.add({
        targets: flash,
        alpha: 0,
        scale: 0.5,
        duration: 100,
        onComplete: () => flash.destroy(),
      });
    }
  }
}

/**
 * 召唤策略 - 召唤小怪
 */
export class SummonAbilityStrategy implements EnemyAbilityStrategy {
  getWarningDelay(): number {
    return 300;
  }

  checkConditions(context: EnemyAbilityContext): boolean {
    const { player, enemy } = context;
    const distanceToPlayer = Phaser.Math.Distance.Between(
      enemy.x, enemy.y, player.x, player.y
    );
    return distanceToPlayer > 200;
  }

  showWarning(context: EnemyAbilityContext): void {
    const { scene, enemy } = context;
    const ring = scene.add.circle(enemy.x, enemy.y, 60, 0x8800ff, 0.4);
    ring.setStrokeStyle(3, 0x8800ff, 0.8);
    ring.setDepth(31);
    scene.tweens.add({
      targets: ring,
      scale: 1.2,
      alpha: 0,
      duration: 300,
      onComplete: () => ring.destroy(),
    });
  }

  execute(context: EnemyAbilityContext, params: Record<string, any>): void {
    const { scene, enemy } = context;
    const count = params.count || 2;
    const type = params.type || 'normal';

    scene.events.emit('enemySummon', {
      x: enemy.x,
      y: enemy.y,
      count,
      type,
      element: enemy.element,
    });

    // 召唤视觉效果
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const spawnX = enemy.x + Math.cos(angle) * 60;
      const spawnY = enemy.y + Math.sin(angle) * 60;

      const portal = scene.add.circle(spawnX, spawnY, 25, 0x8800ff, 0.5);
      portal.setDepth(31);
      portal.setStrokeStyle(2, 0xaa00ff, 0.8);

      scene.tweens.add({
        targets: portal,
        scale: 1.5,
        alpha: 0,
        duration: 400,
        onComplete: () => portal.destroy(),
      });
    }
  }
}

/**
 * 护盾策略 - 生成护盾
 */
export class ShieldAbilityStrategy implements EnemyAbilityStrategy {
  getWarningDelay(): number {
    return 100;
  }

  checkConditions(context: EnemyAbilityContext): boolean {
    const { enemy } = context;
    return enemy.getHpPercentage() < 50;
  }

  showWarning(_context: EnemyAbilityContext): void {
    // 护盾不需要警告
  }

  execute(context: EnemyAbilityContext, params: Record<string, any>): void {
    const { scene, enemy } = context;
    const value = params.value || 50;
    const duration = params.duration || 5000;

    enemy.addShield(value);

    const shield = scene.add.circle(enemy.x, enemy.y, 40, 0x4488ff, 0.4);
    shield.setStrokeStyle(3, 0x4488ff, 0.8);
    shield.setDepth(31);

    const followEvent = scene.time.addEvent({
      delay: 50,
      callback: () => {
        if (!enemy.active || !enemy.hasShield()) {
          followEvent.destroy();
          shield.destroy();
          return;
        }
        shield.setPosition(enemy.x, enemy.y);
      },
      repeat: -1,
    });

    scene.time.delayedCall(duration, () => {
      followEvent.destroy();
      scene.tweens.add({
        targets: shield,
        alpha: 0,
        duration: 300,
        onComplete: () => shield.destroy(),
      });
    });
  }
}

/**
 * 治疗策略 - 恢复生命
 */
export class HealAbilityStrategy implements EnemyAbilityStrategy {
  getWarningDelay(): number {
    return 100;
  }

  checkConditions(context: EnemyAbilityContext): boolean {
    const { enemy } = context;
    return enemy.getHpPercentage() < 30;
  }

  showWarning(_context: EnemyAbilityContext): void {
    // 治疗不需要警告
  }

  execute(context: EnemyAbilityContext, params: Record<string, any>): void {
    const { enemy } = context;
    const value = params.value || 100;
    enemy.heal(value);
  }
}

/**
 * 狂暴策略 - 进入狂暴状态
 */
export class RageAbilityStrategy implements EnemyAbilityStrategy {
  getWarningDelay(): number {
    return 400;
  }

  checkConditions(context: EnemyAbilityContext): boolean {
    const { enemy } = context;
    return enemy.getHpPercentage() < 20 && !enemy.isEnraged;
  }

  showWarning(context: EnemyAbilityContext): void {
    const { scene, enemy } = context;
    enemy.setTint(0xff0000);
    scene.time.delayedCall(400, () => {
      if (enemy.active) {
        enemy.applyElementTint();
      }
    });
  }

  execute(context: EnemyAbilityContext, params: Record<string, any>): void {
    const { enemy } = context;
    enemy.activateRage(params);
  }
}

/**
 * 初始化敌人能力策略
 */
export function initializeEnemyAbilityStrategies(): void {
  enemyAbilityStrategyRegistry.register('charge', new ChargeAbilityStrategy());
  enemyAbilityStrategyRegistry.register('shoot', new ShootAbilityStrategy());
  enemyAbilityStrategyRegistry.register('summon', new SummonAbilityStrategy());
  enemyAbilityStrategyRegistry.register('shield', new ShieldAbilityStrategy());
  enemyAbilityStrategyRegistry.register('heal', new HealAbilityStrategy());
  enemyAbilityStrategyRegistry.register('rage', new RageAbilityStrategy());
}
