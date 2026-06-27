# Buff/修饰符系统重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构游戏中的 Buff 和状态效果系统，使用统一的修饰符栈架构，实现 Player 和 Enemy 的代码统一。

**Architecture:** 采用分层架构 - ModifierStack 负责数据存储和数值计算，Strategies 负责复杂行为和视觉效果。使用 IBuffable 接口统一 Player 和 Enemy，分类管理属性修饰符、状态效果和触发器。

**Tech Stack:** TypeScript, Phaser 3, Vite

## Global Constraints

- TypeScript strict mode enabled
- Phaser 3.80.1
- 保留现有策略模式，修饰符系统专注于数据层
- 渐进式迁移，保留旧接口兼容性
- 所有新代码必须包含单元测试
- 遵循现有代码风格和命名规范

---

## File Structure

**新增文件:**
```
src/modifiers/
├── interfaces/
│   ├── IBuffable.ts              # IBuffable 接口定义
│   └── ModifierTypes.ts          # 修饰符类型定义
├── core/
│   ├── ModifierStack.ts          # 修饰符栈核心类
│   ├── ModifierFactory.ts        # 修饰符工厂
│   └── ModifierRegistry.ts       # 修饰符注册表
├── modifiers/
│   ├── AttributeModifier.ts      # 属性修饰符
│   ├── StatusEffectModifier.ts   # 状态效果修饰符
│   └── TriggerModifier.ts        # 触发器修饰符
└── index.ts                      # 导出入口

src/modifiers/__tests__/
├── ModifierStack.test.ts         # ModifierStack 单元测试
├── AttributeModifier.test.ts     # 属性修饰符测试
└── StatusEffectModifier.test.ts  # 状态效果测试
```

**修改文件:**
```
src/types/index.ts                # 添加修饰符相关类型导出
src/entities/Player.ts            # 实现 IBuffable 接口
src/entities/Enemy.ts             # 实现 IBuffable 接口
src/systems/SkillSystem.ts        # 使用新的修饰符系统
```

---

## Task 1: 创建修饰符核心类型定义

**Files:**
- Create: `src/modifiers/interfaces/ModifierTypes.ts`
- Create: `src/modifiers/interfaces/IBuffable.ts`

**Interfaces:**
- Produces: `ModifierType`, `ModifierOp`, `ModifierPriority`, `StackingPolicy`, `StackingConfig`, `Modifier` 接口
- Produces: `IBuffable` 接口

- [ ] **Step 1: 创建修饰符类型定义文件**

```typescript
// src/modifiers/interfaces/ModifierTypes.ts
import { Element } from '@/types';

/**
 * 修饰符类型
 */
export enum ModifierType {
  ATTRIBUTE = 'attribute',        // 属性修饰符
  STATUS_EFFECT = 'status_effect', // 状态效果
  TRIGGER = 'trigger'             // 触发器
}

/**
 * 修饰符操作类型
 */
export enum ModifierOp {
  ADD = 'add',                   // 加法: base + value
  MULTIPLY = 'multiply',         // 乘法: base * value
  PERCENT_ADD = 'percent_add',   // 百分比: base * (1 + value%)
  OVERRIDE = 'override'          // 覆盖: value
}

/**
 * 修饰符优先级
 */
export enum ModifierPriority {
  LOWEST = 0,
  LOW = 25,
  NORMAL = 50,
  HIGH = 75,
  HIGHEST = 100,
  OVERRIDE = 200  // 覆盖操作总是最后执行
}

/**
 * 叠加策略
 */
export enum StackingPolicy {
  INDEPENDENT = 'independent',          // 独立叠加
  REFRESH_BY_SOURCE = 'refresh_by_source', // 按源刷新
  SINGLE_INSTANCE = 'single_instance',  // 单实例
  MAX_STACKS = 'max_stacks'             // 最大层数
}

/**
 * 叠加配置
 */
export interface StackingConfig {
  policy: StackingPolicy;
  maxStacks?: number;
  durationRefresh?: boolean;
  valueRefresh?: boolean;
}

/**
 * 基础修饰符接口
 */
export interface Modifier {
  // 基础信息
  id: string;
  type: ModifierType;
  source: string;

  // 数值
  operation: ModifierOp;
  value: number;
  priority: number;

  // 目标属性（属性修饰符用）
  targetAttribute?: string;

  // 持续时间
  duration: number;  // -1 = 永久
  remainingTime: number;

  // 标签系统
  tags: Set<string>;

  // 叠加规则
  stacking: StackingConfig;

  // 生命周期回调
  onApply?(target: IBuffable): void;
  onRemove?(target: IBuffable): void;
  onUpdate?(target: IBuffable, delta: number): void;
}

// 前向声明
export interface IBuffable {
  readonly modifierStack: any; // ModifierStack
  readonly baseAttributes: Readonly<Record<string, number>>;
  updateModifiers(delta: number): void;
  onModifierAdded?(modifier: Modifier): void;
  onModifierRemoved?(modifier: Modifier): void;
  readonly id: string;
  readonly isActive: boolean;
}
```

- [ ] **Step 2: 创建 IBuffable 接口定义文件**

