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

