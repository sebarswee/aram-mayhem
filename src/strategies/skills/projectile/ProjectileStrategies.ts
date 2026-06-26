import { SkillStrategy, ProjectileVisualStrategy, SkillExecutionContext } from '../../SkillStrategy';
import { ProjectileConfig } from '@/entities/Projectile';
import { Skill } from '@/types';
import { VisualEffectUtils } from '@/graphics/VisualEffectUtils';
import Phaser from 'phaser';

/**
 * 火球术策略 - 基础投射物 + 燃烧效果
 */
export class FireballStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { player, findNearestEnemy, createProjectile } = context;

    const target = findNearestEnemy(player.x, player.y, skill.rangeValue);
    if (!target) return;

    const angle = Phaser.Math.Angle.Between(player.x, player.y, target.x, target.y);

    const config: ProjectileConfig = {
      skill,
      damage: context.damage,
      speed: skill.speed || 300,
      range: skill.rangeValue,
      isFromPlayer: true,
      color: 0xff4400,
      pierceCount: 0,
    };

    const projectile = createProjectile(config);
    projectile.setData('angle', angle);
  }
}

export class FireballVisualStrategy implements ProjectileVisualStrategy {
  private trailParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  createProjectileEffect(container: Phaser.GameObjects.Container, scene: Phaser.Scene, _element: string, _angle: number): void {
    // 多层火焰核心 - 更丰富的层次
    const coreCenter = scene.add.circle(0, 0, 6, 0xffffff, 1);
    const coreInner = scene.add.circle(0, 0, 10, 0xffff00, 0.95);
    const coreMid = scene.add.circle(0, 0, 14, 0xffaa00, 0.85);
    const coreOuter = scene.add.circle(0, 0, 18, 0xff6600, 0.7);
    const glowInner = scene.add.circle(0, 0, 24, 0xff4400, 0.5);
    const glowMid = scene.add.circle(0, 0, 30, 0xff2200, 0.3);
    const glowOuter = scene.add.circle(0, 0, 38, 0xff0000, 0.15);

    // 添加火焰纹理细节
    const flameDetail1 = scene.add.graphics();
    flameDetail1.fillStyle(0xffff00, 0.6);
    flameDetail1.fillTriangle(0, -12, -4, -4, 4, -4);
    flameDetail1.fillTriangle(0, 12, -4, 4, 4, 4);

    const flameDetail2 = scene.add.graphics();
    flameDetail2.fillStyle(0xffaa00, 0.5);
    flameDetail2.fillTriangle(-8, 0, -14, -6, -14, 6);
    flameDetail2.fillTriangle(8, 0, 14, -6, 14, 6);

    container.add([glowOuter, glowMid, glowInner, coreOuter, coreMid, coreInner, coreCenter, flameDetail1, flameDetail2]);

    // 创建拖尾粒子发射器
    this.trailParticles = scene.add.particles(0, 0, 'particle_fire_spark', {
      speed: { min: 20, max: 60 },
      angle: { min: 160, max: 200 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.8, end: 0 },
      tint: [0xff4400, 0xff6600, 0xffaa00, 0xffff00],
      lifespan: 300,
      frequency: 30,
      quantity: 2,
    });
    container.add(this.trailParticles);

    // 主旋转动画
    scene.tweens.add({
      targets: container,
      angle: 360,
      duration: 400,
      repeat: -1,
    });

    // 多层脉动效果 - 不同频率创造动态感
    scene.tweens.add({
      targets: [coreOuter, glowInner],
      scaleX: 1.15,
      scaleY: 1.15,
      alpha: 0.6,
      duration: 150,
      yoyo: true,
      repeat: -1,
    });

    scene.tweens.add({
      targets: [glowMid, glowOuter],
      scaleX: 1.25,
      scaleY: 1.25,
      alpha: 0.2,
      duration: 200,
      yoyo: true,
      repeat: -1,
      delay: 50,
    });

    // 火焰细节摆动
    scene.tweens.add({
      targets: [flameDetail1, flameDetail2],
      scaleX: 1.1,
      scaleY: 0.9,
      duration: 100,
      yoyo: true,
      repeat: -1,
    });

    // 核心闪烁
    scene.tweens.add({
      targets: coreCenter,
      alpha: 0.8,
      scale: 1.3,
      duration: 80,
      yoyo: true,
      repeat: -1,
    });
  }
}

