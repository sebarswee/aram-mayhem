## Task 3: 创建视觉效果修饰符工厂

**Files:**
- Create: `src/modifiers/visual/VisualModifiers.ts`
- Test: `src/modifiers/visual/__tests__/VisualModifiers.test.ts`

**Interfaces:**
- Consumes: `StatusEffectModifier`, `StatusEffectType`, `ModifierType`, `ModifierOp`, `ModifierPriority`, `StackingPolicy` (from `src/modifiers/`)
- Produces: 10 visual modifier factory functions for all status effects

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p src/modifiers/visual/__tests__
```

- [ ] **Step 2: 创建 VisualModifiers.ts 文件（第1部分：导入和类型）**

创建文件 `src/modifiers/visual/VisualModifiers.ts`：

```typescript
// src/modifiers/visual/VisualModifiers.ts
import { StatusEffectModifier } from '../modifiers/StatusEffectModifier';
import { StatusEffectType } from '../modifiers/StatusEffectModifier';
import { ModifierType, ModifierOp, ModifierPriority, StackingPolicy } from '../interfaces/ModifierTypes';
import { IBuffable } from '../interfaces/IBuffable';
import { Player } from '@/entities/Player';
import { Enemy } from '@/entities/Enemy';
import { Element } from '@/types';

/**
 * 视觉效果修饰符工厂
 * 为每种状态效果创建包含视觉反馈的修饰符
 */
```

- [ ] **Step 3: 实现 createBurnVisualModifier**

在文件中添加：

```typescript

/**
 * 创建燃烧效果修饰符
 * @param value 每次tick的伤害值
 * @param duration 持续时间（毫秒）
 * @param element 元素类型（可选）
 */
export function createBurnVisualModifier(
  value: number,
  duration: number,
  element?: Element
): StatusEffectModifier {
  return {
    id: `burn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: ModifierType.STATUS_EFFECT,
    effectType: StatusEffectType.BURN,
    source: 'status_effect_system',
    operation: ModifierOp.ADD,
    value: value,
    effectValue: value,
    duration: duration,
    remainingTime: duration,
    priority: ModifierPriority.NORMAL,
    tags: new Set(['burn', 'dot', 'debuff']),
    stacking: {
      policy: StackingPolicy.REFRESH_BY_SOURCE,
      valueRefresh: true,
    },
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
        target.updateVisualTint();
      } else if (target instanceof Enemy) {
        target.applyElementTint();
      }
    },

    onUpdate: (target: IBuffable, delta: number) => {
      if (target instanceof Player) {
        target.takeDamage(value);
      } else if (target instanceof Enemy) {
        target.takeDamage(value);
      }
    },
  };
}
```

- [ ] **Step 4: 实现 createPoisonVisualModifier**

添加：

```typescript

/**
 * 创建中毒效果修饰符
 * @param value 每次tick的伤害值
 * @param duration 持续时间（毫秒）
 */
export function createPoisonVisualModifier(
  value: number,
  duration: number
): StatusEffectModifier {
  return {
    id: `poison_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: ModifierType.STATUS_EFFECT,
    effectType: StatusEffectType.POISON,
    source: 'status_effect_system',
    operation: ModifierOp.ADD,
    value: value,
    effectValue: value,
    duration: duration,
    remainingTime: duration,
    priority: ModifierPriority.NORMAL,
    tags: new Set(['poison', 'dot', 'debuff']),
    stacking: {
      policy: StackingPolicy.REFRESH_BY_SOURCE,
      valueRefresh: true,
    },
    tickInterval: 1000,
    lastTickTime: 0,

    onApply: (target: IBuffable) => {
      if (target instanceof Player) {
        target.setTint(0x44ff44); // 绿色着色
      } else if (target instanceof Enemy) {
        target.setTint(0x44ff44);
      }
    },

    onRemove: (target: IBuffable) => {
      if (target instanceof Player) {
        target.updateVisualTint();
      } else if (target instanceof Enemy) {
        target.applyElementTint();
      }
    },

    onUpdate: (target: IBuffable, delta: number) => {
      if (target instanceof Player) {
        target.takeDamage(value);
      } else if (target instanceof Enemy) {
        target.takeDamage(value);
      }
    },
  };
}
```

- [ ] **Step 5: 实现 createFreezeVisualModifier**

添加：

```typescript

/**
 * 创建冻结效果修饰符
 * @param duration 持续时间（毫秒）
 */
