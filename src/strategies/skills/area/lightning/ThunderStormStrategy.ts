import { SkillStrategy, VisualEffectStrategy, SkillExecutionContext } from '../../../SkillStrategy';
import { Skill } from '@/types';
import { Enemy } from '@/entities/Enemy';
import { VisualEffectUtils } from '@/graphics/VisualEffectUtils';
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
      // 多层预警圆圈
      const warningOuter = scene.add.circle(enemy.x, enemy.y, 45, 0xffff00, 0.15);
      const warningMid = scene.add.circle(enemy.x, enemy.y, 35, 0xffff00, 0.25);
      const warningInner = scene.add.circle(enemy.x, enemy.y, 25, 0xffff00, 0.35);
      const warningCore = scene.add.circle(enemy.x, enemy.y, 15, 0xffffff, 0.5);
      warningOuter.setDepth(20);
      warningMid.setDepth(21);
      warningInner.setDepth(22);
      warningCore.setDepth(23);

      // 预警脉动
      scene.tweens.add({
        targets: [warningOuter, warningMid, warningInner],
        scale: 1.2,
        alpha: 0.5,
        duration: 200,
        yoyo: true,
        repeat: 2,
      });

      // 延迟雷击
      scene.time.delayedCall(500 + index * 200, () => {
        warningOuter.destroy();
        warningMid.destroy();
        warningInner.destroy();
        warningCore.destroy();

        // 多层闪电光束
        const lightningOuter = scene.add.graphics();
        lightningOuter.lineStyle(12, 0xffff00, 0.4);
        lightningOuter.lineBetween(enemy.x, enemy.y - 120, enemy.x, enemy.y);
        lightningOuter.setDepth(98);

        const lightningMid = scene.add.graphics();
        lightningMid.lineStyle(6, 0xffff00, 0.8);
        lightningMid.lineBetween(enemy.x, enemy.y - 110, enemy.x, enemy.y);
        lightningMid.setDepth(99);

        const lightningCore = scene.add.graphics();
        lightningCore.lineStyle(2, 0xffffff, 1);
        lightningCore.lineBetween(enemy.x, enemy.y - 100, enemy.x, enemy.y);
        lightningCore.setDepth(100);

        // 电弧分支
        const branches: Phaser.GameObjects.Graphics[] = [];
        for (let i = 0; i < 4; i++) {
          const branch = scene.add.graphics();
          branch.lineStyle(2, 0xffff00, 0.6);
          const startY = enemy.y - 40 - i * 20;
          const endX = enemy.x + (Math.random() - 0.5) * 60;
          const endY = startY + 20 + Math.random() * 20;
          branch.lineBetween(enemy.x, startY, endX, endY);
          branch.setDepth(99);
          branches.push(branch);
        }

        // 多层闪光
        const flashOuter = scene.add.circle(enemy.x, enemy.y, 60, 0xffff00, 0.5);
        const flashMid = scene.add.circle(enemy.x, enemy.y, 45, 0xffffff, 0.7);
        const flashInner = scene.add.circle(enemy.x, enemy.y, 30, 0xffffff, 0.9);
        flashOuter.setDepth(101);
        flashMid.setDepth(102);
        flashInner.setDepth(103);

        // 如果敌人还在活跃，造成伤害
        if (enemy.active) {
          applyDamageToEnemy(enemy, damage, skill);
        }

        // 粒子爆发
        VisualEffectUtils.createParticleBurst(scene, enemy.x, enemy.y, {
          count: 20,
          color: 0xffff00,
          speed: { min: 100, max: 250 },
          scale: { start: 0.6, end: 0 },
          lifespan: 300,
          texture: 'particle_lightning_arc',
        });

        // 屏幕震动
        VisualEffectUtils.screenShake(scene, { intensity: 0.005, duration: 100 });

        // 消失动画
        scene.tweens.add({
          targets: [lightningOuter, lightningMid, lightningCore, ...branches],
          alpha: 0,
          duration: 150,
          onComplete: () => {
            lightningOuter.destroy();
            lightningMid.destroy();
            lightningCore.destroy();
            branches.forEach(b => b.destroy());
          },
        });

        scene.tweens.add({
          targets: [flashOuter, flashMid, flashInner],
          alpha: 0,
          scale: 1.5,
          duration: 200,
          onComplete: () => {
            flashOuter.destroy();
            flashMid.destroy();
            flashInner.destroy();
          },
        });
      });
    });
  }
}

/**
 * 雷击阵视觉效果策略 - 增强版
 */
export class ThunderStormVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 多层预警区域
    const warningLayers = [
      { radius: radius * 1.2, alpha: 0.1, depth: 18 },
      { radius: radius, alpha: 0.15, depth: 19 },
      { radius: radius * 0.8, alpha: 0.2, depth: 20 },
    ];

    const warnings: Phaser.GameObjects.Arc[] = [];
    warningLayers.forEach(layer => {
      const warning = scene.add.circle(x, y, layer.radius, 0xffff00, layer.alpha);
      warning.setDepth(layer.depth);
      warnings.push(warning);
    });

    // 预警脉动
    scene.tweens.add({
      targets: warnings,
      scale: 1.1,
      alpha: 0.4,
      duration: 200,
      yoyo: true,
      repeat: 2,
      onComplete: () => warnings.forEach(w => w.destroy()),
    });

    // 电荷粒子
    VisualEffectUtils.createParticleBurst(scene, x, y, {
      count: 15,
      color: 0xffff00,
      speed: { min: 50, max: 150 },
      scale: { start: 0.4, end: 0 },
      lifespan: 400,
      texture: 'particle_lightning_arc',
    });
  }
}
