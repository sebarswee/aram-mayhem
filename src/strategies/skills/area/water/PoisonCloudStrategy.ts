import { SkillStrategy, VisualEffectStrategy, SkillExecutionContext } from '../../../SkillStrategy';
import { Skill } from '@/types';
import Phaser from 'phaser';

/**
 * 毒雾策略 - 持续范围伤害
 * 在玩家周围释放毒雾，持续3秒，每0.5秒造成伤害
 */
export class PoisonCloudStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, applyEffects } = context;
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
          // 中毒效果
          enemy.setTint(0x44ff44);
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }
}

/**
 * 毒雾视觉效果策略
 */
export class PoisonCloudVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 毒雾粒子系统
    const poison = scene.add.particles(x, y, 'particle_glow', {
      speed: { min: 30, max: 80 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: 0x44ff44,
      lifespan: 2000,
      frequency: 80,
      quantity: 3,
    });
    poison.setDepth(20);

    // 毒雾区域
    const poisonZone = scene.add.circle(x, y, radius, 0x44ff44, 0.15);
    poisonZone.setDepth(19);

    // 3秒后停止
    scene.time.delayedCall(3000, () => {
      poison.stop();
      scene.tweens.add({
        targets: [poison, poisonZone],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          poison.destroy();
          poisonZone.destroy();
        },
      });
    });
  }
}