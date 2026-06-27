# 技能增益系统重构设计

---

## 游戏行业通用设计模式

### 一、修饰符栈模式 (Modifier Stack) - 最常用

**代表游戏**: Dota 2, League of Legends, 魔兽世界

**核心思想**: 属性值 = 基础值经过一系列修饰符处理

```typescript
// 属性定义
class Attribute {
  baseValue: number;
  modifiers: Modifier[] = [];
  
  get value(): number {
    let result = this.baseValue;
    
    // 先处理加法修饰符
    for (const m of this.modifiers.filter(m => m.type === 'add')) {
      result += m.value;
    }
    
    // 再处理乘法修饰符
    for (const m of this.modifiers.filter(m => m.type === 'multiply')) {
      result *= (1 + m.value);
    }
    
    // 最后处理百分比加成
    for (const m of this.modifiers.filter(m => m.type === 'percent_add')) {
      result += this.baseValue * m.value;
    }
    
    return result;
  }
  
  addModifier(modifier: Modifier): void {
    this.modifiers.push(modifier);
    this.modifiers.sort((a, b) => a.priority - b.priority);
  }
  
  removeModifier(id: string): void {
    this.modifiers = this.modifiers.filter(m => m.id !== id);
  }
}

interface Modifier {
  id: string;
  type: 'add' | 'multiply' | 'percent_add';
  value: number;
  priority: number;  // 处理优先级
  source: string;    // 来源（哪个buff/装备）
  duration?: number; // 持续时间
}
```

**优点**:
- 增益来源清晰，易于追踪
- 增益添加/移除简单
- 支持临时和永久增益

---

### 二、Gameplay Ability System (GAS) - Unreal Engine 官方

**代表引擎**: Unreal Engine 5

**核心组件**:

```
┌──────────────────────────────────────────────────────────────┐
│                    Gameplay Ability System                    │
├──────────────────────────────────────────────────────────────┤
│  Ability System Component (ASC)                               │
│  ├── AttributeSet (属性集)                                    │
│  │   ├── Health                                               │
│  │   ├── Damage                                               │
│  │   └── Range                                                │
│  ├── Gameplay Tags (标签系统)                                 │
│  │   ├── State.Stunned                                        │
│  │   └── Buff.Invincible                                      │
│  ├── Gameplay Abilities (技能)                                │
│  │   └── GA_Fireball                                          │
│  └── Gameplay Effects (效果/增益)                             │
│      ├── GE_DamageBoost                                       │
│      └── GE_RangeIncrease                                     │
└──────────────────────────────────────────────────────────────┘
```

**关键设计**:

```cpp
// 属性定义
UCLASS()
class UMyAttributeSet : public UAttributeSet
{
    GENERATED_BODY()
public:
    UPROPERTY(BlueprintReadOnly, Category = "Attributes")
    FGameplayAttributeData Damage;
    ATTRIBUTE_ACCESSORS(UMyAttributeSet, Damage)
    
    UPROPERTY(BlueprintReadOnly, Category = "Attributes")
    FGameplayAttributeData Range;
    ATTRIBUTE_ACCESSORS(UMyAttributeSet, Range)
};

// Gameplay Effect 定义（增益）
UCLASS()
class UGE_RangeIncrease : public UGameplayEffect
{
    // 修改器
    FGameplayModifierInfo Modifier;
    Modifier.Attribute = UMyAttributeSet::GetRangeAttribute();
    Modifier.ModifierOp = EGameplayModOp::Multiplicitive;
    Modifier.ModifierMagnitude = 0.5f; // +50%
};

// 技能执行时自动应用效果
void UGA_Fireball::ActivateAbility(...)
{
    // 技能读取最终属性值（已包含所有增益）
    float FinalRange = GetAbilitySystemComponent()->GetNumericAttribute(
        UMyAttributeSet::GetRangeAttribute()
    );
}
```

**优点**:
- 完全数据驱动
- 网络同步支持（多人游戏）
- 标签系统实现状态互斥
- 效果可堆叠、可过期

---

### 三、组件化 Buff 系统

**代表游戏**: Enter the Gungeon, Risk of Rain

**核心思想**: Buff 作为独立组件，监听事件或修改属性

