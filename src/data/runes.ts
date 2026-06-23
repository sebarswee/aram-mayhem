import { Rune } from '@/types';
import { RUNE_RARITY_WEIGHTS } from '@/config/balance.config';

// 基础符文数据
export const RUNES: Record<string, Rune> = {
  // ==================== 属性增强 ====================
  attack_up: {
    id: 'attack_up',
    name: '力量增强',
    description: '攻击力 +10%',
    rarity: 'common',
    type: 'stat_boost',
    effects: [
      {
        type: 'stat_boost',
        stat: 'attack',
        value: 10,
        isPercent: true,
      },
    ],
    maxLevel: 3,
    currentLevel: 1,
  },

  defense_up: {
    id: 'defense_up',
    name: '护甲增强',
    description: '防御力 +15%',
    rarity: 'common',
    type: 'stat_boost',
    effects: [
      {
        type: 'stat_boost',
        stat: 'defense',
        value: 15,
        isPercent: true,
      },
    ],
    maxLevel: 3,
    currentLevel: 1,
  },

  speed_up: {
    id: 'speed_up',
    name: '迅捷',
    description: '移动速度 +12%',
    rarity: 'common',
    type: 'stat_boost',
    effects: [
      {
        type: 'stat_boost',
        stat: 'speed',
        value: 12,
        isPercent: true,
      },
    ],
    maxLevel: 3,
    currentLevel: 1,
  },

  hp_up: {
    id: 'hp_up',
    name: '生命强化',
    description: '最大生命值 +20%',
    rarity: 'rare',
    type: 'stat_boost',
    effects: [
      {
        type: 'stat_boost',
        stat: 'maxHp',
        value: 20,
        isPercent: true,
      },
    ],
    maxLevel: 3,
    currentLevel: 1,
  },

  // ==================== 技能强化 ====================
  skill_damage_up: {
    id: 'skill_damage_up',
    name: '法术强度',
    description: '技能伤害 +15%',
    rarity: 'rare',
    type: 'skill_enhance',
    effects: [
      {
        type: 'skill_enhance',
        target: 'all',
        value: 15,
        isPercent: true,
      },
    ],
    maxLevel: 3,
    currentLevel: 1,
  },

  skill_cooldown_down: {
    id: 'skill_cooldown_down',
    name: '急速',
    description: '技能冷却 -10%',
    rarity: 'rare',
    type: 'skill_enhance',
    effects: [
      {
        type: 'skill_enhance',
        target: 'all',
        value: 10,
        isPercent: true,
      },
    ],
    maxLevel: 3,
    currentLevel: 1,
  },

  // ==================== 被动效果 ====================
  lifesteal: {
    id: 'lifesteal',
    name: '生命汲取',
    description: '造成伤害时回复 5% 生命值',
    rarity: 'epic',
    type: 'passive',
    effects: [
      {
        type: 'passive',
        stat: 'lifesteal',
        value: 5,
        isPercent: true,
      },
    ],
    maxLevel: 3,
    currentLevel: 1,
  },

  crit_chance: {
    id: 'crit_chance',
    name: '暴击几率',
    description: '暴击率 +8%',
    rarity: 'epic',
    type: 'stat_boost',
    effects: [
      {
        type: 'stat_boost',
        stat: 'critRate',
        value: 8,
        isPercent: false,
      },
    ],
    maxLevel: 3,
    currentLevel: 1,
  },
};

// 根据稀有度权重随机选择符文
export function getRandomRunes(count: number, excludeIds: string[] = []): Rune[] {
  const availableRunes = Object.values(RUNES).filter(
    (r) => !excludeIds.includes(r.id)
  );

  const selected: Rune[] = [];

  for (let i = 0; i < count; i++) {
    const rune = selectRuneByRarity(availableRunes, selected.map((r) => r.id));
    if (rune) {
      selected.push({ ...rune });
    }
  }

  return selected;
}

function selectRuneByRarity(runes: Rune[], excludeIds: string[]): Rune | null {
  const filtered = runes.filter((r) => !excludeIds.includes(r.id));
  if (filtered.length === 0) return null;

  // 计算总权重
  const totalWeight = filtered.reduce((sum, r) => {
    return sum + RUNE_RARITY_WEIGHTS[r.rarity];
  }, 0);

  // 随机选择
  let random = Math.random() * totalWeight;

  for (const rune of filtered) {
    random -= RUNE_RARITY_WEIGHTS[rune.rarity];
    if (random <= 0) {
      return rune;
    }
  }

  return filtered[0];
}
