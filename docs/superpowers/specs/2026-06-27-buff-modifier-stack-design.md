# Buff/修饰符系统重构设计文档

**日期**: 2026-06-27
**状态**: 设计阶段
**作者**: Claude

---

## 一、背景与目标

### 1.1 当前问题

现有系统存在以下问题：

1. **重复实现**：Player 和 Enemy 各自实现了独立的状态效果系统
   - `Player.statusEffects: PlayerStatusEffect[]`
   - `Enemy.statusEffects: StatusEffect[]`
   - 两套接口、两套逻辑、难以维护

2. **硬编码状态类型**：状态效果类型在接口中硬编码
   ```typescript
   type: 'burn' | 'freeze' | 'stun' | 'poison' | 'slow' | 'root' | ...
   ```

3. **缺乏统一修饰符系统**：属性修改、状态效果、触发器混在一起管理

4. **技能升级系统**：缺乏对技能专属修饰符的支持

### 1.2 目标

1. **统一系统**：玩家和敌人使用同一套 Buff/修饰符系统
2. **分类管理**：属性修饰符、状态效果、触发器分开管理
3. **标签系统**：使用标签而非硬编码类型
4. **保留投资**：保留现有策略模式，修饰符系统专注于数据层
5. **技能树支持**：支持技能专属修饰符，技能移除时修饰符随之消失

---

## 二、核心架构

### 2.1 设计原则

采用**分层架构**，明确职责分离：

```
┌─────────────────────────────────────┐
│      数据层 (ModifierStack)         │  ← 数据存储、数值计算、生命周期
├─────────────────────────────────────┤
│      行为层 (Strategies)            │  ← 技能执行、复杂逻辑、视觉效果
├─────────────────────────────────────┤
│      表现层 (Visual Effects)        │  ← UI更新、粒子效果、动画
└─────────────────────────────────────┘
```

**关键点**：
- ModifierStack **只负责**：存储修饰符、计算数值、管理生命周期
- Strategies **只负责**：执行复杂行为、创建投射物、触发效果
- 两者通过接口协作，互不干扰

### 2.2 职责分离示例

| 功能 | ModifierStack | Strategy |
|------|--------------|----------|
| "攻击力+50" | ✅ 存储并计算 | ❌ |
| "燃烧效果：每秒5点伤害" | ✅ 管理持续时间和tick | ❌ |
| "发射火球并追踪敌人" | ❌ | ✅ |
| "连锁闪电跳跃3次" | ❌ | ✅ |
| "技能升级+30%伤害" | ✅ 存储修饰符 | ✅ 触发升级逻辑 |

---

## 三、核心接口设计

### 3.1 IBuffable 接口

所有可接受 Buff 的实体（Player、Enemy）必须实现此接口：

```typescript
export interface IBuffable {
  // 修饰符栈
  readonly modifierStack: ModifierStack;

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

### 3.2 修饰符分类

```typescript
export enum ModifierType {
  ATTRIBUTE = 'attribute',        // 属性修饰符（攻击、防御、速度等）
  STATUS_EFFECT = 'status_effect', // 状态效果（燃烧、冰冻、中毒等）
  TRIGGER = 'trigger'             // 触发器（反击、反弹等）
}
```

### 3.3 修饰符操作类型

```typescript
export enum ModifierOp {
  ADD = 'add',                   // 加法: base + value
  MULTIPLY = 'multiply',         // 乘法: base * value
  PERCENT_ADD = 'percent_add',   // 百分比: base * (1 + value%)
  OVERRIDE = 'override'          // 覆盖: value
}
```

### 3.4 基础修饰符接口

```typescript
export interface Modifier {
  // 基础信息
  id: string;                    // 唯一标识
  type: ModifierType;            // 类型
  source: string;                // 来源（技能ID、道具ID等）

  // 数值
  operation: ModifierOp;         // 操作类型
  value: number;                 // 数值
  priority: number;              // 优先级

  // 目标属性（属性修饰符专用）
  targetAttribute?: string;      // 如: 'attack', 'defense', 'speed'

  // 持续时间
  duration: number;              // -1 = 永久
  remainingTime: number;         // 剩余时间

  // 标签系统
  tags: Set<string>;             // 标签集合

  // 叠加规则
  stacking: StackingConfig;

  // 生命周期回调
  onApply?(target: IBuffable): void;
  onRemove?(target: IBuffable): void;
  onUpdate?(target: IBuffable, delta: number): void;
}
```

---

## 四、ModifierStack 核心实现

### 4.1 分类存储

```typescript
export class ModifierStack {
  // 分类存储修饰符
  private attributeModifiers: Map<string, AttributeModifier[]> = new Map();
  private statusEffects: Map<string, StatusEffectModifier> = new Map();
  private triggerModifiers: TriggerModifier[] = [];

