import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VisualEffectPool } from '@/pools/VisualEffectPool';
import Phaser from 'phaser';

// 简化的 Mock 对象工厂
function createMockContainer() {
  return {
    x: 0,
    y: 0,
    active: true,
    visible: true,
    list: [] as any[],
    depth: 0,
    angle: 0,
    scale: 1,
    scaleX: 1,
    scaleY: 1,
    alpha: 1,
    setName: vi.fn(function(this: any, name: string) { return this; }),
    setDepth: vi.fn(function(this: any, d: number) { this.depth = d; return this; }),
    setPosition: vi.fn(function(this: any, x: number, y: number) { this.x = x; this.y = y; return this; }),
    setActive: vi.fn(function(this: any, a: boolean) { this.active = a; return this; }),
    setVisible: vi.fn(function(this: any, v: boolean) { this.visible = v; return this; }),
    setScale: vi.fn(function(this: any, x: number, y?: number) { this.scaleX = x; this.scaleY = y ?? x; return this; }),
    setAlpha: vi.fn(function(this: any, a: number) { this.alpha = a; return this; }),
    setRotation: vi.fn(function(this: any, r: number) { this.angle = r; return this; }),
    add: vi.fn(function(this: any, child: any) { this.list.push(child); return this; }),
    removeAt: vi.fn(function(this: any, index: number, destroy?: boolean) {
      const removed = this.list.splice(index, 1);
      if (destroy && removed[0]?.destroy) {
        removed[0].destroy();
      }
      return this;
    }),
    removeAll: vi.fn(function(this: any, destroy?: boolean) {
      if (destroy) {
        this.list.forEach((c: any) => c.destroy?.());
      }
      this.list = [];
      return this;
    }),
    getByName: vi.fn(function(this: any, name: string) {
      return this.list.find((c: any) => c.name === name);
    }),
    getAt: vi.fn(function(this: any, index: number) {
      return this.list[index];
    }),
    destroy: vi.fn(function(this: any) {
      this.active = false;
      this.list.forEach((c: any) => c.destroy?.());
    }),
  } as unknown as Phaser.GameObjects.Container;
}

function createMockScene() {
  const tweens: any[] = [];
  const timers: any[] = [];
  const particles: any[] = [];

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
        return tween;
      }),
      killTweensOf: vi.fn((target: any) => {
        // 模拟停止
      }),
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
        return container;
      }),
      circle: vi.fn((x: number, y: number, radius: number, color: number, alpha: number) => {
        return {
          x,
          y,
          radius,
          active: true,
          name: '',
          depth: 0,
          scale: 1,
          scaleX: 1,
          scaleY: 1,
          alpha,
          setRadius: vi.fn(function(this: any, r: number) { this.radius = r; return this; }),
          setFillStyle: vi.fn(function(this: any) { return this; }),
          setPosition: vi.fn(function(this: any, nx: number, ny: number) { this.x = nx; this.y = ny; return this; }),
          setScale: vi.fn(function(this: any, x: number, y?: number) { this.scaleX = x; this.scaleY = y ?? x; return this; }),
          setAlpha: vi.fn(function(this: any, a: number) { this.alpha = a; return this; }),
          setDepth: vi.fn(function(this: any, d: number) { this.depth = d; return this; }),
          setName: vi.fn(function(this: any, n: string) { this.name = n; return this; }),
          destroy: vi.fn(function(this: any) { this.active = false; }),
        } as unknown as Phaser.GameObjects.Arc;
      }),
      graphics: vi.fn(() => {
        return {
          active: true,
          destroy: vi.fn(function(this: any) { this.active = false; }),
          clear: vi.fn(),
          lineStyle: vi.fn(),
          strokeCircle: vi.fn(),
          fillCircle: vi.fn(),
          lineBetween: vi.fn(),
        } as unknown as Phaser.GameObjects.Graphics;
      }),
      particles: vi.fn((x: number, y: number, texture: string, config: any) => {
        const emitter = {
          x,
          y,
          active: true,
          name: '',
          depth: 0,
          setName: vi.fn(function(this: any, n: string) { this.name = n; return this; }),
          setDepth: vi.fn(function(this: any, d: number) { this.depth = d; return this; }),
          setEmitZone: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
          explode: vi.fn(function(this: any, count?: number) {}),
          destroy: vi.fn(function(this: any) { this.active = false; }),
          manager: null,
        };
        particles.push(emitter);
        return emitter as unknown as Phaser.GameObjects.Particles.ParticleEmitter;
      }),
      existing: vi.fn((obj: any) => obj),
    },
    events: {
      on: vi.fn(),
      off: vi.fn(),
      once: vi.fn(),
      emit: vi.fn(),
    },
  } as unknown as Phaser.Scene;

  return { scene, tweens, timers, particles };
}

