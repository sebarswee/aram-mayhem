import { SkillStrategy, VisualEffectStrategy, SkillExecutionContext } from '../../../SkillStrategy';
import { Skill } from '@/types';
import { VisualEffectUtils } from '@/graphics/VisualEffectUtils';
import Phaser from 'phaser';

/**
 * 火焰喷射策略 - 锥形范围持续伤害
 * 向前方60度锥形喷射火焰，持续1.5秒，跟随角色移动
 */
export class FlameWaveStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, findNearestEnemy } = context;
    const coneAngle = Math.PI / 3;
    const range = skill.rangeValue;
    const duration = 1500;
    const tickInterval = 200;

    const nearestEnemy = findNearestEnemy(player.x, player.y, range + 100);
    const initialAngle = nearestEnemy
      ? Phaser.Math.Angle.Between(player.x, player.y, nearestEnemy.x, nearestEnemy.y)
      : (player as any).body?.angle || 0;

    // 创建跟随玩家的容器
    const flameContainer = scene.add.container(player.x, player.y);
    flameContainer.setDepth(24);

    // 多层锥形视觉效果
    const coneOuter = scene.add.graphics();
    coneOuter.fillStyle(0xff2200, 0.25);
    coneOuter.beginPath();
    coneOuter.moveTo(0, 0);
    coneOuter.arc(0, 0, range * 1.1, -coneAngle / 2, coneAngle / 2);
    coneOuter.closePath();
    coneOuter.fill();

    const coneMid = scene.add.graphics();
    coneMid.fillStyle(0xff6600, 0.35);
    coneMid.beginPath();
    coneMid.moveTo(0, 0);
    coneMid.arc(0, 0, range * 0.85, -coneAngle / 2, coneAngle / 2);
    coneMid.closePath();
    coneMid.fill();

    const coneInner = scene.add.graphics();
    coneInner.fillStyle(0xffaa00, 0.5);
    coneInner.beginPath();
    coneInner.moveTo(0, 0);
    coneInner.arc(0, 0, range * 0.6, -coneAngle / 2, coneAngle / 2);
    coneInner.closePath();
    coneInner.fill();

    const coneCore = scene.add.graphics();
    coneCore.fillStyle(0xffff00, 0.6);
    coneCore.beginPath();
    coneCore.moveTo(0, 0);
    coneCore.arc(0, 0, range * 0.35, -coneAngle / 2, coneAngle / 2);
    coneCore.closePath();
    coneCore.fill();

    flameContainer.add([coneOuter, coneMid, coneInner, coneCore]);
    flameContainer.setRotation(initialAngle);

    // 火焰粒子喷发
    const fireParticles = scene.add.particles(0, 0, 'particle_fire_core', {
      speed: { min: 150, max: 350 },
      angle: { min: -coneAngle / 2 * 180 / Math.PI, max: coneAngle / 2 * 180 / Math.PI },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.9, end: 0 },
      tint: [0xff4400, 0xff6600, 0xffaa00, 0xffff00],
      lifespan: 400,
      frequency: 30,
      quantity: 3,
    });
    flameContainer.add(fireParticles);

    // 火花粒子
    const sparkParticles = scene.add.particles(0, 0, 'particle_fire_spark', {
      speed: { min: 200, max: 400 },
      angle: { min: -coneAngle / 2 * 180 / Math.PI, max: coneAngle / 2 * 180 / Math.PI },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0xffffff, 0xffff00, 0xffaa00],
      lifespan: 300,
      frequency: 40,
      quantity: 2,
    });
    flameContainer.add(sparkParticles);

    // 更新位置跟随玩家
    const updateEvent = scene.time.addEvent({
      delay: 16, // ~60fps
      callback: () => {
        flameContainer.setPosition(player.x, player.y);
      },
      repeat: Math.floor(duration / 16),
    });

    let elapsed = 0;
    const sprayTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          sprayTimer.destroy();
          updateEvent.destroy();
          // 淡出动画
          scene.tweens.add({
            targets: flameContainer,
            alpha: 0,
            duration: 200,
            onComplete: () => flameContainer.destroy(),
          });
          return;
        }

        const enemies = findEnemiesInRange(player.x, player.y, range);
        for (const enemy of enemies) {
          const enemyAngle = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
          const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(enemyAngle - initialAngle));
          if (angleDiff < coneAngle / 2) {
            applyDamageToEnemy(enemy, Math.floor(damage * 0.25), skill);
          }
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }
}

/**
 * 火焰喷射视觉效果策略 - 增强版
 */
export class FlameWaveVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    const coneAngle = Math.PI / 3;
    const playerAngle = 0;

    // 多层锥形视觉效果
    const layers = [
      { radius: radius * 1.1, color: 0xff2200, alpha: 0.2, depth: 24 },
      { radius: radius * 0.85, color: 0xff6600, alpha: 0.35, depth: 25 },
      { radius: radius * 0.6, color: 0xffaa00, alpha: 0.5, depth: 26 },
      { radius: radius * 0.35, color: 0xffff00, alpha: 0.65, depth: 27 },
    ];

    const cones: Phaser.GameObjects.Graphics[] = [];
    layers.forEach(layer => {
      const cone = scene.add.graphics();
      cone.fillStyle(layer.color, layer.alpha);
      cone.beginPath();
      cone.moveTo(x, y);
      cone.arc(x, y, layer.radius, playerAngle - coneAngle / 2, playerAngle + coneAngle / 2);
      cone.closePath();
      cone.fill();
      cone.setDepth(layer.depth);
      cones.push(cone);
    });

    // 粒子爆发
    VisualEffectUtils.createParticleBurst(scene, x, y, {
      count: 25,
      color: 0xff6600,
      speed: { min: 100, max: 250 },
      scale: { start: 0.7, end: 0 },
      lifespan: 500,
      texture: 'particle_fire_core',
      angle: { min: -30, max: 30 },
    });

    // 消失动画
    scene.tweens.add({
      targets: cones,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 600,
      onComplete: () => cones.forEach(c => c.destroy()),
    });
  }
}
