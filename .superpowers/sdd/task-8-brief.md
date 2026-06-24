# Task 8: Rewrite Enemy Entity

## Goal
Update Enemy entity to support element attributes, status effects, and element mark tracking for the synergy system.

## Files
- Modify: `src/entities/Enemy.ts`

## Requirements

### 1. Element Attribute Support
- Enemies have an `element` property from their EnemyConfig
- Display element color tint on enemy sprites
- Add element-specific visual indicators (e.g., fire enemies glow orange)

### 2. Status Effect System
Add status effects that can be applied to enemies:

```typescript
interface StatusEffect {
  type: 'burn' | 'freeze' | 'stun' | 'poison' | 'slow' | 'root';
  value: number;
  duration: number;
  remainingTime: number;
  source: string;  // source skill ID
}
```

- Burn: DoT (damage over time), ticks every 500ms
- Freeze: Immobilize + visual tint (blue)
- Stun: Immobilize + visual effect (stars)
- Poison: DoT, ticks every 1000ms
- Slow: Reduce speed by value% (0-1)
- Root: Immobilize (can't move)

### 3. Element Mark Tracking
- Store element marks on enemy (for synergy system)
- `elementMarks: Map<Element, ElementMark>`
- Method to add element marks: `addElementMark(element, source)`
- Method to get active marks: `getElementMarks(): ElementMark[]`
- Marks expire after their duration

### 4. Counter Damage Bonus
- When taking damage from a counter element, take 50% bonus damage
- Counter relationships defined in `src/data/elements.ts`

### 5. Element-specific Death Effects
- Fire enemies: fire particle burst
- Water enemies: water splash
- Ice enemies: ice shatter
- Lightning enemies: electric discharge
- Holy enemies: golden flash
- Shadow enemies: purple mist
- Grass enemies: leaf scatter
- Earth enemies: rock debris

### 6. Update ENEMY_TEXTURE_MAP
Add all 8 normal enemy textures and elite/boss textures based on enemy IDs from `src/data/enemies.ts`

## Interfaces
- Consumes: `EnemyConfig`, `Element`, `ElementMark` from `src/types/index.ts`
- Consumes: `COUNTER_RELATIONS` from `src/data/elements.ts`
- Produces: `Enemy` with element marks, status effects, and counter damage

## Testing
- Run `npm run build` to verify no TypeScript errors