/**
 * 水弹策略 - 减速效果
 */
export class WaterBulletStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { player, findNearestEnemy, createProjectile } = context;

    const target = findNearestEnemy(player.x, player.y, skill.rangeValue);
    if (!target) return;

    const angle = Phaser.Math.Angle.Between(player.x, player.y, target.x, target.y);

    const config: ProjectileConfig = {
      skill,
      damage: context.damage,
      speed: skill.speed || 320,
      range: skill.rangeValue,
      isFromPlayer: true,
      color: 0x4488ff,
    };

    const projectile = createProjectile(config);
    projectile.setData('angle', angle);
  }
}

export class WaterBulletVisualStrategy implements ProjectileVisualStrategy {
  createProjectileEffect(container: Phaser.GameObjects.Container, scene: Phaser.Scene, _element: string, _angle: number): void {
    // 多层水滴核心
    const dropOuter = scene.add.graphics();
    dropOuter.fillStyle(0x2266cc, 0.6);
    dropOuter.fillCircle(0, 2, 14);
    dropOuter.fillTriangle(0, -16, -10, 0, 10, 0);

    const dropMid = scene.add.graphics();
    dropMid.fillStyle(0x4488ff, 0.85);
    dropMid.fillCircle(0, 2, 11);
    dropMid.fillTriangle(0, -14, -8, 0, 8, 0);

    const dropInner = scene.add.graphics();
    dropInner.fillStyle(0x66aaff, 0.95);
    dropInner.fillCircle(0, 2, 8);
    dropInner.fillTriangle(0, -12, -6, 0, 6, 0);

    // 水波纹效果
    const ripple1 = scene.add.circle(0, 0, 18, 0x4488ff, 0.2);
    const ripple2 = scene.add.circle(0, 0, 24, 0x4488ff, 0.1);

    // 高光点
    const highlight1 = scene.add.circle(-4, -4, 5, 0xffffff, 0.8);
    const highlight2 = scene.add.circle(-2, -6, 3, 0xffffff, 0.5);

    // 水滴纹理线条
    const waterLines = scene.add.graphics();
    waterLines.lineStyle(1, 0xffffff, 0.3);
    waterLines.lineBetween(-4, 0, -2, -8);
    waterLines.lineBetween(0, -2, 0, -10);

    container.add([ripple2, ripple1, dropOuter, dropMid, dropInner, waterLines, highlight1, highlight2]);

    // 水滴拖尾粒子
    const trailParticles = scene.add.particles(0, 0, 'particle_glow', {
      speed: { min: 10, max: 30 },
      angle: { min: 160, max: 200 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: [0x4488ff, 0x66aaff],
      lifespan: 400,
      frequency: 40,
      quantity: 1,
    });
    container.add(trailParticles);

    // 水滴波动动画
    scene.tweens.add({
      targets: container,
      scaleX: 1.08,
      scaleY: 0.92,
      duration: 120,
      yoyo: true,
      repeat: -1,
    });

    // 水波纹扩散
    scene.tweens.add({
      targets: ripple1,
      scale: 1.3,
      alpha: 0,
      duration: 600,
      repeat: -1,
      onRepeat: () => {
        ripple1.setScale(1);
        ripple1.setAlpha(0.2);
      },
    });

    scene.tweens.add({
      targets: ripple2,
      scale: 1.4,
      alpha: 0,
      duration: 800,
      delay: 200,
      repeat: -1,
      onRepeat: () => {
        ripple2.setScale(1);
        ripple2.setAlpha(0.1);
      },
    });

    // 高光闪烁
    scene.tweens.add({
      targets: [highlight1, highlight2],
      alpha: 0.3,
      scale: 0.8,
      duration: 200,
      yoyo: true,
      repeat: -1,
    });
  }
}

/**
 * 冰刺策略 - 冻结效果
 */
export class IceShardStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { player, findNearestEnemy, createProjectile } = context;

