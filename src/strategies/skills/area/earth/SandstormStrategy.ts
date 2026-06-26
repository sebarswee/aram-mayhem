import { SkillStrategy, VisualEffectStrategy, SkillExecutionContext } from '../../../SkillStrategy';
import { Skill } from '@/types';
import { VisualEffectUtils } from '@/graphics/VisualEffectUtils';
import Phaser from 'phaser';

/**
 * 流沙陷阱策略 - 持续陷阱
 * 在玩家位置创建持续4秒的流沙区域，减速并造成伤害
 */
export class SandstormStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, applyEffects } = context;
    const radius = skill.rangeValue;
    const duration = 4000;
    const tickInterval = 400;

    // 多层流沙区域
    const sandLayers: Phaser.GameObjects.Arc[] = [];
    const layerConfigs = [
      { radius: radius * 1.1, color: 0x775522, alpha: 0.25 },
      { radius: radius, color: 0x886633, alpha: 0.35 },
      { radius: radius * 0.85, color: 0x997744, alpha: 0.3 },
      { radius: radius * 0.6, color: 0xaa8855, alpha: 0.25 },
    ];

    layerConfigs.forEach((config, i) => {
      const layer = scene.add.circle(player.x, player.y, config.radius, config.color, config.alpha);
      layer.setDepth(17 + i);
      sandLayers.push(layer);
    });

    // 沙尘粒子
    const sandParticles = scene.add.particles(player.x, player.y, 'particle_glow', {
      speed: { min: 20, max: 60 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.5, end: 0 },
      tint: [0x886633, 0x997744, 0xaa8855],
      lifespan: 1000,
      frequency: 60,
      quantity: 3,
      emitZone: {
        type: 'random' as const,
        source: new Phaser.Geom.Circle(0, 0, radius * 0.9) as Phaser.Types.GameObjects.Particles.RandomZoneSource,
      },
    });
    sandParticles.setDepth(22);

    // 漩涡旋转动画
    const vortex = scene.add.container(player.x, player.y);
    vortex.setDepth(18);
    for (let i = 0; i < 4; i++) {
      const ring = scene.add.graphics();
      ring.lineStyle(3 - i * 0.5, 0x997744, 0.5 - i * 0.1);
      ring.strokeCircle(0, 0, radius * (0.3 + i * 0.2));
      vortex.add(ring);
    }

    // 存储需要清理的 tweens
    const activeTweens: Phaser.Tweens.Tween[] = [];

    // 不同方向旋转
    vortex.list.forEach((ring, i) => {
      const tween = scene.tweens.add({
        targets: ring,
        angle: 360 * (i % 2 === 0 ? 1 : -1),
        duration: 1500 + i * 300,
        repeat: -1,
      });
      activeTweens.push(tween);
    });

    let elapsed = 0;
    const trapTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          trapTimer.destroy();
          // 停止所有无限重复的 tweens
          activeTweens.forEach(tween => {
            if (tween && tween.isPlaying()) {
              tween.stop();
            }
          });
          sandLayers.forEach(l => l.destroy());
          sandParticles.destroy();
          vortex.destroy();
          return;
        }

        const enemies = findEnemiesInRange(player.x, player.y, radius);
        for (const enemy of enemies) {
          applyDamageToEnemy(enemy, damage, skill);
          applyEffects(enemy, skill.effects);

          // 沙尘效果
          const dust = scene.add.circle(enemy.x, enemy.y, 10, 0x997744, 0.6);
          dust.setDepth(100);
          scene.tweens.add({
            targets: dust,
            scale: 1.5,
            alpha: 0,
            duration: 200,
            onComplete: () => dust.destroy(),
          });
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }
}

/**
 * 流沙陷阱视觉效果策略 - 增强版
 */
export class SandstormVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 多层流沙区域
    const sandLayers: Phaser.GameObjects.Arc[] = [];
    const layerConfigs = [
      { radius: radius * 1.1, color: 0x775522, alpha: 0.2 },
      { radius: radius, color: 0x886633, alpha: 0.3 },
      { radius: radius * 0.85, color: 0x997744, alpha: 0.25 },
    ];

    layerConfigs.forEach((config, i) => {
      const layer = scene.add.circle(x, y, config.radius, config.color, config.alpha);
      layer.setDepth(17 + i);
      sandLayers.push(layer);
    });

    // 漩涡旋转
    const vortex = scene.add.container(x, y);
    vortex.setDepth(18);
    for (let i = 0; i < 4; i++) {
      const ring = scene.add.graphics();
      ring.lineStyle(3 - i * 0.5, 0x997744, 0.4 - i * 0.1);
      ring.strokeCircle(0, 0, radius * (0.3 + i * 0.2));
      vortex.add(ring);
    }

    vortex.list.forEach((ring, i) => {
      scene.tweens.add({
        targets: ring,
        angle: 360 * (i % 2 === 0 ? 1 : -1),
        duration: 1500 + i * 300,
        repeat: 7,
      });
    });

    // 沙尘粒子
    VisualEffectUtils.createParticleBurst(scene, x, y, {
      count: 20,
      color: 0x997744,
      speed: { min: 30, max: 80 },
      scale: { start: 0.4, end: 0 },
      lifespan: 500,
    });

    scene.time.delayedCall(4000, () => {
      scene.tweens.add({
        targets: [...sandLayers, vortex],
        alpha: 0,
        duration: 400,
        onComplete: () => {
          sandLayers.forEach(l => l.destroy());
          vortex.destroy();
        },
      });
    });
  }
}

/**
 * 地裂线策略 - 直线地裂
 * 向指定方向裂开地面，击飞路径上敌人
 */
