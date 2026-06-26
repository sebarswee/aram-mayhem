import { SynergyEffectStrategy, SynergyExecutionContext } from './SynergyStrategyRegistry';
import { SynergyResult } from '@/types';
import { Enemy } from '@/entities/Enemy';
import Phaser from 'phaser';

/**
 * 爆炸策略 - 范围爆炸伤害
 */
export class ExplosionStrategy implements SynergyEffectStrategy {
  execute(synergy: SynergyResult, enemy: Enemy, context: SynergyExecutionContext): void {
    const explosionRadius = 120;
    const explosionBaseDamage = Math.floor(context.baseDamage * (synergy.value || 1.0));
    const explosionEnemies = context.findEnemiesInRange(enemy.x, enemy.y, explosionRadius);

    for (const target of explosionEnemies) {
      const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, target.x, target.y);
      const falloff = 1 - (distance / explosionRadius) * 0.5;
      target.takeDamage(Math.floor(explosionBaseDamage * falloff), context.skillElement);
    }

    // 视觉爆炸效果
    this.createExplosionVisual(context.scene, enemy.x, enemy.y, explosionRadius);
  }

  private createExplosionVisual(scene: Phaser.Scene, x: number, y: number, radius: number): void {
    const explosion = scene.add.circle(x, y, radius * 0.5, 0xff6600, 0.8);
    explosion.setDepth(100);

    const shockwave = scene.add.circle(x, y, radius * 0.3, 0xffff00, 0.6);
    shockwave.setDepth(99);

    scene.tweens.add({
      targets: [explosion, shockwave],
      scaleX: 2.5,
      scaleY: 2.5,
      alpha: 0,
      duration: 350,
      onComplete: () => {
        explosion.destroy();
        shockwave.destroy();
      },
    });
  }
}

/**
 * 连锁增强策略 - 连锁闪电
 */
export class ChainBoostStrategy implements SynergyEffectStrategy {
  execute(synergy: SynergyResult, enemy: Enemy, context: SynergyExecutionContext): void {
    const chainBoostDamage = Math.floor(context.baseDamage * (synergy.value || 1.5));
    enemy.takeDamage(chainBoostDamage, context.skillElement);
    // 连锁到附近敌人（简化实现）
    this.triggerChainLightning(context, enemy.x, enemy.y, chainBoostDamage * 0.8, 3, 150);
  }

  private triggerChainLightning(
    context: SynergyExecutionContext,
    x: number,
    y: number,
    damage: number,
    maxChains: number,
    range: number
  ): void {
    const hitTargets = new Set<string>();
    let currentX = x;
    let currentY = y;
    let currentDamage = damage;
    let chainsRemaining = maxChains;

    while (chainsRemaining > 0) {
      const nearbyEnemies = context.findEnemiesInRange(currentX, currentY, range);
      const nextTarget = nearbyEnemies.find((e: Enemy) => !hitTargets.has(e.instanceId));

      if (!nextTarget) break;

      hitTargets.add(nextTarget.instanceId);

      // 创建闪电视觉
      this.createChainBolt(context.scene, currentX, currentY, nextTarget.x, nextTarget.y);

      nextTarget.takeDamage(Math.floor(currentDamage), context.skillElement);
      currentDamage *= 0.8;

      currentX = nextTarget.x;
      currentY = nextTarget.y;
      chainsRemaining--;
    }
  }

  private createChainBolt(scene: Phaser.Scene, x1: number, y1: number, x2: number, y2: number): void {
    const graphics = scene.add.graphics();
    graphics.setDepth(100);
    graphics.lineStyle(3, 0xffff00, 1);
    graphics.lineBetween(x1, y1, x2, y2);

    scene.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: 180,
      onComplete: () => graphics.destroy(),
    });
  }
}

/**
 * 生命偷取策略
 */
export class LifestealStrategy implements SynergyEffectStrategy {
  execute(synergy: SynergyResult, _enemy: Enemy, context: SynergyExecutionContext): void {
    const healAmount = Math.floor(context.baseDamage * (synergy.value || 0.3));
    context.player.heal(healAmount);
  }
}

/**
 * 伤害转护盾策略
 */
export class DamageToShieldStrategy implements SynergyEffectStrategy {
  execute(synergy: SynergyResult, _enemy: Enemy, context: SynergyExecutionContext): void {
    const shieldValue = Math.floor(context.baseDamage * (synergy.value || 0.5));
    context.player.addShield(shieldValue);
  }
}

/**
 * 护盾策略
 */
export class BarrierStrategy implements SynergyEffectStrategy {
  execute(synergy: SynergyResult, _enemy: Enemy, context: SynergyExecutionContext): void {
    context.player.addShield(50);
    // 视觉护盾效果
    const barrier = context.scene.add.circle(context.player.x, context.player.y, 40, 0x66aaff, 0.3);
    barrier.setStrokeStyle(2, 0x66aaff, 0.8);
    barrier.setDepth(48);
    context.scene.tweens.add({
      targets: barrier,
      alpha: 0,
      scale: 1.5,
      duration: synergy.duration || 3000,
      onComplete: () => barrier.destroy(),
    });
  }
}

/**
 * 治疗区域策略
 */
export class HealZoneStrategy implements SynergyEffectStrategy {
  execute(synergy: SynergyResult, enemy: Enemy, context: SynergyExecutionContext): void {
    this.createHealZone(context, enemy.x, enemy.y, 100, synergy.value || 5, synergy.duration || 5000);
  }

  private createHealZone(
    context: SynergyExecutionContext,
    x: number,
    y: number,
    radius: number,
    healPerTick: number,
    duration: number
  ): void {
    const healZone = context.scene.add.circle(x, y, radius, 0x44ff44, 0.3);
    healZone.setDepth(25);
    healZone.setStrokeStyle(2, 0x44ff44, 0.6);

    const tickInterval = 500;
    let elapsed = 0;

    const healTimer = context.scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          healTimer.destroy();
          healZone.destroy();
          return;
        }

        const distance = Phaser.Math.Distance.Between(context.player.x, context.player.y, x, y);
        if (distance <= radius) {
          context.player.heal(healPerTick);
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }
}

/**
 * 冷却刷新策略
 */
export class CooldownRefreshStrategy implements SynergyEffectStrategy {
  execute(_synergy: SynergyResult, _enemy: Enemy, context: SynergyExecutionContext): void {
    context.player.skillCooldowns.forEach((cooldown: number, skillId: string) => {
      context.player.skillCooldowns.set(skillId, Math.floor(cooldown * 0.5));
    });
  }
}