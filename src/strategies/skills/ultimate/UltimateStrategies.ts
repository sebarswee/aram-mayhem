import { SkillStrategy, VisualEffectStrategy, SkillExecutionContext } from '../../SkillStrategy';
import { Skill } from '@/types';
import { Enemy } from '@/entities/Enemy';
import { VisualEffectUtils } from '@/graphics/VisualEffectUtils';
import Phaser from 'phaser';

/**
 * 炎龙吐息策略 - 扇形持续火焰
 */
export class DragonBreathStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, findNearestEnemy } = context;
    const duration = 2000;
    const tickInterval = 200;
    const range = skill.rangeValue;
    const angleSpread = Math.PI / 3;

    const nearestEnemy = findNearestEnemy(player.x, player.y, range + 100);
    const playerAngle = nearestEnemy
      ? Phaser.Math.Angle.Between(player.x, player.y, nearestEnemy.x, nearestEnemy.y)
      : 0;

    // 多层火焰锥形
    const breathLayers: Phaser.GameObjects.Graphics[] = [];
    const layerConfigs = [
      { radius: range * 1.1, color: 0xff2200, alpha: 0.2 },
      { radius: range, color: 0xff4400, alpha: 0.35 },
      { radius: range * 0.8, color: 0xff6600, alpha: 0.5 },
      { radius: range * 0.5, color: 0xffaa00, alpha: 0.65 },
    ];

    layerConfigs.forEach((config, i) => {
      const breath = scene.add.graphics();
      breath.fillStyle(config.color, config.alpha);
      breath.beginPath();
      breath.moveTo(player.x, player.y);
      breath.arc(player.x, player.y, config.radius, playerAngle - angleSpread / 2, playerAngle + angleSpread / 2);
      breath.closePath();
      breath.fill();
      breath.setDepth(38 + i);
      breathLayers.push(breath);
    });

    // 火焰粒子喷发
    const fireParticles = scene.add.particles(player.x, player.y, 'particle_fire_core', {
      speed: { min: 200, max: 450 },
      angle: { min: (playerAngle - angleSpread / 2) * 180 / Math.PI, max: (playerAngle + angleSpread / 2) * 180 / Math.PI },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0xff4400, 0xff6600, 0xffaa00, 0xffff00],
      lifespan: 500,
      frequency: 20,
      quantity: 4,
    });
    fireParticles.setDepth(42);

    // 火花粒子
    const sparkParticles = scene.add.particles(player.x, player.y, 'particle_fire_spark', {
      speed: { min: 250, max: 500 },
      angle: { min: (playerAngle - angleSpread / 2) * 180 / Math.PI, max: (playerAngle + angleSpread / 2) * 180 / Math.PI },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0xffffff, 0xffff00, 0xffaa00],
      lifespan: 400,
      frequency: 30,
      quantity: 3,
    });
    sparkParticles.setDepth(43);

    // 屏幕震动
    VisualEffectUtils.screenShake(scene, { intensity: 0.008, duration: 300 });

    let elapsed = 0;
    const breathTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          breathTimer.destroy();
          breathLayers.forEach(l => l.destroy());
          fireParticles.destroy();
          sparkParticles.destroy();
          return;
        }

        const enemies = findEnemiesInRange(player.x, player.y, range);
        for (const enemy of enemies) {
          const enemyAngle = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
          const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(enemyAngle - playerAngle));
          if (angleDiff < angleSpread / 2) {
            applyDamageToEnemy(enemy, Math.floor(damage * 0.3), skill);

            // 火焰击中效果
            const hit = scene.add.circle(enemy.x, enemy.y, 15, 0xff6600, 0.7);
            hit.setDepth(100);
            scene.tweens.add({
              targets: hit,
              scale: 1.5,
              alpha: 0,
              duration: 200,
              onComplete: () => hit.destroy(),
            });
          }
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }
}

export class DragonBreathVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    const angleSpread = Math.PI / 3;

    // 多层火焰锥形
    const breathLayers: Phaser.GameObjects.Graphics[] = [];
    const layerConfigs = [
      { radius: radius * 1.1, color: 0xff2200, alpha: 0.15 },
      { radius: radius, color: 0xff4400, alpha: 0.3 },
      { radius: radius * 0.8, color: 0xff6600, alpha: 0.45 },
      { radius: radius * 0.5, color: 0xffaa00, alpha: 0.6 },
    ];

    layerConfigs.forEach((config, i) => {
      const breath = scene.add.graphics();
      breath.fillStyle(config.color, config.alpha);
      breath.beginPath();
      breath.moveTo(x, y);
      breath.arc(x, y, config.radius, -angleSpread / 2, angleSpread / 2);
      breath.closePath();
      breath.fill();
      breath.setDepth(38 + i);
      breathLayers.push(breath);
    });

    // 火焰粒子爆发
    VisualEffectUtils.createParticleBurst(scene, x, y, {
      count: 40,
      color: 0xff6600,
      speed: { min: 150, max: 350 },
      angle: { min: -30, max: 30 },
      scale: { start: 0.9, end: 0 },
      lifespan: 600,
      texture: 'particle_fire_core',
    });

    scene.tweens.add({
      targets: breathLayers,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 700,
      onComplete: () => breathLayers.forEach(b => b.destroy()),
    });
  }
}

/**
 * 烈焰风暴策略 - 持续燃烧区域 + 燃烧扩散机制
 */
export class InfernoStrategy implements SkillStrategy {
  private burnSpreadRadius = 80;
  private activeInfernos: Set<string> = new Set();

  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, applyEffects } = context;
    const radius = skill.rangeValue;
    const duration = 5000;
    const tickInterval = 300;

    const instanceId = `inferno_${Date.now()}_${Math.random()}`;
    this.activeInfernos.add(instanceId);

    const burnValue = 12;
    const burnDuration = 8000;

    // 多层燃烧区域
    const infernoLayers: Phaser.GameObjects.Arc[] = [];
    const layerConfigs = [
      { radius: radius * 1.1, color: 0xff2200, alpha: 0.15 },
      { radius: radius, color: 0xff4400, alpha: 0.25 },
      { radius: radius * 0.8, color: 0xff6600, alpha: 0.2 },
      { radius: radius * 0.5, color: 0xffaa00, alpha: 0.15 },
    ];

    layerConfigs.forEach((config, i) => {
      const layer = scene.add.circle(player.x, player.y, config.radius, config.color, config.alpha);
      layer.setDepth(17 + i);
      infernoLayers.push(layer);

      scene.tweens.add({
        targets: layer,
        scaleX: 1.08,
        scaleY: 1.08,
        alpha: config.alpha * 0.6,
        duration: 400,
        yoyo: true,
        repeat: -1,
      });
    });

    // 火焰粒子系统
    const fireParticles = scene.add.particles(player.x, player.y, 'particle_fire_core', {
      speed: { min: 30, max: 80 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.7, end: 0 },
      tint: [0xff4400, 0xff6600, 0xffaa00, 0xffff00],
      lifespan: 1200,
      frequency: 60,
      quantity: 3,
      emitZone: {
        type: 'random' as const,
        source: new Phaser.Geom.Circle(0, 0, radius * 0.9) as Phaser.Types.GameObjects.Particles.RandomZoneSource,
      },
    });
    fireParticles.setDepth(22);

    // 死亡事件监听
    const deathHandler = (enemy: Enemy) => {
      if (!this.activeInfernos.has(instanceId)) return;

      const hasInfernoBurn = enemy.statusEffects.some(
        (effect) => effect.type === 'burn' && effect.source === 'inferno'
      );

      if (hasInfernoBurn) {
        const nearbyEnemies = findEnemiesInRange(enemy.x, enemy.y, this.burnSpreadRadius);

        for (const nearbyEnemy of nearbyEnemies) {
          nearbyEnemy.addStatusEffect({
            type: 'burn',
            value: burnValue,
            duration: burnDuration,
            remainingTime: burnDuration,
            source: 'inferno',
          });
        }

        // 多层燃烧扩散视觉效果
        const spreadOuter = scene.add.circle(enemy.x, enemy.y, this.burnSpreadRadius, 0xff6600, 0.3);
        const spreadMid = scene.add.circle(enemy.x, enemy.y, this.burnSpreadRadius * 0.7, 0xff8800, 0.5);
        const spreadInner = scene.add.circle(enemy.x, enemy.y, this.burnSpreadRadius * 0.4, 0xffaa00, 0.7);
        spreadOuter.setDepth(23);
        spreadMid.setDepth(24);
        spreadInner.setDepth(25);

        scene.tweens.add({
          targets: [spreadOuter, spreadMid, spreadInner],
          alpha: 0,
          scale: 1.6,
          duration: 350,
          onComplete: () => {
            spreadOuter.destroy();
            spreadMid.destroy();
            spreadInner.destroy();
          },
        });
      }
    };

    scene.events.on('enemyKilled', deathHandler);

    let elapsed = 0;
    const infernoTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          infernoTimer.destroy();
          this.activeInfernos.delete(instanceId);
          scene.events.off('enemyKilled', deathHandler);
          infernoLayers.forEach(l => l.destroy());
          fireParticles.destroy();
          return;
        }

        const enemies = findEnemiesInRange(player.x, player.y, radius);
        for (const enemy of enemies) {
          applyDamageToEnemy(enemy, Math.floor(damage * 0.15), skill);
          enemy.addStatusEffect({
            type: 'burn',
            value: burnValue,
            duration: burnDuration,
            remainingTime: burnDuration,
            source: 'inferno',
          });
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }
}

export class InfernoVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 多层烈焰区域
    const infernoLayers: Phaser.GameObjects.Arc[] = [];
    const layerConfigs = [
      { radius: radius * 1.1, color: 0xff2200, alpha: 0.12 },
      { radius: radius, color: 0xff4400, alpha: 0.2 },
      { radius: radius * 0.8, color: 0xff6600, alpha: 0.18 },
      { radius: radius * 0.5, color: 0xffaa00, alpha: 0.12 },
    ];

    layerConfigs.forEach((config, i) => {
      const layer = scene.add.circle(x, y, config.radius, config.color, config.alpha);
      layer.setDepth(17 + i);
      infernoLayers.push(layer);

      scene.tweens.add({
        targets: layer,
        scaleX: 1.08,
        scaleY: 1.08,
        alpha: config.alpha * 0.5,
        duration: 500,
        yoyo: true,
        repeat: 9,
      });
    });

    // 火焰粒子
    const fireParticles = scene.add.particles(x, y, 'particle_fire_core', {
      speed: { min: 20, max: 60 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: [0xff4400, 0xff6600, 0xffaa00],
      lifespan: 1500,
      frequency: 80,
      quantity: 3,
      emitZone: {
        type: 'random' as const,
        source: new Phaser.Geom.Circle(0, 0, radius * 0.9) as Phaser.Types.GameObjects.Particles.RandomZoneSource,
      },
    });
    fireParticles.setDepth(22);

    scene.time.delayedCall(5000, () => {
      scene.tweens.add({
        targets: [...infernoLayers, fireParticles],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          infernoLayers.forEach(l => l.destroy());
          fireParticles.destroy();
        },
      });
    });
  }
}

