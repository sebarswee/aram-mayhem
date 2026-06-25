import { SkillStrategy, VisualEffectStrategy, SkillExecutionContext } from '../../../SkillStrategy';
import { Skill } from '@/types';
import { Enemy } from '@/entities/Enemy';
import Phaser from 'phaser';

/**
 * 水波推进策略 - 方向性波浪
 * 向指定方向释放水波，击退路径上敌人
 */
export class TidalWaveStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const range = skill.rangeValue;
    const waveSpeed = 300;
    const waveWidth = 60;

    // 找最近敌人作为目标方向
    const enemies = findEnemiesInRange(player.x, player.y, range + 100);
    if (enemies.length === 0) return;

    // 找最近的敌人
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

    // 水波视觉
    const wave = scene.add.graphics();
    wave.fillStyle(0x4488ff, 0.6);
    wave.fillRect(-waveWidth / 2, 0, waveWidth, 50);
    wave.setPosition(player.x, player.y);
    wave.setRotation(angle);
    wave.setDepth(25);

    let distance = 0;
    const hitEnemies = new Set<string>();

    const waveTimer = scene.time.addEvent({
      delay: 50,
      callback: () => {
        distance += waveSpeed * 0.05;
        if (distance >= range) {
          waveTimer.destroy();
          wave.destroy();
          return;
        }

        const cx = player.x + Math.cos(angle) * distance;
        const cy = player.y + Math.sin(angle) * distance;
        wave.setPosition(cx, cy);

        const enemiesInRange = findEnemiesInRange(cx, cy, waveWidth);
        for (const enemy of enemiesInRange) {
          if (!hitEnemies.has(enemy.instanceId)) {
            hitEnemies.add(enemy.instanceId);
            applyDamageToEnemy(enemy, damage, skill);
            // 击退
            if (enemy.active && enemy.body) {
              enemy.x += Math.cos(angle) * 30;
              enemy.y += Math.sin(angle) * 30;
            }
          }
        }
      },
      repeat: Math.ceil(range / (waveSpeed * 0.05)),
    });
  }
}

/**
 * 水波推进视觉效果策略
 */
export class TidalWaveVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    const wave = scene.add.graphics();
    wave.fillStyle(0x4488ff, 0.5);
    wave.fillEllipse(x + radius / 2, y, 60, 40);
    wave.setDepth(25);

    scene.tweens.add({
      targets: wave,
      x: radius,
      alpha: 0,
      duration: 400,
      onComplete: () => wave.destroy(),
    });
  }
}