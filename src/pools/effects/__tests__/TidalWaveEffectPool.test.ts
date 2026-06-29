import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TidalWaveEffectPool, TidalWaveEffectConfig } from '@/pools/effects/TidalWaveEffectPool';
import Phaser from 'phaser';

// 简化的 Mock 对象工厂
function createMockContainer() {
  const children: any[] = [];
  return {
    x: 0,
    y: 0,
    active: true,
    visible: true,
    get list() { return children; },
    depth: 0,
    angle: 0,
    scale: 1,
    scaleX: 1,
    scaleY: 1,
    alpha: 1,
    name: '',
    setName: vi.fn(function(this: any, name: string) { this.name = name; return this; }),
    setDepth: vi.fn(function(this: any, d: number) { this.depth = d; return this; }),
    setPosition: vi.fn(function(this: any, x: number, y: number) { this.x = x; this.y = y; return this; }),
    setActive: vi.fn(function(this: any, a: boolean) { this.active = a; return this; }),
    setVisible: vi.fn(function(this: any, v: boolean) { this.visible = v; return this; }),
    setScale: vi.fn(function(this: any, x: number, y?: number) { this.scaleX = x; this.scaleY = y ?? x; return this; }),
    setAlpha: vi.fn(function(this: any, a: number) { this.alpha = a; return this; }),
    setRotation: vi.fn(function(this: any, r: number) { this.angle = r; return this; }),
    add: vi.fn(function(this: any, child: any) {
      children.push(child);
      return this;
    }),
    removeAt: vi.fn(function(this: any, index: number, destroy?: boolean) {
      const removed = children.splice(index, 1);
      if (destroy && removed[0]?.destroy) {
        removed[0].destroy();
      }
      return this;
    }),
    removeAll: vi.fn(function(this: any, destroy?: boolean) {
      if (destroy) {
        children.forEach((c: any) => c.destroy?.());
      }
      children.length = 0;
      return this;
    }),
    getByName: vi.fn(function(this: any, name: string) {
      return children.find((c: any) => c.name === name);
    }),
    getAt: vi.fn(function(this: any, index: number) {
      return children[index];
    }),
    destroy: vi.fn(function(this: any) {
      this.active = false;
      children.forEach((c: any) => c.destroy?.());
    }),
  } as unknown as Phaser.GameObjects.Container;
}

function createMockGraphics(name: string) {
  return {
    active: true,
    name,
    angle: 0,
    alpha: 1,
    x: 0,
    y: 0,
    destroy: vi.fn(function(this: any) { this.active = false; }),
    clear: vi.fn(),
    lineStyle: vi.fn(),
    strokeCircle: vi.fn(),
    fillStyle: vi.fn(),
    fillEllipse: vi.fn(),
    setAngle: vi.fn(function(this: any, a: number) { this.angle = a; return this; }),
    setAlpha: vi.fn(function(this: any, a: number) { this.alpha = a; return this; }),
    setPosition: vi.fn(function(this: any, x: number, y: number) { this.x = x; this.y = y; return this; }),
    setName: vi.fn(function(this: any, n: string) { this.name = n; return this; }),
    setDepth: vi.fn(function(this: any, d: number) { this.depth = d; return this; }),
  } as unknown as Phaser.GameObjects.Graphics;
}

function createMockScene() {
  const tweens: any[] = [];
  const timers: any[] = [];
  let containerCounter = 0;
  let graphicsCounter = 0;

  const scene = {
    tweens: {
      add: vi.fn((config: any) => {
        const tween = {
          isPlaying: vi.fn(() => true),
          stop: vi.fn(),
          remove: vi.fn(),
          pause: vi.fn(),
          resume: vi.fn(),
          targets: config.targets,
        };
        tweens.push(tween);
        if (config.onComplete) {
          config.onComplete();
        }
        return tween;
      }),
      killTweensOf: vi.fn((target: any) => {}),
      remove: vi.fn((tween: any) => {
        const idx = tweens.indexOf(tween);
        if (idx > -1) tweens.splice(idx, 1);
      }),
    },
    time: {
      addEvent: vi.fn((config: any) => {
        const timer = {
          destroy: vi.fn(),
          paused: false,
          elapsed: 0,
          delay: config.delay,
          repeat: config.repeat ?? 0,
          remove: vi.fn(),
        };
        timers.push(timer);
        return timer;
      }),
      delayedCall: vi.fn((delay: number, callback: () => void) => {
        const timer = {
          destroy: vi.fn(),
          paused: false,
          elapsed: 0,
          delay,
          callback,
          remove: vi.fn(),
        };
        timers.push(timer);
        return timer;
      }),
    },
    add: {
      container: vi.fn((x: number, y: number) => {
        const container = createMockContainer();
        container.x = x;
        container.y = y;
        (container as any).name = `container_${containerCounter++}`;
        return container;
      }),
      graphics: vi.fn(() => {
        return createMockGraphics(`graphics_${graphicsCounter++}`);
      }),
      particles: vi.fn(() => ({
        setName: vi.fn(),
        setDepth: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        destroy: vi.fn(),
        active: true,
      })),
      existing: vi.fn((obj: any) => obj),
    },
    events: {
      on: vi.fn(),
      off: vi.fn(),
      once: vi.fn(),
      emit: vi.fn(),
    },
  } as unknown as Phaser.Scene;

  return { scene, tweens, timers };
}