/**
 * 深渊漩涡策略 - 持续吸引
 */
export class AbyssVortexStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const centerX = player.x;
    const centerY = player.y;
    const radius = skill.rangeValue;
    const duration = 3000;
    const tickInterval = 200;

    // 多层漩涡视觉效果
    const vortex = scene.add.container(centerX, centerY);
    vortex.setDepth(18);

    for (let i = 0; i < 5; i++) {
      const ring = scene.add.graphics();
      ring.lineStyle(4 - i * 0.5, 0x4488ff, 0.5 - i * 0.08);
      ring.strokeCircle(0, 0, radius * (0.3 + i * 0.18));
      vortex.add(ring);

      scene.tweens.add({
        targets: ring,
        angle: 360 * (i % 2 === 0 ? 1 : -1),
        duration: 800 + i * 200,
        repeat: -1,
      });
    }

    // 中心深渊
    const abyssOuter = scene.add.circle(centerX, centerY, 40, 0x2244aa, 0.6);
    const abyssMid = scene.add.circle(centerX, centerY, 28, 0x3366cc, 0.75);
    const abyssInner = scene.add.circle(centerX, centerY, 16, 0x4488ff, 0.9);
    abyssOuter.setDepth(19);
    abyssMid.setDepth(20);
    abyssInner.setDepth(21);

    // 吸入粒子
    const pullParticles = scene.add.particles(centerX, centerY, 'particle_glow', {
      speed: { min: 50, max: 120 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: [0x4488ff, 0x66aaff],
      lifespan: 600,
      frequency: 40,
      quantity: 2,
    });
    pullParticles.setDepth(17);

    let elapsed = 0;
    const vortexTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          vortexTimer.destroy();
          vortex.destroy();
          abyssOuter.destroy();
          abyssMid.destroy();
          abyssInner.destroy();
          pullParticles.destroy();
          return;
        }

        const enemies = findEnemiesInRange(centerX, centerY, radius);
        for (const enemy of enemies) {
          const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, centerX, centerY);
          if (enemy.active && enemy.body) {
            enemy.x += Math.cos(angle) * 30;
            enemy.y += Math.sin(angle) * 30;
          }
          applyDamageToEnemy(enemy, Math.floor(damage * 0.2), skill);
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }
}

export class AbyssVortexVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 多层漩涡环
    const vortex = scene.add.container(x, y);
    vortex.setDepth(18);

    for (let i = 0; i < 5; i++) {
      const ring = scene.add.graphics();
      ring.lineStyle(4 - i * 0.5, 0x4488ff, 0.45 - i * 0.06);
      ring.strokeCircle(0, 0, radius * (0.3 + i * 0.18));
      vortex.add(ring);
    }

    vortex.list.forEach((ring, i) => {
      scene.tweens.add({
        targets: ring,
        angle: 360 * (i % 2 === 0 ? 1 : -1),
        duration: 800 + i * 200,
        repeat: 3,
      });
    });

    // 中心深渊
    const abyssOuter = scene.add.circle(x, y, 40, 0x2244aa, 0.5);
    const abyssMid = scene.add.circle(x, y, 28, 0x3366cc, 0.65);
    const abyssInner = scene.add.circle(x, y, 16, 0x4488ff, 0.8);
    abyssOuter.setDepth(19);
    abyssMid.setDepth(20);
    abyssInner.setDepth(21);

    scene.time.delayedCall(3000, () => {
      scene.tweens.add({
        targets: [vortex, abyssOuter, abyssMid, abyssInner],
        alpha: 0,
        scale: 0.5,
        duration: 350,
        onComplete: () => {
          vortex.destroy();
          abyssOuter.destroy();
          abyssMid.destroy();
          abyssInner.destroy();
        },
      });
    });
  }
}

/**
 * 冰封领域策略 - 持续冻结
 */
export class FrozenDomainStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const radius = skill.rangeValue;
    const duration = 4000;
    const tickInterval = 500;

    // 多层冰封领域
    const domainLayers: Phaser.GameObjects.Arc[] = [];
    const layerConfigs = [
      { radius: radius * 1.1, color: 0x66ccff, alpha: 0.12 },
      { radius: radius, color: 0x88ddff, alpha: 0.2 },
      { radius: radius * 0.8, color: 0xaaeeff, alpha: 0.18 },
      { radius: radius * 0.5, color: 0xccffff, alpha: 0.15 },
    ];

    layerConfigs.forEach((config, i) => {
      const layer = scene.add.circle(player.x, player.y, config.radius, config.color, config.alpha);
      layer.setDepth(17 + i);
      domainLayers.push(layer);

      scene.tweens.add({
        targets: layer,
        scaleX: 1.06,
        scaleY: 1.06,
        alpha: config.alpha * 0.6,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    });

    // 霜冻粒子
    const frostParticles = scene.add.particles(player.x, player.y, 'particle_ice_crystal', {
      speed: { min: 20, max: 50 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: [0x88ddff, 0xaaeeff, 0xffffff],
      lifespan: 1200,
      frequency: 70,
      quantity: 2,
      emitZone: {
        type: 'random' as const,
        source: new Phaser.Geom.Circle(0, 0, radius * 0.9) as Phaser.Types.GameObjects.Particles.RandomZoneSource,
      },
    });
    frostParticles.setDepth(22);

    // 旋转冰环
    const iceRings = scene.add.container(player.x, player.y);
    iceRings.setDepth(18);
    for (let i = 0; i < 3; i++) {
      const ring = scene.add.graphics();
      ring.lineStyle(2, 0xaaeeff, 0.5);
      ring.strokeCircle(0, 0, radius * (0.4 + i * 0.25));
      iceRings.add(ring);

      scene.tweens.add({
        targets: ring,
        angle: 360 * (i % 2 === 0 ? 1 : -1),
        duration: 1500 + i * 300,
        repeat: -1,
      });
    }

    let elapsed = 0;
    const domainTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          domainTimer.destroy();
          domainLayers.forEach(l => l.destroy());
          frostParticles.destroy();
          iceRings.destroy();
          return;
        }

        const enemies = findEnemiesInRange(player.x, player.y, radius);
        for (const enemy of enemies) {
          applyDamageToEnemy(enemy, Math.floor(damage * 0.2), skill);

          // 冰霜击中效果
          const frost = scene.add.circle(enemy.x, enemy.y, 12, 0x88ddff, 0.6);
          frost.setDepth(100);
          scene.tweens.add({
            targets: frost,
            scale: 1.4,
            alpha: 0,
            duration: 200,
            onComplete: () => frost.destroy(),
          });
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }
}

export class FrozenDomainVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 多层冰封领域
    const domainLayers: Phaser.GameObjects.Arc[] = [];
    const layerConfigs = [
      { radius: radius * 1.1, color: 0x66ccff, alpha: 0.1 },
      { radius: radius, color: 0x88ddff, alpha: 0.15 },
      { radius: radius * 0.8, color: 0xaaeeff, alpha: 0.12 },
    ];

    layerConfigs.forEach((config, i) => {
      const layer = scene.add.circle(x, y, config.radius, config.color, config.alpha);
      layer.setDepth(17 + i);
      domainLayers.push(layer);
    });

    // 旋转冰环
    const iceRings = scene.add.container(x, y);
    iceRings.setDepth(18);
    for (let i = 0; i < 3; i++) {
      const ring = scene.add.graphics();
      ring.lineStyle(2, 0xaaeeff, 0.4);
      ring.strokeCircle(0, 0, radius * (0.4 + i * 0.25));
      iceRings.add(ring);
    }

    iceRings.list.forEach((ring, i) => {
      scene.tweens.add({
        targets: ring,
        angle: 360 * (i % 2 === 0 ? 1 : -1),
        duration: 1500 + i * 300,
        repeat: 7,
      });
    });

    scene.time.delayedCall(4000, () => {
      scene.tweens.add({
        targets: [...domainLayers, iceRings],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          domainLayers.forEach(l => l.destroy());
          iceRings.destroy();
        },
      });
    });
  }
}

/**
 * 绝对零度策略 - 秒杀低血量
 */
export class AbsoluteZeroStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const radius = skill.rangeValue;
    const executeThreshold = 0.10;

    // 多层绝对零度核心爆发
    const coreBurst = scene.add.graphics();
    coreBurst.fillStyle(0xffffff, 1);
    coreBurst.fillCircle(player.x, player.y, 60);
    coreBurst.fillStyle(0xccffff, 0.95);
    coreBurst.fillCircle(player.x, player.y, 45);
    coreBurst.fillStyle(0x88eeff, 0.9);
    coreBurst.fillCircle(player.x, player.y, 30);
    coreBurst.setDepth(95);

    scene.tweens.add({
      targets: coreBurst,
      scale: 3,
      alpha: 0,
      duration: 400,
      onComplete: () => coreBurst.destroy(),
    });

    // 多层冰霜冲击波
    for (let i = 0; i < 5; i++) {
      const wave = scene.add.circle(player.x, player.y, 40 + i * 20, 0x88eeff, 0.6 - i * 0.1);
      wave.setDepth(90 + i);
      scene.tweens.add({
        targets: wave,
        scale: radius / 20 * 1.2,
        alpha: 0,
        duration: 600 + i * 80,
        delay: i * 60,
        onComplete: () => wave.destroy(),
      });
    }

    // 冰晶粒子爆发
    VisualEffectUtils.createParticleBurst(scene, player.x, player.y, {
      count: 50,
      color: 0x88eeff,
      speed: { min: 150, max: 350 },
      scale: { start: 0.8, end: 0 },
      lifespan: 500,
      texture: 'particle_ice_crystal',
    });

    // 屏幕震动和闪光
    VisualEffectUtils.screenShake(scene, { intensity: 0.015, duration: 200 });
    VisualEffectUtils.screenFlash(scene, { color: 0xccffff, intensity: 0.4, duration: 150 });

    const enemies = findEnemiesInRange(player.x, player.y, radius);
    for (const enemy of enemies) {
      const hpPercent = enemy.currentHp / enemy.maxHp;
      if (hpPercent < executeThreshold) {
        applyDamageToEnemy(enemy, enemy.currentHp + 1, skill);
      } else {
        applyDamageToEnemy(enemy, damage, skill);
      }

      // 冰冻击中效果
      const freeze = scene.add.circle(enemy.x, enemy.y, 25, 0xffffff, 0.8);
      freeze.setDepth(100);
      scene.tweens.add({
        targets: freeze,
        scale: 1.8,
        alpha: 0,
        duration: 300,
        onComplete: () => freeze.destroy(),
      });
    }
  }
}

