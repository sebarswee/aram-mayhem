import { SkillStrategy, VisualEffectStrategy, SkillExecutionContext } from '../../../SkillStrategy';
import { Skill } from '@/types';
import Phaser from 'phaser';

/**
 * 暴风雪策略 - 持续范围伤害
 * 在玩家周围召唤暴风雪，持续3秒，每0.5秒造成伤害并冻结
 */
export class BlizzardStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, applyEffects, applyLifesteal } = context;
    const centerX = player.x;
    const centerY = player.y;
    const radius = skill.rangeValue;
    const duration = 3000;
    const tickInterval = 500;
    let elapsed = 0;

    const damageTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          damageTimer.destroy();
          return;
        }

        // 检测范围内敌人
        const enemies = findEnemiesInRange(centerX, centerY, radius);
        for (const enemy of enemies) {
          const tickDamage = Math.floor(damage * 0.3);
          applyDamageToEnemy(enemy, tickDamage, skill);
          // 应用冻结效果
          applyEffects(enemy, skill.effects);
          applyLifesteal(tickDamage);
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }
}

/**
 * 暴风雪视觉效果策略
 */
export class BlizzardVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 雪花粒子系统
    const blizzard = scene.add.particles(x, y, 'particle_ice', {
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 1500,
      frequency: 50,
      quantity: 2,
    });
    blizzard.setDepth(20);

    // 霜冻区域
    const frostZone = scene.add.circle(x, y, radius, 0x88ddff, 0.2);
    frostZone.setDepth(19);

    // 3秒后停止
    scene.time.delayedCall(3000, () => {
      blizzard.stop();
      scene.tweens.add({
        targets: [blizzard, frostZone],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          blizzard.destroy();
          frostZone.destroy();
        },
      });
    });
  }
}