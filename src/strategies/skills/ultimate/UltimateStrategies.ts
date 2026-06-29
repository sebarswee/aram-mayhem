import { SkillStrategy, VisualEffectStrategy, SkillExecutionContext } from '../../SkillStrategy';
import { Skill } from '@/types';
import { Enemy } from '@/entities/Enemy';
import { VisualEffectUtils } from '@/graphics/VisualEffectUtils';
import Phaser from 'phaser';
import { createBurnVisualModifier } from '@/modifiers/visual/VisualModifiers';
import { StatusEffectType } from '@/modifiers/modifiers/StatusEffectModifier';
import { EffectPoolManager, InfernoEffectConfig, DragonBreathEffectConfig, AbyssVortexEffectConfig, FrozenDomainEffectConfig, ThunderApocalypseEffectConfig, ShadowRealmEffectConfig, DeathDecayEffectConfig, EarthGuardianEffectConfig, VoidRiftEffectConfig, BlackHoleEffectConfig, SanctuaryEffectConfig, HolyJudgmentEffectConfig, MeteorEffectConfig } from '@/pools';

/**
 * 炎龙吐息策略 - 扇形持续火焰
 *
 * 使用对象池管理视觉效果
 */
export class DragonBreathStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, findNearestEnemy, applyEffects } = context;
    const duration = 2000;
    const tickInterval = 200;
    const range = skill.rangeValue;
    const angleSpread = Math.PI / 3;

    const nearestEnemy = findNearestEnemy(player.x, player.y, range + 100);
    const playerAngle = nearestEnemy
      ? Phaser.Math.Angle.Between(player.x, player.y, nearestEnemy.x, nearestEnemy.y)
      : 0;

    // 从对象池获取效果
    const effectPools = (scene as any).effectPools as EffectPoolManager;

    // 配置图层
    const layerConfigs: DragonBreathEffectConfig['layerConfigs'] = [
      { radius: range * 1.1, color: 0xff2200, alpha: 0.2 },
      { radius: range, color: 0xff4400, alpha: 0.35 },
      { radius: range * 0.8, color: 0xff6600, alpha: 0.5 },
      { radius: range * 0.5, color: 0xffaa00, alpha: 0.65 },
    ];

    // 配置粒子
    const fireParticleConfig = {
      speedMin: 200,
      speedMax: 450,
      lifespan: 500,
      frequency: 20,
      quantity: 4,
    };

    const sparkParticleConfig = {
      speedMin: 250,
      speedMax: 500,
      lifespan: 400,
      frequency: 30,
      quantity: 3,
    };

    const effect = effectPools.dragonBreath.acquireWithConfig({
      x: player.x,
      y: player.y,
      radius: range,
      angleSpread: angleSpread,
      playerAngle: playerAngle,
      duration: duration,
      layerConfigs: layerConfigs,
      fireParticleConfig: fireParticleConfig,
      sparkParticleConfig: sparkParticleConfig,
    });

    // 如果效果获取失败，提前返回
    if (!effect) {
      console.warn('[DragonBreathStrategy] Failed to acquire effect from pool');
      return;
    }

    // 屏幕震动
    VisualEffectUtils.screenShake(scene, { intensity: 0.008, duration: 300 });

    // 创建跟随更新事件（每50ms更新一次效果位置和角度）
    const updateInterval = 50;
    const updateEvent = scene.time.addEvent({
      delay: updateInterval,
      callback: () => {
        // 获取最新玩家位置和朝向
        const currentNearest = findNearestEnemy(player.x, player.y, range + 100);
        const currentAngle = currentNearest
          ? Phaser.Math.Angle.Between(player.x, player.y, currentNearest.x, currentNearest.y)
          : playerAngle;

        // 更新效果位置和角度
        effectPools.dragonBreath.updateEffectTransform(
          effect,
          player.x,
          player.y,
          currentAngle,
          angleSpread,
          layerConfigs
        );
      },
      repeat: Math.floor(duration / updateInterval) - 1,
    });

    let elapsed = 0;
    const breathTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          breathTimer.destroy();
          updateEvent.destroy();
          // 对象池会自动回收效果
          return;
        }

        // 获取当前角度用于伤害判定
        const currentNearest = findNearestEnemy(player.x, player.y, range + 100);
        const currentAngle = currentNearest
          ? Phaser.Math.Angle.Between(player.x, player.y, currentNearest.x, currentNearest.y)
          : playerAngle;

        const enemies = findEnemiesInRange(player.x, player.y, range);
        for (const enemy of enemies) {
          const enemyAngle = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
          const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(enemyAngle - currentAngle));
          if (angleDiff < angleSpread / 2) {
            applyDamageToEnemy(enemy, Math.floor(damage * 0.3), skill);

            // 应用燃烧效果
            if (applyEffects && skill.effects) {
              const burnEffect = skill.effects.find(e => e.type === 'burn');
              if (burnEffect) {
                applyEffects(enemy, [burnEffect]);
              }
            }

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
    // 火焰锥形由 DragonBreathStrategy 创建和管理
    // 这里只创建瞬发的火焰粒子爆发效果
    VisualEffectUtils.createParticleBurst(scene, x, y, {
      count: 40,
      color: 0xff6600,
      speed: { min: 150, max: 350 },
      angle: { min: -30, max: 30 },
      scale: { start: 0.9, end: 0 },
      lifespan: 600,
      texture: 'particle_fire_core',
    });
  }
}

