// src/test/setup.ts
// Mock Phaser for testing
import { vi } from 'vitest';

// Mock Phaser modules
vi.mock('phaser', () => {
  const mockSprite = {
    setTint: vi.fn(),
    clearTint: vi.fn(),
    setVelocity: vi.fn(),
    setFlipX: vi.fn(),
    setActive: vi.fn(),
    setVisible: vi.fn(),
    setScale: vi.fn(),
    setDepth: vi.fn(),
    setCollideWorldBounds: vi.fn(),
    setDrag: vi.fn(),
    setBounce: vi.fn(),
    play: vi.fn(),
    once: vi.fn(),
    on: vi.fn(),
    emit: vi.fn(),
    destroy: vi.fn(),
    scene: {
      add: { particles: vi.fn(() => ({ setDepth: vi.fn(), destroy: vi.fn() })) },
      physics: { add: { existing: vi.fn() } },
      tweens: { add: vi.fn() },
      time: { delayedCall: vi.fn() },
      anims: { exists: vi.fn(() => false) },
      textures: { exists: vi.fn(() => false) },
      events: { emit: vi.fn() },
      cameras: { main: { shake: vi.fn() } },
    },
    body: { setSize: vi.fn(), velocity: { x: 0, y: 0 } },
    x: 0,
    y: 0,
    active: true,
    visible: true,
    scaleX: 1,
    scaleY: 1,
    tintTopLeft: 0xffffff,
  };

  return {
    default: {
      Physics: {
        Arcade: {
          Sprite: class MockSprite {
            constructor() {
              return mockSprite;
            }
          },
        },
      },
      GameObjects: {
        Sprite: class MockSprite {
          constructor() {
            return mockSprite;
          }
        },
        Particles: {
          ParticleEmitter: class MockEmitter {
            destroy = vi.fn();
          },
        },
      },
    },
    Physics: {
      Arcade: {
        Sprite: class MockSprite {
          constructor() {
            return mockSprite;
          }
        },
      },
    },
    GameObjects: {
      Sprite: class MockSprite {
        constructor() {
          return mockSprite;
        }
      },
      Particles: {
        ParticleEmitter: class MockEmitter {
          destroy = vi.fn();
        },
      },
    },
    Math: {
      Angle: {
        Between: vi.fn(() => 0),
      },
    },
  };
});