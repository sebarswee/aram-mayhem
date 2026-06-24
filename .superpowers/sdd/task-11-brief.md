# Task 11: Rewrite SkillSystem

## Goal
Update SkillSystem to support auto-cast for basic skills, manual cast for ultimates, element system integration, and synergy support.

## Files
- Modify: `src/systems/SkillSystem.ts`

## Requirements

### 1. Auto-cast vs Manual-cast
- **Basic skills**: Auto-cast when cooldown ready (existing behavior)
- **Ultimates**: Manual cast only, triggered by player input (new)
  - Add `useUltimate(skillId: string)` method
  - Ultimate skills should NOT auto-cast in update()

### 2. Element System Integration
- Add reference to `ElementSystem` in constructor
- When skill hits, apply element mark via `elementSystem.addMark()`
- Check synergy triggers via `elementSystem.checkSynergy()`

### 3. Element Colors
Update `ELEMENT_COLORS` to include all 8 elements:
```typescript
const ELEMENT_COLORS: Record<string, number> = {
  fire: 0xff4400,
  water: 0x4488ff,
  ice: 0x44ccff,
  lightning: 0xffff00,
  holy: 0xffcc00,
  shadow: 0x8800ff,
  grass: 0x44ff44,
  earth: 0x886644,
};
```

### 4. Counter Damage Bonus
- When applying damage, check for counter element relationship
- Counter bonus: +50% damage
- Use `getCounterBonus(attackerElement, defenderElement)` from `src/data/elements.ts`

### 5. Synergy Effect Application
- When `checkSynergy()` returns a synergy result, apply the synergy effect
- Synergy effects include: true damage, explosion, heal, stun, etc.
- Emit events for UI feedback

### 6. Update Status Effect Application
- Use `enemy.addStatusEffect()` instead of custom burn/freeze logic
- Apply status effects from skill.effects array

## Interfaces
- Consumes: `ElementSystem` from `src/systems/ElementSystem.ts`
- Consumes: `getCounterBonus`, `SYNERGIES` from `src/data/elements.ts`
- Produces: Updated SkillSystem with element and synergy support

## Testing
- Run `npm run build` to verify no TypeScript errors
