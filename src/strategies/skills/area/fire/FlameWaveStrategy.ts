import { SkillStrategy, VisualEffectStrategy, SkillExecutionContext } from '../../../SkillStrategy';
import { Skill } from '@/types';
import Phaser from 'phaser';

/**
 * 火焰喷射策略 - 锥形范围持续伤害
 * 向前方60度锥形喷射火焰，持续1.5秒
 */
export class FlameWaveStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const coneAngle = Math.PI / 3; // 60度扇形
    const range = skill.rangeValue;
    const duration = 1500;
    const tickInterval = 200;

    // 锥形视觉效果
    const cone = scene.add.graphics();
    cone.fillStyle(0xff4400, 0.4);
    cone.beginPath();
    cone.moveTo(player.x, player.y);
    cone.arc(player.x, player.y, range, -coneAngle / 2, coneAngle / 2);
    cone.closePath();
    cone.fill();
    cone.setDepth(25);

    let elapsed = 0;
    const sprayTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          sprayTimer.destroy();
          cone.destroy();
          return;
        }

        const enemies = findEnemiesInRange(player.x, player.y, range);
        for (const enemy of enemies) {
          const angle = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
          if (Math.abs(angle) < coneAngle / 2) {
            applyDamageToEnemy(enemy, Math.floor(damage * 0.25), skill);
          }
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }
}

/**
 * 火焰喷射视觉效果策略
 */
export class FlameWaveVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    const coneAngle = Math.PI / 3;
    const cone = scene.add.graphics();
    cone.fillStyle(0xff4400, 0.6);
    cone.beginPath();
    cone.moveTo(x, y);
    cone.arc(x, y, radius, -coneAngle / 2, coneAngle / 2);
    cone.closePath();
    cone.fill();
    cone.setDepth(25);

    scene.tweens.add({
      targets: cone,
      alpha: 0,
      duration: 500,
      onComplete: () => cone.destroy(),
    });
  }
}
