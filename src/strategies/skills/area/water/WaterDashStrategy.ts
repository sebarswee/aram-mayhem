import { SkillStrategy, VisualEffectStrategy, SkillExecutionContext } from '../../../SkillStrategy';
import { Skill } from '@/types';
import { VisualEffectUtils } from '@/graphics/VisualEffectUtils';
import Phaser from 'phaser';

/**
 * 水流冲刺策略 - 向前冲刺并留下减速水迹
 */
export class WaterDashStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, applyEffects } = context;
    const dashDistance = skill.rangeValue;
    const trailWidth = 60;

    const playerAngle = (player as any).body?.angle || 0;
    const dashX = player.x + Math.cos(playerAngle) * dashDistance;
    const dashY = player.y + Math.sin(playerAngle) * dashDistance;

    // 起始冲击波
    VisualEffectUtils.createShockwave(scene, player.x, player.y, {
      color: 0x4488ff,
      radius: 40,
      rings: 2,
      duration: 250,
    });

    // 多层水迹轨迹
    const trailOuter = scene.add.graphics();
    trailOuter.fillStyle(0x2266cc, 0.25);
    trailOuter.fillRect(
      player.x - dashDistance / 2 - trailWidth / 2 - 10,
      player.y - trailWidth / 2 - 10,
      dashDistance + trailWidth + 20,
      trailWidth + 20
    );
    trailOuter.setDepth(16);

    const trailMid = scene.add.graphics();
    trailMid.fillStyle(0x4488ff, 0.35);
    trailMid.fillRect(
      player.x - dashDistance / 2 - trailWidth / 2,
      player.y - trailWidth / 2,
      dashDistance + trailWidth,
      trailWidth
    );
    trailMid.setDepth(17);

    const trailInner = scene.add.graphics();
    trailInner.fillStyle(0x66aaff, 0.45);
    trailInner.fillRect(
      player.x - dashDistance / 2 - trailWidth / 2 + 10,
      player.y - trailWidth / 2 + 10,
      dashDistance + trailWidth - 20,
      trailWidth - 20
    );
    trailInner.setDepth(18);

    // 水花粒子
    const splashParticles = scene.add.particles(
      player.x,
      player.y,
      'particle_glow',
      {
        speed: { min: 50, max: 120 },
        angle: { min: 60, max: 120 },
        scale: { start: 0.4, end: 0 },
        alpha: { start: 0.6, end: 0 },
        tint: [0x4488ff, 0x66aaff, 0x88ccff],
        lifespan: 600,
        frequency: 50,
        quantity: 2,
      }
    );
    splashParticles.setRotation(playerAngle);
    splashParticles.setDepth(19);

    // 冲刺路径上的敌人
    const enemies = findEnemiesInRange(
      (player.x + dashX) / 2,
      (player.y + dashY) / 2,
      dashDistance / 2 + trailWidth
    );

    for (const enemy of enemies) {
      const dist = Phaser.Math.Distance.BetweenPoints(
        { x: player.x, y: player.y },
        { x: enemy.x, y: enemy.y }
      );
      const angle = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
      const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(angle - playerAngle));

      if (dist <= dashDistance + 30 && angleDiff < Math.PI / 4) {
        applyDamageToEnemy(enemy, damage, skill);
        if (applyEffects && skill.effects) {
          applyEffects(enemy, skill.effects);
        }

        // 水花溅射
        const splash = scene.add.circle(enemy.x, enemy.y, 18, 0x4488ff, 0.6);
        splash.setDepth(100);
        scene.tweens.add({
          targets: splash,
          scale: 1.4,
          alpha: 0,
          duration: 200,
          onComplete: () => splash.destroy(),
        });
      }
    }

    // 移动玩家
    player.x = dashX;
    player.y = dashY;
    if (player.body) {
      player.body.x = dashX;
      player.body.y = dashY;
    }

    // 终点冲击波
    VisualEffectUtils.createShockwave(scene, dashX, dashY, {
      color: 0x4488ff,
      radius: 50,
      rings: 3,
      duration: 300,
    });

    // 消失动画
    scene.tweens.add({
      targets: [trailOuter, trailMid, trailInner, splashParticles],
      alpha: 0,
      duration: 2000,
      onComplete: () => {
        trailOuter.destroy();
        trailMid.destroy();
        trailInner.destroy();
        splashParticles.destroy();
      },
    });
  }
}

export class WaterDashVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 多层水花扩散
    const splashLayers: Phaser.GameObjects.Arc[] = [];
    const configs = [
      { radius: radius * 1.3, color: 0x2266cc, alpha: 0.15 },
      { radius: radius, color: 0x4488ff, alpha: 0.25 },
      { radius: radius * 0.7, color: 0x66aaff, alpha: 0.35 },
    ];

    configs.forEach((config, i) => {
      const splash = scene.add.circle(x, y, config.radius, config.color, config.alpha);
      splash.setDepth(16 + i);
      splashLayers.push(splash);
    });

    scene.tweens.add({
      targets: splashLayers,
      scaleX: 2.5,
      scaleY: 2.5,
      alpha: 0,
      duration: 450,
      onComplete: () => splashLayers.forEach(s => s.destroy()),
    });

    // 水花粒子
    VisualEffectUtils.createParticleBurst(scene, x, y, {
      count: 20,
      color: 0x4488ff,
      speed: { min: 80, max: 180 },
      scale: { start: 0.5, end: 0 },
      lifespan: 400,
    });
  }
}
