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

    let tickCount = 0;
    const maxTicks = Math.floor(duration / tickInterval);

    const damageTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        tickCount++;
        if (tickCount > maxTicks) {
          damageTimer.destroy();
          return;
        }

        // 检测范围内敌人
        const enemies = findEnemiesInRange(centerX, centerY, radius);
        for (const enemy of enemies) {
          const tickDamage = Math.floor(damage * 0.3);
          applyDamageToEnemy(enemy, tickDamage, skill);
          // 应用中毒效果
          if (applyEffects && skill.effects) {
            applyEffects(enemy, skill.effects);
          }
        }
      },
      repeat: maxTicks - 1,
    });
  }
}

/**
 * 毒雾视觉效果策略
 */
export class PoisonCloudVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 毒雾区域 - 使用简单的圆形而非粒子系统
    const poisonZone = scene.add.circle(x, y, radius, 0x44ff44, 0.3);
    poisonZone.setDepth(19);

    // 毒雾波动效果
    scene.tweens.add({
      targets: poisonZone,
      scaleX: 1.1,
      scaleY: 1.1,
      alpha: 0.2,
      duration: 500,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        scene.tweens.add({
          targets: poisonZone,
          alpha: 0,
          duration: 500,
          onComplete: () => {
            poisonZone.destroy();
          },
        });
      },
    });

    // 添加一些简单的毒气飘动效果
    for (let i = 0; i < 5; i++) {
      const offsetX = Phaser.Math.Between(-radius * 0.5, radius * 0.5);
      const offsetY = Phaser.Math.Between(-radius * 0.5, radius * 0.5);
      const bubble = scene.add.circle(x + offsetX, y + offsetY, 15, 0x44ff44, 0.4);
      bubble.setDepth(20);

      scene.tweens.add({
        targets: bubble,
        y: bubble.y - 30,
        alpha: 0,
        duration: 1500,
        delay: i * 200,
        repeat: 2,
        onComplete: () => {
          bubble.destroy();
        },
      });
    }
  }
}