export class AbsoluteZeroVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 多层核心爆发
    const coreBurst = scene.add.graphics();
    coreBurst.fillStyle(0xffffff, 1);
    coreBurst.fillCircle(0, 0, 50);
    coreBurst.fillStyle(0xccffff, 0.95);
    coreBurst.fillCircle(0, 0, 35);
    coreBurst.setPosition(x, y);
    coreBurst.setDepth(95);

    scene.tweens.add({
      targets: coreBurst,
      scale: 2.5,
      alpha: 0,
      duration: 350,
      onComplete: () => coreBurst.destroy(),
    });

    // 多层冰霜冲击波
    VisualEffectUtils.createMultiLayerRings(scene, x, y, {
      radius: radius * 0.3,
      color: 0x88eeff,
      layers: 5,
      duration: 600,
      expanding: true,
    });

    // 冰晶粒子
    VisualEffectUtils.createParticleBurst(scene, x, y, {
      count: 40,
      color: 0x88eeff,
      speed: { min: 120, max: 280 },
      scale: { start: 0.7, end: 0 },
      lifespan: 450,
      texture: 'particle_ice_crystal',
    });
  }
}

/**
 * 雷霆万钧策略 - 全屏连锁雷击
 */
export class ThunderApocalypseStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const strikeCount = 12;
    const strikeInterval = 200;
    let currentStrike = 0;

    // 多层雷云
    const cloudLayers: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 3; i++) {
      const cloud = scene.add.circle(player.x, player.y - 80, skill.rangeValue * (0.6 + i * 0.15), 0x333355, 0.25 - i * 0.05);
      cloud.setDepth(15 + i);
      cloudLayers.push(cloud);
    }

    // 屏幕震动
    VisualEffectUtils.screenShake(scene, { intensity: 0.01, duration: strikeCount * strikeInterval });

    const strikeTimer = scene.time.addEvent({
      delay: strikeInterval,
      callback: () => {
        currentStrike++;
        if (currentStrike > strikeCount) {
          strikeTimer.destroy();
          cloudLayers.forEach(c => c.destroy());
          return;
        }

        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * skill.rangeValue * 0.8;
        const strikeX = player.x + Math.cos(angle) * dist;
        const strikeY = player.y + Math.sin(angle) * dist;

        // 多层闪电
        const lightningOuter = scene.add.graphics();
        lightningOuter.lineStyle(12, 0xffff00, 0.3);
        lightningOuter.lineBetween(strikeX, strikeY - 150, strikeX, strikeY);
        lightningOuter.setDepth(98);

        const lightningMid = scene.add.graphics();
        lightningMid.lineStyle(5, 0xffff00, 0.7);
        lightningMid.lineBetween(strikeX, strikeY - 140, strikeX, strikeY);
        lightningMid.setDepth(99);

        const lightningCore = scene.add.graphics();
        lightningCore.lineStyle(2, 0xffffff, 1);
        lightningCore.lineBetween(strikeX, strikeY - 130, strikeX, strikeY);
        lightningCore.setDepth(100);

        // 击中点闪光
        const flashOuter = scene.add.circle(strikeX, strikeY, 50, 0xffff00, 0.5);
        const flashInner = scene.add.circle(strikeX, strikeY, 25, 0xffffff, 0.9);
        flashOuter.setDepth(101);
        flashInner.setDepth(102);

        // 粒子爆发
        VisualEffectUtils.createParticleBurst(scene, strikeX, strikeY, {
          count: 15,
          color: 0xffff00,
          speed: { min: 80, max: 180 },
          scale: { start: 0.5, end: 0 },
          lifespan: 250,
          texture: 'particle_lightning_arc',
        });

        const enemies = findEnemiesInRange(strikeX, strikeY, 60);
        for (const enemy of enemies) {
          applyDamageToEnemy(enemy, damage, skill);
        }

        // 消失动画
        scene.tweens.add({
          targets: [lightningOuter, lightningMid, lightningCore, flashOuter, flashInner],
          alpha: 0,
          duration: 180,
          onComplete: () => {
            lightningOuter.destroy();
            lightningMid.destroy();
            lightningCore.destroy();
            flashOuter.destroy();
            flashInner.destroy();
          },
        });
      },
      repeat: strikeCount - 1,
    });
  }
}

export class ThunderApocalypseVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 多层雷云
    const cloudLayers: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 3; i++) {
      const cloud = scene.add.circle(x, y - 60, radius * (0.5 + i * 0.12), 0x333355, 0.2 - i * 0.04);
      cloud.setDepth(15 + i);
      cloudLayers.push(cloud);
    }

    // 多次雷击
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius * 0.7;
      const strikeX = x + Math.cos(angle) * dist;
      const strikeY = y + Math.sin(angle) * dist;

      // 多层闪电
      const lightningMid = scene.add.graphics();
      lightningMid.lineStyle(4, 0xffff00, 0.8);
      lightningMid.lineBetween(strikeX, strikeY - 80, strikeX, strikeY);
      lightningMid.setDepth(98);

      const lightningCore = scene.add.graphics();
      lightningCore.lineStyle(1, 0xffffff, 1);
      lightningCore.lineBetween(strikeX, strikeY - 75, strikeX, strikeY);
      lightningCore.setDepth(99);

      scene.tweens.add({
        targets: [lightningMid, lightningCore],
        alpha: 0,
        delay: i * 80,
        duration: 150,
        onComplete: () => {
          lightningMid.destroy();
          lightningCore.destroy();
        },
      });
    }

    scene.time.delayedCall(1200, () => cloudLayers.forEach(c => c.destroy()));
  }
}

/**
 * 审判之光策略 - 伤害+治疗
 */
export class JudgmentLightStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const radius = skill.rangeValue;
    const healAmount = skill.effects.find(e => e.type === 'heal')?.value || 30;

    // 多层审判之光核心
    const coreBurst = scene.add.graphics();
    coreBurst.fillStyle(0xffffff, 1);
    coreBurst.fillCircle(player.x, player.y, 45);
    coreBurst.fillStyle(0xffdd66, 0.95);
    coreBurst.fillCircle(player.x, player.y, 35);
    coreBurst.fillStyle(0xffcc00, 0.9);
    coreBurst.fillCircle(player.x, player.y, 25);
    coreBurst.setDepth(95);

    scene.tweens.add({
      targets: coreBurst,
      scale: 2.5,
      alpha: 0,
      duration: 450,
      onComplete: () => coreBurst.destroy(),
    });

    // 多层光柱
    const beamOuter = scene.add.rectangle(player.x, player.y, 90, radius * 2, 0xffcc00, 0.25);
    const beamMid = scene.add.rectangle(player.x, player.y, 60, radius * 2, 0xffdd44, 0.4);
    const beamInner = scene.add.rectangle(player.x, player.y, 30, radius * 2, 0xffffff, 0.6);
    beamOuter.setDepth(18);
    beamMid.setDepth(19);
    beamInner.setDepth(20);

    // 光芒射线
    const rays: Phaser.GameObjects.Graphics[] = [];
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const ray = scene.add.graphics();
      ray.fillStyle(0xffffff, 0.7);
      ray.fillTriangle(0, 0, -5, radius, 5, radius);
      ray.setPosition(player.x, player.y);
      ray.setRotation(angle);
      ray.setDepth(21);
      rays.push(ray);
    }

    // 多层光环扩散
    for (let i = 0; i < 4; i++) {
      const ring = scene.add.circle(player.x, player.y, 30 + i * 25, 0xffcc00, 0.4 - i * 0.08);
      ring.setDepth(22 + i);
      scene.tweens.add({
        targets: ring,
        scale: 3,
        alpha: 0,
        duration: 600 + i * 100,
        delay: i * 80,
        onComplete: () => ring.destroy(),
      });
    }

    // 屏幕闪光
    VisualEffectUtils.screenFlash(scene, { color: 0xffcc00, intensity: 0.35, duration: 200 });

    const enemies = findEnemiesInRange(player.x, player.y, radius);
    for (const enemy of enemies) {
      applyDamageToEnemy(enemy, damage, skill);

      // 光之击中效果
      const hit = scene.add.circle(enemy.x, enemy.y, 22, 0xffffff, 0.8);
      hit.setDepth(100);
      scene.tweens.add({
        targets: hit,
        scale: 1.6,
        alpha: 0,
        duration: 250,
        onComplete: () => hit.destroy(),
      });
    }

    if (enemies.length > 0) {
      scene.time.delayedCall(400, () => {
        player.heal(healAmount);

        // 治疗闪光
        const healFlash = scene.add.circle(player.x, player.y, 40, 0x66ff66, 0.6);
        healFlash.setDepth(100);
        scene.tweens.add({
          targets: healFlash,
          scale: 1.8,
          alpha: 0,
          duration: 350,
          onComplete: () => healFlash.destroy(),
        });
      });
    }

    // 消失动画
    scene.tweens.add({
      targets: [beamOuter, beamMid, beamInner, ...rays],
      alpha: 0,
      scale: 1.2,
      duration: 650,
      onComplete: () => {
        beamOuter.destroy();
        beamMid.destroy();
        beamInner.destroy();
        rays.forEach(r => r.destroy());
      },
    });
  }
}

export class JudgmentLightVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 多层光柱
    const beamOuter = scene.add.rectangle(x, y, 90, radius * 2, 0xffcc00, 0.2);
    const beamMid = scene.add.rectangle(x, y, 60, radius * 2, 0xffdd44, 0.35);
    const beamInner = scene.add.rectangle(x, y, 30, radius * 2, 0xffffff, 0.55);
    beamOuter.setDepth(18);
    beamMid.setDepth(19);
    beamInner.setDepth(20);

    // 光芒射线
    const rays: Phaser.GameObjects.Graphics[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const ray = scene.add.graphics();
      ray.fillStyle(0xffffff, 0.65);
      ray.fillTriangle(0, 0, -4, radius, 4, radius);
      ray.setPosition(x, y);
      ray.setRotation(angle);
      ray.setDepth(21);
      rays.push(ray);
    }

    // 核心光爆
    VisualEffectUtils.createElementGlow(scene, x, y, {
      color: 0xffcc00,
      radius: 40,
      duration: 500,
      pulseCount: 2,
    });

    scene.tweens.add({
      targets: [beamOuter, beamMid, beamInner, ...rays],
      alpha: 0,
      scale: 1.3,
      duration: 650,
      onComplete: () => {
        beamOuter.destroy();
        beamMid.destroy();
        beamInner.destroy();
        rays.forEach(r => r.destroy());
      },
    });
  }
}

