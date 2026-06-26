import { SkillStrategy, VisualEffectStrategy, SkillExecutionContext } from '../../../SkillStrategy';
import { Skill } from '@/types';
import { VisualEffectUtils } from '@/graphics/VisualEffectUtils';
import Phaser from 'phaser';

/**
 * 冰晶爆发策略 - 8个冰晶向四周射出
 * 从玩家位置发射8个冰晶，穿透路径上的敌人
 */
export class FrostNovaStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const crystalCount = 8;
    const range = skill.rangeValue;
    const angleStep = (Math.PI * 2) / crystalCount;
    const hitEnemies = new Set<string>();

    // 中心冰爆效果
    const centerBurst = scene.add.graphics();
    centerBurst.fillStyle(0x88eeff, 0.9);
    centerBurst.fillCircle(player.x, player.y, 30);
    centerBurst.fillStyle(0xffffff, 0.95);
    centerBurst.fillCircle(player.x, player.y, 18);
    centerBurst.setDepth(38);

    scene.tweens.add({
      targets: centerBurst,
      scale: 2,
      alpha: 0,
      duration: 300,
      onComplete: () => centerBurst.destroy(),
    });

    // 多层冰霜环
    for (let ring = 0; ring < 3; ring++) {
      const ringRadius = 20 + ring * 15;
      const frostRing = scene.add.circle(player.x, player.y, ringRadius, 0x66ddff, 0.4 - ring * 0.1);
      frostRing.setDepth(37);
      scene.tweens.add({
        targets: frostRing,
        scale: 3,
        alpha: 0,
        duration: 400 + ring * 100,
        onComplete: () => frostRing.destroy(),
      });
    }

    for (let i = 0; i < crystalCount; i++) {
      const angle = angleStep * i;

      // 主冰晶 - 更精细
      const crystal = scene.add.graphics();
      crystal.fillStyle(0x66ccff, 0.95);
      crystal.fillTriangle(0, -18, -10, 12, 10, 12);
      crystal.fillStyle(0xaaeeff, 0.9);
      crystal.fillTriangle(0, -14, -6, 8, 6, 8);
      crystal.fillStyle(0xffffff, 0.85);
      crystal.fillTriangle(0, -10, -3, 5, 3, 5);

      // 冰晶光晕
      const crystalGlow = scene.add.circle(0, 0, 20, 0x88ddff, 0.3);

      const container = scene.add.container(player.x, player.y, [crystalGlow, crystal]);
      container.setRotation(angle);
      container.setDepth(40);

      // 冰霜粒子拖尾
      const trailParticles = scene.add.particles(player.x, player.y, 'particle_ice_crystal', {
        speed: { min: 10, max: 30 },
        angle: { min: 160, max: 200 },
        scale: { start: 0.4, end: 0 },
        alpha: { start: 0.6, end: 0 },
        tint: [0x88ddff, 0xaaeeff, 0xffffff],
        lifespan: 300,
        frequency: 25,
        quantity: 1,
      });
      container.add(trailParticles);

      scene.tweens.add({
        targets: container,
        x: player.x + Math.cos(angle) * range,
        y: player.y + Math.sin(angle) * range,
        alpha: 0.5,
        duration: 400,
        onUpdate: () => {
          const enemies = findEnemiesInRange(container.x, container.y, 25);
          for (const enemy of enemies) {
            if (!hitEnemies.has(enemy.instanceId)) {
              hitEnemies.add(enemy.instanceId);
              applyDamageToEnemy(enemy, damage, skill);

              // 冰霜冲击效果
              const impact = scene.add.circle(enemy.x, enemy.y, 15, 0x88ddff, 0.7);
              impact.setDepth(41);
              scene.tweens.add({
                targets: impact,
                scale: 1.5,
                alpha: 0,
                duration: 200,
                onComplete: () => impact.destroy(),
              });
            }
          }
        },
        onComplete: () => {
          container.destroy();
          trailParticles.destroy();
        },
      });
    }
  }
}

/**
 * 冰晶爆发视觉效果策略 - 增强版
 */
export class FrostNovaVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    const crystalCount = 8;
    const angleStep = (Math.PI * 2) / crystalCount;

    // 中心冰爆
    const centerBurst = scene.add.graphics();
    centerBurst.fillStyle(0x88eeff, 0.9);
    centerBurst.fillCircle(0, 0, 25);
    centerBurst.fillStyle(0xffffff, 0.95);
    centerBurst.fillCircle(0, 0, 15);
    centerBurst.setPosition(x, y);
    centerBurst.setDepth(38);

    scene.tweens.add({
      targets: centerBurst,
      scale: 2,
      alpha: 0,
      duration: 250,
      onComplete: () => centerBurst.destroy(),
    });

    // 多层冰霜环
    VisualEffectUtils.createMultiLayerRings(scene, x, y, {
      radius: radius * 0.3,
      color: 0x88ddff,
      layers: 4,
      duration: 400,
      expanding: true,
    });

    // 冰晶发射
    for (let i = 0; i < crystalCount; i++) {
      const angle = angleStep * i;

      const crystal = scene.add.graphics();
      crystal.fillStyle(0x88ddff, 0.95);
      crystal.fillTriangle(0, -15, -8, 10, 8, 10);
      crystal.fillStyle(0xffffff, 0.9);
      crystal.fillTriangle(0, -11, -4, 6, 4, 6);
      crystal.setPosition(x, y);
      crystal.setRotation(angle);
      crystal.setDepth(40);

      // 冰晶光晕
      const glow = scene.add.circle(x, y, 16, 0x88ddff, 0.3);
      glow.setDepth(39);

      scene.tweens.add({
        targets: [crystal, glow],
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius,
        alpha: 0,
        duration: 400,
        onComplete: () => {
          crystal.destroy();
          glow.destroy();
        },
      });
    }

    // 冰霜粒子爆发
    VisualEffectUtils.createParticleBurst(scene, x, y, {
      count: 30,
      color: 0x88ddff,
      speed: { min: 80, max: 200 },
      scale: { start: 0.6, end: 0 },
      lifespan: 500,
      texture: 'particle_ice_crystal',
    });
  }
}