```typescript
// Buff 基类
abstract class Buff {
  abstract readonly id: string;
  abstract readonly duration: number;
  protected target: Entity;
  
  // 生命周期
  abstract onApply(): void;
  abstract onRemove(): void;
  abstract onUpdate(dt: number): void;
  
  // 属性修改钩子
  modifyDamage(baseDamage: number): number { return baseDamage; }
  modifyRange(baseRange: number): number { return baseRange; }
  modifySpeed(baseSpeed: number): number { return baseSpeed; }
}

// 具体实现
class RangeBoostBuff extends Buff {
  readonly id = 'range_boost';
  readonly boostPercent: number;
  
  modifyRange(baseRange: number): number {
    return baseRange * (1 + this.boostPercent);
  }
}

// Buff 管理器
class BuffManager {
  private buffs: Map<string, Buff> = new Map();
  
  addBuff(buff: Buff): void {
    if (this.buffs.has(buff.id)) {
      this.buffs.get(buff.id)!.refresh(); // 刷新持续时间
    } else {
      this.buffs.set(buff.id, buff);
      buff.onApply();
    }
  }
  
  // 获取属性最终值
  getFinalDamage(baseDamage: number): number {
    let result = baseDamage;
    for (const buff of this.buffs.values()) {
      result = buff.modifyDamage(result);
    }
    return result;
  }
  
  getFinalRange(baseRange: number): number {
    let result = baseRange;
    for (const buff of this.buffs.values()) {
      result = buff.modifyRange(result);
    }
    return result;
  }
}

// 使用
class Entity {
  buffManager = new BuffManager();
  
  get damage(): number {
    return this.buffManager.getFinalDamage(this.baseStats.damage);
  }
  
  get range(): number {
    return this.buffManager.getFinalRange(this.baseStats.range);
  }
}
```

---

### 四、数据驱动配置模式

**代表游戏**: Diablo III, Path of Exile

**核心思想**: 所有技能和增益定义在外部配置，代码只负责执行

```json
// skills/fireball.json
{
  "id": "fireball",
  "name": "火球术",
  "type": "projectile",
  "baseValues": {
    "damage": 100,
    "range": 300,
    "cooldown": 2000
  },
  "formula": {
    "damage": "baseDamage * (1 + sum{damage_enhancements})",
    "range": "baseRange * (1 + sum{range_enhancements})"
  }
}

// enhancements/range_boost.json
{
  "id": "range_boost",
  "type": "range",
  "operation": "multiply",
  "value": 0.5,
  "stackType": "additive",
  "maxStacks": 3
}
```

```typescript
// 公式解析器
class FormulaParser {
  evaluate(formula: string, context: SkillContext): number {
    // 解析公式，如 "baseRange * (1 + sum{range_enhancements})"
    const baseValue = context.baseValue;
    const enhancements = context.enhancements
      .filter(e => e.type === this.extractType(formula));
    const sum = enhancements.reduce((acc, e) => acc + e.value, 0);
    
    return eval(formula
      .replace('baseRange', String(baseValue))
      .replace('sum{range_enhancements}', String(sum)));
  }
}
```

---

### 五、事件驱动模式

**代表游戏**: Slay the Spire

**核心思想**: 属性修改通过事件触发，所有系统监听事件

```typescript
// 事件定义
enum GameEvent {
  DAMAGE_CALCULATING = 'damage_calculating',
  RANGE_CALCULATING = 'range_calculating',
  ON_HIT = 'on_hit',
  ON_KILL = 'on_kill',
}

// 事件管理器
class EventManager {
  private listeners: Map<GameEvent, Function[]> = new Map();
  
  emit(event: GameEvent, data: any): void {
    const callbacks = this.listeners.get(event) || [];
    for (const cb of callbacks) {
      cb(data);
    }
  }
  
  on(event: GameEvent, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }
}

// 技能执行
class FireballSkill {
  execute(context: SkillContext): void {
    // 触发范围计算事件，允许所有增益系统修改
    const rangeData = { value: this.baseRange, skill: this };
    context.events.emit(GameEvent.RANGE_CALCULATING, rangeData);
    const finalRange = rangeData.value;
    
    // 使用 finalRange...
  }
}

// 增益系统监听事件
class RangeBoostSystem {
  constructor(events: EventManager, boostPercent: number) {
    events.on(GameEvent.RANGE_CALCULATING, (data) => {
      data.value *= (1 + boostPercent);
    });
  }
}
```

