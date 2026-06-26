import { SkillStrategy, VisualEffectStrategy, SkillExecutionContext } from '../../../SkillStrategy';
import { Skill } from '@/types';
import { VisualEffectUtils } from '@/graphics/VisualEffectUtils';
import Phaser from 'phaser';

/**
 * 冰墙策略 - 创建障碍物阻挡敌人
 */
export class IceWallStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, applyEffects } = context;
    const wallWidth = skill.rangeValue * 2;
    const wallHeight = 30;
    const duration = 5000;

    const playerAngle = (player as any).body?.angle || 0;
    const wallX = player.x + Math.cos(playerAngle) * 60;
    const wallY = player.y + Math.sin(playerAngle) * 60;

    // 多层冰墙视觉效果
    const wallOuter = scene.add.graphics();
    wallOuter.fillStyle(0x66ccff, 0.6);
    wallOuter.fillRoundedRect(-wallWidth / 2 - 5, -wallHeight / 2 - 5, wallWidth + 10, wallHeight + 10, 7);
    wallOuter.setPosition(wallX, wallY);
    wallOuter.setRotation(playerAngle);
    wallOuter.setDepth(23);

    const wallMid = scene.add.graphics();
    wallMid.fillStyle(0x88ddff, 0.75);
    wallMid.fillRoundedRect(-wallWidth / 2, -wallHeight / 2, wallWidth, wallHeight, 5);
    wallMid.setPosition(wallX, wallY);
    wallMid.setRotation(playerAngle);
    wallMid.setDepth(24);

    const wallInner = scene.add.graphics();
    wallInner.fillStyle(0xaaeeff, 0.85);
    wallInner.fillRoundedRect(-wallWidth / 2 + 5, -wallHeight / 2 + 5, wallWidth - 10, wallHeight - 10, 3);
    wallInner.setPosition(wallX, wallY);
    wallInner.setRotation(playerAngle);
    wallInner.setDepth(25);

    // 冰晶纹理
    const iceTexture = scene.add.graphics();
    iceTexture.lineStyle(1, 0xffffff, 0.5);
    for (let i = 0; i < 8; i++) {
      const startX = -wallWidth / 2 + (i + 1) * (wallWidth / 9);
      iceTexture.lineBetween(startX, -wallHeight / 2, startX + 5, wallHeight / 2);
    }
    iceTexture.setPosition(wallX, wallY);
    iceTexture.setRotation(playerAngle);
    iceTexture.setDepth(26);

    // 冰墙碰撞区域
    const hitArea = scene.add.rectangle(wallX, wallY, wallWidth, wallHeight, 0x000000, 0);
    hitArea.setRotation(playerAngle);

    // 冰霜光晕
    const frostAura = scene.add.circle(wallX, wallY, wallWidth / 2 + 20, 0x88ddff, 0.15);
    frostAura.setDepth(22);

    // 冻结附近的敌人
    const nearbyEnemies = findEnemiesInRange(wallX, wallY, wallWidth / 2 + 20);
    for (const enemy of nearbyEnemies) {
      applyDamageToEnemy(enemy, damage, skill);
      if (applyEffects && skill.effects) {
        const freezeEffect = skill.effects.find(e => e.type === 'freeze');
        if (freezeEffect) {
          applyEffects(enemy, [freezeEffect]);
        }
      }
    }

    // 冰晶粒子效果
    const iceParticles = scene.add.particles(wallX, wallY, 'particle_ice_crystal', {
      speed: { min: 20, max: 60 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: [0x88ddff, 0xaaeeff, 0xffffff],
      lifespan: 800,
      frequency: 100,
      quantity: 2,
      emitZone: {
        type: 'random' as const,
        source: new Phaser.Geom.Rectangle(-wallWidth / 2, -wallHeight / 2, wallWidth, wallHeight) as Phaser.Types.GameObjects.Particles.RandomZoneSource,
      },
    });
    iceParticles.setRotation(playerAngle);
    iceParticles.setDepth(27);

    // 冰墙脉动
    scene.tweens.add({
      targets: [frostAura],
      scale: 1.05,
      alpha: 0.2,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // 冰墙阻挡逻辑 - 检测接近冰墙的敌人并推开
    const blockCheckTimer = scene.time.addEvent({
      delay: 50, // 每50ms检测一次
      callback: () => {
        // 使用更大的检测范围确保覆盖整个冰墙
        const checkRadius = Math.max(wallWidth, wallHeight) / 2 + 50;
        const enemies = findEnemiesInRange(wallX, wallY, checkRadius);
        for (const enemy of enemies) {
          if (!enemy.active) continue;

          // 检查敌人是否在冰墙的碰撞范围内
          const dx = enemy.x - wallX;
          const dy = enemy.y - wallY;

          // 将坐标旋转到冰墙的本地坐标系
          const cos = Math.cos(-playerAngle);
          const sin = Math.sin(-playerAngle);
          const localX = dx * cos - dy * sin;
          const localY = dx * sin + dy * cos;

          // 检查敌人是否在冰墙矩形范围内（稍微扩大一点）
          const halfWidth = wallWidth / 2 + 20;
          const halfHeight = wallHeight / 2 + 20;

          if (Math.abs(localX) < halfWidth && Math.abs(localY) < halfHeight) {
            // 敌人在冰墙范围内，将其推开
            const pushAngle = Phaser.Math.Angle.Between(wallX, wallY, enemy.x, enemy.y);
            const pushDistance = 25;
            const newX = wallX + Math.cos(pushAngle) * pushDistance;
            const newY = wallY + Math.sin(pushAngle) * pushDistance;

            // 平滑推开敌人
            scene.tweens.add({
              targets: enemy,
              x: newX,
              y: newY,
              duration: 100,
              ease: 'Power1',
            });

            // 停止敌人的移动
            const body = (enemy as any).body;
            if (body) {
              body.setVelocity(0, 0);
            }
          }
        }
      },
      repeat: Math.floor(duration / 50) - 1,
    });

    // 持续时间后消失
    scene.time.delayedCall(duration, () => {
      blockCheckTimer.destroy();
      iceParticles.destroy();

      // 消散粒子
      VisualEffectUtils.createParticleBurst(scene, wallX, wallY, {
        count: 20,
        color: 0x88ddff,
        speed: { min: 50, max: 120 },
        scale: { start: 0.5, end: 0 },
        lifespan: 400,
        texture: 'particle_ice_crystal',
      });

      scene.tweens.add({
        targets: [wallOuter, wallMid, wallInner, iceTexture, frostAura, hitArea],
        alpha: 0,
        scale: 0.9,
        duration: 350,
        onComplete: () => {
          wallOuter.destroy();
          wallMid.destroy();
          wallInner.destroy();
          iceTexture.destroy();
          frostAura.destroy();
          hitArea.destroy();
        },
      });
    });
  }
}

export class IceWallVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 多层冰霜扩散
    const frostLayers: Phaser.GameObjects.Arc[] = [];
    const configs = [
      { radius: radius * 1.3, alpha: 0.1 },
      { radius: radius, alpha: 0.2 },
      { radius: radius * 0.7, alpha: 0.25 },
    ];

    configs.forEach((config, i) => {
      const frost = scene.add.circle(x, y, config.radius, 0x88ddff, config.alpha);
      frost.setDepth(22 + i);
      frostLayers.push(frost);
    });

    scene.tweens.add({
      targets: frostLayers,
      scaleX: 2.2,
      scaleY: 0.6,
      alpha: 0,
      duration: 350,
      onComplete: () => frostLayers.forEach(f => f.destroy()),
    });

    // 冰晶粒子
    for (let i = 0; i < 8; i++) {
      const crystal = scene.add.graphics();
      crystal.fillStyle(0xffffff, 0.85);
      crystal.fillTriangle(0, -8, -5, 5, 5, 5);
      crystal.fillStyle(0x88ddff, 0.7);
      crystal.fillTriangle(0, -5, -3, 3, 3, 3);
      crystal.setPosition(x + (i - 3.5) * 25, y - 25);
      crystal.setDepth(28);

      scene.tweens.add({
        targets: crystal,
        y: crystal.y + 50,
        angle: Math.random() * 30 - 15,
        alpha: 0,
        duration: 450,
        delay: i * 40,
        onComplete: () => crystal.destroy(),
      });
    }

    // 中心闪光
    VisualEffectUtils.createElementGlow(scene, x, y, {
      color: 0x88ddff,
      radius: 20,
      duration: 300,
      pulseCount: 1,
    });
  }
}