  // 标签索引（快速查询）
  private tagIndex: Map<string, Set<string>> = new Map();

  // 所属实体
  private owner: IBuffable;
}
```

### 4.2 属性计算（核心方法）

采用类似 Unreal GAS 的**属性聚合器**模式：

```typescript
/**
 * 计算最终属性值
 * 分阶段计算：先加法，再乘法，最后覆盖
 */
getAttributeValue(attributeName: string, baseValue: number): number {
  const modifiers = this.attributeModifiers.get(attributeName) || [];
  const sorted = modifiers.sort((a, b) => a.priority - b.priority);

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
      break;
    }
  }

  return Math.floor(value);
}
```

### 4.3 叠加规则

```typescript
export enum StackingPolicy {
  INDEPENDENT = 'independent',          // 独立叠加
  REFRESH_BY_SOURCE = 'refresh_by_source', // 按源刷新
  SINGLE_INSTANCE = 'single_instance',  // 单实例
  MAX_STACKS = 'max_stacks'             // 最大层数
}

export interface StackingConfig {
  policy: StackingPolicy;
  maxStacks?: number;
  durationRefresh?: boolean;
  valueRefresh?: boolean;
}
```

**处理逻辑**：

```typescript
private handleStacking(newModifier: Modifier): boolean {
  const existing = this.findModifierById(newModifier.id);

  switch (newModifier.stacking.policy) {
    case StackingPolicy.SINGLE_INSTANCE:
      // 刷新持续时间，不添加新实例
      existing.remainingTime = newModifier.duration;
      return false;

    case StackingPolicy.REFRESH_BY_SOURCE:
      // 同一来源刷新
      const sameSource = this.findModifierBySource(newModifier.source);
      if (sameSource) {
        sameSource.remainingTime = newModifier.duration;
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
```

---

## 五、状态效果系统

### 5.1 状态效果修饰符

```typescript
export interface StatusEffectModifier extends Modifier {
  type: ModifierType.STATUS_EFFECT;

  // 状态效果类型
  effectType: StatusEffectType;

  // DoT效果配置
  tickInterval?: number;    // 触发间隔（毫秒）
  lastTickTime?: number;    // 上次触发时间

  // 元素类型
  element?: Element;

  // 效果值
  effectValue: number;      // 效果强度（如减速百分比、伤害值等）
}

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
```

### 5.2 状态效果示例

**燃烧效果**：

```typescript
const burnEffect: StatusEffectModifier = {
  id: 'burn_123',
  type: ModifierType.STATUS_EFFECT,
  effectType: StatusEffectType.BURN,
  operation: ModifierOp.ADD,
  value: 5,
  effectValue: 5,
  duration: 3000,
  remainingTime: 3000,
  tickInterval: 500,
  element: 'fire',
  source: 'fireball',
  tags: new Set(['burn', 'dot', 'fire', 'dispellable']),
  stacking: { policy: StackingPolicy.REFRESH_BY_SOURCE },

  onApply: (target) => {
    target.setTint(0xff8844); // 橙色
  },

  onUpdate: (target, delta) => {
    // 每500ms触发一次伤害
    target.takeDamage(5);
  },

  onRemove: (target) => {
    target.clearTint();
  }
};
```

**减速效果**：

```typescript
const slowEffect: StatusEffectModifier = {
  id: 'slow_456',
  type: ModifierType.STATUS_EFFECT,
  effectType: StatusEffectType.SLOW,
  operation: ModifierOp.PERCENT_ADD,
  value: -30, // -30%
  effectValue: 30,
  duration: 2000,
  remainingTime: 2000,
  source: 'ice_shard',
  tags: new Set(['slow', 'ice', 'dispellable']),
  stacking: { policy: StackingPolicy.SINGLE_INSTANCE },

  onApply: (target) => {
    target.setTint(0x88ddff); // 浅蓝色
  },

  onRemove: (target) => {
    target.clearTint();
  }
};
```

---

## 六、触发器系统

### 6.1 触发器修饰符

```typescript
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

export enum TriggerType {
  ON_HIT = 'on_hit',                 // 被击中时
  ON_DAMAGE_DEALT = 'on_damage_dealt', // 造成伤害时
  ON_KILL = 'on_kill',               // 击杀时
  ON_TAKE_DAMAGE = 'on_take_damage'  // 受到伤害时
}

export interface TriggerEffect {
  type: 'damage' | 'heal' | 'freeze' | 'reflect';
  value: number;
  target?: 'self' | 'attacker' | 'victim';
}
```

### 6.2 触发器示例

**火焰反击**：

```typescript
const flameCounter: TriggerModifier = {
  id: 'flame_counter',
  type: ModifierType.TRIGGER,
  triggerType: TriggerType.ON_HIT,
  maxTriggers: 5,
  remainingTriggers: 5,
  duration: 10000,
  remainingTime: 10000,
  source: 'flame_shield',
  tags: new Set(['counter', 'fire']),
  stacking: { policy: StackingPolicy.SINGLE_INSTANCE },
  triggerEffect: {
    type: 'damage',
    value: 20,
    target: 'attacker'
  },
  onApply: (target) => {
    // 显示火焰光环
    createFlameAura(target);
  },
  onRemove: (target) => {
    removeFlameAura(target);
  }
};
```

**触发执行**：

```typescript
// 在 CollisionSystem 中触发
function onPlayerHit(player: Player, enemy: Enemy, damage: number) {
  // 获取所有 ON_HIT 触发器
  const triggers = player.modifierStack.getTriggers(TriggerType.ON_HIT);

  for (const trigger of triggers) {
    if (trigger.remainingTriggers > 0) {
      // 执行触发效果
      executeTriggerEffect(trigger.triggerEffect, player, enemy);
      trigger.remainingTriggers--;
    }
  }
}
```

---

## 七、标签系统

### 7.1 标签的作用

标签系统用于：

1. **互斥检查**：防止冲突的 Buff 同时存在
2. **需求检查**：某些 Buff 需要特定条件
3. **快速查询**：通过标签快速筛选修饰符
4. **分类管理**：替代硬编码类型

### 7.2 标签使用示例

```typescript
// 定义标签
const tags = {
  // 效果类型
  BUFF: 'buff',
  DEBUFF: 'debuff',
  DOT: 'dot',
  CONTROL: 'control',

  // 元素
  FIRE: 'fire',
  ICE: 'ice',
  LIGHTNING: 'lightning',

  // 属性
  DAMAGE: 'damage',
  DEFENSE: 'defense',
  SPEED: 'speed',

  // 特殊
  DISPELLABLE: 'dispellable',
  IMMUNITY: 'immunity'
};

// 使用标签
const burnEffect: StatusEffectModifier = {
  // ...
  tags: new Set(['debuff', 'dot', 'fire', 'dispellable'])
};

// 互斥检查
const immunityEffect: StatusEffectModifier = {
  // ...
  tags: new Set(['buff', 'immunity', 'fire']),
  // 如果有 'immunity' 标签，阻止所有带 'fire' 标签的 debuff
};

// 查询
if (player.modifierStack.hasTag('immunity')) {
  // 免疫某些效果
}
```

---

## 八、技能系统协作

### 8.1 技能专属修饰符

技能实例持有自己的修饰符栈：

```typescript
export interface Skill {
  id: string;
  level: number;

  // 技能专属修饰符栈
  modifierStack: ModifierStack;

  // 基础属性
  baseValues: {
    damage: number;
    range: number;
    cooldown: number;
    projectileCount: number;
  };
}
```

### 8.2 技能升级系统

```typescript
// 技能升级时添加修饰符
function upgradeSkill(skill: Skill, option: SkillUpgradeOption): void {
  const modifier: AttributeModifier = {
    id: `upgrade_${option.id}`,
    type: ModifierType.ATTRIBUTE,
    operation: ModifierOp.PERCENT_ADD,
    value: option.modifiers?.damage || 0,
    priority: ModifierPriority.NORMAL,
    duration: -1, // 永久
    remainingTime: -1,
    source: `skill_upgrade_${option.id}`,
    tags: new Set(['skill_upgrade', 'permanent']),
    stacking: { policy: StackingPolicy.INDEPENDENT },
    targetAttribute: 'damage'
  };

  skill.modifierStack.addModifier(modifier);
}
```

### 8.3 伤害计算流程

```typescript
function calculateSkillDamage(skill: Skill, player: Player): number {
  let damage = skill.baseValues.damage;

  // 1. 应用技能自身的修饰符
  damage = skill.modifierStack.getAttributeValue('damage', damage);

  // 2. 应用玩家的修饰符
  damage = player.modifierStack.getAttributeValue('skill_damage', damage);

  return damage;
}
```

### 8.4 策略模式协作

```typescript
class FireballStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { player, scene } = context;

    // 1. 从修饰符栈获取最终伤害
    const finalDamage = calculateSkillDamage(skill, player);

    // 2. 创建投射物（策略负责行为）
    const projectile = this.createProjectile(scene, player, {
      damage: finalDamage,
      element: 'fire'
    });

    // 3. 命中时添加燃烧效果（策略触发修饰符添加）
    projectile.onHit = (enemy: Enemy) => {
      const burnEffect = createBurnEffect(skill, finalDamage);
      enemy.modifierStack.addModifier(burnEffect);
    };
  }
}
```

---

## 九、Player 和 Enemy 改造

### 9.1 Player 类改造

```typescript
export class Player extends Phaser.Physics.Arcade.Sprite implements IBuffable {
  public readonly modifierStack: ModifierStack;
  public readonly baseAttributes: Readonly<Record<string, number>>;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player_idle');

    // 初始化修饰符栈
    this.modifierStack = new ModifierStack(this);

    // 基础属性
    this.baseAttributes = {
      maxHp: 100,
      attack: 10,
      defense: 5,
      speed: 150,
      critRate: 0.05,
      critDamage: 1.5,
      lifesteal: 0
    };

    // ...
  }

  // 使用修饰符栈计算属性
  getEffectiveAttack(): number {
    return this.modifierStack.getAttributeValue(
      'attack',
      this.baseAttributes.attack
    );
  }

  getEffectiveSpeed(): number {
    return this.modifierStack.getAttributeValue(
      'speed',
      this.baseAttributes.speed
    );
  }

  update(delta: number): void {
    // 更新修饰符栈
    this.modifierStack.update(delta);

    // ...
  }

  // 实现接口方法
  onModifierAdded(modifier: Modifier): void {
    // 触发UI更新等
    this.scene.events.emit('modifierAdded', modifier);
  }

  onModifierRemoved(modifier: Modifier): void {
    this.scene.events.emit('modifierRemoved', modifier);
  }
}
```

### 9.2 Enemy 类改造

```typescript
export class Enemy extends Phaser.Physics.Arcade.Sprite implements IBuffable {
  public readonly modifierStack: ModifierStack;
  public baseAttributes: Record<string, number>;

