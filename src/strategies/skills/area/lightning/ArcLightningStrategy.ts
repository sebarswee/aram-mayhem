import { SkillStrategy, VisualEffectStrategy, SkillExecutionContext } from '../../../SkillStrategy';
import { Skill } from '@/types';
import { Enemy } from '@/entities/Enemy';
import { VisualEffectUtils } from '@/graphics/VisualEffectUtils';
import Phaser from 'phaser';

/**
 * 电磁脉冲策略 - 环形扩散
 * 以玩家为中心释放脉冲波，对环形路径上的敌人造成伤害
 */
export class ArcLightningStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const range = skill.rangeValue;
    const pulseWidth = 40;
    const hitEnemies = new Set<string>();

    // 中心闪电爆发
    const centerBurst = scene.add.graphics();
    centerBurst.fillStyle(0xffffff, 0.95);
    centerBurst.fillCircle(player.x, player.y, 20);
    centerBurst.fillStyle(0xffff00, 0.9);
    centerBurst.fillCircle(player.x, player.y, 30);
    centerBurst.setDepth(98);

    scene.tweens.add({
      targets: centerBurst,
      scale: 1.5,
      alpha: 0,
      duration: 200,
      onComplete: () => centerBurst.destroy(),
    });

    // 多层脉冲环
    const pulses: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 4; i++) {
      const pulse = scene.add.circle(player.x, player.y, 25, 0xffff00, 0.5 - i * 0.1);
      pulse.setStrokeStyle(5 - i, 0xffffff, 0.9 - i * 0.15);
      pulse.setDepth(99 + i);
      pulses.push(pulse);
    }

    // 电荷粒子
    const chargeParticles = scene.add.particles(player.x, player.y, 'particle_lightning_arc', {
      speed: { min: 100, max: 250 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.8, end: 0 },
      tint: [0xffff00, 0xffffff, 0xffffaa],
      lifespan: 300,
      frequency: 20,
      quantity: 5,
    });
    chargeParticles.setDepth(103);

    scene.tweens.add({
      targets: pulses,
      radius: range,
      alpha: 0,
      duration: 650,
      onUpdate: function () {
        const currentRadius = (pulses[0] as any).radius;
        const enemies = findEnemiesInRange(player.x, player.y, currentRadius + pulseWidth);
        for (const enemy of enemies) {
          const dist = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
          if (dist >= currentRadius - pulseWidth && dist <= currentRadius + pulseWidth) {
            if (!hitEnemies.has(enemy.instanceId)) {
              hitEnemies.add(enemy.instanceId);
              applyDamageToEnemy(enemy, damage, skill);

              // 电击效果
              const shock = scene.add.circle(enemy.x, enemy.y, 20, 0xffff00, 0.7);
              shock.setDepth(110);
              scene.tweens.add({
                targets: shock,
                scale: 1.3,
                alpha: 0,
                duration: 150,
                onComplete: () => shock.destroy(),
              });
            }
          }
        }
      },
      onComplete: () => {
        pulses.forEach(p => p.destroy());
        chargeParticles.destroy();

        // 终点冲击波
        VisualEffectUtils.createShockwave(scene, player.x, player.y, {
          color: 0xffff00,
          radius: range,
          rings: 3,
          duration: 350,
        });
      },
    });
  }
}

/**
 * 电磁脉冲视觉效果策略 - 增强版
 */
export class ArcLightningVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 中心闪光
    const flash = scene.add.circle(x, y, 25, 0xffffff, 0.9);
    flash.setDepth(98);
    scene.tweens.add({
      targets: flash,
      scale: 1.5,
      alpha: 0,
      duration: 150,
      onComplete: () => flash.destroy(),
    });

    // 多层脉冲环
    const pulses: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 3; i++) {
      const pulse = scene.add.circle(x, y, 25, 0xffff00, 0.5 - i * 0.12);
      pulse.setStrokeStyle(5 - i, 0xffffff, 0.85 - i * 0.15);
      pulse.setDepth(99 + i);
      pulses.push(pulse);
    }

    scene.tweens.add({
      targets: pulses,
      radius: radius,
      alpha: 0,
      duration: 600,
      onComplete: () => pulses.forEach(p => p.destroy()),
    });

    // 电荷粒子
    VisualEffectUtils.createParticleBurst(scene, x, y, {
      count: 25,
      color: 0xffff00,
      speed: { min: 100, max: 200 },
      scale: { start: 0.5, end: 0 },
      lifespan: 350,
      texture: 'particle_lightning_arc',
    });
  }
}

