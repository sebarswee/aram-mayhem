## Task 1: Player 实现 IBuffable 接口

**Files:**
- Modify: `src/entities/Player.ts`
- Test: `src/entities/__tests__/Player.modifiers.test.ts`

**Interfaces:**
- Consumes: `IBuffable` (from `src/modifiers/interfaces/IBuffable.ts`), `ModifierStack` (from `src/modifiers/core/ModifierStack.ts`)
- Produces: Player class implementing IBuffable with `modifierStack`, `baseAttributes`, `updateModifiers()`, `id`, `isActive`

- [ ] **Step 1: 添加导入语句**

在 `src/entities/Player.ts` 文件顶部添加：

```typescript
import { IBuffable } from '@/modifiers/interfaces/IBuffable';
import { ModifierStack } from '@/modifiers/core/ModifierStack';
```

- [ ] **Step 2: 修改类声明实现 IBuffable 接口**

将类声明从：
```typescript
export class Player extends Phaser.Physics.Arcade.Sprite {
```

修改为：
```typescript
export class Player extends Phaser.Physics.Arcade.Sprite implements IBuffable {
```

- [ ] **Step 3: 添加 modifierStack 和 id 属性**

在类属性部分添加（约第 52 行之后）：

```typescript
  // 新增：修饰符栈
  public readonly modifierStack: ModifierStack;

  // 新增：实例 ID（用于 IBuffable.id）
  public readonly id: string;
```

- [ ] **Step 4: 实现 baseAttributes getter**

在构造函数之前添加：

```typescript
  // IBuffable 要求的属性：基础属性（只读）
  public get baseAttributes(): Readonly<Record<string, number>> {
    return {
      maxHp: this.stats.maxHp,
      attack: this.stats.attack,
      defense: this.stats.defense,
      speed: this.stats.speed,
      lifesteal: this.stats.lifesteal,
    };
  }

  // IBuffable 要求的属性：isActive
  public get isActive(): boolean {
    return this.active;
  }
```

- [ ] **Step 5: 在构造函数中初始化 modifierStack 和 id**

在构造函数中，`this.initializeElementResistance();` 之前添加：

```typescript
    // 初始化实例 ID
    this.id = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 初始化修饰符栈
    this.modifierStack = new ModifierStack(this);
```

- [ ] **Step 6: 实现 updateModifiers 方法**

在类方法部分添加（约第 823 行之前）：

```typescript
  // IBuffable 要求的方法：更新修饰符栈
  updateModifiers(delta: number): void {
    this.modifierStack.update(delta);
  }
```

- [ ] **Step 7: 修改 update 方法调用 updateModifiers**

在 `update(delta: number)` 方法中，将：
```typescript
    // 更新状态效果
    this.updateStatusEffects(delta);
```

修改为：
```typescript
    // 更新修饰符栈（替代旧的 updateStatusEffects）
    this.updateModifiers(delta);
```

- [ ] **Step 8: 创建测试文件**

创建文件 `src/entities/__tests__/Player.modifiers.test.ts`：

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { Player } from '../Player';
import { ModifierStack } from '@/modifiers/core/ModifierStack';

describe('Player - Modifier Integration', () => {
  let player: Player;
  let mockScene: any;

  beforeEach(() => {
    // 创建模拟场景
    mockScene = {
      add: { existing: () => {}, particles: () => ({ setDepth: () => {} }) },
      physics: { add: { existing: () => {} } },
      textures: { exists: () => false },
      anims: { exists: () => false },
      tweens: { add: () => {} },
      time: { delayedCall: () => {} },
      events: { emit: () => {} },
      game: { loop: { delta: 16 } },
    };

    player = new Player(mockScene, 100, 100);
  });

  it('should implement IBuffable interface', () => {
    expect(player.modifierStack).toBeInstanceOf(ModifierStack);
    expect(player.id).toBeDefined();
    expect(player.id).toMatch(/^player_/);
  });

  it('should have baseAttributes getter', () => {
    const attrs = player.baseAttributes;
    expect(attrs).toHaveProperty('maxHp');
    expect(attrs).toHaveProperty('attack');
    expect(attrs).toHaveProperty('defense');
    expect(attrs).toHaveProperty('speed');
    expect(attrs).toHaveProperty('lifesteal');
  });

  it('should have isActive property', () => {
    expect(player.isActive).toBe(true);
    player.setActive(false);
    expect(player.isActive).toBe(false);
  });

  it('should have updateModifiers method', () => {
    expect(typeof player.updateModifiers).toBe('function');
  });

  it('should update modifiers in update loop', () => {
    const updateSpy = vi.spyOn(player.modifierStack, 'update');
    player.update(16);
    expect(updateSpy).toHaveBeenCalledWith(16);
  });
});
```

- [ ] **Step 9: 运行测试验证**

```bash
npm test src/entities/__tests__/Player.modifiers.test.ts
```

Expected: 所有测试通过

- [ ] **Step 10: 提交代码**

```bash
git add src/entities/Player.ts src/entities/__tests__/Player.modifiers.test.ts
git commit -m "feat(player): 实现 IBuffable 接口，集成修饰符系统"
```

---

