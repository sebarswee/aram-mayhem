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
  type: 'damage' | 'burn' | 'freeze' | 'stun' | 'knockback' | 'heal' | 'shield' | 'poison';
  value: number;
  duration?: number;
}

// 技能强化类型
export type EnhancementType = 'split' | 'range' | 'pierce' | 'multicast' | 'effect' | 'damage' | 'cooldown' | 'projectile_count';

// 技能强化（附加在技能上）
export interface SkillEnhancement {
  id: string;
  type: EnhancementType;
  value: number;
  source: string;  // 来自哪个强化石
}

// 技能基础值（用于计算强化）
export interface SkillBaseValues {
  damage: number;
  range: number;
  projectileCount: number;
  pierce: number;
  cooldown: number;
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
  // 新增强化相关字段
  enhancements: SkillEnhancement[];  // 已获得的强化
  baseValues: SkillBaseValues;       // 原始值（用于计算强化）
}

// ==================== 技能强化石系统 ====================

// 技能强化石
export interface SkillEnhancer {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  type: EnhancementType;
  value: number;
  maxLevel: number;
  // 限制条件
  skillCategories?: SkillCategory[];  // 只对特定类型技能生效
  skillElements?: Element[];          // 只对特定元素技能生效
  excludeElements?: Element[];        // 排除特定元素（如"附加灼烧"不能用于火焰技能）
}

// 属性提升选项
export interface StatBoost {
  id: string;
  name: string;
  description: string;
  stat: string;
  value: number;
  isPercent: boolean;
}

// 升级选项类型
export type UpgradeOptionType = 'new_skill' | 'skill_enhancer' | 'stat_boost';

export interface UpgradeOption {
  type: UpgradeOptionType;
  data: Skill | SkillEnhancer | StatBoost;
}

// ==================== 符文系统（保留兼容）====================
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
  // 符文加成属性
  skillDamageBonus?: number;  // 技能伤害加成百分比
  cooldownReduction?: number; // 冷却减少百分比
  lifesteal?: number;         // 生命偷取百分比
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
  isSelectingSkill: boolean;  // 新增：正在选择初始技能
  ultimateSlots: number;      // 新增：已解锁的大招槽位
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