export class SeismicWaveStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const range = skill.rangeValue;
    const lineWidth = 60;
    const hitEnemies = new Set<string>();

    const enemies = findEnemiesInRange(player.x, player.y, range + 100);
    if (enemies.length === 0) return;

    let nearestEnemy: { x: number; y: number } | null = null;
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

    // 多层地裂视觉
    const crackOuter = scene.add.graphics();
    crackOuter.fillStyle(0x553311, 0.7);
    crackOuter.fillRect(0, -lineWidth / 2 - 10, range, lineWidth + 20);
    crackOuter.setPosition(player.x, player.y);
    crackOuter.setRotation(angle);
    crackOuter.setDepth(23);

    const crackMid = scene.add.graphics();
    crackMid.fillStyle(0x664422, 0.85);
    crackMid.fillRect(0, -lineWidth / 2, range, lineWidth);
    crackMid.setPosition(player.x, player.y);
    crackMid.setRotation(angle);
    crackMid.setDepth(24);

    const crackInner = scene.add.graphics();
    crackInner.fillStyle(0x886644, 0.9);
    crackInner.fillRect(0, -lineWidth / 2 + 10, range, lineWidth - 20);
    crackInner.setPosition(player.x, player.y);
    crackInner.setRotation(angle);
    crackInner.setDepth(25);

    // 岩石碎片
    const rocks: Phaser.GameObjects.Graphics[] = [];
    for (let i = 0; i < 8; i++) {
      const rock = scene.add.graphics();
      rock.fillStyle(0x886644, 0.9);
      const size = 8 + Math.random() * 6;
      rock.fillRect(-size / 2, -size / 2, size, size);
      rock.setPosition(
        player.x + Math.cos(angle) * (50 + i * 30) + (Math.random() - 0.5) * 40,
        player.y + Math.sin(angle) * (50 + i * 30) + (Math.random() - 0.5) * 40
      );
      rock.setDepth(40);
      rocks.push(rock);

      scene.tweens.add({
        targets: rock,
        y: rock.y - 30 - Math.random() * 20,
        angle: Math.random() * 360,
        alpha: 0,
        duration: 400,
        delay: i * 30,
        onComplete: () => rock.destroy(),
      });
    }

    crackOuter.setScale(0, 1);
    crackMid.setScale(0, 1);
    crackInner.setScale(0, 1);

    scene.tweens.add({
      targets: [crackOuter, crackMid, crackInner],
      scaleX: 1,
      duration: 350,
      onUpdate: () => {
        const enemiesInRange = findEnemiesInRange(player.x, player.y, range);
        for (const enemy of enemiesInRange) {
          if (hitEnemies.has(enemy.instanceId)) continue;
          const enemyAngle = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
          const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(enemyAngle - angle));
          if (angleDiff < 0.3) {
            hitEnemies.add(enemy.instanceId);
            applyDamageToEnemy(enemy, damage, skill);
            if (enemy.active && enemy.body) {
              enemy.x += Math.cos(angle) * 50;
              enemy.y += Math.sin(angle) * 50;
            }
          }
        }
      },
      onComplete: () => {
        VisualEffectUtils.createShockwave(scene, player.x + Math.cos(angle) * range / 2, player.y + Math.sin(angle) * range / 2, {
          color: 0x886644,
          radius: 60,
          rings: 3,
          duration: 300,
        });

        scene.tweens.add({
          targets: [crackOuter, crackMid, crackInner],
          alpha: 0,
          duration: 250,
          onComplete: () => {
            crackOuter.destroy();
            crackMid.destroy();
            crackInner.destroy();
          },
        });
      },
    });
  }
}

/**
 * 地裂线视觉效果策略 - 增强版
 */
export class SeismicWaveVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    const lineWidth = 60;

    // 多层地裂视觉
    const crackOuter = scene.add.graphics();
    crackOuter.fillStyle(0x553311, 0.6);
    crackOuter.fillRect(0, -lineWidth / 2 - 10, radius, lineWidth + 20);
    crackOuter.setPosition(x, y);
    crackOuter.setDepth(23);

    const crackMid = scene.add.graphics();
    crackMid.fillStyle(0x664422, 0.75);
    crackMid.fillRect(0, -lineWidth / 2, radius, lineWidth);
    crackMid.setPosition(x, y);
    crackMid.setDepth(24);

    const crackInner = scene.add.graphics();
    crackInner.fillStyle(0x886644, 0.85);
    crackInner.fillRect(0, -lineWidth / 2 + 10, radius, lineWidth - 20);
    crackInner.setPosition(x, y);
    crackInner.setDepth(25);

    // 岩石碎片
    for (let i = 0; i < 6; i++) {
      const rock = scene.add.graphics();
      rock.fillStyle(0x886644, 0.85);
      const size = 6 + Math.random() * 5;
      rock.fillRect(-size / 2, -size / 2, size, size);
      rock.setPosition(x + i * (radius / 6), y + (Math.random() - 0.5) * 40);
      rock.setDepth(40);

      scene.tweens.add({
        targets: rock,
        y: rock.y - 25,
        angle: Math.random() * 360,
        alpha: 0,
        duration: 350,
        delay: i * 40,
        onComplete: () => rock.destroy(),
      });
    }

    [crackOuter, crackMid, crackInner].forEach(crack => {
      crack.setScale(0, 1);
      scene.tweens.add({
        targets: crack,
        scaleX: 1,
        duration: 300,
        onComplete: () => {
          scene.tweens.add({
            targets: crack,
            alpha: 0,
            duration: 200,
            onComplete: () => crack.destroy(),
          });
        },
      });
    });

    // 冲击波
    VisualEffectUtils.createShockwave(scene, x + radius / 2, y, {
      color: 0x886644,
      radius: 50,
      rings: 2,
      duration: 250,
    });
  }
}
