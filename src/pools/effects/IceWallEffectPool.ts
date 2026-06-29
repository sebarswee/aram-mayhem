import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../VisualEffectPool';

/**
 * 冰墙效果配置
 */
export interface IceWallEffectConfig extends VisualEffectConfig {
  wallWidth: number;
  wallHeight: number;
  duration: number;
  rotation: number;
}

/**
 * 冰墙效果对象池
 *
 * 管理 IceWall 技能的视觉效果复用
 * - 4 层冰墙图形（graphics）
 * - 1 个冰霜光晕（circle）
 * - 1 个冰晶粒子发射器
 * - 1 个无限循环 tween（脉动）
 */
export class IceWallEffectPool extends VisualEffectPool<IceWallEffectConfig> {
  constructor(scene: Phaser.Scene, initialSize: number = 5) {
    super(
      scene,
      () => (this as any)._createFn(),
      (obj, config: IceWallEffectConfig) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'IceWallEffectPool', skipInitialWarmUp: true }
    );

    (this as any)._createFn = this.createIceWallEffect.bind(this);
    (this as any)._resetFn = this.resetIceWallEffect.bind(this);

    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建冰墙效果容器
   */
  private createIceWallEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建冰霜光晕
    const frostAura = this.scene.add.circle(0, 0, 100, 0x88ddff, 0.15);
    frostAura.setName('ice_wall_frost_aura');
    container.add(frostAura);

    // 预创建4层冰墙
    const wallOuter = this.scene.add.graphics();
    wallOuter.setName('ice_wall_outer');
    container.add(wallOuter);

    const wallMid = this.scene.add.graphics();
    wallMid.setName('ice_wall_mid');
    container.add(wallMid);

    const wallInner = this.scene.add.graphics();
    wallInner.setName('ice_wall_inner');
    container.add(wallInner);

    const iceTexture = this.scene.add.graphics();
    iceTexture.setName('ice_wall_texture');
    container.add(iceTexture);

    container.setDepth(22);
    return container;
  }

  /**
   * 重置并配置冰墙效果
   */
  private resetIceWallEffect(
    container: Phaser.GameObjects.Container,
    config: IceWallEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);
    container.setRotation(config.rotation);

    const wallWidth = config.wallWidth;
    const wallHeight = config.wallHeight;

    // 重置冰霜光晕
    const frostAura = container.getByName('ice_wall_frost_aura') as Phaser.GameObjects.Arc;
    if (frostAura) {
      frostAura.setRadius(wallWidth / 2 + 20);
      frostAura.setFillStyle(0x88ddff, 0.15);
      frostAura.setPosition(0, 0);
      frostAura.setDepth(22);

      // 脉动动画（无限循环，需要托管以便清理）
      const pulseTween = this.scene.tweens.add({
        targets: frostAura,
        scale: 1.05,
        alpha: 0.2,
        duration: 800,
        yoyo: true,
        repeat: -1,
      });
      this.addManagedTween(container, pulseTween, { autoStop: true, tag: 'frost_aura_pulse' });
    }

    // 重置外层冰墙
    const wallOuter = container.getByName('ice_wall_outer') as Phaser.GameObjects.Graphics;
    if (wallOuter) {
      wallOuter.clear();
      wallOuter.fillStyle(0x66ccff, 0.6);
      wallOuter.fillRoundedRect(-wallWidth / 2 - 5, -wallHeight / 2 - 5, wallWidth + 10, wallHeight + 10, 7);
      wallOuter.setDepth(23);
    }

    // 重置中层冰墙
    const wallMid = container.getByName('ice_wall_mid') as Phaser.GameObjects.Graphics;
    if (wallMid) {
      wallMid.clear();
      wallMid.fillStyle(0x88ddff, 0.75);
      wallMid.fillRoundedRect(-wallWidth / 2, -wallHeight / 2, wallWidth, wallHeight, 5);
      wallMid.setDepth(24);
    }

    // 重置内层冰墙
    const wallInner = container.getByName('ice_wall_inner') as Phaser.GameObjects.Graphics;
    if (wallInner) {
      wallInner.clear();
      wallInner.fillStyle(0xaaeeff, 0.85);
      wallInner.fillRoundedRect(-wallWidth / 2 + 5, -wallHeight / 2 + 5, wallWidth - 10, wallHeight - 10, 3);
      wallInner.setDepth(25);
    }

    // 重置冰晶纹理
    const iceTexture = container.getByName('ice_wall_texture') as Phaser.GameObjects.Graphics;
    if (iceTexture) {
      iceTexture.clear();
      iceTexture.lineStyle(1, 0xffffff, 0.5);
      for (let i = 0; i < 8; i++) {
        const startX = -wallWidth / 2 + (i + 1) * (wallWidth / 9);
        iceTexture.lineBetween(startX, -wallHeight / 2, startX + 5, wallHeight / 2);
      }
      iceTexture.setDepth(26);
    }

    // 创建冰晶粒子发射器
    const iceParticles = this.scene.add.particles(config.x, config.y, 'particle_ice_crystal', {
      speed: { min: 20, max: 60 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: [0x88ddff, 0xaaeeff, 0xffffff],
      lifespan: 800,
      frequency: 100,
      quantity: 2,
      emitting: false,
      emitZone: {
        type: 'random' as const,
        source: new Phaser.Geom.Rectangle(-wallWidth / 2, -wallHeight / 2, wallWidth, wallHeight) as Phaser.Types.GameObjects.Particles.RandomZoneSource,
      },
    });
    iceParticles.setName('ice_wall_particles');
    iceParticles.setRotation(config.rotation);
    iceParticles.setDepth(27);
    iceParticles.start();

    // 设置自动回收
    if (config.duration && config.duration > 0) {
      this.setEffectDuration(container, config.duration);
    }
  }

  /**
   * 停用效果时的额外清理
   */
  protected deactivate(obj: Phaser.GameObjects.Container): void {
    // 停止粒子发射
    const particlesObj = obj.getByName('ice_wall_particles');
    if (particlesObj && particlesObj instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
      const particles = particlesObj as Phaser.GameObjects.Particles.ParticleEmitter;
      particles.stop();
      particles.destroy();
    }

    // 清理 graphics
    const wallOuter = obj.getByName('ice_wall_outer') as Phaser.GameObjects.Graphics;
    if (wallOuter) wallOuter.clear();

    const wallMid = obj.getByName('ice_wall_mid') as Phaser.GameObjects.Graphics;
    if (wallMid) wallMid.clear();

    const wallInner = obj.getByName('ice_wall_inner') as Phaser.GameObjects.Graphics;
    if (wallInner) wallInner.clear();

    const iceTexture = obj.getByName('ice_wall_texture') as Phaser.GameObjects.Graphics;
    if (iceTexture) iceTexture.clear();

    // 调用父类方法进行基础清理
    super.deactivate(obj);
  }
}
