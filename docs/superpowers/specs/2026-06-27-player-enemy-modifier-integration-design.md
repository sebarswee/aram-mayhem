# Player 和 Enemy 集成到修饰符系统设计文档

## 目标

将 Player 和 Enemy 类集成到新的修饰符系统，实现 IBuffable 接口，统一状态效果管理。

## 架构概览

```
┌─────────────────────────────────────────────────────────┐
│                    IBuffable 接口                        │
│  - modifierStack: ModifierStack                         │
│  - baseAttributes: Readonly<Record<string, number>>     │
│  - updateModifiers(delta: number): void                 │
│  - onModifierAdded?(modifier: Modifier): void           │
│  - onModifierRemoved?(modifier: Modifier): void         │
└─────────────────────────────────────────────────────────┘
                          ↑
                          │ implements
            ┌─────────────┴─────────────┐
            │                           │
    ┌───────┴────────┐         ┌────────┴───────┐
    │     Player     │         │     Enemy      │
    │                │         │                │
    │ - stats        │         │ - config       │
    │ - modifierStack│         │ - modifierStack│
    │                │         │                │
    │ 便捷方法：      │         │ 便捷方法：      │
    │ - hasEffect()  │         │ - hasEffect()  │
    │ - getSpeed()   │         │ - getSpeed()   │
    │ - getAttack()  │         │ - isImmobilized│
    └────────────────┘         └────────────────┘
```

## 关键设计决策

### 1. 迁移策略：完全替换

- 完全移除旧的 `statusEffects` 系统和 `updateStatusEffects()` 方法
- 所有状态效果统一使用 ModifierStack
- 代码更简洁，无冗余

### 2. 视觉效果：完全解耦

- 视觉效果逻辑（着色、粒子等）移入修饰符的 `onApply`/`onRemove` 回调
- 使用 ModifierStack.hasTag() 检查效果类型
- 每种状态效果创建专门的修饰符工厂

### 3. 外部接口：封装便捷方法

- Player/Enemy 提供便捷方法，内部调用 modifierStack
- 外部代码无需直接访问 modifierStack
- 保持良好的封装性

## 核心设计

### 基础属性映射

#### Player
```typescript
baseAttributes = {
  maxHp: stats.maxHp,
  attack: stats.attack,
  defense: stats.defense,
  speed: stats.speed,
  lifesteal: stats.lifesteal,
}
```

#### Enemy
```typescript
baseAttributes = {
  maxHp: config.hp,
  damage: config.damage,
  speed: config.speed,
  defense: 0,
}
```

### 视觉效果修饰符工厂

创建 `src/modifiers/visual/VisualModifiers.ts`，为每种状态效果提供工厂方法：

#### Burn 修饰符示例
```typescript
export function createBurnVisualModifier(
  value: number,
  duration: number,
  element?: Element
): StatusEffectModifier {
  return {
    id: `burn_visual_${Date.now()}`,
    type: ModifierType.STATUS_EFFECT,
    effectType: StatusEffectType.BURN,
    source: 'visual_system',
    operation: ModifierOp.ADD,
    value: value,
    effectValue: value,
    duration: duration,
    remainingTime: duration,
    priority: ModifierPriority.NORMAL,
    tags: new Set(['burn', 'dot', 'debuff']),
    stacking: { policy: StackingPolicy.REFRESH_BY_SOURCE },
    tickInterval: 500,
    lastTickTime: 0,
    element: element,

    onApply: (target: IBuffable) => {
      if (target instanceof Player) {
        target.setTint(0xff8844); // 橙色着色
      } else if (target instanceof Enemy) {
        target.setTint(0xff8844);
      }
    },

    onRemove: (target: IBuffable) => {
      if (target instanceof Player) {
        target.updateVisualTint(); // 恢复正常着色
      } else if (target instanceof Enemy) {
        target.applyElementTint();
      }
    },

    onUpdate: (target: IBuffable, delta: number) => {
      // DoT 伤害逻辑（每 500ms 触发一次）
      if (target instanceof Player) {
        target.takeDamage(value);
      } else if (target instanceof Enemy) {
        target.takeDamage(value);
      }
    },
  };
}
```

#### 需要实现的修饰符工厂

1. **DoT 效果**
   - `createBurnVisualModifier(value, duration, element?)` - 燃烧
   - `createPoisonVisualModifier(value, duration)` - 中毒

