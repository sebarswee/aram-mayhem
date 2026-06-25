import { SkillStrategy, VisualEffectStrategy, SkillExecutionContext } from '../../../SkillStrategy';
import { Skill } from '@/types';
import { Enemy } from '@/entities/Enemy';
import Phaser from 'phaser';

/**
 * 雷电聚焦策略 - 单体高伤害瞬发
 * 锁定范围内血量最高的敌人，瞬发造成高额伤害并麻痹
 */
export class LightningFocusStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, applyEffects } = context;
    const range = skill.rangeValue;
    const enemies = findEnemiesInRange(player.x, player.y, range);

    if (enemies.length === 0) return;

    // 优先选择血量最高的敌人
    const target = enemies.reduce((highest, enemy) => {
      if (!highest || enemy.currentHp > highest.currentHp) return enemy;
      return highest;
    }, null as Enemy | null);

    if (!target) return;

    // 聚焦蓄力视觉（短暂蓄力）
    const chargeRing = scene.add.circle(player.x, player.y, 20, 0xffff00, 0.5);
    chargeRing.setStrokeStyle(3, 0xffffff, 0.8);
    chargeRing.setDepth(100);

    // 目标标记
    const targetMark = scene.add.circle(target.x, target.y, 30, 0xffff00, 0.3);
    targetMark.setDepth(20);

    // 蓄力动画
    scene.tweens.add({
      targets: chargeRing,
      scale: 1.5,
      alpha: 0.8,
      duration: 150,
      onComplete: () => {
        chargeRing.destroy();

        // 释放聚焦雷电束
        const lightning = scene.add.graphics();
        lightning.lineStyle(6, 0xffff00, 1);
        lightning.lineBetween(player.x, player.y, target.x, target.y);
        lightning.setDepth(100);

        // 聚焦闪光
        const flash = scene.add.circle(target.x, target.y, 50, 0xffffff, 0.9);
        flash.setDepth(101);

        // 电弧分支效果
        const branches: Phaser.GameObjects.Graphics[] = [];
        for (let i = 0; i < 3; i++) {
          const angle = (Math.PI * 2 * i) / 3 + Math.random() * 0.5;
          const branch = scene.add.graphics();
          branch.lineStyle(2, 0xffff00, 0.6);
          const endX = target.x + Math.cos(angle) * 40;
          const endY = target.y + Math.sin(angle) * 40;
          branch.lineBetween(target.x, target.y, endX, endY);
          branch.setDepth(99);
          branches.push(branch);
        }

        // 造成伤害（如果敌人仍活跃）
        if (target.active) {
          applyDamageToEnemy(target, damage, skill);
          applyEffects(target, skill.effects);
        }

        // 消失动画
        scene.tweens.add({
          targets: [lightning, flash, targetMark, ...branches],
          alpha: 0,
          duration: 200,
          onComplete: () => {
            lightning.destroy();
            flash.destroy();
            targetMark.destroy();
            branches.forEach(b => b.destroy());
          },
        });
      },
    });
  }
}

/**
 * 雷电聚焦视觉效果策略
 */
export class LightningFocusVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 预览聚焦效果
    const chargeRing = scene.add.circle(x, y, 20, 0xffff00, 0.5);
    chargeRing.setStrokeStyle(3, 0xffffff, 0.8);
    chargeRing.setDepth(100);

    scene.tweens.add({
      targets: chargeRing,
      scale: 1.5,
      alpha: 0.8,
      duration: 150,
      yoyo: true,
      repeat: 1,
      onComplete: () => chargeRing.destroy(),
    });
  }
}
