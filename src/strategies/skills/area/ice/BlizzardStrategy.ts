import { SkillStrategy, VisualEffectStrategy, SkillExecutionContext } from '../../../SkillStrategy';
import { Skill } from '@/types';
import { VisualEffectUtils } from '@/graphics/VisualEffectUtils';
import Phaser from 'phaser';

/**
 * 暴风雪策略 - 持续范围伤害
 * 在玩家周围召唤暴风雪，持续3秒，每0.5秒造成伤害并冻结
 */
export class BlizzardStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, applyEffects, applyLifesteal } = context;
    const centerX = player.x;
    const centerY = player.y;
    const radius = skill.rangeValue;
    const duration = 3000;
    const tickInterval = 500;

    // 多层霜冻区域
    const frostLayers: Phaser.GameObjects.Arc[] = [];
    const layerConfigs = [
      { radius: radius * 1.1, color: 0x66ccff, alpha: 0.12 },
      { radius: radius, color: 0x88ddff, alpha: 0.18 },
      { radius: radius * 0.85, color: 0xaaeeff, alpha: 0.15 },
    ];

    // 存储所有需要清理的 tweens
    const activeTweens: Phaser.Tweens.Tween[] = [];

    layerConfigs.forEach((config, i) => {
      const layer = scene.add.circle(centerX, centerY, config.radius, config.color, config.alpha);
      layer.setDepth(17 + i);
      frostLayers.push(layer);

      // 脉动动画 - 存储引用
      const tween = scene.tweens.add({
        targets: layer,
        scaleX: 1.05,
        scaleY: 1.05,
        alpha: config.alpha * 0.6,
        duration: 400,
        yoyo: true,
        repeat: -1,
      });
      activeTweens.push(tween);
    });

    // 霜冻粒子系统
    const frostParticles = scene.add.particles(centerX, centerY, 'particle_ice_crystal', {
      speed: { min: 30, max: 80 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.7, end: 0 },
      tint: [0x88ddff, 0xaaeeff, 0xffffff],
      lifespan: 1200,
      frequency: 60,
      quantity: 3,
      emitZone: {
        type: 'random' as const,
        source: new Phaser.Geom.Circle(0, 0, radius * 0.9) as Phaser.Types.GameObjects.Particles.RandomZoneSource,
      },
    });
    frostParticles.setDepth(20);

    // 雪花飘落
    const snowParticles = scene.add.particles(centerX, centerY, 'particle_glow', {
      speed: { min: 20, max: 50 },
      angle: { min: 200, max: 340 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: [0xffffff, 0xeeffff, 0xddffff],
      lifespan: 2000,
      frequency: 80,
      quantity: 2,
      emitZone: {
        type: 'random' as const,
        source: new Phaser.Geom.Circle(0, 0, radius) as Phaser.Types.GameObjects.Particles.RandomZoneSource,
      },
    });
    snowParticles.setDepth(21);

    // 旋风效果
    const vortex = scene.add.container(centerX, centerY);
    vortex.setDepth(19);
    for (let i = 0; i < 3; i++) {
      const ring = scene.add.graphics();
      ring.lineStyle(2 - i * 0.5, 0x88ddff, 0.4 - i * 0.1);
      ring.strokeCircle(0, 0, radius * (0.4 + i * 0.2));
      vortex.add(ring);

      // 存储旋转动画引用
      const rotationTween = scene.tweens.add({
        targets: ring,
        angle: 360 * (i % 2 === 0 ? 1 : -1),
        duration: 2000 + i * 500,
        repeat: -1,
      });
      activeTweens.push(rotationTween);
    }

    let tickCount = 0;
    const maxTicks = Math.floor(duration / tickInterval);

    const damageTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        tickCount++;

        const enemies = findEnemiesInRange(centerX, centerY, radius);
        for (const enemy of enemies) {
          const tickDamage = Math.floor(damage * 0.3);
          applyDamageToEnemy(enemy, tickDamage, skill);
          if (applyEffects && skill.effects) {
            applyEffects(enemy, skill.effects);
          }
          if (applyLifesteal) {
            applyLifesteal(tickDamage);
          }

          // 冰霜效果
          const frost = scene.add.circle(enemy.x, enemy.y, 15, 0x88ddff, 0.6);
          frost.setDepth(100);
          scene.tweens.add({
            targets: frost,
            scale: 1.3,
            alpha: 0,
            duration: 250,
            onComplete: () => frost.destroy(),
          });
        }
      },
      repeat: maxTicks - 1,
    });

    // 使用 delayedCall 确保清理逻辑一定会执行
    scene.time.delayedCall(duration, () => {
      damageTimer.destroy();
      // 停止所有无限重复的 tweens
      activeTweens.forEach(tween => {
        if (tween && tween.isPlaying()) {
          tween.stop();
        }
      });
      frostParticles.destroy();
      snowParticles.destroy();
      frostLayers.forEach(l => l.destroy());
      vortex.destroy();
    });
  }
}

/**
 * 暴风雪视觉效果策略 - 增强版
 */
export class BlizzardVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 多层霜冻区域
    const frostLayers: Phaser.GameObjects.Arc[] = [];
    const layerConfigs = [
      { radius: radius * 1.1, color: 0x66ccff, alpha: 0.1 },
      { radius: radius, color: 0x88ddff, alpha: 0.15 },
      { radius: radius * 0.85, color: 0xaaeeff, alpha: 0.12 },
    ];

    layerConfigs.forEach((config, i) => {
      const layer = scene.add.circle(x, y, config.radius, config.color, config.alpha);
      layer.setDepth(17 + i);
      frostLayers.push(layer);
    });

    // 脉动效果
    frostLayers.forEach((layer, i) => {
      scene.tweens.add({
        targets: layer,
        scaleX: 1.08,
        scaleY: 1.08,
        alpha: layer.alpha * 0.5,
        duration: 500,
        yoyo: true,
        repeat: 5,
      });
    });

    // 雪花粒子
    const snowflakes: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 25; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.FloatBetween(0, radius * 0.9);
      const startX = x + Math.cos(angle) * dist;
      const startY = y + Math.sin(angle) * dist;
      const size = Phaser.Math.Between(3, 7);

      const snowflake = scene.add.circle(startX, startY, size, 0xffffff, 0.85);
      snowflake.setDepth(20 + (i % 3));
      snowflakes.push(snowflake);

      // 雪花飘动动画
      scene.tweens.add({
        targets: snowflake,
        y: snowflake.y - Phaser.Math.Between(40, 80),
        x: snowflake.x + Phaser.Math.Between(-30, 30),
        alpha: 0,
        rotation: Phaser.Math.FloatBetween(-1, 1),
        duration: Phaser.Math.Between(1200, 1800),
        delay: i * 30,
        repeat: 1,
        onComplete: () => snowflake.destroy(),
      });
    }

    // 旋风效果
    const vortex = scene.add.container(x, y);
    vortex.setDepth(19);
    for (let i = 0; i < 3; i++) {
      const ring = scene.add.graphics();
      ring.lineStyle(2 - i * 0.5, 0x88ddff, 0.35 - i * 0.1);
      ring.strokeCircle(0, 0, radius * (0.3 + i * 0.2));
      vortex.add(ring);
    }

    scene.tweens.add({
      targets: vortex.list,
      angle: 360,
      duration: 2000,
      repeat: 5,
    });

    // 定时清理
    scene.time.delayedCall(3000, () => {
      scene.tweens.add({
        targets: [...frostLayers, vortex],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          frostLayers.forEach(l => l.destroy());
          vortex.destroy();
        },
      });
    });
  }
}
