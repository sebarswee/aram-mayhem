import Phaser from 'phaser';
import { VisualEffectPool, VisualEffectConfig } from '../VisualEffectPool';

/**
 * 潮汐波效果配置
 */
export interface TidalWaveEffectConfig extends VisualEffectConfig {
  range: number;
  waveWidth: number;
  angle: number;
  duration: number;
}

/**
 * 潮汐波效果对象池
 *
 * 管理 TidalWave 技能的视觉效果复用
 * - 3 层水波图形（graphics）
 * - 1 个水花粒子发射器
 * - 瞬态效果（约 600ms）
 */
export class TidalWaveEffectPool extends VisualEffectPool<TidalWaveEffectConfig> {
  constructor(scene: Phaser.Scene, initialSize: number = 5) {
    super(
      scene,
      () => (this as any)._createFn(),
      (obj, config: TidalWaveEffectConfig) => (this as any)._resetFn(obj, config),
      { initialSize: 0, name: 'TidalWaveEffectPool', skipInitialWarmUp: true }
    );

    (this as any)._createFn = this.createTidalWaveEffect.bind(this);
    (this as any)._resetFn = this.resetTidalWaveEffect.bind(this);

    if (initialSize > 0) {
      this.warmUp(initialSize);
    }
  }

  /**
   * 创建潮汐波效果容器
   */
  private createTidalWaveEffect(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 预创建3层水波图形
    const waveOuter = this.scene.add.graphics();
    waveOuter.setName('tidal_wave_outer');
    container.add(waveOuter);

    const waveMid = this.scene.add.graphics();
    waveMid.setName('tidal_wave_mid');
    container.add(waveMid);

    const waveInner = this.scene.add.graphics();
    waveInner.setName('tidal_wave_inner');
    container.add(waveInner);

    container.setDepth(23);
    return container;
  }

  /**
   * 重置并配置潮汐波效果
   */
  private resetTidalWaveEffect(
    container: Phaser.GameObjects.Container,
    config: TidalWaveEffectConfig
  ): void {
    container.setPosition(config.x, config.y);
    container.setActive(true);
    container.setVisible(true);
    container.setRotation(config.angle);

    const waveWidth = config.waveWidth;

    // 重置外层水波
    const waveOuter = container.getByName('tidal_wave_outer') as Phaser.GameObjects.Graphics;
    if (waveOuter) {
      waveOuter.clear();
      waveOuter.fillStyle(0x2266cc, 0.35);
      waveOuter.fillEllipse(0, 0, waveWidth + 20, 70);
      waveOuter.setDepth(23);
    }

    // 重置中层水波
    const waveMid = container.getByName('tidal_wave_mid') as Phaser.GameObjects.Graphics;
    if (waveMid) {
      waveMid.clear();
      waveMid.fillStyle(0x4488ff, 0.55);
      waveMid.fillEllipse(0, 0, waveWidth, 55);
      waveMid.setDepth(24);
    }

    // 重置内层水波
    const waveInner = container.getByName('tidal_wave_inner') as Phaser.GameObjects.Graphics;
    if (waveInner) {
      waveInner.clear();
      waveInner.fillStyle(0x66aaff, 0.7);
      waveInner.fillEllipse(0, 0, waveWidth - 15, 40);
      waveInner.setDepth(25);
    }

    // 收集所有水波层
    const waves: Phaser.GameObjects.Graphics[] = [];
    if (waveOuter) waves.push(waveOuter);
    if (waveMid) waves.push(waveMid);
    if (waveInner) waves.push(waveInner);

    // 水波推进动画
    this.scene.tweens.add({
      targets: waves,
      x: config.range,
      alpha: 0,
      scaleX: 1.3,
      duration: 450,
    });

    // 创建水花粒子发射器
    const splashParticles = this.scene.add.particles(config.x, config.y, 'particle_glow', {
      speed: { min: 50, max: 150 },
      angle: { min: (config.angle - 0.5) * 180 / Math.PI, max: (config.angle + 0.5) * 180 / Math.PI },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.7, end: 0 },
      tint: [0x4488ff, 0x66aaff, 0x88ccff],
      lifespan: 400,
      frequency: 30,
      quantity: 3,
      emitting: false,
    });
    splashParticles.setName('tidal_splash_particles');
    splashParticles.setDepth(26);
    splashParticles.start();

    // 设置自动回收
    const duration = config.duration || 500;
    this.scene.time.delayedCall(duration, () => {
      this.release(container);
    });
  }

  /**
   * 停用效果时的额外清理
   */
  protected deactivate(obj: Phaser.GameObjects.Container): void {
    // 停止粒子发射
    const particles = obj.getByName('tidal_splash_particles') as Phaser.GameObjects.Particles.ParticleEmitter;
    if (particles) {
      particles.stop();
      particles.destroy();
    }

    // 清理 graphics
    const waveOuter = obj.getByName('tidal_wave_outer') as Phaser.GameObjects.Graphics;
    if (waveOuter) waveOuter.clear();

    const waveMid = obj.getByName('tidal_wave_mid') as Phaser.GameObjects.Graphics;
    if (waveMid) waveMid.clear();

    const waveInner = obj.getByName('tidal_wave_inner') as Phaser.GameObjects.Graphics;
    if (waveInner) waveInner.clear();

    // 调用父类方法进行基础清理
    super.deactivate(obj);
  }
}
