import { SkillStrategy, VisualEffectStrategy, SkillExecutionContext } from '../../../SkillStrategy';
import { Skill } from '@/types';
import { Enemy } from '@/entities/Enemy';
import Phaser from 'phaser';

/**
 * 地刺陷阱策略 - 陷阱机制
 * 在玩家周围放置3个地刺陷阱，敌人踩到触发
 */
export class RockSpikeStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const trapCount = 3;
    const trapRadius = skill.rangeValue;
    const trapDuration = 5000;

    for (let i = 0; i < trapCount; i++) {
      const angle = (i / trapCount) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 80 + Math.random() * 60;
      const trapX = player.x + Math.cos(angle) * dist;
      const trapY = player.y + Math.sin(angle) * dist;

      // 陷阱视觉
      const trap = scene.add.circle(trapX, trapY, 25, 0x886644, 0.5);
      trap.setStrokeStyle(2, 0xaa8866, 0.8);
      trap.setDepth(20);

      // 脉动动画
      scene.tweens.add({
        targets: trap,
        scale: 1.2,
        alpha: 0.7,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });

      // 检测触发
      const checkTimer = scene.time.addEvent({
        delay: 100,
        callback: () => {
          const enemies = findEnemiesInRange(trapX, trapY, trapRadius);
          if (enemies.length > 0) {
            checkTimer.destroy();
            trap.destroy();

            // 地刺升起
            const spikes = scene.add.graphics();
            spikes.fillStyle(0x886644, 1);
            for (let j = 0; j < 5; j++) {
              const spikeAngle = (j / 5) * Math.PI * 2;
              spikes.fillTriangle(
                trapX + Math.cos(spikeAngle) * 15,
                trapY + Math.sin(spikeAngle) * 15 - 20,
                trapX + Math.cos(spikeAngle) * 25 - 5,
                trapY + Math.sin(spikeAngle) * 25,
                trapX + Math.cos(spikeAngle) * 25 + 5,
                trapY + Math.sin(spikeAngle) * 25
              );
            }
            spikes.setDepth(40);

            for (const enemy of enemies) {
              applyDamageToEnemy(enemy, damage, skill);
            }

            scene.time.delayedCall(300, () => spikes.destroy());
          }
        },
        repeat: trapDuration / 100,
      });

      scene.time.delayedCall(trapDuration, () => {
        checkTimer.destroy();
        trap.destroy();
      });
    }
  }
}

/**
 * 地刺陷阱视觉效果策略
 */
export class RockSpikeVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    const trap = scene.add.circle(x, y, 25, 0x886644, 0.5);
    trap.setStrokeStyle(2, 0xaa8866, 0.8);
    trap.setDepth(20);

    scene.tweens.add({
      targets: trap,
      scale: 1.2,
      alpha: 0.7,
      duration: 300,
      yoyo: true,
      repeat: -1,
    });

    scene.time.delayedCall(5000, () => trap.destroy());
  }
}