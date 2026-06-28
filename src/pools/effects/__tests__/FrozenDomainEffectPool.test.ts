import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FrozenDomainEffectPool, FrozenDomainEffectConfig } from '@/pools/effects/FrozenDomainEffectPool';
import Phaser from 'phaser';

// 简化的 Mock 对象工厂
function createMockContainer() {
  const children: any[] = [];
  return {
    x: 0,
    y: 0,
    active: true,
    visible: true,
    list: children,
    depth: 0,
    angle: 0,
    scale: 1,
    scaleX: 1,
    scaleY: 1,
    alpha: 1,
    name: '',
    setName: vi.fn(function(this: any, name: string) { (this as any).name = name; return this; }),
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

function createMockCircle(name: string) {
  return {
    x: 0,
    y: 0,
    radius: 100,
    active: true,
    name,
    depth: 0,
    scale: 1,
    scaleX: 1,
    scaleY: 1,
    alpha: 1,
    setRadius: vi.fn(function(this: any, r: number) { this.radius = r; return this; }),
    setFillStyle: vi.fn(function(this: any) { return this; }),
    setPosition: vi.fn(function(this: any, nx: number, ny: number) { this.x = nx; this.y = ny; return this; }),
    setScale: vi.fn(function(this: any, x: number, y?: number) { this.scaleX = x; this.scaleY = y ?? x; return this; }),
    setAlpha: vi.fn(function(this: any, a: number) { this.alpha = a; return this; }),
    setDepth: vi.fn(function(this: any, d: number) { this.depth = d; return this; }),
    setName: vi.fn(function(this: any, n: string) { this.name = n; return this; }),
    destroy: vi.fn(function(this: any) { this.active = false; }),
  } as unknown as Phaser.GameObjects.Arc;
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
    setAngle: vi.fn(function(this: any, a: number) { this.angle = a; return this; }),
    setAlpha: vi.fn(function(this: any, a: number) { this.alpha = a; return this; }),
    setPosition: vi.fn(function(this: any) { return this; }),
    setName: vi.fn(function(this: any, n: string) { this.name = n; return this; }),
  } as unknown as Phaser.GameObjects.Graphics;
}

function createMockParticleEmitter(name: string) {
  return {
    x: 0,
    y: 0,
    active: true,
    name,
    depth: 0,
    speed: { min: 0, max: 0 },
    lifespan: 0,
    frequency: 0,
    quantity: 0,
    tint: [],
    setName: vi.fn(function(this: any, n: string) { this.name = n; return this; }),
    setDepth: vi.fn(function(this: any, d: number) { this.depth = d; return this; }),
    setEmitZone: vi.fn(),
    setPosition: vi.fn(function(this: any, x: number, y: number) { this.x = x; this.y = y; return this; }),
    start: vi.fn(),
    stop: vi.fn(),
    explode: vi.fn(function(this: any, count?: number) {}),
    destroy: vi.fn(function(this: any) { this.active = false; }),
  } as unknown as Phaser.GameObjects.Particles.ParticleEmitter;
}

function createMockScene() {
  const tweens: any[] = [];
  const timers: any[] = [];
  const particles: any[] = [];
  let containerCounter = 0;
  let circleCounter = 0;
  let graphicsCounter = 0;
  let particleCounter = 0;

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
      circle: vi.fn((x: number, y: number, radius: number, color: number, alpha: number) => {
        const circle = createMockCircle(`circle_${circleCounter++}`);
        circle.x = x;
        circle.y = y;
        circle.radius = radius;
        return circle;
      }),
      graphics: vi.fn(() => {
        return createMockGraphics(`graphics_${graphicsCounter++}`);
      }),
      particles: vi.fn((x: number, y: number, texture: string, config: any) => {
        const emitter = createMockParticleEmitter(`particles_${particleCounter++}`);
        emitter.x = x;
        emitter.y = y;
        particles.push(emitter);
        return emitter;
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

describe('FrozenDomainEffectPool', () => {
  let mockSceneData: ReturnType<typeof createMockScene>;
  let pool: FrozenDomainEffectPool;

  beforeEach(() => {
    mockSceneData = createMockScene();
    const { scene } = mockSceneData;

    pool = new FrozenDomainEffectPool(scene, 2);
  });

  describe('基础功能', () => {
    it('应该正确初始化', () => {
      expect(pool).toBeDefined();
      expect(pool.getPooledCount()).toBe(2);
      expect(pool.getActiveCount()).toBe(0);
    });

    it('应该能获取和释放对象', () => {
      const config: FrozenDomainEffectConfig = {
        x: 100,
        y: 100,
        radius: 200,
        duration: 4000,
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

  describe('Tween 管理', () => {
    it('acquireWithConfig 应该返回有效的容器对象', () => {
      const config: FrozenDomainEffectConfig = {
        x: 100,
        y: 100,
        radius: 200,
        duration: 4000,
      };

      const obj = pool.acquireWithConfig(config);
      expect(obj).toBeDefined();
      expect(obj!.active).toBe(true);
    });
  });

  describe('释放时清理', () => {
    it('release 应该正确停用对象', () => {
      const config: FrozenDomainEffectConfig = {
        x: 100,
        y: 100,
        radius: 200,
        duration: 4000,
      };

      const obj = pool.acquireWithConfig(config);
      expect(obj!.active).toBe(true);

      pool.release(obj!);
      expect(obj!.active).toBe(false);
    });
  });

  describe('自定义配置', () => {
    it('应该支持自定义图层配置', () => {
      const config: FrozenDomainEffectConfig = {
        x: 100,
        y: 100,
        radius: 200,
        duration: 4000,
        layerConfigs: [
          { radius: 1.2, color: 0xff0000, alpha: 0.1 },
          { radius: 1.0, color: 0x00ff00, alpha: 0.2 },
          { radius: 0.8, color: 0x0000ff, alpha: 0.3 },
          { radius: 0.6, color: 0xffff00, alpha: 0.4 },
        ],
      };

      const obj = pool.acquireWithConfig(config);
      expect(obj).toBeDefined();
    });

    it('应该支持自定义冰环配置', () => {
      const config: FrozenDomainEffectConfig = {
        x: 100,
        y: 100,
        radius: 200,
        duration: 4000,
        ringConfigs: [
          { lineWidth: 3, color: 0xffffff, alpha: 0.8, radiusMultiplier: 0.3, rotationDuration: 1000, direction: 1 },
          { lineWidth: 2, color: 0xaaaaaa, alpha: 0.6, radiusMultiplier: 0.6, rotationDuration: 1500, direction: -1 },
          { lineWidth: 1, color: 0x666666, alpha: 0.4, radiusMultiplier: 0.9, rotationDuration: 2000, direction: 1 },
        ],
      };

      const obj = pool.acquireWithConfig(config);
      expect(obj).toBeDefined();
    });

    it('应该支持自定义粒子配置', () => {
      const config: FrozenDomainEffectConfig = {
        x: 100,
        y: 100,
        radius: 200,
        duration: 4000,
        particleConfig: {
          speedMin: 30,
          speedMax: 80,
          lifespan: 1500,
          frequency: 50,
          quantity: 3,
          colors: [0x0000ff, 0x00ffff],
        },
      };

      const obj = pool.acquireWithConfig(config);
      expect(obj).toBeDefined();
    });
  });

  describe('统计功能', () => {
    it('getStats 应该返回正确的统计', () => {
      const config: FrozenDomainEffectConfig = {
        x: 100,
        y: 100,
        radius: 200,
        duration: 4000,
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
      const config: FrozenDomainEffectConfig = {
        x: 100,
        y: 100,
        radius: 200,
        duration: 4000,
      };

      pool.acquireWithConfig(config);
      pool.acquireWithConfig(config);

      expect(pool.getActiveCount()).toBe(2);

      pool.clear();

      expect(pool.getActiveCount()).toBe(0);
      expect(pool.getPooledCount()).toBe(0);
    });
  });
});