    const target = findNearestEnemy(player.x, player.y, skill.rangeValue);
    if (!target) return;

    const angle = Phaser.Math.Angle.Between(player.x, player.y, target.x, target.y);

    const config: ProjectileConfig = {
      skill,
      damage: context.damage,
      speed: skill.speed || 350,
      range: skill.rangeValue,
      isFromPlayer: true,
      color: 0x44ccff,
    };

    const projectile = createProjectile(config);
    projectile.setData('angle', angle);
  }
}

export class IceShardVisualStrategy implements ProjectileVisualStrategy {
  createProjectileEffect(container: Phaser.GameObjects.Container, scene: Phaser.Scene, _element: string, angle: number): void {
    // 多层冰霜光环
    const frostAuraOuter = scene.add.circle(0, 0, 30, 0x44ccff, 0.1);
    const frostAuraMid = scene.add.circle(0, 0, 24, 0x66ddff, 0.15);
    const frostAuraInner = scene.add.circle(0, 0, 18, 0x88eeff, 0.2);

    // 主冰晶 - 更丰富的层次
    const crystal = scene.add.graphics();
    // 外层冰晶
    crystal.fillStyle(0x66ccff, 0.9);
    crystal.fillTriangle(0, -22, -10, 12, 10, 12);
    // 内层亮色
    crystal.fillStyle(0xaaeeff, 1);
    crystal.fillTriangle(0, -18, -6, 8, 6, 8);
    // 核心高亮
    crystal.fillStyle(0xffffff, 0.9);
    crystal.fillTriangle(0, -14, -3, 4, 3, 4);

    // 侧翼冰晶 - 更精细
    const wing1 = scene.add.graphics();
    wing1.fillStyle(0x88ddff, 0.85);
    wing1.fillTriangle(-14, 0, -22, -8, -22, 8);
    wing1.fillStyle(0xccffff, 0.7);
    wing1.fillTriangle(-14, 0, -18, -4, -18, 4);

    const wing2 = scene.add.graphics();
    wing2.fillStyle(0x88ddff, 0.85);
    wing2.fillTriangle(14, 0, 22, -8, 22, 8);
    wing2.fillStyle(0xccffff, 0.7);
    wing2.fillTriangle(14, 0, 18, -4, 18, 4);

    // 小冰晶装饰
    const miniCrystal1 = scene.add.graphics();
    miniCrystal1.fillStyle(0xaaffff, 0.8);
    miniCrystal1.fillTriangle(-6, -16, -10, -12, -2, -12);

    const miniCrystal2 = scene.add.graphics();
    miniCrystal2.fillStyle(0xaaffff, 0.8);
    miniCrystal2.fillTriangle(6, -16, 2, -12, 10, -12);

    // 冰霜粒子拖尾
    const trailParticles = scene.add.particles(0, 0, 'particle_ice_crystal', {
      speed: { min: 15, max: 40 },
      angle: { min: 160, max: 200 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.7, end: 0 },
      tint: [0x88ddff, 0xaaeeff, 0xffffff],
      lifespan: 350,
      frequency: 25,
      quantity: 2,
    });
    container.add(trailParticles);

    container.add([frostAuraOuter, frostAuraMid, frostAuraInner, wing1, wing2, crystal, miniCrystal1, miniCrystal2]);
    container.setRotation(angle);

    // 快速旋转
    scene.tweens.add({
      targets: container,
      angle: container.angle + 360,
      duration: 600,
      repeat: -1,
    });

    // 冰霜光环脉动
    scene.tweens.add({
      targets: [frostAuraMid, frostAuraOuter],
      scale: 1.2,
      alpha: 0.05,
      duration: 300,
      yoyo: true,
      repeat: -1,
    });

    // 侧翼冰晶轻微摆动
    scene.tweens.add({
      targets: [wing1, wing2],
      scaleX: 1.1,
      duration: 150,
      yoyo: true,
      repeat: -1,
    });

    // 小冰晶闪烁
    scene.tweens.add({
      targets: [miniCrystal1, miniCrystal2],
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: -1,
      delay: 50,
    });
  }
}