/**
 * 烈焰风暴策略 - 持续燃烧区域 + 燃烧扩散机制
 *
 * 使用对象池管理视觉效果
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

    // 从对象池获取效果
    const effectPools = (scene as any).effectPools as EffectPoolManager;
    const layerConfigs: InfernoEffectConfig['layerConfigs'] = [
      { radius: radius * 1.1, color: 0xff2200, alpha: 0.15 },
      { radius: radius, color: 0xff4400, alpha: 0.25 },
      { radius: radius * 0.8, color: 0xff6600, alpha: 0.2 },
      { radius: radius * 0.5, color: 0xffaa00, alpha: 0.15 },
    ];

    const effect = effectPools.inferno.acquireWithConfig({
      x: player.x,
      y: player.y,
      radius: radius,
      duration: duration,
      layerConfigs: layerConfigs,
    });

    // 死亡事件监听（燃烧扩散机制）
    const deathHandler = (enemy: Enemy) => {
      if (!this.activeInfernos.has(instanceId)) return;

      const hasInfernoBurn = enemy.modifierStack.hasStatusEffect(StatusEffectType.BURN);

      if (hasInfernoBurn) {
        const nearbyEnemies = findEnemiesInRange(enemy.x, enemy.y, this.burnSpreadRadius);

        for (const nearbyEnemy of nearbyEnemies) {
          nearbyEnemy.modifierStack.addModifier(
            createBurnVisualModifier(burnValue, burnDuration, 'fire')
          );
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

    // 伤害计时器
    let elapsed = 0;
    const infernoTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          infernoTimer.destroy();
          this.activeInfernos.delete(instanceId);
          scene.events.off('enemyKilled', deathHandler);
          // 对象池会自动回收效果
          return;
        }

        const enemies = findEnemiesInRange(player.x, player.y, radius);
        for (const enemy of enemies) {
          applyDamageToEnemy(enemy, Math.floor(damage * 0.15), skill);
          enemy.modifierStack.addModifier(
            createBurnVisualModifier(burnValue, burnDuration, 'fire')
          );
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }
}

export class InfernoVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 燃烧区域和火焰粒子由 InfernoStrategy 创建和管理
    // 这里不创建任何重复的持续视觉效果
  }
}

/**
 * 深渊漩涡策略 - 持续吸引
 *
 * 使用对象池管理视觉效果
 */