---

## 行业最佳实践总结

| 模式 | 适用场景 | 代表游戏/引擎 |
|------|----------|---------------|
| **修饰符栈** | MOBA、RPG、需要精确控制属性计算 | Dota 2, LoL, WoW |
| **GAS** | 3A 游戏、多人游戏、需要网络同步 | Unreal Engine |
| **组件化 Buff** | Roguelike、独立游戏 | Enter the Gungeon, Hades |
| **数据驱动** | 需要频繁调整数值、支持 Mod | Diablo, PoE |
| **事件驱动** | 卡牌游戏、需要复杂交互 | Slay the Spire |

---

## 针对你项目的建议

结合你的项目特点（Roguelike + 技能系统），推荐 **修饰符栈 + 组件化 Buff** 的混合模式：

```typescript
// 简化的修饰符系统
class SkillAttribute {
  constructor(
    private baseValue: number,
    private modifiers: Modifier[] = []
  ) {}
  
  get value(): number {
    return this.modifiers.reduce(
      (result, m) => m.apply(result),
      this.baseValue
    );
  }
  
  addModifier(modifier: Modifier): void {
    this.modifiers.push(modifier);
  }
  
  removeBySource(source: string): void {
    this.modifiers = this.modifiers.filter(m => m.source !== source);
  }
}

// 技能定义
class Skill {
  damage: SkillAttribute;
  range: SkillAttribute;
  cooldown: SkillAttribute;
  
  constructor(config: SkillConfig) {
    this.damage = new SkillAttribute(config.damage);
    this.range = new SkillAttribute(config.range);
    this.cooldown = new SkillAttribute(config.cooldown);
  }
}

// 使用
const skill = new Skill({ damage: 100, range: 300 });
skill.range.addModifier({
  type: 'multiply',
  value: 0.5,  // +50%
  source: 'enhancement_range_boost'
});

// 技能策略中
const range = skill.range.value;  // 自动包含所有增益
```

**优点**:
- 简单直观，易于理解
- 增益自动应用，不会遗漏
- 易于追踪增益来源
- 支持增益移除

---

## 问题分析

### 当前架构

```
┌─────────────────────────────────────────────────────────────┐
│                     EnhancementSystem                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ applyEnhancer()                                      │    │
│  │   → applyEnhancementToSkill()                        │    │
│  │       → enhancementStrategyRegistry.apply()          │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              EnhancementStrategyRegistry                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ RangeEnhancementStrategy                             │    │
│  │ DamageEnhancementStrategy                            │    │
│  │ CooldownEnhancementStrategy                          │    │
│  │ ...                                                  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              ↓ 修改 skill.rangeValue
┌─────────────────────────────────────────────────────────────┐
│                   SkillStrategy 实现                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ execute(skill, context)                              │    │
│  │   const range = skill.rangeValue;  // 直接读取        │    │
│  │   // 使用范围值...                                    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 问题根源

1. **职责分散**：技能策略直接读取 `skill.rangeValue`，但不知道这个值是否已经被增益修改
2. **缺少中间层**：没有统一的"技能值计算器"来处理基础值 + 增益
3. **隐式依赖**：策略实现隐式依赖 `EnhancementStrategy` 先修改好 `skill.rangeValue`
4. **难以测试**：要测试一个技能策略，需要先模拟整个增益应用流程
5. **容易遗漏**：新增技能时，开发者可能忘记检查增益是否正确应用

### 具体问题场景

假设有一个新技能策略：

```typescript
class NewSkillStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    // ❌ 错误：直接使用 baseValues，忽略增益
    const range = skill.baseValues.range;
    
    // ✅ 正确：使用 rangeValue（已被增益修改）
    const range = skill.rangeValue;
    
    // ✅ 更好：通过 context 获取计算后的值
    const range = context.getComputedRange(skill);
  }
}
```

问题在于：**开发者需要记住正确的用法**，否则就会遗漏增益。

---

## 设计目标

1. **解耦**：技能策略不关心增益如何应用
2. **一致性**：所有技能使用统一的方式获取计算后的值
3. **可扩展**：新增增益类型时，不影响现有技能策略
4. **可维护**：新增技能时，自动继承所有增益效果
5. **可测试**：每个组件可独立测试

---

## 解决方案

### 方案一：技能上下文模式（推荐）

**核心思想**：技能策略不直接访问 `skill.rangeValue`，而是通过 `context` 获取计算后的值。

```typescript
// SkillExecutionContext 扩展
interface SkillExecutionContext {
  scene: Phaser.Scene;
  player: Player;
  
