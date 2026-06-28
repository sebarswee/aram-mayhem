import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThunderApocalypseEffectPool, ThunderApocalypseEffectConfig } from '@/pools/effects/ThunderApocalypseEffectPool';
import Phaser from 'phaser';

// 简化的 Mock 对象工厂
function createMockContainer() {
  const children: any[] = [];
  return {
    x: 0,
    y: 0,
    active: true,
    visible: true,
    get list() { return children; }, // 使用 getter 确保返回正确的数组
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
    lineBetween: vi.fn(),
    setAngle: vi.fn(function(this: any, a: number) { this.angle = a; return this; }),
    setAlpha: vi.fn(function(this: any, a: number) { this.alpha = a; return this; }),
    setPosition: vi.fn(function(this: any) { return this; }),
    setName: vi.fn(function(this: any, n: string) { this.name = n; return this; }),
  } as unknown as Phaser.GameObjects.Graphics;
}

function createMockScene() {
  const tweens: any[] = [];
  const timers: any[] = [];
  let containerCounter = 0;
  let circleCounter = 0;
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
        // 立即执行 onComplete（用于测试淡出动画）
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

describe('ThunderApocalypseEffectPool', () => {
  let mockSceneData: ReturnType<typeof createMockScene>;
  let pool: ThunderApocalypseEffectPool;

  beforeEach(() => {
    mockSceneData = createMockScene();
    const { scene } = mockSceneData;

    pool = new ThunderApocalypseEffectPool(scene, 2);
  });

  describe('基础功能', () => {
    it('应该正确初始化', () => {
      expect(pool).toBeDefined();
      expect(pool.getPooledCount()).toBe(2);
      expect(pool.getActiveCount()).toBe(0);
    });

    it('应该能获取和释放对象', () => {
      const config: ThunderApocalypseEffectConfig = {
        x: 100,
        y: 100,
        rangeValue: 300,
        strikeCount: 5,
        strikeInterval: 200,
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

  describe('云层管理', () => {
    it('应该正确创建和配置云层', () => {
      const { scene } = mockSceneData;
      const config: ThunderApocalypseEffectConfig = {
        x: 100,
        y: 100,
        rangeValue: 300,
        strikeCount: 5,
        strikeInterval: 200,
      };

      const obj = pool.acquireWithConfig(config);
      expect(obj).toBeDefined();

      // 验证 scene.add.circle 被调用了 3 次（创建 3 层云层）
      // 注意：由于池预热，调用次数会更多
      // 这里只验证获取对象后容器状态正确
      expect(obj!.active).toBe(true);
      expect(obj!.visible).toBe(true);
      expect(obj!.x).toBe(100);
      expect(obj!.y).toBe(100);
    });

    it('释放后云层状态应该被重置', () => {
      const config: ThunderApocalypseEffectConfig = {
        x: 100,
        y: 100,
        rangeValue: 300,
        strikeCount: 5,
        strikeInterval: 200,
      };

      const obj = pool.acquireWithConfig(config);
      expect(obj!.active).toBe(true);

      pool.release(obj!);

      // 云层应该被正确停用
      expect(obj!.active).toBe(false);
      expect(obj!.visible).toBe(false);
    });
  });

  describe('定时器管理', () => {
    it('应该创建雷击定时器', () => {
      const { timers } = mockSceneData;
      const config: ThunderApocalypseEffectConfig = {
        x: 100,
        y: 100,
        rangeValue: 300,
        strikeCount: 5,
        strikeInterval: 200,
      };

      pool.acquireWithConfig(config);

      // 应该有 strike_timer 和 backup_cleanup 两个定时器
      expect(timers.length).toBeGreaterThanOrEqual(2);
    });

    it('应该创建备用清理定时器', () => {
      const { timers } = mockSceneData;
      const config: ThunderApocalypseEffectConfig = {
        x: 100,
        y: 100,
        rangeValue: 300,
        strikeCount: 5,
        strikeInterval: 200,
      };

      pool.acquireWithConfig(config);

      // 应该有备用清理定时器（delayedCall）
      const delayedCalls = timers.filter(t => t.callback !== undefined);
      expect(delayedCalls.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('释放时清理', () => {
    it('release 应该正确停用对象', () => {
      const config: ThunderApocalypseEffectConfig = {
        x: 100,
        y: 100,
        rangeValue: 300,
        strikeCount: 5,
        strikeInterval: 200,
      };

      const obj = pool.acquireWithConfig(config);
      expect(obj!.active).toBe(true);

      pool.release(obj!);
      expect(obj!.active).toBe(false);
    });

    it('release 应该清理所有定时器', () => {
      const { timers } = mockSceneData;
      const config: ThunderApocalypseEffectConfig = {
        x: 100,
        y: 100,
        rangeValue: 300,
        strikeCount: 5,
        strikeInterval: 200,
      };

      const obj = pool.acquireWithConfig(config);
      pool.release(obj!);

      // 所有定时器应该被销毁
      timers.forEach(timer => {
        expect(timer.destroy).toHaveBeenCalled();
      });
    });
  });

  describe('自定义配置', () => {
    it('应该支持自定义云层配置', () => {
      const config: ThunderApocalypseEffectConfig = {
        x: 100,
        y: 100,
        rangeValue: 300,
        strikeCount: 5,
        strikeInterval: 200,
        cloudConfigs: [
          { radiusMultiplier: 0.5, color: 0x222244, alpha: 0.3, yOffset: -100 },
          { radiusMultiplier: 0.7, color: 0x333355, alpha: 0.2, yOffset: -100 },
          { radiusMultiplier: 0.9, color: 0x444466, alpha: 0.1, yOffset: -100 },
        ],
      };

      const obj = pool.acquireWithConfig(config);
      expect(obj).toBeDefined();
    });

    it('应该支持雷击回调', () => {
      const onStrikeCallback = vi.fn();
      const config: ThunderApocalypseEffectConfig = {
        x: 100,
        y: 100,
        rangeValue: 300,
        strikeCount: 5,
        strikeInterval: 200,
        onStrike: onStrikeCallback,
      };

      const obj = pool.acquireWithConfig(config);
      expect(obj).toBeDefined();
      // 注意：在实际游戏中，雷击回调会被定时器触发
      // 这里只验证配置被接受
    });

    it('应该支持伤害和效果配置', () => {
      const mockSkill = {
        effects: [{ type: 'stun', value: 100 }]
      };

      const config: ThunderApocalypseEffectConfig = {
        x: 100,
        y: 100,
        rangeValue: 300,
        strikeCount: 5,
        strikeInterval: 200,
        skill: mockSkill,
        damage: 50,
        findEnemiesInRange: vi.fn(() => []),
        applyDamageToEnemy: vi.fn(),
        applyEffects: vi.fn(),
      };

      const obj = pool.acquireWithConfig(config);
      expect(obj).toBeDefined();
    });
  });

  describe('统计功能', () => {
    it('getStats 应该返回正确的统计', () => {
      const config: ThunderApocalypseEffectConfig = {
        x: 100,
        y: 100,
        rangeValue: 300,
        strikeCount: 5,
        strikeInterval: 200,
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
      const config: ThunderApocalypseEffectConfig = {
        x: 100,
        y: 100,
        rangeValue: 300,
        strikeCount: 5,
        strikeInterval: 200,
      };

      pool.acquireWithConfig(config);
      pool.acquireWithConfig(config);

      expect(pool.getActiveCount()).toBe(2);

      pool.clear();

      expect(pool.getActiveCount()).toBe(0);
      expect(pool.getPooledCount()).toBe(0);
    });

    it('releaseAll 应该释放所有活跃效果', () => {
      const config: ThunderApocalypseEffectConfig = {
        x: 100,
        y: 100,
        rangeValue: 300,
        strikeCount: 5,
        strikeInterval: 200,
      };

      pool.acquireWithConfig(config);
      pool.acquireWithConfig(config);

      expect(pool.getActiveCount()).toBe(2);

      pool.releaseAll();

      expect(pool.getActiveCount()).toBe(0);
    });
  });

  describe('云层残留问题验证', () => {
    it('备用清理定时器应该存在', () => {
      const { timers } = mockSceneData;
      const config: ThunderApocalypseEffectConfig = {
        x: 100,
        y: 100,
        rangeValue: 300,
        strikeCount: 5,
        strikeInterval: 200,
      };

      pool.acquireWithConfig(config);

      // 计算总时长：strikeCount + 1 次 * strikeInterval + 500ms
      const expectedDuration = (5 + 1) * 200 + 500; // 1700ms

      // 验证备用清理定时器存在
      const backupTimers = timers.filter(t => t.delay === expectedDuration);
      expect(backupTimers.length).toBe(1);
    });

    it('多次释放应该不会出错', () => {
      const config: ThunderApocalypseEffectConfig = {
        x: 100,
        y: 100,
        rangeValue: 300,
        strikeCount: 5,
        strikeInterval: 200,
      };

      const obj = pool.acquireWithConfig(config);

      // 多次释放应该安全
      pool.release(obj!);
      pool.release(obj!); // 第二次释放应该被忽略或安全处理

      expect(pool.getActiveCount()).toBe(0);
    });
  });
});