import Phaser from 'phaser';
import { ObjectPool, ObjectPoolOptions } from './ObjectPool';

/**
 * 视觉效果配置接口
 */
export interface VisualEffectConfig {
  x: number;
  y: number;
  duration?: number;
  [key: string]: any;
}

/**
 * 托管的子对象信息
 */
interface ManagedChild {
  /** 子对象 */
  child: Phaser.GameObjects.GameObject;
  /** 子对象类型标识 */
  type: 'graphics' | 'sprite' | 'image' | 'text' | 'arc' | 'container' | 'particles' | 'other';
  /** 所属层（用于分层管理） */
  layer?: number;
}

/**
 * 托管的 Tween 信息
 */
interface ManagedTween {
  /** Tween 实例 */
  tween: Phaser.Tweens.Tween;
  /** 关联的目标对象（用于调试） */
  target?: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[];
  /** 是否在释放时自动停止 */
  autoStop: boolean;
  /** 标签（用于分组管理） */
  tag?: string;
}

/**
 * 托管的粒子发射器信息
 */
interface ManagedParticle {
  /** 粒子发射器实例 */
  emitter: Phaser.GameObjects.Particles.ParticleEmitter;
  /** 是否在释放时停止发射 */
  autoStop: boolean;
  /** 是否在释放时销毁粒子 */
  autoDestroy: boolean;
  /** 标签（用于分组管理） */
  tag?: string;
}

/**
 * 托管的定时器信息
 */
interface ManagedTimer {
  /** 定时器实例 */
  timer: Phaser.Time.TimerEvent;
  /** 是否在释放时自动销毁 */
  autoDestroy: boolean;
  /** 标签（用于分组管理） */
  tag?: string;
}

/**
 * 视觉效果池扩展选项
 */
export interface VisualEffectPoolOptions extends ObjectPoolOptions {
  /** 是否在释放时自动清理 tweens（默认 true） */
  autoCleanupTweens?: boolean;
  /** 是否在释放时自动清理粒子（默认 true） */
  autoCleanupParticles?: boolean;
  /** 是否在释放时自动清理定时器（默认 true） */
  autoCleanupTimers?: boolean;
  /** 是否在释放时自动清理子对象（默认 true） */
  autoCleanupChildren?: boolean;
  /** 默认持续时间（毫秒） */
  defaultDuration?: number;
}

/**
 * 视觉效果对象池
 *
 * 专门管理技能视觉效果，提供 Container 的复用
 *
 * 增强功能：
 * - 多层子对象管理：支持分层管理和清理子对象
 * - Tween 自动清理：释放时自动停止并清理关联的 tweens
 * - 粒子发射器管理：自动管理和清理粒子发射器
 * - 定时器管理：自动管理和清理定时器
 *
 * @template C 配置类型，必须继承 VisualEffectConfig
 */
export class VisualEffectPool<C extends VisualEffectConfig = VisualEffectConfig> extends ObjectPool<Phaser.GameObjects.Container> {
  protected createFn: () => Phaser.GameObjects.Container;
  protected resetFn: (obj: Phaser.GameObjects.Container, config: C) => void;

  // 扩展配置选项
  protected readonly autoCleanupTweens: boolean;
  protected readonly autoCleanupParticles: boolean;
  protected readonly autoCleanupTimers: boolean;
  protected readonly autoCleanupChildren: boolean;
  protected readonly defaultDuration: number;

  // 托管资源映射（Container -> 托管资源）
  protected managedTweens: Map<Phaser.GameObjects.Container, ManagedTween[]> = new Map();
  protected managedParticles: Map<Phaser.GameObjects.Container, ManagedParticle[]> = new Map();
  protected managedTimers: Map<Phaser.GameObjects.Container, ManagedTimer[]> = new Map();
  protected managedChildren: Map<Phaser.GameObjects.Container, ManagedChild[]> = new Map();