/**
 * 闪电箭策略 - 连锁闪电
 */
export class LightningBoltStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { player, findNearestEnemy, createProjectile } = context;

    const target = findNearestEnemy(player.x, player.y, skill.rangeValue);
    if (!target) return;

    const angle = Phaser.Math.Angle.Between(player.x, player.y, target.x, target.y);

    const config: ProjectileConfig = {
      skill,
      damage: context.damage,
      speed: skill.speed || 400,
      range: skill.rangeValue,
      isFromPlayer: true,
      color: 0xffff00,
      chainRemaining: skill.chainCount || 2,
      chainRange: 100,
      chainDamageDecay: 0.8,
    };

    const projectile = createProjectile(config);
    projectile.setData('angle', angle);
  }
}

export class LightningBoltVisualStrategy implements ProjectileVisualStrategy {
  createProjectileEffect(container: Phaser.GameObjects.Container, scene: Phaser.Scene, _element: string, angle: number): void {
    // 外层电光光晕
    const outerGlow = scene.add.circle(0, 0, 22, 0xffff00, 0.15);
    const midGlow = scene.add.circle(0, 0, 16, 0xffff00, 0.25);

    // 主闪电体 - 更复杂的锯齿
    const bolt = scene.add.graphics();
    // 核心闪电
    bolt.fillStyle(0xffffff, 1);
    bolt.fillRect(-1, -20, 2, 10);
    bolt.fillRect(-3, -10, 6, 4);
    bolt.fillRect(1, -8, 4, 8);
    bolt.fillRect(-3, -2, 6, 4);
    bolt.fillRect(-1, 0, 2, 20);

    // 外层闪电
    bolt.fillStyle(0xffff00, 0.9);
    bolt.fillRect(-3, -18, 6, 8);
    bolt.fillRect(-5, -12, 10, 6);
    bolt.fillRect(-1, -10, 8, 10);
    bolt.fillRect(-5, -4, 10, 6);
    bolt.fillRect(-3, 0, 6, 18);

    // 电弧细节
    const arcDetail = scene.add.graphics();
    arcDetail.lineStyle(2, 0xffffff, 0.8);
    arcDetail.lineBetween(-8, -14, -4, -10);
    arcDetail.lineBetween(8, -6, 4, -2);
    arcDetail.lineBetween(-6, 4, -2, 8);
    arcDetail.lineBetween(6, 10, 10, 6);

    // 电荷粒子
    const chargeParticles = scene.add.particles(0, 0, 'particle_lightning_arc', {
      speed: { min: 30, max: 80 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0xffff00, 0xffffff, 0xffffaa],
      lifespan: 200,
      frequency: 20,
      quantity: 3,
    });
    container.add(chargeParticles);

    container.add([outerGlow, midGlow, bolt, arcDetail]);
    container.setRotation(angle);

    // 快速闪烁 - 更随机
    scene.tweens.add({
      targets: container,
      alpha: 0.6,
      duration: 40,
      yoyo: true,
      repeat: -1,
    });

    // 光晕脉动
    scene.tweens.add({
      targets: [outerGlow, midGlow],
      scale: 1.3,
      alpha: 0.1,
      duration: 100,
      yoyo: true,
      repeat: -1,
    });

    // 电弧抖动
    scene.tweens.add({
      targets: arcDetail,
      x: { from: -2, to: 2 },
      duration: 30,
      yoyo: true,
      repeat: -1,
    });
  }
}

/**
 * 暗影箭策略 - 穿透效果
 */