export class AbyssVortexStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, applyEffects } = context;
    const centerX = player.x;
    const centerY = player.y;
    const radius = skill.rangeValue;
    const duration = 3000;
    const tickInterval = 200;

    // 从对象池获取效果
    const effectPools = (scene as any).effectPools as EffectPoolManager;

    // 配置旋转环
    const ringConfigs: AbyssVortexEffectConfig['ringConfigs'] = [];
    for (let i = 0; i < 5; i++) {
      ringConfigs.push({
        lineWidth: 4 - i * 0.5,
        color: 0x4488ff,
        alpha: 0.5 - i * 0.08,
        radiusMultiplier: 0.3 + i * 0.18,
        rotationDuration: 800 + i * 200,
        direction: i % 2 === 0 ? 1 : -1,
      });
    }

    // 配置深渊圆
    const abyssConfigs: AbyssVortexEffectConfig['abyssConfigs'] = [
      { radius: 40, color: 0x2244aa, alpha: 0.6 },
      { radius: 28, color: 0x3366cc, alpha: 0.75 },
      { radius: 16, color: 0x4488ff, alpha: 0.9 },
    ];

    // 配置粒子
    const particleConfig: AbyssVortexEffectConfig['particleConfig'] = {
      speedMin: 50,
      speedMax: 120,
      lifespan: 600,
      frequency: 40,
      quantity: 2,
      colors: [0x4488ff, 0x66aaff],
    };

    const effect = effectPools.abyssVortex.acquireWithConfig({
      x: centerX,
      y: centerY,
      radius: radius,
      duration: duration,
      ringConfigs: ringConfigs,
      abyssConfigs: abyssConfigs,
      particleConfig: particleConfig,
    });

    let elapsed = 0;
    const vortexTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          vortexTimer.destroy();
          // 对象池会自动回收效果
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

          // 应用减速效果
          if (applyEffects && skill.effects) {
            const slowEffect = skill.effects.find(e => e.type === 'slow');
            if (slowEffect) {
              applyEffects(enemy, [slowEffect]);
            }
          }
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }
}

export class AbyssVortexVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 漩涡容器、深渊圆和粒子由 AbyssVortexStrategy 创建和管理
    // 这里不创建任何重复的持续视觉效果
  }
}

/**
 * 冰封领域策略 - 持续冻结
 *
 * 使用对象池管理视觉效果
 */
export class FrozenDomainStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, applyEffects } = context;
    const radius = skill.rangeValue;
    const duration = 4000;
    const tickInterval = 500;

    // 从对象池获取效果
    const effectPools = (scene as any).effectPools as EffectPoolManager;

    // 配置 4 层冰封区域
    const layerConfigs: FrozenDomainEffectConfig['layerConfigs'] = [
      { radius: radius * 1.1, color: 0x66ccff, alpha: 0.12 },
      { radius: radius, color: 0x88ddff, alpha: 0.2 },
      { radius: radius * 0.8, color: 0xaaeeff, alpha: 0.18 },
      { radius: radius * 0.5, color: 0xccffff, alpha: 0.15 },
    ];

    // 配置 3 个旋转冰环
    const ringConfigs: FrozenDomainEffectConfig['ringConfigs'] = [
      { lineWidth: 2, color: 0xaaeeff, alpha: 0.5, radiusMultiplier: 0.4, rotationDuration: 1500, direction: 1 },
      { lineWidth: 2, color: 0xaaeeff, alpha: 0.5, radiusMultiplier: 0.65, rotationDuration: 1800, direction: -1 },
      { lineWidth: 2, color: 0xaaeeff, alpha: 0.5, radiusMultiplier: 0.9, rotationDuration: 2100, direction: 1 },
    ];

    // 配置粒子
    const particleConfig: FrozenDomainEffectConfig['particleConfig'] = {
      speedMin: 20,
      speedMax: 50,
      lifespan: 1200,
      frequency: 70,
      quantity: 2,
      colors: [0x88ddff, 0xaaeeff, 0xffffff],
    };

    const effect = effectPools.frozenDomain.acquireWithConfig({
      x: player.x,
      y: player.y,
      radius: radius,
      duration: duration,
      layerConfigs: layerConfigs,
      ringConfigs: ringConfigs,
      particleConfig: particleConfig,
    });

    let elapsed = 0;
    const domainTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          domainTimer.destroy();
          // 对象池会自动回收效果
          return;
        }

        const enemies = findEnemiesInRange(player.x, player.y, radius);
        for (const enemy of enemies) {
          applyDamageToEnemy(enemy, Math.floor(damage * 0.2), skill);

          // 应用冻结效果
          if (applyEffects && skill.effects) {
            const freezeEffect = skill.effects.find(e => e.type === 'freeze');
            if (freezeEffect) {
              applyEffects(enemy, [freezeEffect]);
            }
          }

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
    // 冰封区域和冰环由 FrozenDomainStrategy 创建和管理
    // 这里不创建任何重复的持续视觉效果
  }
}