2. **控制效果**
   - `createFreezeVisualModifier(duration)` - 冻结
   - `createStunVisualModifier(duration)` - 眩晕
   - `createRootVisualModifier(duration)` - 定身
   - `createSlowVisualModifier(value, duration)` - 减速

3. **增益效果**
   - `createAttackBoostVisualModifier(value, duration)` - 攻击加成
   - `createSpeedBoostVisualModifier(value, duration)` - 速度加成
   - `createShieldVisualModifier(value)` - 护盾

4. **特殊效果**
   - `createDefenseBreakVisualModifier(value, duration)` - 破甲

### Player 类实现

#### 新增属性和方法
```typescript
export class Player extends Phaser.Physics.Arcade.Sprite implements IBuffable {
  // 新增：修饰符栈
  public readonly modifierStack: ModifierStack;

  // 新增：实例 ID（用于 IBuffable.id）
  public readonly id: string;

  // 新增：基础属性（只读）
  public get baseAttributes(): Readonly<Record<string, number>> {
    return {
      maxHp: this.stats.maxHp,
      attack: this.stats.attack,
      defense: this.stats.defense,
      speed: this.stats.speed,
      lifesteal: this.stats.lifesteal,
    };
  }

  // 新增：isActive 属性（用于 IBuffable）
  public get isActive(): boolean {
    return this.active;
  }

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, textureKey);

    // 初始化实例 ID
    this.id = `player_${Date.now()}`;

    // 初始化修饰符栈
    this.modifierStack = new ModifierStack(this);

    // ... 其他初始化代码
  }

  // IBuffable 要求的方法
  updateModifiers(delta: number): void {
    this.modifierStack.update(delta);
  }

  // 便捷方法：检查是否有特定标签的效果
  hasStatusEffect(tag: string): boolean {
    return this.modifierStack.hasTag(tag);
  }

  // 便捷方法：获取计算后的速度
  getEffectiveSpeed(): number {
    const baseSpeed = this.stats.speed;
    return this.modifierStack.getAttributeValue('speed', baseSpeed);
  }

  // 便捷方法：获取计算后的攻击力
  getEffectiveAttack(): number {
    const baseAttack = this.stats.attack;
    return this.modifierStack.getAttributeValue('attack', baseAttack);
  }

  update(delta: number): void {
    // 更新修饰符栈（替代旧的 updateStatusEffects）
    this.updateModifiers(delta);

    // ... 其他更新逻辑
  }
}
```

#### 移除的旧代码
- `statusEffects: PlayerStatusEffect[]` 数组
- `statusEffectTickTimers: Map<string, number>` 计时器
- `updateStatusEffects(delta: number)` 方法
- `PlayerStatusEffect` 接口定义

### Enemy 类实现

#### 新增属性和方法
```typescript
export class Enemy extends Phaser.Physics.Arcade.Sprite implements IBuffable {
  // 新增：修饰符栈
  public readonly modifierStack: ModifierStack;

  // 新增：基础属性（只读）
  public get baseAttributes(): Readonly<Record<string, number>> {
    return {
      maxHp: this.config.hp,
      damage: this.config.damage,
      speed: this.config.speed,
      defense: 0,
    };
  }

  // 新增：isActive 属性（用于 IBuffable）
  public get isActive(): boolean {
    return this.active;
  }

  constructor(scene: Phaser.Scene, x: number, y: number, config: EnemyConfig) {
    super(scene, x, y, textureKey);

    // 初始化修饰符栈
    this.modifierStack = new ModifierStack(this);

    // ... 其他初始化代码
  }

  // IBuffable 要求的方法
  updateModifiers(delta: number): void {
    this.modifierStack.update(delta);
  }

  // 便捷方法：检查是否被定身
  isImmobilized(): boolean {
    return this.modifierStack.hasTag('freeze') ||
           this.modifierStack.hasTag('stun') ||
           this.modifierStack.hasTag('root');
  }

  // 便捷方法：获取速度乘数
  private getSpeedMultiplier(): number {
    if (this.modifierStack.hasTag('slow')) {
      const slowValue = this.modifierStack.getStatusEffectValue(StatusEffectType.SLOW);
      return 1 - slowValue / 100;
    }
    return 1;
  }

  update(time: number, delta: number): void {
    // 更新修饰符栈（替代旧的 updateStatusEffects）
    this.updateModifiers(delta);

    // ... 其他更新逻辑
  }
}
```

#### 移除的旧代码
- `statusEffects: StatusEffect[]` 数组
- `lastDotTickTime: Record<string, number>` 计时器
- `updateStatusEffects(time: number)` 方法
- `StatusEffect` 接口定义
- `EFFECT_PRIORITY` 常量

