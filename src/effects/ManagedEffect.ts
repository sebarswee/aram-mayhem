import Phaser from 'phaser';

/**
 * 管理型视觉效果基类
 *
 * 自动管理：
 * - 子对象（添加到容器后自动销毁）
 * - Tweens（停止并清理）
 * - Timers（销毁）
 * - 场景生命周期（自动清理）
 *
 * 使用方式：
 * ```typescript
 * class MyEffect extends ManagedEffect {
 *   constructor(scene, x, y, config) {
 *     super(scene, x, y);
 *
 *     // 创建视觉效果
 *     const layer = this.createLayer(config);
 *     this.add(layer);  // 添加到容器
 *
 *     // 创建 tween（自动管理）
 *     const tween = scene.tweens.add({ ... });
 *     this.addTween(tween);
 *
 *     // 创建定时器（自动管理）
 *     const timer = scene.time.addEvent({ ... });
 *     this.addTimer(timer);
 *
 *     // 设置持续时间（可选）
 *     this.setDuration(config.duration);
 *   }
 * }
 * ```
 */
export abstract class ManagedEffect extends Phaser.GameObjects.Container {
  protected tweens: Phaser.Tweens.Tween[] = [];
  protected timers: Phaser.Time.TimerEvent[] = [];
  protected particles: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  protected isDestroyed: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // 添加到场景的显示列表
    scene.add.existing(this);

    // 注册场景关闭钩子
    scene.events.once('shutdown', () => {
      if (!this.isDestroyed) {
        this.destroy();
      }
    });
  }

  /**
   * 添加需要管理的 tween
   */
  protected addManagedTween(tween: Phaser.Tweens.Tween): Phaser.Tweens.Tween {
    this.tweens.push(tween);
    return tween;
  }

  /**
   * 添加需要管理的定时器
   */
  protected addManagedTimer(timer: Phaser.Time.TimerEvent): Phaser.Time.TimerEvent {
    this.timers.push(timer);
    return timer;
  }

  /**
   * 添加需要管理的粒子发射器
   */
  protected addManagedParticle(emitter: Phaser.GameObjects.Particles.ParticleEmitter): Phaser.GameObjects.Particles.ParticleEmitter {
    this.particles.push(emitter);
    return emitter;
  }

  /**
   * 设置持续时间（自动销毁）
   */
  protected setDuration(duration: number): void {
    const timer = this.scene.time.delayedCall(duration, () => {
      this.destroy();
    });
    this.addManagedTimer(timer);
  }

  /**
   * 销毁效果（自动清理所有资源）
   */
  destroy(fromScene?: boolean): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    // 停止并清理所有 tweens
    this.tweens.forEach(tween => {
      if (tween && tween.isPlaying()) {
        tween.stop();
      }
    });
    this.tweens = [];

    // 销毁所有定时器
    this.timers.forEach(timer => {
      if (timer) {
        timer.destroy();
      }
    });
    this.timers = [];

    // 销毁所有粒子发射器
    this.particles.forEach(emitter => {
      if (emitter && emitter.active) {
        emitter.destroy();
      }
    });
    this.particles = [];

    // Phaser.Container 会自动销毁所有子对象
    super.destroy(fromScene);
  }

  /**
   * 检查效果是否已销毁
   */
  isEffectDestroyed(): boolean {
    return this.isDestroyed;
  }
}