export function createFreezeVisualModifier(duration: number): StatusEffectModifier {
  return {
    id: `freeze_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: ModifierType.STATUS_EFFECT,
    effectType: StatusEffectType.FREEZE,
    source: 'status_effect_system',
    operation: ModifierOp.ADD,
    value: 0,
    effectValue: 0,
    duration: duration,
    remainingTime: duration,
    priority: ModifierPriority.HIGH,
    tags: new Set(['freeze', 'control', 'debuff']),
    stacking: {
      policy: StackingPolicy.REFRESH_BY_SOURCE,
    },

    onApply: (target: IBuffable) => {
      if (target instanceof Player) {
        target.setTint(0x88ddff); // 冰蓝色着色
      } else if (target instanceof Enemy) {
        target.setTint(0x88ddff);
      }
    },

    onRemove: (target: IBuffable) => {
      if (target instanceof Player) {
        target.updateVisualTint();
      } else if (target instanceof Enemy) {
        target.applyElementTint();
      }
    },
  };
}
```

- [ ] **Step 6: 实现 createStunVisualModifier**

添加：

```typescript

/**
 * 创建眩晕效果修饰符
 * @param duration 持续时间（毫秒）
 */
export function createStunVisualModifier(duration: number): StatusEffectModifier {
  return {
    id: `stun_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: ModifierType.STATUS_EFFECT,
    effectType: StatusEffectType.STUN,
    source: 'status_effect_system',
    operation: ModifierOp.ADD,
    value: 0,
    effectValue: 0,
    duration: duration,
    remainingTime: duration,
    priority: ModifierPriority.HIGH,
    tags: new Set(['stun', 'control', 'debuff']),
    stacking: {
      policy: StackingPolicy.REFRESH_BY_SOURCE,
    },

    onApply: (target: IBuffable) => {
      if (target instanceof Player) {
        target.setTint(0xffff00); // 黄色着色
      } else if (target instanceof Enemy) {
        target.setTint(0xffff00);
      }
    },

    onRemove: (target: IBuffable) => {
      if (target instanceof Player) {
        target.updateVisualTint();
      } else if (target instanceof Enemy) {
        target.applyElementTint();
      }
    },
  };
}
```

- [ ] **Step 7: 实现 createRootVisualModifier**

添加：

```typescript

/**
 * 创建定身效果修饰符
 * @param duration 持续时间（毫秒）
 */
export function createRootVisualModifier(duration: number): StatusEffectModifier {
  return {
    id: `root_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: ModifierType.STATUS_EFFECT,
    effectType: StatusEffectType.ROOT,
    source: 'status_effect_system',
    operation: ModifierOp.ADD,
    value: 0,
    effectValue: 0,
    duration: duration,
    remainingTime: duration,
    priority: ModifierPriority.NORMAL,
    tags: new Set(['root', 'control', 'debuff']),
    stacking: {
      policy: StackingPolicy.REFRESH_BY_SOURCE,
    },

    onRemove: (target: IBuffable) => {
      // 定身没有视觉效果，仅由移动逻辑检查
    },
  };
}
```

- [ ] **Step 8: 实现 createSlowVisualModifier**

添加：

```typescript

/**
 * 创建减速效果修饰符
 * @param value 减速百分比（0-100）
 * @param duration 持续时间（毫秒）
 */
export function createSlowVisualModifier(
  value: number,
  duration: number
): StatusEffectModifier {
  return {
    id: `slow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: ModifierType.STATUS_EFFECT,
    effectType: StatusEffectType.SLOW,
    source: 'status_effect_system',
    operation: ModifierOp.ADD,
    value: value,
    effectValue: value,
    duration: duration,
    remainingTime: duration,
    priority: ModifierPriority.NORMAL,
    tags: new Set(['slow', 'debuff']),
    stacking: {
      policy: StackingPolicy.REFRESH_BY_SOURCE,
      valueRefresh: true,
    },

    onRemove: (target: IBuffable) => {
      // 减速没有视觉效果，由 getSpeedMultiplier() 计算
    },
  };
}
```

- [ ] **Step 9: 实现 createAttackBoostVisualModifier**

添加：

```typescript

/**
 * 创建攻击加成效果修饰符
 * @param value 攻击力加成百分比
 * @param duration 持续时间（毫秒）
 */
