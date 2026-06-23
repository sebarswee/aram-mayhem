import { Skill, SkillBaseValues } from '@/types';

// 创建技能的辅助函数，自动填充 baseValues 和 enhancements
function createSkill(base: Omit<Skill, 'enhancements' | 'baseValues'>): Skill {
  return {
    ...base,
    enhancements: [],
    baseValues: {
      damage: base.damage,
      range: base.rangeValue,
      projectileCount: 1,
      pierce: 0,
      cooldown: base.cooldown,
    },
  };
}

// 基础技能数据
export const SKILLS: Record<string, Skill> = {
  // ==================== 投射物技能 ====================
  fireball: createSkill({
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
  }),

  ice_shard: createSkill({
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
  }),

  lightning_bolt: createSkill({
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
    chainCount: 3,
    chainRange: 150,
    chainDamageDecay: 0.8,
    effects: [{ type: 'damage', value: 20 }],
  }),

  // ==================== 新投射物技能 ====================
  multi_shot: createSkill({
    id: 'multi_shot',
    name: '多重箭',
    description: '同时射出3支箭矢',
    type: 'basic',
    elements: ['physical'],
    categories: ['projectile'],
    range: 'long',
    cooldown: 2000,
    damage: 8,
    rangeValue: 350,
    speed: 400,
    effects: [{ type: 'damage', value: 8 }],
  }),

  boomerang: createSkill({
    id: 'boomerang',
    name: '回旋镖',
    description: '投掷回旋镖，往返都造成伤害',
    type: 'basic',
    elements: ['physical'],
    categories: ['projectile'],
    range: 'mid',
    cooldown: 2500,
    damage: 18,
    rangeValue: 250,
    speed: 250,
    effects: [{ type: 'damage', value: 18 }],
  }),

  homing_missile: createSkill({
    id: 'homing_missile',
    name: '追踪弹',
    description: '发射自动追踪敌人的导弹',
    type: 'basic',
    elements: ['fire'],
    categories: ['projectile'],
    range: 'long',
    cooldown: 3000,
    damage: 25,
    rangeValue: 400,
    speed: 200,
    effects: [{ type: 'damage', value: 25 }],
  }),

  poison_dart: createSkill({
    id: 'poison_dart',
    name: '毒镖',
    description: '发射带毒的飞镖，造成持续伤害',
    type: 'basic',
    elements: ['shadow'],
    categories: ['projectile'],
    range: 'mid',
    cooldown: 1800,
    damage: 12,
    rangeValue: 300,
    speed: 380,
    effects: [
      { type: 'damage', value: 12 },
      { type: 'poison', value: 6, duration: 4000 },
    ],
  }),

  // ==================== 范围技能 ====================
  flame_circle: createSkill({
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
  }),

  frost_nova: createSkill({
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
  }),

  whirlwind: createSkill({
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
  }),

  poison_cloud: createSkill({
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
  }),

  // ==================== 新范围技能 ====================
  ground_spike: createSkill({
    id: 'ground_spike',
    name: '地刺',
    description: '从地面刺出尖刺，击飞敌人',
    type: 'basic',
    elements: ['physical'],
    categories: ['area'],
    range: 'mid',
    cooldown: 3500,
    damage: 28,
    rangeValue: 130,
    effects: [
      { type: 'damage', value: 28 },
      { type: 'knockback', value: 100 },
    ],
  }),

  holy_light: createSkill({
    id: 'holy_light',
    name: '神圣之光',
    description: '释放圣光，治疗自己并伤害周围敌人',
    type: 'basic',
    elements: ['holy'],
    categories: ['area'],
    range: 'melee',
    cooldown: 4000,
    damage: 20,
    rangeValue: 120,
    effects: [
      { type: 'damage', value: 20 },
      { type: 'heal', value: 15 },
    ],
  }),

  black_hole: createSkill({
    id: 'black_hole',
    name: '黑洞',
    description: '创造黑洞，吸引周围敌人并造成伤害',
    type: 'basic',
    elements: ['shadow'],
    categories: ['area'],
    range: 'mid',
    cooldown: 6000,
    damage: 35,
    rangeValue: 180,
    effects: [{ type: 'damage', value: 35 }],
  }),

  time_stop: createSkill({
    id: 'time_stop',
    name: '时间停止',
    description: '暂停范围内敌人的行动',
    type: 'basic',
    elements: ['shadow'],
    categories: ['area', 'control'],
    range: 'mid',
    cooldown: 8000,
    damage: 15,
    rangeValue: 140,
    effects: [
      { type: 'damage', value: 15 },
      { type: 'stun', value: 0, duration: 2000 },
    ],
  }),

  // ==================== 召唤/防御技能 ====================
  summon: createSkill({
    id: 'summon',
    name: '召唤精灵',
    description: '召唤一个小精灵自动攻击敌人',
    type: 'basic',
    elements: ['holy'],
    categories: ['summon'],
    range: 'long',
    cooldown: 10000,
    damage: 10,
    rangeValue: 300,
    effects: [{ type: 'damage', value: 10 }],
  }),

  shield: createSkill({
    id: 'shield',
    name: '防御护盾',
    description: '获得临时护盾，抵挡伤害',
    type: 'basic',
    elements: ['holy'],
    categories: ['buff'],
    range: 'melee',
    cooldown: 12000,
    damage: 0,
    rangeValue: 0,
    effects: [{ type: 'shield', value: 50 }],
  }),

  // ==================== 大招 ====================
  meteor: createSkill({
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
  }),

  blizzard: createSkill({
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
  }),

  thunder_storm: createSkill({
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
  }),
};

// ==================== 辅助函数 ====================

/**
 * 获取所有基础技能
 */
export function getBasicSkills(): Skill[] {
  return Object.values(SKILLS).filter((s) => s.type === 'basic');
}

/**
 * 获取所有大招
 */
export function getUltimateSkills(): Skill[] {
  return Object.values(SKILLS).filter((s) => s.type === 'ultimate');
}

/**
 * 获取随机基础技能（用于开局选择）
 */
export function getRandomBasicSkills(count: number): Skill[] {
  const basics = getBasicSkills();
  const shuffled = basics.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * 获取随机大招（用于解锁）
 */
export function getRandomUltimate(excludeIds: string[] = []): Skill | null {
  const ultimates = getUltimateSkills().filter((s) => !excludeIds.includes(s.id));
  if (ultimates.length === 0) return null;

  // 按稀有度选择
  const roll = Math.random();
  if (roll < 0.3) {
    const rare = ultimates.filter((s) => s.rarity === 'rare');
    if (rare.length > 0) {
      return rare[Math.floor(Math.random() * rare.length)];
    }
  }
  const common = ultimates.filter((s) => s.rarity === 'common' || !s.rarity);
  return common[Math.floor(Math.random() * common.length)] || ultimates[0];
}

/**
 * 获取随机技能（用于升级选择）
 */
export function getRandomSkill(excludeIds: string[] = []): Skill | null {
  const basics = getBasicSkills().filter((s) => !excludeIds.includes(s.id));
  if (basics.length === 0) return null;
  return basics[Math.floor(Math.random() * basics.length)];
}

/**
 * 获取单个技能
 */
export function getSkill(id: string): Skill | undefined {
  return SKILLS[id];
}

/**
 * 克隆技能（避免引用问题）
 */
export function cloneSkill(skill: Skill): Skill {
  return {
    ...skill,
    effects: [...skill.effects],
    enhancements: [...skill.enhancements],
    baseValues: { ...skill.baseValues },
  };
}