  constructor(
    scene: Phaser.Scene,
    createFn: () => Phaser.GameObjects.Container,
    resetFn: (obj: Phaser.GameObjects.Container, config: C) => void,
    options: VisualEffectPoolOptions = {}
  ) {
    // 跳过父类的初始预热，避免在 createFn 赋值前调用 create()
    super(scene, { ...options, skipInitialWarmUp: true });

    this.createFn = createFn;
    this.resetFn = resetFn;

    // 初始化扩展选项
    this.autoCleanupTweens = options.autoCleanupTweens ?? true;
    this.autoCleanupParticles = options.autoCleanupParticles ?? true;
    this.autoCleanupTimers = options.autoCleanupTimers ?? true;
    this.autoCleanupChildren = options.autoCleanupChildren ?? true;
    this.defaultDuration = options.defaultDuration ?? 0;

    // 现在可以安全地预创建初始对象
    if (this.initialSize > 0) {
      this.warmUp(this.initialSize);
    }
  }

  /**
   * 创建便捷构造方法（向后兼容）
   *
   * @deprecated 使用构造函数直接传递 options
   */
  static create<C extends VisualEffectConfig>(
    scene: Phaser.Scene,
    createFn: () => Phaser.GameObjects.Container,
    resetFn: (obj: Phaser.GameObjects.Container, config: C) => void,
    initialSize: number = 10
  ): VisualEffectPool<C> {
    return new VisualEffectPool(scene, createFn, resetFn, { initialSize });
  }

  protected create(): Phaser.GameObjects.Container {
    return this.createFn();
  }

  protected reset(obj: Phaser.GameObjects.Container): void {
    // 重置由 acquireWithConfig 处理
  }

  /**
   * 获取并配置对象
   */
  acquireWithConfig(config: C): Phaser.GameObjects.Container | null {
    const obj = this.acquire();
    if (obj) {
      this.resetFn(obj, config);
    }
    return obj;
  }

  // ==================== Tween 管理 ====================

  /**
   * 为容器添加托管的 Tween
   *
   * @param container 容器对象
   * @param tweenConfig Tween 配置或 Tween 实例
   * @param options 选项
   * @returns Tween 实例
   */
  addManagedTween(
    container: Phaser.GameObjects.Container,
    tweenConfig: Phaser.Types.Tweens.TweenBuilderConfig | Phaser.Tweens.Tween,
    options: {
      /** 关联的目标对象 */
      target?: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[];
      /** 是否在释放时自动停止（默认 true） */
      autoStop?: boolean;
      /** 标签（用于分组管理） */
      tag?: string;
    } = {}
  ): Phaser.Tweens.Tween | null {
    if (!this.active.has(container)) {
      this.logDebug('addManagedTween called with container not in active set');
      return null;
    }

    // 创建或使用现有的 tween
    const tween = tweenConfig && typeof tweenConfig === 'object' && 'stop' in tweenConfig && 'isPlaying' in tweenConfig
      ? tweenConfig as Phaser.Tweens.Tween
      : this.scene.tweens.add(tweenConfig as Phaser.Types.Tweens.TweenBuilderConfig);

    const managedTween: ManagedTween = {
      tween,
      target: options.target,
      autoStop: options.autoStop ?? true,
      tag: options.tag,
    };

    // 添加到托管列表
    if (!this.managedTweens.has(container)) {
      this.managedTweens.set(container, []);
    }
    this.managedTweens.get(container)!.push(managedTween);

    this.logDebug(`addManagedTween: added tween to container, total tweens: ${this.managedTweens.get(container)!.length}`);
    return tween;
  }

  /**
   * 为容器的子对象添加托管的 Tween
   *
   * @param container 容器对象
   * @param childIndex 子对象索引
   * @param tweenConfig Tween 配置
   * @param options 选项
   * @returns Tween 实例
   */
  addChildTween(
    container: Phaser.GameObjects.Container,
    childIndex: number,
    tweenConfig: Phaser.Types.Tweens.TweenBuilderConfig,
    options: {
      autoStop?: boolean;
      tag?: string;
    } = {}
  ): Phaser.Tweens.Tween | null {
    const child = container.list[childIndex];
    if (!child) {
      this.logDebug(`addChildTween: child at index ${childIndex} not found`);
      return null;
    }

    const config = {
      ...tweenConfig,
      targets: child,
    };

    return this.addManagedTween(container, config, {
      ...options,
      target: child as Phaser.GameObjects.GameObject,
    });
  }