  constructor(scene: Phaser.Scene, x: number, y: number, config: EnemyConfig) {
    super(scene, x, y, textureKey);

    this.modifierStack = new ModifierStack(this);

    this.baseAttributes = {
      hp: config.hp,
      damage: config.damage,
      speed: config.speed,
      defense: 0
    };

    // ...
  }

  isImmobilized(): boolean {
    return this.modifierStack.hasStatusEffect(StatusEffectType.FREEZE) ||
           this.modifierStack.hasStatusEffect(StatusEffectType.STUN) ||
           this.modifierStack.hasStatusEffect(StatusEffectType.ROOT);
  }

  update(time: number, delta: number): void {
    this.modifierStack.update(delta);

    const speed = this.modifierStack.getAttributeValue(
      'speed',
      this.baseAttributes.speed
    );

    // ...
  }
}
```

---

## 十、迁移策略

### 10.1 渐进式迁移

**阶段1：基础设施**
1. 实现 ModifierStack 核心类
2. 实现 IBuffable 接口
3. 创建修饰符工厂

**阶段2：Player 改造**
1. Player 实现 IBuffable
2. 保留旧接口，内部使用新系统
3. 逐步迁移现有 Buff 技能

**阶段3：Enemy 改造**
1. Enemy 实现 IBuffable
2. 迁移状态效果系统
3. 迁移触发器系统

**阶段4：技能系统**
1. 技能实例添加修饰符栈
2. 迁移技能升级系统
3. 删除旧代码

### 10.2 兼容性保证

```typescript
// 保留旧接口，内部转发到新系统
export class Player {
  // 旧接口（废弃但保留）
  /** @deprecated Use modifierStack.addModifier instead */
  addStatusEffect(effect: PlayerStatusEffect): void {
    const modifier = convertToModifier(effect);
    this.modifierStack.addModifier(modifier);
  }