## 实现步骤

### Task 1: Player 和 Enemy 实现 IBuffable 接口

**文件：**
- 修改: `src/entities/Player.ts`
- 修改: `src/entities/Enemy.ts`

**要求：**
1. 添加 `modifierStack: ModifierStack` 属性
2. 添加 `id: string` 属性（Player）
3. 实现 `baseAttributes` getter
4. 实现 `updateModifiers(delta: number)` 方法
5. 实现 `isActive` getter
6. 在构造函数中初始化 modifierStack
7. 在 update() 方法中调用 `this.updateModifiers(delta)`

**测试：**
- TypeScript 编译通过
- 验证接口实现正确

### Task 2: 创建视觉效果修饰符工厂

**文件：**
- 创建: `src/modifiers/visual/VisualModifiers.ts`
- 创建: `src/modifiers/visual/__tests__/VisualModifiers.test.ts`

**要求：**
1. 实现 `createBurnVisualModifier(value, duration, element?)`
2. 实现 `createPoisonVisualModifier(value, duration)`
3. 实现 `createFreezeVisualModifier(duration)`
4. 实现 `createStunVisualModifier(duration)`
5. 实现 `createRootVisualModifier(duration)`
6. 实现 `createSlowVisualModifier(value, duration)`
7. 实现 `createAttackBoostVisualModifier(value, duration)`
8. 实现 `createSpeedBoostVisualModifier(value, duration)`
9. 实现 `createShieldVisualModifier(value)`
10. 实现 `createDefenseBreakVisualModifier(value, duration)`

每个修饰符必须包含：
- 正确的类型和标签
- `onApply` 回调：应用视觉效果（着色、粒子等）
- `onRemove` 回调：移除视觉效果
- `onUpdate` 回调（DoT 效果）：每 tick 造成的伤害

**测试：**
- 验证修饰符创建正确
- 验证生命周期回调被正确调用

### Task 3: 实现便捷方法

**文件：**
- 修改: `src/entities/Player.ts`
- 修改: `src/entities/Enemy.ts`
- 创建: `src/entities/__tests__/Player.modifiers.test.ts`
- 创建: `src/entities/__tests__/Enemy.modifiers.test.ts`

**Player 便捷方法：**
- `hasStatusEffect(tag: string): boolean`
- `getEffectiveSpeed(): number`
- `getEffectiveAttack(): number`
- 保留 `updateVisualTint()` 方法（由修饰符 onRemove 调用）

**Enemy 便捷方法：**
- `hasStatusEffect(tag: string): boolean`
- `isImmobilized(): boolean`
- `getSpeedMultiplier(): number`
- 保留 `applyElementTint()` 方法（由修饰符 onRemove 调用）

**测试：**
- 验证便捷方法正确调用 ModifierStack
- 验证属性计算正确（基础值 + 修饰符）

### Task 4: 迁移技能使用新修饰符系统

**文件：**
- 修改所有技能策略文件（约 20+ 文件）

**要求：**
1. 替换 `player.addStatusEffect()` 为 `player.modifierStack.addModifier(createXxxVisualModifier(...))`
2. 替换 `enemy.addStatusEffect()` 为 `enemy.modifierStack.addModifier(createXxxVisualModifier(...))`
3. 更新所有状态效果应用逻辑
4. 确保参数正确传递（value, duration, element 等）

**示例迁移：**
```typescript
// 旧代码
player.addStatusEffect({
  type: 'burn',
  value: 10,
  duration: 3000,
});

// 新代码
player.modifierStack.addModifier(
  createBurnVisualModifier(10, 3000)
);
```

**测试：**
- 运行所有技能测试
- 验证技能效果正常工作
- 验证视觉效果正确应用

### Task 5: 移除旧的状态效果代码

**文件：**
- 修改: `src/entities/Player.ts`
- 修改: `src/entities/Enemy.ts`
- 修改: `src/types/index.ts`（移除接口定义）

**Player 移除项：**
1. `statusEffects: PlayerStatusEffect[]` 属性
2. `statusEffectTickTimers: Map<string, number>` 属性
3. `updateStatusEffects(delta: number)` 方法（内部逻辑完全移除）
4. 移除 `PlayerStatusEffect` 接口定义

**Player 保留但重构的方法：**
- `addStatusEffect(effect)` - 保留方法签名，内部改为调用 modifierStack.addModifier()
- `clearDebuffs()` - 保留方法签名，内部改为使用 modifierStack.removeModifier()

