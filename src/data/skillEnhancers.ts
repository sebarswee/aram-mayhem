import { SkillEnhancer, StatBoost, Element, SkillCategory } from '@/types';

/**
 * 技能强化石数据
 * 替代原符文系统，让玩家能改变技能形态
 */

// ==================== 形态强化（质变）====================
export const SKILL_ENHANCERS: Record<string, SkillEnhancer> = {
  // ----- 投射物分裂 -----
  split_1: {
    id: 'split_1',
    name: '分裂',
    description: '投射物命中时分裂成2个',
    rarity: 'rare',
    type: 'split',
    value: 2,
    maxLevel: 1,
    skillCategories: ['projectile'],
  },
  split_2: {
    id: 'split_2',
    name: '多重分裂',
    description: '投射物命中时分裂成3个',
    rarity: 'epic',
    type: 'split',
    value: 3,
    maxLevel: 1,
    skillCategories: ['projectile'],
  },

  // ----- 穿透 -----
  pierce_1: {
    id: 'pierce_1',
    name: '穿透',
    description: '投射物可穿透2个敌人',
    rarity: 'rare',
    type: 'pierce',
    value: 2,
    maxLevel: 2,
    skillCategories: ['projectile'],
  },
  pierce_2: {
    id: 'pierce_2',
    name: '深度穿透',
    description: '投射物可穿透5个敌人',
    rarity: 'epic',
    type: 'pierce',
    value: 5,
    maxLevel: 1,
    skillCategories: ['projectile'],
  },

  // ----- 连射 -----
  multicast_1: {
    id: 'multicast_1',
    name: '连射',
    description: '技能连续释放2次',
    rarity: 'rare',
    type: 'multicast',
    value: 2,
    maxLevel: 1,
  },
  multicast_2: {
    id: 'multicast_2',
    name: '三连射',
    description: '技能连续释放3次',
    rarity: 'epic',
    type: 'multicast',
    value: 3,
    maxLevel: 1,
  },

  // ----- 范围扩大 -----
  range_up_1: {
    id: 'range_up_1',
    name: '范围扩大',
    description: '技能范围+30%',
    rarity: 'common',
    type: 'range',
    value: 0.3,
    maxLevel: 3,
  },
  range_up_2: {
    id: 'range_up_2',
    name: '大幅范围',
    description: '技能范围+50%',
    rarity: 'rare',
    type: 'range',
    value: 0.5,
    maxLevel: 2,
  },

  // ----- 伤害提升 -----
  damage_up_1: {
    id: 'damage_up_1',
    name: '威力强化',
    description: '技能伤害+25%',
    rarity: 'common',
    type: 'damage',
    value: 0.25,
    maxLevel: 3,
  },
  damage_up_2: {
    id: 'damage_up_2',
    name: '大幅威力',
    description: '技能伤害+50%',
    rarity: 'rare',
    type: 'damage',
    value: 0.5,
    maxLevel: 2,
  },

  // ----- 冷却减少 -----
  cooldown_down_1: {
    id: 'cooldown_down_1',
    name: '急速',
    description: '技能冷却-20%',
    rarity: 'rare',
    type: 'cooldown',
    value: 0.2,
    maxLevel: 2,
  },
  cooldown_down_2: {
    id: 'cooldown_down_2',
    name: '极速',
    description: '技能冷却-35%',
    rarity: 'epic',
    type: 'cooldown',
    value: 0.35,
    maxLevel: 1,
  },

  // ----- 投射物数量 -----
  projectile_count_1: {
    id: 'projectile_count_1',
    name: '多重射击',
    description: '同时发射+1个投射物',
    rarity: 'rare',
    type: 'projectile_count',
    value: 1,
    maxLevel: 2,
    skillCategories: ['projectile'],
  },
  projectile_count_2: {
    id: 'projectile_count_2',
    name: '散射',
    description: '同时发射+2个投射物',
    rarity: 'epic',
    type: 'projectile_count',
    value: 2,
    maxLevel: 1,
    skillCategories: ['projectile'],
  },

  // ----- 效果附加 -----
  burn_add: {
    id: 'burn_add',
    name: '灼烧附加',
    description: '附加灼烧效果，持续造成伤害',
    rarity: 'rare',
    type: 'effect',
    value: 5, // 每秒伤害
    maxLevel: 1,
    excludeElements: ['fire'], // 火焰技能不能再附加灼烧
  },
  frost_add: {
    id: 'frost_add',
    name: '冰霜附加',
    description: '攻击附加减速效果，降低敌人移动速度',
    rarity: 'rare',
    type: 'effect',
    value: 0.3, // 减速比例
    maxLevel: 1,
    excludeElements: ['ice'],
  },
  chain_add: {
    id: 'chain_add',
    name: '连锁附加',
    description: '附加连锁效果，弹射到附近敌人',
    rarity: 'epic',
    type: 'effect',
    value: 2, // 连锁次数
    maxLevel: 1,
    excludeElements: ['lightning'],
  },
  poison_add: {
    id: 'poison_add',
    name: '剧毒附加',
    description: '附加中毒效果，持续伤害',
    rarity: 'rare',
    type: 'effect',
    value: 4,
    maxLevel: 1,
    excludeElements: ['shadow'],
  },
};

