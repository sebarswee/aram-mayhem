## Task 5: 迁移技能使用新修饰符系统

**Files:**
- Modify: 所有技能策略文件（约 19 个文件）
- List of files:
  - `src/strategies/skills/area/fire/*.ts`
  - `src/strategies/skills/area/water/*.ts`
  - `src/strategies/skills/area/ice/*.ts`
  - `src/strategies/skills/area/lightning/*.ts`
  - `src/strategies/skills/area/holy/*.ts`
  - `src/strategies/skills/area/shadow/*.ts`
  - `src/strategies/skills/area/grass/*.ts`
  - `src/strategies/skills/area/earth/*.ts`
  - `src/strategies/skills/ultimate/UltimateStrategies.ts`

**Interfaces:**
- Consumes: Visual modifier factories from Task 3
- Produces: All skills using new modifier system instead of `addStatusEffect()`

由于技能文件较多，这个任务将拆分为多个子步骤，每个元素类型的技能一个步骤。

- [ ] **Step 1: 添加导入语句到所有技能文件**

在每个技能文件顶部添加：

```typescript
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
} from '@/modifiers/visual/VisualModifiers';
```

- [ ] **Step 2: 迁移 Fire 元素技能**

找到所有调用 `enemy.addStatusEffect()` 或 `player.addStatusEffect()` 的地方，替换为新修饰符。

示例（FlameWaveStrategy）：
```typescript
// 旧代码
enemy.addStatusEffect({
  type: 'burn',
  value: damage * 0.1,
  duration: 3000,
  element: 'fire',
});

// 新代码
enemy.modifierStack.addModifier(
  createBurnVisualModifier(damage * 0.1, 3000, 'fire')
);
```

- [ ] **Step 3: 迁移 Ice 元素技能**

示例（FrozenOrbStrategy）：
```typescript
// 旧代码
enemy.addStatusEffect({
  type: 'freeze',
  value: 0,
  duration: 1500,
});

// 新代码
enemy.modifierStack.addModifier(
  createFreezeVisualModifier(1500)
);
```

- [ ] **Step 4: 迁移 Lightning 元素技能**

- [ ] **Step 5: 迁移 Water 元素技能**

- [ ] **Step 6: 迁移 Holy 元素技能**

- [ ] **Step 7: 迁移 Shadow 元素技能**

- [ ] **Step 8: 迁移 Grass 元素技能**

- [ ] **Step 9: 迁移 Earth 元素技能**

- [ ] **Step 10: 迁移 Ultimate 技能**

- [ ] **Step 11: 搜索所有遗留的 addStatusEffect 调用**

```bash
grep -r "addStatusEffect" src/strategies/skills/
```

Expected: 无结果或仅在保留的便捷方法中

- [ ] **Step 12: 运行所有技能测试**

```bash
npm test src/strategies/skills/
```

Expected: 所有测试通过

- [ ] **Step 13: 提交代码**

```bash
git add src/strategies/skills/
git commit -m "refactor(skills): 迁移所有技能使用新的修饰符系统"
```

---