/**
 * 电荷积累策略 - 叠加机制
 * 对范围内敌人施加电荷，2层时爆发大量伤害
 */
export class StaticFieldStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const range = skill.rangeValue;
    const maxStacks = 2;
    const enemies = findEnemiesInRange(player.x, player.y, range);
    if (enemies.length === 0) return;

    // 多层电弧
    const arcOuter = scene.add.graphics();
    arcOuter.lineStyle(6, 0xffff00, 0.4);
    arcOuter.setDepth(97);

    const arcMid = scene.add.graphics();
    arcMid.lineStyle(3, 0xffff00, 0.7);
    arcMid.setDepth(98);

    const arcCore = scene.add.graphics();
    arcCore.lineStyle(1, 0xffffff, 1);
    arcCore.setDepth(99);

    let prevX = player.x;
    let prevY = player.y;

    enemies.forEach((enemy) => {
      arcOuter.lineBetween(prevX, prevY, enemy.x, enemy.y);
      arcMid.lineBetween(prevX, prevY, enemy.x, enemy.y);
      arcCore.lineBetween(prevX, prevY, enemy.x, enemy.y);
      prevX = enemy.x;
      prevY = enemy.y;

      if (!(enemy as any).chargeStacks) (enemy as any).chargeStacks = 0;
      (enemy as any).chargeStacks++;

      // 电荷标记
      const chargeMark = scene.add.graphics();
      chargeMark.fillStyle(0xffff00, 0.8);
      chargeMark.strokeCircle(0, 0, 12);
      chargeMark.strokeCircle(0, 0, 8);
      chargeMark.setPosition(enemy.x, enemy.y - 35);
      chargeMark.setDepth(100);

      const chargeText = scene.add.text(enemy.x, enemy.y - 35, `⚡${(enemy as any).chargeStacks}`, {
        fontSize: '14px',
        color: '#ffff00',
        fontStyle: 'bold',
      });
      chargeText.setOrigin(0.5);
      chargeText.setDepth(101);

      if ((enemy as any).chargeStacks >= maxStacks) {
        // 多层爆发效果
        const burstOuter = scene.add.circle(enemy.x, enemy.y, 60, 0xffff00, 0.5);
        const burstMid = scene.add.circle(enemy.x, enemy.y, 45, 0xffffff, 0.7);
        const burstInner = scene.add.circle(enemy.x, enemy.y, 30, 0xffffff, 0.9);
        burstOuter.setDepth(102);
        burstMid.setDepth(103);
        burstInner.setDepth(104);

        applyDamageToEnemy(enemy, damage * 2, skill);
        (enemy as any).chargeStacks = 0;

        // 粒子爆发
        VisualEffectUtils.createParticleBurst(scene, enemy.x, enemy.y, {
          count: 20,
          color: 0xffff00,
          speed: { min: 100, max: 200 },
          scale: { start: 0.6, end: 0 },
          lifespan: 300,
          texture: 'particle_lightning_arc',
        });

        scene.tweens.add({
          targets: [burstOuter, burstMid, burstInner, chargeMark, chargeText],
          alpha: 0,
          scale: 1.5,
          duration: 250,
          onComplete: () => {
            burstOuter.destroy();
            burstMid.destroy();
            burstInner.destroy();
            chargeMark.destroy();
            chargeText.destroy();
          },
        });
      } else {
        scene.tweens.add({
          targets: [chargeMark, chargeText],
          alpha: 0,
          y: enemy.y - 55,
          duration: 500,
          onComplete: () => {
            chargeMark.destroy();
            chargeText.destroy();
          },
        });
      }

      applyDamageToEnemy(enemy, damage * 0.5, skill);
    });

    scene.time.delayedCall(250, () => {
      arcOuter.destroy();
      arcMid.destroy();
      arcCore.destroy();
    });
  }
}

