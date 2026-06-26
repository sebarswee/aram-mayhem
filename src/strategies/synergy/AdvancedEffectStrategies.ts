import { SynergyEffectStrategy, SynergyExecutionContext } from './SynergyStrategyRegistry';
import { SynergyResult } from '@/types';
import { Enemy } from '@/entities/Enemy';
import Phaser from 'phaser';

/**
 * 燃烧传播策略
 */
export class BurnSpreadStrategy implements SynergyEffectStrategy {
  execute(_synergy: SynergyResult, enemy: Enemy, context: SynergyExecutionContext): void {
    const nearbyEnemies = context.findEnemiesInRange(enemy.x, enemy.y, 100);
    for (const nearby of nearbyEnemies) {
      if (nearby !== enemy) {
        nearby.addStatusEffect({
          type: 'burn',
          value: 5,
          duration: 3000,
          remainingTime: 3000,
          source: 'synergy_burn_spread',
        });
      }
    }
  }
}

/**
 * 熔岩区域策略
 */
export class LavaZoneStrategy implements SynergyEffectStrategy {
  execute(_synergy: SynergyResult, enemy: Enemy, context: SynergyExecutionContext): void {
    this.createLavaZone(context, enemy.x, enemy.y, 100, context.baseDamage * 0.1, 3000);
  }

  private createLavaZone(
    context: SynergyExecutionContext,
    x: number,
    y: number,
    radius: number,
    damagePerTick: number,
    duration: number
  ): void {
    const lava = context.scene.add.circle(x, y, radius, 0xff4400, 0.4);
    lava.setDepth(25);

    const tickInterval = 500;
    let elapsed = 0;

    const damageTimer = context.scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          damageTimer.destroy();
          lava.destroy();
          return;
        }

        const enemies = context.findEnemiesInRange(x, y, radius);
        for (const enemy of enemies) {
          enemy.takeDamage(Math.floor(damagePerTick), context.skillElement);
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }
}

/**
 * 负面效果传播策略
 */
export class SpreadDebuffStrategy implements SynergyEffectStrategy {
  execute(_synergy: SynergyResult, enemy: Enemy, context: SynergyExecutionContext): void {
    const debuffTypes = ['burn', 'poison', 'slow', 'root'];
    const debuffs = enemy.statusEffects.filter(e => debuffTypes.includes(e.type));

    if (debuffs.length === 0) return;

    const nearbyEnemies = context.findEnemiesInRange(enemy.x, enemy.y, 100);
    for (const nearby of nearbyEnemies) {
      if (nearby === enemy) continue;
      for (const debuff of debuffs) {
        nearby.addStatusEffect({
          type: debuff.type,
          value: debuff.value,
          duration: debuff.duration,
          remainingTime: debuff.duration,
          source: 'synergy_spread',
        });
      }
    }
  }
}

/**
 * 清除并伤害策略
 */
export class DispelAndDamageStrategy implements SynergyEffectStrategy {
  execute(_synergy: SynergyResult, enemy: Enemy, context: SynergyExecutionContext): void {
    enemy.statusEffects = [];
    enemy.takeDamage(Math.floor(context.baseDamage * 0.5), context.skillElement);
  }
}

/**
 * 死亡爆炸标记策略
 */
export class DeathExplosionStrategy implements SynergyEffectStrategy {
  execute(_synergy: SynergyResult, enemy: Enemy, context: SynergyExecutionContext): void {
    if (!enemy.deathExplosionParams) {
      enemy.deathExplosionParams = {
        damage: Math.floor(context.baseDamage * 2),
        radius: 100,
      };

      // 视觉指示
      const indicator = context.scene.add.circle(enemy.x, enemy.y, 15, 0xff0000, 0.4);
      indicator.setDepth(31);

      const followEvent = context.scene.time.addEvent({
        delay: 50,
        callback: () => {
          if (!enemy.active) {
            followEvent.destroy();
            indicator.destroy();
            return;
          }
          indicator.setPosition(enemy.x, enemy.y);
        },
        repeat: -1,
      });
    }
  }
}