**Enemy 移除项：**
1. `statusEffects: StatusEffect[]` 属性
2. `lastDotTickTime: Record<string, number>` 属性
3. `updateStatusEffects(time: number)` 方法（内部逻辑完全移除）
4. `EFFECT_PRIORITY` 常量
5. 移除 `StatusEffect` 接口定义

**Enemy 保留但重构的方法：**
- `addStatusEffect(effect)` - 保留方法签名，内部改为调用 modifierStack.addModifier()

**注意：**
- `addStatusEffect()` 方法可以保留作为便捷方法，内部调用 modifierStack
- `takeDamage()` 方法中的护盾逻辑保留
- 反弹和反击效果暂时保留现有实现

**测试：**
- TypeScript 编译通过
- 运行完整测试套件
- 验证无引用错误

### Task 6: 代码审计和最终验证

**审计步骤：**

1. **搜索残留代码：**
   ```bash
   grep -r "statusEffects" src/
   grep -r "updateStatusEffects" src/
   grep -r "PlayerStatusEffect" src/
   grep -r "StatusEffect" src/ (排除新定义)
   ```

2. **TypeScript 编译检查：**
   ```bash
   npm run build
   ```

3. **运行完整测试套件：**
   ```bash
   npm test
   ```

4. **游戏功能测试：**
   - 手动测试所有技能效果
   - 验证状态效果视觉效果正确
   - 验证 DoT 伤害正常
   - 验证控制效果正常（冻结、眩晕、定身）
   - 验证增益效果正常（攻击加成、速度加成）

**验证清单：**
- [ ] 无 `statusEffects` 数组残留引用
- [ ] 无 `updateStatusEffects` 方法残留引用
- [ ] 无旧接口定义残留
- [ ] TypeScript 编译通过，无错误
- [ ] 所有测试通过
- [ ] 游戏功能正常
- [ ] 视觉效果正确应用和移除

## 数据流

### 应用燃烧效果流程

```
1. 技能调用
   player.modifierStack.addModifier(createBurnVisualModifier(10, 3000))

2. ModifierStack.addModifier()
   - 验证修饰符
   - 处理叠加规则
   - 存储到 statusEffects Map
   - 更新标签索引
   - 调用 modifier.onApply(player)

3. BurnVisualModifier.onApply()
   - player.setTint(0xff8844) // 应用橙色着色

4. 游戏循环中
   player.update(delta)
     → this.updateModifiers(delta)
       → modifierStack.update(delta)
         - 检查 DoT tick
         - 调用 modifier.onUpdate(player, tickInterval)
           → player.takeDamage(10)
         - 检查是否过期

5. 修饰符过期
   modifierStack.removeModifier(id)
     - 从 statusEffects Map 移除
     - 调用 modifier.onRemove(player)

6. BurnVisualModifier.onRemove()
   - player.updateVisualTint() // 恢复正常着色
```

### 获取计算后的速度

```
player.getEffectiveSpeed()
  → modifierStack.getAttributeValue('speed', baseSpeed)
    - 获取所有 speed 相关的属性修饰符
    - 按优先级排序
    - Phase 1: ADD 操作（减速）
    - Phase 2: MULTIPLY 操作
    - Phase 3: OVERRIDE 操作
    - 返回最终值
```

## 兼容性考虑

### 反弹和反击效果

当前设计中，反弹和反击效果暂时保留现有实现：
- `Player.reflectEffects` 数组
- `Player.counterDamageEffects` 数组
- `Player.counterFreezeEffects` 数组

这些可以后续迁移到 TriggerModifier 系统。

### 护盾系统

护盾值仍然由 `Player.shieldValue` 和 `Enemy.shieldValue` 管理，不纳入修饰符系统（因为护盾是独立数值，不是属性修改）。

## 风险和注意事项

1. **性能影响：** ModifierStack.update() 每帧调用，需要确保性能优化
2. **视觉效果冲突：** 多个状态效果同时存在时，着色优先级需要正确处理
3. **技能兼容性：** 所有技能都需要更新，工作量大
4. **测试覆盖：** 需要全面的测试确保功能正常

## 成功标准

1. ✅ Player 和 Enemy 正确实现 IBuffable 接口
2. ✅ 所有状态效果通过 ModifierStack 管理
3. ✅ 视觉效果通过修饰符回调正确应用
4. ✅ 无旧代码残留
5. ✅ 所有测试通过
6. ✅ 游戏功能正常
7. ✅ TypeScript 编译无错误