// ==================== 属性提升选项 ====================
export const STAT_BOOSTS: StatBoost[] = [
  {
    id: 'attack_up',
    name: '力量',
    description: '攻击力 +10%',
    stat: 'attack',
    value: 10,
    isPercent: true,
  },
  {
    id: 'hp_up',
    name: '生命',
    description: '最大生命值 +20%',
    stat: 'maxHp',
    value: 20,
    isPercent: true,
  },
  {
    id: 'speed_up',
    name: '迅捷',
    description: '移动速度 +12%',
    stat: 'speed',
    value: 12,
    isPercent: true,
  },
  {
    id: 'defense_up',
    name: '护甲',
    description: '防御力 +15%',
    stat: 'defense',
    value: 15,
    isPercent: true,
  },
  {
    id: 'crit_chance',
    name: '暴击',
    description: '暴击率 +8%',
    stat: 'critRate',
    value: 8,
    isPercent: true,
  },
  {
    id: 'crit_damage',
    name: '暴击伤害',
    description: '暴击伤害 +25%',
    stat: 'critDamage',
    value: 25,
    isPercent: true,
  },
];

// ==================== 辅助函数 ====================

/**
 * 获取所有可用的技能强化石
 */
export function getAllEnhancers(): SkillEnhancer[] {
  return Object.values(SKILL_ENHANCERS);
}

/**
 * 获取适用于特定技能的强化石
 */
export function getApplicableEnhancers(
  skillCategories: SkillCategory[],
  skillElements: Element[]
): SkillEnhancer[] {
  return Object.values(SKILL_ENHANCERS).filter((enhancer) => {
    // 检查类别限制
    if (enhancer.skillCategories) {
      const hasCategory = skillCategories.some((cat) =>
        enhancer.skillCategories!.includes(cat)
      );
      if (!hasCategory) return false;
    }

    // 检查元素排除
    if (enhancer.excludeElements) {
      const hasExcluded = skillElements.some((el) =>
        enhancer.excludeElements!.includes(el)
      );
      if (hasExcluded) return false;
    }

    return true;
  });
}

/**
 * 获取所有属性提升选项
 */
export function getAllStatBoosts(): StatBoost[] {
  return STAT_BOOSTS;
}

/**
 * 根据稀有度权重随机选择强化石
 */
export function selectEnhancerByRarity(
  enhancers: SkillEnhancer[],
  excludeIds: string[] = []
): SkillEnhancer | null {
  const weights: Record<string, number> = {
    common: 50,
    rare: 30,
    epic: 15,
    legendary: 4,
    mythic: 1,
  };

  const filtered = enhancers.filter((e) => !excludeIds.includes(e.id));
  if (filtered.length === 0) return null;

  // 按稀有度分组
  const byRarity: Record<string, SkillEnhancer[]> = {};
  for (const enhancer of filtered) {
    if (!byRarity[enhancer.rarity]) {
      byRarity[enhancer.rarity] = [];
    }
    byRarity[enhancer.rarity].push(enhancer);
  }

  // 计算总权重
  const totalWeight = Object.keys(byRarity).reduce(
    (sum, rarity) => sum + weights[rarity],
    0
  );

  // 随机选择
  let roll = Math.random() * totalWeight;
  for (const [rarity, list] of Object.entries(byRarity)) {
    roll -= weights[rarity];
    if (roll <= 0 && list.length > 0) {
      return list[Math.floor(Math.random() * list.length)];
    }
  }

  return filtered[0];
}

/**
 * 获取随机属性提升
 */
export function getRandomStatBoost(excludeIds: string[] = []): StatBoost | null {
  const filtered = STAT_BOOSTS.filter((b) => !excludeIds.includes(b.id));
  if (filtered.length === 0) return null;
  return filtered[Math.floor(Math.random() * filtered.length)];
}
