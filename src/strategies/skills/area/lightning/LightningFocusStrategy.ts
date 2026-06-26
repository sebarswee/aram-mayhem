import { SkillStrategy, VisualEffectStrategy, SkillExecutionContext } from '../../../SkillStrategy';
import { Skill } from '@/types';
import { Enemy } from '@/entities/Enemy';
import { VisualEffectUtils } from '@/graphics/VisualEffectUtils';
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

    const target = enemies.reduce((highest, enemy) => {
      if (!highest || enemy.currentHp > highest.currentHp) return enemy;
      return highest;
    }, null as Enemy | null);

    if (!target) return;

    // 多层聚焦蓄力视觉
    const chargeOuter = scene.add.circle(player.x, player.y, 28, 0xffff00, 0.35);
    const chargeMid = scene.add.circle(player.x, player.y, 22, 0xffff00, 0.5);
    const chargeInner = scene.add.circle(player.x, player.y, 16, 0xffffff, 0.7);
    chargeOuter.setStrokeStyle(4, 0xffffff, 0.6);
    chargeMid.setStrokeStyle(3, 0xffffff, 0.75);
    chargeInner.setStrokeStyle(2, 0xffffff, 0.9);
    chargeOuter.setDepth(98);
    chargeMid.setDepth(99);
    chargeInner.setDepth(100);

    // 目标标记 - 多层
    const markOuter = scene.add.circle(target.x, target.y, 45, 0xffff00, 0.15);
    const markMid = scene.add.circle(target.x, target.y, 35, 0xffff00, 0.25);
    const markInner = scene.add.circle(target.x, target.y, 25, 0xffffff, 0.35);
    markOuter.setDepth(18);
    markMid.setDepth(19);
    markInner.setDepth(20);

    // 蓄力动画
    scene.tweens.add({
      targets: [chargeOuter, chargeMid, chargeInner],
      scale: 1.6,
      alpha: 0.9,
      duration: 150,
      onComplete: () => {
        chargeOuter.destroy();
        chargeMid.destroy();
        chargeInner.destroy();

        // 多层聚焦雷电束
        const lightningOuter = scene.add.graphics();
        lightningOuter.lineStyle(14, 0xffff00, 0.35);
        lightningOuter.lineBetween(player.x, player.y, target.x, target.y);
        lightningOuter.setDepth(98);

        const lightningMid = scene.add.graphics();
        lightningMid.lineStyle(8, 0xffff00, 0.7);
        lightningMid.lineBetween(player.x, player.y, target.x, target.y);
        lightningMid.setDepth(99);

        const lightningCore = scene.add.graphics();
        lightningCore.lineStyle(3, 0xffffff, 1);
        lightningCore.lineBetween(player.x, player.y, target.x, target.y);
        lightningCore.setDepth(100);

        // 多层闪光
        const flashOuter = scene.add.circle(target.x, target.y, 70, 0xffff00, 0.5);
        const flashMid = scene.add.circle(target.x, target.y, 50, 0xffffff, 0.75);
        const flashInner = scene.add.circle(target.x, target.y, 30, 0xffffff, 0.95);
        flashOuter.setDepth(101);
        flashMid.setDepth(102);
        flashInner.setDepth(103);

        // 电弧分支效果 - 更精细
        const branches: Phaser.GameObjects.Graphics[] = [];
        for (let i = 0; i < 5; i++) {
          const angle = (Math.PI * 2 * i) / 5 + Math.random() * 0.4;
          const branch = scene.add.graphics();
          branch.lineStyle(3, 0xffff00, 0.55);
          const endX = target.x + Math.cos(angle) * 55;
          const endY = target.y + Math.sin(angle) * 55;
          branch.lineBetween(target.x, target.y, endX, endY);

          const branchCore = scene.add.graphics();
          branchCore.lineStyle(1, 0xffffff, 0.8);
          branchCore.lineBetween(target.x, target.y, endX, endY);
          branch.setDepth(99);
          branchCore.setDepth(100);
          branches.push(branch, branchCore);
        }

        if (target.active) {
          applyDamageToEnemy(target, damage, skill);
          applyEffects(target, skill.effects);
        }

        // 粒子爆发
        VisualEffectUtils.createParticleBurst(scene, target.x, target.y, {
          count: 25,
          color: 0xffff00,
          speed: { min: 100, max: 220 },
          scale: { start: 0.6, end: 0 },
          lifespan: 300,
          texture: 'particle_lightning_arc',
        });

        // 屏幕震动
        VisualEffectUtils.screenShake(scene, { intensity: 0.008, duration: 100 });

        // 消失动画
        scene.tweens.add({
          targets: [lightningOuter, lightningMid, lightningCore, flashOuter, flashMid, flashInner, markOuter, markMid, markInner, ...branches],
          alpha: 0,
          duration: 220,
          onComplete: () => {
            lightningOuter.destroy();
            lightningMid.destroy();
            lightningCore.destroy();
            flashOuter.destroy();
            flashMid.destroy();
            flashInner.destroy();
            markOuter.destroy();
            markMid.destroy();
            markInner.destroy();
            branches.forEach(b => b.destroy());
          },
        });
      },
    });
  }
}

/**
 * 雷电聚焦视觉效果策略 - 增强版
 */
export class LightningFocusVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 多层预览聚焦效果
    const chargeOuter = scene.add.circle(x, y, 28, 0xffff00, 0.35);
    const chargeMid = scene.add.circle(x, y, 22, 0xffff00, 0.5);
    const chargeInner = scene.add.circle(x, y, 16, 0xffffff, 0.7);
    chargeOuter.setStrokeStyle(4, 0xffffff, 0.6);
    chargeMid.setStrokeStyle(3, 0xffffff, 0.75);
    chargeInner.setStrokeStyle(2, 0xffffff, 0.9);
    chargeOuter.setDepth(98);
    chargeMid.setDepth(99);
    chargeInner.setDepth(100);

    scene.tweens.add({
      targets: [chargeOuter, chargeMid, chargeInner],
      scale: 1.6,
      alpha: 0.9,
      duration: 150,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        chargeOuter.destroy();
        chargeMid.destroy();
        chargeInner.destroy();
      },
    });

    // 电荷粒子
    VisualEffectUtils.createParticleBurst(scene, x, y, {
      count: 15,
      color: 0xffff00,
      speed: { min: 60, max: 120 },
      scale: { start: 0.4, end: 0 },
      lifespan: 300,
      texture: 'particle_lightning_arc',
    });
  }
}
