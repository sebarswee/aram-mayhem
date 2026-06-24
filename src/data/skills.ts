// src/data/skills.ts
import { Skill, SkillEffect, SkillEvolution } from '@/types';
import { Element } from '@/types';

// 创建技能的辅助函数
function createSkill(base: Omit<Skill, 'level' | 'maxLevel' | 'enhancements' | 'evolutions' | 'baseValues' | 'elements' | 'categories' | 'range'>): Skill {
  // 根据 rangeValue 推断 range
  let range: 'melee' | 'mid' | 'long' = 'mid';
  if (base.rangeValue <= 150) range = 'melee';
  else if (base.rangeValue >= 400) range = 'long';

  return {
    ...base,
    elements: [base.element],  // 兼容旧系统
    categories: [base.category],  // 兼容旧系统
    range,  // 兼容旧系统
    level: 1,
    maxLevel: 5,
    enhancements: [],
    evolutions: [],
    baseValues: {
      damage: base.damage,
      range: base.rangeValue,
      cooldown: base.cooldown,
      projectileCount: 1,
    },
  };
}

// 基础技能（16个）
export const SKILLS: Record<string, Skill> = {
  // ===== 火属性 =====
  fireball: createSkill({
    id: 'fireball',
    name: '火球术',
    description: '发射火球，命中造成范围伤害',
    type: 'basic',
    element: 'fire',
    category: 'projectile',
    cooldown: 1500,
    damage: 15,
    rangeValue: 400,
    speed: 300,
    effects: [{ type: 'damage', value: 15 }, { type: 'burn', value: 5, duration: 3000 }],
  }),

  flame_wave: createSkill({
    id: 'flame_wave',
    name: '烈焰波',
    description: '向前释放火焰波，持续灼烧',
    type: 'basic',
    element: 'fire',
    category: 'area',
    cooldown: 2500,
    damage: 20,
    rangeValue: 150,
    effects: [{ type: 'damage', value: 20 }, { type: 'burn', value: 8, duration: 4000 }],
  }),

  // ===== 水属性 =====
  water_bullet: createSkill({
    id: 'water_bullet',
    name: '水弹',
    description: '发射水弹，减速敌人',
    type: 'basic',
    element: 'water',
    category: 'projectile',
    cooldown: 1200,
    damage: 12,
    rangeValue: 350,
    speed: 320,
    effects: [{ type: 'damage', value: 12 }, { type: 'slow', value: 0.3, duration: 2000 }],
  }),

  tidal_wave: createSkill({
    id: 'tidal_wave',
    name: '潮汐',
    description: '释放水流，推开敌人并减速',
    type: 'basic',
    element: 'water',
    category: 'area',
    cooldown: 3000,
    damage: 18,
    rangeValue: 120,
    effects: [{ type: 'damage', value: 18 }, { type: 'knockback', value: 100 }, { type: 'slow', value: 0.4, duration: 2000 }],
  }),

  // ===== 冰属性 =====
  ice_shard: createSkill({
    id: 'ice_shard',
    name: '冰刺',
    description: '发射冰刺，冻结敌人',
    type: 'basic',
    element: 'ice',
    category: 'projectile',
    cooldown: 1800,
    damage: 10,
    rangeValue: 300,
    speed: 350,
    effects: [{ type: 'damage', value: 10 }, { type: 'freeze', value: 1, duration: 1500 }],
  }),

  frost_nova: createSkill({
    id: 'frost_nova',
    name: '冰霜新星',
    description: '释放冰霜冲击波，冻结周围',
    type: 'basic',
    element: 'ice',
    category: 'area',
    cooldown: 4000,
    damage: 25,
    rangeValue: 150,
    effects: [{ type: 'damage', value: 25 }, { type: 'freeze', value: 1, duration: 2000 }],
  }),

  // ===== 电属性 =====
  lightning_bolt: createSkill({
    id: 'lightning_bolt',
    name: '闪电箭',
    description: '发射闪电，连锁攻击3个敌人',
    type: 'basic',
    element: 'lightning',
    category: 'projectile',
    cooldown: 2000,
    damage: 18,
    rangeValue: 500,
    speed: 500,
    effects: [{ type: 'damage', value: 18 }],
    chainCount: 3,
    chainRange: 150,
    chainDamageDecay: 0.8,
  }),

  thunder_storm: createSkill({
    id: 'thunder_storm',
    name: '雷暴',
    description: '召唤雷暴，随机雷击敌人',
    type: 'basic',
    element: 'lightning',
    category: 'area',
    cooldown: 3500,
    damage: 22,
    rangeValue: 200,
    effects: [{ type: 'damage', value: 22 }, { type: 'stun', value: 0, duration: 500 }],
  }),

  // ===== 光属性 =====
  holy_light: createSkill({
    id: 'holy_light',
    name: '圣光',
    description: '释放圣光，伤害敌人并治疗自己',
    type: 'basic',
    element: 'holy',
    category: 'area',
    cooldown: 3000,
    damage: 15,
    rangeValue: 130,
    effects: [{ type: 'damage', value: 15 }, { type: 'heal', value: 10 }],
  }),

  divine_shield: createSkill({
    id: 'divine_shield',
    name: '神圣护盾',
    description: '获得护盾，反弹伤害',
    type: 'basic',
    element: 'holy',
    category: 'buff',
    cooldown: 8000,
    damage: 0,
    rangeValue: 0,
    effects: [{ type: 'shield', value: 50 }],
  }),

  // ===== 暗属性 =====
  shadow_bolt: createSkill({
    id: 'shadow_bolt',
    name: '暗影箭',
    description: '发射暗影箭，中毒敌人',
    type: 'basic',
    element: 'shadow',
    category: 'projectile',
    cooldown: 1500,
    damage: 14,
    rangeValue: 320,
    speed: 340,
    effects: [{ type: 'damage', value: 14 }, { type: 'poison', value: 6, duration: 4000 }],
  }),

  curse_aura: createSkill({
    id: 'curse_aura',
    name: '诅咒光环',
    description: '释放诅咒，降低敌人攻防',
    type: 'basic',
    element: 'shadow',
    category: 'area',
    cooldown: 4000,
    damage: 10,
    rangeValue: 140,
    effects: [{ type: 'damage', value: 10 }],
  }),

  // ===== 草属性 =====
  vine_whip: createSkill({
    id: 'vine_whip',
    name: '藤蔓鞭',
    description: '发射藤蔓，缠绕敌人',
    type: 'basic',
    element: 'grass',
    category: 'projectile',
    cooldown: 1800,
    damage: 12,
    rangeValue: 280,
    speed: 300,
    effects: [{ type: 'damage', value: 12 }, { type: 'stun', value: 0, duration: 800 }],
  }),

  poison_cloud: createSkill({
    id: 'poison_cloud',
    name: '毒雾',
    description: '释放毒雾，持续伤害',
    type: 'basic',
    element: 'grass',
    category: 'area',
    cooldown: 3500,
    damage: 15,
    rangeValue: 150,
    effects: [{ type: 'damage', value: 15 }, { type: 'poison', value: 8, duration: 5000 }],
  }),

  // ===== 土属性 =====
  rock_spike: createSkill({
    id: 'rock_spike',
    name: '岩刺',
    description: '地面刺出岩石，击飞敌人',
    type: 'basic',
    element: 'earth',
    category: 'area',
    cooldown: 2500,
    damage: 22,
    rangeValue: 130,
    effects: [{ type: 'damage', value: 22 }, { type: 'knockback', value: 80 }],
  }),

  sandstorm: createSkill({
    id: 'sandstorm',
    name: '沙暴',
    description: '召唤沙暴，眩晕敌人',
    type: 'basic',
    element: 'earth',
    category: 'area',
    cooldown: 4000,
    damage: 18,
    rangeValue: 160,
    effects: [{ type: 'damage', value: 18 }, { type: 'stun', value: 0, duration: 1000 }],
  }),

  // ===== 大招（8个）=====
  meteor: createSkill({
    id: 'meteor',
    name: '陨石坠落',
    description: '召唤陨石，大范围爆炸+灼烧',
    type: 'ultimate',
    element: 'fire',
    category: 'area',
    cooldown: 20000,
    damage: 80,
    rangeValue: 200,
    effects: [{ type: 'damage', value: 80 }, { type: 'burn', value: 15, duration: 5000 }],
  }),

  tsunami: createSkill({
    id: 'tsunami',
    name: '海啸',
    description: '召唤海啸，全屏推开并伤害敌人',
    type: 'ultimate',
    element: 'water',
    category: 'area',
    cooldown: 22000,
    damage: 60,
    rangeValue: 500,
    effects: [{ type: 'damage', value: 60 }, { type: 'knockback', value: 200 }],
  }),

  blizzard: createSkill({
    id: 'blizzard',
    name: '暴风雪',
    description: '召唤暴风雪，持续冻结+伤害',
    type: 'ultimate',
    element: 'ice',
    category: 'area',
    cooldown: 25000,
    damage: 50,
    rangeValue: 250,
    effects: [{ type: 'damage', value: 50 }, { type: 'freeze', value: 0.5, duration: 4000 }],
  }),

  thunder_strike: createSkill({
    id: 'thunder_strike',
    name: '雷神之怒',
    description: '全屏雷击，随机打击15次',
    type: 'ultimate',
    element: 'lightning',
    category: 'area',
    cooldown: 18000,
    damage: 40,
    rangeValue: 400,
    effects: [{ type: 'damage', value: 40 }, { type: 'stun', value: 0, duration: 300 }],
  }),

  holy_judgment: createSkill({
    id: 'holy_judgment',
    name: '神圣审判',
    description: '全屏伤害+自身满血',
    type: 'ultimate',
    element: 'holy',
    category: 'area',
    cooldown: 30000,
    damage: 70,
    rangeValue: 500,
    effects: [{ type: 'damage', value: 70 }, { type: 'heal', value: 999 }],
  }),

  void_rift: createSkill({
    id: 'void_rift',
    name: '虚空裂隙',
    description: '打开裂隙，持续吸引和伤害敌人',
    type: 'ultimate',
    element: 'shadow',
    category: 'area',
    cooldown: 22000,
    damage: 55,
    rangeValue: 180,
    effects: [{ type: 'damage', value: 55 }, { type: 'poison', value: 10, duration: 5000 }],
  }),

  overgrowth: createSkill({
    id: 'overgrowth',
    name: '过度生长',
    description: '召唤森林，缠绕并持续伤害全屏敌人',
    type: 'ultimate',
    element: 'grass',
    category: 'area',
    cooldown: 28000,
    damage: 45,
    rangeValue: 400,
    effects: [{ type: 'damage', value: 45 }, { type: 'stun', value: 0, duration: 1500 }],
  }),

  earthquake: createSkill({
    id: 'earthquake',
    name: '大地震击',
    description: '全屏地震，眩晕所有敌人',
    type: 'ultimate',
    element: 'earth',
    category: 'area',
    cooldown: 24000,
    damage: 60,
    rangeValue: 500,
    effects: [{ type: 'damage', value: 60 }, { type: 'stun', value: 0, duration: 2000 }],
  }),
};

