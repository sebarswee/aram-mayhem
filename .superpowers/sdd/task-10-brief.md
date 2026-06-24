# Task 10: Rewrite Player Entity

## Goal
Update Player entity to support status effects, element interactions, lifesteal, and better skill management for the new element system.

## Files
- Modify: `src/entities/Player.ts`

## Requirements

### 1. Status Effect System
Add ability to receive status effects (debuffs and buffs):

```typescript
interface PlayerStatusEffect {
  type: 'burn' | 'poison' | 'slow' | 'root' | 'shield' | 'attack_boost' | 'speed_boost';
  value: number;
  duration: number;
  remainingTime: number;
}
```

- Burn/Poison: DoT ticks
- Slow: Reduce speed
- Root: Can't move
- Shield: Damage absorption (existing)
- Attack boost: Increase attack stat
- Speed boost: Increase speed stat

### 2. Lifesteal Support
- Already have `lifesteal` in PlayerStats (from types update)
- When dealing damage, heal for lifesteal% of damage

### 3. Element Resistance
- Add `elementResistance: Partial<Record<Element, number>>` for elemental defense
- Counter elements have +25% resistance
- Weak elements have -25% resistance

### 4. Clear Debuffs Method
- `clearDebuffs()`: Remove all negative status effects
- Called by golden apple special food

### 5. Update Stats Display
- Add methods to get modified stats (including active status effects)
- `getEffectiveSpeed()`: Base speed * slow multiplier * speed boost multiplier
- `getEffectiveAttack()`: Base attack * attack boost multiplier

### 6. Visual Feedback
- Shield visual: Blue glow overlay
- Burn: Orange tint
- Poison: Green tint
- Speed boost: Cyan trail particles
- Attack boost: Red glow

## Interfaces
- Consumes: `PlayerStats`, `Skill`, `Element` from `src/types/index.ts`
- Consumes: `INITIAL_PLAYER_STATS` from `src/config/balance.config`

## Testing
- Run `npm run build` to verify no TypeScript errors
