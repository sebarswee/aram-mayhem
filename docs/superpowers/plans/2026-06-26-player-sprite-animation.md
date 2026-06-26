# 替换玩家角色素材实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将程序化生成的玩家角色替换为精灵表动画素材，实现待机、移动、攻击三种动画效果

**Architecture:**
1. 在 BootScene 中加载玩家精灵表素材
2. 创建玩家动画帧配置（待机、移动、攻击）
3. 修改 Player 类使用动画而非静态纹理
4. 保留 GraphicsFactory 作为备用方案

**Tech Stack:** Phaser 3, TypeScript, Sprite Sheet Animation

## Global Constraints

- 精灵表尺寸：256x64 像素（4帧 x 64x64）
- 素材路径：`public/assets/characters/player/`
- 素材文件：`player_idle.png`, `player_move.png`, `player_attack.png`
- 保持向后兼容：如果素材加载失败，回退到程序化生成

---

## 文件结构

```
src/
├── scenes/
│   └── BootScene.ts        # 加载素材 + 创建动画
├── entities/
│   └── Player.ts           # 使用动画
└── graphics/
    └── GraphicsFactory.ts  # 保留备用
```

---

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

### Task 3: 修改 Player 类使用动画

**Files:**
- Modify: `src/entities/Player.ts`

**Interfaces:**
- Consumes: 动画 `player_idle_anim`, `player_move_anim`, `player_attack_anim`

- [ ] **Step 1: 添加动画状态追踪属性**

在 `src/entities/Player.ts` 的类属性部分添加：

```typescript
// 动画状态
private currentAnim: 'idle' | 'move' | 'attack' = 'idle';
private isAttacking: boolean = false;
```

- [ ] **Step 2: 添加播放动画的方法**

在 `src/entities/Player.ts` 中添加新方法：

```typescript
/**
 * 播放指定动画
 */
private playAnimation(anim: 'idle' | 'move' | 'attack'): void {
  if (this.currentAnim === anim) return;

  const animKey = `player_${anim}_anim`;

  // 检查动画是否存在
  if (!this.scene.anims.exists(animKey)) {
    // 回退到静态纹理
    if (this.scene.textures.exists('player')) {
      this.setTexture('player');
    }
    return;
  }

  this.currentAnim = anim;
  this.play(animKey);

  // 攻击动画结束后回到待机
  if (anim === 'attack') {
    this.isAttacking = true;
    this.once('animationcomplete', () => {
      this.isAttacking = false;
      this.playAnimation('idle');
    });
  }
}
```

- [ ] **Step 3: 在 update 方法中根据移动状态切换动画**

找到 `update()` 方法，在移动逻辑部分添加动画切换：

```typescript
// 在 update 方法中，检查移动状态并切换动画
const isMoving = this.body?.velocity.x !== 0 || this.body?.velocity.y !== 0;

if (!this.isAttacking) {
  if (isMoving) {
    this.playAnimation('move');
  } else {
    this.playAnimation('idle');
  }
}
```

- [ ] **Step 4: 添加攻击动画触发方法**

在 `src/entities/Player.ts` 中添加：

```typescript
/**
 * 播放攻击动画（由技能系统调用）
 */
public playAttackAnimation(): void {
  if (!this.isAttacking) {
    this.playAnimation('attack');
  }
}
```

- [ ] **Step 5: 修改发光效果使用正确的纹理**

修改 `createGlowEffect()` 方法：

```typescript
private createGlowEffect(): void {
  // 使用静态纹理或当前帧作为发光效果
  const textureKey = this.scene.textures.exists('player_idle') ? 'player_idle' : 'player';
  this.glowSprite = this.scene.add.sprite(this.x, this.y, textureKey, 0);
  this.glowSprite.setAlpha(0.3);
  this.glowSprite.setTint(0x66ccff);
  this.glowSprite.setScale(1.3);
  this.glowSprite.setDepth(49);
}
```

- [ ] **Step 6: 更新发光效果位置同步动画帧**

在 `update()` 方法的最后添加：

```typescript
// 更新发光效果位置和帧
if (this.glowSprite) {
  this.glowSprite.setPosition(this.x, this.y);
  // 同步当前动画帧
  if (this.frame) {
    this.glowSprite.setFrame(this.frame.name);
  }
}
```

- [ ] **Step 7: 验证动画播放**

运行游戏，测试：
1. 玩家静止时应播放待机动画
2. 玩家移动时应播放移动动画
3. 停止移动后回到待机动画

运行：`npm run dev`

- [ ] **Step 8: 提交**

```bash
git add src/entities/Player.ts
git commit -m "feat: Player 类使用精灵表动画

- 添加动画状态追踪
- 根据移动状态自动切换动画
- 支持攻击动画触发
- 同步发光效果与动画帧

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: 修改 GraphicsFactory 保留备用

**Files:**
- Modify: `src/graphics/GraphicsFactory.ts`

- [ ] **Step 1: 拆分 generateAll 为独立方法**

在 `src/graphics/GraphicsFactory.ts` 中，将私有方法改为公共方法：

```typescript
/**
 * 生成所有游戏素材
 */
generateAll(): void {
  this.createPlayerSprite();
  this.createEnemySprites();
  this.createProjectileSprites();
  this.createEffectSprites();
  this.createParticles();
  this.createSkillIcons();
  this.createFoodSprites();
  this.createExpOrbSprites();
}

/**
 * 只生成敌人素材
 */
generateEnemySprites(): void {
  this.createEnemySprites();
}

/**
 * 只生成投射物素材
 */
generateProjectileSprites(): void {
  this.createProjectileSprites();
}

/**
 * 只生成效果素材
 */
generateEffectSprites(): void {
  this.createEffectSprites();
}

/**
 * 只生成粒子素材
 */
generateParticles(): void {
  this.createParticles();
}

/**
 * 只生成技能图标
 */
generateSkillIcons(): void {
  this.createSkillIcons();
}

/**
 * 只生成食物素材
 */
generateFoodSprites(): void {
  this.createFoodSprites();
}

/**
 * 只生成经验球素材
 */
generateExpOrbSprites(): void {
  this.createExpOrbSprites();
}
```

- [ ] **Step 2: 验证构建通过**

运行：`npm run build`

- [ ] **Step 3: 提交**

```bash
git add src/graphics/GraphicsFactory.ts
git commit -m "refactor: GraphicsFactory 支持独立生成素材

- 拆分 generateAll 为独立方法
- 保留玩家纹理生成作为备用

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 测试清单

- [ ] 素材正确加载（控制台无错误）
- [ ] 待机动画正常播放
- [ ] 移动动画正常播放
- [ ] 移动停止后回到待机动画
- [ ] 发光效果与动画同步
- [ ] 如果素材加载失败，回退到程序化生成
- [ ] 游戏整体运行正常

---

## 回滚方案

如果出现严重问题，可以快速回退：

1. 删除 BootScene 中的素材加载代码
2. Player 类恢复使用 `'player'` 纹理
3. GraphicsFactory.generateAll() 正常调用

回退命令：
```bash
git revert HEAD~4  # 回退最近4个提交
```