/**
 * 暗影降临策略 - 降防+持续伤害
 */
export class ShadowDescentStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const radius = skill.rangeValue;
    const duration = 4000;
    const tickInterval = 500;

    // 多层暗影区域
    const shadowLayers: Phaser.GameObjects.Arc[] = [];
    const layerConfigs = [
      { radius: radius * 1.1, color: 0x220044, alpha: 0.2 },
      { radius: radius, color: 0x440066, alpha: 0.35 },
      { radius: radius * 0.8, color: 0x660088, alpha: 0.3 },
      { radius: radius * 0.5, color: 0x8800aa, alpha: 0.25 },
    ];

    layerConfigs.forEach((config, i) => {
      const layer = scene.add.circle(player.x, player.y, config.radius, config.color, config.alpha);
      layer.setDepth(17 + i);
      shadowLayers.push(layer);

      scene.tweens.add({
        targets: layer,
        scaleX: 1.08,
        scaleY: 1.08,
        alpha: config.alpha * 0.6,
        duration: 450,
        yoyo: true,
        repeat: -1,
      });
    });

    // 暗影粒子
    const shadowParticles = scene.add.particles(player.x, player.y, 'particle_glow', {
      speed: { min: 20, max: 50 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: [0x660088, 0x8800aa, 0xaa00cc],
      lifespan: 1200,
      frequency: 60,
      quantity: 3,
      emitZone: {
        type: 'random' as const,
        source: new Phaser.Geom.Circle(0, 0, radius * 0.9) as Phaser.Types.GameObjects.Particles.RandomZoneSource,
      },
    });
    shadowParticles.setDepth(22);

    // 暗影漩涡
    const vortex = scene.add.container(player.x, player.y);
    vortex.setDepth(18);
    for (let i = 0; i < 3; i++) {
      const ring = scene.add.graphics();
      ring.lineStyle(2, 0x8800ff, 0.4);
      ring.strokeCircle(0, 0, radius * (0.4 + i * 0.25));
      vortex.add(ring);

      scene.tweens.add({
        targets: ring,
        angle: 360 * (i % 2 === 0 ? 1 : -1),
        duration: 1500 + i * 300,
        repeat: -1,
      });
    }

    let elapsed = 0;
    const shadowTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          shadowTimer.destroy();
          shadowLayers.forEach(l => l.destroy());
          shadowParticles.destroy();
          vortex.destroy();
          return;
        }

        const enemies = findEnemiesInRange(player.x, player.y, radius);
        for (const enemy of enemies) {
          applyDamageToEnemy(enemy, Math.floor(damage * 0.15), skill);

          // 暗影击中效果
          const shadow = scene.add.circle(enemy.x, enemy.y, 14, 0x8800ff, 0.6);
          shadow.setDepth(100);
          scene.tweens.add({
            targets: shadow,
            scale: 1.5,
            alpha: 0,
            duration: 200,
            onComplete: () => shadow.destroy(),
          });
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });

    // 立即伤害
    const enemies = findEnemiesInRange(player.x, player.y, radius);
    for (const enemy of enemies) {
      applyDamageToEnemy(enemy, damage, skill);
    }
  }
}

export class ShadowDescentVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 多层暗影区域
    const shadowLayers: Phaser.GameObjects.Arc[] = [];
    const layerConfigs = [
      { radius: radius * 1.1, color: 0x220044, alpha: 0.15 },
      { radius: radius, color: 0x440066, alpha: 0.25 },
      { radius: radius * 0.8, color: 0x660088, alpha: 0.2 },
    ];

    layerConfigs.forEach((config, i) => {
      const layer = scene.add.circle(x, y, config.radius, config.color, config.alpha);
      layer.setDepth(17 + i);
      shadowLayers.push(layer);
    });

    // 暗影漩涡
    const vortex = scene.add.container(x, y);
    vortex.setDepth(18);
    for (let i = 0; i < 3; i++) {
      const ring = scene.add.graphics();
      ring.lineStyle(2, 0x8800ff, 0.35);
      ring.strokeCircle(0, 0, radius * (0.4 + i * 0.25));
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

    scene.time.delayedCall(4000, () => {
      scene.tweens.add({
        targets: [...shadowLayers, vortex],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          shadowLayers.forEach(l => l.destroy());
          vortex.destroy();
        },
      });
    });
  }
}

/**
 * 死亡凋零策略 - 持续吸血
 */
export class DeathDecayStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const radius = skill.rangeValue;
    const duration = 5000;
    const tickInterval = 400;
    const lifestealPercent = 0.3;

    // 多层死亡凋零区域
    const decayLayers: Phaser.GameObjects.Arc[] = [];
    const layerConfigs = [
      { radius: radius * 1.1, color: 0x220022, alpha: 0.2 },
      { radius: radius, color: 0x440044, alpha: 0.35 },
      { radius: radius * 0.8, color: 0x660066, alpha: 0.3 },
      { radius: radius * 0.5, color: 0x880088, alpha: 0.25 },
    ];

    layerConfigs.forEach((config, i) => {
      const layer = scene.add.circle(player.x, player.y, config.radius, config.color, config.alpha);
      layer.setDepth(17 + i);
      decayLayers.push(layer);

      scene.tweens.add({
        targets: layer,
        scaleX: 1.06,
        scaleY: 1.06,
        alpha: config.alpha * 0.6,
        duration: 400,
        yoyo: true,
        repeat: -1,
      });
    });

    // 死亡粒子
    const deathParticles = scene.add.particles(player.x, player.y, 'particle_glow', {
      speed: { min: 15, max: 45 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.45, end: 0 },
      alpha: { start: 0.55, end: 0 },
      tint: [0x660066, 0x880088, 0xaa00aa],
      lifespan: 1400,
      frequency: 70,
      quantity: 2,
      emitZone: {
        type: 'random' as const,
        source: new Phaser.Geom.Circle(0, 0, radius * 0.9) as Phaser.Types.GameObjects.Particles.RandomZoneSource,
      },
    });
    deathParticles.setDepth(22);

    let elapsed = 0;
    const decayTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          decayTimer.destroy();
          decayLayers.forEach(l => l.destroy());
          deathParticles.destroy();
          return;
        }

        const enemies = findEnemiesInRange(player.x, player.y, radius);
        let totalDamage = 0;
        for (const enemy of enemies) {
          const tickDamage = Math.floor(damage * 0.12);
          applyDamageToEnemy(enemy, tickDamage, skill);
          totalDamage += tickDamage;

          // 死亡吸取效果
          const drain = scene.add.circle(enemy.x, enemy.y, 12, 0x880088, 0.6);
          drain.setDepth(100);
          scene.tweens.add({
            targets: drain,
            scale: 1.5,
            alpha: 0,
            duration: 200,
            onComplete: () => drain.destroy(),
          });
        }

        if (totalDamage > 0) {
          scene.time.delayedCall(200, () => {
            player.heal(Math.floor(totalDamage * lifestealPercent));

            // 治疗闪光
            const healFlash = scene.add.circle(player.x, player.y, 25, 0x88ff88, 0.5);
            healFlash.setDepth(100);
            scene.tweens.add({
              targets: healFlash,
              scale: 1.6,
              alpha: 0,
              duration: 250,
              onComplete: () => healFlash.destroy(),
            });
          });
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }
}

export class DeathDecayVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 多层死亡凋零区域
    const decayLayers: Phaser.GameObjects.Arc[] = [];
    const layerConfigs = [
      { radius: radius * 1.1, color: 0x220022, alpha: 0.15 },
      { radius: radius, color: 0x440044, alpha: 0.25 },
      { radius: radius * 0.8, color: 0x660066, alpha: 0.2 },
    ];

    layerConfigs.forEach((config, i) => {
      const layer = scene.add.circle(x, y, config.radius, config.color, config.alpha);
      layer.setDepth(17 + i);
      decayLayers.push(layer);
    });

    scene.time.delayedCall(5000, () => {
      scene.tweens.add({
        targets: decayLayers,
        alpha: 0,
        duration: 500,
        onComplete: () => decayLayers.forEach(l => l.destroy()),
      });
    });
  }
}

/**
 * 山崩地裂策略 - 范围伤害+击飞
 */
export class MountainCollapseStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const radius = skill.rangeValue;
    const knockbackDist = 150;

    // 多层地裂冲击
    const crackLayers: Phaser.GameObjects.Graphics[] = [];
    for (let i = 0; i < 4; i++) {
      const crack = scene.add.graphics();
      crack.fillStyle(0x553311, 0.6 - i * 0.1);
      crack.fillCircle(player.x, player.y, radius * (1 - i * 0.15));
      crack.setDepth(20 + i);
      crackLayers.push(crack);
    }

    // 冲击波
    VisualEffectUtils.createShockwave(scene, player.x, player.y, {
      color: 0x886644,
      radius: radius,
      rings: 5,
      duration: 500,
    });

    // 岩石碎片
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius * 0.8;
      const rock = scene.add.graphics();
      rock.fillStyle(0x886644, 0.9);
      const size = 8 + Math.random() * 8;
      rock.fillRect(-size / 2, -size / 2, size, size);
      rock.setPosition(player.x + Math.cos(angle) * dist, player.y + Math.sin(angle) * dist);
      rock.setDepth(45);

      scene.tweens.add({
        targets: rock,
        y: rock.y - 60 - Math.random() * 40,
        angle: Math.random() * 360,
        alpha: 0,
        duration: 500,
        delay: i * 20,
        onComplete: () => rock.destroy(),
      });
    }

    // 屏幕震动
    VisualEffectUtils.screenShake(scene, { intensity: 0.02, duration: 300 });

    const enemies = findEnemiesInRange(player.x, player.y, radius);
    for (const enemy of enemies) {
      applyDamageToEnemy(enemy, damage, skill);
      if (enemy.active && enemy.body) {
        const angle = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
        enemy.x += Math.cos(angle) * knockbackDist;
        enemy.y += Math.sin(angle) * knockbackDist;
      }
    }

    scene.tweens.add({
      targets: crackLayers,
      alpha: 0,
      scale: 1.3,
      duration: 600,
      onComplete: () => crackLayers.forEach(c => c.destroy()),
    });
  }
}

