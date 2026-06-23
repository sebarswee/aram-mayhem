# Task 2: 类型定义系统

## Global Constraints
- 技术栈: Phaser 3.80+, TypeScript 5.x, Vite 5.x
- 代码规范: TypeScript strict mode

## Files to Create
1. `src/types/index.ts`

## Interfaces Produced
- `Element` type
- `SkillCategory` type
- `SkillRange` type
- `Rarity` type
- `RuneType` type
- `EnemyType` type
- `EnemyBehavior` type
- `SkillEffect` interface
- `Skill` interface
- `RuneEffect` interface
- `Rune` interface
- `EnemyAbility` interface
- `EnemyConfig` interface
- `PlayerStats` interface
- `GameState` interface
- `InputState` interface
- `CollisionGroup` constant

## Complete Code

```typescript
// ==================== 元素与标签 ====================
export type Element = 'fire' | 'ice' | 'lightning' | 'physical' | 'shadow' | 'holy';

export type SkillCategory = 'projectile' | 'area' | 'dash' | 'summon' | 'buff' | 'control';

export type SkillRange = 'melee' | 'mid' | 'long';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export type RuneType = 'stat_boost' | 'skill_enhance' | 'passive' | 'new_skill' | 'special';

export type EnemyType = 'normal' | 'elite' | 'boss';

export type EnemyBehavior = 'chase' | 'ranged' | 'summon' | 'teleport';

// ==================== 技能系统 ====================
export interface SkillEffect {
  type: 'damage' | 'burn' | 'freeze' | 'stun' | 'knockback' | 'heal' | 'shield';
  value: number;
  duration?: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  type: 'basic' | 'ultimate' | 'passive';
  elements: Element[];
  categories: SkillCategory[];
  range: SkillRange;
  cooldown: number;
  damage: number;
  rangeValue: number;
  speed?: number;
  effects: SkillEffect[];
  rarity?: 'common' | 'rare' | 'legendary';
}

// ==================== 符文系统 ====================
export interface RuneEffect {
  type: RuneType;
  target?: 'all' | 'element' | 'category';
  targetValue?: string;
  stat?: string;
  value: number;
  isPercent: boolean;
}

export interface Rune {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  type: RuneType;
  effects: RuneEffect[];
  exclusiveGroup?: string;
  maxLevel: number;
  currentLevel?: number;
}

// ==================== 敌人系统 ====================
export interface EnemyAbility {
  type: 'charge' | 'shoot' | 'summon' | 'shield' | 'heal';
  cooldown: number;
  params?: Record<string, unknown>;
}

export interface EnemyConfig {
  id: string;
  name: string;
  type: EnemyType;
  hp: number;
  damage: number;
  speed: number;
  behavior: EnemyBehavior;
  expValue: number;
  abilities: EnemyAbility[];
  color: number; // 临时用颜色代替精灵
}

// ==================== 玩家系统 ====================
export interface PlayerStats {
  maxHp: number;
  currentHp: number;
  attack: number;
  defense: number;
  speed: number;
  critRate: number;
  critDamage: number;
}

// ==================== 游戏状态 ====================
export interface GameState {
  // 玩家
  stats: PlayerStats;
  skills: Skill[];
  runes: Rune[];

  // 进度
  level: number;
  exp: number;
  expToNext: number;
  wave: number;
  kills: number;
  bossesKilled: number;

  // 状态
  isPaused: boolean;
  isDead: boolean;
  isUpgrading: boolean;
}

// ==================== 输入系统 ====================
export interface InputState {
  moveX: number;
  moveY: number;
  isMoving: boolean;
}

// ==================== 碰撞分组 ====================
export const CollisionGroup = {
  PLAYER: 'player',
  ENEMY: 'enemy',
  PLAYER_PROJECTILE: 'player_projectile',
  ENEMY_PROJECTILE: 'enemy_projectile',
  EXP_ORB: 'exp_orb',
} as const;
```

## Steps
1. Create the file with the exact code above
2. Commit with message: "feat: add core type definitions\n\nCo-Authored-By: Claude <noreply@anthropic.com>"

## Report
Write to `.superpowers/sdd/task-2-report.md`:
- File created
- Commit hash
- Status (DONE/DONE_WITH_CONCERNS/BLOCKED)
