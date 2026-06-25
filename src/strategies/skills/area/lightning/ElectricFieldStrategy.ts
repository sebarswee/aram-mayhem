import { SkillStrategy, VisualEffectStrategy, SkillExecutionContext } from '../../../SkillStrategy';
import { Skill } from '@/types';
import { Enemy } from '@/entities/Enemy';
import Phaser from 'phaser';

/**
 * 电场策略 - 区域持续麻痹
 * 在玩家位置创建电场，区域内敌人每0.5秒麻痹并受到低额伤害
 */
export class ElectricFieldStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, applyEffects } = context;
    const range = skill.rangeValue;
    const duration = 3000; // 默认3秒
    const tickInterval = 500; // 默认0.5秒

    // 电场中心位置
    const fieldX = player.x;
    const fieldY = player.y;

    // 创建电场视觉效果
    const field = scene.add.container(fieldX, fieldY);
    field.setDepth(15);

    // 电场底层（半透明圆）
    const fieldBase = scene.add.circle(0, 0, range, 0xffff00, 0.2);
    fieldBase.setStrokeStyle(2, 0xffff00, 0.6);
    field.add(fieldBase);

    // 电场脉冲环
    const pulseRing = scene.add.circle(0, 0, range * 0.5, 0xffff00, 0);
    pulseRing.setStrokeStyle(3, 0xffffff, 0.8);
    field.add(pulseRing);

    // 电弧粒子效果
    const arcs: Phaser.GameObjects.Graphics[] = [];

    // 持续脉冲动画
    scene.tweens.add({
      targets: pulseRing,
      scale: 1.2,
      alpha: 0.5,
      duration: tickInterval / 2,
      yoyo: true,
      repeat: -1,
    });

    // 跟踪敌人并造成效果
    const hitEnemies = new Set<string>();

    const tickTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        // 清除上一tick的命中记录（允许重复麻痹）
        hitEnemies.clear();

        // 查找电场内的敌人
        const enemies = findEnemiesInRange(fieldX, fieldY, range);

        for (const enemy of enemies) {
          if (!enemy.active) continue;
          if (hitEnemies.has(enemy.instanceId)) continue;

          hitEnemies.add(enemy.instanceId);

          // 造成伤害
          applyDamageToEnemy(enemy, damage, skill);

          // 应用麻痹效果
          applyEffects(enemy, skill.effects);

          // 显示电击特效
          const spark = scene.add.circle(enemy.x, enemy.y, 15, 0xffff00, 0.7);
          spark.setDepth(100);

          scene.tweens.add({
            targets: spark,
            alpha: 0,
            scale: 1.5,
            duration: 150,
            onComplete: () => spark.destroy(),
          });
        }

        // 随机电弧效果
        if (enemies.length > 0) {
          const arc = scene.add.graphics();
          arc.lineStyle(2, 0xffff00, 0.6);
          arc.setDepth(50);

          // 从电场中心到随机敌人的电弧
          const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];
          if (randomEnemy) {
            arc.lineBetween(fieldX, fieldY, randomEnemy.x, randomEnemy.y);
            arcs.push(arc);

            // 电弧消失
            scene.time.delayedCall(100, () => {
              arc.destroy();
              const idx = arcs.indexOf(arc);
              if (idx > -1) arcs.splice(idx, 1);
            });
          }
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });

    // 电场边界闪烁效果
    const borderFlash = scene.tweens.add({
      targets: fieldBase,
      alpha: 0.3,
      duration: 200,
      yoyo: true,
      repeat: -1,
    });

    // 电场结束时清理
    scene.time.delayedCall(duration, () => {
      tickTimer.destroy();
      borderFlash.stop();

      // 消失动画
      scene.tweens.add({
        targets: field,
        alpha: 0,
        scale: 1.2,
        duration: 300,
        onComplete: () => {
          field.destroy();
          arcs.forEach(arc => arc.destroy());
        },
      });
    });
  }
}

/**
 * 电场视觉效果策略
 */
export class ElectricFieldVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    const field = scene.add.container(x, y);
    field.setDepth(15);

    const fieldBase = scene.add.circle(0, 0, radius, 0xffff00, 0.2);
    fieldBase.setStrokeStyle(2, 0xffff00, 0.6);
    field.add(fieldBase);

    const pulseRing = scene.add.circle(0, 0, radius * 0.5, 0xffff00, 0);
    pulseRing.setStrokeStyle(3, 0xffffff, 0.8);
    field.add(pulseRing);

    scene.tweens.add({
      targets: pulseRing,
      scale: 1.2,
      alpha: 0.5,
      duration: 250,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        scene.tweens.add({
          targets: field,
          alpha: 0,
          scale: 1.2,
          duration: 300,
          onComplete: () => field.destroy(),
        });
      },
    });
  }
}
