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
          // 应用冻结效果
          if (applyEffects && skill.effects) {
            applyEffects(enemy, skill.effects);
          }
          if (applyLifesteal) {
            applyLifesteal(tickDamage);
          }
        }
      },
      repeat: maxTicks - 1,
    });
  }
}

/**
 * 暴风雪视觉效果策略
 */
export class BlizzardVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 霜冻区域
    const frostZone = scene.add.circle(x, y, radius, 0x88ddff, 0.25);
    frostZone.setDepth(19);

    // 雪花效果 - 使用简单图形代替粒子系统
    const snowflakes: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 15; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.FloatBetween(0, radius);
      const startX = x + Math.cos(angle) * dist;
      const startY = y + Math.sin(angle) * dist;

      const snowflake = scene.add.circle(startX, startY, Phaser.Math.Between(3, 6), 0xffffff, 0.8);
      snowflake.setDepth(20);
      snowflakes.push(snowflake);

      // 雪花飘动动画
      scene.tweens.add({
        targets: snowflake,
        y: snowflake.y - Phaser.Math.Between(30, 60),
        x: snowflake.x + Phaser.Math.Between(-20, 20),
        alpha: 0,
        duration: Phaser.Math.Between(1000, 1500),
        repeat: 2,
        onComplete: () => {
          snowflake.destroy();
        },
      });
    }

    // 脉动效果
    scene.tweens.add({
      targets: frostZone,
      scaleX: 1.1,
      scaleY: 1.1,
      alpha: 0.15,
      duration: 500,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        scene.tweens.add({
          targets: frostZone,
          alpha: 0,
          duration: 500,
          onComplete: () => {
            frostZone.destroy();
          },
        });
      },
    });
  }
}