export function createAttackBoostVisualModifier(
  value: number,
  duration: number
): StatusEffectModifier {
  return {
    id: `attack_boost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: ModifierType.STATUS_EFFECT,
    effectType: StatusEffectType.ATTACK_BOOST,
    source: 'status_effect_system',
    operation: ModifierOp.ADD,
    value: value,
    effectValue: value,
    duration: duration,
    remainingTime: duration,
    priority: ModifierPriority.NORMAL,
    tags: new Set(['attack_boost', 'buff']),
    stacking: {
      policy: StackingPolicy.REFRESH_BY_SOURCE,
      valueRefresh: true,
    },

    onApply: (target: IBuffable) => {
      if (target instanceof Player) {
        target.setTint(0xff4444); // 红色着色
      }
    },

    onRemove: (target: IBuffable) => {
      if (target instanceof Player) {
        target.updateVisualTint();
      }
    },
  };
}
```

- [ ] **Step 10: 实现 createSpeedBoostVisualModifier**

添加：

```typescript

/**
 * 创建速度加成效果修饰符
 * @param value 速度加成百分比
 * @param duration 持续时间（毫秒）
 */
export function createSpeedBoostVisualModifier(
  value: number,
  duration: number
): StatusEffectModifier {
  return {
    id: `speed_boost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: ModifierType.STATUS_EFFECT,
    effectType: StatusEffectType.SPEED_BOOST,
    source: 'status_effect_system',
    operation: ModifierOp.ADD,
    value: value,
    effectValue: value,
    duration: duration,
    remainingTime: duration,
    priority: ModifierPriority.NORMAL,
    tags: new Set(['speed_boost', 'buff']),
    stacking: {
      policy: StackingPolicy.REFRESH_BY_SOURCE,
      valueRefresh: true,
    },

    onApply: (target: IBuffable) => {
      if (target instanceof Player) {
        target.createSpeedTrailParticles();
      }
    },

    onRemove: (target: IBuffable) => {
      if (target instanceof Player) {
        const emitter = target.getParticleEmitter('speed_trail');
        if (emitter) {
          emitter.destroy();
        }
      }
    },
  };
}
```

- [ ] **Step 11: 实现 createDefenseBreakVisualModifier**

添加：

```typescript

/**
 * 创建破甲效果修饰符
 * @param value 破甲百分比（增加受到的伤害）
 * @param duration 持续时间（毫秒）
 */
export function createDefenseBreakVisualModifier(
  value: number,
  duration: number
): StatusEffectModifier {
  return {
    id: `defense_break_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: ModifierType.STATUS_EFFECT,
    effectType: StatusEffectType.DEFENSE_BREAK,
    source: 'status_effect_system',
    operation: ModifierOp.ADD,
    value: value,
    effectValue: value,
    duration: duration,
    remainingTime: duration,
    priority: ModifierPriority.NORMAL,
    tags: new Set(['defense_break', 'debuff']),
    stacking: {
      policy: StackingPolicy.REFRESH_BY_SOURCE,
      valueRefresh: true,
    },

    onRemove: (target: IBuffable) => {
      // 破甲没有视觉效果，由 takeDamage 计算
    },
  };
}
```

- [ ] **Step 12: 实现 createShieldVisualModifier（特殊处理）**

添加：

```typescript

/**
 * 创建护盾效果修饰符
 * 注意：护盾是独立数值，不纳入属性计算，这里仅作为效果标记
 * @param value 护盾值
 */
export function createShieldVisualModifier(value: number): StatusEffectModifier {
  return {
    id: `shield_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: ModifierType.STATUS_EFFECT,
    effectType: StatusEffectType.SHIELD,
    source: 'status_effect_system',
    operation: ModifierOp.ADD,
    value: value,
    effectValue: value,
    duration: -1, // 护盾无时间限制，由伤害消耗
    remainingTime: -1,
    priority: ModifierPriority.NORMAL,
    tags: new Set(['shield', 'buff']),

    onApply: (target: IBuffable) => {
      if (target instanceof Player) {
        target.addShield(value);
      } else if (target instanceof Enemy) {
        target.addShield(value);
      }
    },

    onRemove: (target: IBuffable) => {
      // 护盾由伤害逻辑移除，这里不需要处理
    },
  };
}
```

- [ ] **Step 13: 导出所有工厂函数**

在文件末尾添加导出（已在各步骤中完成）。

- [ ] **Step 14: 创建测试文件**

创建文件 `src/modifiers/visual/__tests__/VisualModifiers.test.ts`：

```typescript
import { describe, it, expect } from 'vitest';
import {
  createBurnVisualModifier,
  createPoisonVisualModifier,
  createFreezeVisualModifier,
  createStunVisualModifier,
  createRootVisualModifier,
  createSlowVisualModifier,
  createAttackBoostVisualModifier,
  createSpeedBoostVisualModifier,
  createDefenseBreakVisualModifier,
  createShieldVisualModifier,
} from '../VisualModifiers';
import { StatusEffectType } from '@/modifiers/modifiers/StatusEffectModifier';
import { ModifierType } from '@/modifiers/interfaces/ModifierTypes';

