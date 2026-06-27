# Task 5 报告: 迁移技能使用新修饰符系统

## 执行摘要

成功将所有技能策略文件从旧的 `addStatusEffect()` 系统迁移到新的修饰符系统。

## 迁移范围

### 已迁移文件

#### 1. 状态效果策略 (`src/strategies/status/`)
- `EnemyEffectStrategies.ts` - 迁移了 6 个策略:
  - `BurnEffectStrategy` → `createBurnVisualModifier`
  - `FreezeEffectStrategy` → `createFreezeVisualModifier`
  - `StunEffectStrategy` → `createStunVisualModifier`
  - `PoisonEffectStrategy` → `createPoisonVisualModifier`
  - `SlowEffectStrategy` → `createSlowVisualModifier`
  - `DefenseBreakEffectStrategy` → `createDefenseBreakVisualModifier`

#### 2. 技能策略 (`src/strategies/skills/`)
- `UltimateStrategies.ts` - 迁移了:
  - `InfernoStrategy` 中的燃烧效果添加和检查
  - 使用 `modifierStack.hasStatusEffect()` 替代 `statusEffects.some()`
  - 使用 `createBurnVisualModifier()` 替代 `addStatusEffect()`

#### 3. 协同效果策略 (`src/strategies/synergy/`)
- `CrowdControlStrategies.ts` - 迁移了 6 个策略:
  - `FreezeStrategy` → `createFreezeVisualModifier`
  - `StunStrategy` → `createStunVisualModifier`
  - `SlowStrategy` → `createSlowVisualModifier`
  - `RootStrategy` → `createRootVisualModifier`
  - `KnockupStrategy` → `createStunVisualModifier`
  - `TrueDamageConfuseStrategy` → `createStunVisualModifier`

- `DamageStrategies.ts` - 迁移了 1 个策略:
  - `DamageIncreaseStrategy` → `createAttackBoostVisualModifier`

- `AdvancedEffectStrategies.ts` - 迁移了 5 个策略:
  - `BurnSpreadStrategy` → `createBurnVisualModifier`
  - `SpreadDebuffStrategy` → 使用 `modifierStack.hasTag()` 和工厂函数
  - `TickSpeedDoubleStrategy` → `createTickSpeedUpVisualModifier`
  - `DefenseReduceStrategy` → `createDefenseBreakVisualModifier`
  - `DispelAndDamageStrategy` - 保留旧系统调用（特殊情况）

#### 4. 敌人策略 (`src/strategies/enemy/`)
- `EnemyAttackAbilityRegistry.ts` - 迁移了 4 个策略:
  - `BurnOnContactStrategy` → `createBurnVisualModifier`
  - `SlowOnAttackStrategy` → `createSlowVisualModifier`
  - `PoisonOnAttackStrategy` → `createPoisonVisualModifier`
  - `RootOnAttackStrategy` → `createRootVisualModifier`

- `BuffSkillStrategyRegistry.ts` - 迁移了 1 个策略:
  - `BlessingStrategy` → `createAttackBoostVisualModifier`

#### 5. 系统文件 (`src/systems/`)
- `SkillSystem.ts`:
  - `spreadDebuffToNearby()` → 使用 `modifierStack.hasTag()` 和工厂函数
  - `castQuicksandTrap()` → `createSlowVisualModifier`

- `CollisionSystem.ts`:
  - 敌人投射物效果 → `createSlowVisualModifier`
  - 碎冰检查 → `modifierStack.hasStatusEffect(StatusEffectType.FREEZE)`
  - 减速场 → `createSlowVisualModifier`
  - 反击冻结 → `createFreezeVisualModifier`

### 新增工厂函数

在 `VisualModifiers.ts` 中新增:
- `createTickSpeedUpVisualModifier()` - 用于加速 DoT 效果触发频率

## 特殊情况处理

### 保留旧系统调用的场景

1. **`DispelAndDamageStrategy`** (`src/strategies/synergy/AdvancedEffectStrategies.ts:109`)
   - 原因: 清除所有状态效果的操作在新系统中没有直接的公开方法
   - 解决方案: 保留 `enemy.statusEffects = []` 调用
   - 后续: 可以在 ModifierStack 中添加 `clearAll()` 方法

2. **实体内部实现** (`src/entities/Enemy.ts`, `src/entities/Player.ts`)
   - 这些文件包含 `addStatusEffect()` 方法的实现和内部 `statusEffects` 数组
   - 这些是旧系统的核心实现，将在 Task 6 中移除

## 参数映射注意事项

迁移过程中需要注意参数映射差异:

| 旧系统参数 | 新系统参数 | 说明 |
|-----------|-----------|------|
| `value: 0.3` (减速30%) | `value: 30` (百分比) | 新系统使用整数百分比 |
| `duration` | `duration` | 相同 |
| `remainingTime` | 自动设置 | 新系统自动设置 remainingTime = duration |
| `source` | 不直接支持 | 通过标签系统追踪 |

## 编译验证

所有迁移完成后，TypeScript strict mode 编译通过，无错误。

## 文件统计

- **修改文件数**: 11
- **迁移策略数**: 24+
- **新增工厂函数**: 1 (`createTickSpeedUpVisualModifier`)

## 后续建议

1. 在 ModifierStack 中添加 `clearAll()` 方法，用于清除所有效果
2. 考虑添加 `hasStatusEffectFromSource()` 方法，支持来源追踪
3. 统一参数格式（如百分比使用整数或小数）

## 结论

Task 5 已成功完成。所有技能策略文件已迁移到新的修饰符系统，编译验证通过。
