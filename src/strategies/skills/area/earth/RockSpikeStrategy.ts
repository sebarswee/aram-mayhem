import { SkillStrategy, VisualEffectStrategy, SkillExecutionContext } from '../../../SkillStrategy';
import { Skill } from '@/types';
import { VisualEffectUtils } from '@/graphics/VisualEffectUtils';
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

      // 多层陷阱视觉
      const trapOuter = scene.add.circle(trapX, trapY, 35, 0x664422, 0.3);
      const trapMid = scene.add.circle(trapX, trapY, 28, 0x886644, 0.4);
      const trapInner = scene.add.circle(trapX, trapY, 20, 0xaa8866, 0.5);
      trapOuter.setDepth(18);
      trapMid.setDepth(19);
      trapInner.setDepth(20);

      // 地面裂缝效果
      const crack = scene.add.graphics();
      crack.lineStyle(2, 0x553311, 0.6);
      for (let j = 0; j < 6; j++) {
        const crackAngle = (j / 6) * Math.PI * 2;
        const len = 15 + Math.random() * 10;
        crack.lineBetween(
          trapX,
          trapY,
          trapX + Math.cos(crackAngle) * len,
          trapY + Math.sin(crackAngle) * len
        );
      }
      crack.setDepth(17);

      // 多层脉动动画
      scene.tweens.add({
        targets: [trapOuter, trapMid],
        scale: 1.15,
        alpha: 0.6,
        duration: 400,
        yoyo: true,
        repeat: -1,
      });

      scene.tweens.add({
        targets: trapInner,
        scale: 1.25,
        alpha: 0.7,
        duration: 300,
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
            trapOuter.destroy();
            trapMid.destroy();
            trapInner.destroy();
            crack.destroy();

            // 多层地刺升起效果
            const spikeContainer = scene.add.container(trapX, trapY);
            spikeContainer.setDepth(40);

            // 外层尖刺
            for (let j = 0; j < 6; j++) {
              const spikeAngle = (j / 6) * Math.PI * 2;
              const spike = scene.add.graphics();
              spike.fillStyle(0x664422, 0.9);
              spike.fillTriangle(0, -25, -8, 0, 8, 0);
              spike.fillStyle(0x886644, 0.8);
              spike.fillTriangle(0, -20, -5, 0, 5, 0);
              spike.setPosition(Math.cos(spikeAngle) * 20, Math.sin(spikeAngle) * 20);
              spike.setRotation(spikeAngle + Math.PI / 2);
              spikeContainer.add(spike);

              scene.tweens.add({
                targets: spike,
                y: spike.y - 30,
                duration: 150,
                yoyo: true,
                delay: j * 30,
              });
            }

            // 中心主刺
            const mainSpike = scene.add.graphics();
            mainSpike.fillStyle(0x886644, 1);
            mainSpike.fillTriangle(0, -35, -10, 5, 10, 5);
            mainSpike.fillStyle(0xaa8866, 0.9);
            mainSpike.fillTriangle(0, -30, -6, 3, 6, 3);
            spikeContainer.add(mainSpike);

            scene.tweens.add({
              targets: mainSpike,
              y: -20,
              duration: 100,
              yoyo: true,
            });

            // 冲击波
            VisualEffectUtils.createShockwave(scene, trapX, trapY, {
              color: 0x886644,
              radius: 50,
              rings: 3,
              duration: 300,
            });

            // 地面震动粒子
            VisualEffectUtils.createParticleBurst(scene, trapX, trapY, {
              count: 15,
              color: 0x886644,
              speed: { min: 50, max: 150 },
              scale: { start: 0.5, end: 0 },
              lifespan: 400,
              texture: 'particle_glow',
            });

            for (const enemy of enemies) {
              applyDamageToEnemy(enemy, damage, skill);
            }

            scene.time.delayedCall(350, () => {
              scene.tweens.add({
                targets: spikeContainer,
                alpha: 0,
                scale: 0.8,
                duration: 200,
                onComplete: () => spikeContainer.destroy(),
              });
            });
          }
        },
        repeat: trapDuration / 100,
      });

      scene.time.delayedCall(trapDuration, () => {
        checkTimer.destroy();
        trapOuter.destroy();
        trapMid.destroy();
        trapInner.destroy();
        crack.destroy();
      });
    }
  }
}

/**
 * 地刺陷阱视觉效果策略 - 增强版
 */
export class RockSpikeVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 多层陷阱视觉
    const trapOuter = scene.add.circle(x, y, 35, 0x664422, 0.25);
    const trapMid = scene.add.circle(x, y, 28, 0x886644, 0.35);
    const trapInner = scene.add.circle(x, y, 20, 0xaa8866, 0.45);
    trapOuter.setDepth(18);
    trapMid.setDepth(19);
    trapInner.setDepth(20);

    // 地面裂缝
    const crack = scene.add.graphics();
    crack.lineStyle(2, 0x553311, 0.5);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const len = 15 + Math.random() * 10;
      crack.lineBetween(x, y, x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    }
    crack.setDepth(17);

    // 多层脉动
    scene.tweens.add({
      targets: [trapOuter, trapMid, trapInner],
      scale: 1.15,
      alpha: 0.6,
      duration: 350,
      yoyo: true,
      repeat: -1,
    });

    scene.time.delayedCall(5000, () => {
      scene.tweens.add({
        targets: [trapOuter, trapMid, trapInner, crack],
        alpha: 0,
        duration: 300,
        onComplete: () => {
          trapOuter.destroy();
          trapMid.destroy();
          trapInner.destroy();
          crack.destroy();
        },
      });
    });
  }
}