/**
   * 绝对零度策略 - 秒杀低血量
   */
  export class AbsoluteZeroStrategy implements SkillStrategy {
    execute(skill: Skill, context: SkillExecutionContext): void {
      const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, applyEffects } = context;
      const radius = skill.rangeValue;
      const executeThreshold = 0.10;

      // 视觉效果由 AbsoluteZeroVisualStrategy 处理，这里只处理伤害逻辑

      const enemies = findEnemiesInRange(player.x, player.y, radius);
      for (const enemy of enemies) {
        const hpPercent = enemy.currentHp / enemy.maxHp;
        if (hpPercent < executeThreshold) {
          // 秒杀：造成等同于当前血量的伤害
          applyDamageToEnemy(enemy, enemy.currentHp, skill);
        } else {
          // 正常伤害
          applyDamageToEnemy(enemy, damage, skill);
        }

        // 应用冻结效果
        if (applyEffects && skill.effects) {
          const freezeEffect = skill.effects.find(e => e.type === 'freeze');
          if (freezeEffect) {
            applyEffects(enemy, [freezeEffect]);
          }
        }
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

    // 屏幕震动和闪光
    VisualEffectUtils.screenShake(scene, { intensity: 0.015, duration: 200 });
    VisualEffectUtils.screenFlash(scene, { color: 0xccffff, intensity: 0.4, duration: 150 });
  }
}

/**
 * 雷霆万钧策略 - 全屏连锁雷击
 *
 * 使用对象池管理视觉效果
 */
export class ThunderApocalypseStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, applyEffects } = context;
    const strikeCount = 12;
    const strikeInterval = 200;

    // 从对象池获取效果
    const effectPools = (scene as any).effectPools as EffectPoolManager;

    // 屏幕震动
    VisualEffectUtils.screenShake(scene, { intensity: 0.01, duration: strikeCount * strikeInterval });

    // 使用对象池创建雷霆万钧效果
    effectPools.thunderApocalypse.acquireWithConfig({
      x: player.x,
      y: player.y,
      rangeValue: skill.rangeValue,
      strikeCount: strikeCount,
      strikeInterval: strikeInterval,
      skill: skill,
      damage: damage,
      findEnemiesInRange: findEnemiesInRange,
      applyDamageToEnemy: applyDamageToEnemy,
      applyEffects: applyEffects,
    } as ThunderApocalypseEffectConfig);
  }
}

export class ThunderApocalypseVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 云层和雷击效果已由 ThunderApocalypseStrategy 创建和管理
    // 这里不创建任何视觉效果，避免重复
  }
}

/**
 * 审判之光策略 - 伤害+治疗
 */
export class JudgmentLightStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, applyEffects } = context;
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

      // 应用效果（如果有其他效果如伤害加深等）
      if (applyEffects && skill.effects) {
        const damageEffects = skill.effects.filter(e => e.type !== 'heal');
        if (damageEffects.length > 0) {
          applyEffects(enemy, damageEffects);
        }
      }

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
    // 光柱和射线由 JudgmentLightStrategy 创建和管理
    // 这里只创建瞬发的核心光爆效果
    VisualEffectUtils.createElementGlow(scene, x, y, {
      color: 0xffcc00,
      radius: 40,
      duration: 500,
      pulseCount: 2,
    });
  }
}

/**
 * 暗影降临策略 - 降防+持续伤害
 *
 * 使用对象池管理视觉效果
 */
