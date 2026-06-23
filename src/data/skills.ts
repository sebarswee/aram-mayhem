import { Skill } from '@/types';

// 基础技能数据
export const SKILLS: Record<string, Skill> = {
  // ==================== 投射物技能 ====================
  fireball: {
    id: 'fireball',
    name: '火球术',
    description: '发射一颗火球，造成范围伤害',
    type: 'basic',
    elements: ['fire'],
    categories: ['projectile'],
    range: 'long',
    cooldown: 1500,
    damage: 15,
    rangeValue: 400,
    speed: 300,
    effects: [{ type: 'damage', value: 15 }],
  },

  ice_shard: {
    id: 'ice_shard',
    name: '冰刺',
    description: '发射冰刺，减速敌人',
    type: 'basic',
    elements: ['ice'],
    categories: ['projectile'],
    range: 'mid',
    cooldown: 1000,
    damage: 10,
    rangeValue: 300,
    speed: 350,
    effects: [
      { type: 'damage', value: 10 },
      { type: 'freeze', value: 0.3, duration: 1500 },
    ],
  },

  lightning_bolt: {
    id: 'lightning_bolt',
    name: '闪电箭',
    description: '发射闪电，可连锁攻击3个敌人',
    type: 'basic',
    elements: ['lightning'],
    categories: ['projectile'],
    range: 'long',
    cooldown: 2000,
    damage: 20,
    rangeValue: 500,
    speed: 500,
    chainCount: 3,        // 连锁次数
    chainRange: 150,      // 连锁范围
    chainDamageDecay: 0.8, // 每次连锁伤害衰减
    effects: [{ type: 'damage', value: 20 }],
  },

  // ==================== 范围技能 ====================
  flame_circle: {
    id: 'flame_circle',
    name: '烈焰环',
    description: '在自身周围释放火焰环',
    type: 'basic',
    elements: ['fire'],
    categories: ['area'],
    range: 'melee',
    cooldown: 3000,
    damage: 25,
    rangeValue: 100,
    effects: [
      { type: 'damage', value: 25 },
      { type: 'burn', value: 5, duration: 3000 },
    ],
  },

  frost_nova: {
    id: 'frost_nova',
    name: '冰霜新星',
    description: '释放冰霜冲击波，冻结周围敌人',
    type: 'basic',
    elements: ['ice'],
    categories: ['area'],
    range: 'melee',
    cooldown: 4000,
    damage: 30,
    rangeValue: 150,
    effects: [
      { type: 'damage', value: 30 },
      { type: 'freeze', value: 1, duration: 2000 },
    ],
  },

  whirlwind: {
    id: 'whirlwind',
    name: '旋风斩',
    description: '原地旋转，对周围敌人造成伤害',
    type: 'basic',
    elements: ['physical'],
    categories: ['area'],
    range: 'melee',
    cooldown: 4000,
    damage: 30,
    rangeValue: 120,
    effects: [{ type: 'damage', value: 30 }],
  },

  poison_cloud: {
    id: 'poison_cloud',
    name: '毒雾',
    description: '释放毒雾，持续伤害范围内敌人',
    type: 'basic',
    elements: ['shadow'],
    categories: ['area'],
    range: 'mid',
    cooldown: 5000,
    damage: 20,
    rangeValue: 150,
    effects: [
      { type: 'damage', value: 20 },
      { type: 'poison', value: 5, duration: 3000 },
    ],
  },

  // ==================== 大招 ====================
  meteor: {
    id: 'meteor',
    name: '陨石',
    description: '召唤陨石砸向敌人最密集区域',
    type: 'ultimate',
    elements: ['fire'],
    categories: ['area'],
    range: 'long',
    cooldown: 15000,
    damage: 80,
    rangeValue: 200,
    effects: [
      { type: 'damage', value: 80 },
      { type: 'burn', value: 10, duration: 5000 },
    ],
    rarity: 'common',
  },

  blizzard: {
    id: 'blizzard',
    name: '暴风雪',
    description: '召唤暴风雪，持续伤害并减速范围内敌人',
    type: 'ultimate',
    elements: ['ice'],
    categories: ['area'],
    range: 'long',
    cooldown: 18000,
    damage: 50,
    rangeValue: 250,
    effects: [
      { type: 'damage', value: 50 },
      { type: 'freeze', value: 0.5, duration: 4000 },
    ],
    rarity: 'common',
  },

  thunder_storm: {
    id: 'thunder_storm',
    name: '雷霆风暴',
    description: '召唤雷电风暴，随机雷击范围内敌人',
    type: 'ultimate',
    elements: ['lightning'],
    categories: ['area'],
    range: 'long',
    cooldown: 20000,
    damage: 40,
    rangeValue: 300,
    effects: [
      { type: 'damage', value: 40 },
      { type: 'stun', value: 0, duration: 500 },
    ],
    rarity: 'rare',
  },
};

// 获取随机技能组(3小技能 + 1大招)
export function getRandomSkillSet(): { basics: Skill[]; ultimate: Skill } {
  const basicSkills = Object.values(SKILLS).filter((s) => s.type === 'basic');
  const ultimateSkills = Object.values(SKILLS).filter((s) => s.type === 'ultimate');

  // 随机选择3个基础技能
  const shuffledBasics = basicSkills.sort(() => Math.random() - 0.5);
  const selectedBasics = shuffledBasics.slice(0, 3);

  // 随机选择1个大招(考虑稀有度)
  const ultimate = selectUltimateByRarity(ultimateSkills);

  return { basics: selectedBasics, ultimate };
}

// 根据稀有度选择大招
function selectUltimateByRarity(ultimates: Skill[]): Skill {
  const roll = Math.random();

  if (roll < 0.05) {
    // 5% 传说
    const legendary = ultimates.filter((s) => s.rarity === 'legendary');
    if (legendary.length > 0) {
      return legendary[Math.floor(Math.random() * legendary.length)];
    }
  }

  if (roll < 0.30) {
    // 25% 稀有
    const rare = ultimates.filter((s) => s.rarity === 'rare');
    if (rare.length > 0) {
      return rare[Math.floor(Math.random() * rare.length)];
    }
  }

  // 70% 普通
  const common = ultimates.filter((s) => s.rarity === 'common' || !s.rarity);
  return common[Math.floor(Math.random() * common.length)];
}

// 获取单个技能
export function getSkill(id: string): Skill | undefined {
  return SKILLS[id];
}