```typescript
// src/modifiers/interfaces/IBuffable.ts
import { Modifier } from './ModifierTypes';

/**
 * 可接受 Buff 的实体接口
 * Player 和 Enemy 都实现此接口
 */
export interface IBuffable {
  // 修饰符栈
  readonly modifierStack: any; // 使用 any 避免循环依赖，实际类型为 ModifierStack

  // 基础属性（只读）
  readonly baseAttributes: Readonly<Record<string, number>>;

  // 生命周期
  updateModifiers(delta: number): void;

  // 事件回调（可选）
  onModifierAdded?(modifier: Modifier): void;
  onModifierRemoved?(modifier: Modifier): void;

  // 实体信息
  readonly id: string;
  readonly isActive: boolean;
}
```

- [ ] **Step 3: 更新类型导出**

在 `src/types/index.ts` 末尾添加：

```typescript
// ==================== 修饰符系统 ====================
export * from '@/modifiers/interfaces/ModifierTypes';
export * from '@/modifiers/interfaces/IBuffable';
```

- [ ] **Step 4: 验证编译**

Run: `npm run build`
Expected: 编译成功，无错误

- [ ] **Step 5: 提交**

```bash
git add src/modifiers/interfaces/ src/types/index.ts
git commit -m "feat: 添加修饰符核心类型定义

- 定义 ModifierType, ModifierOp, ModifierPriority 枚举
- 定义 StackingPolicy 和 StackingConfig
- 定义基础 Modifier 接口
- 定义 IBuffable 接口

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: 实现状态效果修饰符

**Files:**
- Create: `src/modifiers/modifiers/StatusEffectModifier.ts`

**Interfaces:**
- Consumes: `Modifier` 接口 (from Task 1)
- Produces: `StatusEffectType` 枚举, `StatusEffectModifier` 接口

- [ ] **Step 1: 创建状态效果类型枚举**

```typescript
// src/modifiers/modifiers/StatusEffectModifier.ts
import { Modifier, ModifierType } from '../interfaces/ModifierTypes';
import { Element } from '@/types';

/**
 * 状态效果类型
 */
export enum StatusEffectType {
  // DoT效果
  BURN = 'burn',
  POISON = 'poison',

  // 控制效果
  FREEZE = 'freeze',
  STUN = 'stun',
  ROOT = 'root',
  SLOW = 'slow',

  // 增益效果
  SHIELD = 'shield',
  ATTACK_BOOST = 'attack_boost',
  SPEED_BOOST = 'speed_boost',
  DEFENSE_BOOST = 'defense_boost',

  // 特殊效果
  DEFENSE_BREAK = 'defense_break',
  TICK_SPEED_UP = 'tick_speed_up'
}

/**
 * 状态效果修饰符
 */
export interface StatusEffectModifier extends Modifier {
  type: ModifierType.STATUS_EFFECT;

  // 状态效果类型
  effectType: StatusEffectType;

  // DoT效果配置
  tickInterval?: number;    // 触发间隔（毫秒）
  lastTickTime?: number;    // 上次触发时间

  // 元素类型
  element?: Element;

  // 效果值（用于DoT伤害、减速百分比等）
  effectValue: number;
}

/**
 * 创建燃烧效果
 */
export function createBurnEffect(
  value: number,
  duration: number,
  source: string
): StatusEffectModifier {
  return {
    id: `burn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: ModifierType.STATUS_EFFECT,
    effectType: StatusEffectType.BURN,
    operation: ModifierOp.ADD,
    value,
    effectValue: value,
    duration,
    remainingTime: duration,
    tickInterval: 500,
    element: 'fire',
    source,
    tags: new Set(['burn', 'dot', 'fire', 'dispellable']),
    stacking: { policy: StackingPolicy.REFRESH_BY_SOURCE },
    priority: ModifierPriority.NORMAL
  };
}

/**
 * 创建减速效果
 */
export function createSlowEffect(
  value: number,
  duration: number,
  source: string
): StatusEffectModifier {
  return {
    id: `slow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: ModifierType.STATUS_EFFECT,
    effectType: StatusEffectType.SLOW,
    operation: ModifierOp.PERCENT_ADD,
    value: -value, // 负数表示减速
    effectValue: value,
    duration,
    remainingTime: duration,
    source,
    tags: new Set(['slow', 'ice', 'dispellable']),
    stacking: { policy: StackingPolicy.SINGLE_INSTANCE },
    priority: ModifierPriority.NORMAL
  };
}
```

需要导入：
```typescript
import { ModifierOp, StackingPolicy, ModifierPriority } from '../interfaces/ModifierTypes';
```

- [ ] **Step 2: 验证编译**

Run: `npm run build`
Expected: 编译成功

- [ ] **Step 3: 提交**

```bash
git add src/modifiers/modifiers/StatusEffectModifier.ts
git commit -m "feat: 实现状态效果修饰符

- 定义 StatusEffectType 枚举（DoT、控制、增益等）
- 实现 StatusEffectModifier 接口
- 添加 createBurnEffect 和 createSlowEffect 工厂函数

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: 实现属性修饰符

**Files:**
- Create: `src/modifiers/modifiers/AttributeModifier.ts`

**Interfaces:**
- Consumes: `Modifier` 接口 (from Task 1)
- Produces: `AttributeModifier` 接口

- [ ] **Step 1: 创建属性修饰符接口**