/**
 * 折射伤害策略
 */
export class RefractDamageStrategy implements SynergyEffectStrategy {
  execute(_synergy: SynergyResult, enemy: Enemy, context: SynergyExecutionContext): void {
    const refractDamage = Math.floor(context.baseDamage * 0.5);
    const refractRadius = 150;
    const refractTargets = context.findEnemiesInRange(enemy.x, enemy.y, refractRadius);
    const refractMaxTargets = 5;
    let refractedCount = 0;

    for (const target of refractTargets) {
      if (target !== enemy && refractedCount < refractMaxTargets) {
        target.takeDamage(refractDamage, context.skillElement);
        // 创建折射光束视觉
        this.createRefractBeam(context.scene, enemy.x, enemy.y, target.x, target.y);
        refractedCount++;
      }
    }
  }

  private createRefractBeam(scene: Phaser.Scene, x1: number, y1: number, x2: number, y2: number): void {
    const graphics = scene.add.graphics();
    graphics.setDepth(100);
    graphics.lineStyle(2, 0x88ffff, 0.8);
    graphics.lineBetween(x1, y1, x2, y2);

    scene.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: 150,
      onComplete: () => graphics.destroy(),
    });
  }
}

/**
 * Tick速度翻倍策略
 */
export class TickSpeedDoubleStrategy implements SynergyEffectStrategy {
  execute(synergy: SynergyResult, enemy: Enemy, context: SynergyExecutionContext): void {
    enemy.addStatusEffect({
      type: 'tick_speed_up',
      value: 2.0,
      duration: synergy.duration || 5000,
      remainingTime: synergy.duration || 5000,
      source: 'synergy_tick_speed_double',
    });

    // 视觉反馈
    const cyanFlash = context.scene.add.circle(enemy.x, enemy.y, 20, 0x00ffff, 0.6);
    cyanFlash.setDepth(100);
    context.scene.tweens.add({
      targets: cyanFlash,
      alpha: 0,
      scale: 1.5,
      duration: 300,
      onComplete: () => cyanFlash.destroy(),
    });
  }
}

/**
 * 分裂投射物策略
 */
export class Split3Strategy implements SynergyEffectStrategy {
  execute(_synergy: SynergyResult, enemy: Enemy, context: SynergyExecutionContext): void {
    this.createSplitProjectilesAt(context, enemy.x, enemy.y, 3, context.baseDamage * 0.3);
  }

  private createSplitProjectilesAt(
    context: SynergyExecutionContext,
    x: number,
    y: number,
    count: number,
    damage: number
  ): void {
    const angleStep = (Math.PI * 2) / count;

    for (let i = 0; i < count; i++) {
      const angle = angleStep * i;
      const proj = context.scene.add.circle(x, y, 6, 0xffff00, 0.8);
      proj.setDepth(40);

      const speed = 200;
      const distance = 100;

      context.scene.tweens.add({
        targets: proj,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        duration: 300,
        onUpdate: () => {
          const enemies = context.findEnemiesInRange(proj.x, proj.y, 20);
          for (const enemy of enemies) {
            enemy.takeDamage(Math.floor(damage), context.skillElement);
          }
        },
        onComplete: () => proj.destroy(),
      });
    }
  }
}

/**
 * 防御降低策略
 */
export class DefenseReduceStrategy implements SynergyEffectStrategy {
  execute(synergy: SynergyResult, enemy: Enemy, context: SynergyExecutionContext): void {
    enemy.addStatusEffect({
      type: 'defense_break',
      value: synergy.value || 0.5,
      duration: synergy.duration || 5000,
      remainingTime: synergy.duration || 5000,
      source: 'synergy_defense_reduce',
    });
    enemy.takeDamage(context.baseDamage, context.skillElement);
  }
}