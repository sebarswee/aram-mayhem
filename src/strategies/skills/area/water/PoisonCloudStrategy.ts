import { SkillStrategy, VisualEffectStrategy, SkillExecutionContext } from '../../../SkillStrategy';
import { Skill } from '@/types';
import { VisualEffectUtils } from '@/graphics/VisualEffectUtils';
import Phaser from 'phaser';

/**
 * 毒雾策略 - 持续范围伤害
 * 在玩家周围释放毒雾，持续3秒，每0.5秒造成伤害
 */
export class PoisonCloudStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, applyEffects } = context;
    const centerX = player.x;
    const centerY = player.y;
    const radius = skill.rangeValue;
    const duration = 3000;
    const tickInterval = 500;

    // 多层毒雾区域
    const poisonLayers: Phaser.GameObjects.Arc[] = [];
    const layerConfigs = [
      { radius: radius * 1.1, color: 0x22aa22, alpha: 0.15 },
      { radius: radius, color: 0x44cc44, alpha: 0.25 },
      { radius: radius * 0.8, color: 0x66ee66, alpha: 0.2 },
    ];

    layerConfigs.forEach((config, i) => {
      const layer = scene.add.circle(centerX, centerY, config.radius, config.color, config.alpha);
      layer.setDepth(17 + i);
      poisonLayers.push(layer);
    });

    // 毒雾粒子系统
    const poisonParticles = scene.add.particles(centerX, centerY, 'particle_glow', {
      speed: { min: 20, max: 60 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: [0x44ff44, 0x66ff66, 0x88ff88, 0xaaffaa],
      lifespan: 1200,
      frequency: 80,
      quantity: 3,
      emitZone: {
        type: 'random' as const,
        source: new Phaser.Geom.Circle(0, 0, radius * 0.9) as Phaser.Types.GameObjects.Particles.RandomZoneSource,
      },
    });
    poisonParticles.setDepth(20);

    // 毒气上升粒子
    const risingParticles = scene.add.particles(centerX, centerY, 'particle_glow', {
      speed: { min: 30, max: 60 },
      angle: { min: 250, max: 290 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.5, end: 0 },
      tint: [0x44ff44, 0x66ff66],
      lifespan: 1500,
      frequency: 100,
      quantity: 2,
      emitZone: {
        type: 'random' as const,
        source: new Phaser.Geom.Circle(0, 0, radius) as Phaser.Types.GameObjects.Particles.RandomZoneSource,
      },
    });
    risingParticles.setDepth(21);

    // 存储需要清理的 tweens
    const activeTweens: Phaser.Tweens.Tween[] = [];

    // 层级脉动动画
    poisonLayers.forEach((layer, i) => {
      const tween = scene.tweens.add({
        targets: layer,
        scaleX: 1.08,
        scaleY: 1.08,
        alpha: layer.alpha * 0.6,
        duration: 400 + i * 100,
        yoyo: true,
        repeat: -1,
      });
      activeTweens.push(tween);
    });

    let tickCount = 0;
    const maxTicks = Math.floor(duration / tickInterval);

    const damageTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        tickCount++;

        // 检测范围内敌人
        const enemies = findEnemiesInRange(centerX, centerY, radius);
        for (const enemy of enemies) {
          const tickDamage = Math.floor(damage * 0.3);
          applyDamageToEnemy(enemy, tickDamage, skill);
          if (applyEffects && skill.effects) {
            applyEffects(enemy, skill.effects);
          }

          // 中毒效果
          const poisonEffect = scene.add.circle(enemy.x, enemy.y, 12, 0x44ff44, 0.6);
          poisonEffect.setDepth(100);
          scene.tweens.add({
            targets: poisonEffect,
            scale: 1.5,
            alpha: 0,
            duration: 300,
            onComplete: () => poisonEffect.destroy(),
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
      poisonParticles.destroy();
      risingParticles.destroy();
      poisonLayers.forEach(l => l.destroy());
    });
  }
}

/**
 * 毒雾视觉效果策略 - 增强版
 */
export class PoisonCloudVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 多层毒雾区域
    const poisonLayers: Phaser.GameObjects.Arc[] = [];
    const layerConfigs = [
      { radius: radius * 1.1, color: 0x22aa22, alpha: 0.12 },
      { radius: radius, color: 0x44cc44, alpha: 0.2 },
      { radius: radius * 0.8, color: 0x66ee66, alpha: 0.15 },
    ];

    layerConfigs.forEach((config, i) => {
      const layer = scene.add.circle(x, y, config.radius, config.color, config.alpha);
      layer.setDepth(17 + i);
      poisonLayers.push(layer);
    });

    // 毒雾波动效果
    poisonLayers.forEach((layer, i) => {
      scene.tweens.add({
        targets: layer,
        scaleX: 1.1,
        scaleY: 1.1,
        alpha: layer.alpha * 0.5,
        duration: 500,
        yoyo: true,
        repeat: 5,
      });
    });

    // 毒气粒子
    const poisonParticles = scene.add.particles(x, y, 'particle_glow', {
      speed: { min: 20, max: 50 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.5, end: 0 },
      tint: [0x44ff44, 0x66ff66, 0x88ff88],
      lifespan: 1500,
      frequency: 80,
      quantity: 3,
      emitZone: {
        type: 'random' as const,
        source: new Phaser.Geom.Circle(0, 0, radius * 0.9) as Phaser.Types.GameObjects.Particles.RandomZoneSource,
      },
    });
    poisonParticles.setDepth(20);

    // 上升毒气泡
    for (let i = 0; i < 8; i++) {
      const offsetX = Phaser.Math.Between(-radius * 0.6, radius * 0.6);
      const offsetY = Phaser.Math.Between(-radius * 0.6, radius * 0.6);
      const bubble = scene.add.circle(x + offsetX, y + offsetY, 12, 0x44ff44, 0.5);
      bubble.setDepth(21);

      scene.tweens.add({
        targets: bubble,
        y: bubble.y - 50,
        alpha: 0,
        duration: 1500 + Math.random() * 500,
        delay: i * 150,
        repeat: 1,
        onComplete: () => bubble.destroy(),
      });
    }

    // 定时清理
    scene.time.delayedCall(3000, () => {
      scene.tweens.add({
        targets: [...poisonLayers, poisonParticles],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          poisonLayers.forEach(l => l.destroy());
          poisonParticles.destroy();
        },
      });
    });
  }
}