export class MountainCollapseVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 多层地裂
    const crackLayers: Phaser.GameObjects.Graphics[] = [];
    for (let i = 0; i < 4; i++) {
      const crack = scene.add.graphics();
      crack.fillStyle(0x553311, 0.5 - i * 0.1);
      crack.fillCircle(x, y, radius * (1 - i * 0.15));
      crack.setDepth(20 + i);
      crackLayers.push(crack);
    }

    // 冲击波
    VisualEffectUtils.createShockwave(scene, x, y, {
      color: 0x886644,
      radius: radius,
      rings: 4,
      duration: 450,
    });

    scene.tweens.add({
      targets: crackLayers,
      alpha: 0,
      scale: 1.4,
      duration: 600,
      onComplete: () => crackLayers.forEach(c => c.destroy()),
    });
  }
}

/**
 * 陨石坠落策略 - 大范围爆炸
 */
export class MeteorStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const radius = skill.rangeValue;

    // 多层预警区域
    const warningLayers: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 3; i++) {
      const warning = scene.add.circle(player.x, player.y, radius * (0.6 + i * 0.2), 0xff4400, 0.15 + i * 0.08);
      warning.setDepth(18 + i);
      warningLayers.push(warning);
    }

    // 预警脉动
    scene.tweens.add({
      targets: warningLayers,
      scale: 1.1,
      alpha: 0.5,
      duration: 200,
      yoyo: true,
      repeat: 2,
    });

    scene.time.delayedCall(500, () => {
      warningLayers.forEach(w => w.destroy());

      // 多层爆炸
      const explosionOuter = scene.add.circle(player.x, player.y, radius * 1.1, 0xff2200, 0.5);
      const explosionMid = scene.add.circle(player.x, player.y, radius, 0xff6600, 0.7);
      const explosionInner = scene.add.circle(player.x, player.y, radius * 0.7, 0xffaa00, 0.85);
      const explosionCore = scene.add.circle(player.x, player.y, radius * 0.4, 0xffffff, 0.95);
      explosionOuter.setDepth(95);
      explosionMid.setDepth(96);
      explosionInner.setDepth(97);
      explosionCore.setDepth(98);

      // 多层冲击波
      VisualEffectUtils.createShockwave(scene, player.x, player.y, {
        color: 0xff6600,
        radius: radius * 1.2,
        rings: 5,
        duration: 450,
      });

      // 火焰粒子爆发
      VisualEffectUtils.createParticleBurst(scene, player.x, player.y, {
        count: 60,
        color: 0xff6600,
        speed: { min: 150, max: 350 },
        scale: { start: 1, end: 0 },
        lifespan: 550,
        texture: 'particle_fire_core',
      });

      // 屏幕震动和闪光
      VisualEffectUtils.screenShake(scene, { intensity: 0.025, duration: 250 });
      VisualEffectUtils.screenFlash(scene, { color: 0xff6600, intensity: 0.5, duration: 180 });

      const enemies = findEnemiesInRange(player.x, player.y, radius);
      for (const enemy of enemies) {
        applyDamageToEnemy(enemy, damage, skill);
      }

      scene.tweens.add({
        targets: [explosionOuter, explosionMid, explosionInner, explosionCore],
        alpha: 0,
        scale: 1.3,
        duration: 550,
        onComplete: () => {
          explosionOuter.destroy();
          explosionMid.destroy();
          explosionInner.destroy();
          explosionCore.destroy();
        },
      });
    });
  }
}

export class MeteorVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 多层预警
    const warningLayers: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 3; i++) {
      const warning = scene.add.circle(x, y, radius * (0.6 + i * 0.2), 0xff4400, 0.12 + i * 0.06);
      warning.setDepth(18 + i);
      warningLayers.push(warning);
    }

    scene.tweens.add({
      targets: warningLayers,
      scale: 1.1,
      alpha: 0.45,
      duration: 200,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        warningLayers.forEach(w => w.destroy());

        // 多层爆炸
        const explosionOuter = scene.add.circle(x, y, radius * 1.1, 0xff2200, 0.4);
        const explosionMid = scene.add.circle(x, y, radius, 0xff6600, 0.6);
        const explosionInner = scene.add.circle(x, y, radius * 0.7, 0xffaa00, 0.75);
        const explosionCore = scene.add.circle(x, y, radius * 0.4, 0xffffff, 0.9);
        explosionOuter.setDepth(95);
        explosionMid.setDepth(96);
        explosionInner.setDepth(97);
        explosionCore.setDepth(98);

        // 冲击波
        VisualEffectUtils.createShockwave(scene, x, y, {
          color: 0xff6600,
          radius: radius * 1.1,
          rings: 4,
          duration: 400,
        });

        scene.tweens.add({
          targets: [explosionOuter, explosionMid, explosionInner, explosionCore],
          alpha: 0,
          scale: 1.25,
          duration: 500,
          onComplete: () => {
            explosionOuter.destroy();
            explosionMid.destroy();
            explosionInner.destroy();
            explosionCore.destroy();
          },
        });
      },
    });
  }
}

/**
 * 海啸策略 - 全屏推开
 */
export class TsunamiStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const radius = skill.rangeValue;
    const knockbackDist = 200;

    // 多层海啸波
    const waveLayers: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 5; i++) {
      const wave = scene.add.circle(player.x, player.y, 30 + i * 25, 0x4488ff, 0.5 - i * 0.07);
      wave.setStrokeStyle(3 - i * 0.5, 0x66aaff, 0.7 - i * 0.1);
      wave.setDepth(20 + i);
      waveLayers.push(wave);
    }

    // 水花粒子
    const splashParticles = scene.add.particles(player.x, player.y, 'particle_glow', {
      speed: { min: 100, max: 250 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 0.7, end: 0 },
      tint: [0x4488ff, 0x66aaff, 0x88ccff],
      lifespan: 600,
      frequency: 20,
      quantity: 5,
    });
    splashParticles.setDepth(25);

    // 屏幕震动
    VisualEffectUtils.screenShake(scene, { intensity: 0.012, duration: 400 });

    scene.tweens.add({
      targets: waveLayers,
      radius: radius,
      alpha: 0,
      duration: 900,
      onUpdate: function () {
        const currentRadius = (waveLayers[0] as any).radius;
        const enemies = findEnemiesInRange(player.x, player.y, currentRadius + 30);
        for (const enemy of enemies) {
          if (enemy.active && enemy.body) {
            const angle = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
            enemy.x += Math.cos(angle) * 20;
            enemy.y += Math.sin(angle) * 20;
          }
        }
      },
      onComplete: () => {
        waveLayers.forEach(w => w.destroy());
        splashParticles.destroy();
      },
    });

    const enemies = findEnemiesInRange(player.x, player.y, radius);
    for (const enemy of enemies) {
      applyDamageToEnemy(enemy, damage, skill);
      if (enemy.active && enemy.body) {
        const angle = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
        enemy.x += Math.cos(angle) * knockbackDist;
        enemy.y += Math.sin(angle) * knockbackDist;
      }
    }
  }
}

export class TsunamiVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 多层海啸波
    const waveLayers: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 5; i++) {
      const wave = scene.add.circle(x, y, 25 + i * 20, 0x4488ff, 0.45 - i * 0.06);
      wave.setStrokeStyle(3 - i * 0.5, 0x66aaff, 0.6 - i * 0.08);
      wave.setDepth(20 + i);
      waveLayers.push(wave);
    }

    scene.tweens.add({
      targets: waveLayers,
      radius: radius,
      alpha: 0,
      duration: 850,
      onComplete: () => waveLayers.forEach(w => w.destroy()),
    });
  }
}

/**
 * 大地震击策略 - 全屏眩晕
 */
export class EarthquakeStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const radius = skill.rangeValue;

    // 多层地震波
    for (let i = 0; i < 5; i++) {
      const wave = scene.add.circle(player.x, player.y, 30 + i * 30, 0x886644, 0.4 - i * 0.06);
      wave.setDepth(20 + i);
      wave.setStrokeStyle(3, 0xaa8866, 0.5);

      scene.tweens.add({
        targets: wave,
        scale: radius / 30 * 1.1,
        alpha: 0,
        duration: 600 + i * 80,
        delay: i * 60,
        onComplete: () => wave.destroy(),
      });
    }

    // 地裂效果
    const cracks = scene.add.graphics();
    cracks.lineStyle(3, 0x553311, 0.7);
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      cracks.lineBetween(
        player.x,
        player.y,
        player.x + Math.cos(angle) * radius * 0.8,
        player.y + Math.sin(angle) * radius * 0.8
      );
    }
    cracks.setDepth(19);

    // 岩石碎片
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius * 0.6;
      const rock = scene.add.graphics();
      rock.fillStyle(0x886644, 0.9);
      const size = 6 + Math.random() * 6;
      rock.fillRect(-size / 2, -size / 2, size, size);
      rock.setPosition(player.x + Math.cos(angle) * dist, player.y + Math.sin(angle) * dist);
      rock.setDepth(40);

      scene.tweens.add({
        targets: rock,
        y: rock.y - 50 - Math.random() * 30,
        alpha: 0,
        duration: 450,
        delay: i * 25,
        onComplete: () => rock.destroy(),
      });
    }

    // 屏幕震动
    VisualEffectUtils.screenShake(scene, { intensity: 0.025, duration: 500 });

    scene.tweens.add({
      targets: cracks,
      alpha: 0,
      duration: 550,
      onComplete: () => cracks.destroy(),
    });

    const enemies = findEnemiesInRange(player.x, player.y, radius);
    for (const enemy of enemies) {
      applyDamageToEnemy(enemy, damage, skill);
    }
  }
}

export class EarthquakeVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 多层地震波
    const waves: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 4; i++) {
      const wave = scene.add.circle(x, y, radius * (0.25 + i * 0.25), 0x886644, 0.35 - i * 0.06);
      wave.setDepth(20 + i);
      waves.push(wave);
    }

    scene.tweens.add({
      targets: waves,
      scale: 1.6,
      alpha: 0,
      duration: 550,
      onComplete: () => waves.forEach(w => w.destroy()),
    });
  }
}

/**
 * 过度生长策略 - 全屏缠绕
 */