  // 增益后的值
  getComputedDamage(skill: Skill): number;
  getComputedRange(skill: Skill): number;
  getComputedCooldown(skill: Skill): number;
  getComputedProjectileCount(skill: Skill): number;
  
  // 原有方法
  findEnemiesInRange(x: number, y: number, range: number): Enemy[];
  applyDamageToEnemy(enemy: Enemy, damage: number, skill: Skill): void;
}
```

**技能策略实现**：

```typescript
class FlameWaveStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    // 通过 context 获取增益后的范围
    const range = context.getComputedRange(skill);
    const damage = context.getComputedDamage(skill);
    
    // 使用 range 和 damage...
  }
}
```

**优点**：
- 技能策略不关心增益如何计算
- 新增增益类型只需修改 context 实现
- 新增技能自动继承所有增益
- 容易单元测试（mock context）

**缺点**：
- 需要修改所有现有技能策略
- context 需要持有增益计算逻辑

---

### 方案二：计算属性模式

**核心思想**：Skill 类提供计算属性，每次访问时自动计算增益后的值。

```typescript
class Skill {
  private _baseDamage: number;
  private _baseRange: number;
  private _enhancements: SkillEnhancement[] = [];
  
  // 计算属性：每次访问时自动计算
  get computedDamage(): number {
    let bonus = 0;
    for (const e of this._enhancements) {
      if (e.type === 'damage') bonus += e.value;
    }
    return Math.floor(this._baseDamage * (1 + bonus));
  }
  
  get computedRange(): number {
    let bonus = 0;
    for (const e of this._enhancements) {
      if (e.type === 'range') bonus += e.value;
    }
    return Math.floor(this._baseRange * (1 + bonus));
  }
}
```

**技能策略实现**：

```typescript
class FlameWaveStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const range = skill.computedRange;  // 自动计算增益
    const damage = skill.computedDamage;
  }
}
```

**优点**：
- 不需要修改技能策略的调用方式
- 自动继承所有增益
- 懒计算，只在需要时计算

**缺点**：
- 每次访问都要遍历增益（可缓存优化）
- 技能类职责增加

---

### 方案三：装饰器模式

**核心思想**：用装饰器包装基础技能，添加增益效果。

```typescript
interface ISkill {
  getDamage(): number;
  getRange(): number;
  execute(context: SkillExecutionContext): void;
}

class BaseSkill implements ISkill {
  constructor(private config: SkillConfig) {}
  
  getDamage(): number { return this.config.damage; }
  getRange(): number { return this.config.range; }
  execute(context: SkillExecutionContext): void {
    // 基础执行逻辑
  }
}

class RangeEnhancedSkill implements ISkill {
  constructor(
    private wrapped: ISkill,
    private rangeBonus: number
  ) {}
  