  /**
   * 停止并移除指定标签的所有 Tweens
   *
   * @param container 容器对象
   * @param tag 标签
   */
  stopTweensByTag(container: Phaser.GameObjects.Container, tag: string): void {
    const tweens = this.managedTweens.get(container);
    if (!tweens) return;

    const toRemove: number[] = [];
    tweens.forEach((managed, index) => {
      if (managed.tag === tag) {
        if (managed.tween.isPlaying()) {
          managed.tween.stop();
        }
        toRemove.push(index);
      }
    });

    // 从后向前删除以保持索引正确
    toRemove.reverse().forEach(index => tweens.splice(index, 1));
    this.logDebug(`stopTweensByTag: stopped ${toRemove.length} tweens with tag "${tag}"`);
  }

  /**
   * 获取容器托管的所有 Tweens
   *
   * @param container 容器对象
   * @returns Tween 数组
   */
  getManagedTweens(container: Phaser.GameObjects.Container): Phaser.Tweens.Tween[] {
    const tweens = this.managedTweens.get(container);
    return tweens ? tweens.map(m => m.tween) : [];
  }

  // ==================== 粒子发射器管理 ====================

  /**
   * 为容器添加托管的粒子发射器
   *
   * @param container 容器对象
   * @param emitter 粒子发射器
   * @param options 选项
   */
  addManagedParticle(
    container: Phaser.GameObjects.Container,
    emitter: Phaser.GameObjects.Particles.ParticleEmitter,
    options: {
      /** 是否在释放时停止发射（默认 true） */
      autoStop?: boolean;
      /** 是否在释放时销毁粒子（默认 true） */
      autoDestroy?: boolean;
      /** 标签 */
      tag?: string;
    } = {}
  ): void {
    if (!this.active.has(container)) {
      this.logDebug('addManagedParticle called with container not in active set');
      return;
    }

    const managedParticle: ManagedParticle = {
      emitter,
      autoStop: options.autoStop ?? true,
      autoDestroy: options.autoDestroy ?? true,
      tag: options.tag,
    };

    if (!this.managedParticles.has(container)) {
      this.managedParticles.set(container, []);
    }
    this.managedParticles.get(container)!.push(managedParticle);

    this.logDebug(`addManagedParticle: added emitter to container, total: ${this.managedParticles.get(container)!.length}`);
  }

  /**
   * 创建并托管一个粒子发射器
   *
   * @param container 容器对象
   * @param x X 坐标
   * @param y Y 坐标
   * @param texture 纹理键
   * @param config 粒子配置
   * @param options 选项
   * @returns 粒子发射器
   */
  createManagedParticle(
    container: Phaser.GameObjects.Container,
    x: number,
    y: number,
    texture: string,
    config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig,
    options: {
      autoStop?: boolean;
      autoDestroy?: boolean;
      tag?: string;
      addToContainer?: boolean;
    } = {}
  ): Phaser.GameObjects.Particles.ParticleEmitter | null {
    if (!this.active.has(container)) {
      this.logDebug('createManagedParticle called with container not in active set');
      return null;
    }

    // Phaser 3.60+: add.particles 直接返回 ParticleEmitter
    const emitter = this.scene.add.particles(x, y, texture, config);

    if (options.addToContainer !== false) {
      container.add(emitter);
    }

    this.addManagedParticle(container, emitter, options);

    return emitter;
  }

  /**
   * 停止指定标签的所有粒子发射器
   *
   * @param container 容器对象
   * @param tag 标签
   */
  stopParticlesByTag(container: Phaser.GameObjects.Container, tag: string): void {
    const particles = this.managedParticles.get(container);
    if (!particles) return;

    particles.forEach(managed => {
      if (managed.tag === tag && managed.emitter.active) {
        managed.emitter.stop();
      }
    });

    this.logDebug(`stopParticlesByTag: stopped particles with tag "${tag}"`);
  }

