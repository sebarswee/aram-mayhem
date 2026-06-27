## Task 4: 集成 ChunkManager 到 BattleScene

**Files:**
- Modify: `src/scenes/BattleScene.ts`
- Modify: `src/config/game.config.ts`

**Interfaces:**
- Consumes: `ChunkManager`, `Chunk`
- Produces: 无限地图系统

- [ ] **Step 1: 修改游戏配置**

修改 `src/config/game.config.ts`，移除固定的世界边界：

```typescript
// 移除固定世界大小
// export const WORLD_WIDTH = 10000;  ← 删除
// export const WORLD_HEIGHT = 10000; ← 删除

// 添加新的配置
export const CHUNK_SIZE = 256;           // 区块大小
export const ACTIVE_CHUNK_RADIUS = 1;    // 活动区块半径（3x3）
export const WORLD_SEED = 12345;         // 固定种子（可随机）
```

- [ ] **Step 2: 修改 BattleScene 导入**

在 `src/scenes/BattleScene.ts` 顶部添加导入：

```typescript
import { ChunkManager } from '@/world/ChunkManager';
import { CHUNK_SIZE, ACTIVE_CHUNK_RADIUS, WORLD_SEED } from '@/config/game.config';
```

移除旧的导入：

```typescript
// 移除：WORLD_WIDTH, WORLD_HEIGHT
```

- [ ] **Step 3: 添加 ChunkManager 属性**

在 BattleScene 类中添加：

```typescript
export class BattleScene extends Phaser.Scene {
  // 游戏对象
  private player!: Player;
  private gameState!: GameState;

  // 世界系统
  private chunkManager!: ChunkManager;  // 新增

  // ... 其他属性 ...
}
```

- [ ] **Step 4: 修改 create() 方法**

修改 `src/scenes/BattleScene.ts` 的 `create()` 方法：

```typescript
create(): void {
  // 更新游戏尺寸
  this.updateSize();

  // 移除固定的世界边界
  // this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT); ← 删除

  // 初始化 ChunkManager（无限地图系统）
  this.chunkManager = new ChunkManager(this, {
    chunkSize: CHUNK_SIZE,
    activeRadius: ACTIVE_CHUNK_RADIUS,
    seed: WORLD_SEED
  });

  // 移除旧的背景创建方法
  // this.createInfiniteBackground(); ← 删除

  // 确保纹理存在
  if (!this.textures.exists('player')) {
    console.log('Generating textures...');
    const graphicsFactory = new GraphicsFactory(this);
    graphicsFactory.generateAll();
  }

  // ... 其他初始化代码 ...

  // 创建玩家（在原点 (0, 0)，不再是固定中心）
  this.player = new Player(this, 0, 0);

  // 设置摄像机跟随玩家
  this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
  // 移除相机边界限制
  // this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT); ← 删除

  // ... 其他代码保持不变 ...
}
```

- [ ] **Step 5: 修改 update() 方法**

在 `src/scenes/BattleScene.ts` 的 `update()` 方法中，添加 ChunkManager 更新：

```typescript
update(_time: number, delta: number): void {
  if (this.gameState.isDead || this.gameState.isUpgrading || this.gameState.isSelectingSkill) return;

  // 更新区块管理器（基于玩家位置）
  this.chunkManager.update(this.player.x, this.player.y);

  // 处理输入
  const input = this.inputSystem.getInput();
  if (input.isMoving) {
    const speed = this.player.stats.speed;
    this.player.move(input.moveX * speed, input.moveY * speed);
  } else {
    this.player.move(0, 0);
  }

  // ... 其他更新代码保持不变 ...
}
```

- [ ] **Step 6: 修改 shutdown() 方法**

在 `src/scenes/BattleScene.ts` 的 `shutdown()` 方法中，添加 ChunkManager 清理：

```typescript
shutdown(): void {
  // 清理 ChunkManager
  this.chunkManager?.cleanup();

  // 清理系统
  this.inputSystem?.destroy();
  // ... 其他清理代码 ...
}
```

- [ ] **Step 7: 移除旧的背景创建方法**

删除 `createInfiniteBackground()` 方法（不再需要）：

```typescript
// 删除整个方法
// private createInfiniteBackground(): void { ... }
```

- [ ] **Step 8: 验证集成成功**

运行游戏，检查控制台输出：

```bash
npm run dev
```

Expected:
- 控制台显示区块加载日志："Loaded chunk (0, 0)"
- 控制台显示区块加载日志："Loaded chunk (-1, -1)" 等
- 游戏正常运行，背景显示平铺纹理
- 玩家移动时，区块动态加载和卸载

- [ ] **Step 9: 提交代码**

```bash
git add src/scenes/BattleScene.ts src/config/game.config.ts
git commit -m "feat(scene): integrate ChunkManager for infinite world"
```

---

