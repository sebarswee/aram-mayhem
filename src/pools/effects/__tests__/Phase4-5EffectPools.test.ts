import { describe, it, expect, beforeEach, vi } from 'vitest';
import Phaser from 'phaser';

// 投射物效果池
import { ProjectileTrailPool } from '../projectile/ProjectileTrailPool';
import { FireballEffectPool } from '../projectile/FireballEffectPool';
import { IceSpearEffectPool } from '../projectile/IceSpearEffectPool';
import { LightningBoltEffectPool } from '../projectile/LightningBoltEffectPool';
import { WaterBulletEffectPool } from '../projectile/WaterBulletEffectPool';
import { ShadowBallEffectPool } from '../projectile/ShadowBallEffectPool';

// 增益效果池
import { ShieldEffectPool } from '../buff/ShieldEffectPool';
import { StoneSkinEffectPool } from '../buff/StoneSkinEffectPool';
import { BlessingEffectPool } from '../buff/BlessingEffectPool';
import { RegenerationEffectPool } from '../buff/RegenerationEffectPool';

// Mock 工厂函数
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
    each: vi.fn(function(this: any, callback: (child: any) => void) {
      this.list.forEach(callback);
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
          setStrokeStyle: vi.fn(function(this: any) { return this; }),
          destroy: vi.fn(function(this: any) { this.active = false; }),
        } as unknown as Phaser.GameObjects.Arc;
      }),
      graphics: vi.fn(() => {
        return {
          active: true,
          name: '',
          destroy: vi.fn(function(this: any) { this.active = false; }),
          clear: vi.fn(),
          lineStyle: vi.fn(),
          strokeCircle: vi.fn(),
          fillCircle: vi.fn(),
          lineBetween: vi.fn(),
          fillStyle: vi.fn(),
          fillTriangle: vi.fn(),
          fillRect: vi.fn(),
          fillEllipse: vi.fn(),
          fillRoundedRect: vi.fn(),
          setName: vi.fn(function(this: any, n: string) { this.name = n; return this; }),
        } as unknown as Phaser.GameObjects.Graphics;
      }),
      particles: vi.fn((x: number, y: number, texture: string, config: any) => {
        const emitter = {
          x,
          y,
          active: true,
          stop: vi.fn(),
          destroy: vi.fn(),
          explode: vi.fn(),
          start: vi.fn(),
        };
        particles.push(emitter);
        return emitter;
      }),
    },
  } as any;

  return scene;
}

describe('Projectile Effect Pools', () => {
  let mockScene: any;

  beforeEach(() => {
    mockScene = createMockScene();
  });

  describe('ProjectileTrailPool', () => {
    it('should create pool with correct initial size', () => {
      const pool = new ProjectileTrailPool(mockScene, 5);
      const stats = pool.getStats();
      expect(stats.total).toBe(5);
      expect(stats.pooled).toBe(5);
    });

    it('should acquire and configure trail effect', () => {
      const pool = new ProjectileTrailPool(mockScene, 2);
      const container = pool.acquireWithConfig({
        x: 100,
        y: 200,
        colors: [0xff4400, 0xff6600],
        duration: 3000,
      });

      expect(container).not.toBeNull();
      expect(mockScene.add.particles).toHaveBeenCalled();
    });

    it('should acquire fire trail with preset config', () => {
      const pool = new ProjectileTrailPool(mockScene, 2);
      const container = pool.acquireFireTrail(100, 200);

      expect(container).not.toBeNull();
    });
  });

  describe('FireballEffectPool', () => {
    it('should create pool with correct initial size', () => {
      const pool = new FireballEffectPool(mockScene, 3);
      const stats = pool.getStats();
      expect(stats.total).toBe(3);
    });

    it('should acquire and configure fireball effect', () => {
      const pool = new FireballEffectPool(mockScene, 2);
      const container = pool.acquireWithConfig({
        x: 100,
        y: 200,
        angle: Math.PI / 4,
        duration: 2000,
      });

      expect(container).not.toBeNull();
      expect(mockScene.add.particles).toHaveBeenCalled();
      expect(mockScene.tweens.add).toHaveBeenCalled();
    });

    it('should create all required visual elements', () => {
      const pool = new FireballEffectPool(mockScene, 1);
      const container = pool.acquireWithConfig({
        x: 0,
        y: 0,
        angle: 0,
      });

      expect(container).not.toBeNull();
      // 验证所有元素都被创建
      expect(mockScene.add.circle).toHaveBeenCalled();
      expect(mockScene.add.graphics).toHaveBeenCalled();
    });
  });

  describe('IceSpearEffectPool', () => {
    it('should create pool and acquire effect', () => {
      const pool = new IceSpearEffectPool(mockScene, 3);
      const container = pool.acquireWithConfig({
        x: 100,
        y: 200,
        angle: 0,
      });

      expect(container).not.toBeNull();
      expect(mockScene.add.particles).toHaveBeenCalled();
    });
  });

  describe('LightningBoltEffectPool', () => {
    it('should create pool and acquire effect', () => {
      const pool = new LightningBoltEffectPool(mockScene, 3);
      const container = pool.acquireWithConfig({
        x: 100,
        y: 200,
        angle: Math.PI / 2,
      });

      expect(container).not.toBeNull();
      expect(mockScene.add.particles).toHaveBeenCalled();
    });
  });

  describe('WaterBulletEffectPool', () => {
    it('should create pool and acquire effect', () => {
      const pool = new WaterBulletEffectPool(mockScene, 3);
      const container = pool.acquireWithConfig({
        x: 100,
        y: 200,
        angle: 0,
      });

      expect(container).not.toBeNull();
    });
  });

  describe('ShadowBallEffectPool', () => {
    it('should create pool and acquire effect', () => {
      const pool = new ShadowBallEffectPool(mockScene, 3);
      const container = pool.acquireWithConfig({
        x: 100,
        y: 200,
        angle: 0,
      });

      expect(container).not.toBeNull();
    });
  });
});

