import { SkillStrategy, VisualEffectStrategy, SkillExecutionContext } from '../../../SkillStrategy';
import { Skill } from '@/types';
import { Enemy } from '@/entities/Enemy';
import { VisualEffectUtils } from '@/graphics/VisualEffectUtils';
import Phaser from 'phaser';

/**
 * 水波推进策略 - 方向性波浪
 * 向指定方向释放水波，击退路径上敌人
 */
export class TidalWaveStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const range = skill.rangeValue;
    const waveSpeed = 300;
    const waveWidth = 60;

    const enemies = findEnemiesInRange(player.x, player.y, range + 100);
    if (enemies.length === 0) return;

    let nearestEnemy: Enemy | null = null;
    let minDist = Infinity;
    for (const enemy of enemies) {
      const dist = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
      if (dist < minDist) {
        minDist = dist;
        nearestEnemy = enemy;
      }
    }
    if (!nearestEnemy) return;

    const angle = Phaser.Math.Angle.Between(player.x, player.y, nearestEnemy.x, nearestEnemy.y);

    // 多层水波视觉
    const waveOuter = scene.add.graphics();
    waveOuter.fillStyle(0x2266cc, 0.35);
    waveOuter.fillEllipse(0, 0, waveWidth + 20, 70);
    waveOuter.setPosition(player.x, player.y);
    waveOuter.setRotation(angle);
    waveOuter.setDepth(23);

    const waveMid = scene.add.graphics();
    waveMid.fillStyle(0x4488ff, 0.55);
    waveMid.fillEllipse(0, 0, waveWidth, 55);
    waveMid.setPosition(player.x, player.y);
    waveMid.setRotation(angle);
    waveMid.setDepth(24);

    const waveInner = scene.add.graphics();
    waveInner.fillStyle(0x66aaff, 0.7);
    waveInner.fillEllipse(0, 0, waveWidth - 15, 40);
    waveInner.setPosition(player.x, player.y);
    waveInner.setRotation(angle);
    waveInner.setDepth(25);

    // 水花粒子
    const splashParticles = scene.add.particles(player.x, player.y, 'particle_glow', {
      speed: { min: 50, max: 150 },
      angle: { min: (angle - 0.5) * 180 / Math.PI, max: (angle + 0.5) * 180 / Math.PI },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.7, end: 0 },
      tint: [0x4488ff, 0x66aaff, 0x88ccff],
      lifespan: 400,
      frequency: 30,
      quantity: 3,
    });
    splashParticles.setDepth(26);

    // 起始冲击波
    VisualEffectUtils.createShockwave(scene, player.x, player.y, {
      color: 0x4488ff,
      radius: 40,
      rings: 2,
      duration: 250,
    });

    let distance = 0;
    const hitEnemies = new Set<string>();

    const waveTimer = scene.time.addEvent({
      delay: 50,
      callback: () => {
        distance += waveSpeed * 0.05;
        if (distance >= range) {
          waveTimer.destroy();
          waveOuter.destroy();
          waveMid.destroy();
          waveInner.destroy();
          splashParticles.destroy();

          // 终点冲击波
          const endX = player.x + Math.cos(angle) * range;
          const endY = player.y + Math.sin(angle) * range;
          VisualEffectUtils.createShockwave(scene, endX, endY, {
            color: 0x4488ff,
            radius: 50,
            rings: 3,
            duration: 300,
          });
          return;
        }

        const cx = player.x + Math.cos(angle) * distance;
        const cy = player.y + Math.sin(angle) * distance;
        waveOuter.setPosition(cx, cy);
        waveMid.setPosition(cx, cy);
        waveInner.setPosition(cx, cy);
        splashParticles.setPosition(cx, cy);

        const enemiesInRange = findEnemiesInRange(cx, cy, waveWidth);
        for (const enemy of enemiesInRange) {
          if (!hitEnemies.has(enemy.instanceId)) {
            hitEnemies.add(enemy.instanceId);
            applyDamageToEnemy(enemy, damage, skill);

            if (enemy.active && enemy.body) {
              enemy.x += Math.cos(angle) * 30;
              enemy.y += Math.sin(angle) * 30;
            }

            // 水花溅射效果
            const splash = scene.add.circle(enemy.x, enemy.y, 18, 0x4488ff, 0.6);
            splash.setDepth(100);
            scene.tweens.add({
              targets: splash,
              scale: 1.5,
              alpha: 0,
              duration: 200,
              onComplete: () => splash.destroy(),
            });
          }
        }
      },
      repeat: Math.ceil(range / (waveSpeed * 0.05)),
    });
  }
}

/**
 * 水波推进视觉效果策略 - 增强版
 */
export class TidalWaveVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 多层水波
    const waves: Phaser.GameObjects.Graphics[] = [];
    const configs = [
      { width: 80, height: 55, color: 0x2266cc, alpha: 0.3 },
      { width: 65, height: 45, color: 0x4488ff, alpha: 0.5 },
      { width: 50, height: 35, color: 0x66aaff, alpha: 0.65 },
    ];

    configs.forEach((config, i) => {
      const wave = scene.add.graphics();
      wave.fillStyle(config.color, config.alpha);
      wave.fillEllipse(0, 0, config.width, config.height);
      wave.setPosition(x, y);
      wave.setDepth(23 + i);
      waves.push(wave);
    });

    // 水花粒子
    VisualEffectUtils.createParticleBurst(scene, x, y, {
      count: 20,
      color: 0x4488ff,
      speed: { min: 80, max: 180 },
      angle: { min: -30, max: 30 },
      scale: { start: 0.5, end: 0 },
      lifespan: 400,
    });

    scene.tweens.add({
      targets: waves,
      x: radius,
      alpha: 0,
      scaleX: 1.3,
      duration: 450,
      onComplete: () => waves.forEach(w => w.destroy()),
    });
  }
}