export class ShadowDescentStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, applyEffects } = context;
    const radius = skill.rangeValue;
    const duration = 4000;
    const tickInterval = 500;

    // 从对象池获取效果
    const effectPools = (scene as any).effectPools as EffectPoolManager;

    // 配置暗影图层
    const layerConfigs: ShadowRealmEffectConfig['layerConfigs'] = [
      { radius: radius * 1.1, color: 0x220044, alpha: 0.2 },
      { radius: radius, color: 0x440066, alpha: 0.35 },
      { radius: radius * 0.8, color: 0x660088, alpha: 0.3 },
      { radius: radius * 0.5, color: 0x8800aa, alpha: 0.25 },
    ];

    // 配置漩涡环
    const vortexConfigs: ShadowRealmEffectConfig['vortexConfigs'] = [
      { lineWidth: 2, color: 0x8800ff, alpha: 0.4, radiusMultiplier: 0.4, rotationDuration: 1500, direction: 1 },
      { lineWidth: 2, color: 0x8800ff, alpha: 0.4, radiusMultiplier: 0.65, rotationDuration: 1800, direction: -1 },
      { lineWidth: 2, color: 0x8800ff, alpha: 0.4, radiusMultiplier: 0.9, rotationDuration: 2100, direction: 1 },
    ];

    // 配置粒子
    const particleConfig: ShadowRealmEffectConfig['particleConfig'] = {
      speedMin: 20,
      speedMax: 50,
      lifespan: 1200,
      frequency: 60,
      quantity: 3,
      colors: [0x660088, 0x8800aa, 0xaa00cc],
    };

    const effect = effectPools.shadowRealm.acquireWithConfig({
      x: player.x,
      y: player.y,
      radius: radius,
      duration: duration,
      layerConfigs: layerConfigs,
      vortexConfigs: vortexConfigs,
      particleConfig: particleConfig,
    });

    let elapsed = 0;
    const shadowTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          shadowTimer.destroy();
          // 对象池会自动回收效果
          return;
        }

        const enemies = findEnemiesInRange(player.x, player.y, radius);
        for (const enemy of enemies) {
          applyDamageToEnemy(enemy, Math.floor(damage * 0.15), skill);

          // 应用防御破坏效果
          if (applyEffects && skill.effects) {
            const defenseBreakEffect = skill.effects.find(e => e.type === 'defense_break');
            if (defenseBreakEffect) {
              applyEffects(enemy, [defenseBreakEffect]);
            }
          }

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
    // 暗影区域和漩涡由 ShadowDescentStrategy 创建和管理
    // 这里不创建任何重复的持续视觉效果
  }
}

/**
 * 死亡凋零策略 - 持续吸血
 *
 * 使用对象池管理视觉效果
 */
export class DeathDecayStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, applyEffects } = context;
    const radius = skill.rangeValue;
    const duration = 5000;
    const tickInterval = 400;
    const lifestealPercent = 0.3;

    // 从对象池获取效果
    const effectPools = (scene as any).effectPools as EffectPoolManager;

    // 配置凋零图层
    const layerConfigs: DeathDecayEffectConfig['layerConfigs'] = [
      { radius: radius * 1.1, color: 0x220022, alpha: 0.2 },
      { radius: radius, color: 0x440044, alpha: 0.35 },
      { radius: radius * 0.8, color: 0x660066, alpha: 0.3 },
      { radius: radius * 0.5, color: 0x880088, alpha: 0.25 },
    ];

    // 配置粒子
    const particleConfig: DeathDecayEffectConfig['particleConfig'] = {
      speedMin: 15,
      speedMax: 45,
      lifespan: 1400,
      frequency: 70,
      quantity: 2,
      colors: [0x660066, 0x880088, 0xaa00aa],
    };

    const effect = effectPools.deathDecay.acquireWithConfig({
      x: player.x,
      y: player.y,
      radius: radius,
      duration: duration,
      layerConfigs: layerConfigs,
      particleConfig: particleConfig,
    });

    let elapsed = 0;
    const decayTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          decayTimer.destroy();
          // 对象池会自动回收效果
          return;
        }

        const enemies = findEnemiesInRange(player.x, player.y, radius);
        let totalDamage = 0;
        for (const enemy of enemies) {
          const tickDamage = Math.floor(damage * 0.12);
          applyDamageToEnemy(enemy, tickDamage, skill);
          totalDamage += tickDamage;

          // 应用中毒效果
          if (applyEffects && skill.effects) {
            const poisonEffect = skill.effects.find(e => e.type === 'poison');
            if (poisonEffect) {
              applyEffects(enemy, [poisonEffect]);
            }
          }

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
    // 凋零区域圆由 DeathDecayStrategy 创建和管理
    // 这里不创建任何重复的持续视觉效果
  }
}

/**
 * 山崩地裂策略 - 范围伤害+击飞
 */
export class MountainCollapseStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, applyEffects } = context;
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

      // 应用击退和眩晕效果
      if (applyEffects && skill.effects) {
        const knockbackEffect = skill.effects.find(e => e.type === 'knockback');
        const stunEffect = skill.effects.find(e => e.type === 'stun');
        if (knockbackEffect) {
          applyEffects(enemy, [knockbackEffect]);
        }
        if (stunEffect) {
          applyEffects(enemy, [stunEffect]);
        }
      }

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
    // 地裂效果由 MountainCollapseStrategy 创建和管理
    // 这里只创建瞬发的冲击波效果
    VisualEffectUtils.createShockwave(scene, x, y, {
      color: 0x886644,
      radius: radius,
      rings: 4,
      duration: 450,
    });
  }
}

