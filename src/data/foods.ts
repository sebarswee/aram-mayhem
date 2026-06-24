// src/data/foods.ts
import { FoodConfig, Rarity } from '@/types';

// 食物配置
export const FOODS: FoodConfig[] = [
  // 普通（60%）
  { id: 'chicken', name: '烤鸡', healAmount: 30, rarity: 'common', emoji: '🍗' },
  { id: 'meat', name: '牛排', healAmount: 50, rarity: 'common', emoji: '🥩' },
  // 稀有（30%）
  { id: 'cake', name: '蛋糕', healAmount: 80, rarity: 'rare', emoji: '🍰' },
  { id: 'roast', name: '烤肉', healAmount: 100, rarity: 'rare', emoji: '🍖' },
  // 史诗（8%）
  { id: 'golden_apple', name: '金苹果', healAmount: 150, rarity: 'epic', emoji: '🍎', special: 'clear_debuff' },
  // 传说（2%）
  { id: 'feast', name: '满汉全席', healAmount: 9999, rarity: 'legendary', emoji: '🍱', special: 'full_heal' },
];

// 掉落权重
const DROP_WEIGHTS: Record<Rarity, number> = {
  common: 60,
  rare: 30,
  epic: 8,
  legendary: 2,
  mythic: 0,
};

// 随机获取食物
export function getRandomFood(): FoodConfig | null {
  const totalWeight = Object.values(DROP_WEIGHTS).reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;

  for (const [rarity, weight] of Object.entries(DROP_WEIGHTS)) {
    roll -= weight;
    if (roll <= 0) {
      const foodsOfRarity = FOODS.filter(f => f.rarity === rarity);
      if (foodsOfRarity.length > 0) {
        return foodsOfRarity[Math.floor(Math.random() * foodsOfRarity.length)];
      }
    }
  }

  return FOODS[0];
}

// 获取食物掉落概率
export function getFoodDropRate(enemyType: 'normal' | 'elite' | 'boss'): number {
  switch (enemyType) {
    case 'normal': return 0.03;
    case 'elite': return 0.15;
    case 'boss': return 1.0;
  }
}
