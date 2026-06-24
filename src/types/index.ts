// ==================== 元素系统 ====================
export type Element = 'fire' | 'water' | 'ice' | 'lightning' | 'holy' | 'shadow' | 'grass' | 'earth';

export type SkillCategory = 'projectile' | 'area' | 'buff' | 'summon';

export type SkillType = 'basic' | 'ultimate' | 'passive';

export type SkillRange = 'melee' | 'mid' | 'long';

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
  type: 'damage' | 'burn' | 'freeze' | 'stun' | 'poison' | 'heal' | 'shield' | 'knockback' | 'slow' | 'defense_break' | 'damage_reflect';
  value: number;
  duration?: number;
}

// 技能强化类型（扩展版，兼容旧系统）
export type EnhancementType = 'split' | 'range' | 'pierce' | 'multicast' | 'effect' | 'damage' | 'cooldown' | 'projectile_count' | 'effect_power';

export interface SkillEnhancement {
  id: string;
  type: EnhancementType;
  value: number;
  level: number;
  source?: string;  // 兼容旧系统
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

// ==================== 技能升级树系统 ====================

// 技能升级选项（Lv2-Lv4）
export interface SkillUpgradeOption {
  id: string;
  name: string;
  description: string;
  level: number;  // 2, 3, 4
  modifiers?: {
    damage?: number;      // 如 0.3 = +30%
    range?: number;
    cooldown?: number;
    projectileCount?: number;
    speed?: number;
  };
  effectAdd?: SkillEffect;
  effectBoost?: {
    type: string;
    valueMultiplier?: number;
    durationMultiplier?: number;
  };
  specialBehavior?: string;  // 如 "pierce:2", "split:2"
}

// 技能进化分支（Lv5）
export interface SkillEvolutionBranch {
  id: string;
  name: string;
  description: string;
  rarity: 'epic' | 'legendary' | 'mythic';
  modifiers?: {
    damage?: number;
    range?: number;
    cooldown?: number;
    projectileCount?: number;
    speed?: number;
  };
  effects?: SkillEffect[];
  specialBehavior?: string;
  visualChange?: {
    color?: number;
    scale?: number;
    particleEffect?: string;
  };
}

// 技能升级树
export interface SkillUpgradeTree {
  skillId: string;
  upgradeOptions: {
    [level: number]: [SkillUpgradeOption, SkillUpgradeOption];  // 每级两个选项
  };
  evolutionBranches: [SkillEvolutionBranch, SkillEvolutionBranch, SkillEvolutionBranch];  // Lv5三选一
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  type: SkillType;
  element: Element;
  elements: Element[];  // 兼容旧系统（复数形式）
  category: SkillCategory;
  categories: SkillCategory[];  // 兼容旧系统（复数形式）
  range: SkillRange;  // 兼容旧系统
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
  // 被动技能效果
  passiveEffect?: {
    type: string;
    value: number;
    element?: Element;  // 元素增强类被动需要
  };
  // 连锁属性（兼容旧系统）
  chainCount?: number;
  chainRange?: number;
  chainDamageDecay?: number;
  // 稀有度（兼容旧系统）
  rarity?: Rarity;
  // 技能升级系统
  selectedUpgrades?: string[];  // 已选升级选项ID列表
  evolutionId?: string;         // 已选进化分支ID（Lv5时设置）
  specialBehaviors?: string[];  // 特殊行为列表
}

// ==================== 技能强化石（旧系统兼容）====================
export interface SkillEnhancer {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  type: EnhancementType;
  value: number;
  maxLevel: number;
  skillCategories?: SkillCategory[];
  skillElements?: Element[];
  excludeElements?: Element[];
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
export type UpgradeOptionType = 'new_skill' | 'skill_upgrade' | 'skill_enhancer' | 'stat_boost' | 'passive_skill';

// 技能升级数据
export interface SkillUpgradeData {
  skillId: string;
  skillName: string;
  currentLevel: number;
  options: (SkillUpgradeOption | SkillEvolutionBranch)[];
}

export interface UpgradeOption {
  type: UpgradeOptionType;
  data: Skill | SkillEnhancer | StatBoost | SkillUpgradeData;
}

// ==================== 符文系统（兼容旧系统）====================
export type RuneType = 'stat_boost' | 'skill_enhance' | 'passive' | 'new_skill' | 'special';

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

// ==================== 怪物系统 ====================
export type EnemyType = 'normal' | 'elite' | 'boss';

export type EnemyBehavior = 'chase' | 'ranged' | 'summon' | 'teleport';

export interface EnemyAbility {
  type: 'burn_on_contact' | 'speed_boost' | 'slow_on_attack' | 'explode_on_death' |
        'damage_reduction' | 'poison_on_attack' | 'root_on_attack' | 'hp_boost' |
        'charge' | 'shoot' | 'summon' | 'shield' | 'heal' | 'rage';  // 新增主动能力
  trigger: 'passive' | 'attack' | 'death' | 'active';  // 新增 active 触发类型
  cooldown?: number;  // 冷却时间（毫秒）
  params?: Record<string, any>;
}

// Boss 阶段定义
export interface BossPhase {
  phase: number;               // 阶段编号
  hpThreshold: number;         // 血量阈值（百分比 0-100）
  abilities: string[];         // 该阶段可用能力 ID 列表
  damageMultiplier: number;    // 伤害倍率
  speedMultiplier: number;     // 速度倍率
  specialBehavior?: string;    // 特殊行为（如 'rage'）
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
  behavior?: EnemyBehavior;  // 兼容旧系统
  phases?: BossPhase[];      // Boss 阶段配置
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
  // 兼容旧系统
  skillDamageBonus?: number;
  cooldownReduction?: number;
}

// ==================== 输入系统 ====================
export interface InputState {
  moveX: number;
  moveY: number;
  isMoving: boolean;
}

// ==================== 游戏状态 ====================
export interface GameState {
  stats: PlayerStats;
  skills: Skill[];
  runes: Rune[];  // 兼容旧系统
  level: number;
  exp: number;
  expToNext: number;
  wave: number;
  kills: number;
  bossesKilled?: number;  // 兼容旧系统
  isPaused: boolean;
  isDead: boolean;
  isUpgrading: boolean;
  isSelectingSkill: boolean;  // 兼容旧系统
  ultimateSlots: number;
}

// ==================== 碰撞分组 ====================
export const CollisionGroup = {
  PLAYER: 'player',
  ENEMY: 'enemy',
  PLAYER_PROJECTILE: 'player_projectile',
  ENEMY_PROJECTILE: 'enemy_projectile',
  EXP_ORB: 'exp_orb',
} as const;