/**
 * 对象池配置选项
 */
export interface ObjectPoolOptions {
  /** 初始大小（默认 10） */
  initialSize?: number;
  /** 是否启用自动扩展（默认 true） */
  autoExpand?: boolean;
  /** 自动扩展时的增量（默认 5） */
  expandStep?: number;
  /** 最大容量，0 表示无限制（默认 0） */
  maxCapacity?: number;
  /** 是否启用调试日志（默认 false） */
  debug?: boolean;
  /** 池名称，用于调试日志（默认 'ObjectPool'） */
  name?: string;
}

/**
 * 对象池性能指标
 */
export interface ObjectPoolMetrics {
  /** 总获取次数 */
  acquireCount: number;
  /** 总释放次数 */
  releaseCount: number;
  /** 扩展次数 */
  expandCount: number;
  /** 池空命中次数（获取时池为空的次数） */
  emptyHitCount: number;
  /** 预热次数 */
  warmUpCount: number;
  /** 当前可用数量 */
  pooledCount: number;
  /** 当前活跃数量 */
  activeCount: number;
  /** 总数量 */
  totalCount: number;
  /** 最大容量限制（0 表示无限制） */
  maxCapacity: number;
  /** 池名称 */
  name: string;
  /** 自动扩展是否启用 */
  autoExpandEnabled: boolean;
}

/**
 * 通用对象池基类
 *
 * 提供对象复用机制，减少 GC 压力和创建开销
 *
 * 功能特性：
 * - 预热功能：可在游戏加载阶段预先创建对象
 * - 自动扩展：池空时自动扩展容量
 * - 性能监控：追踪获取/释放/扩展等操作
 * - 调试日志：可选的详细日志输出
 *
 * @template T 池化对象类型
 */
export abstract class ObjectPool<T> {
  protected pool: T[] = [];
  protected active: Set<T> = new Set();

  // 配置选项
  protected readonly initialSize: number;
  protected readonly autoExpand: boolean;
  protected readonly expandStep: number;
  protected readonly maxCapacity: number;
  protected readonly debug: boolean;
  protected readonly name: string;

  // 性能指标
  protected metrics: ObjectPoolMetrics;

  constructor(
    protected scene: Phaser.Scene,
    options: ObjectPoolOptions = {}
  ) {
    // 解构配置选项，提供默认值
    this.initialSize = options.initialSize ?? 10;
    this.autoExpand = options.autoExpand ?? true;
    this.expandStep = options.expandStep ?? 5;
    this.maxCapacity = options.maxCapacity ?? 0;
    this.debug = options.debug ?? false;
    this.name = options.name ?? 'ObjectPool';

    // 初始化性能指标
    this.metrics = {
      acquireCount: 0,
      releaseCount: 0,
      expandCount: 0,
      emptyHitCount: 0,
      warmUpCount: 0,
      pooledCount: 0,
      activeCount: 0,
      totalCount: 0,
      maxCapacity: this.maxCapacity,
      name: this.name,
      autoExpandEnabled: this.autoExpand,
    };

    // 预创建初始对象
    if (this.initialSize > 0) {
      this.expand(this.initialSize);
    }

    this.logDebug(`Initialized with size ${this.initialSize}, autoExpand=${this.autoExpand}, maxCapacity=${this.maxCapacity}`);
  }

  /**
   * 创建新对象（子类实现）
   */
  protected abstract create(): T;

  /**
   * 重置对象状态（子类实现）
   */
  protected abstract reset(obj: T): void;

  /**
   * 销毁对象（子类实现）
   */
  protected abstract destroyObject(obj: T): void;

  /**
   * 停用对象（子类实现）
   */
  protected abstract deactivate(obj: T): void;