  /**
   * 立即爆发粒子
   *
   * @param container 容器对象
   * @param count 粒子数量
   * @param tag 可选的标签筛选
   */
  explodeParticles(container: Phaser.GameObjects.Container, count: number = 1, tag?: string): void {
    const particles = this.managedParticles.get(container);
    if (!particles) return;

    particles.forEach(managed => {
      if (!tag || managed.tag === tag) {
        if (managed.emitter.active) {
          managed.emitter.explode(count);
        }
      }
    });
  }

  // ==================== 定时器管理 ====================

  /**
   * 为容器添加托管的定时器
   *
   * @param container 容器对象
   * @param timer 定时器实例
   * @param options 选项
   */
  addManagedTimer(
    container: Phaser.GameObjects.Container,
    timer: Phaser.Time.TimerEvent,
    options: {
      /** 是否在释放时自动销毁（默认 true） */
      autoDestroy?: boolean;
      /** 标签 */
      tag?: string;
    } = {}
  ): void {
    if (!this.active.has(container)) {
      this.logDebug('addManagedTimer called with container not in active set');
      return;
    }

    const managedTimer: ManagedTimer = {
      timer,
      autoDestroy: options.autoDestroy ?? true,
      tag: options.tag,
    };

    if (!this.managedTimers.has(container)) {
      this.managedTimers.set(container, []);
    }
    this.managedTimers.get(container)!.push(managedTimer);

    this.logDebug(`addManagedTimer: added timer to container, total: ${this.managedTimers.get(container)!.length}`);
  }

  /**
   * 创建并托管一个延迟调用定时器
   *
   * @param container 容器对象
   * @param delay 延迟时间（毫秒）
   * @param callback 回调函数
   * @param options 选项
   * @returns 定时器实例
   */
  createDelayedCall(
    container: Phaser.GameObjects.Container,
    delay: number,
    callback: () => void,
    options: {
      autoDestroy?: boolean;
      tag?: string;
    } = {}
  ): Phaser.Time.TimerEvent | null {
    if (!this.active.has(container)) {
      this.logDebug('createDelayedCall called with container not in active set');
      return null;
    }

    const timer = this.scene.time.delayedCall(delay, callback);
    this.addManagedTimer(container, timer, options);

    return timer;
  }

  /**
   * 创建并托管一个循环定时器
   *
   * @param container 容器对象
   * @param delay 间隔时间（毫秒）
   * @param callback 回调函数
   * @param options 选项
   * @returns 定时器实例
   */
  createLoopTimer(
    container: Phaser.GameObjects.Container,
    delay: number,
    callback: () => void,
    options: {
      autoDestroy?: boolean;
      tag?: string;
      repeatCount?: number;
    } = {}
  ): Phaser.Time.TimerEvent | null {
    if (!this.active.has(container)) {
      this.logDebug('createLoopTimer called with container not in active set');
      return null;
    }

    const timer = this.scene.time.addEvent({
      delay,
      callback,
      repeat: options.repeatCount ?? -1,
    });

    this.addManagedTimer(container, timer, options);

    return timer;
  }

  /**
   * 暂停指定标签的所有定时器
   *
   * @param container 容器对象
   * @param tag 标签
   */
  pauseTimersByTag(container: Phaser.GameObjects.Container, tag: string): void {
    const timers = this.managedTimers.get(container);
    if (!timers) return;

    timers.forEach(managed => {
      if (managed.tag === tag) {
        managed.timer.paused = true;
      }
    });

    this.logDebug(`pauseTimersByTag: paused timers with tag "${tag}"`);
  }

  /**
   * 恢复指定标签的所有定时器
   *
   * @param container 容器对象
   * @param tag 标签
   */
  resumeTimersByTag(container: Phaser.GameObjects.Container, tag: string): void {
    const timers = this.managedTimers.get(container);
    if (!timers) return;

    timers.forEach(managed => {
      if (managed.tag === tag) {
        managed.timer.paused = false;
      }
    });

    this.logDebug(`resumeTimersByTag: resumed timers with tag "${tag}"`);
  }

  // ==================== 多层子对象管理 ====================

