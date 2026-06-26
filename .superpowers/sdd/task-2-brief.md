### Task 2: 创建玩家动画

**Files:**
- Modify: `src/scenes/BootScene.ts`

**Interfaces:**
- Produces: 动画 `player_idle_anim`, `player_move_anim`, `player_attack_anim`

- [ ] **Step 1: 在 BootScene 中添加创建动画的方法**

在 `src/scenes/BootScene.ts` 中添加新方法：

```typescript
/**
 * 创建玩家动画
 */
private createPlayerAnimations(): void {
  // 检查素材是否存在
  if (!this.textures.exists('player_idle')) {
    console.warn('[BootScene] Player textures not loaded, skipping animations');
    return;
  }

  // 待机动画
  if (!this.anims.exists('player_idle_anim')) {
    this.anims.create({
      key: 'player_idle_anim',
      frames: this.anims.generateFrameNumbers('player_idle', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });
  }

  // 移动动画
  if (!this.anims.exists('player_move_anim')) {
    this.anims.create({
      key: 'player_move_anim',
      frames: this.anims.generateFrameNumbers('player_move', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });
  }

  // 攻击动画
  if (!this.anims.exists('player_attack_anim')) {
    this.anims.create({
      key: 'player_attack_anim',
      frames: this.anims.generateFrameNumbers('player_attack', { start: 0, end: 3 }),
      frameRate: 12,
      repeat: 0, // 攻击动画只播放一次
    });
  }

  console.log('[BootScene] Player animations created');
}
```

- [ ] **Step 2: 在素材加载后调用创建动画方法**

修改 `loadAssets()` 方法中 i === 5 的部分，在生成其他素材后添加：

```typescript
// 在 graphicsFactory 调用之后添加
this.createPlayerAnimations();
```

- [ ] **Step 3: 验证动画创建**

运行游戏，在控制台中确认显示：`[BootScene] Player animations created`

运行：`npm run dev`

- [ ] **Step 4: 提交**

```bash
git add src/scenes/BootScene.ts
git commit -m "feat: 创建玩家角色动画

- 创建 player_idle_anim（待机）
- 创建 player_move_anim（移动）
- 创建 player_attack_anim（攻击）

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

