import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ObjectPool, ObjectPoolOptions, ObjectPoolMetrics } from '../ObjectPool';

/**
 * ObjectPool.test.ts
 *
 * 测试对象池基类的所有功能：
 * 1. 基本功能（acquire, release, clear）
 * 2. 预热功能（warmUp）
 * 3. 自动扩展功能（autoExpand）
 * 4. 性能监控（metrics）
 * 5. 调试日志（debug）
 * 6. 边界条件
 */

// ============================================
// Mock Phaser Scene
// ============================================
const mockScene = {
  add: {
    container: vi.fn(() => ({
      setActive: vi.fn(),
      setVisible: vi.fn(),
      setPosition: vi.fn(),
      destroy: vi.fn(),
    })),
  },
  tweens: {
    killTweensOf: vi.fn(),
  },
  time: {
    delayedCall: vi.fn(),
  },
} as unknown as Phaser.Scene;

// ============================================
// 测试用具体实现
// ============================================
interface TestObject {
  id: number;
  active: boolean;
  data: string;
}

class TestObjectPool extends ObjectPool<TestObject> {
  private nextId = 0;

  protected create(): TestObject {
    return {
      id: ++this.nextId,
      active: false,
      data: '',
    };
  }

  protected reset(obj: TestObject): void {
    obj.active = true;
    obj.data = 'reset';
  }

  protected destroyObject(obj: TestObject): void {
    obj.active = false;
    obj.data = 'destroyed';
  }

  protected deactivate(obj: TestObject): void {
    obj.active = false;
    obj.data = 'deactivated';
  }
}

