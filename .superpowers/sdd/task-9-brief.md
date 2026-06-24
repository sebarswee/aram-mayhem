# Task 9: Create Food and ExpOrb Entities

## Goal
Create Food and ExpOrb entities for the survival mechanism. Enemies drop food for healing and exp orbs for leveling up.

## Files
- Create: `src/entities/Food.ts`
- Create: `src/entities/ExpOrb.ts`

## Requirements

### 1. Food Entity

```typescript
interface FoodConfig {
  id: string;
  name: string;
  healAmount: number;
  rarity: Rarity;
  emoji: string;
  special?: 'clear_debuff' | 'full_heal';
}
```

**Features:**
- Display as emoji or colored circle
- Attract to player when within 50px
- Auto-heal on pickup
- Special effects: clear_debuff, full_heal
- Destroy after 10 seconds if not picked up
- Visual glow based on rarity (common: white, rare: blue, epic: purple, legendary: gold)

### 2. ExpOrb Entity

**Features:**
- Three sizes: small (1 exp), medium (5 exp), large (20 exp)
- Attract to player when within 100px (magnet effect)
- Merge when close to each other (optional)
- Visual: glowing orb, size based on value
- Color: cyan/light blue

```typescript
interface ExpOrbConfig {
  value: number;
  size: 'small' | 'medium' | 'large';
  attractRange: number;
}
```

### 3. Drop Behavior
- Food drops based on enemy type (normal 3%, elite 15%, boss 100%)
- ExpOrb always drops, value based on enemy expValue
- Large enemies drop more orbs

### 4. Visual Effects
- Food: rarity-based glow, floating animation
- ExpOrb: particle trail, pulsing glow
- Pickup effect: brief flash and sound (optional)

## Interfaces
- Consumes: `FoodConfig` from `src/types/index.ts`
- Consumes: `FOODS`, `getRandomFood()`, `getFoodDropRate()` from `src/data/foods.ts`
- Produces: `Food` class, `ExpOrb` class

## Testing
- Run `npm run build` to verify no TypeScript errors
