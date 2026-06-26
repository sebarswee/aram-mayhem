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
