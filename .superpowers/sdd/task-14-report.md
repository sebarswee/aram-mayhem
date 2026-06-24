# Task 14 Report: Rewrite CollisionSystem

## Summary
Successfully updated `CollisionSystem.ts` to integrate ElementSystem and DropSystem, and replaced custom status effect methods with `Enemy.addStatusEffect()`.

## Changes Made

### 1. ElementSystem Integration
- Added optional `elementSystem` field (initially null)
- Added `setElementSystem()` setter method for late initialization
- In `applyEffects()`, added element mark check via `elementSystem.checkSynergy()` when element is present

### 2. DropSystem Integration
- Added optional `dropSystem` field (initially null)
- Added `setDropSystem()` setter method
- Added `setupDropCollisions()` method that sets up:
  - Player vs Food overlap collision
  - Player vs ExpOrb overlap collision
- Collision handlers use `dropSystem.getFoods()` and `dropSystem.getExpOrbs()`

### 3. Food and ExpOrb Pickup Handlers
- Implemented `handleFoodPickup()`:
  - Delegates to `food.onPickup(player)`
  - Food handles its own effects and destruction
- Implemented `handleExpOrbPickup()`:
  - Delegates to `expOrb.onPickup()`
  - ExpOrb handles its own effects and destruction

### 4. Simplified applyEffects()
Replaced 200+ lines of custom status effect code with:
```typescript
private applyEffects(
  enemy: Enemy,
  effects: { type: string; value?: number; duration?: number }[],
  skillElement?: Element
): void {
  for (const effect of effects) {
    enemy.addStatusEffect({
      type: effect.type as any,
      value: effect.value || 0,
      duration: effect.duration || 1000,
      remainingTime: effect.duration || 1000,
      source: 'skill',
    });
  }

  // Apply element mark for synergy check
  if (this.elementSystem && skillElement) {
    this.elementSystem.checkSynergy(enemy.instanceId, skillElement, 'skill');
  }
}
```

### 5. Removed Redundant Code
- Removed `applyBurn()` - ~20 lines
- Removed `applyFreeze()` - ~40 lines with visual effects
- Removed `applyStun()` - ~60 lines with star animation
- Removed `applyPoison()` - ~50 lines with visual effects
- Removed `drawStar()` helper method - ~15 lines
- **Total removed: ~185 lines** of redundant status effect code

### 6. Added Skill Element Support
- Extracted skill element from projectile config: `proj.config.skill.elements[0]`
- Pass element to `applyEffects()` and `processChainLightning()` for synergy checking

## Imports Added
```typescript
import { Food } from '@/entities/Food';
import { ExpOrb } from '@/entities/ExpOrb';
import { ElementSystem } from '@/systems/ElementSystem';
import { DropSystem } from '@/systems/DropSystem';
import { Element } from '@/types';
```

## API Changes
- New method: `setElementSystem(elementSystem: ElementSystem): void`
- New method: `setDropSystem(dropSystem: DropSystem): void`

## Build Verification
```
npm run build
✓ 31 modules transformed.
✓ built in 8.32s
```

No TypeScript errors.

## Notes
- ElementSystem and DropSystem are optional (nullable) to support late initialization
- The Enemy entity now handles all status effect visuals and ticking internally
- Food and ExpOrb entities handle their own pickup effects and destruction
- Existing projectile-enemy collision logic preserved unchanged