export class OvergrowthStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const radius = skill.rangeValue;

    // 多层藤蔓区域
    const vineLayers: Phaser.GameObjects.Arc[] = [];
    const layerConfigs = [
      { radius: radius * 1.1, color: 0x226622, alpha: 0.2 },
      { radius: radius, color: 0x44aa44, alpha: 0.3 },
      { radius: radius * 0.8, color: 0x66cc66, alpha: 0.25 },
      { radius: radius * 0.5, color: 0x88ee88, alpha: 0.2 },
    ];

    layerConfigs.forEach((config, i) => {
      const layer = scene.add.circle(player.x, player.y, config.radius, config.color, config.alpha);
      layer.setDepth(17 + i);
      vineLayers.push(layer);
    });

    // 藤蔓视觉效果
    const vines: Phaser.GameObjects.Graphics[] = [];
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const vine = scene.add.graphics();
      vine.lineStyle(4, 0x44ff44, 0.8);
      vine.beginPath();
      vine.moveTo(player.x, player.y);
      const endX = player.x + Math.cos(angle) * radius * 0.9;
      const endY = player.y + Math.sin(angle) * radius * 0.9;
      // 波浪形藤蔓
      const segments = 6;
      for (let j = 1; j <= segments; j++) {
        const t = j / segments;
        const waveX = player.x + (endX - player.x) * t + Math.sin(t * Math.PI * 3) * 12;
        const waveY = player.y + (endY - player.y) * t + Math.cos(t * Math.PI * 3) * 12;
        vine.lineTo(waveX, waveY);
      }
      vine.strokePath();
      vine.setDepth(25);
      vines.push(vine);

      vine.setScale(0, 0);
      scene.tweens.add({
        targets: vine,
        scaleX: 1,
        scaleY: 1,
        duration: 300,
        delay: i * 30,
      });
    }

    // 叶片粒子
    VisualEffectUtils.createParticleBurst(scene, player.x, player.y, {
      count: 40,
      color: 0x44ff44,
      speed: { min: 80, max: 200 },
      scale: { start: 0.6, end: 0 },
      lifespan: 600,
      texture: 'particle_glow',
    });

    const enemies = findEnemiesInRange(player.x, player.y, radius);
    for (const enemy of enemies) {
      applyDamageToEnemy(enemy, damage, skill);
    }

    scene.tweens.add({
      targets: [...vineLayers, ...vines],
      alpha: 0,
      duration: 800,
      delay: 300,
      onComplete: () => {
        vineLayers.forEach(l => l.destroy());
        vines.forEach(v => v.destroy());
      },
    });
  }
}

export class OvergrowthVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 多层藤蔓区域
    const vineLayers: Phaser.GameObjects.Arc[] = [];
    const layerConfigs = [
      { radius: radius * 1.1, color: 0x226622, alpha: 0.15 },
      { radius: radius, color: 0x44aa44, alpha: 0.22 },
      { radius: radius * 0.8, color: 0x66cc66, alpha: 0.18 },
    ];

    layerConfigs.forEach((config, i) => {
      const layer = scene.add.circle(x, y, config.radius, config.color, config.alpha);
      layer.setDepth(17 + i);
      vineLayers.push(layer);
    });

    scene.tweens.add({
      targets: vineLayers,
      alpha: 0,
      duration: 1000,
      onComplete: () => vineLayers.forEach(v => v.destroy()),
    });
  }
}

/**
 * 森林之怒策略 - 藤蔓爆发 + 双重控制
 */
export class ForestRageStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, applyEffects } = context;
    const centerX = player.x;
    const centerY = player.y;
    const radius = skill.rangeValue;
    const duration = 3000;
    const tickInterval = 400;
    const vineCount = 12;

    // 创建多层藤蔓视觉效果
    const vines: Phaser.GameObjects.Graphics[] = [];
    for (let i = 0; i < vineCount; i++) {
      const angle = (i / vineCount) * Math.PI * 2;
      const startX = centerX + Math.cos(angle) * radius * 0.3;
      const startY = centerY + Math.sin(angle) * radius * 0.3;
      const endX = centerX + Math.cos(angle) * radius;
      const endY = centerY + Math.sin(angle) * radius;

      const vine = scene.add.graphics();
      vine.lineStyle(5, 0x44ff44, 0.85);
      vine.beginPath();
      vine.moveTo(startX, startY);
      const segments = 5;
      for (let j = 1; j <= segments; j++) {
        const t = j / segments;
        const waveX = startX + (endX - startX) * t + Math.sin(t * Math.PI * 3) * 12;
        const waveY = startY + (endY - startY) * t + Math.cos(t * Math.PI * 3) * 12;
        vine.lineTo(waveX, waveY);
      }
      vine.strokePath();
      vine.setDepth(30);
      vines.push(vine);

      vine.setScale(0, 0);
      scene.tweens.add({
        targets: vine,
        scaleX: 1,
        scaleY: 1,
        duration: 300,
        delay: i * 40,
        ease: 'Power2',
      });
    }

    // 中心叶片效果
    const centerLeafOuter = scene.add.circle(centerX, centerY, radius * 0.35, 0x44ff44, 0.3);
    const centerLeafMid = scene.add.circle(centerX, centerY, radius * 0.25, 0x66ff66, 0.4);
    const centerLeafInner = scene.add.circle(centerX, centerY, radius * 0.15, 0x88ff88, 0.5);
    centerLeafOuter.setDepth(28);
    centerLeafMid.setDepth(29);
    centerLeafInner.setDepth(30);

    scene.tweens.add({
      targets: [centerLeafOuter, centerLeafMid, centerLeafInner],
      scaleX: 1.8,
      scaleY: 1.8,
      alpha: 0,
      duration: duration,
      onComplete: () => {
        centerLeafOuter.destroy();
        centerLeafMid.destroy();
        centerLeafInner.destroy();
      },
    });

    let elapsed = 0;
    const affectedEnemies = new Set<string>();
    const rageTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          rageTimer.destroy();

          const finalEnemies = findEnemiesInRange(centerX, centerY, radius);
          for (const enemy of finalEnemies) {
            if (enemy.active && !affectedEnemies.has(enemy.instanceId)) {
              applyDamageToEnemy(enemy, Math.floor(damage * 0.5), skill);
            }
            if (applyEffects && skill.effects) {
              const stunEffect = skill.effects.find(e => e.type === 'stun');
              if (stunEffect) {
                applyEffects(enemy, [stunEffect]);
              }
            }
          }

          vines.forEach(vine => {
            scene.tweens.add({
              targets: vine,
              alpha: 0,
              duration: 350,
              onComplete: () => vine.destroy(),
            });
          });
          return;
        }

        const enemies = findEnemiesInRange(centerX, centerY, radius);
        for (const enemy of enemies) {
          if (enemy.active) {
            affectedEnemies.add(enemy.instanceId);
            applyDamageToEnemy(enemy, Math.floor(damage * 0.15), skill);

            if (applyEffects && skill.effects) {
              const slowEffect = skill.effects.find(e => e.type === 'slow');
              if (slowEffect) {
                applyEffects(enemy, [slowEffect]);
              }
            }
          }
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }
}

export class ForestRageVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 多层地面裂痕
    const groundCrack = scene.add.graphics();
    groundCrack.lineStyle(3, 0x2d6b2d, 0.55);
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      groundCrack.beginPath();
      groundCrack.moveTo(x, y);
      const endX = x + Math.cos(angle) * radius;
      const endY = y + Math.sin(angle) * radius;
      groundCrack.lineTo(endX, endY);
      groundCrack.strokePath();
    }
    groundCrack.setDepth(25);

    // 多层绿色光环
    const auraOuter = scene.add.circle(x, y, radius, 0x44ff44, 0.22);
    const auraMid = scene.add.circle(x, y, radius * 0.7, 0x66ff66, 0.3);
    const auraInner = scene.add.circle(x, y, radius * 0.4, 0x88ff88, 0.35);
    auraOuter.setDepth(26);
    auraMid.setDepth(27);
    auraInner.setDepth(28);

    scene.tweens.add({
      targets: [auraOuter, auraMid, auraInner, groundCrack],
      alpha: 0,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 550,
      onComplete: () => {
        auraOuter.destroy();
        auraMid.destroy();
        auraInner.destroy();
        groundCrack.destroy();
      },
    });
  }
}

/**
 * 虚空裂隙策略 - 持续吸引+伤害
 */
export class VoidRiftStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const centerX = player.x;
    const centerY = player.y;
    const radius = skill.rangeValue;
    const duration = 3000;
    const tickInterval = 300;

    // 多层虚空裂隙核心
    const riftOuter = scene.add.circle(centerX, centerY, 50, 0x4400aa, 0.5);
    const riftMid = scene.add.circle(centerX, centerY, 35, 0x6600cc, 0.7);
    const riftInner = scene.add.circle(centerX, centerY, 20, 0x8800ff, 0.9);
    riftOuter.setDepth(20);
    riftMid.setDepth(21);
    riftInner.setDepth(22);

    // 多层虚空环
    const voidRings = scene.add.container(centerX, centerY);
    voidRings.setDepth(18);
    for (let i = 0; i < 5; i++) {
      const ring = scene.add.graphics();
      ring.lineStyle(4 - i * 0.5, 0x8800ff, 0.45 - i * 0.06);
      ring.strokeCircle(0, 0, radius * (0.25 + i * 0.2));
      voidRings.add(ring);

      scene.tweens.add({
        targets: ring,
        angle: 360 * (i % 2 === 0 ? 1 : -1),
        duration: 700 + i * 150,
        repeat: -1,
      });
    }

    // 吸入粒子
    const pullParticles = scene.add.particles(centerX, centerY, 'particle_glow', {
      speed: { min: 40, max: 100 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.45, end: 0 },
      alpha: { start: 0.55, end: 0 },
      tint: [0x6600aa, 0x8800cc, 0xaa00ff],
      lifespan: 700,
      frequency: 45,
      quantity: 2,
    });
    pullParticles.setDepth(17);

    let elapsed = 0;
    const riftTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          riftTimer.destroy();
          riftOuter.destroy();
          riftMid.destroy();
          riftInner.destroy();
          voidRings.destroy();
          pullParticles.destroy();
          return;
        }

        const enemies = findEnemiesInRange(centerX, centerY, radius);
        for (const enemy of enemies) {
          if (enemy.active && enemy.body) {
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, centerX, centerY);
            enemy.x += Math.cos(angle) * 25;
            enemy.y += Math.sin(angle) * 25;
          }
          applyDamageToEnemy(enemy, Math.floor(damage * 0.25), skill);
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }
}