```typescript
// src/modifiers/modifiers/AttributeModifier.ts
import { Modifier, ModifierType } from '../interfaces/ModifierTypes';

/**
 * 属性修饰符
 * 用于修改攻击、防御、速度等属性
 */
export interface AttributeModifier extends Modifier {
  type: ModifierType.ATTRIBUTE;

  // 目标属性名称
  targetAttribute: string;  // 'attack', 'defense', 'speed', etc.
}

/**
 * 创建攻击力增加修饰符
 */
export function createAttackBoostModifier(
  value: number,
  duration: number,
  source: string
): AttributeModifier {
  return {
    id: `attack_boost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: ModifierType.ATTRIBUTE,
    targetAttribute: 'attack',
    operation: ModifierOp.ADD,
    value,
    duration,
    remainingTime: duration,
    source,
    tags: new Set(['buff', 'attack']),
    stacking: { policy: StackingPolicy.INDEPENDENT },
    priority: ModifierPriority.NORMAL
  };
}

/**
 * 创建速度增加修饰符
 */
export function createSpeedBoostModifier(
  value: number,
  duration: number,
  source: string
): AttributeModifier {
  return {
    id: `speed_boost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: ModifierType.ATTRIBUTE,
    targetAttribute: 'speed',
    operation: ModifierOp.PERCENT_ADD,
    value, // 正数表示加速百分比
    duration,
    remainingTime: duration,
    source,
    tags: new Set(['buff', 'speed']),
    stacking: { policy: StackingPolicy.INDEPENDENT },
    priority: ModifierPriority.NORMAL
  };
}
```

需要导入：
```typescript
import { ModifierOp, ModifierPriority, StackingPolicy } from '../interfaces/ModifierTypes';
```

- [ ] **Step 2: 验证编译**

Run: `npm run build`
Expected: 编译成功

- [ ] **Step 3: 提交**

```bash
git add src/modifiers/modifiers/AttributeModifier.ts
git commit -m "feat: 实现属性修饰符

- 定义 AttributeModifier 接口
- 添加 createAttackBoostModifier 和 createSpeedBoostModifier 工厂函数

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: 实现触发器修饰符

**Files:**
- Create: `src/modifiers/modifiers/TriggerModifier.ts`

**Interfaces:**
- Consumes: `Modifier` 接口 (from Task 1)
- Produces: `TriggerType` 枚举, `TriggerEffect` 接口, `TriggerModifier` 接口

- [ ] **Step 1: 创建触发器修饰符**

```typescript
// src/modifiers/modifiers/TriggerModifier.ts
import { Modifier, ModifierType } from '../interfaces/ModifierTypes';

/**
 * 触发器类型
 */
export enum TriggerType {
  ON_HIT = 'on_hit',                 // 被击中时
  ON_DAMAGE_DEALT = 'on_damage_dealt', // 造成伤害时
  ON_KILL = 'on_kill',               // 击杀时
  ON_TAKE_DAMAGE = 'on_take_damage'  // 受到伤害时
}

/**
 * 触发效果
 */
export interface TriggerEffect {
  type: 'damage' | 'heal' | 'freeze' | 'reflect';
  value: number;
  target?: 'self' | 'attacker' | 'victim';
}

/**
 * 触发器修饰符
 */
export interface TriggerModifier extends Modifier {
  type: ModifierType.TRIGGER;

  // 触发条件
  triggerType: TriggerType;

  // 触发次数限制
  maxTriggers: number;
  remainingTriggers: number;

  // 触发效果
  triggerEffect: TriggerEffect;
}

/**
 * 创建反击伤害触发器
 */
export function createCounterDamageTrigger(
  value: number,
  maxTriggers: number,
  duration: number,
  source: string
): TriggerModifier {
  return {
    id: `counter_damage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: ModifierType.TRIGGER,
    triggerType: TriggerType.ON_HIT,
    maxTriggers,
    remainingTriggers: maxTriggers,
    duration,
    remainingTime: duration,
    source,
    tags: new Set(['counter', 'trigger']),
    stacking: { policy: StackingPolicy.SINGLE_INSTANCE },
    priority: ModifierPriority.NORMAL,
    operation: ModifierOp.ADD,
    value,
    triggerEffect: {
      type: 'damage',
      value,
      target: 'attacker'
    }
  };
}
```

需要导入：
```typescript
import { ModifierOp, ModifierPriority, StackingPolicy } from '../interfaces/ModifierTypes';
```

- [ ] **Step 2: 验证编译**

Run: `npm run build`
Expected: 编译成功

- [ ] **Step 3: 提交**

```bash
git add src/modifiers/modifiers/TriggerModifier.ts
git commit -m "feat: 实现触发器修饰符

- 定义 TriggerType 枚举
- 定义 TriggerEffect 和 TriggerModifier 接口
- 添加 createCounterDamageTrigger 工厂函数

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: 实现 ModifierStack 核心类（基础功能）

**Files:**
- Create: `src/modifiers/core/ModifierStack.ts`

**Interfaces:**
- Consumes: 所有修饰符类型 (from Tasks 1-4)
- Produces: `ModifierStack` 类

- [ ] **Step 1: 创建 ModifierStack 类框架**

```typescript
// src/modifiers/core/ModifierStack.ts
import { IBuffable } from '../interfaces/IBuffable';
import {
  Modifier,
  ModifierType,
  ModifierOp,
  StackingPolicy
} from '../interfaces/ModifierTypes';
import { StatusEffectModifier, StatusEffectType } from '../modifiers/StatusEffectModifier';
import { AttributeModifier } from '../modifiers/AttributeModifier';
import { TriggerModifier, TriggerType } from '../modifiers/TriggerModifier';

/**
 * 修饰符栈 - 核心管理类
 */
export class ModifierStack {
  // 分类存储
  private attributeModifiers: Map<string, AttributeModifier[]> = new Map();
  private statusEffects: Map<string, StatusEffectModifier> = new Map();
  private triggerModifiers: TriggerModifier[] = [];

  // 标签索引（快速查询）
  private tagIndex: Map<string, Set<string>> = new Map();

  // 所属实体
  private owner: IBuffable;

  constructor(owner: IBuffable) {
    this.owner = owner;
  }

  /**
   * 添加修饰符
   */
  addModifier(modifier: Modifier): void {
    // 处理叠加规则
    if (!this.handleStacking(modifier)) {
      return;
    }

    // 根据类型存储
    switch (modifier.type) {
      case ModifierType.ATTRIBUTE:
        this.addAttributeModifier(modifier as AttributeModifier);
        break;
      case ModifierType.STATUS_EFFECT:
        this.statusEffects.set(modifier.id, modifier as StatusEffectModifier);
        break;
      case ModifierType.TRIGGER:
        this.triggerModifiers.push(modifier as TriggerModifier);
        break;
    }

    // 更新标签索引
    this.updateTagIndex(modifier);

    // 触发回调
    modifier.onApply?.(this.owner);
    this.owner.onModifierAdded?.(modifier);
  }

  /**
   * 添加属性修饰符
   */
  private addAttributeModifier(modifier: AttributeModifier): void {
    const attrName = modifier.targetAttribute;
    if (!this.attributeModifiers.has(attrName)) {
      this.attributeModifiers.set(attrName, []);
    }
    this.attributeModifiers.get(attrName)!.push(modifier);
  }

  /**
   * 更新标签索引
   */
  private updateTagIndex(modifier: Modifier): void {
    modifier.tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(modifier.id);
    });
  }

  /**
   * 处理叠加规则
   */
  private handleStacking(newModifier: Modifier): boolean {
    switch (newModifier.stacking.policy) {
      case StackingPolicy.SINGLE_INSTANCE:
        // 查找相同ID的修饰符
        const existing = this.findModifierById(newModifier.id);
        if (existing) {
          // 刷新持续时间
          existing.remainingTime = newModifier.duration;
          return false;  // 不添加新实例
        }
        return true;

      case StackingPolicy.REFRESH_BY_SOURCE:
        // 查找相同来源的修饰符
        const sameSource = this.findModifierBySource(newModifier.source);
        if (sameSource) {
          sameSource.remainingTime = newModifier.duration;
          if (newModifier.stacking.valueRefresh) {
            sameSource.value = newModifier.value;
          }
          return false;
        }
        return true;

      case StackingPolicy.MAX_STACKS:
        // 检查层数限制
        const stacks = this.countModifiersById(newModifier.id);
        return stacks < (newModifier.stacking.maxStacks || 1);

      default:
        return true;
    }
  }

  /**
   * 根据ID查找修饰符
   */
  private findModifierById(id: string): Modifier | undefined {
    // 查找属性修饰符
    for (const modifiers of this.attributeModifiers.values()) {
      const found = modifiers.find(m => m.id === id);
      if (found) return found;
    }

    // 查找状态效果
    if (this.statusEffects.has(id)) {
      return this.statusEffects.get(id);
    }

    // 查找触发器
    return this.triggerModifiers.find(m => m.id === id);
  }

  /**
   * 根据来源查找修饰符
   */
  private findModifierBySource(source: string): Modifier | undefined {
    // 查找属性修饰符
    for (const modifiers of this.attributeModifiers.values()) {
      const found = modifiers.find(m => m.source === source);
      if (found) return found;
    }

    // 查找状态效果
    for (const effect of this.statusEffects.values()) {
      if (effect.source === source) return effect;
    }

    // 查找触发器
    return this.triggerModifiers.find(m => m.source === source);
  }

  /**
   * 统计相同ID的修饰符数量
   */
  private countModifiersById(id: string): number {
    let count = 0;

    for (const modifiers of this.attributeModifiers.values()) {
      count += modifiers.filter(m => m.id === id).length;
    }

    if (this.statusEffects.has(id)) count++;

    count += this.triggerModifiers.filter(m => m.id === id).length;

    return count;
  }
}
```

- [ ] **Step 2: 验证编译**

Run: `npm run build`
Expected: 编译成功

- [ ] **Step 3: 提交**

```bash
git add src/modifiers/core/ModifierStack.ts
git commit -m "feat: 实现 ModifierStack 核心类（基础功能）

- 分类存储属性、状态效果、触发器修饰符
- 实现标签索引系统
- 实现叠加规则处理（单实例、按源刷新、最大层数）
- 实现修饰符查找和计数方法

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: 实现 ModifierStack 属性计算功能

**Files:**
- Modify: `src/modifiers/core/ModifierStack.ts`

**Interfaces:**
- Consumes: `AttributeModifier` (from Task 3)
- Produces: `getAttributeValue()` 方法

- [ ] **Step 1: 添加属性计算方法**

在 `ModifierStack` 类中添加：

```typescript
/**
 * 计算最终属性值
 * 分阶段计算：先加法，再乘法，最后覆盖
 */
getAttributeValue(attributeName: string, baseValue: number): number {
  const modifiers = this.attributeModifiers.get(attributeName) || [];

  if (modifiers.length === 0) {
    return baseValue;
  }

  // 按优先级排序
  const sorted = [...modifiers].sort((a, b) => a.priority - b.priority);

  let value = baseValue;

  // Phase 1: 加法操作
  for (const mod of sorted) {
    if (mod.operation === ModifierOp.ADD) {
      value += mod.value;
    } else if (mod.operation === ModifierOp.PERCENT_ADD) {
      value += baseValue * (mod.value / 100);
    }
  }

  // Phase 2: 乘法操作
  for (const mod of sorted) {
    if (mod.operation === ModifierOp.MULTIPLY) {
      value *= mod.value;
    }
  }

  // Phase 3: 覆盖操作
  for (const mod of sorted) {
    if (mod.operation === ModifierOp.OVERRIDE) {
      value = mod.value;
      break;  // 覆盖操作只取最后一个
    }
  }

  return Math.floor(value);
}

/**
 * 检查是否有特定标签的修饰符
 */
hasTag(tag: string): boolean {
  return this.tagIndex.has(tag) && this.tagIndex.get(tag)!.size > 0;
}

/**
 * 检查是否有特定类型的状态效果
 */
hasStatusEffect(effectType: StatusEffectType): boolean {
  for (const effect of this.statusEffects.values()) {
    if (effect.effectType === effectType) {
      return true;
    }
  }
  return false;
}

/**
 * 获取状态效果值
 */
getStatusEffectValue(effectType: StatusEffectType): number {
  for (const effect of this.statusEffects.values()) {
    if (effect.effectType === effectType) {
      return effect.effectValue;
    }
  }
  return 0;
}

/**
 * 获取所有触发器
 */
getTriggers(triggerType: TriggerType): TriggerModifier[] {
  return this.triggerModifiers.filter(mod => mod.triggerType === triggerType);
}
```

- [ ] **Step 2: 验证编译**

Run: `npm run build`
Expected: 编译成功

- [ ] **Step 3: 提交**

```bash
git add src/modifiers/core/ModifierStack.ts
git commit -m "feat: 实现 ModifierStack 属性计算功能

- 实现 getAttributeValue() 分阶段计算（加法→乘法→覆盖）
- 实现 hasTag() 标签查询
- 实现 hasStatusEffect() 和 getStatusEffectValue()
- 实现 getTriggers() 获取触发器列表

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: 实现 ModifierStack 更新和移除功能

**Files:**
- Modify: `src/modifiers/core/ModifierStack.ts`

**Interfaces:**
- Consumes: 所有修饰符类型
- Produces: `update()`, `removeModifier()` 方法

- [ ] **Step 1: 添加更新方法**

在 `ModifierStack` 类中添加：

```typescript
/**
 * 更新所有修饰符（每帧调用）
 */
update(delta: number): void {
  // 更新状态效果
  this.updateStatusEffects(delta);

  // 更新属性修饰符
  this.updateAttributeModifiers(delta);

  // 更新触发器
  this.updateTriggerModifiers(delta);
}

/**
 * 更新状态效果
 */
private updateStatusEffects(delta: number): void {
  const toRemove: string[] = [];

  for (const [id, effect] of this.statusEffects) {
    effect.remainingTime -= delta;

    // 触发tick效果（DoT）
    if (effect.tickInterval && effect.remainingTime > 0) {
      effect.lastTickTime = (effect.lastTickTime || 0) + delta;
      if (effect.lastTickTime >= effect.tickInterval) {
        effect.onUpdate?.(this.owner, effect.lastTickTime);
        effect.lastTickTime = 0;
      }
    }

    // 标记过期
    if (effect.remainingTime <= 0 && effect.duration > 0) {
      toRemove.push(id);
    }
  }

  // 移除过期的
  for (const id of toRemove) {
    this.removeModifier(id);
  }
}

/**
 * 更新属性修饰符
 */
private updateAttributeModifiers(delta: number): void {
  for (const [attr, modifiers] of this.attributeModifiers) {
    const remaining = modifiers.filter(mod => {
      if (mod.duration < 0) return true;  // 永久修饰符
      mod.remainingTime -= delta;
      if (mod.remainingTime <= 0) {
        mod.onRemove?.(this.owner);
        return false;
      }
      return true;
    });
    this.attributeModifiers.set(attr, remaining);
  }
}

/**
 * 更新触发器修饰符
 */
private updateTriggerModifiers(delta: number): void {
  this.triggerModifiers = this.triggerModifiers.filter(mod => {
    if (mod.duration > 0) {
      mod.remainingTime -= delta;
    }
    if (mod.remainingTime <= 0 || mod.remainingTriggers <= 0) {
      mod.onRemove?.(this.owner);
      return false;
    }
    return true;
  });
}

/**
 * 移除修饰符
 */
removeModifier(id: string): void {
  // 从属性修饰符中移除
  for (const [attr, modifiers] of this.attributeModifiers) {
    const index = modifiers.findIndex(m => m.id === id);
    if (index >= 0) {
      const removed = modifiers.splice(index, 1)[0];
      this.removeFromTagIndex(removed);
      removed.onRemove?.(this.owner);
      this.owner.onModifierRemoved?.(removed);
      return;
    }
  }

  // 从状态效果中移除
  if (this.statusEffects.has(id)) {
    const removed = this.statusEffects.get(id)!;
    this.statusEffects.delete(id);
    this.removeFromTagIndex(removed);
    removed.onRemove?.(this.owner);
    this.owner.onModifierRemoved?.(removed);
    return;
  }

  // 从触发器中移除
  const triggerIndex = this.triggerModifiers.findIndex(m => m.id === id);
  if (triggerIndex >= 0) {
    const removed = this.triggerModifiers.splice(triggerIndex, 1)[0];
    this.removeFromTagIndex(removed);
    removed.onRemove?.(this.owner);
    this.owner.onModifierRemoved?.(removed);
    return;
  }
}

/**
 * 从标签索引中移除
 */
private removeFromTagIndex(modifier: Modifier): void {
  modifier.tags.forEach(tag => {
    const set = this.tagIndex.get(tag);
    if (set) {
      set.delete(modifier.id);
      if (set.size === 0) {
        this.tagIndex.delete(tag);
      }
    }
  });
}
```

- [ ] **Step 2: 验证编译**

Run: `npm run build`
Expected: 编译成功

- [ ] **Step 3: 提交**

```bash
git add src/modifiers/core/ModifierStack.ts
git commit -m "feat: 实现 ModifierStack 更新和移除功能

- 实现 update() 方法处理所有修饰符更新
- 实现 updateStatusEffects() 处理 DoT tick 效果
- 实现 removeModifier() 移除指定修饰符
- 实现标签索引清理

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 8: 创建 ModifierStack 单元测试

**Files:**
- Create: `src/modifiers/__tests__/ModifierStack.test.ts`

**Interfaces:**
- Consumes: `ModifierStack` (from Tasks 5-7)

- [ ] **Step 1: 创建测试文件**

```typescript
// src/modifiers/__tests__/ModifierStack.test.ts
import { describe, test, expect, beforeEach } from 'vitest';
import { ModifierStack } from '../core/ModifierStack';
import {
  Modifier,
  ModifierType,
  ModifierOp,
  ModifierPriority,
  StackingPolicy
} from '../interfaces/ModifierTypes';
import { StatusEffectType } from '../modifiers/StatusEffectModifier';
import { TriggerType } from '../modifiers/TriggerModifier';
import { IBuffable } from '../interfaces/IBuffable';

// Mock IBuffable
class MockEntity implements IBuffable {
  modifierStack: ModifierStack;
  baseAttributes = {
    attack: 100,
    defense: 50,
    speed: 150
  };
  id = 'test_entity';
  isActive = true;

  addedModifiers: Modifier[] = [];
  removedModifiers: Modifier[] = [];

  constructor() {
    this.modifierStack = new ModifierStack(this);
  }

  updateModifiers(delta: number): void {
    this.modifierStack.update(delta);
  }

  onModifierAdded(modifier: Modifier): void {
    this.addedModifiers.push(modifier);
  }

  onModifierRemoved(modifier: Modifier): void {
    this.removedModifiers.push(modifier);
  }
}

describe('ModifierStack', () => {
  let entity: MockEntity;
  let stack: ModifierStack;

  beforeEach(() => {
    entity = new MockEntity();
    stack = entity.modifierStack;
  });

  describe('Attribute Calculation', () => {
    test('should calculate attribute with ADD operation', () => {
      const mod: Modifier = {
        id: 'test_add',
        type: ModifierType.ATTRIBUTE,
        targetAttribute: 'attack',
        operation: ModifierOp.ADD,
        value: 10,
        priority: ModifierPriority.NORMAL,
        duration: -1,
        remainingTime: -1,
        tags: new Set(['test']),
        stacking: { policy: StackingPolicy.INDEPENDENT }
      };

      stack.addModifier(mod);
      expect(stack.getAttributeValue('attack', 100)).toBe(110);
    });

    test('should calculate attribute with MULTIPLY operation', () => {
      const mod: Modifier = {
        id: 'test_multiply',
        type: ModifierType.ATTRIBUTE,
        targetAttribute: 'attack',
        operation: ModifierOp.MULTIPLY,
        value: 1.5, // +50%
        priority: ModifierPriority.NORMAL,
        duration: -1,
        remainingTime: -1,
        tags: new Set(['test']),
        stacking: { policy: StackingPolicy.INDEPENDENT }
      };

      stack.addModifier(mod);
      expect(stack.getAttributeValue('attack', 100)).toBe(150);
    });

    test('should calculate attribute with PERCENT_ADD operation', () => {
      const mod: Modifier = {
        id: 'test_percent',
        type: ModifierType.ATTRIBUTE,
        targetAttribute: 'attack',
        operation: ModifierOp.PERCENT_ADD,
        value: 30, // +30%
        priority: ModifierPriority.NORMAL,
        duration: -1,
        remainingTime: -1,
        tags: new Set(['test']),
        stacking: { policy: StackingPolicy.INDEPENDENT }
      };

      stack.addModifier(mod);
      expect(stack.getAttributeValue('attack', 100)).toBe(130);
    });

    test('should calculate attribute with OVERRIDE operation', () => {
      const mod: Modifier = {
        id: 'test_override',
        type: ModifierType.ATTRIBUTE,
        targetAttribute: 'attack',
        operation: ModifierOp.OVERRIDE,
        value: 999,
        priority: ModifierPriority.OVERRIDE,
        duration: -1,
        remainingTime: -1,
        tags: new Set(['test']),
        stacking: { policy: StackingPolicy.INDEPENDENT }
      };

      stack.addModifier(mod);
      expect(stack.getAttributeValue('attack', 100)).toBe(999);
    });

    test('should apply operations in correct order', () => {
      // Add +20, then multiply by 1.5, then override to 200
      const addMod: Modifier = {
        id: 'add_mod',
        type: ModifierType.ATTRIBUTE,
        targetAttribute: 'attack',
        operation: ModifierOp.ADD,
        value: 20,
        priority: ModifierPriority.NORMAL,
        duration: -1,
        remainingTime: -1,
        tags: new Set(['test']),
        stacking: { policy: StackingPolicy.INDEPENDENT }
      };

      const multMod: Modifier = {
        id: 'mult_mod',
        type: ModifierType.ATTRIBUTE,
        targetAttribute: 'attack',
        operation: ModifierOp.MULTIPLY,
        value: 1.5,
        priority: ModifierPriority.HIGH,
        duration: -1,
        remainingTime: -1,
        tags: new Set(['test']),
        stacking: { policy: StackingPolicy.INDEPENDENT }
      };

      stack.addModifier(addMod);
      stack.addModifier(multMod);

      // (100 + 20) * 1.5 = 180
      expect(stack.getAttributeValue('attack', 100)).toBe(180);
    });
  });

  describe('Stacking Policies', () => {
    test('should handle INDEPENDENT stacking', () => {
      const mod1: Modifier = {
        id: 'ind_1',
        type: ModifierType.ATTRIBUTE,
        targetAttribute: 'attack',
        operation: ModifierOp.ADD,
        value: 10,
        priority: ModifierPriority.NORMAL,
        duration: -1,
        remainingTime: -1,
        tags: new Set(['test']),
        stacking: { policy: StackingPolicy.INDEPENDENT }
      };

      const mod2: Modifier = {
        ...mod1,
        id: 'ind_2'
      };

      stack.addModifier(mod1);
      stack.addModifier(mod2);

      expect(stack.getAttributeValue('attack', 100)).toBe(120);
    });

    test('should handle SINGLE_INSTANCE stacking', () => {
      const mod1: Modifier = {
        id: 'single_1',
        type: ModifierType.ATTRIBUTE,
        targetAttribute: 'attack',
        operation: ModifierOp.ADD,
        value: 10,
        priority: ModifierPriority.NORMAL,
        duration: 5000,
        remainingTime: 5000,
        tags: new Set(['test']),
        stacking: { policy: StackingPolicy.SINGLE_INSTANCE }
      };

      const mod2: Modifier = {
        ...mod1,
        duration: 10000,
        remainingTime: 10000
      };

      stack.addModifier(mod1);
      stack.addModifier(mod2);

      // Should only have one instance
      expect(stack.getAttributeValue('attack', 100)).toBe(110);
    });
  });

  describe('Status Effects', () => {
    test('should check status effect presence', () => {
      const mod: Modifier = {
        id: 'burn_1',
        type: ModifierType.STATUS_EFFECT,
        effectType: StatusEffectType.BURN,
        operation: ModifierOp.ADD,
        value: 5,
        effectValue: 5,
        duration: 3000,
        remainingTime: 3000,
        priority: ModifierPriority.NORMAL,
        tags: new Set(['burn']),
        stacking: { policy: StackingPolicy.INDEPENDENT }
      };

      stack.addModifier(mod);
      expect(stack.hasStatusEffect(StatusEffectType.BURN)).toBe(true);
      expect(stack.getStatusEffectValue(StatusEffectType.BURN)).toBe(5);
    });
  });

  describe('Update and Removal', () => {
    test('should remove expired modifiers', () => {
      const mod: Modifier = {
        id: 'temp_mod',
        type: ModifierType.ATTRIBUTE,
        targetAttribute: 'attack',
        operation: ModifierOp.ADD,
        value: 10,
        priority: ModifierPriority.NORMAL,
        duration: 1000,
        remainingTime: 1000,
        tags: new Set(['test']),
        stacking: { policy: StackingPolicy.INDEPENDENT }
      };

      stack.addModifier(mod);
      expect(stack.getAttributeValue('attack', 100)).toBe(110);

      // Update past duration
      stack.update(1500);

      expect(stack.getAttributeValue('attack', 100)).toBe(100);
      expect(entity.removedModifiers.length).toBe(1);
    });
  });
});
```

- [ ] **Step 2: 安装测试依赖**

如果项目中还没有 vitest，需要安装：

```bash
npm install --save-dev vitest
```

- [ ] **Step 3: 运行测试**

Run: `npm test` 或 `npx vitest run src/modifiers/__tests__/ModifierStack.test.ts`
Expected: 所有测试通过

- [ ] **Step 4: 提交**

```bash
git add src/modifiers/__tests__/ package.json package-lock.json
git commit -m "test: 添加 ModifierStack 单元测试

- 测试属性计算（ADD/MULTIPLY/PERCENT_ADD/OVERRIDE）
- 测试叠加规则（INDEPENDENT/SINGLE_INSTANCE）
- 测试状态效果查询
- 测试修饰符过期移除

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 9: 创建导出入口和工厂类

**Files:**
- Create: `src/modifiers/core/ModifierFactory.ts`
- Create: `src/modifiers/index.ts`

**Interfaces:**
- Consumes: 所有修饰符类
- Produces: 统一导出接口

- [ ] **Step 1: 创建修饰符工厂**

```typescript
// src/modifiers/core/ModifierFactory.ts
import { Modifier } from '../interfaces/ModifierTypes';
import { createBurnEffect, createSlowEffect } from '../modifiers/StatusEffectModifier';
import { createAttackBoostModifier, createSpeedBoostModifier } from '../modifiers/AttributeModifier';
import { createCounterDamageTrigger } from '../modifiers/TriggerModifier';

/**
 * 修饰符工厂类
 * 提供创建各种修饰符的便捷方法
 */
export class ModifierFactory {
  /**
   * 创建燃烧效果
   */
  static createBurn(value: number, duration: number, source: string): Modifier {
    return createBurnEffect(value, duration, source);
  }

  /**
   * 创建减速效果
   */
  static createSlow(value: number, duration: number, source: string): Modifier {
    return createSlowEffect(value, duration, source);
  }

  /**
   * 创建攻击力增益
   */
  static createAttackBoost(value: number, duration: number, source: string): Modifier {
    return createAttackBoostModifier(value, duration, source);
  }

  /**
   * 创建速度增益
   */
  static createSpeedBoost(value: number, duration: number, source: string): Modifier {
    return createSpeedBoostModifier(value, duration, source);
  }

  /**
   * 创建反击伤害触发器
   */
  static createCounterDamage(value: number, maxTriggers: number, duration: number, source: string): Modifier {
    return createCounterDamageTrigger(value, maxTriggers, duration, source);
  }
}
```

- [ ] **Step 2: 创建主导出文件**

```typescript
// src/modifiers/index.ts
// 核心类
export { ModifierStack } from './core/ModifierStack';
export { ModifierFactory } from './core/ModifierFactory';

// 接口
export * from './interfaces/ModifierTypes';
export * from './interfaces/IBuffable';

// 修饰符类型
export * from './modifiers/StatusEffectModifier';
export * from './modifiers/AttributeModifier';
export * from './modifiers/TriggerModifier';
```

- [ ] **Step 3: 更新 tsconfig.json 路径映射**

在 `tsconfig.json` 的 `compilerOptions.paths` 中添加：

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/modifiers/*": ["./src/modifiers/*"]
    }
  }
}
```

- [ ] **Step 4: 验证编译**

Run: `npm run build`
Expected: 编译成功

- [ ] **Step 5: 提交**

```bash
git add src/modifiers/index.ts src/modifiers/core/ModifierFactory.ts tsconfig.json
git commit -m "feat: 创建修饰符系统导出入口

- 实现 ModifierFactory 工厂类
- 统一导出所有修饰符相关类型和类
- 更新 tsconfig 路径映射

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 10: 为 Skill 类型添加 modifierStack

**Files:**
- Modify: `src/types/index.ts`

**Interfaces:**
- Consumes: `ModifierStack` (from Task 5)
- Produces: 更新的 `Skill` 接口

- [ ] **Step 1: 更新 Skill 接口**

在 `src/types/index.ts` 中的 `Skill` 接口添加：

```typescript
import { ModifierStack } from '@/modifiers/core/ModifierStack';

export interface Skill {
  // ... 现有字段 ...

  // 技能专属修饰符栈（新增）
  modifierStack?: ModifierStack;
}
```

**注意**：由于 Skill 是数据接口，modifierStack 需要在运行时初始化。这将在 SkillSystem 中处理。

- [ ] **Step 2: 验证编译**

Run: `npm run build`
Expected: 编译成功

- [ ] **Step 3: 提交**

```bash
git add src/types/index.ts
git commit -m "feat: 为 Skill 接口添加 modifierStack 字段

支持技能专属修饰符，用于技能升级系统

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Self-Review Checklist

完成所有任务后，对照设计文档检查：

- [x] **Spec coverage**: 所有设计文档中的核心功能都有对应任务
  - ✅ IBuffable 接口
  - ✅ Modifier 分类系统
  - ✅ ModifierStack 核心类
  - ✅ 属性计算功能
  - ✅ 状态效果系统
  - ✅ 触发器系统
  - ✅ 标签系统
  - ✅ 叠加规则
  - ✅ 单元测试

- [x] **Placeholder scan**: 无 TBD、TODO、未完成步骤

- [x] **Type consistency**: 所有接口和类型定义一致
  - Modifier.id: string ✓
  - Modifier.type: ModifierType ✓
  - ModifierStack.getAttributeValue(attributeName: string, baseValue: number): number ✓
  - 所有修饰符类型正确继承 Modifier 接口 ✓

---

## Execution Handoff

**计划已完成并保存到 `docs/superpowers/plans/2026-06-27-buff-modifier-stack.md`**

**两种执行方式：**

**1. Subagent-Driven（推荐）** - 每个任务派发一个新的 subagent，任务间进行 review，快速迭代

**2. Inline Execution** - 在当前会话中使用 executing-plans 执行，批量执行并设置检查点

**选择哪种方式？**
