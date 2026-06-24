// src/data/elements.ts
import { Element, SynergyResult } from '@/types';

// 8元素定义
export const ELEMENTS: Element[] = [
  'fire', 'water', 'ice', 'lightning', 'holy', 'shadow', 'grass', 'earth'
];

// 元素颜色
export const ELEMENT_COLORS: Record<Element, number> = {
  fire: 0xff4400,
  water: 0x4488ff,
  ice: 0x88ddff,
  lightning: 0xffff00,
  holy: 0xffcc00,
  shadow: 0x8800ff,
  grass: 0x44ff44,
  earth: 0xaa8844,
};

// 元素名称（中文）
export const ELEMENT_NAMES: Record<Element, string> = {
  fire: '火',
  water: '水',
  ice: '冰',
  lightning: '电',
  holy: '光',
  shadow: '暗',
  grass: '草',
  earth: '土',
};

// 克制关系（克制方伤害+50%）
// 元素组1: 水 → 火 → 草 → 水
// 元素组2: 冰 → 电 → 土 → 冰
// 元素组3: 光 ↔ 暗
export const COUNTER_RELATIONS: Array<{ attacker: Element; defender: Element; bonus: number }> = [
  // 元素组1
  { attacker: 'water', defender: 'fire', bonus: 0.5 },
  { attacker: 'fire', defender: 'grass', bonus: 0.5 },
  { attacker: 'grass', defender: 'water', bonus: 0.5 },
  // 元素组2
  { attacker: 'ice', defender: 'lightning', bonus: 0.5 },
  { attacker: 'lightning', defender: 'earth', bonus: 0.5 },
  { attacker: 'earth', defender: 'ice', bonus: 0.5 },
  // 元素组3
  { attacker: 'holy', defender: 'shadow', bonus: 0.5 },
  { attacker: 'shadow', defender: 'holy', bonus: 0.5 },
];

// 羁绊组合（28种）
export const SYNERGIES: Record<string, SynergyResult> = {
  // 水系组合
  'water+fire': { name: '蒸发', elements: ['water', 'fire'], effect: 'true_damage_percent', value: 0.2 },
  'water+ice': { name: '冻结', elements: ['water', 'ice'], effect: 'freeze', duration: 3000 },
  'water+lightning': { name: '传导', elements: ['water', 'lightning'], effect: 'chain_boost', value: 1.5 },
  'water+grass': { name: '蔓延', elements: ['water', 'grass'], effect: 'spread_debuff' },
  'water+earth': { name: '沼泽', elements: ['water', 'earth'], effect: 'slow', value: 0.7, duration: 3000 },
  'water+holy': { name: '净化之水', elements: ['water', 'holy'], effect: 'dispel_and_damage' },
  'water+shadow': { name: '浊流', elements: ['water', 'shadow'], effect: 'damage_increase', value: 0.3, duration: 5000 },

  // 火系组合
  'fire+ice': { name: '融化', elements: ['fire', 'ice'], effect: 'double_damage', duration: 2000 },
  'fire+lightning': { name: '爆炸', elements: ['fire', 'lightning'], effect: 'explosion', value: 1.0 },
  'fire+grass': { name: '燎原', elements: ['fire', 'grass'], effect: 'burn_spread' },
  'fire+earth': { name: '熔岩', elements: ['fire', 'earth'], effect: 'lava_zone' },
  'fire+holy': { name: '圣火', elements: ['fire', 'holy'], effect: 'damage_to_shield', value: 0.5 },
  'fire+shadow': { name: '冥炎', elements: ['fire', 'shadow'], effect: 'damage_boost_no_heal', value: 0.5 },

  // 冰系组合
  'ice+lightning': { name: '超导', elements: ['ice', 'lightning'], effect: 'cooldown_refresh' },
  'ice+grass': { name: '寒藤', elements: ['ice', 'grass'], effect: 'root', duration: 2000 },
  'ice+earth': { name: '冰刺', elements: ['ice', 'earth'], effect: 'knockup' },
  'ice+holy': { name: '冰晶', elements: ['ice', 'holy'], effect: 'refract_damage' },
  'ice+shadow': { name: '死霜', elements: ['ice', 'shadow'], effect: 'death_explosion' },

  // 电系组合
  'lightning+grass': { name: '激化', elements: ['lightning', 'grass'], effect: 'tick_speed_double' },
  'lightning+earth': { name: '地震', elements: ['lightning', 'earth'], effect: 'stun', duration: 1500 },
  'lightning+holy': { name: '天罚', elements: ['lightning', 'holy'], effect: 'guaranteed_crit', value: 0.5 },
  'lightning+shadow': { name: '幻雷', elements: ['lightning', 'shadow'], effect: 'split_3' },

  // 草系组合
  'grass+earth': { name: '缠绕', elements: ['grass', 'earth'], effect: 'root', duration: 2000 },
  'grass+holy': { name: '光合作用', elements: ['grass', 'holy'], effect: 'lifesteal', value: 0.3 },
  'grass+shadow': { name: '腐蚀', elements: ['grass', 'shadow'], effect: 'defense_reduce', value: 0.5, duration: 5000 },

  // 土系组合
  'earth+holy': { name: '圣域', elements: ['earth', 'holy'], effect: 'heal_zone', value: 5, duration: 5000 },
  'earth+shadow': { name: '结界', elements: ['earth', 'shadow'], effect: 'barrier', duration: 3000 },

  // 光暗组合
  'holy+shadow': { name: '湮灭', elements: ['holy', 'shadow'], effect: 'true_damage_confuse', duration: 2000 },
};

// 辅助函数：获取元素颜色
export function getElementColor(element: Element): number {
  return ELEMENT_COLORS[element] || 0xffffff;
}

// 辅助函数：获取克制加成
export function getCounterBonus(attacker: Element, defender: Element): number {
  const relation = COUNTER_RELATIONS.find(
    r => r.attacker === attacker && r.defender === defender
  );
  return relation?.bonus || 0;
}

// 辅助函数：获取羁绊效果
export function getSynergy(element1: Element, element2: Element): SynergyResult | null {
  const key1 = `${element1}+${element2}`;
  const key2 = `${element2}+${element1}`;
  return SYNERGIES[key1] || SYNERGIES[key2] || null;
}

// 辅助函数：检查是否克制
export function isCounter(attacker: Element, defender: Element): boolean {
  return COUNTER_RELATIONS.some(
    r => r.attacker === attacker && r.defender === defender
  );
}
