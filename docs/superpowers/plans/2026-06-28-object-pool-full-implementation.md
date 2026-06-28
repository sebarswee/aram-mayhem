# 对象池模式全面实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为所有技能视觉效果实施对象池模式，彻底解决性能问题和内存泄漏

**Architecture:** 基于现有对象池基础设施，为 37 个技能创建专用的效果池

**Tech Stack:** TypeScript, Phaser 3, Generic Object Pool Pattern

## Global Constraints

- **性能优先**：所有实施必须考虑性能影响
- **严禁偷工减料**：每个技能都必须完整实施，不能简化
- **完整测试**：每个对象池必须有使用示例
- **代码质量**：必须符合 TypeScript 最佳实践

---

## Phase 1: 完善对象池基础设施

### Task 1: 增强对象池基类功能

**Files:**
- Modify: `src/pools/ObjectPool.ts`
- Test: `src/pools/__tests__/ObjectPool.test.ts`

**Requirements:**
1. 添加预热功能（warmUp）
2. 添加自动扩展功能（autoExpand）
3. 添加性能监控（metrics）
4. 添加调试日志（可选）

**严禁简化**：必须实现所有功能，不能省略。

---

### Task 2: 增强视觉效果池

**Files:**
- Modify: `src/pools/VisualEffectPool.ts`

**Requirements:**
1. 支持多层子对象管理
2. 支持 tween 自动清理
3. 支持粒子发射器管理
4. 支持定时器管理

**严禁简化**：必须完整实现所有管理功能。

---

## Phase 2: 大招技能对象池（P0 - 11 个）

### Task 3: DragonBreathEffectPool（炎龙吐息）

**Files:**
- Create: `src/pools/effects/DragonBreathEffectPool.ts`
- Modify: `src/strategies/skills/ultimate/UltimateStrategies.ts`
- Modify: `src/pools/EffectPoolManager.ts`

**Requirements:**
1. 预创建锥形火焰图层
2. 预创建粒子发射器
3. 实现重置逻辑（位置、角度、粒子配置）
4. 自动清理所有 tween

**严禁简化**：必须池化所有视觉元素。

---

### Task 4: AbyssVortexEffectPool（深渊漩涡）

**Files:**
- Create: `src/pools/effects/AbyssVortexEffectPool.ts`
- Modify: `src/strategies/skills/ultimate/UltimateStrategies.ts`
- Modify: `src/pools/EffectPoolManager.ts`

**Requirements:**
1. 管理容器和 5 个旋转环
2. 管理 3 层深渊圆
3. 管理粒子发射器
4. 管理无限旋转 tween（必须正确停止）

**严禁简化**：必须正确管理所有 5 个无限 tween。

---

### Task 5: FrozenDomainEffectPool（冰封领域）

**Files:**
- Create: `src/pools/effects/FrozenDomainEffectPool.ts`
- Modify: `src/strategies/skills/ultimate/UltimateStrategies.ts`
- Modify: `src/pools/EffectPoolManager.ts`

**Requirements:**
1. 管理 4 层冰封区域
2. 管理粒子发射器
3. 管理容器和 3 个旋转冰环
4. 管理无限脉动 + 旋转 tween（共 7 个）

**严禁简化**：必须正确管理所有 7 个无限 tween。

---

### Task 6: ThunderApocalypseEffectPool（雷霆万钧）

**Files:**
- Create: `src/pools/effects/ThunderApocalypseEffectPool.ts`
- Modify: `src/strategies/skills/ultimate/UltimateStrategies.ts`
- Modify: `src/pools/EffectPoolManager.ts`

**Requirements:**
1. 管理 3 层雷云
2. 管理闪电和闪光对象（这些是瞬态的，需要考虑）
3. 确保云层正确清理

**严禁简化**：必须解决云层残留问题。

---

### Task 7-11: 其他大招对象池

按相同模式实施：
- Task 7: ShadowRealmEffectPool（暗影领域）
- Task 8: DeathDecayEffectPool（死亡凋零）
- Task 9: EarthGuardianEffectPool（大地守护者）
- Task 10: VoidRiftEffectPool（虚空裂隙）
- Task 11: BlackHoleEffectPool（黑洞）

**严禁简化**：每个都必须完整实施。

---

## Phase 3: 区域持续技能对象池（P1 - 15 个）

### Task 12: ElectricFieldEffectPool（电场）

**Files:**
- Create: `src/pools/effects/ElectricFieldEffectPool.ts`
- Modify: `src/strategies/skills/area/lightning/ElectricFieldStrategy.ts`
- Modify: `src/pools/EffectPoolManager.ts`

**Requirements:**
1. 管理 6 个无限 tween
2. 管理电场区域和粒子

**严禁简化**：必须管理所有 6 个 tween。

---

### Task 13: BlizzardEffectPool（暴风雪）

