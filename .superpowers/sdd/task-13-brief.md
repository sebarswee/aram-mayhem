# Task 13: Create DropSystem

## Goal
Create a new DropSystem to handle food and exp orb drops when enemies die. This system manages the drop rates, spawning, and cleanup.

## Files
- Create: `src/systems/DropSystem.ts`

## Requirements

### 1. Food Drops
- Use `getFoodDropRate(enemyType)` from `src/data/foods.ts`
- Normal: 3%, Elite: 15%, Boss: 100%
- Use `getRandomFood()` to get food config
- Create Food entity at enemy death position

### 2. Exp Orb Drops
- Always drop exp orbs when enemy dies
- Value based on enemy's `expValue`
- Split into multiple orbs for large values:
  - value <= 5: 1 small orb
  - value <= 20: 2-3 medium orbs
  - value > 20: 3-5 large orbs

### 3. Drop Spawning
```typescript
onEnemyDeath(enemy: Enemy): void {
  // Food drop check
  if (Math.random() < getFoodDropRate(enemy.config.type)) {
    const foodConfig = getRandomFood();
    if (foodConfig) {
      const food = new Food(scene, enemy.x, enemy.y, foodConfig, player);
      foodsGroup.add(food);
    }
  }
  
  // Exp orb drop
  const expValue = enemy.getExpValue();
  spawnExpOrbs(enemy.x, enemy.y, expValue);
}
```

### 4. Group Management
- Create Phaser groups for Food and ExpOrb
- `getFoods()`: return foods group
- `getExpOrbs()`: return exp orbs group
- Cleanup in `destroy()`

### 5. Pickup Handling
Food and ExpOrb handle their own pickup logic (via update), but DropSystem should:
- Listen to enemy death events
- Spawn drops at death position

## Interfaces
- Consumes: `Food` from `src/entities/Food.ts`
- Consumes: `ExpOrb` from `src/entities/ExpOrb.ts`
- Consumes: `getFoodDropRate`, `getRandomFood` from `src/data/foods.ts`
- Consumes: `Enemy` from `src/entities/Enemy.ts`
- Produces: `DropSystem` with `onEnemyDeath()` method

## Testing
- Run `npm run build` to verify no TypeScript errors
