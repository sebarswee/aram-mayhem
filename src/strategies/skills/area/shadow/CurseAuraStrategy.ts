import { SkillStrategy, VisualEffectStrategy, SkillExecutionContext } from '../../../SkillStrategy';
import { Skill } from '@/types';
import { Enemy } from '@/entities/Enemy';
import { VisualEffectUtils } from '@/graphics/VisualEffectUtils';
import Phaser from 'phaser';

/**
 * 诅咒链策略 - 链式传播
 * 诅咒最近敌人并连锁传播到附近敌人
 */
export class CurseAuraStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const maxChains = 4;
    const chainRange = 150;

    const enemies = findEnemiesInRange(player.x, player.y, skill.rangeValue);
    if (enemies.length === 0) return;

    let startEnemy: Enemy | null = null;
    let minDist = Infinity;
    for (const enemy of enemies) {
      const dist = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
      if (dist < minDist) {
        minDist = dist;
        startEnemy = enemy;
      }
    }
    if (!startEnemy) return;

    // 起始诅咒爆发
    const startBurst = scene.add.graphics();
    startBurst.fillStyle(0x8800ff, 0.7);
    startBurst.fillCircle(player.x, player.y, 30);
    startBurst.fillStyle(0xaa44ff, 0.8);
    startBurst.fillCircle(player.x, player.y, 20);
    startBurst.setDepth(95);

    scene.tweens.add({
      targets: startBurst,
      scale: 2,
      alpha: 0,
      duration: 350,
      onComplete: () => startBurst.destroy(),
    });

    const hitEnemies = new Set<string>();
    let currentEnemy = startEnemy;
    let chainCount = 0;

    while (currentEnemy && chainCount < maxChains) {
      hitEnemies.add(currentEnemy.instanceId);
      applyDamageToEnemy(currentEnemy, damage, skill);

      // 多层诅咒视觉效果
      const curseOuter = scene.add.circle(currentEnemy.x, currentEnemy.y, 28, 0x6600aa, 0.4);
      const curseMid = scene.add.circle(currentEnemy.x, currentEnemy.y, 22, 0x8800ff, 0.55);
      const curseInner = scene.add.circle(currentEnemy.x, currentEnemy.y, 15, 0xaa44ff, 0.7);
      curseOuter.setDepth(98);
      curseMid.setDepth(99);
      curseInner.setDepth(100);

      // 诅咒符文
      const rune = scene.add.graphics();
      rune.lineStyle(2, 0xcc66ff, 0.7);
      const runeRadius = 18;
      for (let i = 0; i < 5; i++) {
        const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        rune.lineBetween(
          currentEnemy.x + Math.cos(a) * runeRadius * 0.5,
          currentEnemy.y + Math.sin(a) * runeRadius * 0.5,
          currentEnemy.x + Math.cos(a) * runeRadius,
          currentEnemy.y + Math.sin(a) * runeRadius
        );
      }
      rune.setDepth(101);

      scene.tweens.add({
        targets: [curseOuter, curseMid, curseInner, rune],
        alpha: 0,
        scale: 1.6,
        duration: 350,
        onComplete: () => {
          curseOuter.destroy();
          curseMid.destroy();
          curseInner.destroy();
          rune.destroy();
        },
      });

      // 粒子爆发
      VisualEffectUtils.createParticleBurst(scene, currentEnemy.x, currentEnemy.y, {
        count: 12,
        color: 0x8800ff,
        speed: { min: 50, max: 120 },
        scale: { start: 0.4, end: 0 },
        lifespan: 350,
      });

      const nearbyEnemies = findEnemiesInRange(currentEnemy.x, currentEnemy.y, chainRange)
        .filter((e: Enemy) => !hitEnemies.has(e.instanceId));

      if (nearbyEnemies.length > 0) {
        const nextEnemy = nearbyEnemies[0];

        // 多层链条视觉
        const chainOuter = scene.add.graphics();
        chainOuter.lineStyle(8, 0x6600aa, 0.3);
        chainOuter.lineBetween(currentEnemy.x, currentEnemy.y, nextEnemy.x, nextEnemy.y);
        chainOuter.setDepth(96);

        const chainMid = scene.add.graphics();
        chainMid.lineStyle(4, 0x8800ff, 0.6);
        chainMid.lineBetween(currentEnemy.x, currentEnemy.y, nextEnemy.x, nextEnemy.y);
        chainMid.setDepth(97);

        const chainCore = scene.add.graphics();
        chainCore.lineStyle(1, 0xcc66ff, 0.9);
        chainCore.lineBetween(currentEnemy.x, currentEnemy.y, nextEnemy.x, nextEnemy.y);
        chainCore.setDepth(98);

        // 能量流动
        const flowCount = 5;
        for (let i = 0; i < flowCount; i++) {
          const particle = scene.add.circle(currentEnemy.x, currentEnemy.y, 4, 0xaa44ff, 0.8);
          particle.setDepth(99);

          scene.tweens.add({
            targets: particle,
            x: nextEnemy.x,
            y: nextEnemy.y,
            alpha: 0.4,
            delay: i * 40,
            duration: 200,
            onComplete: () => particle.destroy(),
          });
        }

        scene.time.delayedCall(250, () => {
          chainOuter.destroy();
          chainMid.destroy();
          chainCore.destroy();
        });

        currentEnemy = nextEnemy;
        chainCount++;
      } else {
        break;
      }
    }
  }
}

/**
 * 诅咒链视觉效果策略 - 增强版
 */
export class CurseAuraVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 多层诅咒光环
    const layers = [
      { radius: radius * 1.2, color: 0x6600aa, alpha: 0.15 },
      { radius: radius, color: 0x8800ff, alpha: 0.25 },
      { radius: radius * 0.7, color: 0xaa44ff, alpha: 0.2 },
    ];

    const rings: Phaser.GameObjects.Arc[] = [];
    layers.forEach((config, i) => {
      const ring = scene.add.circle(x, y, config.radius, config.color, config.alpha);
      ring.setDepth(18 + i);
      rings.push(ring);
    });

    // 诅咒符文装饰
    const runeCircle = scene.add.graphics();
    runeCircle.lineStyle(2, 0xcc66ff, 0.5);
    runeCircle.strokeCircle(x, y, radius * 0.8);
    runeCircle.setDepth(21);

    scene.tweens.add({
      targets: runeCircle,
      angle: 360,
      duration: 2000,
      repeat: 1,
    });

    // 中心光爆
    VisualEffectUtils.createElementGlow(scene, x, y, {
      color: 0x8800ff,
      radius: 25,
      duration: 400,
      pulseCount: 1,
    });

    scene.tweens.add({
      targets: [...rings],
      alpha: 0,
      scale: 1.5,
      duration: 450,
      onComplete: () => rings.forEach(r => r.destroy()),
    });
  }
}