  /**
   * 为容器添加托管的子对象
   *
   * @param container 容器对象
   * @param child 子对象
   * @param options 选项
   */
  addManagedChild(
    container: Phaser.GameObjects.Container,
    child: Phaser.GameObjects.GameObject,
    options: {
      /** 层级 */
      layer?: number;
      /** 是否添加到容器 */
      addToContainer?: boolean;
    } = {}
  ): void {
    if (!this.active.has(container)) {
      this.logDebug('addManagedChild called with container not in active set');
      return;
    }

    // 确定子对象类型
    const type = this.getChildType(child);

    const managedChild: ManagedChild = {
      child,
      type,
      layer: options.layer ?? 0,
    };

    if (!this.managedChildren.has(container)) {
      this.managedChildren.set(container, []);
    }
    this.managedChildren.get(container)!.push(managedChild);

    // 可选添加到容器
    if (options.addToContainer !== false && 'add' in container) {
      container.add(child as Phaser.GameObjects.GameObject);
    }

    this.logDebug(`addManagedChild: added ${type} child to container at layer ${managedChild.layer}`);
  }

  /**
   * 批量添加子对象到指定层
   *
   * @param container 容器对象
   * @param children 子对象数组
   * @param layer 层级
   */
  addChildrenToLayer(
    container: Phaser.GameObjects.Container,
    children: Phaser.GameObjects.GameObject[],
    layer: number = 0
  ): void {
    children.forEach(child => {
      this.addManagedChild(container, child, { layer });
    });
  }

  /**
   * 获取指定层的所有子对象
   *
   * @param container 容器对象
   * @param layer 层级
   * @returns 子对象数组
   */
  getChildrenByLayer(container: Phaser.GameObjects.Container, layer: number): Phaser.GameObjects.GameObject[] {
    const children = this.managedChildren.get(container);
    if (!children) return [];

    return children
      .filter(m => m.layer === layer)
      .map(m => m.child);
  }

  /**
   * 清除指定层的所有子对象
   *
   * @param container 容器对象
   * @param layer 层级
   */
  clearLayer(container: Phaser.GameObjects.Container, layer: number): void {
    const children = this.managedChildren.get(container);
    if (!children) return;

    const toRemove = children.filter(m => m.layer === layer);
    toRemove.forEach(managed => {
      // 从容器移除
      const index = container.list.indexOf(managed.child as Phaser.GameObjects.GameObject);
      if (index > -1) {
        container.removeAt(index, true);
      }
      // 销毁对象
      if ('destroy' in managed.child) {
        (managed.child as any).destroy();
      }
    });

    // 从托管列表移除
    const remaining = children.filter(m => m.layer !== layer);
    this.managedChildren.set(container, remaining);

    this.logDebug(`clearLayer: cleared ${toRemove.length} children from layer ${layer}`);
  }

  /**
   * 按类型获取子对象
   *
   * @param container 容器对象
   * @param type 子对象类型
   * @returns 子对象数组
   */
  getChildrenByType(container: Phaser.GameObjects.Container, type: ManagedChild['type']): Phaser.GameObjects.GameObject[] {
    const children = this.managedChildren.get(container);
    if (!children) return [];

    return children
      .filter(m => m.type === type)
      .map(m => m.child);
  }

  /**
   * 确定子对象类型
   */
  private getChildType(child: Phaser.GameObjects.GameObject): ManagedChild['type'] {
    // 使用属性检查而不是 instanceof，以支持 mock 测试
    const anyChild = child as any;

    // Graphics: 有 fillStyle 或 lineStyle 方法，但没有 radius
    if (typeof anyChild.fillStyle === 'function' || typeof anyChild.lineStyle === 'function') {
      return 'graphics';
    }

    // Sprite: 有 texture 和 frame 属性，有 play 方法
    if (anyChild.texture && typeof anyChild.play === 'function') {
      return 'sprite';
    }

    // Image: 有 texture 但没有 play 方法
    if (anyChild.texture && !anyChild.play) {
      return 'image';
    }

    // Text: 有 text 属性或 setFont 方法
    if (typeof anyChild.text === 'string' || typeof anyChild.setFont === 'function') {
      return 'text';
    }

    // Arc: 有 radius 属性
    if (typeof anyChild.radius === 'number') {
      return 'arc';
    }

    // Container: 有 list 属性和 add 方法
    if (Array.isArray(anyChild.list) && typeof anyChild.add === 'function') {
      return 'container';
    }

    // ParticleEmitter: 有 particles 属性或 emit 方法
    if (typeof anyChild.emit === 'function' || typeof anyChild.explode === 'function') {
      return 'particles';
    }

    return 'other';
  }

