import Phaser from 'phaser';

// 基准游戏尺寸（用于计算比例）
export const BASE_WIDTH = 1280;
export const BASE_HEIGHT = 720;

// 实际游戏尺寸（会根据屏幕动态调整）
export let GAME_WIDTH = BASE_WIDTH;
export let GAME_HEIGHT = BASE_HEIGHT;

// Infinite world configuration (Vampire Survivors-like)
export const CHUNK_SIZE = 256;           // 区块大小
export const ACTIVE_CHUNK_RADIUS = 1;    // 活动区块半径（3x3）
export const WORLD_SEED = 12345;         // 固定种子（可随机）

// 更新游戏尺寸
export function updateGameSize(width: number, height: number): void {
  GAME_WIDTH = width;
  GAME_HEIGHT = height;
}

export const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: BASE_WIDTH,
  height: BASE_HEIGHT,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.RESIZE, // 使用 RESIZE 模式，铺满屏幕
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [], // 将在main.ts中动态添加
};