/**
 * 暗影分身策略 - 分身机制
 * 在当前位置留下暗影分身，吸引敌人攻击
 */
export class ShadowStepStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;

    // 使用玩家精灵表创建分身
    const clone = scene.add.container(player.x, player.y);
    clone.setDepth(40);

    // 尝试使用玩家精灵表图片
    if (scene.textures.exists('player_idle')) {
      const sprite = scene.add.sprite(0, 0, 'player_idle', 0);
      sprite.setTint(0x8800ff); // 暗影紫色
      sprite.setAlpha(0.7);
      clone.add(sprite);

      // 播放待机动画
      if (scene.anims.exists('player_idle_anim')) {
        sprite.play('player_idle_anim');
      }
    } else {
      // 回退到程序生成的圆形
      const bodyOuter = scene.add.circle(0, 0, 22, 0x4400aa, 0.35);
      const bodyMid = scene.add.circle(0, 0, 17, 0x6600cc, 0.5);
      const bodyInner = scene.add.circle(0, 0, 12, 0x8800ff, 0.7);
      const bodyCore = scene.add.circle(0, 0, 6, 0xaa44ff, 0.9);
      clone.add([bodyOuter, bodyMid, bodyInner, bodyCore]);
    }

    // 存储需要清理的 tweens
    const activeTweens: Phaser.Tweens.Tween[] = [];

    // 脉动效果
    const pulseTween = scene.tweens.add({
      targets: clone,
      alpha: 0.5,
      scale: 1.05,
      duration: 300,
      yoyo: true,
      repeat: -1,
    });
    activeTweens.push(pulseTween);

    const cloneDuration = 3000;
    const attractTimer = scene.time.addEvent({
      delay: 200,
      callback: () => {
        const enemies = findEnemiesInRange(clone.x, clone.y, 80);
        for (const enemy of enemies) {
          const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, clone.x, clone.y);
          if (enemy.active && enemy.body) {
            enemy.x += Math.cos(angle) * 10;
            enemy.y += Math.sin(angle) * 10;
          }
        }
      },
      repeat: cloneDuration / 200 - 1,
    });

    scene.time.delayedCall(cloneDuration, () => {
      attractTimer.destroy();
      // 停止无限重复的 tweens
      activeTweens.forEach(tween => {
        if (tween && tween.isPlaying()) {
          tween.stop();
        }
      });

      // 消散粒子
      VisualEffectUtils.createParticleBurst(scene, clone.x, clone.y, {
        count: 15,
        color: 0x8800ff,
        speed: { min: 50, max: 120 },
        scale: { start: 0.5, end: 0 },
        lifespan: 300,
      });

      scene.tweens.add({
        targets: clone,
        alpha: 0,
        scale: 0.5,
        duration: 300,
        onComplete: () => clone.destroy(),
      });
    });
  }
}

/**
 * 暗影分身视觉效果策略 - 增强版
 */
export class ShadowStepVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, _radius: number, _element?: string): void {
    const clone = scene.add.container(x, y);
    clone.setDepth(40);

    const bodyOuter = scene.add.circle(0, 0, 22, 0x4400aa, 0.3);
    const bodyMid = scene.add.circle(0, 0, 17, 0x6600cc, 0.45);
    const bodyInner = scene.add.circle(0, 0, 12, 0x8800ff, 0.65);
    const bodyCore = scene.add.circle(0, 0, 6, 0xaa44ff, 0.85);
    clone.add([bodyOuter, bodyMid, bodyInner, bodyCore]);

    // 存储无限循环 tween 以便清理
    const pulseTween = scene.tweens.add({
      targets: clone,
      alpha: 0.6,
      scale: 1.08,
      duration: 300,
      yoyo: true,
      repeat: -1,
    });