export class VoidRiftVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 多层虚空裂隙核心
    const riftOuter = scene.add.circle(x, y, 50, 0x4400aa, 0.4);
    const riftMid = scene.add.circle(x, y, 35, 0x6600cc, 0.6);
    const riftInner = scene.add.circle(x, y, 20, 0x8800ff, 0.8);
    riftOuter.setDepth(20);
    riftMid.setDepth(21);
    riftInner.setDepth(22);

    // 多层虚空环
    const voidRings = scene.add.container(x, y);
    voidRings.setDepth(18);
    for (let i = 0; i < 5; i++) {
      const ring = scene.add.graphics();
      ring.lineStyle(4 - i * 0.5, 0x8800ff, 0.4 - i * 0.05);
      ring.strokeCircle(0, 0, radius * (0.25 + i * 0.2));
      voidRings.add(ring);
    }

    voidRings.list.forEach((ring, i) => {
      scene.tweens.add({
        targets: ring,
        angle: 360 * (i % 2 === 0 ? 1 : -1),
        duration: 700 + i * 150,
        repeat: 3,
      });
    });

    scene.time.delayedCall(3000, () => {
      scene.tweens.add({
        targets: [riftOuter, riftMid, riftInner, voidRings],
        alpha: 0,
        scale: 0.5,
        duration: 350,
        onComplete: () => {
          riftOuter.destroy();
          riftMid.destroy();
          riftInner.destroy();
          voidRings.destroy();
        },
      });
    });
  }
}

/**
 * 黑洞策略 - 持续吸引+伤害
 */
export class BlackHoleStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, applyLifesteal } = context;
    const centerX = player.x;
    const centerY = player.y;
    const radius = skill.rangeValue;
    const duration = 2000;
    const tickInterval = 300;
    let elapsed = 0;

    // 多层黑洞核心
    const blackHoleOuter = scene.add.circle(centerX, centerY, 55, 0x220066, 0.6);
    const blackHoleMid = scene.add.circle(centerX, centerY, 40, 0x330088, 0.75);
    const blackHoleInner = scene.add.circle(centerX, centerY, 25, 0x4400aa, 0.9);
    blackHoleOuter.setDepth(20);
    blackHoleMid.setDepth(21);
    blackHoleInner.setDepth(22);

    // 多层引力环
    const gravityRings = scene.add.container(centerX, centerY);
    gravityRings.setDepth(18);
    for (let i = 0; i < 6; i++) {
      const ring = scene.add.graphics();
      ring.lineStyle(4 - i * 0.5, 0x6600cc, 0.4 - i * 0.05);
      ring.strokeCircle(0, 0, radius * (0.2 + i * 0.15));
      gravityRings.add(ring);

      scene.tweens.add({
        targets: ring,
        angle: 360 * (i % 2 === 0 ? 1 : -1),
        duration: 600 + i * 100,
        repeat: -1,
      });
    }

    // 吸入粒子
    const pullParticles = scene.add.particles(centerX, centerY, 'particle_glow', {
      speed: { min: 50, max: 120 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: [0x6600cc, 0x8800ee, 0xaa00ff],
      lifespan: 550,
      frequency: 35,
      quantity: 2,
    });
    pullParticles.setDepth(17);

    const damageTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          damageTimer.destroy();
          blackHoleOuter.destroy();
          blackHoleMid.destroy();
          blackHoleInner.destroy();
          gravityRings.destroy();
          pullParticles.destroy();
          return;
        }

        const bodies = scene.physics.overlapCirc(
          centerX, centerY, radius
        ) as Phaser.Physics.Arcade.Body[];

        for (const body of bodies) {
          const obj = body.gameObject;
          if (obj && obj instanceof Enemy && obj.active) {
            const tickDamage = Math.floor(damage * 0.4);
            const skillElement = skill.elements[0] || skill.element;
            obj.takeDamage(tickDamage, skillElement);
            applyLifesteal(tickDamage);

            const angle = Phaser.Math.Angle.Between(obj.x, obj.y, centerX, centerY);
            obj.x += Math.cos(angle) * 20;
            obj.y += Math.sin(angle) * 20;
          }
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }
}

/**
 * 地刺策略 - 伤害+击退
 */
export class GroundSpikeStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const radius = skill.rangeValue;

    // 多层地刺爆发
    for (let ring = 0; ring < 3; ring++) {
      const spikeCount = 8 + ring * 4;
      const ringRadius = radius * (0.4 + ring * 0.25);

      for (let i = 0; i < spikeCount; i++) {
        const angle = (i / spikeCount) * Math.PI * 2;
        const spikeX = player.x + Math.cos(angle) * ringRadius;
        const spikeY = player.y + Math.sin(angle) * ringRadius;

        const spike = scene.add.graphics();
        spike.fillStyle(0x886644, 0.95);
        spike.fillTriangle(0, -25, -10, 8, 10, 8);
        spike.fillStyle(0xaa8866, 0.85);
        spike.fillTriangle(0, -20, -6, 5, 6, 5);
        spike.setPosition(spikeX, spikeY);
        spike.setRotation(angle);
        spike.setDepth(40);

        spike.setScale(0, 0);
        scene.tweens.add({
          targets: spike,
          scaleX: 1,
          scaleY: 1,
          duration: 150,
          delay: ring * 100 + i * 15,
          yoyo: true,
          hold: 150,
          onComplete: () => spike.destroy(),
        });
      }
    }

    // 冲击波
    VisualEffectUtils.createShockwave(scene, player.x, player.y, {
      color: 0x886644,
      radius: radius,
      rings: 3,
      duration: 350,
    });

    const bodies = scene.physics.overlapCirc(
      player.x, player.y, skill.rangeValue
    ) as Phaser.Physics.Arcade.Body[];

    for (const body of bodies) {
      const obj = body.gameObject;
      if (obj && obj instanceof Enemy && obj.active) {
        applyDamageToEnemy(obj, damage, skill);

        const angle = Phaser.Math.Angle.Between(
          player.x, player.y, obj.x, obj.y
        );
        obj.x += Math.cos(angle) * 50;
        obj.y += Math.sin(angle) * 50;
      }
    }
  }
}

/**
 * 雷霆一击策略 - 大范围雷击
 */
export class ThunderStrikeStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, applyEffects } = context;
    const radius = skill.rangeValue;

    // 多层雷云
    const cloudLayers: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 3; i++) {
      const cloud = scene.add.circle(player.x, player.y - 70, radius * (0.5 + i * 0.12), 0x333355, 0.35 - i * 0.05);
      cloud.setDepth(40 + i);
      cloudLayers.push(cloud);
    }

    for (let i = 0; i < 5; i++) {
      scene.time.delayedCall(i * 200, () => {
        const enemies = findEnemiesInRange(player.x, player.y, radius);
        if (enemies.length === 0) return;

        const target = enemies[Math.floor(Math.random() * enemies.length)];
        if (target && target.active) {
          applyDamageToEnemy(target, Math.floor(damage * 0.4), skill);

          if (applyEffects && skill.effects) {
            const stunEffect = skill.effects.find(e => e.type === 'stun');
            if (stunEffect) {
              applyEffects(target, [stunEffect]);
            }
          }

          // 多层雷击视觉效果
          const lightningOuter = scene.add.graphics();
          lightningOuter.lineStyle(10, 0xffff00, 0.3);
          lightningOuter.lineBetween(target.x, target.y - 120, target.x, target.y);
          lightningOuter.setDepth(48);

          const lightningMid = scene.add.graphics();
          lightningMid.lineStyle(4, 0xffff00, 0.75);
          lightningMid.lineBetween(target.x, target.y - 110, target.x, target.y);
          lightningMid.setDepth(49);

          const lightningCore = scene.add.graphics();
          lightningCore.lineStyle(1, 0xffffff, 1);
          lightningCore.lineBetween(target.x, target.y - 100, target.x, target.y);
          lightningCore.setDepth(50);

          // 击中闪光
          const flashOuter = scene.add.circle(target.x, target.y, 35, 0xffff00, 0.5);
          const flashInner = scene.add.circle(target.x, target.y, 18, 0xffffff, 0.85);
          flashOuter.setDepth(51);
          flashInner.setDepth(52);

          scene.tweens.add({
            targets: [lightningOuter, lightningMid, lightningCore, flashOuter, flashInner],
            alpha: 0,
            duration: 200,
            onComplete: () => {
              lightningOuter.destroy();
              lightningMid.destroy();
              lightningCore.destroy();
              flashOuter.destroy();
              flashInner.destroy();
            },
          });
        }
      });
    }

    scene.time.delayedCall(1200, () => cloudLayers.forEach(c => c.destroy()));
  }
}

export class ThunderStrikeVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 多层雷云
    const cloudLayers: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 3; i++) {
      const cloud = scene.add.circle(x, y - 50, radius * (0.4 + i * 0.1), 0x333355, 0.55 - i * 0.08);
      cloud.setDepth(40 + i);
      cloudLayers.push(cloud);
    }

    scene.tweens.add({
      targets: cloudLayers,
      alpha: 0.25,
      duration: 300,
      yoyo: true,
      repeat: 4,
      onComplete: () => cloudLayers.forEach(c => c.destroy()),
    });
  }
}

/**
 * 神圣审判策略 - 光柱审判
 */
export class HolyJudgmentStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, applyEffects } = context;
    const radius = skill.rangeValue;
    const enemies = findEnemiesInRange(player.x, player.y, radius);

    for (const enemy of enemies) {
      applyDamageToEnemy(enemy, damage, skill);

      // 多层光柱视觉效果
      const pillarOuter = scene.add.rectangle(enemy.x, enemy.y - 100, 50, 200, 0xffcc00, 0.3);
      const pillarMid = scene.add.rectangle(enemy.x, enemy.y - 100, 35, 200, 0xffdd44, 0.5);
      const pillarInner = scene.add.rectangle(enemy.x, enemy.y - 100, 18, 200, 0xffffff, 0.75);
      pillarOuter.setDepth(48);
      pillarMid.setDepth(49);
      pillarInner.setDepth(50);

      // 击中闪光
      const flash = scene.add.circle(enemy.x, enemy.y, 25, 0xffffff, 0.8);
      flash.setDepth(51);

      scene.tweens.add({
        targets: [pillarOuter, pillarMid, pillarInner, flash],
        alpha: 0,
        scaleX: 2.2,
        duration: 550,
        onComplete: () => {
          pillarOuter.destroy();
          pillarMid.destroy();
          pillarInner.destroy();
          flash.destroy();
        },
      });
    }
  }
}

export class HolyJudgmentVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 多层神圣光芒
    const lightOuter = scene.add.circle(x, y, radius, 0xffcc00, 0.22);
    const lightMid = scene.add.circle(x, y, radius * 0.75, 0xffdd44, 0.35);
    const lightInner = scene.add.circle(x, y, radius * 0.5, 0xffffff, 0.5);
    lightOuter.setDepth(40);
    lightMid.setDepth(41);
    lightInner.setDepth(42);

    scene.tweens.add({
      targets: [lightOuter, lightMid, lightInner],
      scaleX: 1.6,
      scaleY: 1.6,
      alpha: 0,
      duration: 850,
      onComplete: () => {
        lightOuter.destroy();
        lightMid.destroy();
        lightInner.destroy();
      },
    });
  }
}