/**
 * 陨石坠落策略 - 大范围爆炸
 *
 * 使用对象池管理视觉效果
 */
export class MeteorStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, applyEffects } = context;
    const radius = skill.rangeValue;
    const warningDuration = 500;
    const explosionDuration = 1000;

    // 从对象池获取效果
    const effectPools = (scene as any).effectPools as EffectPoolManager;

    // 配置预警图层
    const warningLayerConfigs: MeteorEffectConfig['warningLayerConfigs'] = [
      { radiusMultiplier: 0.6, color: 0xff4400, alpha: 0.15 },
      { radiusMultiplier: 0.8, color: 0xff4400, alpha: 0.23 },
      { radiusMultiplier: 1.0, color: 0xff4400, alpha: 0.31 },
    ];

    // 配置爆炸图层
    const explosionLayerConfigs: MeteorEffectConfig['explosionLayerConfigs'] = [
      { radiusMultiplier: 1.1, color: 0xff2200, alpha: 0.5 },
      { radiusMultiplier: 1.0, color: 0xff6600, alpha: 0.7 },
      { radiusMultiplier: 0.7, color: 0xffaa00, alpha: 0.85 },
      { radiusMultiplier: 0.4, color: 0xffffff, alpha: 0.95 },
    ];

    // 伤害回调
    const applyDamage = (bodies: Phaser.GameObjects.GameObject[]) => {
      const enemies = findEnemiesInRange(player.x, player.y, radius);
      for (const enemy of enemies) {
        applyDamageToEnemy(enemy, damage, skill);

        // 应用燃烧效果
        if (applyEffects && skill.effects) {
          const burnEffect = skill.effects.find(e => e.type === 'burn');
          if (burnEffect) {
            applyEffects(enemy, [burnEffect]);
          }
        }
      }
    };

    const effect = effectPools.meteor.acquireWithConfig({
      x: player.x,
      y: player.y,
      radius: radius,
      damage: damage,
      skill: skill,
      warningDuration: warningDuration,
      explosionDuration: explosionDuration,
      duration: warningDuration + explosionDuration,
      warningLayerConfigs: warningLayerConfigs,
      explosionLayerConfigs: explosionLayerConfigs,
      applyDamage: applyDamage,
    });
  }
}

export class MeteorVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 预警区域和爆炸序列由 MeteorStrategy 创建和管理
    // 这里不创建任何重复的视觉效果
  }
}

/**
 * 海啸策略 - 全屏推开
 */
export class TsunamiStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, applyEffects } = context;
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

      // 应用击退效果
      if (applyEffects && skill.effects) {
        const knockbackEffect = skill.effects.find(e => e.type === 'knockback');
        if (knockbackEffect) {
          applyEffects(enemy, [knockbackEffect]);
        }
      }

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
    // 海啸波浪由 TsunamiStrategy 创建和管理
    // 这里不创建任何重复的持续视觉效果
  }
}

/**
 * 大地震击策略 - 全屏眩晕
 */
export class EarthquakeStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, applyEffects } = context;
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

      // 应用眩晕效果
      if (applyEffects && skill.effects) {
        const stunEffect = skill.effects.find(e => e.type === 'stun');
        if (stunEffect) {
          applyEffects(enemy, [stunEffect]);
        }
      }
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
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, applyEffects } = context;
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

      // 应用眩晕效果
      if (applyEffects && skill.effects) {
        const stunEffect = skill.effects.find(e => e.type === 'stun');
        if (stunEffect) {
          applyEffects(enemy, [stunEffect]);
        }
      }
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
    // 藤蔓区域由 OvergrowthStrategy 创建和管理
    // 这里不创建任何重复的持续视觉效果
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
    // 中心叶片效果由 ForestRageStrategy 创建和管理
    // 这里只创建瞬发的地面裂痕效果
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

    scene.tweens.add({
      targets: groundCrack,
      alpha: 0,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 550,
      onComplete: () => groundCrack.destroy(),
    });
  }
}

/**
 * 虚空裂隙策略 - 持续吸引+伤害
 *
 * 使用对象池管理视觉效果
 */
