import Phaser from 'phaser';
import { Chunk, ChunkConfig } from './Chunk';

export interface ChunkManagerConfig {
  chunkSize?: number;        // 区块大小，默认 256
  activeRadius?: number;     // 活动区块半径，默认 1（3x3）
  seed?: number;             // 种子，默认随机
}

export class ChunkManager {
  private chunks: Map<string, Chunk> = new Map();
  private readonly chunkSize: number;
  private readonly activeRadius: number;
  private readonly seed: number;
  private readonly scene: Phaser.Scene;

  // 性能统计
  private totalChunksLoaded: number = 0;
  private totalChunksUnloaded: number = 0;

  constructor(
    scene: Phaser.Scene,
    config: ChunkManagerConfig = {}
  ) {
    this.scene = scene;
    this.chunkSize = config.chunkSize || 256;
    this.activeRadius = config.activeRadius || 1;
    this.seed = config.seed || Date.now();
  }

  /**
   * 更新区块（每帧调用，基于玩家位置）
   */
  update(playerX: number, playerY: number): void {
    // 计算玩家所在的区块坐标
    const playerChunkX = Math.floor(playerX / this.chunkSize);
    const playerChunkY = Math.floor(playerY / this.chunkSize);

    // 确定活动区块范围
    const minX = playerChunkX - this.activeRadius;
    const maxX = playerChunkX + this.activeRadius;
    const minY = playerChunkY - this.activeRadius;
    const maxY = playerChunkY + this.activeRadius;

    // 1. 加载新区块
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const key = this.getChunkKey(x, y);

        if (!this.chunks.has(key)) {
          this.loadChunk(x, y);
        }
      }
    }

    // 2. 卸载远离的区块
    const keysToRemove: string[] = [];

    this.chunks.forEach((chunk, key) => {
      // 超出活动范围 + 缓冲距离的区块需要卸载
      if (
        chunk.x < minX - 1 ||
        chunk.x > maxX + 1 ||
        chunk.y < minY - 1 ||
        chunk.y > maxY + 1
      ) {
        keysToRemove.push(key);
      }
    });

    // 批量卸载
    keysToRemove.forEach(key => {
      this.unloadChunk(key);
    });
  }

  /**
   * 加载区块
   */
  private loadChunk(x: number, y: number): void {
    const config: ChunkConfig = {
      x,
      y,
      size: this.chunkSize,
      seed: this.seed
    };

    const chunk = new Chunk(this.scene, config);
    chunk.load();

    const key = this.getChunkKey(x, y);
    this.chunks.set(key, chunk);

    this.totalChunksLoaded++;

    console.log(`[ChunkManager] Loaded chunk (${x}, ${y}). Total active: ${this.chunks.size}`);
  }

  /**
   * 卸载区块
   */
  private unloadChunk(key: string): void {
    const chunk = this.chunks.get(key);
    if (chunk) {
      chunk.unload();
      this.chunks.delete(key);
      this.totalChunksUnloaded++;

      console.log(`[ChunkManager] Unloaded chunk (${chunk.x}, ${chunk.y}). Total active: ${this.chunks.size}`);
    }
  }

  /**
   * 获取区块键值
   */
  private getChunkKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  /**
   * 获取活动区块数量
   */
  getActiveChunkCount(): number {
    return this.chunks.size;
  }

  /**
   * 获取性能统计
   */
  getStats(): { loaded: number; unloaded: number; active: number } {
    return {
      loaded: this.totalChunksLoaded,
      unloaded: this.totalChunksUnloaded,
      active: this.chunks.size
    };
  }

  /**
   * 清理所有区块
   */
  cleanup(): void {
    console.log('[ChunkManager] Cleaning up all chunks...');

    this.chunks.forEach(chunk => {
      chunk.unload();
    });

    this.chunks.clear();
  }

  /**
   * 获取指定位置的区块（如果已加载）
   */
  getChunkAt(worldX: number, worldY: number): Chunk | null {
    const chunkX = Math.floor(worldX / this.chunkSize);
    const chunkY = Math.floor(worldY / this.chunkSize);
    const key = this.getChunkKey(chunkX, chunkY);

    return this.chunks.get(key) || null;
  }

  /**
   * 获取区块大小
   */
  getChunkSize(): number {
    return this.chunkSize;
  }

  /**
   * 获取种子
   */
  getSeed(): number {
    return this.seed;
  }
}