/**
 * 圣域策略 - 持续治疗+护盾
 */
export class SanctuaryStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, applyEffects } = context;
    const radius = skill.rangeValue;
    const duration = 5000;
    const tickInterval = 500;

    // 多层圣域区域
    const sanctuaryLayers: Phaser.GameObjects.Arc[] = [];
    const layerConfigs = [
      { radius: radius * 1.1, color: 0xffcc00, alpha: 0.12 },
      { radius: radius, color: 0xffdd44, alpha: 0.2 },
      { radius: radius * 0.8, color: 0xffee88, alpha: 0.18 },
      { radius: radius * 0.5, color: 0xffffaa, alpha: 0.15 },
    ];

    layerConfigs.forEach((config, i) => {
      const layer = scene.add.circle(player.x, player.y, config.radius, config.color, config.alpha);
      layer.setStrokeStyle(2, 0xffcc00, 0.5);
      layer.setDepth(17 + i);
      sanctuaryLayers.push(layer);
    });

    // 神圣粒子
    const holyParticles = scene.add.particles(player.x, player.y, 'particle_glow', {
      speed: { min: 15, max: 40 },
      angle: { min: 250, max: 290 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.5, end: 0 },
      tint: [0xffcc00, 0xffdd44, 0xffffff],
      lifespan: 1400,
      frequency: 80,
      quantity: 2,
      emitZone: {
        type: 'random' as const,
        source: new Phaser.Geom.Circle(0, 0, radius * 0.9) as Phaser.Types.GameObjects.Particles.RandomZoneSource,
      },
    });
    holyParticles.setDepth(22);

    // 旋转光环
    const sanctuaryRings = scene.add.container(player.x, player.y);
    sanctuaryRings.setDepth(18);
    for (let i = 0; i < 3; i++) {
      const ring = scene.add.graphics();
      ring.lineStyle(2, 0xffdd44, 0.45);
      ring.strokeCircle(0, 0, radius * (0.4 + i * 0.25));
      sanctuaryRings.add(ring);

      scene.tweens.add({
        targets: ring,
        angle: 360,
        duration: 2000 + i * 400,
        repeat: -1,
      });
    }

    let elapsed = 0;
    const healTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          healTimer.destroy();
          sanctuaryLayers.forEach(l => l.destroy());
          holyParticles.destroy();
          sanctuaryRings.destroy();
          return;
        }

        player.heal(damage * 0.2);

        const enemies = findEnemiesInRange(player.x, player.y, radius);
        for (const enemy of enemies) {
          applyDamageToEnemy(enemy, Math.floor(damage * 0.15), skill);
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }
}

export class SanctuaryVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 多层圣域光环
    const sanctuaryLayers: Phaser.GameObjects.Arc[] = [];
    const layerConfigs = [
      { radius: radius * 1.1, color: 0xffcc00, alpha: 0.1 },
      { radius: radius, color: 0xffdd44, alpha: 0.18 },
      { radius: radius * 0.8, color: 0xffee88, alpha: 0.15 },
    ];

    layerConfigs.forEach((config, i) => {
      const layer = scene.add.circle(x, y, config.radius, config.color, config.alpha);
      layer.setStrokeStyle(2, 0xffcc00, 0.45);
      layer.setDepth(17 + i);
      sanctuaryLayers.push(layer);
    });

    // 脉动效果
    sanctuaryLayers.forEach(layer => {
      scene.tweens.add({
        targets: layer,
        scaleX: 1.08,
        scaleY: 1.08,
        alpha: layer.alpha * 1.5,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    });
  }
}

/**
 * 自然之力策略 - 召唤自然精灵
 */
export class ForceOfNatureStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const spiritCount = 3;
    const duration = 4000;
    const attackInterval = 800;

    for (let i = 0; i < spiritCount; i++) {
      const angle = (i / spiritCount) * Math.PI * 2;
      const spiritX = player.x + Math.cos(angle) * 60;
      const spiritY = player.y + Math.sin(angle) * 60;

      const spirit = scene.add.container(spiritX, spiritY);
      spirit.setDepth(45);

      // 多层精灵身体
      const bodyOuter = scene.add.circle(0, 0, 18, 0x44ff44, 0.35);
      const bodyMid = scene.add.circle(0, 0, 14, 0x66ff66, 0.6);
      const bodyInner = scene.add.circle(0, 0, 10, 0x88ff88, 0.85);
      const bodyCore = scene.add.circle(0, 0, 5, 0xaaffaa, 0.95);
      spirit.add([bodyOuter, bodyMid, bodyInner, bodyCore]);

      // 环绕动画
      scene.tweens.add({
        targets: spirit,
        angle: 360,
        duration: 2000,
        repeat: -1,
      });

      let attackCount = 0;
      const attackTimer = scene.time.addEvent({
        delay: attackInterval,
        callback: () => {
          attackCount++;
          if (attackCount > 5) {
            attackTimer.destroy();
            scene.tweens.add({
              targets: spirit,
              alpha: 0,
              scale: 0,
              duration: 250,
              onComplete: () => spirit.destroy(),
            });
            return;
          }

          const enemies = findEnemiesInRange(spirit.x, spirit.y, skill.rangeValue);
          if (enemies.length > 0) {
            const target = enemies[0];
            applyDamageToEnemy(target, Math.floor(damage * 0.3), skill);

            // 多层攻击线
            const lineOuter = scene.add.graphics();
            lineOuter.lineStyle(6, 0x44ff44, 0.3);
            lineOuter.lineBetween(spirit.x, spirit.y, target.x, target.y);
            lineOuter.setDepth(43);

            const lineMid = scene.add.graphics();
            lineMid.lineStyle(3, 0x66ff66, 0.6);
            lineMid.lineBetween(spirit.x, spirit.y, target.x, target.y);
            lineMid.setDepth(44);

            scene.tweens.add({
              targets: [lineOuter, lineMid],
              alpha: 0,
              duration: 220,
              onComplete: () => {
                lineOuter.destroy();
                lineMid.destroy();
              },
            });
          }
        },
        repeat: 4,
      });
    }
  }
}

export class ForceOfNatureVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 多层召唤光圈
    const circleOuter = scene.add.circle(x, y, radius, 0x44ff44, 0.15);
    const circleMid = scene.add.circle(x, y, radius * 0.7, 0x66ff66, 0.25);
    const circleInner = scene.add.circle(x, y, radius * 0.4, 0x88ff88, 0.35);
    circleOuter.setDepth(20);
    circleMid.setDepth(21);
    circleInner.setDepth(22);

    scene.tweens.add({
      targets: [circleOuter, circleMid, circleInner],
      scaleX: 1.6,
      scaleY: 1.6,
      alpha: 0,
      duration: 550,
      onComplete: () => {
        circleOuter.destroy();
        circleMid.destroy();
        circleInner.destroy();
      },
    });
  }
}

/**
 * 大地守护策略 - 大幅提升防御
 */
export class EarthGuardianStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, applyEffects } = context;
    const duration = 6000;

    const defenseBoost = 50;
    const originalDefense = (player.stats as any).defense || 0;
    (player.stats as any).defense = originalDefense + defenseBoost;

    const shieldEffect = skill.effects?.find(e => e.type === 'shield');
    if (shieldEffect) {
      player.addShield(shieldEffect.value);
    }

    // 多层石像护盾视觉效果
    const shieldOuter = scene.add.circle(player.x, player.y, 55, 0x665544, 0.25);
    const shieldMid = scene.add.circle(player.x, player.y, 45, 0x776655, 0.4);
    const shieldInner = scene.add.circle(player.x, player.y, 35, 0x887766, 0.55);
    shieldOuter.setStrokeStyle(5, 0xaa8866, 0.65);
    shieldMid.setStrokeStyle(3, 0xaa8866, 0.8);
    shieldInner.setStrokeStyle(2, 0xaa8866, 0.9);
    shieldOuter.setDepth(46);
    shieldMid.setDepth(47);
    shieldInner.setDepth(48);

    // 岩石碎片环绕
    const rocks: Phaser.GameObjects.Graphics[] = [];
    for (let i = 0; i < 8; i++) {
      const rock = scene.add.graphics();
      rock.fillStyle(0x665544, 0.9);
      rock.fillRoundedRect(-10, -10, 20, 20, 5);
      rock.fillStyle(0x887766, 0.7);
      rock.fillRoundedRect(-6, -6, 12, 12, 3);
      rock.setPosition(player.x, player.y);
      rock.setDepth(45);
      rocks.push(rock);

      const orbitAngle = (i / 8) * Math.PI * 2;
      scene.tweens.add({
        targets: rock,
        x: player.x + Math.cos(orbitAngle) * 50,
        y: player.y + Math.sin(orbitAngle) * 50,
        angle: 360,
        duration: 3000,
        repeat: -1,
      });
    }

    scene.time.delayedCall(duration, () => {
      (player.stats as any).defense = originalDefense;
      scene.tweens.add({
        targets: [shieldOuter, shieldMid, shieldInner, ...rocks],
        alpha: 0,
        duration: 350,
        onComplete: () => {
          shieldOuter.destroy();
          shieldMid.destroy();
          shieldInner.destroy();
          rocks.forEach(r => r.destroy());
        },
      });
    });
  }
}

export class EarthGuardianVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 多层大地光环
    const earthOuter = scene.add.circle(x, y, radius, 0x886644, 0.22);
    const earthMid = scene.add.circle(x, y, radius * 0.7, 0x997755, 0.32);
    const earthInner = scene.add.circle(x, y, radius * 0.4, 0xaa8866, 0.4);
    earthOuter.setDepth(20);
    earthMid.setDepth(21);
    earthInner.setDepth(22);

    // 岩石碎片
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const rock = scene.add.graphics();
      rock.fillStyle(0x665544, 0.9);
      rock.fillRoundedRect(-9, -9, 18, 18, 4);
      rock.fillStyle(0x887766, 0.7);
      rock.fillRoundedRect(-5, -5, 10, 10, 2);
      rock.setPosition(x + Math.cos(angle) * 35, y + Math.sin(angle) * 35);
      rock.setDepth(23);

      scene.tweens.add({
        targets: rock,
        x: x + Math.cos(angle) * 55,
        y: y + Math.sin(angle) * 55,
        alpha: 0,
        duration: 450,
        delay: i * 25,
        onComplete: () => rock.destroy(),
      });
    }

    scene.tweens.add({
      targets: [earthOuter, earthMid, earthInner],
      alpha: 0,
      duration: 550,
      onComplete: () => {
        earthOuter.destroy();
        earthMid.destroy();
        earthInner.destroy();
      },
    });
  }
}
