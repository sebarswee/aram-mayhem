# Task 7: Rewrite Projectile Entity

## Goal
Update Projectile entity to support the new 8-element system with element marks, chain effects, and synergy triggering.

## Files
- Modify: `src/entities/Projectile.ts`

## Requirements

### 1. Update Element Texture Map
Add missing elements to `ELEMENT_TEXTURE_MAP`:
- water, grass, earth

### 2. Add Element Mark Support
When projectile hits enemy, it should:
- Apply element mark via ElementSystem
- Check for synergy triggers (two different elements on same enemy)

### 3. Support Chain Effects
For lightning skills:
- Use existing `chainRemaining`, `chainRange`, `chainDamageDecay` fields
- Chain to nearby enemies within range
- Decay damage per chain

### 4. Support Pierce
- Use existing `pierceCount` and `hitEnemies` fields
- Don't destroy on hit if pierceCount > 0
- Track hit enemies to avoid double-hits

### 5. Element-specific Visual Effects
Ensure proper visual effects for each element:
- Fire: orange glow, explosion on death
- Water: blue ripple effect
- Ice: white sparkle, freeze effect
- Lightning: yellow flash, chain visual
- Holy: golden glow
- Shadow: purple particles
- Grass: green leaves
- Earth: brown rocks

### 6. Synergy Integration
Pass element info to CollisionSystem for synergy handling:
- Element mark application
- Synergy trigger checking

## Interfaces
- Consumes: `ElementSystem` from `src/systems/ElementSystem.ts`
- Consumes: `Element` type from `src/types/index.ts`
- Consumes: `COUNTER_RELATIONS`, `SYNERGIES` from `src/data/elements.ts`

## Implementation Notes
1. Update `ELEMENT_TEXTURE_MAP` to include all 8 elements
2. Add reference to ElementSystem (will be passed from CollisionSystem)
3. Keep existing chain/pierce logic working
4. Add visual effects for new elements

## Testing
- Run `npm run build` to verify no TypeScript errors
- Test each element projectile in game
- Verify chain effects work for lightning skills
- Verify pierce works correctly