  getDamage(): number { return this.wrapped.getDamage(); }
  getRange(): number { 
    return Math.floor(this.wrapped.getRange() * (1 + this.rangeBonus)); 
  }
  execute(context: SkillExecutionContext): void {
    this.wrapped.execute(context);
  }
}
```

**优点**：
- 完全解耦增益和技能
- 可动态添加/移除增益
- 符合开闭原则

**缺点**：
- 需要大量重构
- 装饰器嵌套可能影响性能
- TypeScript 装饰器语法复杂

---

## 推荐方案

**推荐方案一：技能上下文模式**

原因：
1. **最小改动**：只需修改 SkillExecutionContext 和技能策略的调用方式
2. **清晰职责**：context 负责计算，策略负责执行
3. **容易迁移**：可以逐步迁移现有技能策略
4. **易于测试**：mock context 即可测试技能策略

---

## 实施计划

### Phase 1: 扩展 SkillExecutionContext

1. 添加 `getComputedDamage/Range/Cooldown` 等方法
2. 在方法内部遍历 `skill.enhancements` 计算最终值

### Phase 2: 迁移技能策略

1. 找出所有使用 `skill.rangeValue/damage` 的策略
2. 改为使用 `context.getComputedRange(skill)` 等方法
3. 保留 `skill.rangeValue` 作为 fallback（向后兼容）

### Phase 3: 统一增益计算

1. 移除 `RangeEnhancementStrategy` 等对 `skill.rangeValue` 的直接修改
2. 所有计算都在 context 的方法中完成
3. `skill.rangeValue` 变为只读属性（可选）

### Phase 4: 添加验证

1. 在 context 方法中添加日志/警告
2. 检测是否有策略绕过 context 直接访问 baseValues
3. 添加单元测试验证增益正确应用

---

## 扩展性考虑

### 新增增益类型

只需：
1. 在 `SkillEnhancement` 类型中添加新类型
2. 在 context 的计算方法中添加对应的计算逻辑
3. 所有技能策略自动继承新增益

### 新增技能

只需：
1. 实现技能策略
2. 使用 `context.getComputedXxx()` 获取增益后的值
3. 无需关心增益如何应用

---

## 代码示例

### 扩展后的 SkillExecutionContext

```typescript
// src/strategies/SkillStrategy.ts
export interface SkillExecutionContext {
  scene: Phaser.Scene;
  player: Player;
  
  // 原有参数
  damage: number;  // 可以废弃，改用 getComputedDamage
  findEnemiesInRange: (x: number, y: number, range: number) => Enemy[];
  applyDamageToEnemy: (enemy: Enemy, damage: number, skill: Skill) => void;
  applyEffects?: (enemy: Enemy, effects: SkillEffect[]) => void;
  applyLifesteal?: (damage: number) => void;
  
  // 新增：获取增益后的值
  getComputedDamage(skill: Skill): number;
  getComputedRange(skill: Skill): number;
  getComputedCooldown(skill: Skill): number;
  getComputedProjectileCount(skill: Skill): number;
  getPierceCount(skill: Skill): number;
  getMulticastCount(skill: Skill): number;
}
```

### 在 SkillSystem 中实现计算方法

```typescript
// src/systems/SkillSystem.ts
private createContext(skill: Skill): SkillExecutionContext {
  return {
    scene: this.scene,
    player: this.player,
    damage: this.getComputedDamage(skill),
    findEnemiesInRange: this.findEnemiesInRange.bind(this),
    applyDamageToEnemy: this.applyDamageToEnemy.bind(this),
    
    // 新增方法
    getComputedDamage: (s: Skill) => this.getComputedDamage(s),
    getComputedRange: (s: Skill) => this.getComputedRange(s),
    getComputedCooldown: (s: Skill) => this.getComputedCooldown(s),
    getComputedProjectileCount: (s: Skill) => this.getComputedProjectileCount(s),
    getPierceCount: (s: Skill) => this.getPierceCount(s),
    getMulticastCount: (s: Skill) => this.getMulticastCount(s),
  };
}

private getComputedRange(skill: Skill): number {
  let range = skill.baseValues.range;
  for (const e of skill.enhancements) {
    if (e.type === 'range') {
      range = Math.floor(range * (1 + e.value));
    }
  }
  return range;
}
```

### 迁移后的技能策略

```typescript
// 迁移前
class FlameWaveStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const range = skill.rangeValue;  // 可能遗漏增益
  }
}

// 迁移后
class FlameWaveStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const range = context.getComputedRange(skill);  // 保证应用所有增益
  }
}
```

---

## 总结

| 方面 | 当前设计 | 改进后设计 |
|------|----------|------------|
| 增益应用 | 策略直接修改 skill 属性 | context 统一计算 |
| 新增增益 | 修改策略 + 检查所有技能 | 只修改 context |
| 新增技能 | 手动确保使用正确属性 | 自动继承所有增益 |
| 可测试性 | 需要 mock 整个增益流程 | 只需 mock context |
| 可维护性 | 容易遗漏 | 统一入口，不易遗漏 |
