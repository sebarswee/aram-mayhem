## Task 2: Enemy 实现 IBuffable 接口

**Files:**
- Modify: `src/entities/Enemy.ts`
- Test: `src/entities/__tests__/Enemy.modifiers.test.ts`

**Interfaces:**
- Consumes: `IBuffable` (from Task 1), `ModifierStack` (from Task 1)
- Produces: Enemy class implementing IBuffable with `modifierStack`, `baseAttributes`, `updateModifiers()`, `isActive`

- [ ] **Step 1: 添加导入语句**

在 `src/entities/Enemy.ts` 文件顶部添加：

```typescript
import { IBuffable } from '@/modifiers/interfaces/IBuffable';
import { ModifierStack } from '@/modifiers/core/ModifierStack';
```

- [ ] **Step 2: 修改类声明实现 IBuffable 接口**

将类声明从：
```typescript
export class Enemy extends Phaser.Physics.Arcade.Sprite {
```

修改为：
```typescript
export class Enemy extends Phaser.Physics.Arcade.Sprite implements IBuffable {
```

- [ ] **Step 3: 添加 modifierStack 属性**

在类属性部分添加（约第 73 行之后）：

```typescript
  // 新增：修饰符栈
  public readonly modifierStack: ModifierStack;
```

- [ ] **Step 4: 实现 baseAttributes 和 isActive getter**

在构造函数之前添加：

```typescript
  // IBuffable 要求的属性：基础属性（只读）
  public get baseAttributes(): Readonly<Record<string, number>> {
    return {
      maxHp: this.config.hp,
      damage: this.config.damage,
      speed: this.config.speed,
      defense: 0,
    };
  }

  // IBuffable 要求的属性：isActive
  public get isActive(): boolean {
    return this.active;
  }
```

- [ ] **Step 5: 在构造函数中初始化 modifierStack**

在构造函数中，`this.applyPassiveAbilities();` 之前添加：

```typescript
    // 初始化修饰符栈
    this.modifierStack = new ModifierStack(this);
```

- [ ] **Step 6: 实现 updateModifiers 方法**

在类方法部分添加（约第 315 行之后）：

```typescript
  // IBuffable 要求的方法：更新修饰符栈
  updateModifiers(delta: number): void {
    this.modifierStack.update(delta);
  }
```

- [ ] **Step 7: 修改 update 方法调用 updateModifiers**

在 `update(time: number, _delta: number)` 方法中，将：
```typescript
    // Update status effects (ticking)
    this.updateStatusEffects(time);
```

修改为：
```typescript
    // 更新修饰符栈（替代旧的 updateStatusEffects）
    this.updateModifiers(_delta);
```

- [ ] **Step 8: 创建测试文件**

创建文件 `src/entities/__tests__/Enemy.modifiers.test.ts`：

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { Enemy } from '../Enemy';
import { ModifierStack } from '@/modifiers/core/ModifierStack';
import { EnemyConfig, Element } from '@/types';

describe('Enemy - Modifier Integration', () => {
  let enemy: Enemy;
  let mockScene: any;
  let mockConfig: EnemyConfig;

  beforeEach(() => {
    mockScene = {
      add: { existing: () => {}, graphics: () => ({ setDepth: () => {} }) },
      physics: { add: { existing: () => {} } },
      textures: { exists: () => false },
      anims: { exists: () => false },
      tweens: { add: () => {} },
      time: { delayedCall: () => {} },
      events: { emit: () => {} },
      game: { loop: { delta: 16 } },
      cameras: { main: { shake: () => {} } },
    };

    mockConfig = {
      id: 'flame_slime',
      name: 'Flame Slime',
      type: 'normal',
      element: 'fire' as Element,
      hp: 100,
      damage: 10,
      speed: 50,
      expValue: 10,
      abilities: [],
    };

    enemy = new Enemy(mockScene, 100, 100, mockConfig);
  });

  it('should implement IBuffable interface', () => {
    expect(enemy.modifierStack).toBeInstanceOf(ModifierStack);
    expect(enemy.instanceId).toBeDefined();
  });

  it('should have baseAttributes getter', () => {
    const attrs = enemy.baseAttributes;
    expect(attrs).toHaveProperty('maxHp');
    expect(attrs).toHaveProperty('damage');
    expect(attrs).toHaveProperty('speed');
    expect(attrs).toHaveProperty('defense');
  });

  it('should have isActive property', () => {
    expect(enemy.isActive).toBe(true);
    enemy.setActive(false);
    expect(enemy.isActive).toBe(false);
  });

  it('should have updateModifiers method', () => {
    expect(typeof enemy.updateModifiers).toBe('function');
  });

  it('should update modifiers in update loop', () => {
    const updateSpy = vi.spyOn(enemy.modifierStack, 'update');
    enemy.update(0, 16);
    expect(updateSpy).toHaveBeenCalledWith(16);
  });
});
```

- [ ] **Step 9: 运行测试验证**

```bash
npm test src/entities/__tests__/Enemy.modifiers.test.ts
```

Expected: 所有测试通过

- [ ] **Step 10: 提交代码**

```bash
git add src/entities/Enemy.ts src/entities/__tests__/Enemy.modifiers.test.ts
git commit -m "feat(enemy): 实现 IBuffable 接口，集成修饰符系统"
```

---