describe('Visual Modifiers', () => {
  describe('createBurnVisualModifier', () => {
    it('should create burn modifier with correct properties', () => {
      const modifier = createBurnVisualModifier(10, 3000);

      expect(modifier.type).toBe(ModifierType.STATUS_EFFECT);
      expect(modifier.effectType).toBe(StatusEffectType.BURN);
      expect(modifier.value).toBe(10);
      expect(modifier.duration).toBe(3000);
      expect(modifier.tags.has('burn')).toBe(true);
      expect(modifier.tags.has('dot')).toBe(true);
      expect(modifier.tags.has('debuff')).toBe(true);
      expect(modifier.tickInterval).toBe(500);
      expect(modifier.onApply).toBeDefined();
      expect(modifier.onRemove).toBeDefined();
      expect(modifier.onUpdate).toBeDefined();
    });
  });

  describe('createPoisonVisualModifier', () => {
    it('should create poison modifier with correct properties', () => {
      const modifier = createPoisonVisualModifier(5, 5000);

      expect(modifier.effectType).toBe(StatusEffectType.POISON);
      expect(modifier.value).toBe(5);
      expect(modifier.duration).toBe(5000);
      expect(modifier.tickInterval).toBe(1000);
      expect(modifier.tags.has('poison')).toBe(true);
    });
  });

  describe('createFreezeVisualModifier', () => {
    it('should create freeze modifier with correct properties', () => {
      const modifier = createFreezeVisualModifier(2000);

      expect(modifier.effectType).toBe(StatusEffectType.FREEZE);
      expect(modifier.duration).toBe(2000);
      expect(modifier.tags.has('freeze')).toBe(true);
      expect(modifier.tags.has('control')).toBe(true);
    });
  });

  describe('createStunVisualModifier', () => {
    it('should create stun modifier with correct properties', () => {
      const modifier = createStunVisualModifier(1500);

      expect(modifier.effectType).toBe(StatusEffectType.STUN);
      expect(modifier.duration).toBe(1500);
      expect(modifier.tags.has('stun')).toBe(true);
    });
  });

  describe('createRootVisualModifier', () => {
    it('should create root modifier with correct properties', () => {
      const modifier = createRootVisualModifier(3000);

      expect(modifier.effectType).toBe(StatusEffectType.ROOT);
      expect(modifier.duration).toBe(3000);
      expect(modifier.tags.has('root')).toBe(true);
    });
  });

  describe('createSlowVisualModifier', () => {
    it('should create slow modifier with correct properties', () => {
      const modifier = createSlowVisualModifier(30, 4000);

      expect(modifier.effectType).toBe(StatusEffectType.SLOW);
      expect(modifier.value).toBe(30);
      expect(modifier.duration).toBe(4000);
      expect(modifier.tags.has('slow')).toBe(true);
    });
  });

  describe('createAttackBoostVisualModifier', () => {
    it('should create attack boost modifier with correct properties', () => {
      const modifier = createAttackBoostVisualModifier(50, 5000);

      expect(modifier.effectType).toBe(StatusEffectType.ATTACK_BOOST);
      expect(modifier.value).toBe(50);
      expect(modifier.tags.has('attack_boost')).toBe(true);
      expect(modifier.tags.has('buff')).toBe(true);
    });
  });

  describe('createSpeedBoostVisualModifier', () => {
    it('should create speed boost modifier with correct properties', () => {
      const modifier = createSpeedBoostVisualModifier(30, 3000);

      expect(modifier.effectType).toBe(StatusEffectType.SPEED_BOOST);
      expect(modifier.value).toBe(30);
      expect(modifier.tags.has('speed_boost')).toBe(true);
    });
  });

  describe('createDefenseBreakVisualModifier', () => {
    it('should create defense break modifier with correct properties', () => {
      const modifier = createDefenseBreakVisualModifier(20, 5000);

      expect(modifier.effectType).toBe(StatusEffectType.DEFENSE_BREAK);
      expect(modifier.value).toBe(20);
      expect(modifier.tags.has('defense_break')).toBe(true);
    });
  });

  describe('createShieldVisualModifier', () => {
    it('should create shield modifier with correct properties', () => {
      const modifier = createShieldVisualModifier(100);

      expect(modifier.effectType).toBe(StatusEffectType.SHIELD);
      expect(modifier.value).toBe(100);
      expect(modifier.duration).toBe(-1); // 无时间限制
      expect(modifier.tags.has('shield')).toBe(true);
    });
  });
});
```

- [ ] **Step 15: 运行测试验证**

```bash
npm test src/modifiers/visual/__tests__/VisualModifiers.test.ts
```

Expected: 所有测试通过

- [ ] **Step 16: 提交代码**

```bash
git add src/modifiers/visual/
git commit -m "feat(modifiers): 创建视觉效果修饰符工厂"
```

---

