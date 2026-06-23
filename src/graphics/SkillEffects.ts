import Phaser from 'phaser';
import { Skill } from '@/types';
import { Enemy } from '@/entities/Enemy';

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

    switch (skill.id) {
      case 'fireball':
        this.createFireballEffect(container);
        break;
      case 'ice_shard':
        this.createIceShardEffect(container, angle);
        break;
      case 'lightning_bolt':
        this.createLightningBoltEffect(container, angle);
        break;
      default:
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
    switch (skill.id) {
      case 'flame_circle':
        this.createFlameCircleEffect(x, y, skill.rangeValue);
        break;
      case 'frost_nova':
        this.createFrostNovaEffect(x, y, skill.rangeValue);
        break;
      case 'whirlwind':
        this.createWhirlwindEffect(x, y, skill.rangeValue);
        break;
      case 'poison_cloud':
        this.createPoisonCloudEffect(x, y, skill.rangeValue);
        break;
      case 'meteor':
        this.createMeteorEffect(x, y, skill.rangeValue);
        break;
      case 'blizzard':
        this.createBlizzardEffect(x, y, skill.rangeValue);
        break;
      case 'thunder_storm':
        this.createThunderStormEffect(x, y, skill.rangeValue);
        break;
      default:
        this.createDefaultAreaEffect(x, y, skill.rangeValue, skill.elements[0]);
    }
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

  /**
   * 旋风斩效果 - 旋转剑刃
   */
  private createWhirlwindEffect(x: number, y: number, radius: number): void {
    // 旋转剑刃
    const blades: Phaser.GameObjects.Graphics[] = [];
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const blade = this.scene.add.graphics();
      blade.fillStyle(0xcccccc, 1);

      // 剑刃形状
      const bladeX = x + Math.cos(angle) * radius * 0.5;
      const bladeY = y + Math.sin(angle) * radius * 0.5;
      blade.fillTriangle(
        bladeX, bladeY - 20,
        bladeX - 8, bladeY + 10,
        bladeX + 8, bladeY + 10
      );
      blade.fillStyle(0xffffff, 0.6);
      blade.fillTriangle(
        bladeX, bladeY - 16,
        bladeX - 4, bladeY + 6,
        bladeX + 4, bladeY + 6
      );
      blade.setDepth(21);
      blades.push(blade);
    }

    // 旋转动画
    const rotationContainer = this.scene.add.container(x, y);
    blades.forEach(b => rotationContainer.add(b));
    rotationContainer.setDepth(21);

    this.scene.tweens.add({
      targets: rotationContainer,
      angle: 360 * 2, // 旋转2圈
      duration: 500,
      onComplete: () => {
        rotationContainer.destroy();
      },
    });

    // 冲击波
    const wave = this.scene.add.graphics();
    wave.lineStyle(4, 0xffffff, 0.8);
    wave.strokeCircle(x, y, radius);
    wave.setDepth(20);

    this.scene.tweens.add({
      targets: wave,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0,
      duration: 300,
      onComplete: () => wave.destroy(),
    });

    // 中心闪光
    const flash = this.scene.add.circle(x, y, 30, 0xffffff, 0.5);
    flash.setDepth(22);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.5,
      duration: 200,
      onComplete: () => flash.destroy(),
    });
  }

  /**
   * 烈焰环效果
   */
  private createFlameCircleEffect(x: number, y: number, radius: number): void {
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
}
