# Task 12: Rewrite EnemySystem

## Goal
Update EnemySystem to support infinite map design, higher enemy counts (30-100), and proper boss spawning logic.

## Files
- Modify: `src/systems/EnemySystem.ts`

## Requirements

### 1. Infinite Map Spawning
Instead of spawning at screen edges, spawn enemies relative to player position:
- Spawn in a ring around the player (300-500px radius)
- Player can move infinitely in any direction
- Enemies always spawn outside player's view

### 2. Increased Enemy Count
- Support 30-100 enemies on screen simultaneously
- Adjust spawn rate based on current enemy count
- When count < 30: spawn rapidly
- When count 30-60: spawn normally
- When count 60-100: spawn slowly
- When count >= 100: stop spawning

### 3. Boss Spawning
- Boss spawns every 5 waves (wave 5, 10, 15, ...)
- Boss announcement with visual effect
- Only 1 boss at a time
- Boss has unique spawn animation

### 4. Wave Configuration
Use wave config from `src/data/waves.ts`:
- Normal waves: standard enemies
- Boss waves: reduced normal enemies + 1 boss
- Elite chance increases with wave number

### 5. Spawn Position Update
```typescript
private getSpawnPosition(): { x: number; y: number } {
  // Spawn in a ring around player
  const angle = Math.random() * Math.PI * 2;
  const minRadius = 400; // Outside camera view
  const maxRadius = 600;
  const radius = minRadius + Math.random() * (maxRadius - minRadius);
  
  return {
    x: this.player.x + Math.cos(angle) * radius,
    y: this.player.y + Math.sin(angle) * radius
  };
}
```

### 6. Continuous Spawning
- Enemies spawn continuously, not just at wave start
- Wave counter affects difficulty, not spawn timing
- No "wave complete" state - endless survival

## Interfaces
- Consumes: `ENEMY_CONFIGS`, `getEnemyPoolForWave`, `getElitePoolForWave`, `getBossForWave` from `src/data/enemies.ts`
- Consumes: `WAVE_CONFIG` from `src/data/waves.ts` (if exists)
- Produces: Updated EnemySystem with infinite map support

## Testing
- Run `npm run build` to verify no TypeScript errors