describe('TidalWaveEffectPool', () => {
  let mockSceneData: ReturnType<typeof createMockScene>;
  let pool: TidalWaveEffectPool;

  beforeEach(() => {
    mockSceneData = createMockScene();
    const { scene } = mockSceneData;
    pool = new TidalWaveEffectPool(scene, 2);
  });

  describe('基础功能', () => {
    it('应该正确初始化', () => {
      expect(pool).toBeDefined();
      expect(pool.getPooledCount()).toBe(2);
      expect(pool.getActiveCount()).toBe(0);
    });

    it('应该能获取和释放对象', () => {
      const config: TidalWaveEffectConfig = {
        x: 100,
        y: 100,
        range: 200,
        waveWidth: 60,
        angle: 0,
        duration: 500,
      };

      const obj = pool.acquireWithConfig(config);

      expect(obj).toBeDefined();
      expect(pool.getActiveCount()).toBe(1);
      expect(pool.getPooledCount()).toBe(1);

      pool.release(obj!);

      expect(pool.getActiveCount()).toBe(0);
      expect(pool.getPooledCount()).toBe(2);
    });
  });

  describe('水波层管理', () => {
    it('应该正确创建和配置水波层', () => {
      const config: TidalWaveEffectConfig = {
        x: 100,
        y: 100,
        range: 200,
        waveWidth: 60,
        angle: 0.5,
        duration: 500,
      };

      const obj = pool.acquireWithConfig(config);
      expect(obj).toBeDefined();
      expect(obj!.active).toBe(true);
      expect(obj!.visible).toBe(true);
      expect(obj!.x).toBe(100);
      expect(obj!.y).toBe(100);
    });

    it('释放后水波层状态应该被重置', () => {
      const config: TidalWaveEffectConfig = {
        x: 100,
        y: 100,
        range: 200,
        waveWidth: 60,
        angle: 0,
        duration: 500,
      };

      const obj = pool.acquireWithConfig(config);
      expect(obj!.active).toBe(true);

      pool.release(obj!);

      expect(obj!.active).toBe(false);
      expect(obj!.visible).toBe(false);
    });
  });

  describe('粒子系统管理', () => {
    it('应该创建水花粒子发射器', () => {
      const config: TidalWaveEffectConfig = {
        x: 100,
        y: 100,
        range: 200,
        waveWidth: 60,
        angle: 0,
        duration: 500,
      };

      pool.acquireWithConfig(config);
      expect(mockSceneData.scene.add.particles).toHaveBeenCalled();
    });
  });

  describe('释放时清理', () => {
    it('release 应该正确停用对象', () => {
      const config: TidalWaveEffectConfig = {
        x: 100,
        y: 100,
        range: 200,
        waveWidth: 60,
        angle: 0,
        duration: 500,
      };

      const obj = pool.acquireWithConfig(config);
      expect(obj!.active).toBe(true);

      pool.release(obj!);
      expect(obj!.active).toBe(false);
    });
  });

  describe('统计功能', () => {
    it('getStats 应该返回正确的统计', () => {
      const config: TidalWaveEffectConfig = {
        x: 100,
        y: 100,
        range: 200,
        waveWidth: 60,
        angle: 0,
        duration: 500,
      };

      pool.acquireWithConfig(config);
      const stats = pool.getStats();

      expect(stats.active).toBe(1);
      expect(stats.pooled).toBe(1);
      expect(stats.total).toBe(2);
    });
  });

  describe('清理功能', () => {
    it('clear 应该清理所有资源', () => {
      const config: TidalWaveEffectConfig = {
        x: 100,
        y: 100,
        range: 200,
        waveWidth: 60,
        angle: 0,
        duration: 500,
      };

      pool.acquireWithConfig(config);
      pool.acquireWithConfig(config);

      expect(pool.getActiveCount()).toBe(2);

      pool.clear();

      expect(pool.getActiveCount()).toBe(0);
      expect(pool.getPooledCount()).toBe(0);
    });

    it('releaseAll 应该释放所有活跃效果', () => {
      const config: TidalWaveEffectConfig = {
        x: 100,
        y: 100,
        range: 200,
        waveWidth: 60,
        angle: 0,
        duration: 500,
      };

      pool.acquireWithConfig(config);
      pool.acquireWithConfig(config);

      expect(pool.getActiveCount()).toBe(2);

      pool.releaseAll();

      expect(pool.getActiveCount()).toBe(0);
    });
  });

  describe('Tween 管理', () => {
    it('应该创建水波推进动画 tween', () => {
      const { tweens } = mockSceneData;
      const config: TidalWaveEffectConfig = {
        x: 100,
        y: 100,
        range: 200,
        waveWidth: 60,
        angle: 0,
        duration: 500,
      };

      pool.acquireWithConfig(config);

      expect(tweens.length).toBeGreaterThan(0);
    });
  });

  describe('多次释放安全检查', () => {
    it('多次释放应该不会出错', () => {
      const config: TidalWaveEffectConfig = {
        x: 100,
        y: 100,
        range: 200,
        waveWidth: 60,
        angle: 0,
        duration: 500,
      };

      const obj = pool.acquireWithConfig(config);

      pool.release(obj!);
      pool.release(obj!);

      expect(pool.getActiveCount()).toBe(0);
    });
  });
});
