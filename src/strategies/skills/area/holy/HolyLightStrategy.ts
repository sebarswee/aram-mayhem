import { SkillStrategy, VisualEffectStrategy, SkillExecutionContext } from '../../../SkillStrategy';
import { Skill } from '@/types';
import { VisualEffectUtils } from '@/graphics/VisualEffectUtils';
import Phaser from 'phaser';

/**
 * 圣光策略 - 伤害敌人并治疗自己
 * 释放圣光，对范围内敌人造成伤害并治疗玩家
 */
export class HolyLightStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const healEffect = skill.effects.find(e => e.type === 'heal');
    const healValue = healEffect?.value || 10;
    let totalHeal = 0;

    // 中心光芒爆发
    const centerBurst = scene.add.graphics();
    centerBurst.fillStyle(0xffffff, 0.95);
    centerBurst.fillCircle(player.x, player.y, 25);
    centerBurst.fillStyle(0xffcc00, 0.9);
    centerBurst.fillCircle(player.x, player.y, 40);
    centerBurst.setDepth(95);

    scene.tweens.add({
      targets: centerBurst,
      scale: 2,
      alpha: 0,
      duration: 400,
      onComplete: () => centerBurst.destroy(),
    });

    // 多层光环扩散
    for (let i = 0; i < 3; i++) {
      const ring = scene.add.circle(player.x, player.y, 30 + i * 20, 0xffcc00, 0.4 - i * 0.1);
      ring.setDepth(90 + i);
      scene.tweens.add({
        targets: ring,
        scale: 4,
        alpha: 0,
        duration: 500 + i * 100,
        delay: i * 80,
        onComplete: () => ring.destroy(),
      });
    }

    // 光柱效果
    const beamOuter = scene.add.rectangle(player.x, player.y, 80, skill.rangeValue * 2, 0xffcc00, 0.25);
    const beamMid = scene.add.rectangle(player.x, player.y, 50, skill.rangeValue * 2, 0xffdd44, 0.35);
    const beamInner = scene.add.rectangle(player.x, player.y, 25, skill.rangeValue * 2, 0xffffff, 0.5);
    beamOuter.setDepth(20);
    beamMid.setDepth(21);
    beamInner.setDepth(22);

    // 光芒射线
    const rays: Phaser.GameObjects.Graphics[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const ray = scene.add.graphics();
      ray.fillStyle(0xffffff, 0.7);
      ray.fillTriangle(0, 0, -6, skill.rangeValue, 6, skill.rangeValue);
      ray.setPosition(player.x, player.y);
      ray.setRotation(angle);
      ray.setDepth(23);
      rays.push(ray);
    }

    // 伤害敌人
    const enemies = findEnemiesInRange(player.x, player.y, skill.rangeValue);
    for (const enemy of enemies) {
      applyDamageToEnemy(enemy, damage, skill);
      totalHeal += healValue;
      this.createEnergyTransferEffect(scene, enemy.x, enemy.y, player.x, player.y, 0xffcc00);
    }

    // 光柱和射线消失
    scene.tweens.add({
      targets: [beamOuter, beamMid, beamInner, ...rays],
      alpha: 0,
      scale: 1.2,
      duration: 600,
      onComplete: () => {
        beamOuter.destroy();
        beamMid.destroy();
        beamInner.destroy();
        rays.forEach(r => r.destroy());
      },
    });

    // 延迟治疗
    if (totalHeal > 0) {
      scene.time.delayedCall(300, () => {
        player.heal(totalHeal);
        // 多层治疗到达闪光
        const healFlashOuter = scene.add.circle(player.x, player.y, 45, 0x66ff66, 0.3);
        const healFlashMid = scene.add.circle(player.x, player.y, 35, 0x88ff88, 0.5);
        const healFlashInner = scene.add.circle(player.x, player.y, 25, 0xaaffaa, 0.7);
        healFlashOuter.setDepth(100);
        healFlashMid.setDepth(101);
        healFlashInner.setDepth(102);

        scene.tweens.add({
          targets: [healFlashOuter, healFlashMid, healFlashInner],
          alpha: 0,
          scale: 1.8,
          duration: 400,
          onComplete: () => {
            healFlashOuter.destroy();
            healFlashMid.destroy();
            healFlashInner.destroy();
          },
        });
      });
    }
  }

  private createEnergyTransferEffect(
    scene: Phaser.Scene,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    color: number
  ): void {
    // 多层能量光束
    const beamOuter = scene.add.graphics();
    beamOuter.lineStyle(6, color, 0.5);
    beamOuter.lineBetween(startX, startY, endX, endY);
    beamOuter.setDepth(96);

    const beamMid = scene.add.graphics();
    beamMid.lineStyle(3, color, 0.8);
    beamMid.lineBetween(startX, startY, endX, endY);
    beamMid.setDepth(97);

    const beamCore = scene.add.graphics();
    beamCore.lineStyle(1, 0xffffff, 1);
    beamCore.lineBetween(startX, startY, endX, endY);
    beamCore.setDepth(98);

    // 能量粒子流动
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
      const particleOuter = scene.add.circle(startX, startY, 6, color, 0.6);
      const particleInner = scene.add.circle(startX, startY, 3, 0xffffff, 0.8);
      particleOuter.setDepth(99);
      particleInner.setDepth(100);

      scene.tweens.add({
        targets: [particleOuter, particleInner],
        x: endX,
        y: endY,
        alpha: 0.4,
        delay: i * 40,
        duration: 280,
        ease: 'Power2',
        onComplete: () => {
          particleOuter.destroy();
          particleInner.destroy();
        },
      });
    }

    // 光束淡出
    scene.tweens.add({
      targets: [beamOuter, beamMid, beamCore],
      alpha: 0,
      delay: 300,
      duration: 150,
      onComplete: () => {
        beamOuter.destroy();
        beamMid.destroy();
        beamCore.destroy();
      },
    });
  }
}