describe('Buff Effect Pools', () => {
  let mockScene: any;

  beforeEach(() => {
    mockScene = createMockScene();
  });

  describe('ShieldEffectPool', () => {
    it('should create pool with correct initial size', () => {
      const pool = new ShieldEffectPool(mockScene, 3);
      const stats = pool.getStats();
      expect(stats.total).toBe(3);
    });

    it('should acquire and configure shield effect', () => {
      const pool = new ShieldEffectPool(mockScene, 2);
      const container = pool.acquireWithConfig({
        x: 100,
        y: 200,
        radius: 40,
        duration: 5000,
      });

      expect(container).not.toBeNull();
      expect(mockScene.add.circle).toHaveBeenCalled();
    });

    it('should support infinite duration shields', () => {
      const pool = new ShieldEffectPool(mockScene, 1);
      const container = pool.acquireWithConfig({
        x: 0,
        y: 0,
        duration: -1, // 无限持续
      });

      expect(container).not.toBeNull();
      // 不应该创建自动回收定时器
      expect(mockScene.time.delayedCall).not.toHaveBeenCalled();
    });
  });

  describe('StoneSkinEffectPool', () => {
    it('should create pool and acquire effect', () => {
      const pool = new StoneSkinEffectPool(mockScene, 3);
      const container = pool.acquireWithConfig({
        x: 100,
        y: 200,
        rockCount: 6,
      });

      expect(container).not.toBeNull();
      expect(mockScene.add.graphics).toHaveBeenCalled();
    });
  });

  describe('BlessingEffectPool', () => {
    it('should create pool and acquire effect', () => {
      const pool = new BlessingEffectPool(mockScene, 3);
      const container = pool.acquireWithConfig({
        x: 100,
        y: 200,
      });

      expect(container).not.toBeNull();
      expect(mockScene.add.circle).toHaveBeenCalled();
    });
  });

  describe('RegenerationEffectPool', () => {
    it('should create pool and acquire effect', () => {
      const pool = new RegenerationEffectPool(mockScene, 3);
      const container = pool.acquireWithConfig({
        x: 100,
        y: 200,
        duration: 8000,
      });

      expect(container).not.toBeNull();
      expect(mockScene.add.particles).toHaveBeenCalled();
    });
  });
});

describe('Pool Lifecycle Management', () => {
  let mockScene: any;

  beforeEach(() => {
    mockScene = createMockScene();
  });

  it('should properly release and reuse objects', () => {
    const pool = new FireballEffectPool(mockScene, 1);

    // 获取对象
    const container1 = pool.acquireWithConfig({
      x: 100,
      y: 200,
      angle: 0,
    });
    expect(container1).not.toBeNull();

    const stats1 = pool.getStats();
    expect(stats1.active).toBe(1);
    expect(stats1.pooled).toBe(0);

    // 释放对象
    if (container1) {
      pool.release(container1);
    }

    const stats2 = pool.getStats();
    expect(stats2.active).toBe(0);
    expect(stats2.pooled).toBe(1);
  });

  it('should handle multiple acquire/release cycles', () => {
    const pool = new WaterBulletEffectPool(mockScene, 3);

    // 获取多个对象
    const containers = [];
    for (let i = 0; i < 3; i++) {
      containers.push(pool.acquireWithConfig({
        x: i * 100,
        y: i * 100,
        angle: 0,
      }));
    }

    const stats = pool.getStats();
    expect(stats.active).toBe(3);

    // 释放所有对象
    containers.forEach(c => {
      if (c) pool.release(c);
    });

    const statsAfter = pool.getStats();
    expect(statsAfter.active).toBe(0);
    expect(statsAfter.pooled).toBe(3);
  });

  it('should clear all pooled objects', () => {
    const pool = new ShadowBallEffectPool(mockScene, 5);
    pool.clear();

    const stats = pool.getStats();
    expect(stats.total).toBe(0);
    expect(stats.active).toBe(0);
    expect(stats.pooled).toBe(0);
  });
});