**Files:**
- Create: `src/pools/effects/BlizzardEffectPool.ts`
- Modify: `src/strategies/skills/area/ice/BlizzardStrategy.ts`
- Modify: `src/pools/EffectPoolManager.ts`

**Requirements:**
1. 管理 2 个粒子系统
2. 管理暴风雪区域
3. 管理无限 tween

**严禁简化**：必须管理所有粒子系统。

---

### Task 14-26: 其他区域技能对象池

按相同模式实施：
- Task 14: PoisonCloudEffectPool（毒云）
- Task 15: IceWallEffectPool（冰墙）
- Task 16: RockSpikeEffectPool（岩石尖刺）
- Task 17: SandstormEffectPool（沙暴）
- Task 18: ThunderStormEffectPool（雷暴）
- Task 19: FlameWaveEffectPool（火焰波）
- Task 20: FrostNovaEffectPool（霜冻新星）
- Task 21: TidalWaveEffectPool（潮汐波）
- Task 22: ArcLightningEffectPool（电弧闪电）
- Task 23: LightningFocusEffectPool（闪电聚焦）
- Task 24: ShadowStepEffectPool（暗影步）
- Task 25: WaterSlashEffectPool（水流斩）
- Task 26: HolyLightEffectPool（圣光）

**严禁简化**：每个都必须完整实施。

---

## Phase 4: 投射物技能对象池（P2 - 7 个）

### Task 27: ProjectileTrailPool（投射物拖尾）

**Files:**
- Create: `src/pools/effects/ProjectileTrailPool.ts`
- Modify: `src/strategies/skills/projectile/ProjectileStrategies.ts`
- Modify: `src/pools/EffectPoolManager.ts`

**Requirements:**
1. 管理投射物拖尾粒子
2. 支持多种颜色配置

**严禁简化**：必须管理所有拖尾效果。

---

### Task 28-33: 其他投射物对象池

按相同模式实施：
- Task 28: FireballEffectPool（火球）
- Task 29: IceSpearEffectPool（冰矛）
- Task 30: LightningBoltEffectPool（闪电箭）
- Task 31: WaterBulletEffectPool（水弹）
- Task 32: EarthSpikeEffectPool（地刺）
- Task 33: ShadowBallEffectPool（暗影球）

**严禁简化**：每个都必须完整实施。

---

## Phase 5: 增益技能对象池（P3 - 4 个）

### Task 34: ShieldEffectPool（护盾）

**Files:**
- Create: `src/pools/effects/ShieldEffectPool.ts`
- Modify: `src/strategies/skills/buff/BuffStrategies.ts`
- Modify: `src/pools/EffectPoolManager.ts`

**Requirements:**
1. 管理护盾视觉效果
2. 管理脉动 tween

**严禁简化**：必须正确管理 tween。

---

### Task 35-37: 其他增益对象池

按相同模式实施：
- Task 35: StoneSkinEffectPool（石肤）
- Task 36: BlessingEffectPool（祝福）
- Task 37: RegenerationEffectPool（再生）

**严禁简化**：每个都必须完整实施。

---

## Phase 6: 测试和验证

### Task 38: 性能基准测试

**Files:**
- Create: `tests/performance/ObjectPool.benchmark.ts`

**Requirements:**
1. 测试创建/销毁开销
2. 测试内存占用
3. 测试 GC 压力
4. 对比优化前后数据

**严禁简化**：必须包含完整的性能数据。

---

### Task 39: 集成测试

**Files:**
- Create: `tests/integration/ObjectPool.integration.ts`

**Requirements:**
1. 测试所有效果池的正确性
2. 测试场景切换时的清理
3. 测试并发使用

**严禁简化**：必须覆盖所有效果池。

---

### Task 40: 文档和总结

**Files:**
- Update: `README.md`
- Create: `docs/performance/object-pool-optimization.md`

**Requirements:**
1. 记录性能提升数据
2. 记录使用方法
3. 记录最佳实践

**严禁简化**：必须有完整文档。

---

## 成功标准

1. ✅ 所有 37 个技能都使用对象池
2. ✅ 性能提升 > 50%
3. ✅ GC 压力降低 > 80%
4. ✅ 无内存泄漏
5. ✅ 所有测试通过

---

## 风险和注意事项

1. **工作量巨大**：37 个技能需要逐一实施
2. **测试复杂**：每个效果池都需要测试
3. **兼容性**：确保不破坏现有功能
4. **调试困难**：对象池可能增加调试难度

---

## 执行策略

**分批执行**：
- Phase 1-2: 基础设施 + P0 大招（高优先级）
- Phase 3: P1 区域技能（中优先级）
- Phase 4-6: P2-P3 + 测试（低优先级）

**每完成一个 Task 都要**：
1. 编译验证
2. 功能测试
3. 提交代码
4. 更新进度

---

**预计总工作量**：40 个 Task，每个 Task 10-30 分钟，总计 6-20 小时

**开始执行！**
