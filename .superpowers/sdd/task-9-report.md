# Task 9 Report: Create Food and ExpOrb Entities

## Summary
Successfully created both Food.ts and ExpOrb.ts entities with all required features. Updated GraphicsFactory to generate the necessary textures.

## Files Created

### 1. `src/entities/Food.ts`
**Features implemented:**
- Extends `Phaser.Physics.Arcade.Sprite`
- Display as colored circle with emoji text overlay
- Rarity-based glow effect (common: white, rare: blue, epic: purple, legendary: gold)
- Attracts to player within 50px with increasing speed as distance decreases
- Auto-heals player on pickup via `player.heal(amount)`
- Special effects support:
  - `clear_debuff`: Emits `clearDebuffs` event
  - `full_heal`: Heals player to max HP
- Destroys after 10 seconds with fade-out effect
- Floating animation
- Pickup flash effect

**Public Methods:**
- `getPlayer()`: Returns player reference
- `getConfig()`: Returns FoodConfig
- `onPickup(player)`: Called when player collects the food
- `update(delta)`: Frame update for attraction and lifespan

**Events Emitted:**
- `foodPickedUp`: When food is collected
- `clearDebuffs`: When food has `clear_debuff` special effect

### 2. `src/entities/ExpOrb.ts`
**Features implemented:**
- Extends `Phaser.Physics.Arcade.Sprite`
- Three sizes: small (1 exp), medium (5 exp), large (20 exp)
- Attracts to player within 100px (configurable via `attractRange`)
- Magnet effect: speed increases as player gets closer (up to 4x base speed)
- Pulsing glow effect
- Particle trail when attracting (uses `particle_cyan` texture)
- Merge capability: `canMergeWith()` and `mergeWith()` methods
- Size upgrade when value increases

**Public Methods:**
- `getPlayer()`: Returns player reference
- `getValue()`: Returns exp value
- `getSize()`: Returns size ('small' | 'medium' | 'large')
- `canMergeWith(other)`: Check if can merge with another orb
- `mergeWith(other)`: Merge and increase value
- `onPickup()`: Called when player collects the orb
- `update(delta)`: Frame update for attraction

**Events Emitted:**
- `expOrbPickedUp`: With the exp value as payload

**Factory Function:**
- `createExpOrbConfig(value)`: Creates ExpOrbConfig with appropriate size based on value

## Files Modified

### `src/graphics/GraphicsFactory.ts`
Added texture generation methods:
- `createFoodSprites()`: Generates food textures for all rarities
- `createFoodSprite(key, color)`: Single food texture
- `createFoodGlowSprite()`: Glow overlay for food
- `createExpOrbSprites()`: Generates exp orb textures for all sizes
- `createExpOrbSprite(key, radius, color)`: Single exp orb texture
- `createExpOrbGlowSprite()`: Glow overlay for exp orbs
- `createCyanParticle()`: Particle for exp orb trail

**Textures Generated:**
- `food_common`, `food_rare`, `food_epic`, `food_legendary`, `food_mythic`
- `food_glow`
- `exp_orb_small`, `exp_orb_medium`, `exp_orb_large`
- `exp_orb_glow`
- `particle_cyan`

## Integration Notes

### For DropSystem (Task 13)
The Food and ExpOrb entities are ready to be spawned by DropSystem:

```typescript
// Spawning food
import { Food } from '@/entities/Food';
import { getRandomFood } from '@/data/foods';

const foodConfig = getRandomFood();
if (foodConfig) {
  const food = new Food(scene, x, y, foodConfig, player);
  // Add to physics group
}

// Spawning exp orb
import { ExpOrb, createExpOrbConfig } from '@/entities/ExpOrb';

const orbConfig = createExpOrbConfig(enemyExpValue);
const orb = new ExpOrb(scene, x, y, orbConfig, player);
```

### Event Handling
BattleScene or CollisionSystem should listen for:
- `expOrbPickedUp`: Add exp via ExpSystem
- `foodPickedUp`: Optional UI feedback
- `clearDebuffs`: Clear player debuffs

### Collision Detection
When player collides with Food or ExpOrb:
```typescript
// Call onPickup method
food.onPickup(player);
orb.onPickup();
```

## Build Status
✅ Build successful - no TypeScript errors

## Notes
- Both entities store a reference to the player for attraction logic
- The attraction uses a magnet-like effect where speed increases as distance decreases
- Food uses emoji text overlay for visual identification
- ExpOrb has optional merging capability for reducing entity count
- Both entities clean up their visual effects (glow sprites, particles, text) on destroy
