# 游戏性能优化报告

## 执行日期
2026-06-28

## 问题现象
- 游戏运行一段时间后变卡
- 大招清掉一波怪后瞬间流畅
- 但马上又会卡住

---

## 诊断过程

### Phase 1: 根本原因调查

按照系统性调试流程，进行了完整的证据收集：

#### 证据链 1: 敌人生成系统分析

**文件: `src/systems/EnemySpawnSystem.ts`**
- 第 39-59 行：`update()` 方法
- **问题**: 没有任何敌人数量上限检查
- 生成率随时间无限增长：
  - 基础生成率: 10 敌人/分钟
  - 难度系数: 1.5
  - 5分钟后: 17.5 敌人/分钟
  - 巨浪生成: 52.5 敌人/分钟（3倍）

**文件: `src/systems/EnemySystem.ts`**
- 第 176-230 行：`spawnEnemy()` 方法 - 有 `MAX_ENEMIES = 100` 检查 ✓
- 第 374-386 行：`spawnEnemyAt()` 方法 - **没有 `MAX_ENEMIES` 检查** ✗

#### 证据链 2: 游戏集成分析

**文件: `src/scenes/BattleScene.ts`**
- 第 125 行：禁用了 `EnemySystem` 的自动生成
- 第 141-152 行：使用 `EnemySpawnSystem` 作为唯一生源

**关键发现:**
```
BattleScene → EnemySpawnSystem.update() → enemySystem.spawnEnemyAt()
                                                    ↓
                                        绕过了 MAX_ENEMIES 检查！
```

#### 证据链 3: 症状解释

| 症状 | 根本原因 |
|------|----------|
| 运行一段时间后变卡 | 敌人数量无限增长，超过 100+ |
| 大招清怪后瞬间流畅 | 清掉大量敌人，数量骤降 |
| 马上又卡住 | 高生成率迅速补充敌人至 100+ |

### Phase 2: 模式分析

对比了正确的实现：

**EnemySystem.spawnEnemy() (有检查):**
```typescript
// Check max enemy count
const currentCount = this.getActiveEnemyCount();
if (currentCount >= MAX_ENEMIES) {
  return;
}
```

**EnemySystem.spawnEnemyAt() (无检查):**
```typescript
spawnEnemyAt(x: number, y: number, type: string): void {
  const enemyConfig = this.getEnemyConfig(type);
  if (enemyConfig) {
    const enemy = new EnemyEntity(this.scene, x, y, enemyConfig);
    enemy.setTarget(this.player);
    this.enemies.add(enemy);
    // 缺少 MAX_ENEMIES 检查！
  }
}
```

### Phase 3: 技能策略清理检查

检查了所有技能策略的 Tween/Timer 清理逻辑：

**正确实现 (UltimateStrategies.ts, ElectricFieldStrategy.ts 等):**
- 使用 `activeTweens` 数组存储无限循环的 tweens
- 在 timer 结束时调用 `tween.stop()` 停止 tweens
- 调用 `destroy()` 销毁所有视觉对象和粒子系统

**结论:** 技能策略的清理逻辑是正确的，不是性能问题的主因。

---

## 修复方案

### 修复 1: EnemySpawnSystem.ts

**文件:** `src/systems/EnemySpawnSystem.ts`

**修改:** 在 `update()` 方法开头添加敌人数量检查

```typescript
update(time: number): void {
  // 检查敌人数量上限，防止性能问题
  const currentEnemyCount = this.enemySystem.getActiveEnemyCount();
  if (currentEnemyCount >= 100) {
    return; // 达到上限，暂停生成
  }

  const minutesElapsed = time / 60000;
  // ... 原有逻辑
}
```

### 修复 2: EnemySystem.ts

**文件:** `src/systems/EnemySystem.ts`

**修改:** 在 `spawnEnemyAt()` 方法添加 `MAX_ENEMIES` 检查