  /** @deprecated Use modifierStack.hasStatusEffect instead */
  hasStatusEffect(type: string): boolean {
    return this.modifierStack.hasStatusEffect(type as StatusEffectType);
  }
}
```

---

## 十一、性能优化

### 11.1 脏标记优化

```typescript
export class ModifierStack {
  private dirtyFlags: Map<string, boolean> = new Map();
  private cachedValues: Map<string, number> = new Map();

  getAttributeValue(attributeName: string, baseValue: number): number {
    // 检查缓存
    if (!this.dirtyFlags.get(attributeName)) {
      return this.cachedValues.get(attributeName) || baseValue;
    }

    // 重新计算
    const value = this.calculateAttribute(attributeName, baseValue);

    // 更新缓存
    this.cachedValues.set(attributeName, value);
    this.dirtyFlags.set(attributeName, false);

    return value;
  }

  addModifier(modifier: Modifier): void {
    // ...
    // 标记相关属性为脏
    if (modifier.targetAttribute) {
      this.dirtyFlags.set(modifier.targetAttribute, true);
    }
  }
}
```

### 11.2 批量更新

```typescript
// 只在每帧更新一次
update(delta: number): void {
  // 批量处理所有修饰符
  this.processExpiredModifiers();
  this.processTickEffects();
}
```

---

## 十二、测试策略

### 12.1 单元测试

```typescript
describe('ModifierStack', () => {
  test('should calculate attribute correctly', () => {
    const stack = new ModifierStack(mockEntity);

    stack.addModifier({
      id: 'test1',
      type: ModifierType.ATTRIBUTE,
      operation: ModifierOp.ADD,
      value: 10,
      priority: 1,
      targetAttribute: 'attack',
      duration: -1,
      remainingTime: -1,
      tags: new Set(),
      stacking: { policy: StackingPolicy.INDEPENDENT }
    });

    expect(stack.getAttributeValue('attack', 100)).toBe(110);
  });

  test('should handle stacking correctly', () => {
    // ...
  });
});
```

### 12.2 集成测试

```typescript
test('fireball should apply burn effect', () => {
  const player = new Player(scene, 0, 0);
  const enemy = new Enemy(scene, 100, 0, enemyConfig);

  // 施放火球术
  skillSystem.useSkill('fireball');

  // 检查燃烧效果
  expect(enemy.modifierStack.hasStatusEffect(StatusEffectType.BURN)).toBe(true);
});
```

---

## 十三、优势总结

### 13.1 相比现有系统

| 方面 | 现有系统 | 新系统 |
|------|---------|--------|
| 代码重复 | Player/Enemy 各一套 | 统一 IBuffable 接口 |
| 类型扩展 | 硬编码类型 | 标签系统，易扩展 |
| 叠加规则 | 分散在各处 | 统一的 StackingPolicy |
| 技能升级 | 直接修改属性 | 修饰符栈，可撤销 |
| 性能 | 每次遍历数组 | 分类存储 + 脏标记 |

### 13.2 符合业界标准

- ✅ Unreal GAS 的属性聚合器模式
- ✅ Dota 2 的修饰符标签系统
- ✅ 数据驱动 + 策略模式分离
- ✅ 组合优于继承

---

## 十四、风险与缓解

### 14.1 风险

1. **大规模重构**：可能引入 bug
2. **性能回归**：新系统可能更慢
3. **学习成本**：团队需要理解新架构

### 14.2 缓解措施

1. **渐进式迁移**：保留旧接口，逐步迁移
2. **性能测试**：对比新旧系统性能
3. **文档完善**：提供详细文档和示例
4. **单元测试**：保证功能正确性

---

## 十五、后续扩展

### 15.1 可能的扩展方向

1. **可视化调试工具**：显示当前所有修饰符
2. **修饰符预设**：配置文件定义常见修饰符
3. **修饰符链**：修饰符可以触发其他修饰符
4. **条件修饰符**：基于条件的修饰符

### 15.2 配置化

```typescript
// 未来可以从配置文件加载
const BURN_EFFECT_CONFIG = {
  id: 'burn',
  type: 'status_effect',
  effectType: 'burn',
  duration: 3000,
  tickInterval: 500,
  tags: ['dot', 'fire', 'dispellable'],
  stacking: 'refresh_by_source'
};
```

---

## 附录

### A. 相关文件

- `src/entities/Player.ts` - 玩家类（待改造）
- `src/entities/Enemy.ts` - 敌人类（待改造）
- `src/strategies/SkillStrategy.ts` - 技能策略接口
- `src/strategies/skills/buff/BuffStrategies.ts` - Buff 策略实现
- `src/types/index.ts` - 类型定义

### B. 参考资料

- [Game Programming Patterns - Component Pattern](https://gameprogrammingpatterns.com/component.html)
- [Unreal Engine Gameplay Ability System](https://docs.unrealengine.com/5.0/en-US/gameplay-ability-system-for-unreal-engine/)
- [Dota 2 Modifier System](https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/Scripting/Abilities_and_Modifiers)

### C. 时间线

- **阶段1（1-2天）**：基础设施搭建
- **阶段2（2-3天）**：Player 类改造
- **阶段3（2-3天）**：Enemy 类改造
- **阶段4（1-2天）**：技能系统迁移
- **阶段5（1天）**：测试与优化

**总计**：7-11 个工作日
