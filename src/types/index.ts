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
  // 连锁属性
  chainCount?: number;        // 连锁次数
  chainRange?: number;        // 连锁范围
  chainDamageDecay?: number;  // 每次连锁伤害衰减 (0-1)
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