    scene.time.delayedCall(3000, () => {
      // 停止无限循环的脉动 tween
      if (pulseTween && pulseTween.isPlaying()) {
        pulseTween.stop();
      }
      scene.tweens.add({
        targets: clone,
        alpha: 0,
        scale: 0.5,
        duration: 300,
        onComplete: () => clone.destroy(),
      });
    });
  }
}

/**
 * 聚焦灼烧策略 - 单体高伤害，命中附加燃烧
 */
export class IgniteStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const range = skill.rangeValue;

    const enemies = findEnemiesInRange(player.x, player.y, range);
    if (enemies.length === 0) return;

    let target: Enemy | null = null;
    let minDist = Infinity;
    for (const enemy of enemies) {
      const dist = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
      if (dist < minDist) {
        minDist = dist;
        target = enemy;
      }
    }

    if (!target) return;

    // 多层聚焦光束
    const beamOuter = scene.add.graphics();
    beamOuter.lineStyle(60, 0xff4400, 0.4);
    beamOuter.lineBetween(player.x, player.y, target.x, target.y);
    beamOuter.setDepth(38);

    const beamMid = scene.add.graphics();
    beamMid.lineStyle(35, 0xff6600, 0.65);
    beamMid.lineBetween(player.x, player.y, target.x, target.y);
    beamMid.setDepth(39);

    const beamInner = scene.add.graphics();
    beamInner.lineStyle(15, 0xffaa00, 0.85);
    beamInner.lineBetween(player.x, player.y, target.x, target.y);
    beamInner.setDepth(40);

    const beamCore = scene.add.graphics();
    beamCore.lineStyle(5, 0xffffff, 1);
    beamCore.lineBetween(player.x, player.y, target.x, target.y);
    beamCore.setDepth(41);

    // 命中点多层闪光
    const flashOuter = scene.add.circle(target.x, target.y, 50, 0xff4400, 0.5);
    const flashMid = scene.add.circle(target.x, target.y, 35, 0xff6600, 0.7);
    const flashInner = scene.add.circle(target.x, target.y, 20, 0xffffff, 0.9);
    flashOuter.setDepth(42);
    flashMid.setDepth(43);
    flashInner.setDepth(44);

    // 火焰粒子
    VisualEffectUtils.createParticleBurst(scene, target.x, target.y, {
      count: 25,
      color: 0xff6600,
      speed: { min: 80, max: 180 },
      scale: { start: 0.6, end: 0 },
      lifespan: 350,
      texture: 'particle_fire_core',
    });

    applyDamageToEnemy(target, damage, skill);

    scene.tweens.add({
      targets: [beamOuter, beamMid, beamInner, beamCore, flashOuter, flashMid, flashInner],
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 350,
      onComplete: () => {
        beamOuter.destroy();
        beamMid.destroy();
        beamInner.destroy();
        beamCore.destroy();
        flashOuter.destroy();
        flashMid.destroy();
        flashInner.destroy();
      },
    });
  }
}

/**
 * 聚焦灼烧视觉效果策略
 */
export class IgniteVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 多层光束
    const beams = [
      { width: 60, color: 0xff4400, alpha: 0.35, depth: 38 },
      { width: 35, color: 0xff6600, alpha: 0.6, depth: 39 },
      { width: 15, color: 0xffaa00, alpha: 0.8, depth: 40 },
      { width: 5, color: 0xffffff, alpha: 1, depth: 41 },
    ];

    const beamGraphics: Phaser.GameObjects.Graphics[] = [];
    beams.forEach(config => {
      const beam = scene.add.graphics();
      beam.lineStyle(config.width, config.color, config.alpha);
      beam.lineBetween(x, y, x + radius, y);
      beam.setDepth(config.depth);
      beamGraphics.push(beam);
    });

    // 命中点闪光
    VisualEffectUtils.createElementGlow(scene, x + radius, y, {
      color: 0xff6600,
      radius: 30,
      duration: 350,
      pulseCount: 1,
    });

    scene.tweens.add({
      targets: beamGraphics,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 350,
      onComplete: () => beamGraphics.forEach(b => b.destroy()),
    });
  }
}
