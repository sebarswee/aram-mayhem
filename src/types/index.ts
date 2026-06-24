// ==================== 元素系统 ====================
export type Element = 'fire' | 'water' | 'ice' | 'lightning' | 'holy' | 'shadow' | 'grass' | 'earth';

export type SkillCategory = 'projectile' | 'area' | 'buff' | 'summon';

export type SkillType = 'basic' | 'ultimate';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

// ==================== 元素标记（用于羁绊触发）====================
export interface ElementMark {
  element: Element;
  timestamp: number;
  duration: number;
  source: string;
}

// ==================== 羁绊效果 ====================
export interface SynergyResult {
  name: string;
  elements: [Element, Element];
  effect: string;
  value?: number;
  duration?: number;
}

// ==================== 技能系统 ====================
export interface SkillEffect {
  type: 'damage' | 'burn' | 'freeze' | 'stun' | 'poison' | 'heal' | 'shield' | 'knockback' | 'slow';
  value: number;
  duration?: number;
}

export interface SkillEnhancement {
  id: string;
  type: 'damage' | 'range' | 'cooldown' | 'projectile_count' | 'pierce' | 'effect_power';
  value: number;
  level: number;
}

export interface SkillEvolution {
  id: string;
  name: string;
  description: string;
  effects: SkillEffect[];
  modifiers: {
    damage?: number;
    range?: number;
    cooldown?: number;
    projectileCount?: number;
    special?: string;
  };
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  type: SkillType;
  element: Element;
  category: SkillCategory;
  cooldown: number;
  damage: number;
  rangeValue: number;
  speed?: number;
  effects: SkillEffect[];
  level: number;
  maxLevel: number;
  enhancements: SkillEnhancement[];
  evolutions: SkillEvolution[];
  baseValues: {
    damage: number;
    range: number;
    cooldown: number;
    projectileCount: number;
  };
}

// ==================== 怪物系统 ====================
export type EnemyType = 'normal' | 'elite' | 'boss';

export interface EnemyAbility {
  type: 'burn_on_contact' | 'speed_boost' | 'slow_on_attack' | 'explode_on_death' | 'damage_reduction' | 'poison_on_attack' | 'root_on_attack' | 'hp_boost';
  trigger: 'passive' | 'attack' | 'death';
  params?: Record<string, any>;
}

export interface EnemyConfig {
  id: string;
  name: string;
  type: EnemyType;
  element: Element;
  hp: number;
  damage: number;
  speed: number;
  expValue: number;
  color: number;
  abilities: EnemyAbility[];
}

// ==================== 掉落系统 ====================
export interface FoodConfig {
  id: string;
  name: string;
  healAmount: number;
  rarity: Rarity;
  emoji: string;
  special?: 'clear_debuff' | 'full_heal';
}

export interface ExpOrbConfig {
  value: number;
  size: 'small' | 'medium' | 'large';
  attractRange: number;
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
  lifesteal: number;
}

// ==================== 游戏状态 ====================
export interface GameState {
  stats: PlayerStats;
  skills: Skill[];
  level: number;
  exp: number;
  expToNext: number;
  wave: number;
  kills: number;
  isPaused: boolean;
  isDead: boolean;
  isUpgrading: boolean;
  ultimateSlots: number;
}
