import { SkillStrategy, VisualEffectStrategy, SkillExecutionContext } from '../../../SkillStrategy';
import { Skill } from '@/types';
import { Enemy } from '@/entities/Enemy';
import Phaser from 'phaser';

/**
 * 诅咒链策略 - 链式传播
 * 诅咒最近敌人并连锁传播到附近敌人
 */
export class CurseAuraStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const maxChains = 4;
    const chainRange = 150;

    // 找起始敌人
    const enemies = findEnemiesInRange(player.x, player.y, skill.rangeValue);
    if (enemies.length === 0) return;

    // 找最近的敌人
    let startEnemy: Enemy | null = null;
    let minDist = Infinity;
    for (const enemy of enemies) {
      const dist = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
      if (dist < minDist) {
        minDist = dist;
        startEnemy = enemy;
      }
    }
    if (!startEnemy) return;

    const hitEnemies = new Set<string>();
    let currentEnemy = startEnemy;
    let chainCount = 0;

    while (currentEnemy && chainCount < maxChains) {
      hitEnemies.add(currentEnemy.instanceId);
      applyDamageToEnemy(currentEnemy, damage, skill);

      // 诅咒视觉效果
      const curseEffect = scene.add.circle(currentEnemy.x, currentEnemy.y, 20, 0x8800ff, 0.5);
      curseEffect.setDepth(100);
      scene.tweens.add({
        targets: curseEffect,
        alpha: 0,
        scale: 1.5,
        duration: 300,
        onComplete: () => curseEffect.destroy(),
      });

      // 找下一个目标
      const nearbyEnemies = findEnemiesInRange(currentEnemy.x, currentEnemy.y, chainRange)
        .filter((e: Enemy) => !hitEnemies.has(e.instanceId));

      if (nearbyEnemies.length > 0) {
        const nextEnemy = nearbyEnemies[0];
        // 链条视觉
        const chain = scene.add.graphics();
        chain.lineStyle(3, 0x8800ff, 0.8);
        chain.lineBetween(currentEnemy.x, currentEnemy.y, nextEnemy.x, nextEnemy.y);
        chain.setDepth(99);
        scene.time.delayedCall(200, () => chain.destroy());

        currentEnemy = nextEnemy;
        chainCount++;
      } else {
        break;
      }
    }
  }
}

/**
 * 诅咒链视觉效果策略
 */
export class CurseAuraVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    const curse = scene.add.circle(x, y, radius, 0x8800ff, 0.4);
    curse.setDepth(20);

    scene.tweens.add({
      targets: curse,
      alpha: 0,
      scale: 1.5,
      duration: 400,
      onComplete: () => curse.destroy(),
    });
  }
}