  // ==================== 便捷方法 ====================

  /**
   * 设置效果的持续时间（自动释放）
   *
   * @param container 容器对象
   * @param duration 持续时间（毫秒）
   */
  setEffectDuration(container: Phaser.GameObjects.Container, duration: number): Phaser.Time.TimerEvent | null {
    return this.createDelayedCall(container, duration, () => {
      this.release(container);
    }, { tag: 'auto_release' });
  }

  /**
   * 快速创建一个完整的效果
   *
   * @param config 效果配置
   * @param setupFn 设置函数，用于创建视觉效果元素
   * @returns 容器对象
   */
  createEffect(
    config: C,
    setupFn: (
      container: Phaser.GameObjects.Container,
      pool: this
    ) => {
      duration?: number;
      tweens?: Phaser.Tweens.Tween[];
      particles?: Phaser.GameObjects.Particles.ParticleEmitter[];
      timers?: Phaser.Time.TimerEvent[];
    }
  ): Phaser.GameObjects.Container | null {
    const container = this.acquireWithConfig(config);
    if (!container) return null;

    const result = setupFn(container, this);

    // 设置持续时间
    if (result.duration) {
      this.setEffectDuration(container, result.duration);
    } else if (config.duration || this.defaultDuration) {
      this.setEffectDuration(container, config.duration ?? this.defaultDuration);
    }

    // 托管 tweens
    if (result.tweens) {
      result.tweens.forEach(tween => {
        this.addManagedTween(container, tween);
      });
    }

    // 托管粒子
    if (result.particles) {
      result.particles.forEach(emitter => {
        this.addManagedParticle(container, emitter);
      });
    }

    // 托管定时器
    if (result.timers) {
      result.timers.forEach(timer => {
        this.addManagedTimer(container, timer);
      });
    }

    return container;
  }

  // ==================== 清理方法 ====================

  /**
   * 清理容器的所有托管 Tween
   */
  protected cleanupTweens(container: Phaser.GameObjects.Container): void {
    const tweens = this.managedTweens.get(container);
    if (!tweens) return;

    tweens.forEach(managed => {
      if (managed.autoStop && managed.tween) {
        if (managed.tween.isPlaying()) {
          managed.tween.stop();
        }
        // 确保 tween 被移除
        this.scene.tweens.remove(managed.tween);
      }
    });

    this.managedTweens.delete(container);
    this.logDebug(`cleanupTweens: cleaned ${tweens.length} tweens`);
  }

  /**
   * 清理容器的所有托管粒子发射器
   */
  protected cleanupParticles(container: Phaser.GameObjects.Container): void {
    const particles = this.managedParticles.get(container);
    if (!particles) return;

    particles.forEach(managed => {
      if (managed.autoStop && managed.emitter && managed.emitter.active) {
        managed.emitter.stop();
      }
      if (managed.autoDestroy && managed.emitter) {
        managed.emitter.destroy();
      }
    });

    this.managedParticles.delete(container);
    this.logDebug(`cleanupParticles: cleaned ${particles.length} particle emitters`);
  }

  /**
   * 清理容器的所有托管定时器
   */
  protected cleanupTimers(container: Phaser.GameObjects.Container): void {
    const timers = this.managedTimers.get(container);
    if (!timers) return;

    timers.forEach(managed => {
      if (managed.autoDestroy && managed.timer) {
        managed.timer.destroy();
      }
    });

    this.managedTimers.delete(container);
    this.logDebug(`cleanupTimers: cleaned ${timers.length} timers`);
  }