// ============================================
// 测试套件
// ============================================
describe('ObjectPool', () => {
  let pool: TestObjectPool;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // 基本功能测试
  // ============================================
  describe('Basic Functionality', () => {
    it('should initialize with default size of 10', () => {
      pool = new TestObjectPool(mockScene);
      const stats = pool.getStats();
      expect(stats.pooled).toBe(10);
      expect(stats.active).toBe(0);
      expect(stats.total).toBe(10);
    });

    it('should initialize with custom size', () => {
      pool = new TestObjectPool(mockScene, { initialSize: 5 });
      const stats = pool.getStats();
      expect(stats.pooled).toBe(5);
      expect(stats.total).toBe(5);
    });

    it('should initialize with zero size', () => {
      pool = new TestObjectPool(mockScene, { initialSize: 0 });
      const stats = pool.getStats();
      expect(stats.pooled).toBe(0);
      expect(stats.total).toBe(0);
    });

    it('should acquire an object', () => {
      pool = new TestObjectPool(mockScene, { initialSize: 2 });
      const obj = pool.acquire();

      expect(obj).not.toBeNull();
      expect(obj?.active).toBe(true);
      expect(obj?.data).toBe('reset');

      const stats = pool.getStats();
      expect(stats.pooled).toBe(1);
      expect(stats.active).toBe(1);
    });

    it('should release an object back to pool', () => {
      pool = new TestObjectPool(mockScene, { initialSize: 2 });
      const obj = pool.acquire();
      expect(obj).not.toBeNull();

      pool.release(obj!);

      const stats = pool.getStats();
      expect(stats.pooled).toBe(2);
      expect(stats.active).toBe(0);
      expect(obj?.active).toBe(false);
      expect(obj?.data).toBe('deactivated');
    });

    it('should clear all objects', () => {
      pool = new TestObjectPool(mockScene, { initialSize: 3 });
      const obj1 = pool.acquire();
      const obj2 = pool.acquire();

      pool.clear();

      const stats = pool.getStats();
      expect(stats.pooled).toBe(0);
      expect(stats.active).toBe(0);
      expect(stats.total).toBe(0);

      expect(obj1?.data).toBe('destroyed');
      expect(obj2?.data).toBe('destroyed');
    });

    it('should not release object not in active set', () => {
      pool = new TestObjectPool(mockScene, { initialSize: 2 });
      const obj = pool.acquire();
      pool.release(obj!);

      // 重复释放
      pool.release(obj!);

      const stats = pool.getStats();
      expect(stats.pooled).toBe(2);
      expect(stats.active).toBe(0);
    });
  });

  // ============================================
  // 预热功能测试
  // ============================================
  describe('WarmUp Feature', () => {
    it('should warm up additional objects', () => {
      pool = new TestObjectPool(mockScene, { initialSize: 5 });
      const warmedCount = pool.warmUp(3);

      expect(warmedCount).toBe(3);
      const stats = pool.getStats();
      expect(stats.pooled).toBe(8);
      expect(stats.total).toBe(8);
    });

    it('should track warmUp count in metrics', () => {
      pool = new TestObjectPool(mockScene, { initialSize: 2 });
      pool.warmUp(3);
      pool.warmUp(2);

      const metrics = pool.getMetrics();
      expect(metrics.warmUpCount).toBe(5);
    });

    it('should respect maxCapacity during warmUp', () => {
      pool = new TestObjectPool(mockScene, {
        initialSize: 5,
        maxCapacity: 10,
      });

      const warmedCount = pool.warmUp(10);
      expect(warmedCount).toBe(5); // 只能再创建5个

      const stats = pool.getStats();
      expect(stats.total).toBe(10);
    });

    it('should return 0 when already at maxCapacity', () => {
      pool = new TestObjectPool(mockScene, {
        initialSize: 5,
        maxCapacity: 5,
      });

      const warmedCount = pool.warmUp(3);
      expect(warmedCount).toBe(0);
    });

    it('should handle warmUp with count 0', () => {
      pool = new TestObjectPool(mockScene, { initialSize: 5 });
      const warmedCount = pool.warmUp(0);

      expect(warmedCount).toBe(0);
      const stats = pool.getStats();
      expect(stats.total).toBe(5);
    });

    it('should handle warmUp with negative count', () => {
      pool = new TestObjectPool(mockScene, { initialSize: 5 });
      const warmedCount = pool.warmUp(-5);

      expect(warmedCount).toBe(0);
    });
  });

  // ============================================
  // 自动扩展功能测试
  // ============================================
  describe('Auto-Expand Feature', () => {
    it('should auto-expand when pool is empty (default enabled)', () => {
      pool = new TestObjectPool(mockScene, { initialSize: 1, expandStep: 3 });

      // 消耗初始对象
      pool.acquire();
      expect(pool.getPooledCount()).toBe(0);

      // 再次获取，应触发自动扩展
      const obj = pool.acquire();
      expect(obj).not.toBeNull();

      const stats = pool.getStats();
      expect(stats.pooled).toBe(2); // 扩展了3个，用掉了1个，剩余2个
    });

    it('should not auto-expand when disabled', () => {
      pool = new TestObjectPool(mockScene, {
        initialSize: 1,
        autoExpand: false,
      });

      pool.acquire();
      expect(pool.getPooledCount()).toBe(0);

      const obj = pool.acquire();
      expect(obj).toBeNull();
    });

    it('should use custom expandStep', () => {
      pool = new TestObjectPool(mockScene, {
        initialSize: 1,
        expandStep: 10,
      });

      pool.acquire();
      pool.acquire(); // 触发扩展

      const stats = pool.getStats();
      expect(stats.pooled).toBe(9); // 扩展10个，用掉1个
    });

    it('should track emptyHitCount when pool is empty', () => {
      pool = new TestObjectPool(mockScene, {
        initialSize: 1,
        autoExpand: false, // 禁用自动扩展以便准确追踪 emptyHitCount
      });

      pool.acquire(); // 消耗初始对象
      pool.acquire(); // 池空，emptyHitCount = 1
      pool.acquire(); // 池空，emptyHitCount = 2

      const metrics = pool.getMetrics();
      expect(metrics.emptyHitCount).toBe(2);
    });

    it('should respect maxCapacity during auto-expand', () => {
      pool = new TestObjectPool(mockScene, {
        initialSize: 1,
        maxCapacity: 3,
        expandStep: 10,
      });

      pool.acquire();
      const obj2 = pool.acquire(); // 触发扩展

      expect(obj2).not.toBeNull();
      const stats = pool.getStats();
      expect(stats.total).toBe(3); // 最大容量限制

      // 再获取应该成功
      const obj3 = pool.acquire();
      expect(obj3).not.toBeNull();
      expect(stats.total).toBe(3);
    });

    it('should return null when at maxCapacity and pool empty', () => {
      pool = new TestObjectPool(mockScene, {
        initialSize: 2,
        maxCapacity: 2,
        autoExpand: true,
      });

      pool.acquire();
      pool.acquire();

      const obj = pool.acquire();
      expect(obj).toBeNull();
    });

    it('should track expandCount in metrics', () => {
      pool = new TestObjectPool(mockScene, {
        initialSize: 0, // 从 0 开始，不触发构造函数中的 expand
        expandStep: 2,
      });

      // 手动预热以避免初始扩展计数
      pool.acquire(); // 触发自动扩展 1
      pool.acquire();
      pool.acquire(); // 触发自动扩展 2

      const metrics = pool.getMetrics();
      expect(metrics.expandCount).toBe(2);
    });
  });

  // ============================================
  // 性能监控测试
  // ============================================
  describe('Performance Metrics', () => {
    it('should track acquireCount', () => {
      pool = new TestObjectPool(mockScene, { initialSize: 10 });

      pool.acquire();
      pool.acquire();
      pool.acquire();

      const metrics = pool.getMetrics();
      expect(metrics.acquireCount).toBe(3);
    });

    it('should track releaseCount', () => {
      pool = new TestObjectPool(mockScene, { initialSize: 10 });

      const obj1 = pool.acquire();
      const obj2 = pool.acquire();

      pool.release(obj1!);
      pool.release(obj2!);

      const metrics = pool.getMetrics();
      expect(metrics.releaseCount).toBe(2);
    });

    it('should track all metrics correctly', () => {
      pool = new TestObjectPool(mockScene, {
        initialSize: 2,
        autoExpand: true,
        expandStep: 2,
      });

      // 预热
      pool.warmUp(3);

      // 获取
      const obj1 = pool.acquire();
      const obj2 = pool.acquire();
      const obj3 = pool.acquire();

      // 释放
      pool.release(obj1!);
      pool.release(obj2!);

      const metrics = pool.getMetrics();
      expect(metrics.acquireCount).toBe(3);
      expect(metrics.releaseCount).toBe(2);
      expect(metrics.warmUpCount).toBe(3);
      expect(metrics.emptyHitCount).toBeGreaterThanOrEqual(0);
    });

    it('should reset metrics', () => {
      pool = new TestObjectPool(mockScene, { initialSize: 5 });

      pool.acquire();
      pool.acquire();
      pool.warmUp(2);

      pool.resetMetrics();

      const metrics = pool.getMetrics();
      expect(metrics.acquireCount).toBe(0);
      expect(metrics.releaseCount).toBe(0);
      expect(metrics.expandCount).toBe(0);
      expect(metrics.emptyHitCount).toBe(0);
      expect(metrics.warmUpCount).toBe(0);

      // 池中对象不应受影响
      expect(metrics.pooledCount).toBe(5);
    });

    it('should return metrics with all fields', () => {
      pool = new TestObjectPool(mockScene, {
        initialSize: 5,
        name: 'TestPool',
        autoExpand: true,
        maxCapacity: 20,
      });

      const metrics = pool.getMetrics();

      expect(metrics.name).toBe('TestPool');
      expect(metrics.autoExpandEnabled).toBe(true);
      expect(metrics.maxCapacity).toBe(20);
      expect(metrics.pooledCount).toBe(5);
      expect(metrics.activeCount).toBe(0);
      expect(metrics.totalCount).toBe(5);
      expect(typeof metrics.acquireCount).toBe('number');
      expect(typeof metrics.releaseCount).toBe('number');
      expect(typeof metrics.expandCount).toBe('number');
      expect(typeof metrics.emptyHitCount).toBe('number');
      expect(typeof metrics.warmUpCount).toBe('number');
    });

    it('should provide backward-compatible getStats()', () => {
      pool = new TestObjectPool(mockScene, { initialSize: 5 });
      const obj = pool.acquire();

      const stats = pool.getStats();
      expect(stats).toEqual({
        pooled: 4,
        active: 1,
        total: 5,
      });
    });
  });

  // ============================================
  // 调试日志测试
  // ============================================
  describe('Debug Logging', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should not log when debug is disabled', () => {
      pool = new TestObjectPool(mockScene, { initialSize: 2, debug: false });

      pool.acquire();
      pool.release(pool.acquire()!);

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should log when debug is enabled', () => {
      pool = new TestObjectPool(mockScene, {
        initialSize: 2,
        debug: true,
        name: 'DebugTestPool',
      });

      pool.acquire();

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0][0];
      expect(logCall).toContain('DebugTestPool');
    });

    it('should use custom pool name in logs', () => {
      pool = new TestObjectPool(mockScene, {
        initialSize: 2,
        debug: true,
        name: 'MyCustomPool',
      });

      pool.acquire();

      const logCall = consoleSpy.mock.calls[0][0];
      expect(logCall).toContain('MyCustomPool');
    });

    it('should log warmUp operations', () => {
      pool = new TestObjectPool(mockScene, {
        initialSize: 2,
        debug: true,
        name: 'TestPool',
      });

      pool.warmUp(3);

      const logs = consoleSpy.mock.calls.map((call: unknown[]) => call[0] as string);
      const warmUpLog = logs.find((log: string) => log.includes('warmUp'));
      expect(warmUpLog).toBeDefined();
    });

    it('should log status', () => {
      pool = new TestObjectPool(mockScene, {
        initialSize: 5,
        name: 'StatusTestPool',
      });

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      pool.logStatus();

      expect(consoleLogSpy).toHaveBeenCalled();
      const calls = consoleLogSpy.mock.calls.map((call) => call[0]);
      expect(calls.some((call) => call.includes('StatusTestPool'))).toBe(true);

      consoleLogSpy.mockRestore();
    });
  });

  // ============================================
  // 边界条件测试
  // ============================================
  describe('Edge Cases', () => {
    it('should handle zero maxCapacity as unlimited', () => {
      pool = new TestObjectPool(mockScene, {
        initialSize: 1,
        maxCapacity: 0,
        expandStep: 100,
      });

      // 应该能持续扩展
      for (let i = 0; i < 100; i++) {
        const obj = pool.acquire();
        expect(obj).not.toBeNull();
      }

      const stats = pool.getStats();
      expect(stats.active).toBe(100);
    });

    it('should shrink pool to target size', () => {
      pool = new TestObjectPool(mockScene, { initialSize: 10 });

      pool.shrink(5);

      const stats = pool.getStats();
      expect(stats.pooled).toBe(5);
    });

    it('should handle shrink to zero', () => {
      pool = new TestObjectPool(mockScene, { initialSize: 10 });

      pool.shrink(0);

      const stats = pool.getStats();
      expect(stats.pooled).toBe(0);
    });

    it('should not shrink below zero', () => {
      pool = new TestObjectPool(mockScene, { initialSize: 5 });

      pool.shrink(-10);

      const stats = pool.getStats();
      expect(stats.pooled).toBe(0);
    });

    it('should not shrink if already at or below target', () => {
      pool = new TestObjectPool(mockScene, { initialSize: 5 });

      pool.shrink(10); // 目标大于当前

      const stats = pool.getStats();
      expect(stats.pooled).toBe(5);
    });

    it('should shrink only pooled objects, not active', () => {
      pool = new TestObjectPool(mockScene, { initialSize: 10 });

      // 获取一些对象使其活跃
      pool.acquire();
      pool.acquire();
      pool.acquire();

      pool.shrink(2);

      const stats = pool.getStats();
      expect(stats.pooled).toBe(2);
      expect(stats.active).toBe(3); // 活跃对象不受影响
    });

    it('should release multiple objects', () => {
      pool = new TestObjectPool(mockScene, { initialSize: 5 });

      const obj1 = pool.acquire();
      const obj2 = pool.acquire();
      const obj3 = pool.acquire();

      pool.releaseMultiple([obj1!, obj2!, obj3!]);

      const stats = pool.getStats();
      expect(stats.active).toBe(0);
      expect(stats.pooled).toBe(5);
    });

    it('should check isEmpty correctly', () => {
      pool = new TestObjectPool(mockScene, { initialSize: 2, autoExpand: false });

      expect(pool.isEmpty()).toBe(false);

      pool.acquire();
      pool.acquire();

      expect(pool.isEmpty()).toBe(true);
    });

    it('should check isAtMaxCapacity correctly', () => {
      pool = new TestObjectPool(mockScene, {
        initialSize: 2,
        maxCapacity: 5,
      });

      expect(pool.isAtMaxCapacity()).toBe(false);

      pool.warmUp(3);

      expect(pool.isAtMaxCapacity()).toBe(true);
    });

    it('should check hasActive correctly', () => {
      pool = new TestObjectPool(mockScene, { initialSize: 5 });

      expect(pool.hasActive()).toBe(false);

      pool.acquire();

      expect(pool.hasActive()).toBe(true);
    });

    it('should provide getter methods', () => {
      pool = new TestObjectPool(mockScene, { initialSize: 5 });

      pool.acquire();
      pool.acquire();

      expect(pool.getPooledCount()).toBe(3);
      expect(pool.getActiveCount()).toBe(2);
      expect(pool.getTotalCount()).toBe(5);
    });
  });

  // ============================================
  // 选项默认值测试
  // ============================================
  describe('Default Options', () => {
    it('should use default values when no options provided', () => {
      pool = new TestObjectPool(mockScene);

      const metrics = pool.getMetrics();
      expect(metrics.maxCapacity).toBe(0); // 无限制
      expect(metrics.autoExpandEnabled).toBe(true);
      expect(metrics.name).toBe('ObjectPool');
    });

    it('should use default values when partial options provided', () => {
      pool = new TestObjectPool(mockScene, { name: 'CustomName' });

      const metrics = pool.getMetrics();
      expect(metrics.name).toBe('CustomName');
      expect(metrics.maxCapacity).toBe(0);
      expect(metrics.autoExpandEnabled).toBe(true);
    });
  });
});
