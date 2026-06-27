## Task 1: 创建 Chunk 类

**Files:**
- Create: `src/world/Chunk.ts`
- Test: 手动验证区块加载和卸载

**Interfaces:**
- Produces: `Chunk` 类，包含 `load()` 和 `unload()` 方法

- [ ] **Step 1: 创建 Chunk 接口和基础结构**

创建文件 `src/world/Chunk.ts`:

```typescript
import Phaser from 'phaser';

export interface ChunkConfig {
  x: number;           // 区块网格坐标（非世界坐标）
  y: number;
  size: number;        // 区块大小（256）
  seed: number;        // 种子（用于程序化生成）
}

export class Chunk {
  public readonly x: number;
  public readonly y: number;
  public readonly size: number;
  public readonly seed: number;

  private tileSprite: Phaser.GameObjects.TileSprite | null = null;
  private decorations: Phaser.GameObjects.Group | null = null;
  private isLoaded: boolean = false;

  constructor(
    private scene: Phaser.Scene,
    config: ChunkConfig
  ) {
    this.x = config.x;
    this.y = config.y;
    this.size = config.size;
    this.seed = config.seed;
  }

  /**
   * 加载区块（创建背景和装饰物）
   */
  load(): void {
    if (this.isLoaded) return;

    // 1. 创建背景平铺纹理
    this.createBackground();

    // 2. 程序化生成装饰物
    this.generateDecorations();

    this.isLoaded = true;
  }

  /**
   * 卸载区块（清理所有游戏对象）
   */
  unload(): void {
    if (!this.isLoaded) return;

    // 清理背景
    if (this.tileSprite) {
      this.tileSprite.destroy();
      this.tileSprite = null;
    }

    // 清理装饰物
    if (this.decorations) {
      this.decorations.destroy(true, true);
      this.decorations = null;
    }

    this.isLoaded = false;
  }

  /**
   * 检查区块是否已加载
   */
  isChunkLoaded(): boolean {
    return this.isLoaded;
  }

  /**
   * 创建区块背景
   */
  private createBackground(): void {
    // 计算区块的世界坐标（区块中心）
    const worldX = this.x * this.size + this.size / 2;
    const worldY = this.y * this.size + this.size / 2;

    // 创建 TileSprite（使用可平铺纹理）
    this.tileSprite = this.scene.add.tileSprite(
      worldX,
      worldY,
      this.size,
      this.size,
      'ground_tile'
    );
    this.tileSprite.setDepth(-1);

    // 可选：随机纹理偏移，避免视觉重复
    const random = this.seededRandom(this.seed + this.x * 1000 + this.y);
    this.tileSprite.tilePositionX = random() * this.size;
    this.tileSprite.tilePositionY = random() * this.size;
  }

  /**
   * 程序化生成装饰物
   */
  private generateDecorations(): void {
    this.decorations = this.scene.add.group();

    // 使用种子生成随机装饰物
    const random = this.seededRandom(this.seed + this.x * 1000 + this.y);

    // Vampire Survivors 装饰密度很低（每个区块 1-4 个装饰）
    const decorationCount = Math.floor(random() * 4) + 1;

    for (let i = 0; i < decorationCount; i++) {
      const x = this.x * this.size + random() * this.size;
      const y = this.y * this.size + random() * this.size;

      // 随机选择装饰物类型（如果存在装饰物纹理）
      if (this.scene.textures.exists('decoration_tree')) {
        const types = ['decoration_tree', 'decoration_rock', 'decoration_grave'];
        const type = types[Math.floor(random() * types.length)];

        const deco = this.scene.add.image(x, y, type);
        deco.setDepth(-0.5);
        deco.setAlpha(0.3 + random() * 0.2); // 0.3-0.5 透明度
        deco.setScale(0.5 + random() * 0.5); // 随机大小

        this.decorations.add(deco);
      }
    }
  }

  /**
   * 种子随机数生成器（伪随机，同一种子生成相同结果）
   */
  private seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  /**
   * 获取区块的世界坐标边界
   */
  getBounds(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      this.x * this.size,
      this.y * this.size,
      this.size,
      this.size
    );
  }
}
```

- [ ] **Step 2: 验证 Chunk 类创建成功**

运行 TypeScript 编译检查：

```bash
npm run build
```

Expected: 编译成功，无类型错误

- [ ] **Step 3: 提交代码**

```bash
git add src/world/Chunk.ts
git commit -m "feat(world): implement Chunk class with load/unload functionality"
```

---