export class ShadowBoltStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { player, findNearestEnemy, createProjectile } = context;

    const target = findNearestEnemy(player.x, player.y, skill.rangeValue);
    if (!target) return;

    const angle = Phaser.Math.Angle.Between(player.x, player.y, target.x, target.y);

    const config: ProjectileConfig = {
      skill,
      damage: context.damage,
      speed: skill.speed || 280,
      range: skill.rangeValue,
      isFromPlayer: true,
      color: 0x8800ff,
      pierceCount: 2,
    };

    const projectile = createProjectile(config);
    projectile.setData('angle', angle);
  }
}

export class ShadowBoltVisualStrategy implements ProjectileVisualStrategy {
  createProjectileEffect(container: Phaser.GameObjects.Container, scene: Phaser.Scene, _element: string, _angle: number): void {
    // 多层暗影核心
    const coreCenter = scene.add.circle(0, 0, 5, 0xaa44ff, 1);
    const coreInner = scene.add.circle(0, 0, 9, 0x8800ff, 0.9);
    const coreMid = scene.add.circle(0, 0, 14, 0x6600cc, 0.7);
    const coreOuter = scene.add.circle(0, 0, 20, 0x4400aa, 0.5);
    const glowInner = scene.add.circle(0, 0, 26, 0x6600aa, 0.3);
    const glowOuter = scene.add.circle(0, 0, 34, 0x440088, 0.15);

    // 暗影漩涡纹理
    const vortex = scene.add.graphics();
    vortex.lineStyle(2, 0x8800ff, 0.6);
    for (let i = 0; i < 3; i++) {
      const radius = 10 + i * 4;
      vortex.strokeCircle(0, 0, radius);
    }

    // 暗影触手
    const tentacle1 = scene.add.graphics();
    tentacle1.fillStyle(0x6600aa, 0.6);
    tentacle1.fillTriangle(-12, -6, -20, -10, -18, 2);

    const tentacle2 = scene.add.graphics();
    tentacle2.fillStyle(0x6600aa, 0.6);
    tentacle2.fillTriangle(12, 6, 20, 2, 18, 14);

    // 暗影粒子拖尾
    const trailParticles = scene.add.particles(0, 0, 'particle_glow', {
      speed: { min: 10, max: 40 },
      angle: { min: 160, max: 200 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: [0x8800ff, 0x6600cc, 0xaa44ff],
      lifespan: 400,
      frequency: 35,
      quantity: 2,
    });
    container.add(trailParticles);

    container.add([glowOuter, glowInner, coreOuter, coreMid, vortex, coreInner, coreCenter, tentacle1, tentacle2]);

    // 漩涡旋转
    scene.tweens.add({
      targets: vortex,
      angle: 360,
      duration: 800,
      repeat: -1,
    });

    // 多层脉动
    scene.tweens.add({
      targets: [coreMid, coreOuter],
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0.4,
      duration: 250,
      yoyo: true,
      repeat: -1,
    });

    scene.tweens.add({
      targets: [glowInner, glowOuter],
      scaleX: 1.35,
      scaleY: 1.35,
      alpha: 0.08,
      duration: 350,
      yoyo: true,
      repeat: -1,
      delay: 100,
    });

    // 核心闪烁
    scene.tweens.add({
      targets: coreCenter,
      alpha: 0.6,
      scale: 1.4,
      duration: 150,
      yoyo: true,
      repeat: -1,
    });

    // 触手摆动
    scene.tweens.add({
      targets: [tentacle1, tentacle2],
      angle: { from: -15, to: 15 },
      duration: 200,
      yoyo: true,
      repeat: -1,
    });
  }
}

/**
 * 藤鞭策略 - 远程攻击
 */
export class VineWhipStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { player, findNearestEnemy, createProjectile } = context;

    const target = findNearestEnemy(player.x, player.y, skill.rangeValue);
    if (!target) return;

    const angle = Phaser.Math.Angle.Between(player.x, player.y, target.x, target.y);

    const config: ProjectileConfig = {
      skill,
      damage: context.damage,
      speed: skill.speed || 260,
      range: skill.rangeValue,
      isFromPlayer: true,
      color: 0x44ff44,
    };

    const projectile = createProjectile(config);
    projectile.setData('angle', angle);
  }
}

