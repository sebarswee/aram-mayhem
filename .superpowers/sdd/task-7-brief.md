## Task 7: 文档和清理

**Files:**
- Update: `README.md`
- Create: `docs/architecture/infinite-world-system.md`

- [ ] **Step 1: 更新 README**

在 `README.md` 中添加：

```markdown
## 无限地图系统

本游戏采用 Vampire Survivors 风格的无限地图系统：

- **Chunk-based 架构**：256x256 区块动态加载
- **程序化生成**：基于种子的装饰物生成
- **基于时间的敌人生成**：随游戏时间增加难度
- **巨浪机制**：每分钟一次大波敌人

### 技术细节

- 区块大小：256x256 像素
- 活动区块：玩家周围 3x3（共 9 个）
- 敌人生成：基于游戏时间，非区块
- 性能：稳定 60 FPS，内存 < 100MB

详见：`docs/architecture/infinite-world-system.md`
```

- [ ] **Step 2: 创建架构文档**

创建文件 `docs/architecture/infinite-world-system.md`:

```markdown
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

### 2. ChunkManager（区块管理器）

负责：
- 跟踪玩家位置
- 动态加载/卸载区块
- 管理活动区块缓存
- 性能统计

**文件**：`src/world/ChunkManager.ts`

### 3. EnemySpawnSystem（敌人生成系统）

基于游戏时间的敌人生成：
- 基础生成率：10/分钟
- 难度缩放：每分钟增加 1.5
- 巨浪机制：每分钟 3 倍数量

**文件**：`src/systems/EnemySpawnSystem.ts`

## 数据流

```
玩家移动 → ChunkManager.update(playerX, playerY)
  ↓
计算活动区块范围（3x3）
  ↓
加载新区块 → Chunk.load()
  - createBackground()
  - generateDecorations()
  ↓
卸载远区块 → Chunk.unload()
```

## 性能指标

- **FPS**: 60 (稳定)
- **内存**: < 100MB
- **活动区块**: 9 个
- **区块加载时间**: < 50ms

## 扩展性

未来可以添加：
- 不同地形类型（森林、沙漠、雪地）
- 特殊区块（Boss 区、商店）
- 区块事件系统
- 多人同步区块状态
```

- [ ] **Step 3: 清理代码**

检查并移除：
- 未使用的导入
- 注释掉的旧代码
- 调试用的 console.log（保留必要的）

- [ ] **Step 4: 最终提交**

```bash
git add .
git commit -m "docs(world): add infinite world system documentation"
```

---

## 成功标准

1. ✅ 无限地图系统正常工作
2. ✅ 区块动态加载/卸载正常
3. ✅ 敌人基于时间生成
4. ✅ 性能稳定（60 FPS，< 100MB 内存）
5. ✅ 所有测试通过
6. ✅ 文档完整

---

## 风险和注意事项

1. **性能风险**：大量敌人可能导致性能下降
   - 解决方案：限制最大敌人数量，实现对象池

2. **内存泄漏**：区块卸载不彻底导致内存泄漏
   - 解决方案：严格测试 unload() 方法，确保所有对象被销毁

3. **视觉重复**：平铺纹理可能显得单调
   - 解决方案：使用多种装饰物，随机纹理偏移

4. **敌人生成过多**：长时间游戏后敌人数量爆炸
   - 解决方案：实现敌人数量上限，距离卸载机制

---

## 后续优化方向

1. **地形多样性**：不同区域使用不同纹理
2. **区块事件**：进入特定区块触发事件
3. **Boss 区块**：特殊区块生成 Boss
4. **多人同步**：支持多玩家在同一地图
5. **保存/加载**：保存已探索区块状态
