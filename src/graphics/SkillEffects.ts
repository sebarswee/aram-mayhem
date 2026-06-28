import Phaser from 'phaser';
import { Skill } from '@/types';
import { Enemy } from '@/entities/Enemy';
import { skillStrategyRegistry } from '@/strategies';

/**
 * 技能视觉效果管理器
 * 为每个技能创建独特的视觉表现
 */
export class SkillEffects {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 创建投射物效果
   */
  createProjectileEffect(skill: Skill, x: number, y: number, angle: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    container.setDepth(40);

    const element = skill.elements[0] || 'fire';

    // 尝试使用策略模式
    if (skillStrategyRegistry.hasProjectileVisualStrategy(skill.id)) {
      skillStrategyRegistry.createProjectileVisualEffect(skill.id, container, this.scene, element, angle);
    } else {
      // 默认投射物效果
      this.createDefaultProjectile(container, element);
    }

    return container;
  }

  /**
   * 火球效果 - 旋转火焰 + 尾迹
   */
  private createFireballEffect(container: Phaser.GameObjects.Container): void {
    // 火焰核心
    const core = this.scene.add.circle(0, 0, 12, 0xffff00, 1);
    const inner = this.scene.add.circle(0, 0, 16, 0xff8800, 0.9);
    const outer = this.scene.add.circle(0, 0, 20, 0xff4400, 0.7);
    const glow = this.scene.add.circle(0, 0, 28, 0xff2200, 0.3);

    container.add([glow, outer, inner, core]);

    // 旋转动画
    this.scene.tweens.add({
      targets: container,
      angle: 360,
      duration: 500,
      repeat: -1,
    });

    // 脉动效果
    this.scene.tweens.add({
      targets: [outer, glow],
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0.5,
      duration: 200,
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * 冰刺效果 - 旋转冰晶
   */
  private createIceShardEffect(container: Phaser.GameObjects.Container, angle: number): void {
    // 主冰晶
    const crystal = this.scene.add.graphics();
    crystal.fillStyle(0x88ddff, 1);
    crystal.fillTriangle(0, -18, -8, 10, 8, 10);
    crystal.fillStyle(0xffffff, 0.8);
    crystal.fillTriangle(0, -14, -4, 6, 4, 6);

    // 侧翼冰晶
    const wing1 = this.scene.add.graphics();
    wing1.fillStyle(0x66ccff, 0.8);
    wing1.fillTriangle(-12, 0, -18, -6, -18, 6);

    const wing2 = this.scene.add.graphics();
    wing2.fillStyle(0x66ccff, 0.8);
    wing2.fillTriangle(12, 0, 18, -6, 18, 6);

    // 冰霜光环
    const frostAura = this.scene.add.circle(0, 0, 20, 0x44ccff, 0.2);

    container.add([frostAura, wing1, wing2, crystal]);
    container.setRotation(angle);

    // 旋转动画
    this.scene.tweens.add({
      targets: container,
      angle: container.angle + 360,
      duration: 800,
      repeat: -1,
    });
  }

  /**
   * 闪电箭效果 - 闪烁电弧
   */
  private createLightningBoltEffect(container: Phaser.GameObjects.Container, angle: number): void {
    // 主闪电
    const bolt = this.scene.add.graphics();
    bolt.lineStyle(4, 0xffff00, 1);
    bolt.lineBetween(0, -20, 0, 20);
    bolt.lineStyle(2, 0xffffff, 1);
    bolt.lineBetween(0, -18, 0, 18);

    // 电弧分支
    const arc1 = this.scene.add.graphics();
    arc1.lineStyle(2, 0xffff44, 0.8);
    arc1.lineBetween(0, -8, -10, -15);
    arc1.lineBetween(0, 5, 12, 0);

    // 发光效果
    const glow = this.scene.add.circle(0, 0, 16, 0xffff88, 0.4);

    container.add([glow, bolt, arc1]);
    container.setRotation(angle);

    // 闪烁效果
    this.scene.tweens.add({
      targets: [bolt, arc1],
      alpha: 0.5,
      duration: 50,
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * 默认投射物效果
   */
  private createDefaultProjectile(container: Phaser.GameObjects.Container, element: string): void {
    const colors: Record<string, number> = {
      fire: 0xff4400,
      ice: 0x44ccff,
      lightning: 0xffff00,
      shadow: 0x8800ff,
      holy: 0xffcc00,
      physical: 0xffffff,
    };

    const color = colors[element] || 0xffffff;
    const core = this.scene.add.circle(0, 0, 10, color, 1);
    const glow = this.scene.add.circle(0, 0, 15, color, 0.5);

    container.add([glow, core]);
  }

  /**
   * 创建范围技能效果
   */
  createAreaEffect(skill: Skill, x: number, y: number): void {
    // 尝试使用策略模式
    if (skillStrategyRegistry.hasVisualStrategy(skill.id)) {
      skillStrategyRegistry.createVisualEffect(skill.id, this.scene, x, y, skill.rangeValue, skill.elements[0]);
      return;
    }

    // 默认效果
    this.createDefaultAreaEffect(x, y, skill.rangeValue, skill.elements[0]);
  }

  /**
   * 毒雾效果 - 持续毒雾
   */
  private createPoisonCloudEffect(x: number, y: number, radius: number): void {
    // 毒雾粒子系统
    const poison = this.scene.add.particles(x, y, 'particle_glow', {
      speed: { min: 30, max: 80 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: 0x44ff44, // 绿色毒雾
      lifespan: 2000,
      frequency: 80,
      quantity: 3,
      emitZone: {
        type: 'random' as const,
        source: new Phaser.Geom.Circle(0, 0, radius) as Phaser.Types.GameObjects.Particles.RandomZoneSource,
      },
    });
    poison.setDepth(20);

    // 毒雾区域
    const poisonZone = this.scene.add.circle(x, y, radius, 0x44ff44, 0.15);
    poisonZone.setDepth(19);

    // 3秒后停止
    this.scene.time.delayedCall(3000, () => {
      poison.stop();
      this.scene.tweens.add({
        targets: [poison, poisonZone],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          poison.destroy();
          poisonZone.destroy();
        },
      });
    });
  }

  // ==================== 新增技能视觉效果 ====================

  /**
   * 烈焰波效果 - 向前释放火焰波
   */
  private createFlameWaveEffect(x: number, y: number, radius: number): void {
    // 火焰环
    const ring = this.scene.add.graphics();
    ring.lineStyle(8, 0xff4400, 0.8);
    ring.strokeCircle(x, y, radius);
    ring.setDepth(20);

    // 内部火焰
    const inner = this.scene.add.graphics();
    inner.fillStyle(0xff8800, 0.4);
    inner.fillCircle(x, y, radius * 0.7);
    inner.setDepth(21);

    // 火焰粒子爆发
    const particles = this.scene.add.particles(x, y, 'particle_fire', {
      speed: { min: 100, max: 250 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 600,
      quantity: 20,
      emitting: false,
    });
    particles.explode();
    particles.setDepth(22);

    // 扩展动画
    this.scene.tweens.add({
      targets: ring,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 400,
      onComplete: () => {
        ring.destroy();
        inner.destroy();
        particles.destroy();
      },
    });

    this.scene.tweens.add({
      targets: inner,
      scale: 1.3,
      alpha: 0,
      duration: 300,
    });
  }

  /**
   * 冰霜新星效果
   */
  private createFrostNovaEffect(x: number, y: number, radius: number): void {
    // 冰霜波
    const wave = this.scene.add.graphics();
    wave.lineStyle(6, 0x44ccff, 0.9);
    wave.strokeCircle(x, y, radius);
    wave.fillStyle(0x88ddff, 0.3);
    wave.fillCircle(x, y, radius);
    wave.setDepth(20);

    // 冰晶
    const crystals: Phaser.GameObjects.Graphics[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const cx = x + Math.cos(angle) * radius * 0.7;
      const cy = y + Math.sin(angle) * radius * 0.7;

      const crystal = this.scene.add.graphics();
      crystal.fillStyle(0xffffff, 0.8);
      crystal.fillTriangle(cx, cy - 15, cx - 8, cy + 5, cx + 8, cy + 5);
      crystal.setDepth(21);
      crystals.push(crystal);
    }

    // 冰霜粒子
    const particles = this.scene.add.particles(x, y, 'particle_ice', {
      speed: { min: 80, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 800,
      quantity: 30,
      emitting: false,
    });
    particles.explode();
    particles.setDepth(22);

    // 动画
    this.scene.tweens.add({
      targets: wave,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        wave.destroy();
        particles.destroy();
      },
    });

    this.scene.tweens.add({
      targets: crystals,
      alpha: 0,
      scale: 0.5,
      duration: 400,
      onComplete: () => crystals.forEach(c => c.destroy()),
    });
  }

  /**
   * 陨石效果
   */
  private createMeteorEffect(x: number, y: number, radius: number): void {
    // 陨石下落警告
    const warning = this.scene.add.circle(x, y, radius, 0xff4400, 0.3);
    warning.setDepth(20);

    // 倒计时闪烁
    this.scene.tweens.add({
      targets: warning,
      alpha: 0.6,
      duration: 200,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        warning.destroy();

        // 陨石撞击
        const impact = this.scene.add.circle(x, y, radius, 0xff8800, 0.8);
        impact.setDepth(21);

        // 火焰爆发
        const explosion = this.scene.add.particles(x, y, 'particle_fire', {
          speed: { min: 150, max: 400 },
          angle: { min: 0, max: 360 },
          scale: { start: 1, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: 800,
          quantity: 40,
          emitting: false,
        });
        explosion.explode();
        explosion.setDepth(22);

        // 冲击波
        const shockwave = this.scene.add.graphics();
        shockwave.lineStyle(4, 0xffff00, 0.8);
        shockwave.strokeCircle(x, y, radius);
        shockwave.setDepth(23);

        this.scene.tweens.add({
          targets: impact,
          scale: 1.2,
          alpha: 0,
          duration: 500,
          onComplete: () => impact.destroy(),
        });

        this.scene.tweens.add({
          targets: shockwave,
          scaleX: 2,
          scaleY: 2,
          alpha: 0,
          duration: 400,
          onComplete: () => {
            shockwave.destroy();
            explosion.destroy();
          },
        });
      },
    });
  }

  /**
   * 暴风雪效果 - 持续效果
   */
  private createBlizzardEffect(x: number, y: number, radius: number): void {
    // 雪花粒子系统
    const blizzard = this.scene.add.particles(x, y, 'particle_ice', {
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 1500,
      frequency: 50,
      quantity: 2,
      emitZone: {
        type: 'random' as const,
        source: new Phaser.Geom.Circle(0, 0, radius) as Phaser.Types.GameObjects.Particles.RandomZoneSource,
      },
    });
    blizzard.setDepth(20);

    // 霜冻区域
    const frostZone = this.scene.add.circle(x, y, radius, 0x88ddff, 0.2);
    frostZone.setDepth(19);

    // 3秒后停止
    this.scene.time.delayedCall(3000, () => {
      blizzard.stop();
      this.scene.tweens.add({
        targets: [blizzard, frostZone],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          blizzard.destroy();
          frostZone.destroy();
        },
      });
    });
  }

  /**
   * 雷霆风暴效果
   */
  private createThunderStormEffect(x: number, y: number, radius: number): void {
    // 风暴云
    const cloud = this.scene.add.circle(x, y, radius, 0x333355, 0.4);
    cloud.setDepth(20);

    // 随机雷击（只负责视觉效果）
    let strikeCount = 0;
    const maxStrikes = 8;
    const strikeInterval = this.scene.time.addEvent({
      delay: 300,
      callback: () => {
        if (strikeCount >= maxStrikes) {
          strikeInterval.destroy();
          cloud.destroy();
          return;
        }

        // 随机位置雷击
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * radius * 0.8;
        const strikeX = x + Math.cos(angle) * dist;
        const strikeY = y + Math.sin(angle) * dist;

        // 闪电
        const lightning = this.scene.add.graphics();
        lightning.lineStyle(3, 0xffff00, 1);
        lightning.lineBetween(strikeX, strikeY - 100, strikeX, strikeY);
        lightning.lineStyle(6, 0xffff88, 0.5);
        lightning.lineBetween(strikeX, strikeY - 100, strikeX, strikeY);
        lightning.setDepth(21);

        // 闪光
        const flash = this.scene.add.circle(strikeX, strikeY, 30, 0xffffff, 0.8);
        flash.setDepth(22);

        this.scene.tweens.add({
          targets: [lightning, flash],
          alpha: 0,
          duration: 150,
          onComplete: () => {
            lightning.destroy();
            flash.destroy();
          },
        });

        strikeCount++;
      },
      repeat: maxStrikes,
    });
  }

  /**
   * 默认范围效果
   */
  private createDefaultAreaEffect(x: number, y: number, radius: number, element: string): void {
    const colors: Record<string, number> = {
      fire: 0xff4400,
      ice: 0x44ccff,
      lightning: 0xffff00,
      shadow: 0x8800ff,
      holy: 0xffcc00,
    };

    const color = colors[element] || 0xffffff;

    const ring = this.scene.add.circle(x, y, radius, color, 0.4);
    ring.setDepth(20);

    const inner = this.scene.add.circle(x, y, radius * 0.5, color, 0.6);
    inner.setDepth(21);

    this.scene.tweens.add({
      targets: [ring, inner],
      alpha: 0,
      scale: 1.5,
      duration: 400,
      onComplete: () => {
        ring.destroy();
        inner.destroy();
      },
    });
  }

  // ==================== 新增技能视觉效果 ====================

  /**
   * 潮汐效果 - 水流推开
   */
  private createTidalWaveEffect(x: number, y: number, radius: number): void {
    // 水波
    const wave = this.scene.add.circle(x, y, radius, 0x4488ff, 0.5);
    wave.setDepth(20);

    // 水流粒子
    const particles = this.scene.add.particles(x, y, 'particle_water', {
      speed: { min: 100, max: 250 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 500,
      quantity: 30,
      emitting: false,
    });
    particles.explode();
    particles.setDepth(21);

    this.scene.tweens.add({
      targets: wave,
      scale: 1.5,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        wave.destroy();
        particles.destroy();
      },
    });
  }

  /**
   * 雷霆万钧效果 - 全屏连锁雷击
   * @deprecated 已被 ThunderApocalypseStrategy 替代
   */
  /* DISABLED: Replaced by ThunderApocalypseStrategy
  private createThunderApocalypseEffect(x: number, y: number, radius: number): void {
    // 风暴云
    const cloud = this.scene.add.circle(x, y, radius, 0x333355, 0.3);
    cloud.setDepth(20);

    // 闪电随机击落（视觉效果）
    const strikes: Phaser.GameObjects.Graphics[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius * 0.7;
      const strikeX = x + Math.cos(angle) * dist;
      const strikeY = y + Math.sin(angle) * dist;

      const lightning = this.scene.add.graphics();
      lightning.lineStyle(3, 0xffff00, 1);
      lightning.lineBetween(strikeX, strikeY - 50, strikeX, strikeY);
      lightning.setDepth(21);
      strikes.push(lightning);

      // 闪烁
      this.scene.tweens.add({
        targets: lightning,
        alpha: 0,
        delay: i * 100,
        duration: 150,
        onComplete: () => lightning.destroy(),
      });
    }

    this.scene.time.delayedCall(1000, () => {
      cloud.destroy();
    });
  }
  */

  /**
   * 炎龙吐息效果 - 扇形火焰
   */
  private createDragonBreathEffect(x: number, y: number, radius: number): void {
    // 火焰扇形
    const breath = this.scene.add.graphics();
    breath.fillStyle(0xff4400, 0.7);

    // 扇形绘制
    const points: { x: number; y: number }[] = [];
    for (let i = -30; i <= 30; i += 5) {
      const angle = (i * Math.PI) / 180;
      points.push({
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius,
      });
    }
    points.push({ x, y });

    breath.beginPath();
    breath.moveTo(x, y);
    for (const p of points) {
      breath.lineTo(p.x, p.y);
    }
    breath.closePath();
    breath.fillPath();
    breath.setDepth(20);

    // 火焰粒子
    const particles = this.scene.add.particles(x, y, 'particle_fire', {
      speed: { min: 150, max: 300 },
      angle: { min: -30, max: 30 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 400,
      quantity: 20,
      emitting: false,
    });
    particles.explode();
    particles.setDepth(21);

    this.scene.tweens.add({
      targets: breath,
      alpha: 0,
      duration: 600,
      onComplete: () => {
        breath.destroy();
        particles.destroy();
      },
    });
  }

  /**
   * 烈焰风暴效果 - 持续燃烧区域
   * @deprecated 已被 InfernoStrategy 替代
   */
  /* DISABLED: Replaced by InfernoStrategy
  private createInfernoEffect(x: number, y: number, radius: number): void {
    // 火焰区域
    const inferno = this.scene.add.circle(x, y, radius, 0xff4400, 0.3);
    inferno.setDepth(20);

    // 火焰粒子持续喷发
    const particles = this.scene.add.particles(x, y, 'particle_fire', {
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 2000,
      frequency: 100,
      quantity: 3,
    });
    particles.setDepth(21);

    this.scene.time.delayedCall(5000, () => {
      particles.stop();
      this.scene.tweens.add({
        targets: [inferno, particles],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          inferno.destroy();
          particles.destroy();
        },
      });
    });
  }
  */

  /**
   * 深渊漩涡效果 - 持续吸引
   * @deprecated 已被 AbyssVortexStrategy 替代
   */
  /* DISABLED: Replaced by AbyssVortexStrategy
  private createAbyssVortexEffect(x: number, y: number, radius: number): void {
    // 漩涡核心
    const vortex = this.scene.add.circle(x, y, 30, 0x2266cc, 1);
    vortex.setDepth(21);

    // 旋转环
    const rings: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 3; i++) {
      const ring = this.scene.add.circle(x, y, radius - i * 30, 0x4488ff, 0.2 - i * 0.05);
      ring.setDepth(20);
      rings.push(ring);
    }

    // 旋转动画
    this.scene.tweens.add({
      targets: rings,
      angle: 360,
      duration: 1000,
      repeat: 3,
    });

    this.scene.time.delayedCall(3000, () => {
      this.scene.tweens.add({
        targets: [vortex, ...rings],
        alpha: 0,
        scale: 0.5,
        duration: 300,
        onComplete: () => {
          vortex.destroy();
          rings.forEach(r => r.destroy());
        },
      });
    });
  }
  */

  /**
   * 冰封领域效果 - 持续冻结
   * @deprecated 已被 FrozenDomainStrategy 替代
   */
  /* DISABLED: Replaced by FrozenDomainStrategy
  private createFrozenDomainEffect(x: number, y: number, radius: number): void {
    // 冰霜区域
    const domain = this.scene.add.circle(x, y, radius, 0x88ddff, 0.3);
    domain.setDepth(20);

    // 冰霜粒子
    const particles = this.scene.add.particles(x, y, 'particle_ice', {
      speed: { min: 30, max: 80 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.7, end: 0 },
      lifespan: 2000,
      frequency: 80,
      quantity: 2,
    });
    particles.setDepth(21);

    this.scene.time.delayedCall(4000, () => {
      particles.stop();
      this.scene.tweens.add({
        targets: [domain, particles],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          domain.destroy();
          particles.destroy();
        },
      });
    });
  }
  */

  /**
   * 绝对零度效果 - 极寒爆发
   */
  private createAbsoluteZeroEffect(x: number, y: number, radius: number): void {
    // 极寒核心
    const core = this.scene.add.circle(x, y, 50, 0xffffff, 1);
    core.setDepth(21);

    // 冰霜爆发
    const wave = this.scene.add.circle(x, y, radius, 0x88ffff, 0.8);
    wave.setDepth(20);

    // 冰晶粒子
    const particles = this.scene.add.particles(x, y, 'particle_ice', {
      speed: { min: 200, max: 400 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 600,
      quantity: 40,
      emitting: false,
    });
    particles.explode();
    particles.setDepth(22);

    this.scene.tweens.add({
      targets: [core, wave],
      scale: 1.5,
      alpha: 0,
      duration: 800,
      onComplete: () => {
        core.destroy();
        wave.destroy();
        particles.destroy();
      },
    });
  }

  /**
   * 审判之光效果 - 圣光审判
   * @deprecated 已被 JudgmentLightStrategy 替代
   */
  /* DISABLED: Replaced by JudgmentLightStrategy
  private createJudgmentLightEffect(x: number, y: number, radius: number): void {
    // 圣光柱
    const beam = this.scene.add.rectangle(x, y, 80, radius * 2, 0xffcc00, 0.6);
    beam.setDepth(20);

    // 光芒射线
    const rays = this.scene.add.graphics();
    rays.lineStyle(4, 0xffffff, 0.8);
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      rays.lineBetween(x, y, x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
    }
    rays.setDepth(21);

    // 金色粒子
    const particles = this.scene.add.particles(x, y, 'particle_holy', {
      speed: { min: 100, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 500,
      quantity: 30,
      emitting: false,
    });
    particles.explode();
    particles.setDepth(22);

    this.scene.tweens.add({
      targets: [beam, rays],
      alpha: 0,
      duration: 600,
      onComplete: () => {
        beam.destroy();
        rays.destroy();
        particles.destroy();
      },
    });
  }
  */

  /**
   * 暗影降临效果 - 暗影笼罩
   * @deprecated 已被 ShadowDescentStrategy 替代
   */
  /* DISABLED: Replaced by ShadowDescentStrategy
  private createShadowDescentEffect(x: number, y: number, radius: number): void {
    // 暗影区域
    const shadow = this.scene.add.circle(x, y, radius, 0x440066, 0.5);
    shadow.setDepth(20);

    // 暗影粒子
    const particles = this.scene.add.particles(x, y, 'particle_shadow', {
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 2000,
      frequency: 100,
      quantity: 3,
    });
    particles.setDepth(21);

    this.scene.time.delayedCall(4000, () => {
      particles.stop();
      this.scene.tweens.add({
        targets: [shadow, particles],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          shadow.destroy();
          particles.destroy();
        },
      });
    });
  }
  */

  /**
   * 死亡凋零效果 - 死亡气息
   */
  private createDeathDecayEffect(x: number, y: number, radius: number): void {
    // 死亡区域
    const decay = this.scene.add.circle(x, y, radius, 0x440044, 0.4);
    decay.setDepth(20);

    // 死亡粒子（骷髅形状简化为圆形）
    const particles = this.scene.add.particles(x, y, 'particle_shadow', {
      speed: { min: 30, max: 80 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 0.5, end: 0 },
      tint: 0x880088,
      lifespan: 3000,
      frequency: 150,
      quantity: 2,
    });
    particles.setDepth(21);

    this.scene.time.delayedCall(5000, () => {
      particles.stop();
      this.scene.tweens.add({
        targets: [decay, particles],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          decay.destroy();
          particles.destroy();
        },
      });
    });
  }

  /**
   * 山崩地裂效果 - 巨石崩塌
   */
  private createMountainCollapseEffect(x: number, y: number, radius: number): void {
    // 岩石碎片
    const rocks: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const rock = this.scene.add.circle(
        x + Math.cos(angle) * radius * 0.5,
        y + Math.sin(angle) * radius * 0.5,
        15 + Math.random() * 10,
        0x886644,
        0.9
      );
      rock.setDepth(21);
      rocks.push(rock);

      // 向外飞散
      this.scene.tweens.add({
        targets: rock,
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius,
        alpha: 0,
        duration: 400,
        onComplete: () => rock.destroy(),
      });
    }

    // 地裂效果
    const crack = this.scene.add.circle(x, y, radius, 0x664422, 0.5);
    crack.setDepth(20);

    this.scene.tweens.add({
      targets: crack,
      scale: 1.5,
      alpha: 0,
      duration: 500,
      onComplete: () => crack.destroy(),
    });
  }

  /**
   * 大地震击效果 - 全屏地震
   */
  private createEarthquakeEffect(x: number, y: number, radius: number): void {
    // 地震波纹
    const waves: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 3; i++) {
      const wave = this.scene.add.circle(x, y, radius * (0.3 + i * 0.3), 0x886644, 0.4 - i * 0.1);
      wave.setDepth(20);
      waves.push(wave);
    }

    // 冲击动画
    this.scene.tweens.add({
      targets: waves,
      scale: 1.5,
      alpha: 0,
      duration: 500,
      onComplete: () => waves.forEach(w => w.destroy()),
    });

    // 屏幕震动
    this.scene.cameras.main.shake(300, 0.015);
  }

  /**
   * 海啸效果 - 巨浪推进
   */
  private createTsunamiEffect(x: number, y: number, radius: number): void {
    // 巨浪
    const wave = this.scene.add.graphics();
    wave.fillStyle(0x4488ff, 0.6);
    wave.fillCircle(x, y, radius);
    wave.setDepth(20);

    // 水流粒子
    const particles = this.scene.add.particles(x, y, 'particle_water', {
      speed: { min: 150, max: 300 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 600,
      quantity: 50,
      emitting: false,
    });
    particles.explode();
    particles.setDepth(21);

    this.scene.tweens.add({
      targets: wave,
      scale: 2,
      alpha: 0,
      duration: 800,
      onComplete: () => {
        wave.destroy();
        particles.destroy();
      },
    });
  }

  /**
   * 过度生长效果 - 植物缠绕
   */
  private createOvergrowthEffect(x: number, y: number, radius: number): void {
    // 藤蔓区域
    const vines = this.scene.add.circle(x, y, radius, 0x44ff44, 0.3);
    vines.setDepth(20);

    // 植物粒子
    const particles = this.scene.add.particles(x, y, 'particle_grass', {
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 800,
      quantity: 30,
      emitting: false,
    });
    particles.explode();
    particles.setDepth(21);

    // 藤蔓生长
    const branches: Phaser.GameObjects.Graphics[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const branch = this.scene.add.graphics();
      branch.lineStyle(4, 0x44aa44, 0.8);
      branch.lineBetween(x, y, x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
      branch.setDepth(22);
      branches.push(branch);
    }

    this.scene.tweens.add({
      targets: [vines, ...branches],
      alpha: 0,
      duration: 800,
      onComplete: () => {
        vines.destroy();
        particles.destroy();
        branches.forEach(b => b.destroy());
      },
    });
  }

  /**
   * 虚空裂隙效果 - 裂隙吸引
   */
  private createVoidRiftEffect(x: number, y: number, radius: number): void {
    // 裂隙核心
    const rift = this.scene.add.circle(x, y, 40, 0x8800ff, 0.8);
    rift.setDepth(21);

    // 虚空环
    const rings: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 3; i++) {
      const ring = this.scene.add.circle(x, y, radius - i * 30, 0x6600aa, 0.3 - i * 0.08);
      ring.setDepth(20);
      rings.push(ring);
    }

    // 虚空粒子
    const particles = this.scene.add.particles(x, y, 'particle_shadow', {
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.7, end: 0 },
      tint: 0x8800ff,
      lifespan: 1500,
      frequency: 80,
      quantity: 3,
    });
    particles.setDepth(22);

    // 旋转动画
    this.scene.tweens.add({
      targets: rings,
      angle: 360,
      duration: 800,
      repeat: 3,
    });

    this.scene.time.delayedCall(3000, () => {
      particles.stop();
      this.scene.tweens.add({
        targets: [rift, ...rings, particles],
        alpha: 0,
        scale: 0.5,
        duration: 300,
        onComplete: () => {
          rift.destroy();
          rings.forEach(r => r.destroy());
          particles.destroy();
        },
      });
    });
  }

  // ==================== 新差异化技能视觉效果 ====================

  /**
   * 火焰喷射效果 - 锥形
   */
  private createFlameSprayEffect(x: number, y: number, radius: number): void {
    const cone = this.scene.add.graphics();
    cone.fillStyle(0xff4400, 0.6);
    cone.beginPath();
    cone.moveTo(x, y);
    cone.arc(x, y, radius, -Math.PI / 6, Math.PI / 6);
    cone.closePath();
    cone.fill();
    cone.setDepth(25);

    this.scene.tweens.add({
      targets: cone,
      alpha: 0,
      duration: 500,
      onComplete: () => cone.destroy(),
    });
  }

  /**
   * 水波推进效果 - 方向性波浪
   */
  private createWavePushEffect(x: number, y: number, radius: number): void {
    const wave = this.scene.add.graphics();
    wave.fillStyle(0x4488ff, 0.5);
    wave.fillEllipse(x + radius / 2, y, 60, 40);
    wave.setDepth(25);

    this.scene.tweens.add({
      targets: wave,
      x: radius,
      alpha: 0,
      duration: 400,
      onComplete: () => wave.destroy(),
    });
  }

  /**
   * 冰晶爆发效果 - 多方向穿透
   */
  private createIceCrystalBurstEffect(x: number, y: number, radius: number): void {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const crystal = this.scene.add.graphics();
      crystal.fillStyle(0x88ddff, 0.9);
      crystal.fillTriangle(0, -15, -8, 8, 8, 8);
      crystal.setPosition(x, y);
      crystal.setRotation(angle);
      crystal.setDepth(40);

      this.scene.tweens.add({
        targets: crystal,
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius,
        alpha: 0,
        duration: 400,
        onComplete: () => crystal.destroy(),
      });
    }
  }

  /**
   * 雷击阵效果 - 定点雷击
   */
  private createLightningArrayEffect(x: number, y: number, radius: number): void {
    const warning = this.scene.add.circle(x, y, radius, 0xffff00, 0.2);
    warning.setDepth(20);

    this.scene.tweens.add({
      targets: warning,
      alpha: 0.4,
      duration: 200,
      yoyo: true,
      repeat: 2,
      onComplete: () => warning.destroy(),
    });
  }

  /**
   * 诅咒链效果 - 链式传播
   */
  private createCurseChainEffect(x: number, y: number, radius: number): void {
    const curse = this.scene.add.circle(x, y, radius, 0x8800ff, 0.4);
    curse.setDepth(20);

    this.scene.tweens.add({
      targets: curse,
      alpha: 0,
      scale: 1.5,
      duration: 400,
      onComplete: () => curse.destroy(),
    });
  }

  /**
   * 地刺陷阱效果
   */
  private createSpikeTrapEffect(x: number, y: number, radius: number): void {
    const trap = this.scene.add.circle(x, y, 25, 0x886644, 0.5);
    trap.setStrokeStyle(2, 0xaa8866, 0.8);
    trap.setDepth(20);

    this.scene.tweens.add({
      targets: trap,
      scale: 1.2,
      alpha: 0.7,
      duration: 300,
      yoyo: true,
      repeat: -1,
    });

    this.scene.time.delayedCall(5000, () => trap.destroy());
  }

  /**
   * 流沙陷阱效果
   */
  private createQuicksandTrapEffect(x: number, y: number, radius: number): void {
    const quicksand = this.scene.add.circle(x, y, radius, 0x886633, 0.4);
    quicksand.setDepth(20);

    this.scene.tweens.add({
      targets: quicksand,
      angle: 360,
      duration: 2000,
      repeat: 2,
    });

    this.scene.time.delayedCall(4000, () => quicksand.destroy());
  }

  /**
   * 电荷积累效果
   */
  private createChargeAccumulateEffect(x: number, y: number, radius: number): void {
    const field = this.scene.add.circle(x, y, radius, 0xffff00, 0.3);
    field.setDepth(20);

    // 电弧视觉效果
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const arc = this.scene.add.graphics();
      arc.lineStyle(2, 0xffff00, 0.6);
      arc.lineBetween(
        x + Math.cos(angle) * 20,
        y + Math.sin(angle) * 20,
        x + Math.cos(angle) * radius,
        y + Math.sin(angle) * radius
      );
      arc.setDepth(21);

      this.scene.time.delayedCall(200, () => arc.destroy());
    }

    this.scene.tweens.add({
      targets: field,
      alpha: 0,
      duration: 300,
      onComplete: () => field.destroy(),
    });
  }

  /**
   * 电磁脉冲效果 - 环形扩散
   */
  private createEMPPulseEffect(x: number, y: number, radius: number): void {
    const pulse = this.scene.add.circle(x, y, 20, 0xffff00, 0.6);
    pulse.setStrokeStyle(4, 0xffffff, 0.8);
    pulse.setDepth(100);

    this.scene.tweens.add({
      targets: pulse,
      radius: radius,
      alpha: 0,
      duration: 600,
      onComplete: () => pulse.destroy(),
    });
  }

  /**
   * 暗影分身效果
   */
  private createShadowCloneEffect(x: number, y: number, _radius: number): void {
    const clone = this.scene.add.container(x, y);
    clone.setDepth(40);

    const body = this.scene.add.circle(0, 0, 15, 0x8800ff, 0.7);
    const glow = this.scene.add.circle(0, 0, 20, 0x6600aa, 0.4);
    clone.add([glow, body]);

    this.scene.tweens.add({
      targets: clone,
      alpha: 0.5,
      scale: 1.1,
      duration: 300,
      yoyo: true,
      repeat: -1,
    });

    this.scene.time.delayedCall(3000, () => {
      this.scene.tweens.add({
        targets: clone,
        alpha: 0,
        scale: 0.5,
        duration: 300,
        onComplete: () => clone.destroy(),
      });
    });
  }

  /**
   * 地裂线效果 - 直线
   */
  private createGroundCrackLineEffect(x: number, y: number, radius: number): void {
    const crack = this.scene.add.graphics();
    crack.fillStyle(0x664422, 0.8);
    crack.fillRect(0, -30, radius, 60);
    crack.setPosition(x, y);
    crack.setDepth(25);

    crack.setScale(0, 1);
    this.scene.tweens.add({
      targets: crack,
      scaleX: 1,
      duration: 300,
      onComplete: () => {
        this.scene.tweens.add({
          targets: crack,
          alpha: 0,
          duration: 200,
          onComplete: () => crack.destroy(),
        });
      },
    });
  }

  /**
   * 火焰射线效果
   */
  private createFlameRayEffect(x: number, y: number, radius: number): void {
    const ray = this.scene.add.graphics();
    ray.lineStyle(30, 0xff4400, 0.6);
    ray.lineBetween(x, y, x + radius, y);
    ray.setDepth(40);

    this.scene.tweens.add({
      targets: ray,
      alpha: 0,
      duration: 2000,
      onComplete: () => ray.destroy(),
    });
  }
}