export class VineWhipVisualStrategy implements ProjectileVisualStrategy {
  createProjectileEffect(container: Phaser.GameObjects.Container, scene: Phaser.Scene, _element: string, angle: number): void {
    // 藤蔓光晕
    const aura = scene.add.circle(0, 0, 20, 0x44ff44, 0.15);

    // 主藤蔓体 - 更丰富的纹理
    const vine = scene.add.graphics();
    // 主干
    vine.fillStyle(0x44cc44, 1);
    vine.fillEllipse(0, 0, 8, 24);
    // 纹理线条
    vine.lineStyle(1, 0x33aa33, 0.8);
    vine.lineBetween(0, -10, -2, -6);
    vine.lineBetween(0, -6, 2, -2);
    vine.lineBetween(0, -2, -2, 2);
    vine.lineBetween(0, 2, 2, 6);
    vine.lineBetween(0, 6, -2, 10);

    // 侧枝
    const branch1 = scene.add.graphics();
    branch1.fillStyle(0x55dd55, 0.9);
    branch1.fillEllipse(-6, -8, 5, 10);
    branch1.fillEllipse(-8, -12, 3, 6);

    const branch2 = scene.add.graphics();
    branch2.fillStyle(0x55dd55, 0.9);
    branch2.fillEllipse(6, 8, 5, 10);
    branch2.fillEllipse(8, 12, 3, 6);

    // 叶片 - 更精细
    const leaf1 = scene.add.graphics();
    leaf1.fillStyle(0x66ff66, 0.95);
    leaf1.fillTriangle(-8, -4, -18, -10, -8, 2);
    leaf1.fillStyle(0x88ff88, 0.7);
    leaf1.fillTriangle(-8, -2, -14, -6, -8, 0);

    const leaf2 = scene.add.graphics();
    leaf2.fillStyle(0x66ff66, 0.95);
    leaf2.fillTriangle(8, 4, 18, -2, 8, 10);
    leaf2.fillStyle(0x88ff88, 0.7);
    leaf2.fillTriangle(8, 6, 14, 2, 8, 8);

    // 小叶子装饰
    const miniLeaf = scene.add.graphics();
    miniLeaf.fillStyle(0x88ff88, 0.8);
    miniLeaf.fillTriangle(-4, 14, -8, 18, -2, 16);
    miniLeaf.fillTriangle(4, -14, 8, -18, 2, -16);

    // 叶子粒子
    const leafParticles = scene.add.particles(0, 0, 'particle_glow', {
      speed: { min: 10, max: 30 },
      angle: { min: 150, max: 210 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.5, end: 0 },
      tint: [0x44ff44, 0x66ff66, 0x88ff88],
      lifespan: 400,
      frequency: 50,
      quantity: 1,
    });
    container.add(leafParticles);

    container.add([aura, branch1, branch2, vine, leaf1, leaf2, miniLeaf]);
    container.setRotation(angle);

    // 扭动动画
    scene.tweens.add({
      targets: container,
      angle: angle + 0.15,
      duration: 80,
      yoyo: true,
      repeat: -1,
    });

    // 藤蔓波动
    scene.tweens.add({
      targets: vine,
      scaleX: 1.1,
      scaleY: 0.95,
      duration: 100,
      yoyo: true,
      repeat: -1,
    });

    // 叶片摆动
    scene.tweens.add({
      targets: [leaf1, leaf2, miniLeaf],
      scaleX: 1.15,
      scaleY: 0.9,
      duration: 120,
      yoyo: true,
      repeat: -1,
    });

    // 侧枝呼吸
    scene.tweens.add({
      targets: [branch1, branch2],
      alpha: 0.7,
      duration: 150,
      yoyo: true,
      repeat: -1,
    });
  }
}

/**
 * 种子炸弹策略 - 爆炸范围伤害
 */
