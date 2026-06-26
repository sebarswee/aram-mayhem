import { PlayerStats } from '@/types';

// 经验计算公式: expNeeded = floor(BASE_EXP * level ^ EXP_GROWTH)
export const EXP_BASE = 10;
export const EXP_GROWTH = 1.5;

// 玩家初始属性
export const INITIAL_PLAYER_STATS: PlayerStats = {
  maxHp: 100,
  currentHp: 100,
  attack: 10,
  defense: 5,
  speed: 280,
  critRate: 0.05,
  critDamage: 1.5,
  // 符文加成属性（初始为0）
  skillDamageBonus: 0,
  cooldownReduction: 0,
  lifesteal: 0,
};

// 技能冷却倍率(受符文影响)
export const SKILL_COOLDOWN_MULTIPLIER = 1.0;

// 敌人数量配置
export const ENEMY_SPAWN_CONFIG = {
  // 波次 -> 数量范围
  getEnemyCount: (wave: number): number => {
    return Math.floor(20 + wave * 5);
  },
  // 波次 -> 精英概率
  // 精英在波次10开始出现（与 getElitePoolForWave 一致）
  getEliteChance: (wave: number): number => {
    if (wave < 10) return 0;
    return Math.min(0.05 + (wave - 10) * 0.02, 0.4);
  },
  // 刷新间隔(ms)
  spawnInterval: 800,
};

// 敌人属性随波次增长
export const ENEMY_SCALING = {
  hpGrowth: 1.1,      // 每波血量增长10%
  damageGrowth: 1.05, // 每波伤害增长5%
  speedGrowth: 1.02,  // 每波速度增长2%
};

// 符文稀有度概率
export const RUNE_RARITY_WEIGHTS = {
  common: 50,
  rare: 30,
  epic: 15,
  legendary: 4,
  mythic: 1,
};

// 伤害计算
export const DAMAGE_FORMULA = {
  // 基础伤害 = 攻击力 * 技能倍率
  base: (attack: number, skillDamage: number) => attack * skillDamage / 10,
  // 防御减伤 = 1 - (防御 / (防御 + 100))
  defenseReduction: (defense: number) => 1 - defense / (defense + 100),
  // 最终伤害 = 基础伤害 * 减伤系数
  final: (attack: number, skillDamage: number, targetDefense: number) => {
    const base = DAMAGE_FORMULA.base(attack, skillDamage);
    const reduction = DAMAGE_FORMULA.defenseReduction(targetDefense);
    return Math.floor(base * reduction);
  },
};

// 碰撞伤害间隔(ms)
export const COLLISION_DAMAGE_INTERVAL = 500;

// 投射物存活时间(ms)
export const PROJECTILE_LIFETIME = 3000;