/**
 * 圣光视觉效果策略 - 增强版
 */
export class HolyLightVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 多层光柱
    const beamOuter = scene.add.rectangle(x, y, 80, radius * 2, 0xffcc00, 0.25);
    const beamMid = scene.add.rectangle(x, y, 50, radius * 2, 0xffdd44, 0.35);
    const beamInner = scene.add.rectangle(x, y, 25, radius * 2, 0xffffff, 0.5);
    beamOuter.setDepth(20);
    beamMid.setDepth(21);
    beamInner.setDepth(22);

    // 光芒射线
    const rays: Phaser.GameObjects.Graphics[] = [];
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const ray = scene.add.graphics();
      ray.fillStyle(0xffffff, 0.7);
      ray.fillTriangle(0, 0, -5, radius, 5, radius);
      ray.setPosition(x, y);
      ray.setRotation(angle);
      ray.setDepth(23);
      rays.push(ray);
    }

    // 多层治疗光环
    const healRings = [
      { radius: 35, alpha: 0.5, depth: 24 },
      { radius: 45, alpha: 0.3, depth: 25 },
    ];
    const rings: Phaser.GameObjects.Arc[] = [];
    healRings.forEach(config => {
      const ring = scene.add.circle(x, y, config.radius, 0x66ff66, config.alpha);
      ring.setDepth(config.depth);
      rings.push(ring);
    });

    // 中心光爆
    VisualEffectUtils.createElementGlow(scene, x, y, {
      color: 0xffcc00,
      radius: 35,
      duration: 500,
      pulseCount: 2,
    });

    // 消失动画
    scene.tweens.add({
      targets: [beamOuter, beamMid, beamInner, ...rays, ...rings],
      alpha: 0,
      scale: 1.3,
      duration: 600,
      onComplete: () => {
        beamOuter.destroy();
        beamMid.destroy();
        beamInner.destroy();
        rays.forEach(r => r.destroy());
        rings.forEach(r => r.destroy());
      },
    });
  }
}