export class SeedBombStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { player, findNearestEnemy, createProjectile } = context;

    const target = findNearestEnemy(player.x, player.y, skill.rangeValue);
    if (!target) return;

    const angle = Phaser.Math.Angle.Between(player.x, player.y, target.x, target.y);

    const config: ProjectileConfig = {
      skill,
      damage: context.damage,
      speed: skill.speed || 280,
      range: skill.rangeValue,
      isFromPlayer: true,
      color: 0x88ff88,
      explodeOnHit: true,
      explodeRadius: 60,
      explodeDamage: 0.5,
    };

    const projectile = createProjectile(config);
    projectile.setData('angle', angle);
  }
}

export class SeedBombVisualStrategy implements ProjectileVisualStrategy {
  createProjectileEffect(container: Phaser.GameObjects.Container, scene: Phaser.Scene, _element: string, _angle: number): void {
    // 外层能量光环
    const outerGlow = scene.add.circle(0, 0, 22, 0x66ff66, 0.2);
    const innerGlow = scene.add.circle(0, 0, 16, 0x88ff88, 0.3);

    // 种子主体 - 更丰富的层次
    const seed = scene.add.graphics();
    // 外壳
    seed.fillStyle(0x66dd66, 1);
    seed.fillEllipse(0, 0, 14, 18);
    // 内层
    seed.fillStyle(0x88ee88, 0.95);
    seed.fillEllipse(0, 0, 10, 14);
    // 核心
    seed.fillStyle(0xaaffaa, 0.9);
    seed.fillEllipse(0, 0, 6, 9);

    // 种子纹理
    const texture = scene.add.graphics();
    texture.lineStyle(1.5, 0x55bb55, 0.7);
    texture.strokeEllipse(0, 0, 14, 18);
    texture.lineBetween(0, -8, 0, 8);
    texture.lineBetween(-6, -3, 6, 3);

    // 高光点
    const highlight1 = scene.add.circle(-3, -5, 4, 0xffffff, 0.6);
    const highlight2 = scene.add.circle(-1, -7, 2, 0xffffff, 0.4);

    // 萌芽特效
    const sprout = scene.add.graphics();
    sprout.fillStyle(0x44dd44, 0.9);
    sprout.fillTriangle(0, -12, -3, -8, 3, -8);
    sprout.fillStyle(0x66ee66, 0.8);
    sprout.fillTriangle(0, -14, -2, -10, 2, -10);

    // 能量粒子
    const energyParticles = scene.add.particles(0, 0, 'particle_glow', {
      speed: { min: 20, max: 50 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: [0x66ff66, 0x88ff88, 0xaaffaa],
      lifespan: 300,
      frequency: 40,
      quantity: 2,
    });
    container.add(energyParticles);

    container.add([outerGlow, innerGlow, seed, texture, sprout, highlight1, highlight2]);

    // 旋转动画
    scene.tweens.add({
      targets: container,
      angle: 360,
      duration: 500,
      repeat: -1,
    });

    // 能量脉动
    scene.tweens.add({
      targets: [outerGlow, innerGlow],
      scale: 1.25,
      alpha: 0.1,
      duration: 300,
      yoyo: true,
      repeat: -1,
    });

    // 种子呼吸
    scene.tweens.add({
      targets: seed,
      scaleX: 1.1,
      scaleY: 0.95,
      duration: 200,
      yoyo: true,
      repeat: -1,
    });

    // 萌芽摇摆
    scene.tweens.add({
      targets: sprout,
      angle: { from: -10, to: 10 },
      duration: 150,
      yoyo: true,
      repeat: -1,
    });

    // 高光闪烁
    scene.tweens.add({
      targets: [highlight1, highlight2],
      alpha: 0.3,
      duration: 180,
      yoyo: true,
      repeat: -1,
    });
  }
}

/**
 * 诅咒策略 - 远程诅咒
 */
export class HexStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { player, findNearestEnemy, createProjectile } = context;

    const target = findNearestEnemy(player.x, player.y, skill.rangeValue);
    if (!target) return;

    const angle = Phaser.Math.Angle.Between(player.x, player.y, target.x, target.y);