  /**
   * 预热功能：预先创建指定数量的对象
   *
   * 与构造函数中的 initialSize 不同，warmUp 可以在运行时调用，
   * 用于在游戏加载阶段或场景切换时预热对象池。
   *
   * @param count 要预热的对象数量
   * @returns 实际预热的数量（可能因达到最大容量而小于请求数）
   */
  warmUp(count: number): number {
    if (count <= 0) {
      this.logDebug('warmUp called with count <= 0, skipping');
      return 0;
    }

    // 检查是否达到最大容量
    const currentTotal = this.pool.length + this.active.size;
    let actualCount = count;

    if (this.maxCapacity > 0 && currentTotal + count > this.maxCapacity) {
      actualCount = Math.max(0, this.maxCapacity - currentTotal);
      this.logDebug(
        `warmUp limited by maxCapacity: requested=${count}, actual=${actualCount}, currentTotal=${currentTotal}, maxCapacity=${this.maxCapacity}`
      );
    }

    if (actualCount === 0) {
      this.logDebug('warmUp skipped: already at max capacity');
      return 0;
    }

    // 创建预热对象
    for (let i = 0; i < actualCount; i++) {
      const obj = this.create();
      this.deactivate(obj);
      this.pool.push(obj);
    }

    this.metrics.warmUpCount += actualCount;
    this.updateMetrics();

    this.logDebug(`warmUp completed: created ${actualCount} objects, pooled=${this.pool.length}, active=${this.active.size}`);
    return actualCount;
  }

  /**
   * 扩展池大小
   *
   * @param count 要扩展的对象数量
   * @returns 实际扩展的数量
   */
  protected expand(count: number): number {
    if (count <= 0) {
      return 0;
    }

    // 检查是否达到最大容量
    const currentTotal = this.pool.length + this.active.size;
    let actualCount = count;

    if (this.maxCapacity > 0 && currentTotal + count > this.maxCapacity) {
      actualCount = Math.max(0, this.maxCapacity - currentTotal);
      this.logDebug(
        `expand limited by maxCapacity: requested=${count}, actual=${actualCount}, currentTotal=${currentTotal}`
      );
    }

    if (actualCount === 0) {
      this.logDebug('expand skipped: already at max capacity');
      return 0;
    }

    for (let i = 0; i < actualCount; i++) {
      const obj = this.create();
      this.deactivate(obj);
      this.pool.push(obj);
    }

    this.metrics.expandCount++;
    this.updateMetrics();

    this.logDebug(`expand completed: created ${actualCount} objects, pooled=${this.pool.length}`);
    return actualCount;
  }

  /**
   * 获取对象
   *
   * @returns 池中的对象，如果池空且无法扩展则返回 null
   */
  acquire(): T | null {
    let obj = this.pool.pop();

    if (!obj) {
      // 池空
      this.metrics.emptyHitCount++;

      // 尝试自动扩展
      if (this.autoExpand) {
        const expanded = this.expand(this.expandStep);
        if (expanded > 0) {
          obj = this.pool.pop();
          this.logDebug(`auto-expanded pool by ${expanded}, new pooled size: ${this.pool.length}`);
        } else {
          this.logDebug('auto-expand failed: reached max capacity or expand returned 0');
        }
      }
    }

    if (obj) {
      this.reset(obj);
      this.active.add(obj);
      this.metrics.acquireCount++;
      this.updateMetrics();

      this.logDebug(`acquire success: pooled=${this.pool.length}, active=${this.active.size}`);
    } else {
      this.logDebug('acquire failed: pool empty and cannot expand');
    }

    return obj || null;
  }

  /**
   * 释放对象回池
   *
   * @param obj 要释放的对象
   */
  release(obj: T): void {
    if (!this.active.has(obj)) {
      this.logDebug('release called with object not in active set, ignoring');
      return;
    }

    this.deactivate(obj);
    this.active.delete(obj);
    this.pool.push(obj);

    this.metrics.releaseCount++;
    this.updateMetrics();

    this.logDebug(`release success: pooled=${this.pool.length}, active=${this.active.size}`);
  }

  /**
   * 批量释放对象
   *
   * @param objects 要释放的对象数组
   */
  releaseMultiple(objects: T[]): void {
    for (const obj of objects) {
      this.release(obj);
    }
  }

  /**
   * 清空池
   *
   * 销毁所有对象（包括活跃和池中的）
   */
  clear(): void {
    this.logDebug(`clear: destroying ${this.active.size} active and ${this.pool.length} pooled objects`);

    this.active.forEach((obj) => {
      this.destroyObject(obj);
    });
    this.pool.forEach((obj) => {
      this.destroyObject(obj);
    });
    this.active.clear();
    this.pool = [];

    this.updateMetrics();
    this.logDebug('clear completed');
  }

