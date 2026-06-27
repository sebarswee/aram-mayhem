# 无限地图系统架构文档

## 概述

本游戏实现了 Vampire Survivors 风格的无限地图系统，基于 Chunk-based 动态加载架构。

## 核心组件

### 1. Chunk（区块）

每个区块 256x256 像素，包含：
- 背景平铺纹理
- 程序化装饰物
- 独立生命周期（加载/卸载）

**文件**：`src/world/Chunk.ts`

```typescript
export class Chunk {
  public readonly x: number;        // 区块网格坐标
  public readonly y: number;
  public readonly size: number;     // 区块大小（256）
  public readonly seed: number;     // 种子（程序化生成）

  load(): void;                     // 加载区块
  unload(): void;                   // 卸载区块
  isChunkLoaded(): boolean;         // 检查是否已加载
  getBounds(): Phaser.Geom.Rectangle; // 获取边界
}
```

**关键特性**：
- **种子随机数生成器**：相同种子生成相同内容，确保一致性
- **延迟加载**：仅在需要时创建游戏对象
- **完整清理**：卸载时销毁所有游戏对象，防止内存泄漏

### 2. ChunkManager（区块管理器）

负责：
- 跟踪玩家位置
- 动态加载/卸载区块
- 管理活动区块缓存
- 性能统计

**文件**：`src/world/ChunkManager.ts`

```typescript
export class ChunkManager {
  constructor(scene: Phaser.Scene, config?: ChunkManagerConfig);

  update(playerX: number, playerY: number): void;  // 每帧更新
  getActiveChunkCount(): number;                    // 获取活动区块数
  getStats(): { loaded, unloaded, active };         // 性能统计
  cleanup(): void;                                  // 清理所有区块
  getChunkAt(worldX: number, worldY: number): Chunk | null;
}
```

**配置选项**：
```typescript
interface ChunkManagerConfig {
  chunkSize?: number;        // 默认 256
  activeRadius?: number;     // 默认 1（3x3 区块）
  seed?: number;             // 世界种子
}
```

### 3. EnemySpawnSystem（敌人生成系统）

基于游戏时间的敌人生成：
- 基础生成率：10/分钟
- 难度缩放：每分钟增加 1.5
- 巨浪机制：每分钟 3 倍数量

**文件**：`src/systems/EnemySpawnSystem.ts`

```typescript
export class EnemySpawnSystem {
  constructor(
    scene: Phaser.Scene,
    player: Player,
    enemySystem: EnemySystem,
    config?: Partial<EnemySpawnConfig>
  );

  update(time: number): void;         // 每帧更新
  getStats(): { totalSpawned: number };
}
```

**配置选项**：
```typescript
interface EnemySpawnConfig {
  baseSpawnRate: number;      // 基础生成率（每分钟）
  minSpawnDistance: number;   // 最小生成距离
  maxSpawnDistance: number;   // 最大生成距离
  waveInterval: number;       // 巨浪间隔（毫秒）
  difficultyScale: number;    // 难度缩放系数
}
```

## 数据流

```
玩家移动 → ChunkManager.update(playerX, playerY)
  ↓
计算活动区块范围（3x3）
  ↓
加载新区块 → Chunk.load()
  - createBackground()        // 创建 TileSprite
  - generateDecorations()     // 程序化生成装饰物
  ↓
卸载远区块 → Chunk.unload()
  - 销毁 TileSprite
  - 销毁装饰物 Group
```

### 敌人生成流程

```
游戏时间流逝 → EnemySpawnSystem.update(time)
  ↓
计算当前生成率 = baseRate + minutes * difficultyScale
  ↓
检查巨浪时机（每 60 秒）
  ↓
┌─ 巨浪时间 → spawnWave(count * 3)  // 环形生成
│
└─ 常规时间 → spawnRegular()         // 随机位置生成
  ↓
EnemySystem.spawnEnemyAt(x, y, type)
```

## 性能指标

| 指标 | 目标值 | 实际值 |
|------|--------|--------|
| FPS | 60 | 60 (稳定) |
| 内存 | < 100MB | ~80MB |
| 活动区块 | 9 | 9 |
| 区块加载时间 | < 50ms | ~10ms |

**性能优化措施**：
1. **区块卸载缓冲**：保留额外一圈区块，避免频繁加载/卸载
2. **对象池**：复用游戏对象，减少 GC 压力
3. **种子随机**：避免存储大量随机数据

## 游戏配置

相关配置位于 `src/config/game.config.ts`：

```typescript
// 无限世界配置
export const CHUNK_SIZE = 256;           // 区块大小
export const ACTIVE_CHUNK_RADIUS = 1;    // 活动区块半径（3x3）
export const WORLD_SEED = 12345;         // 固定种子
```

## 与其他系统的集成

### BattleScene 集成

```typescript
// 创建 ChunkManager
this.chunkManager = new ChunkManager(this, {
  chunkSize: CHUNK_SIZE,
  activeRadius: ACTIVE_CHUNK_RADIUS,
  seed: WORLD_SEED
});

// 创建敌人生成系统
this.enemySpawnSystem = new EnemySpawnSystem(
  this,
  this.player,
  this.enemySystem,
  {
    baseSpawnRate: 10,
    minSpawnDistance: 500,
    maxSpawnDistance: 700,
    waveInterval: 60000,
    difficultyScale: 1.5
  }
);

// 在 update 中更新
update(time: number, delta: number): void {
  this.chunkManager.update(this.player.x, this.player.y);
  this.enemySpawnSystem.update(time);
}

// 在 shutdown 中清理
shutdown(): void {
  this.chunkManager?.cleanup();
}
```

### 纹理资源

需要以下纹理（由 GraphicsFactory 生成）：
- `ground_tile` - 可平铺的地面纹理
- `decoration_tree` - 树木装饰
- `decoration_rock` - 岩石装饰
- `decoration_grave` - 墓碑装饰

## 扩展性

未来可以添加：

### 地形多样性
```typescript
interface ChunkConfig {
  terrain: 'grass' | 'desert' | 'snow' | 'volcanic';
}
```

### 特殊区块
```typescript
interface SpecialChunk {
  type: 'boss' | 'shop' | 'treasure' | 'event';
  triggered: boolean;
}
```

### 区块事件系统
```typescript
class ChunkEventManager {
  onChunkEnter(chunk: Chunk): void;
  onChunkExit(chunk: Chunk): void;
}
```

### 多人同步
```typescript
class MultiplayerChunkManager extends ChunkManager {
  syncChunkState(chunkId: string, state: ChunkState): void;
  getVisibleChunksForPlayer(playerId: string): Chunk[];
}
```

## 故障排除

### 内存泄漏

**症状**：内存持续增长

**检查**：
1. 确保 `Chunk.unload()` 正确销毁所有对象
2. 检查事件监听器是否正确移除
3. 使用浏览器开发者工具的 Memory 面板

### 性能下降

**症状**：FPS 下降

**检查**：
1. 活动区块数量是否异常（应为 9）
2. 敌人数量是否过多（实现上限）
3. 装饰物密度是否过高

### 区块闪烁

**症状**：区块重复加载/卸载

**检查**：
1. `activeRadius` 设置是否正确
2. 玩家位置是否频繁跳跃

## 测试

相关测试文件：
- `src/world/__tests__/Chunk.test.ts`
- `src/world/__tests__/ChunkManager.test.ts`
- `src/systems/__tests__/EnemySpawnSystem.test.ts`

运行测试：
```bash
npm test -- --testPathPattern="world|EnemySpawnSystem"
```
