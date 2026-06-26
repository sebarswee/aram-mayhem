import { SkillStrategy, VisualEffectStrategy, SkillExecutionContext } from '../../../SkillStrategy';
import { Skill } from '@/types';
import { VisualEffectUtils } from '@/graphics/VisualEffectUtils';
import Phaser from 'phaser';

/**
 * 电场策略 - 区域持续麻痹
 * 在玩家位置创建电场，区域内敌人每0.5秒麻痹并受到低额伤害
 */
export class ElectricFieldStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, applyEffects } = context;
    const range = skill.rangeValue;
    const duration = 3000;
    const tickInterval = 500;

    const fieldX = player.x;
    const fieldY = player.y;

    const field = scene.add.container(fieldX, fieldY);
    field.setDepth(15);

    // 多层电场底层
    const fieldLayers: Phaser.GameObjects.Arc[] = [];
    const layerConfigs = [
      { radius: range, color: 0xffff00, alpha: 0.15, depth: 15 },
      { radius: range * 0.85, color: 0xffff00, alpha: 0.2, depth: 16 },
      { radius: range * 0.7, color: 0xffffff, alpha: 0.1, depth: 17 },
    ];

    layerConfigs.forEach(config => {
      const layer = scene.add.circle(0, 0, config.radius, config.color, config.alpha);
      layer.setStrokeStyle(2, 0xffff00, 0.5);
      field.add(layer);
      fieldLayers.push(layer);
    });

    // 电场脉冲环
    const pulseRings: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 3; i++) {
      const ring = scene.add.circle(0, 0, range * (0.3 + i * 0.25), 0xffff00, 0);
      ring.setStrokeStyle(3 - i * 0.5, 0xffffff, 0.8 - i * 0.15);
      field.add(ring);
      pulseRings.push(ring);
    }

    // 持续脉冲动画
    pulseRings.forEach((ring, i) => {
      scene.tweens.add({
        targets: ring,
        scale: 1.15,
        alpha: 0.4,
        duration: tickInterval / 2,
        yoyo: true,
        repeat: -1,
        delay: i * 80,
      });
    });

    // 电荷粒子系统
    const chargeParticles = scene.add.particles(fieldX, fieldY, 'particle_lightning_arc', {
      speed: { min: 30, max: 80 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: [0xffff00, 0xffffff, 0xffffaa],
      lifespan: 600,
      frequency: 80,
      quantity: 2,
      emitZone: {
        type: 'random' as const,
        source: new Phaser.Geom.Circle(0, 0, range * 0.9) as Phaser.Types.GameObjects.Particles.RandomZoneSource,
      },
    });
    chargeParticles.setDepth(18);

    const hitEnemies = new Set<string>();

    const tickTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        hitEnemies.clear();

        const enemies = findEnemiesInRange(fieldX, fieldY, range);

        for (const enemy of enemies) {
          if (!enemy.active) continue;
          if (hitEnemies.has(enemy.instanceId)) continue;

          hitEnemies.add(enemy.instanceId);

          applyDamageToEnemy(enemy, damage, skill);
          applyEffects(enemy, skill.effects);

          // 多层电击特效
          const sparkOuter = scene.add.circle(enemy.x, enemy.y, 22, 0xffff00, 0.5);
          const sparkInner = scene.add.circle(enemy.x, enemy.y, 14, 0xffffff, 0.8);
          sparkOuter.setDepth(100);
          sparkInner.setDepth(101);

          scene.tweens.add({
            targets: [sparkOuter, sparkInner],
            scale: 1.5,
            alpha: 0,
            duration: 180,
            onComplete: () => {
              sparkOuter.destroy();
              sparkInner.destroy();
            },
          });
        }

        // 随机多层电弧
        if (enemies.length > 0) {
          const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];
          if (randomEnemy) {
            const arcOuter = scene.add.graphics();
            arcOuter.lineStyle(5, 0xffff00, 0.4);
            arcOuter.lineBetween(fieldX, fieldY, randomEnemy.x, randomEnemy.y);
            arcOuter.setDepth(49);

            const arcInner = scene.add.graphics();
            arcInner.lineStyle(2, 0xffffff, 0.8);
            arcInner.lineBetween(fieldX, fieldY, randomEnemy.x, randomEnemy.y);
            arcInner.setDepth(50);

            scene.time.delayedCall(100, () => {
              arcOuter.destroy();
              arcInner.destroy();
            });
          }
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });

    // 边界闪烁效果
    fieldLayers.forEach((layer, i) => {
      scene.tweens.add({
        targets: layer,
        alpha: layer.alpha * 1.5,
        duration: 200 + i * 50,
        yoyo: true,
        repeat: -1,
      });
    });

    // 电场结束时清理
    scene.time.delayedCall(duration, () => {
      tickTimer.destroy();
      chargeParticles.destroy();

      scene.tweens.add({
        targets: field,
        alpha: 0,
        scale: 1.15,
        duration: 300,
        onComplete: () => field.destroy(),
      });
    });
  }
}

/**
 * 电场视觉效果策略 - 增强版
 */
export class ElectricFieldVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    const field = scene.add.container(x, y);
    field.setDepth(15);

    // 多层电场底层
    const layerConfigs = [
      { radius: radius, color: 0xffff00, alpha: 0.12 },
      { radius: radius * 0.85, color: 0xffff00, alpha: 0.18 },
      { radius: radius * 0.7, color: 0xffffff, alpha: 0.1 },
    ];

    layerConfigs.forEach(config => {
      const layer = scene.add.circle(0, 0, config.radius, config.color, config.alpha);
      layer.setStrokeStyle(2, 0xffff00, 0.45);
      field.add(layer);
    });

    // 脉冲环
    const pulseRings: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 3; i++) {
      const ring = scene.add.circle(0, 0, radius * (0.3 + i * 0.25), 0xffff00, 0);
      ring.setStrokeStyle(3 - i * 0.5, 0xffffff, 0.75 - i * 0.15);
      field.add(ring);
      pulseRings.push(ring);
    }

    pulseRings.forEach((ring, i) => {
      scene.tweens.add({
        targets: ring,
        scale: 1.15,
        alpha: 0.35,
        duration: 250,
        yoyo: true,
        repeat: 5,
        delay: i * 80,
      });
    });

    // 电荷粒子
    const chargeParticles = scene.add.particles(x, y, 'particle_lightning_arc', {
      speed: { min: 20, max: 50 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.35, end: 0 },
      alpha: { start: 0.5, end: 0 },
      tint: [0xffff00, 0xffffff],
      lifespan: 800,
      frequency: 100,
      quantity: 2,
      emitZone: {
        type: 'random' as const,
        source: new Phaser.Geom.Circle(0, 0, radius * 0.9) as Phaser.Types.GameObjects.Particles.RandomZoneSource,
      },
    });
    chargeParticles.setDepth(18);

    scene.time.delayedCall(3000, () => {
      scene.tweens.add({
        targets: [field, chargeParticles],
        alpha: 0,
        scale: 1.15,
        duration: 300,
        onComplete: () => {
          field.destroy();
          chargeParticles.destroy();
        },
      });
    });
  }
}