  /**
   * 收缩池到指定大小
   *
   * 销毁多余的池化对象，保持活跃对象不变
   *
   * @param targetSize 目标池化对象数量
   */
  shrink(targetSize: number): void {
    if (targetSize < 0) {
      targetSize = 0;
    }

    const currentPooled = this.pool.length;
    if (currentPooled <= targetSize) {
      this.logDebug(`shrink skipped: current pooled (${currentPooled}) <= target (${targetSize})`);
      return;
    }

    const toRemove = currentPooled - targetSize;
    this.logDebug(`shrink: removing ${toRemove} objects from pool`);

    for (let i = 0; i < toRemove; i++) {
      const obj = this.pool.pop();
      if (obj) {
        this.destroyObject(obj);
      }
    }

    this.updateMetrics();
  }

  /**
   * 更新性能指标
   */
  protected updateMetrics(): void {
    this.metrics.pooledCount = this.pool.length;
    this.metrics.activeCount = this.active.size;
    this.metrics.totalCount = this.pool.length + this.active.size;
  }

  /**
   * 获取统计信息（向后兼容）
   *
   * @returns 统计信息
   */
  getStats(): { pooled: number; active: number; total: number } {
    return {
      pooled: this.pool.length,
      active: this.active.size,
      total: this.pool.length + this.active.size,
    };
  }

  /**
   * 获取详细性能指标
   *
   * @returns 完整的性能指标对象
   */
  getMetrics(): ObjectPoolMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * 重置性能指标
   *
   * 将所有计数器归零，不影响池中对象
   */
  resetMetrics(): void {
    this.metrics.acquireCount = 0;
    this.metrics.releaseCount = 0;
    this.metrics.expandCount = 0;
    this.metrics.emptyHitCount = 0;
    this.metrics.warmUpCount = 0;
    this.logDebug('metrics reset');
  }

  /**
   * 检查池是否为空
   */
  isEmpty(): boolean {
    return this.pool.length === 0;
  }

  /**
   * 检查池是否已达到最大容量
   */
  isAtMaxCapacity(): boolean {
    if (this.maxCapacity === 0) {
      return false;
    }
    return this.pool.length + this.active.size >= this.maxCapacity;
  }

  /**
   * 检查是否有活跃对象
   */
  hasActive(): boolean {
    return this.active.size > 0;
  }

  /**
   * 获取池中可用对象数量
   */
  getPooledCount(): number {
    return this.pool.length;
  }

  /**
   * 获取活跃对象数量
   */
  getActiveCount(): number {
    return this.active.size;
  }

  /**
   * 获取总对象数量
   */
  getTotalCount(): number {
    return this.pool.length + this.active.size;
  }

  /**
   * 启用调试日志
   */
  enableDebug(): void {
    // 注意：debug 是 readonly，所以需要通过其他方式
    // 这里我们通过 any 类型断言来修改
    (this as any).debug = true;
    this.logDebug('debug logging enabled');
  }

  /**
   * 禁用调试日志
   */
  disableDebug(): void {
    this.logDebug('debug logging disabled');
    (this as any).debug = false;
  }

  /**
   * 输出调试日志
   *
   * @param message 日志消息
   */
  protected logDebug(message: string): void {
    if (this.debug) {
      console.log(`[${this.name}] ${message}`);
    }
  }

  /**
   * 打印当前状态（用于调试）
   */
  logStatus(): void {
    const stats = this.getStats();
    const metrics = this.getMetrics();
    console.log(`=== ${this.name} Status ===`);
    console.log(`Pooled: ${stats.pooled}`);
    console.log(`Active: ${stats.active}`);
    console.log(`Total: ${stats.total}`);
    console.log(`Acquire Count: ${metrics.acquireCount}`);
    console.log(`Release Count: ${metrics.releaseCount}`);
    console.log(`Expand Count: ${metrics.expandCount}`);
    console.log(`Empty Hit Count: ${metrics.emptyHitCount}`);
    console.log(`WarmUp Count: ${metrics.warmUpCount}`);
    console.log(`Auto Expand: ${metrics.autoExpandEnabled}`);
    console.log(`Max Capacity: ${metrics.maxCapacity === 0 ? 'unlimited' : metrics.maxCapacity}`);
  }
}