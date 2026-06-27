## Task 3: 创建平铺纹理资源

**Files:**
- Create: `assets/backgrounds/ground_tile.png`（256x256 可平铺纹理）
- Create: `assets/decorations/`（可选装饰物）

**Interfaces:**
- Produces: 可平铺的地面纹理资源

- [ ] **Step 1: 使用 Phaser Graphics 生成平铺纹理**

修改 `src/graphics/GraphicsFactory.ts`，添加生成平铺纹理的方法：

```typescript
/**
 * 生成地面平铺纹理（256x256）
 */
generateGroundTile(): void {
  const key = 'ground_tile';
  const size = 256;

  // 如果纹理已存在，跳过
  if (this.scene.textures.exists(key)) {
    return;
  }

  const graphics = this.scene.add.graphics();

  // 创建深色地面基底
  graphics.fillStyle(0x2a2a3e, 1);
  graphics.fillRect(0, 0, size, size);

  // 添加细微的噪点纹理
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const alpha = 0.1 + Math.random() * 0.2;

    graphics.fillStyle(0x3a3a4e, alpha);
    graphics.fillRect(x, y, 2, 2);
  }

  // 添加一些随机的小点（模拟草地或沙地）
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;

    graphics.fillStyle(0x4a4a5e, 0.3);
    graphics.fillCircle(x, y, 1);
  }

  // 生成纹理
  graphics.generateTexture(key, size, size);
  graphics.destroy();

  console.log(`Generated ground tile texture: ${key} (${size}x${size})`);
}

/**
 * 生成装饰物纹理
 */
generateDecorations(): void {
  // 树
  this.generateDecoration('decoration_tree', 0x2d5a27, 32, 48);

  // 岩石
  this.generateDecoration('decoration_rock', 0x5a5a5a, 24, 24);

  // 墓碑（吸血鬼幸存者风格）
  this.generateDecoration('decoration_grave', 0x4a4a4a, 20, 30);
}

/**
 * 生成单个装饰物纹理
 */
private generateDecoration(key: string, color: number, width: number, height: number): void {
  if (this.scene.textures.exists(key)) {
    return;
  }

  const graphics = this.scene.add.graphics();

  if (key === 'decoration_tree') {
    // 树干
    graphics.fillStyle(0x4a3728, 1);
    graphics.fillRect(width / 2 - 3, height - 15, 6, 15);

    // 树冠（三角形）
    graphics.fillStyle(color, 1);
    graphics.fillTriangle(
      width / 2, 0,
      0, height - 15,
      width, height - 15
    );
  } else if (key === 'decoration_rock') {
    // 岩石（不规则形状）
    graphics.fillStyle(color, 1);
    graphics.beginPath();
    graphics.moveTo(width / 2, 0);
    graphics.lineTo(width, height * 0.6);
    graphics.lineTo(width * 0.8, height);
    graphics.lineTo(width * 0.2, height);
    graphics.lineTo(0, height * 0.6);
    graphics.closePath();
    graphics.fillPath();
  } else if (key === 'decoration_grave') {
    // 墓碑
    graphics.fillStyle(color, 1);
    graphics.fillRect(0, height * 0.3, width, height * 0.7);
    graphics.fillCircle(width / 2, height * 0.3, width / 2);
  }

  graphics.generateTexture(key, width, height);
  graphics.destroy();

  console.log(`Generated decoration texture: ${key}`);
}
```

- [ ] **Step 2: 在 generateAll() 方法中调用**

在 `src/graphics/GraphicsFactory.ts` 的 `generateAll()` 方法中添加：

```typescript
generateAll(): void {
  // ... 现有代码 ...

  // 生成地面平铺纹理
  this.generateGroundTile();

  // 生成装饰物
  this.generateDecorations();

  console.log('All textures generated');
}
```

- [ ] **Step 3: 验证纹理生成**

运行游戏，检查控制台输出：

```bash
npm run dev
```

Expected: 控制台显示 "Generated ground tile texture: ground_tile (256x256)"

- [ ] **Step 4: 提交代码**

```bash
git add src/graphics/GraphicsFactory.ts
git commit -m "feat(graphics): add procedural ground tile and decoration textures"
```

---

