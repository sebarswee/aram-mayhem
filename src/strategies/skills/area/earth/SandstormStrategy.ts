import { SkillStrategy, VisualEffectStrategy, SkillExecutionContext } from '../../../SkillStrategy';
import { Skill } from '@/types';
import { Enemy } from '@/entities/Enemy';
import Phaser from 'phaser';

/**
 * 流沙陷阱策略 - 持续陷阱
 * 在玩家位置创建持续4秒的流沙区域，减速并造成伤害
 */
export class SandstormStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const radius = skill.rangeValue;
    const duration = 4000;
    const tickInterval = 400;

    const quicksand = scene.add.circle(player.x, player.y, radius, 0x886633, 0.4);
    quicksand.setDepth(20);

    // 旋转动画
    scene.tweens.add({
      targets: quicksand,
      angle: 360,
      duration: 2000,
      repeat: 2,
    });

    let elapsed = 0;
    const trapTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          trapTimer.destroy();
          quicksand.destroy();
          return;
        }

        const enemies = findEnemiesInRange(player.x, player.y, radius);
        for (const enemy of enemies) {
          applyDamageToEnemy(enemy, damage, skill);
          enemy.addStatusEffect({
            type: 'slow',
            value: 0.5,
            duration: 500,
            remainingTime: 500,
            source: 'quicksand',
          });
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }
}

/**
 * 流沙陷阱视觉效果策略
 */
export class SandstormVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    const quicksand = scene.add.circle(x, y, radius, 0x886633, 0.4);
    quicksand.setDepth(20);

    scene.tweens.add({
      targets: quicksand,
      angle: 360,
      duration: 2000,
      repeat: 2,
    });

    scene.time.delayedCall(4000, () => quicksand.destroy());
  }
}

/**
 * 地裂线策略 - 直线地裂
 * 向指定方向裂开地面，击飞路径上敌人
 */
export class SeismicWaveStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const range = skill.rangeValue;
    const lineWidth = 60;
    const hitEnemies = new Set<string>();

    // 找最近敌人确定方向
    const enemies = findEnemiesInRange(player.x, player.y, range + 100);
    if (enemies.length === 0) return;

    let nearestEnemy: Enemy | null = null;
    let minDist = Infinity;
    for (const enemy of enemies) {
      const dist = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
      if (dist < minDist) {
        minDist = dist;
        nearestEnemy = enemy;
      }
    }
    if (!nearestEnemy) return;

    const angle = Phaser.Math.Angle.Between(player.x, player.y, nearestEnemy.x, nearestEnemy.y);

    // 地裂视觉
    const crack = scene.add.graphics();
    crack.fillStyle(0x664422, 0.8);
    crack.fillRect(0, -lineWidth / 2, range, lineWidth);
    crack.setPosition(player.x, player.y);
    crack.setRotation(angle);
    crack.setDepth(25);

    crack.setScale(0, 1);
    scene.tweens.add({
      targets: crack,
      scaleX: 1,
      duration: 300,
      onUpdate: () => {
        const enemiesInRange = findEnemiesInRange(player.x, player.y, range);
        for (const enemy of enemiesInRange) {
          if (hitEnemies.has(enemy.instanceId)) continue;
          const enemyAngle = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
          const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(enemyAngle - angle));
          if (angleDiff < 0.3) {
            hitEnemies.add(enemy.instanceId);
            applyDamageToEnemy(enemy, damage, skill);
            // 击飞
            if (enemy.active && enemy.body) {
              enemy.x += Math.cos(angle) * 50;
              enemy.y += Math.sin(angle) * 50;
            }
          }
        }
      },
      onComplete: () => {
        scene.tweens.add({
          targets: crack,
          alpha: 0,
          duration: 200,
          onComplete: () => crack.destroy(),
        });
      },
    });
  }
}

/**
 * 地裂线视觉效果策略
 */
export class SeismicWaveVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    const crack = scene.add.graphics();
    crack.fillStyle(0x664422, 0.8);
    crack.fillRect(0, -30, radius, 60);
    crack.setPosition(x, y);
    crack.setDepth(25);

    crack.setScale(0, 1);
    scene.tweens.add({
      targets: crack,
      scaleX: 1,
      duration: 300,
      onComplete: () => {
        scene.tweens.add({
          targets: crack,
          alpha: 0,
          duration: 200,
          onComplete: () => crack.destroy(),
        });
      },
    });
  }
}