  /**
   * 清理容器的所有托管子对象
   */
  protected cleanupChildren(container: Phaser.GameObjects.Container): void {
    const children = this.managedChildren.get(container);
    if (!children) return;

    // 按层级从高到低清理
    const sortedChildren = [...children].sort((a, b) => (b.layer ?? 0) - (a.layer ?? 0));

    sortedChildren.forEach(managed => {
      if ('destroy' in managed.child) {
        (managed.child as any).destroy();
      }
    });

    this.managedChildren.delete(container);
    this.logDebug(`cleanupChildren: cleaned ${children.length} children`);
  }

  /**
   * 清理容器的所有托管资源
   */
  protected cleanupAll(container: Phaser.GameObjects.Container): void {
    if (this.autoCleanupTweens) {
      this.cleanupTweens(container);
    }
    if (this.autoCleanupParticles) {
      this.cleanupParticles(container);
    }
    if (this.autoCleanupTimers) {
      this.cleanupTimers(container);
    }
    if (this.autoCleanupChildren) {
      this.cleanupChildren(container);
    }
  }

  // ==================== 重写父类方法 ====================

  protected deactivate(obj: Phaser.GameObjects.Container): void {
    obj.setActive(false);
    obj.setVisible(false);
    obj.setPosition(-9999, -9999); // 移出屏幕

    // 清理所有托管资源
    this.cleanupAll(obj);

    // 停止所有剩余的 tweens（包括子对象的）
    this.scene.tweens.killTweensOf(obj);

    // 清理子对象的 tweens
    obj.list.forEach((child: any) => {
      if (child.active) {
        this.scene.tweens.killTweensOf(child);
      }
    });

    // 注意：不要移除子对象！子对象是预创建的，应该被复用
    // 之前的 obj.removeAll(true) 会导致子对象被销毁，无法复用
  }

  protected destroyObject(obj: Phaser.GameObjects.Container): void {
    if (obj && obj.active) {
      // 确保所有托管资源被清理
      this.cleanupAll(obj);
      obj.destroy();
    }
  }

  // ==================== 统计与调试 ====================

  /**
   * 获取容器托管资源统计
   */
  getContainerStats(container: Phaser.GameObjects.Container): {
    tweens: number;
    particles: number;
    timers: number;
    children: number;
  } {
    return {
      tweens: this.managedTweens.get(container)?.length ?? 0,
      particles: this.managedParticles.get(container)?.length ?? 0,
      timers: this.managedTimers.get(container)?.length ?? 0,
      children: this.managedChildren.get(container)?.length ?? 0,
    };
  }

  /**
   * 获取总体托管资源统计
   */
  getTotalManagedStats(): {
    containers: number;
    tweens: number;
    particles: number;
    timers: number;
    children: number;
  } {
    let tweens = 0;
    let particles = 0;
    let timers = 0;
    let children = 0;

    this.managedTweens.forEach(t => tweens += t.length);
    this.managedParticles.forEach(p => particles += p.length);
    this.managedTimers.forEach(t => timers += t.length);
    this.managedChildren.forEach(c => children += c.length);

    return {
      containers: this.active.size,
      tweens,
      particles,
      timers,
      children,
    };
  }

  /**
   * 打印托管资源状态（调试用）
   */
  logManagedStatus(): void {
    const stats = this.getTotalManagedStats();
    console.log(`=== ${this.name} Managed Resources ===`);
    console.log(`Active Containers: ${stats.containers}`);
    console.log(`Managed Tweens: ${stats.tweens}`);
    console.log(`Managed Particles: ${stats.particles}`);
    console.log(`Managed Timers: ${stats.timers}`);
    console.log(`Managed Children: ${stats.children}`);
  }

  /**
   * 清空池（重写以清理所有托管资源）
   */
  clear(): void {
    this.logDebug(`clear: destroying ${this.active.size} active and ${this.pool.length} pooled objects`);

    // 清理所有活跃对象的托管资源
    this.active.forEach((obj) => {
      this.cleanupAll(obj);
      this.destroyObject(obj);
    });

    // 清理池中对象
    this.pool.forEach((obj) => {
      this.destroyObject(obj);
    });

    // 清空托管资源映射
    this.managedTweens.clear();
    this.managedParticles.clear();
    this.managedTimers.clear();
    this.managedChildren.clear();

    this.active.clear();
    this.pool = [];

    this.updateMetrics();
    this.logDebug('clear completed');
  }
}
