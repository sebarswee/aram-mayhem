# Task 15: Rewrite BattleScene

## Goal
Update BattleScene to integrate all new systems: ElementSystem, DropSystem, and connect everything together.

## Files
- Modify: `src/scenes/BattleScene.ts`

## Requirements

### 1. Initialize ElementSystem
```typescript
private elementSystem!: ElementSystem;

// In create():
this.elementSystem = new ElementSystem();
this.skillSystem.setElementSystem(this.elementSystem);
this.collisionSystem.setElementSystem(this.elementSystem);
```

### 2. Initialize DropSystem
```typescript
private dropSystem!: DropSystem;

// In create():
this.dropSystem = new DropSystem(this, this.player);
this.collisionSystem.setDropSystem(this.dropSystem);
```

### 3. Connect Enemy Death to DropSystem
```typescript
this.events.on('enemyKilled', (enemy: Enemy) => {
  this.gameState.kills++;
  const exp = enemy.getExpValue();
  this.expSystem.addExp(exp);
  
  // Spawn drops
  this.dropSystem.onEnemyDeath(enemy);
});
```

### 4. Setup Food/ExpOrb Collision
Already handled by CollisionSystem when DropSystem is set.

### 5. Update Game Loop
- Ensure all systems are updated in the correct order
- EnemySystem → SkillSystem → CollisionSystem → DropSystem

### 6. Clean Up
- Destroy all systems in shutdown()
- Clear events

## Testing
- Run `npm run build` to verify no TypeScript errors
- Test game starts and runs without errors
