import { SkillStrategy, VisualEffectStrategy, SkillExecutionContext } from '../../../SkillStrategy';
import { Skill } from '@/types';
import { Enemy } from '@/entities/Enemy';
import Phaser from 'phaser';

/**
 * 雷击阵策略 - 定点雷击
 * 在范围内标记3个敌人位置，延迟0.5秒后依次雷击
 */
export class ThunderStormStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const strikeCount = 3;
    const range = skill.rangeValue;
    const enemies = findEnemiesInRange(player.x, player.y, range);
    const targets = enemies.slice(0, strikeCount);

    targets.forEach((enemy: Enemy, index: number) => {
      // 预警圆圈
      const warning = scene.add.circle(enemy.x, enemy.y, 30, 0xffff00, 0.3);
      warning.setDepth(20);

      // 延迟雷击
      scene.time.delayedCall(500 + index * 200, () => {
        warning.destroy();

        // 闪电光束
        const lightning = scene.add.graphics();
        lightning.lineStyle(4, 0xffff00, 1);
        lightning.lineBetween(enemy.x, enemy.y - 100, enemy.x, enemy.y);
        lightning.setDepth(100);

        // 闪光
        const flash = scene.add.circle(enemy.x, enemy.y, 40, 0xffffff, 0.9);
        flash.setDepth(101);

        // 如果敌人还在活跃，造成伤害
        if (enemy.active) {
          applyDamageToEnemy(enemy, damage, skill);
        }

        // 消失动画
        scene.tweens.add({
          targets: [lightning, flash],
          alpha: 0,
          duration: 150,
          onComplete: () => {
            lightning.destroy();
            flash.destroy();
          },
        });
      });
    });
  }
}

/**
 * 雷击阵视觉效果策略
 */
export class ThunderStormVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 预警区域
    const warning = scene.add.circle(x, y, radius, 0xffff00, 0.2);
    warning.setDepth(20);

    scene.tweens.add({
      targets: warning,
      alpha: 0.4,
      duration: 200,
      yoyo: true,
      repeat: 2,
      onComplete: () => warning.destroy(),
    });
  }
}