    const config: ProjectileConfig = {
      skill,
      damage: context.damage,
      speed: skill.speed || 220,
      range: skill.rangeValue,
      isFromPlayer: true,
      color: 0xaa00ff,
    };

    const projectile = createProjectile(config);
    projectile.setData('angle', angle);
  }
}

export class HexVisualStrategy implements ProjectileVisualStrategy {
  createProjectileEffect(container: Phaser.GameObjects.Container, scene: Phaser.Scene, _element: string, _angle: number): void {
    // 多层诅咒光环
    const auraOuter = scene.add.circle(0, 0, 28, 0x6600aa, 0.12);
    const auraMid = scene.add.circle(0, 0, 22, 0x8800cc, 0.18);
    const auraInner = scene.add.circle(0, 0, 16, 0xaa00ff, 0.25);

    // 五角星 - 更精细
    const star = scene.add.graphics();
    star.fillStyle(0x8800ff, 0.95);
    const points: number[] = [];
    for (let i = 0; i < 5; i++) {
      const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      points.push(Math.cos(a) * 14, Math.sin(a) * 14);
    }
    star.fillPoints(points, true);

    // 内圈
    star.fillStyle(0xaa44ff, 0.8);
    star.strokeCircle(0, 0, 8);

    // 外圈装饰
    const ring = scene.add.graphics();
    ring.lineStyle(2, 0x8800ff, 0.6);
    ring.strokeCircle(0, 0, 16);
    ring.lineStyle(1, 0xaa44ff, 0.4);
    ring.strokeCircle(0, 0, 20);

    // 中心眼睛 - 更细致
    const eyeOuter = scene.add.ellipse(0, 0, 10, 6, 0x660066, 1);
    const eyeWhite = scene.add.ellipse(0, 0, 7, 4, 0xffffff, 0.9);
    const eyePupil = scene.add.circle(0, 0, 2.5, 0x660066, 1);
    const eyeHighlight = scene.add.circle(-1, -1, 1, 0xffffff, 0.7);

    // 诅咒符文
    const rune = scene.add.graphics();
    rune.lineStyle(1, 0xcc66ff, 0.5);
    rune.strokeCircle(0, 0, 18);
    // 符文线条
    rune.lineBetween(0, -18, 0, -14);
    rune.lineBetween(-18, 0, -14, 0);
    rune.lineBetween(18, 0, 14, 0);
    rune.lineBetween(0, 18, 0, 14);

    // 暗影粒子
    const shadowParticles = scene.add.particles(0, 0, 'particle_glow', {
      speed: { min: 15, max: 40 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: [0x8800ff, 0xaa44ff, 0xcc66ff],
      lifespan: 350,
      frequency: 30,
      quantity: 2,
    });
    container.add(shadowParticles);

    container.add([auraOuter, auraMid, auraInner, ring, rune, star, eyeOuter, eyeWhite, eyePupil, eyeHighlight]);

    // 五角星旋转
    scene.tweens.add({
      targets: star,
      angle: 360,
      duration: 2000,
      repeat: -1,
    });

    // 光环脉动
    scene.tweens.add({
      targets: [auraMid, auraOuter],
      scale: 1.2,
      alpha: 0.06,
      duration: 400,
      yoyo: true,
      repeat: -1,
    });

    // 符文环旋转（反方向）
    scene.tweens.add({
      targets: [ring, rune],
      angle: -360,
      duration: 3000,
      repeat: -1,
    });

    // 整体脉动
    scene.tweens.add({
      targets: container,
      scaleX: 1.15,
      scaleY: 1.15,
      alpha: 0.75,
      duration: 250,
      yoyo: true,
      repeat: -1,
    });

    // 眼睛眨眼效果
    scene.tweens.add({
      targets: [eyeWhite, eyePupil, eyeHighlight],
      scaleY: 0.2,
      duration: 80,
      yoyo: true,
      repeat: -1,
      repeatDelay: 1500,
    });

    // 瞳孔移动
    scene.tweens.add({
      targets: eyePupil,
      x: { from: -1, to: 1 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });
  }
}