export class VoidRiftStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, applyEffects } = context;
    const centerX = player.x;
    const centerY = player.y;
    const radius = skill.rangeValue;
    const duration = 3000;
    const tickInterval = 300;

    // 从对象池获取效果
    const effectPools = (scene as any).effectPools as EffectPoolManager;

    // 配置虚空环
    const ringConfigs: VoidRiftEffectConfig['ringConfigs'] = [];
    for (let i = 0; i < 5; i++) {
      ringConfigs.push({
        lineWidth: 4 - i * 0.5,
        color: 0x8800ff,
        alpha: 0.45 - i * 0.06,
        radiusMultiplier: 0.25 + i * 0.2,
        rotationDuration: 700 + i * 150,
        direction: i % 2 === 0 ? 1 : -1,
      });
    }

    // 配置粒子
    const particleConfig: VoidRiftEffectConfig['particleConfig'] = {
      speedMin: 40,
      speedMax: 100,
      lifespan: 700,
      frequency: 45,
      quantity: 2,
      colors: [0x6600aa, 0x8800cc, 0xaa00ff],
    };

    const effect = effectPools.voidRift.acquireWithConfig({
      x: centerX,
      y: centerY,
      radius: radius,
      duration: duration,
      ringConfigs: ringConfigs,
      particleConfig: particleConfig,
    });

    let elapsed = 0;
    const riftTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          riftTimer.destroy();
          // 对象池会自动回收效果
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

          // 应用中毒效果
          if (applyEffects && skill.effects) {
            const poisonEffect = skill.effects.find(e => e.type === 'poison');
            if (poisonEffect) {
              applyEffects(enemy, [poisonEffect]);
            }
          }
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }
}

export class VoidRiftVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 虚空裂隙核心和虚空环由 VoidRiftStrategy 创建和管理
    // 这里不创建任何重复的持续视觉效果
  }
}

/**
 * 黑洞策略 - 持续吸引+伤害
 *
 * 使用对象池管理视觉效果
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

    // 从对象池获取效果
    const effectPools = (scene as any).effectPools as EffectPoolManager;

    // 配置引力环
    const ringConfigs: BlackHoleEffectConfig['ringConfigs'] = [];
    for (let i = 0; i < 6; i++) {
      ringConfigs.push({
        lineWidth: 4 - i * 0.5,
        color: 0x6600cc,
        alpha: 0.4 - i * 0.05,
        radiusMultiplier: 0.2 + i * 0.15,
        rotationDuration: 600 + i * 100,
        direction: i % 2 === 0 ? 1 : -1,
      });
    }

    // 配置粒子
    const particleConfig: BlackHoleEffectConfig['particleConfig'] = {
      speedMin: 50,
      speedMax: 120,
      lifespan: 550,
      frequency: 35,
      quantity: 2,
      colors: [0x6600cc, 0x8800ee, 0xaa00ff],
    };

    const effect = effectPools.blackHole.acquireWithConfig({
      x: centerX,
      y: centerY,
      radius: radius,
      duration: duration,
      ringConfigs: ringConfigs,
      particleConfig: particleConfig,
    });

    const damageTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          damageTimer.destroy();
          // 对象池会自动回收效果
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
    // 雷云由 ThunderStrikeStrategy 创建和管理
    // 这里不创建任何重复的持续视觉效果
  }
}

/**
 * 神圣审判策略 - 光柱审判
 *
 * 使用对象池管理视觉效果
 */