// 获取所有基础技能
export function getBasicSkills(): Skill[] {
  return Object.values(SKILLS).filter(s => s.type === 'basic');
}

// 获取所有大招
export function getUltimateSkills(): Skill[] {
  return Object.values(SKILLS).filter(s => s.type === 'ultimate');
}

// 获取随机基础技能（开局选择）
export function getRandomBasicSkills(count: number): Skill[] {
  const basics = getBasicSkills();
  const shuffled = basics.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(cloneSkill);
}

// 获取单个技能
export function getSkill(id: string): Skill | undefined {
  return SKILLS[id];
}

// 克隆技能
export function cloneSkill(skill: Skill): Skill {
  return {
    ...skill,
    effects: [...skill.effects],
    enhancements: [...skill.enhancements],
    evolutions: [...skill.evolutions],
    baseValues: { ...skill.baseValues },
  };
}

// 获取随机大招（兼容旧系统）
export function getRandomUltimate(excludeIds: string[] = []): Skill | null {
  const ultimates = getUltimateSkills().filter(s => !excludeIds.includes(s.id));
  if (ultimates.length === 0) return null;

  // 按稀有度选择
  const roll = Math.random();
  if (roll < 0.3) {
    const rare = ultimates.filter(s => s.rarity === 'rare');
    if (rare.length > 0) {
      return cloneSkill(rare[Math.floor(Math.random() * rare.length)]);
    }
  }
  const common = ultimates.filter(s => s.rarity === 'common' || !s.rarity);
  return cloneSkill(common[Math.floor(Math.random() * common.length)] || ultimates[0]);
}

// 获取随机技能（兼容旧系统）
export function getRandomSkill(excludeIds: string[] = []): Skill | null {
  const basics = getBasicSkills().filter(s => !excludeIds.includes(s.id));
  if (basics.length === 0) return null;
  return cloneSkill(basics[Math.floor(Math.random() * basics.length)]);
}