# Task 14: Rewrite CollisionSystem

## Goal
Update CollisionSystem to integrate ElementSystem for synergy effects, DropSystem for food/exp orb collisions, and use Enemy.addStatusEffect() instead of custom status logic.

## Files
- Modify: `src/systems/CollisionSystem.ts`

## Requirements

### 1. ElementSystem Integration
- Add ElementSystem reference in constructor
- When projectile hits enemy:
  - Call `elementSystem.checkSynergy(enemy.instanceId, skillElement, skillId)`
  - Apply synergy effect if returned

### 2. DropSystem Integration
- Add DropSystem reference in constructor
- Setup collision for:
  - Player vs Food (pickup)
  - Player vs ExpOrb (pickup)
- Use `dropSystem.getFoods()` and `dropSystem.getExpOrbs()`

### 3. Use Enemy Status Effect Methods
Replace custom `applyBurn()`, `applyFreeze()`, `applyStun()`, `applyPoison()` with:
```typescript
enemy.addStatusEffect({
  type: 'burn',
  value: damagePerSec,
  duration: duration,
  remainingTime: duration
});
```

### 4. Simplify applyEffects()
```typescript
private applyEffects(enemy: Enemy, effects: SkillEffect[], skillElement?: Element): void {
  for (const effect of effects) {
    enemy.addStatusEffect({
      type: effect.type as any,
      value: effect.value || 0,
      duration: effect.duration || 1000,
      remainingTime: effect.duration || 1000
    });
  }
  
  // Apply element mark
  if (this.elementSystem && skillElement) {
    this.elementSystem.checkSynergy(enemy.instanceId, skillElement, 'skill');
  }
}
```

### 5. Food/ExpOrb Pickup Handlers
```typescript
private handleFoodPickup(player: Player, food: Food): void {
  food.onPickup(player);
  // Food handles its own destroy
}

private handleExpOrbPickup(player: Player, orb: ExpOrb): void {
  orb.onPickup(player);
  // Orb handles its own destroy
}
```

## Interfaces
- Consumes: `ElementSystem` from `src/systems/ElementSystem.ts`
- Consumes: `DropSystem` from `src/systems/DropSystem.ts`
- Consumes: `Food` from `src/entities/Food.ts`
- Consumes: `ExpOrb` from `src/entities/ExpOrb.ts`

## Testing
- Run `npm run build` to verify no TypeScript errors