export class HolyJudgmentStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, applyEffects } = context;
    const radius = skill.rangeValue;
    const enemies = findEnemiesInRange(player.x, player.y, radius);

    // 从对象池获取效果
    const effectPools = (scene as any).effectPools as EffectPoolManager;

    for (const enemy of enemies) {
      applyDamageToEnemy(enemy, damage, skill);

      // 从对象池获取神圣审判效果
      const effect = effectPools.holyJudgment.acquireWithConfig({
        x: enemy.x,
        y: enemy.y,
        targetX: enemy.x,
        targetY: enemy.y,
        duration: 550,
      } as HolyJudgmentEffectConfig);
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
 *
 * 使用对象池管理视觉效果
 */
export class SanctuaryStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, applyEffects } = context;
    const radius = skill.rangeValue;
    const duration = 5000;
    const tickInterval = 500;

    // 从对象池获取效果
    const effectPools = (scene as any).effectPools as EffectPoolManager;

    // 配置圣域图层
    const layerConfigs: SanctuaryEffectConfig['layerConfigs'] = [
      { radius: radius * 1.1, color: 0xffcc00, alpha: 0.12 },
      { radius: radius, color: 0xffdd44, alpha: 0.2 },
      { radius: radius * 0.8, color: 0xffee88, alpha: 0.18 },
      { radius: radius * 0.5, color: 0xffffaa, alpha: 0.15 },
    ];

    // 配置旋转光环
    const ringConfigs: SanctuaryEffectConfig['ringConfigs'] = [
      { lineWidth: 2, color: 0xffdd44, alpha: 0.45, radiusMultiplier: 0.4, rotationDuration: 2000 },
      { lineWidth: 2, color: 0xffdd44, alpha: 0.45, radiusMultiplier: 0.65, rotationDuration: 2400 },
      { lineWidth: 2, color: 0xffdd44, alpha: 0.45, radiusMultiplier: 0.9, rotationDuration: 2800 },
    ];

    // 配置粒子
    const particleConfig: SanctuaryEffectConfig['particleConfig'] = {
      speedMin: 15,
      speedMax: 40,
      lifespan: 1400,
      frequency: 80,
      quantity: 2,
      colors: [0xffcc00, 0xffdd44, 0xffffff],
    };

    const effect = effectPools.sanctuary.acquireWithConfig({
      x: player.x,
      y: player.y,
      radius: radius,
      duration: duration,
      layerConfigs: layerConfigs,
      ringConfigs: ringConfigs,
      particleConfig: particleConfig,
    });

    let elapsed = 0;
    const healTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          healTimer.destroy();
          // 对象池会自动回收效果
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
    // 圣域区域和旋转光环由 SanctuaryStrategy 创建和管理
    // 这里不创建任何重复的持续视觉效果
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
      const baseAngle = (i / spiritCount) * Math.PI * 2;
      const orbitRadius = 60;

      const spirit = scene.add.container(player.x, player.y);
      spirit.setDepth(45);

      // 多层精灵身体
      const bodyOuter = scene.add.circle(0, 0, 18, 0x44ff44, 0.35);
      const bodyMid = scene.add.circle(0, 0, 14, 0x66ff66, 0.6);
      const bodyInner = scene.add.circle(0, 0, 10, 0x88ff88, 0.85);
      const bodyCore = scene.add.circle(0, 0, 5, 0xaaffaa, 0.95);
      spirit.add([bodyOuter, bodyMid, bodyInner, bodyCore]);

      // 存储需要清理的 tweens
      const activeTweens: Phaser.Tweens.Tween[] = [];

      // 自转动画
      const spinTween = scene.tweens.add({
        targets: spirit,
        angle: 360,
        duration: 2000,
        repeat: -1,
      });
      activeTweens.push(spinTween);

      // 跟随玩家并环绕的位置更新
      let currentAngle = baseAngle;
      const updateEvent = scene.time.addEvent({
        delay: 16, // ~60fps
        callback: () => {
          currentAngle += 0.03; // 环绕速度
          const spiritX = player.x + Math.cos(currentAngle) * orbitRadius;
          const spiritY = player.y + Math.sin(currentAngle) * orbitRadius;
          spirit.setPosition(spiritX, spiritY);
        },
        repeat: -1,
      });

      let attackCount = 0;
      const attackTimer = scene.time.addEvent({
        delay: attackInterval,
        callback: () => {
          attackCount++;
          if (attackCount > 5) {
            attackTimer.destroy();
            // 停止无限重复的 tweens 和事件
            activeTweens.forEach(tween => {
              if (tween && tween.isPlaying()) {
                tween.stop();
              }
            });
            updateEvent.destroy();
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
 *
 * 使用对象池管理视觉效果
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

    // 从对象池获取效果
    const effectPools = (scene as any).effectPools as EffectPoolManager;

    const effect = effectPools.earthGuardian.acquireWithConfig({
      x: player.x,
      y: player.y,
      radius: 50,
      duration: duration,
    } as EarthGuardianEffectConfig);

    // 跟随玩家移动的更新事件
    const followEvent = scene.time.addEvent({
      delay: 16, // ~60fps
      callback: () => {
        if (effect && effect.active) {
          effect.setPosition(player.x, player.y);
        }
      },
      repeat: -1,
    });

    scene.time.delayedCall(duration, () => {
      (player.stats as any).defense = originalDefense;
      followEvent.destroy();
      // 对象池会自动回收效果
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
