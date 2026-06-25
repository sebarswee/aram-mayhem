import { SkillStrategy, VisualEffectStrategy, SkillExecutionContext } from '../../../SkillStrategy';
import { Skill } from '@/types';
import Phaser from 'phaser';

/**
 * 冰晶爆发策略 - 8个冰晶向四周射出
 * 从玩家位置发射8个冰晶，穿透路径上的敌人
 */
export class FrostNovaStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const crystalCount = 8;
    const range = skill.rangeValue;
    const angleStep = (Math.PI * 2) / crystalCount;
    const hitEnemies = new Set<string>();

    for (let i = 0; i < crystalCount; i++) {
      const angle = angleStep * i;
      const crystal = scene.add.graphics();
      crystal.fillStyle(0x88ddff, 0.9);
      crystal.fillTriangle(0, -15, -8, 8, 8, 8);
      crystal.setPosition(player.x, player.y);
      crystal.setRotation(angle);
      crystal.setDepth(40);

      scene.tweens.add({
        targets: crystal,
        x: player.x + Math.cos(angle) * range,
        y: player.y + Math.sin(angle) * range,
        alpha: 0.5,
        duration: 400,
        onUpdate: () => {
          const enemies = findEnemiesInRange(crystal.x, crystal.y, 20);
          for (const enemy of enemies) {
            if (!hitEnemies.has(enemy.instanceId)) {
              hitEnemies.add(enemy.instanceId);
              applyDamageToEnemy(enemy, damage, skill);
            }
          }
        },
        onComplete: () => crystal.destroy(),
      });
    }
  }
}

/**
 * 冰晶爆发视觉效果策略
 */
export class FrostNovaVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    const crystalCount = 8;
    const angleStep = (Math.PI * 2) / crystalCount;

    for (let i = 0; i < crystalCount; i++) {
      const angle = angleStep * i;
      const crystal = scene.add.graphics();
      crystal.fillStyle(0x88ddff, 0.9);
      crystal.fillTriangle(0, -15, -8, 8, 8, 8);
      crystal.setPosition(x, y);
      crystal.setRotation(angle);
      crystal.setDepth(40);

      scene.tweens.add({
        targets: crystal,
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius,
        alpha: 0,
        duration: 400,
        onComplete: () => crystal.destroy(),
      });
    }
  }
}