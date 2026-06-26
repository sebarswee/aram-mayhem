### Task 1: 加载玩家精灵表素材

**Files:**
- Modify: `src/scenes/BootScene.ts`

**Interfaces:**
- Produces: 加载的纹理 `player_idle`, `player_move`, `player_attack`

- [ ] **Step 1: 在 BootScene 中添加 preload 方法加载素材**

在 `src/scenes/BootScene.ts` 的 `preload()` 方法中添加素材加载：

```typescript
preload(): void {
  // 更新游戏尺寸
  const width = this.scale.width;
  const height = this.scale.height;
  updateGameSize(width, height);

  // 加载玩家精灵表素材
  this.load.spritesheet('player_idle', 'assets/characters/player/player_idle.png', {
    frameWidth: 64,
    frameHeight: 64,
  });
  this.load.spritesheet('player_move', 'assets/characters/player/player_move.png', {
    frameWidth: 64,
    frameHeight: 64,
  });
  this.load.spritesheet('player_attack', 'assets/characters/player/player_attack.png', {
    frameWidth: 64,
    frameHeight: 64,
  });
}
```

- [ ] **Step 2: 添加加载错误处理**

在 `loadAssets()` 方法中，检查素材是否加载成功：

```typescript
// 在 loadAssets 方法开始处添加
this.load.on('loaderror', (file: Phaser.Loader.File) => {
  console.warn(`Failed to load: ${file.key}, falling back to generated textures`);
});
```

- [ ] **Step 3: 修改纹理生成逻辑，仅在素材未加载时生成**

修改 `loadAssets()` 方法中 i === 5 的部分：

```typescript
if (i === 5) {
  this.loadingText.setText('正在生成像素素材...');
  // 检查玩家素材是否已加载，如果没有则生成程序化纹理
  if (!this.textures.exists('player_idle')) {
    console.log('[BootScene] Player assets not loaded, generating fallback textures');
    const graphicsFactory = new GraphicsFactory(this);
    graphicsFactory.generateAll();
  } else {
    console.log('[BootScene] Player assets loaded successfully, skipping generated textures');
    // 仍然需要生成其他素材（敌人、投射物等）
    const graphicsFactory = new GraphicsFactory(this);
    graphicsFactory.generateEnemySprites();
    graphicsFactory.generateProjectileSprites();
    graphicsFactory.generateEffectSprites();
    graphicsFactory.generateParticles();
    graphicsFactory.generateSkillIcons();
    graphicsFactory.generateFoodSprites();
    graphicsFactory.generateExpOrbSprites();
  }
}
```

- [ ] **Step 4: 验证素材加载**

运行游戏，打开浏览器控制台，确认：
- 素材加载成功：显示 `[BootScene] Player assets loaded successfully`
- 或回退到程序化生成：显示 `[BootScene] Player assets not loaded, generating fallback textures`

运行：`npm run dev`

- [ ] **Step 5: 提交**

```bash
git add src/scenes/BootScene.ts
git commit -m "feat: 加载玩家角色精灵表素材

- 在 preload 中加载 player_idle, player_move, player_attack
- 添加加载错误处理
- 添加素材回退逻辑

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

