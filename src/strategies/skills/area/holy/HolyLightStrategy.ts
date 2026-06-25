import { SkillStrategy, VisualEffectStrategy, SkillExecutionContext } from '../../../SkillStrategy';
import { Skill } from '@/types';
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

    // 伤害敌人
    const enemies = findEnemiesInRange(player.x, player.y, skill.rangeValue);
    for (const enemy of enemies) {
      applyDamageToEnemy(enemy, damage, skill);
      totalHeal += healValue;

      // 创建能量流动效果（从敌人到玩家）
      this.createEnergyTransferEffect(scene, enemy.x, enemy.y, player.x, player.y, 0xffcc00);
    }

    // 延迟治疗（等待能量流动动画）
    if (totalHeal > 0) {
      scene.time.delayedCall(300, () => {
        player.heal(totalHeal);
        // 治疗到达时的闪光效果
        const healFlash = scene.add.circle(player.x, player.y, 30, 0x66ff66, 0.6);
        healFlash.setDepth(100);
        scene.tweens.add({
          targets: healFlash,
          alpha: 0,
          scale: 1.5,
          duration: 300,
          onComplete: () => healFlash.destroy(),
        });
      });
    }
  }

  /**
   * 创建能量流动效果（从敌人到玩家）
   */
  private createEnergyTransferEffect(
    scene: Phaser.Scene,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    color: number
  ): void {
    // 能量光束
    const beam = scene.add.graphics();
    beam.lineStyle(3, color, 0.9);
    beam.lineBetween(startX, startY, endX, endY);
    beam.setDepth(100);

    // 能量粒子流动
    const particleCount = 5;
    for (let i = 0; i < particleCount; i++) {
      const particle = scene.add.circle(startX, startY, 4, color, 0.8);
      particle.setDepth(101);

      scene.tweens.add({
        targets: particle,
        x: endX,
        y: endY,
        alpha: 0.6,
        delay: i * 60,
        duration: 300,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }

    // 光束淡出
    scene.tweens.add({
      targets: beam,
      alpha: 0,
      delay: 300,
      duration: 100,
      onComplete: () => beam.destroy(),
    });
  }
}

/**
 * 圣光视觉效果策略
 */
export class HolyLightVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 光柱
    const beam = scene.add.rectangle(x, y, 60, radius * 2, 0xffcc00, 0.6);
    beam.setDepth(20);

    // 光芒
    const rays = scene.add.graphics();
    rays.lineStyle(3, 0xffffff, 0.8);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      rays.lineBetween(x, y, x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
    }
    rays.setDepth(21);

    // 治疗光环
    const healRing = scene.add.circle(x, y, 30, 0x66ff66, 0.4);
    healRing.setDepth(22);

    scene.tweens.add({
      targets: [beam, rays, healRing],
      alpha: 0,
      scale: 1.5,
      duration: 500,
      onComplete: () => {
        beam.destroy();
        rays.destroy();
        healRing.destroy();
      },
    });
  }
}