```typescript
spawnEnemyAt(x: number, y: number, type: string): void {
  // 检查敌人数量上限，防止性能问题
  const currentCount = this.getActiveEnemyCount();
  if (currentCount >= MAX_ENEMIES) {
    return; // 达到上限，不再生成
  }

  const enemyConfig = this.getEnemyConfig(type);
  if (enemyConfig) {
    const enemy = new EnemyEntity(this.scene, x, y, enemyConfig);
    enemy.setTarget(this.player);
    this.enemies.add(enemy);

    // Enemy death event
    enemy.on('death', () => {
      this.scene.events.emit('enemyKilled', enemy);
    });
  }
}
```

---

## 性能测试结果

### 修复前 (预期)

| 指标 | 值 |
|------|-----|
| 敌人数量上限 | 无限制 |
| 5分钟后敌人数量 | 100-200+ |
| FPS | 60 → 30 → 15 (持续下降) |
| 大招后 FPS | 短暂恢复到 60 |

### 修复后 (预期)

| 指标 | 值 |
|------|-----|
| 敌人数量上限 | 100 (MAX_ENEMIES) |
| 持续敌人数量 | 稳定在 80-100 |
| FPS | 稳定 60 |
| 大招后 FPS | 保持稳定 60 |

### 构建验证

```bash
$ npm run build
✓ 97 modules transformed.
✓ built in 11.98s
```

**结果:** 构建成功，无编译错误。

---

## 提交信息

```
fix(perf): add enemy count limit to prevent performance degradation

- Add MAX_ENEMIES (100) check in EnemySpawnSystem.update()
- Add MAX_ENEMIES check in EnemySystem.spawnEnemyAt()
- Prevents enemy count from growing unbounded over time
- Fixes lag issue after extended gameplay sessions

Root cause: EnemySpawnSystem used spawnEnemyAt() which bypassed
the MAX_ENEMIES check in spawnEnemy(), allowing unlimited enemy
spawning and causing severe performance degradation.

Symptoms fixed:
- Game lagging after extended play sessions
- Temporary FPS recovery after ultimate ability clears enemies
- Immediate lag returning as enemies respawn rapidly
```

---

## 附加建议

### 短期优化 (已实施)
1. ✅ 敌人数量上限检查
2. ✅ 双重检查保护（spawnSystem + spawnEnemyAt）

### 中期优化 (可选)
1. 动态难度调整：根据敌人数量调整生成率
2. 远距离敌人清理：移除距离玩家太远的敌人
3. 对象池：为敌人实现对象池复用

### 长期优化 (可选)
1. 空间分区：使用四叉树优化碰撞检测
2. LOD 系统：远距离敌人降低更新频率
3. Web Worker：将部分计算移到 worker 线程

---

## 验证方法

### 手动测试
1. 启动游戏
2. 打开浏览器开发者工具 → Performance Monitor
3. 记录 FPS 和内存变化
4. 游戏运行 5-10 分钟
5. 验证性能是否稳定

### 自动化测试 (建议添加)
```typescript
describe('EnemySpawnSystem', () => {
  it('should stop spawning when MAX_ENEMIES is reached', () => {
    // Mock enemySystem to return MAX_ENEMIES count
    // Call update()
    // Verify no new enemies are spawned
  });
});
```

---

## 总结

### 问题根源
`EnemySpawnSystem` 使用 `EnemySystem.spawnEnemyAt()` 方法，绕过了 `MAX_ENEMIES` 检查，导致敌人数量无限增长。

### 修复策略
在两个关键位置添加双重检查：
1. `EnemySpawnSystem.update()` - 生成源头
2. `EnemySystem.spawnEnemyAt()` - 公共 API

### 效果预期
- 敌人数量稳定在 100 以内
- FPS 保持稳定 60
- 消除长时间运行后的性能下降问题

---

**报告完成时间:** 2026-06-28
**诊断方法:** 系统性调试 (Systematic Debugging)
**修复文件:** 2 个
**代码变更:** +20 行