describe('VisualEffectPool', () => {
  let mockSceneData: ReturnType<typeof createMockScene>;
  let pool: VisualEffectPool;

  beforeEach(() => {
    mockSceneData = createMockScene();
    const { scene } = mockSceneData;

    pool = new VisualEffectPool(
      scene,
      () => (scene.add as any).container(0, 0),
      (obj: any, config: any) => {
        obj.setPosition(config.x, config.y);
        obj.setActive(true);
        obj.setVisible(true);
      },
      { initialSize: 3, name: 'TestPool' }
    );
  });

  describe('基础功能', () => {
    it('应该正确初始化', () => {
      expect(pool).toBeDefined();
      expect(pool.getPooledCount()).toBe(3);
      expect(pool.getActiveCount()).toBe(0);
    });

    it('应该能获取和释放对象', () => {
      const config = { x: 100, y: 100 };
      const obj = pool.acquireWithConfig(config);

      expect(obj).toBeDefined();
      expect(pool.getActiveCount()).toBe(1);
      expect(pool.getPooledCount()).toBe(2);

      pool.release(obj!);
      expect(pool.getActiveCount()).toBe(0);
      expect(pool.getPooledCount()).toBe(3);
    });
  });

  describe('Tween 管理', () => {
    it('应该能添加托管 Tween', () => {
      const config = { x: 100, y: 100 };
      const obj = pool.acquireWithConfig(config);

      const tween = pool.addManagedTween(obj!, {
        targets: obj!,
        alpha: 0,
        duration: 1000,
      });

      expect(tween).toBeDefined();
      expect(mockSceneData.scene.tweens.add).toHaveBeenCalled();

      const stats = pool.getContainerStats(obj!);
      expect(stats.tweens).toBe(1);
    });

    it('应该能通过标签停止 Tween', () => {
      const config = { x: 100, y: 100 };
      const obj = pool.acquireWithConfig(config);

      pool.addManagedTween(obj!, {
        targets: obj!,
        alpha: 0,
        duration: 1000,
      }, { tag: 'fade' });

      pool.stopTweensByTag(obj!, 'fade');

      const stats = pool.getContainerStats(obj!);
      expect(stats.tweens).toBe(0);
    });

    it('释放时应该自动清理 Tween', () => {
      const config = { x: 100, y: 100 };
      const obj = pool.acquireWithConfig(config);

      pool.addManagedTween(obj!, {
        targets: obj!,
        alpha: 0,
        duration: 1000,
      });

      pool.release(obj!);

      expect(mockSceneData.scene.tweens.killTweensOf).toHaveBeenCalled();
    });
  });

  describe('粒子发射器管理', () => {
    it('应该能添加托管粒子发射器', () => {
      const config = { x: 100, y: 100 };
      const obj = pool.acquireWithConfig(config);

      const emitter = (mockSceneData.scene.add as any).particles(0, 0, 'particle', {});
      pool.addManagedParticle(obj!, emitter);

      const stats = pool.getContainerStats(obj!);
      expect(stats.particles).toBe(1);
    });

    it('应该能创建托管粒子发射器', () => {
      const config = { x: 100, y: 100 };
      const obj = pool.acquireWithConfig(config);

      const emitter = pool.createManagedParticle(
        obj!,
        0, 0,
        'particle',
        { speed: { min: 10, max: 50 } }
      );

      expect(emitter).toBeDefined();
      expect((mockSceneData.scene.add as any).particles).toHaveBeenCalled();

      const stats = pool.getContainerStats(obj!);
      expect(stats.particles).toBe(1);
    });

    it('应该能通过标签停止粒子', () => {
      const config = { x: 100, y: 100 };
      const obj = pool.acquireWithConfig(config);

      const emitter = (mockSceneData.scene.add as any).particles(0, 0, 'particle', {});
      pool.addManagedParticle(obj!, emitter, { tag: 'fire' });

      pool.stopParticlesByTag(obj!, 'fire');

      expect(emitter.stop).toHaveBeenCalled();
    });
  });

  describe('定时器管理', () => {
    it('应该能添加托管定时器', () => {
      const config = { x: 100, y: 100 };
      const obj = pool.acquireWithConfig(config);

      const timer = (mockSceneData.scene as any).time.delayedCall(1000, () => {});
      pool.addManagedTimer(obj!, timer);

      const stats = pool.getContainerStats(obj!);
      expect(stats.timers).toBe(1);
    });

    it('应该能创建延迟调用', () => {
      const config = { x: 100, y: 100 };
      const obj = pool.acquireWithConfig(config);

      const timer = pool.createDelayedCall(obj!, 1000, () => {}, { tag: 'auto_release' });

      expect(timer).toBeDefined();
      expect(mockSceneData.scene.time.delayedCall).toHaveBeenCalled();

      const stats = pool.getContainerStats(obj!);
      expect(stats.timers).toBe(1);
    });

    it('应该能暂停和恢复定时器', () => {
      const config = { x: 100, y: 100 };
      const obj = pool.acquireWithConfig(config);

      const timer = pool.createLoopTimer(obj!, 100, () => {}, { tag: 'loop' });

      pool.pauseTimersByTag(obj!, 'loop');
      expect(timer!.paused).toBe(true);

      pool.resumeTimersByTag(obj!, 'loop');
      expect(timer!.paused).toBe(false);
    });
  });

  describe('多层子对象管理', () => {
    it('应该能添加托管子对象', () => {
      const config = { x: 100, y: 100 };
      const obj = pool.acquireWithConfig(config);

      const child = (mockSceneData.scene.add as any).circle(0, 0, 10, 0xff0000, 1);
      pool.addManagedChild(obj!, child, { layer: 1 });

      const stats = pool.getContainerStats(obj!);
      expect(stats.children).toBe(1);
    });

    it('应该能按层级获取子对象', () => {
      const config = { x: 100, y: 100 };
      const obj = pool.acquireWithConfig(config);

      const child1 = (mockSceneData.scene.add as any).circle(0, 0, 10, 0xff0000, 1);
      const child2 = (mockSceneData.scene.add as any).circle(0, 0, 15, 0x00ff00, 1);

      pool.addManagedChild(obj!, child1, { layer: 0 });
      pool.addManagedChild(obj!, child2, { layer: 1 });

      const layer0Children = pool.getChildrenByLayer(obj!, 0);
      expect(layer0Children.length).toBe(1);
      expect(layer0Children[0]).toBe(child1);

      const layer1Children = pool.getChildrenByLayer(obj!, 1);
      expect(layer1Children.length).toBe(1);
      expect(layer1Children[0]).toBe(child2);
    });

    it('应该能清除特定层的子对象', () => {
      const config = { x: 100, y: 100 };
      const obj = pool.acquireWithConfig(config);

      const child1 = (mockSceneData.scene.add as any).circle(0, 0, 10, 0xff0000, 1);
      const child2 = (mockSceneData.scene.add as any).circle(0, 0, 15, 0x00ff00, 1);

      pool.addManagedChild(obj!, child1, { layer: 0 });
      pool.addManagedChild(obj!, child2, { layer: 1 });

      pool.clearLayer(obj!, 1);

      expect(child2.destroy).toHaveBeenCalled();

      const stats = pool.getContainerStats(obj!);
      expect(stats.children).toBe(1);
    });

    it('应该能按类型获取子对象', () => {
      const config = { x: 100, y: 100 };
      const obj = pool.acquireWithConfig(config);

      const circle = (mockSceneData.scene.add as any).circle(0, 0, 10, 0xff0000, 1);
      const graphics = (mockSceneData.scene.add as any).graphics();

      pool.addManagedChild(obj!, circle, { layer: 0 });
      pool.addManagedChild(obj!, graphics, { layer: 0 });

      const arcChildren = pool.getChildrenByType(obj!, 'arc');
      expect(arcChildren.length).toBe(1);
      expect(arcChildren[0]).toBe(circle);

      const graphicsChildren = pool.getChildrenByType(obj!, 'graphics');
      expect(graphicsChildren.length).toBe(1);
      expect(graphicsChildren[0]).toBe(graphics);
    });
  });

  describe('便捷方法', () => {
    it('setEffectDuration 应该设置自动释放定时器', () => {
      const config = { x: 100, y: 100 };
      const obj = pool.acquireWithConfig(config);

      const timer = pool.setEffectDuration(obj!, 2000);

      expect(timer).toBeDefined();
      expect(mockSceneData.scene.time.delayedCall).toHaveBeenCalled();

      const stats = pool.getContainerStats(obj!);
      expect(stats.timers).toBe(1);
    });

    it('createEffect 应该正确创建完整效果', () => {
      const config = { x: 100, y: 100, duration: 1000 };

      const obj = pool.createEffect(config, (container: any, poolRef: any) => {
        // 添加子对象
        const child = (mockSceneData.scene.add as any).circle(0, 0, 20, 0xff0000, 0.8);
        poolRef.addManagedChild(container, child);

        // 创建 tween（但不手动添加到托管，让 createEffect 自动处理）
        const tween = (mockSceneData.scene as any).tweens.add({
          targets: child,
          scale: 1.5,
          duration: 500,
        });

        return {
          duration: 1000,
          tweens: [tween],  // 返回给 createEffect 自动托管
        };
      });

      expect(obj).toBeDefined();

      const stats = pool.getContainerStats(obj!);
      expect(stats.children).toBe(1);
      expect(stats.tweens).toBe(1);
      expect(stats.timers).toBe(1); // 自动释放定时器
    });
  });

  describe('统计功能', () => {
    it('getTotalManagedStats 应该返回正确的统计', () => {
      const config1 = { x: 100, y: 100 };
      const config2 = { x: 200, y: 200 };

      const obj1 = pool.acquireWithConfig(config1);
      const obj2 = pool.acquireWithConfig(config2);

      // obj1: 2 tweens, 1 particle, 1 timer, 3 children
      pool.addManagedTween(obj1!, { targets: obj1!, alpha: 0, duration: 500 });
      pool.addManagedTween(obj1!, { targets: obj1!, scale: 1.5, duration: 500 });
      const emitter1 = (mockSceneData.scene.add as any).particles(0, 0, 'p', {});
      pool.addManagedParticle(obj1!, emitter1);
      pool.createDelayedCall(obj1!, 1000, () => {});
      pool.addManagedChild(obj1!, (mockSceneData.scene.add as any).circle(0, 0, 10, 0xff, 1));
      pool.addManagedChild(obj1!, (mockSceneData.scene.add as any).circle(0, 0, 15, 0xff, 1));
      pool.addManagedChild(obj1!, (mockSceneData.scene.add as any).circle(0, 0, 20, 0xff, 1));

      // obj2: 1 tween, 0 particles, 2 timers, 1 child
      pool.addManagedTween(obj2!, { targets: obj2!, alpha: 0, duration: 500 });
      pool.createDelayedCall(obj2!, 500, () => {});
      pool.createLoopTimer(obj2!, 100, () => {});
      pool.addManagedChild(obj2!, (mockSceneData.scene.add as any).circle(0, 0, 10, 0xff, 1));

      const stats = pool.getTotalManagedStats();

      expect(stats.containers).toBe(2);
      expect(stats.tweens).toBe(3);
      expect(stats.particles).toBe(1);
      expect(stats.timers).toBe(3);
      expect(stats.children).toBe(4);
    });
  });

  describe('扩展选项', () => {
    it('应该支持禁用自动清理', () => {
      const customPool = new VisualEffectPool(
        mockSceneData.scene,
        () => (mockSceneData.scene.add as any).container(0, 0),
        (obj: any, config: any) => {
          obj.setPosition(config.x, config.y);
          obj.setActive(true);
          obj.setVisible(true);
        },
        {
          initialSize: 1,
          autoCleanupTweens: false,
          autoCleanupParticles: false,
          autoCleanupTimers: false,
          autoCleanupChildren: false,
        }
      );

      const config = { x: 100, y: 100 };
      const obj = customPool.acquireWithConfig(config);

      customPool.addManagedTween(obj!, { targets: obj!, alpha: 0, duration: 500 });
      customPool.addManagedParticle(obj!, (mockSceneData.scene.add as any).particles(0, 0, 'p', {}));
      customPool.addManagedTimer(obj!, (mockSceneData.scene as any).time.delayedCall(1000, () => {}));
      customPool.addManagedChild(obj!, (mockSceneData.scene.add as any).circle(0, 0, 10, 0xff, 1));

      customPool.release(obj!);

      // 由于禁用了自动清理，对象应该被停用
      expect(obj!.active).toBe(false);
    });
  });
});