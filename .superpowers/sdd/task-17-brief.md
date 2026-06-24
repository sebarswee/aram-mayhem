# Task 17: Update GraphicsFactory

## Goal
Ensure GraphicsFactory generates all necessary textures for the new element system.

## Files
- Modify: `src/graphics/GraphicsFactory.ts`

## Requirements

### 1. Projectile Textures
Ensure all 8 element projectile textures exist:
- projectile_fire, projectile_water, projectile_ice
- projectile_lightning, projectile_holy, projectile_shadow
- projectile_grass, projectile_earth

### 2. Particle Textures
Ensure all 8 element particle textures exist:
- particle_fire, particle_water, particle_ice
- particle_lightning, particle_holy, particle_shadow
- particle_grass, particle_earth

### 3. Enemy Textures
Ensure all enemy textures from `src/data/enemies.ts` exist:
- All 8 normal enemies
- All 4 elite enemies
- All 8 boss enemies

### 4. Food/ExpOrb Textures
Already created in Task 9.

## Testing
- Run `npm run build` to verify no TypeScript errors