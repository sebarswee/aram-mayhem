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
    name: '火焰喷射',
    description: '向前喷射锥形火焰，持续灼烧',
    type: 'basic',
    element: 'fire',
    category: 'area',
    cooldown: 3000,
    damage: 8,
    rangeValue: 180,
    effects: [{ type: 'damage', value: 8 }, { type: 'burn', value: 10, duration: 3000 }],
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
    damage: 15,
    rangeValue: 350,
    speed: 320,
    effects: [{ type: 'damage', value: 15 }, { type: 'slow', value: 0.3, duration: 2000 }],
  }),

  tidal_wave: createSkill({
    id: 'tidal_wave',
    name: '水波推进',
    description: '向前释放水流波浪，击退路径上敌人',
    type: 'basic',
    element: 'water',
    category: 'area',
    cooldown: 3500,
    damage: 20,
    rangeValue: 300,
    effects: [{ type: 'damage', value: 20 }, { type: 'knockback', value: 80 }, { type: 'slow', value: 0.3, duration: 2000 }],
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
    name: '冰晶爆发',
    description: '释放8个冰晶向四周射出，冻结路径敌人',
    type: 'basic',
    element: 'ice',
    category: 'area',
    cooldown: 4500,
    damage: 22,
    rangeValue: 200,
    effects: [{ type: 'damage', value: 22 }, { type: 'freeze', value: 1, duration: 1500 }],
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
    name: '雷击阵',
    description: '在范围内标记3个雷击点，延迟后精确雷击',
    type: 'basic',
    element: 'lightning',
    category: 'area',
    cooldown: 4000,
    damage: 28,
    rangeValue: 250,
    effects: [{ type: 'damage', value: 28 }, { type: 'stun', value: 0, duration: 600 }],
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
    effects: [{ type: 'shield', value: 50 }, { type: 'damage_reflect', value: 0.3, duration: 8000 }],
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
    name: '诅咒链',
    description: '诅咒最近敌人并连锁传播，降低防御',
    type: 'basic',
    element: 'shadow',
    category: 'area',
    cooldown: 4500,
    damage: 12,
    rangeValue: 180,
    effects: [{ type: 'damage', value: 12 }, { type: 'defense_break', value: 0.35, duration: 4000 }],
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
    name: '地刺陷阱',
    description: '在地面生成地刺，敌人踩中触发击飞',
    type: 'basic',
    element: 'earth',
    category: 'area',
    cooldown: 5000,
    damage: 25,
    rangeValue: 100,
    effects: [{ type: 'damage', value: 25 }, { type: 'knockback', value: 100 }, { type: 'stun', value: 0, duration: 500 }],
  }),

  sandstorm: createSkill({
    id: 'sandstorm',
    name: '流沙陷阱',
    description: '创建流沙区域，敌人进入持续减速受伤',
    type: 'basic',
    element: 'earth',
    category: 'area',
    cooldown: 6000,
    damage: 12,
    rangeValue: 120,
    effects: [{ type: 'damage', value: 12 }, { type: 'slow', value: 0.5, duration: 3000 }],
  }),

  stone_skin: createSkill({
    id: 'stone_skin',
    name: '岩石壁垒',
    description: '在前方召唤岩石墙阻挡敌人，自身获得护盾',
    type: 'basic',
    element: 'earth',
    category: 'area',  // 改为 area 类别（召唤障碍物）
    cooldown: 10000,
    damage: 0,
    rangeValue: 120,  // 岩石墙距离
    effects: [
      { type: 'shield', value: 40 },  // 自身护盾
      { type: 'barrier', value: 3000 },  // 岩石墙持续3秒
    ],
  }),

  seismic_wave: createSkill({
    id: 'seismic_wave',
    name: '地裂线',
    description: '向指定方向撕裂地面，击飞路径敌人',
    type: 'basic',
    element: 'earth',
    category: 'area',
    cooldown: 4000,
    damage: 20,
    rangeValue: 280,
    effects: [{ type: 'damage', value: 20 }, { type: 'knockback', value: 120 }, { type: 'stun', value: 0, duration: 400 }],
  }),

  // ===== 新增基础技能 =====

  // 火 - 聚焦灼烧（单体高伤害，命中附加燃烧）
  ignite: createSkill({
    id: 'ignite',
    name: '聚焦灼烧',
    description: '聚焦火焰灼烧单体目标，命中后附加持续燃烧',
    type: 'basic',
    element: 'fire',
    category: 'area',
    cooldown: 2500,
    damage: 25,
    rangeValue: 300,
    effects: [{ type: 'damage', value: 25 }, { type: 'burn', value: 15, duration: 3000 }],
  }),

  // 火 - 火焰反击
  flame_shield: createSkill({
    id: 'flame_shield',
    name: '火焰反击',
    description: '获得护盾，受击时反弹伤害（最多5次）',
    type: 'basic',
    element: 'fire',
    category: 'buff',
    cooldown: 12000,
    damage: 0,
    rangeValue: 0,
    effects: [
      { type: 'shield', value: 25 },  // 降低护盾值
      { type: 'counter_damage', value: 20, duration: 10000 },  // 反击伤害
    ],
  }),

  // 水 - 水流冲刺
  water_dash: createSkill({
    id: 'water_dash',
    name: '水流冲刺',
    description: '向前冲刺，留下减速水迹',
    type: 'basic',
    element: 'water',
    category: 'area',
    cooldown: 6000,
    damage: 10,
    rangeValue: 100,
    effects: [{ type: 'damage', value: 10 }, { type: 'slow', value: 0.5, duration: 3000 }],
  }),

  // 水 - 净化
  purify: createSkill({
    id: 'purify',
    name: '净化',
    description: '清除负面状态并恢复生命',
    type: 'basic',
    element: 'water',
    category: 'buff',
    cooldown: 20000,
    damage: 0,
    rangeValue: 0,
    effects: [{ type: 'heal', value: 25 }],
  }),

  // 冰 - 冰墙
  ice_wall: createSkill({
    id: 'ice_wall',
    name: '冰墙',
    description: '创建冰墙阻挡敌人',
    type: 'basic',
    element: 'ice',
    category: 'area',
    cooldown: 8000,
    damage: 5,
    rangeValue: 80,
    effects: [{ type: 'damage', value: 5 }, { type: 'freeze', value: 1, duration: 2000 }],
  }),

  // 冰 - 冰霜屏障
  frost_armor: createSkill({
    id: 'frost_armor',
    name: '冰霜屏障',
    description: '获得护盾，受击时冻结攻击者（最多3次）',
    type: 'basic',
    element: 'ice',
    category: 'buff',
    cooldown: 10000,
    damage: 0,
    rangeValue: 0,
    effects: [
      { type: 'shield', value: 20 },  // 降低护盾值
      { type: 'counter_freeze', value: 1000, duration: 8000 },  // 冻结攻击者1秒
    ],
  }),

  // 雷 - 电荷积累
  static_field: createSkill({
    id: 'static_field',
    name: '电荷积累',
    description: '电弧在敌人间跳跃，叠加电荷后爆发',
    type: 'basic',
    element: 'lightning',
    category: 'area',
    cooldown: 5500,
    damage: 12,
    rangeValue: 200,
    effects: [{ type: 'damage', value: 12 }, { type: 'stun', value: 0, duration: 300 }],
  }),

  // 雷 - 电磁脉冲
  arc_lightning: createSkill({
    id: 'arc_lightning',
    name: '电磁脉冲',
    description: '释放向外扩散的电磁脉冲波，眩晕敌人',
    type: 'basic',
    element: 'lightning',
    category: 'area',
    cooldown: 4500,
    damage: 20,
    rangeValue: 280,
    effects: [{ type: 'damage', value: 20 }, { type: 'stun', value: 0, duration: 600 }],
  }),

  // 雷 - 雷电聚焦（单体高伤害）
  lightning_focus: createSkill({
    id: 'lightning_focus',
    name: '雷电聚焦',
    description: '凝聚雷电之力，对单体敌人造成高额伤害并麻痹',
    type: 'basic',
    element: 'lightning',
    category: 'projectile',
    cooldown: 3000,
    damage: 45,
    rangeValue: 250,
    effects: [{ type: 'damage', value: 45 }, { type: 'stun', value: 1.5, duration: 1500 }],
  }),

  // 雷 - 电场（区域持续麻痹）
  electric_field: createSkill({
    id: 'electric_field',
    name: '电场',
    description: '在当前位置创建电场，区域内敌人持续麻痹并受到低额伤害',
    type: 'basic',
    element: 'lightning',
    category: 'area',
    cooldown: 4000,
    damage: 5,
    rangeValue: 150,
    effects: [{ type: 'damage', value: 5 }, { type: 'stun', value: 0.5, duration: 500 }],
  }),

  // 光 - 光环
  halo: createSkill({
    id: 'halo',
    name: '光环',
    description: '召唤光环，持续治疗自己',
    type: 'basic',
    element: 'holy',
    category: 'buff',
    cooldown: 10000,
    damage: 0,
    rangeValue: 0,
    effects: [{ type: 'heal', value: 5 }],
  }),

  // 光 - 祝福
  blessing: createSkill({
    id: 'blessing',
    name: '祝福',
    description: '提升攻击力和暴击率',
    type: 'basic',
    element: 'holy',
    category: 'buff',
    cooldown: 18000,
    damage: 0,
    rangeValue: 0,
    effects: [{ type: 'shield', value: 20 }],
  }),

  // 暗 - 暗影分身
  shadow_step: createSkill({
    id: 'shadow_step',
    name: '暗影分身',
    description: '召唤暗影分身吸引敌人，被攻击时爆炸',
    type: 'basic',
    element: 'shadow',
    category: 'area',
    cooldown: 7000,
    damage: 15,
    rangeValue: 100,
    effects: [{ type: 'damage', value: 15 }, { type: 'poison', value: 8, duration: 4000 }],
  }),

  // 暗 - 诅咒
  hex: createSkill({
    id: 'hex',
    name: '诅咒',
    description: '诅咒敌人，降低其防御',
    type: 'basic',
    element: 'shadow',
    category: 'projectile',
    cooldown: 3000,
    damage: 10,
    rangeValue: 280,
    speed: 320,
    effects: [{ type: 'damage', value: 10 }, { type: 'defense_break', value: 0.4, duration: 4000 }],
  }),

  // 草 - 种子炸弹
  seed_bomb: createSkill({
    id: 'seed_bomb',
    name: '种子炸弹',
    description: '投掷种子，爆炸造成范围伤害',
    type: 'basic',
    element: 'grass',
    category: 'projectile',
    cooldown: 2200,
    damage: 22,
    rangeValue: 320,
    speed: 280,
    effects: [{ type: 'damage', value: 22 }],
  }),

  // 草 - 荆棘
  thorns: createSkill({
    id: 'thorns',
    name: '荆棘',
    description: '召唤荆棘，反弹伤害',
    type: 'basic',
    element: 'grass',
    category: 'buff',
    cooldown: 16000,
    damage: 0,
    rangeValue: 0,
    effects: [{ type: 'damage_reflect', value: 0.25, duration: 8000 }],
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
    damage: 30,
    rangeValue: 400,
    effects: [{ type: 'damage', value: 30 }, { type: 'stun', value: 0, duration: 300 }],
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

  // 草 - 森林之怒
  forest_rage: createSkill({
    id: 'forest_rage',
    name: '森林之怒',
    description: '召唤藤蔓从地下爆发，减速并持续伤害敌人，最终眩晕',
    type: 'ultimate',
    element: 'grass',
    category: 'area',
    cooldown: 26000,
    damage: 35,
    rangeValue: 350,
    effects: [
      { type: 'damage', value: 35 },
      { type: 'slow', value: 0.5, duration: 3000 },
      { type: 'stun', value: 0, duration: 1500 },
    ],
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

  // ===== 新增大招（12个）=====

  // 火 - 炎龙吐息
  dragon_breath: createSkill({
    id: 'dragon_breath',
    name: '炎龙吐息',
    description: '喷射火焰，持续灼烧前方扇形区域',
    type: 'ultimate',
    element: 'fire',
    category: 'area',
    cooldown: 18000,
    damage: 65,
    rangeValue: 280,
    effects: [{ type: 'damage', value: 65 }, { type: 'burn', value: 20, duration: 6000 }],
  }),

  // 火 - 烈焰风暴（燃烧扩散机制）
  inferno: createSkill({
    id: 'inferno',
    name: '烈焰风暴',
    description: '召唤火焰风暴，燃烧敌人死亡时扩散燃烧到附近敌人',
    type: 'ultimate',
    element: 'fire',
    category: 'area',
    cooldown: 30000,
    damage: 50,
    rangeValue: 200,
    effects: [{ type: 'damage', value: 50 }, { type: 'burn', value: 12, duration: 8000 }],
    specialBehaviors: ['burn_spread'],
  }),

  // 水 - 深渊漩涡
  abyss_vortex: createSkill({
    id: 'abyss_vortex',
    name: '深渊漩涡',
    description: '创建漩涡，持续吸引并伤害敌人',
    type: 'ultimate',
    element: 'water',
    category: 'area',
    cooldown: 25000,
    damage: 40,
    rangeValue: 220,
    effects: [{ type: 'damage', value: 40 }, { type: 'slow', value: 0.5, duration: 4000 }],
  }),

  // 水 - 冰封领域
  frozen_domain: createSkill({
    id: 'frozen_domain',
    name: '冰封领域',
    description: '释放冰霜领域，冻结范围内的敌人',
    type: 'ultimate',
    element: 'water',
    category: 'area',
    cooldown: 28000,
    damage: 55,
    rangeValue: 250,
    effects: [{ type: 'damage', value: 55 }, { type: 'freeze', value: 1, duration: 3000 }],
  }),

  // 冰 - 绝对零度
  absolute_zero: createSkill({
    id: 'absolute_zero',
    name: '绝对零度',
    description: '释放极寒，瞬杀低血量敌人或造成巨额伤害',
    type: 'ultimate',
    element: 'ice',
    category: 'area',
    cooldown: 35000,
    damage: 80,
    rangeValue: 180,
    effects: [{ type: 'damage', value: 80 }, { type: 'freeze', value: 1, duration: 4000 }],
  }),

  // 雷 - 雷霆万钧
  thunder_apocalypse: createSkill({
    id: 'thunder_apocalypse',
    name: '雷霆万钧',
    description: '召唤雷暴，全屏连锁雷击',
    type: 'ultimate',
    element: 'lightning',
    category: 'area',
    cooldown: 22000,
    damage: 35,
    rangeValue: 450,
    effects: [{ type: 'damage', value: 35 }, { type: 'stun', value: 0, duration: 800 }],
    chainCount: 8,
    chainRange: 180,
    chainDamageDecay: 0.85,
  }),

  // 光 - 审判之光
  judgment_light: createSkill({
    id: 'judgment_light',
    name: '审判之光',
    description: '召唤圣光，对敌人造成伤害并治疗自己',
    type: 'ultimate',
    element: 'holy',
    category: 'area',
    cooldown: 26000,
    damage: 50,
    rangeValue: 350,
    effects: [{ type: 'damage', value: 50 }, { type: 'heal', value: 30 }],
  }),

  // 光 - 圣域
  sanctuary: createSkill({
    id: 'sanctuary',
    name: '圣域',
    description: '创建神圣领域，持续治疗并免疫伤害',
    type: 'ultimate',
    element: 'holy',
    category: 'buff',
    cooldown: 40000,
    damage: 0,
    rangeValue: 0,
    effects: [{ type: 'shield', value: 100 }, { type: 'heal', value: 50 }],
  }),

  // 暗 - 暗影降临
  shadow_descent: createSkill({
    id: 'shadow_descent',
    name: '暗影降临',
    description: '释放暗影力量，降低敌人防御并造成持续伤害',
    type: 'ultimate',
    element: 'shadow',
    category: 'area',
    cooldown: 24000,
    damage: 45,
    rangeValue: 300,
    effects: [{ type: 'damage', value: 45 }, { type: 'defense_break', value: 0.5, duration: 6000 }],
  }),

  // 暗 - 死亡凋零
  death_decay: createSkill({
    id: 'death_decay',
    name: '死亡凋零',
    description: '释放死亡气息，持续吸取敌人生命',
    type: 'ultimate',
    element: 'shadow',
    category: 'area',
    cooldown: 32000,
    damage: 25,
    rangeValue: 250,
    effects: [{ type: 'damage', value: 25 }, { type: 'poison', value: 15, duration: 8000 }],
  }),

  // 草 - 自然之力
  force_of_nature: createSkill({
    id: 'force_of_nature',
    name: '自然之力',
    description: '召唤自然精灵，持续攻击周围敌人',
    type: 'ultimate',
    element: 'grass',
    category: 'summon',
    cooldown: 30000,
    damage: 20,
    rangeValue: 300,
    effects: [{ type: 'damage', value: 20 }],
  }),

  // 土 - 大地守护
  earth_guardian: createSkill({
    id: 'earth_guardian',
    name: '大地守护',
    description: '召唤大地护盾，大幅提升防御',
    type: 'ultimate',
    element: 'earth',
    category: 'buff',
    cooldown: 28000,
    damage: 0,
    rangeValue: 0,
    effects: [{ type: 'shield', value: 150 }],
  }),

  // 土 - 山崩地裂
  mountain_collapse: createSkill({
    id: 'mountain_collapse',
    name: '山崩地裂',
    description: '召唤巨石，造成范围伤害并击飞敌人',
    type: 'ultimate',
    element: 'earth',
    category: 'area',
    cooldown: 26000,
    damage: 70,
    rangeValue: 200,
    effects: [{ type: 'damage', value: 70 }, { type: 'knockback', value: 150 }, { type: 'stun', value: 0, duration: 1500 }],
  }),

  // ===== 被动技能（15个）=====

  // 生存类
  lifesteal_aura: {
    id: 'lifesteal_aura',
    name: '生命汲取',
    description: '每次造成伤害恢复生命值',
    type: 'passive',
    element: 'shadow',
    category: 'buff',
    elements: ['shadow'],
    categories: ['buff'],
    range: 'melee',
    cooldown: 0,
    damage: 0,
    rangeValue: 0,
    effects: [],
    level: 1,
    maxLevel: 5,
    enhancements: [],
    evolutions: [],
    baseValues: { damage: 0, range: 0, cooldown: 0, projectileCount: 0 },
    passiveEffect: { type: 'lifesteal', value: 0.08 },
  },

  tough_body: {
    id: 'tough_body',
    name: '坚韧体魄',
    description: '提升最大生命值',
    type: 'passive',
    element: 'earth',
    category: 'buff',
    elements: ['earth'],
    categories: ['buff'],
    range: 'melee',
    cooldown: 0,
    damage: 0,
    rangeValue: 0,
    effects: [],
    level: 1,
    maxLevel: 5,
    enhancements: [],
    evolutions: [],
    baseValues: { damage: 0, range: 0, cooldown: 0, projectileCount: 0 },
    passiveEffect: { type: 'max_hp', value: 0.15 },
  },

  evasion_instinct: {
    id: 'evasion_instinct',
    name: '闪避本能',
    description: '有几率闪避伤害',
    type: 'passive',
    element: 'water',
    category: 'buff',
    elements: ['water'],
    categories: ['buff'],
    range: 'melee',
    cooldown: 0,
    damage: 0,
    rangeValue: 0,
    effects: [],
    level: 1,
    maxLevel: 5,
    enhancements: [],
    evolutions: [],
    baseValues: { damage: 0, range: 0, cooldown: 0, projectileCount: 0 },
    passiveEffect: { type: 'dodge', value: 0.12 },
  },

  // 输出类
  berserker_heart: {
    id: 'berserker_heart',
    name: '狂暴之心',
    description: '生命值越低，攻击力越高',
    type: 'passive',
    element: 'fire',
    category: 'buff',
    elements: ['fire'],
    categories: ['buff'],
    range: 'melee',
    cooldown: 0,
    damage: 0,
    rangeValue: 0,
    effects: [],
    level: 1,
    maxLevel: 5,
    enhancements: [],
    evolutions: [],
    baseValues: { damage: 0, range: 0, cooldown: 0, projectileCount: 0 },
    passiveEffect: { type: 'berserker', value: 0.3 },
  },

  deadly_precision: {
    id: 'deadly_precision',
    name: '致命精准',
    description: '提升暴击率和暴击伤害',
    type: 'passive',
    element: 'lightning',
    category: 'buff',
    elements: ['lightning'],
    categories: ['buff'],
    range: 'melee',
    cooldown: 0,
    damage: 0,
    rangeValue: 0,
    effects: [],
    level: 1,
    maxLevel: 5,
    enhancements: [],
    evolutions: [],
    baseValues: { damage: 0, range: 0, cooldown: 0, projectileCount: 0 },
    passiveEffect: { type: 'crit_boost', value: 0.1 },
  },

  elemental_affinity: {
    id: 'elemental_affinity',
    name: '元素亲和',
    description: '提升元素技能伤害',
    type: 'passive',
    element: 'holy',
    category: 'buff',
    elements: ['holy'],
    categories: ['buff'],
    range: 'melee',
    cooldown: 0,
    damage: 0,
    rangeValue: 0,
    effects: [],
    level: 1,
    maxLevel: 5,
    enhancements: [],
    evolutions: [],
    baseValues: { damage: 0, range: 0, cooldown: 0, projectileCount: 0 },
    passiveEffect: { type: 'element_damage', value: 0.12 },
  },

  // 辅助类
  calm_mind: {
    id: 'calm_mind',
    name: '冷静心态',
    description: '降低技能冷却时间',
    type: 'passive',
    element: 'ice',
    category: 'buff',
    elements: ['ice'],
    categories: ['buff'],
    range: 'melee',
    cooldown: 0,
    damage: 0,
    rangeValue: 0,
    effects: [],
    level: 1,
    maxLevel: 5,
    enhancements: [],
    evolutions: [],
    baseValues: { damage: 0, range: 0, cooldown: 0, projectileCount: 0 },
    passiveEffect: { type: 'cooldown_reduction', value: 0.1 },
  },

  swift_steps: {
    id: 'swift_steps',
    name: '疾风步法',
    description: '提升移动速度',
    type: 'passive',
    element: 'grass',
    category: 'buff',
    elements: ['grass'],
    categories: ['buff'],
    range: 'melee',
    cooldown: 0,
    damage: 0,
    rangeValue: 0,
    effects: [],
    level: 1,
    maxLevel: 5,
    enhancements: [],
    evolutions: [],
    baseValues: { damage: 0, range: 0, cooldown: 0, projectileCount: 0 },
    passiveEffect: { type: 'speed', value: 0.15 },
  },

  shield_mastery: {
    id: 'shield_mastery',
    name: '护盾大师',
    description: '护盾效果增强',
    type: 'passive',
    element: 'holy',
    category: 'buff',
    elements: ['holy'],
    categories: ['buff'],
    range: 'melee',
    cooldown: 0,
    damage: 0,
    rangeValue: 0,
    effects: [],
    level: 1,
    maxLevel: 5,
    enhancements: [],
    evolutions: [],
    baseValues: { damage: 0, range: 0, cooldown: 0, projectileCount: 0 },
    passiveEffect: { type: 'shield_boost', value: 0.25 },
  },

  // 元素类
  flame_soul: {
    id: 'flame_soul',
    name: '烈焰之魂',
    description: '火属性技能伤害提升，燃烧效果增强',
    type: 'passive',
    element: 'fire',
    category: 'buff',
    elements: ['fire'],
    categories: ['buff'],
    range: 'melee',
    cooldown: 0,
    damage: 0,
    rangeValue: 0,
    effects: [],
    level: 1,
    maxLevel: 5,
    enhancements: [],
    evolutions: [],
    baseValues: { damage: 0, range: 0, cooldown: 0, projectileCount: 0 },
    passiveEffect: { type: 'element_boost', element: 'fire', value: 0.2 },
  },

  frost_heart: {
    id: 'frost_heart',
    name: '寒冰之心',
    description: '冰属性技能伤害提升，冻结时间延长',
    type: 'passive',
    element: 'ice',
    category: 'buff',
    elements: ['ice'],
    categories: ['buff'],
    range: 'melee',
    cooldown: 0,
    damage: 0,
    rangeValue: 0,
    effects: [],
    level: 1,
    maxLevel: 5,
    enhancements: [],
    evolutions: [],
    baseValues: { damage: 0, range: 0, cooldown: 0, projectileCount: 0 },
    passiveEffect: { type: 'element_boost', element: 'ice', value: 0.2 },
  },

  thunder_wrath: {
    id: 'thunder_wrath',
    name: '雷霆之怒',
    description: '雷属性技能伤害提升，连锁次数增加',
    type: 'passive',
    element: 'lightning',
    category: 'buff',
    elements: ['lightning'],
    categories: ['buff'],
    range: 'melee',
    cooldown: 0,
    damage: 0,
    rangeValue: 0,
    effects: [],
    level: 1,
    maxLevel: 5,
    enhancements: [],
    evolutions: [],
    baseValues: { damage: 0, range: 0, cooldown: 0, projectileCount: 0 },
    passiveEffect: { type: 'element_boost', element: 'lightning', value: 0.2 },
  },

  // 特殊类
  lucky_star: {
    id: 'lucky_star',
    name: '幸运女神',
    description: '提升经验获取和掉落率',
    type: 'passive',
    element: 'holy',
    category: 'buff',
    elements: ['holy'],
    categories: ['buff'],
    range: 'melee',
    cooldown: 0,
    damage: 0,
    rangeValue: 0,
    effects: [],
    level: 1,
    maxLevel: 5,
    enhancements: [],
    evolutions: [],
    baseValues: { damage: 0, range: 0, cooldown: 0, projectileCount: 0 },
    passiveEffect: { type: 'luck', value: 0.2 },
  },

  regeneration: {
    id: 'regeneration',
    name: '再生之力',
    description: '每秒恢复生命值',
    type: 'passive',
    element: 'grass',
    category: 'buff',
    elements: ['grass'],
    categories: ['buff'],
    range: 'melee',
    cooldown: 0,
    damage: 0,
    rangeValue: 0,
    effects: [],
    level: 1,
    maxLevel: 5,
    enhancements: [],
    evolutions: [],
    baseValues: { damage: 0, range: 0, cooldown: 0, projectileCount: 0 },
    passiveEffect: { type: 'regen', value: 3 },
  },

  vengeance_soul: {
    id: 'vengeance_soul',
    name: '复仇之魂',
    description: '受伤时反弹伤害',
    type: 'passive',
    element: 'shadow',
    category: 'buff',
    elements: ['shadow'],
    categories: ['buff'],
    range: 'melee',
    cooldown: 0,
    damage: 0,
    rangeValue: 0,
    effects: [],
    level: 1,
    maxLevel: 5,
    enhancements: [],
    evolutions: [],
    baseValues: { damage: 0, range: 0, cooldown: 0, projectileCount: 0 },
    passiveEffect: { type: 'thorns', value: 0.15 },
  },
};

// 获取所有基础技能
export function getBasicSkills(): Skill[] {
  return Object.values(SKILLS).filter(s => s.type === 'basic');
}

// 获取所有大招
export function getUltimateSkills(): Skill[] {
  return Object.values(SKILLS).filter(s => s.type === 'ultimate');
}

// 获取所有被动技能
export function getPassiveSkills(): Skill[] {
  return Object.values(SKILLS).filter(s => s.type === 'passive');
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

// 获取随机被动技能
export function getRandomPassiveSkill(excludeIds: string[] = []): Skill | null {
  const passives = getPassiveSkills().filter(s => !excludeIds.includes(s.id));
  if (passives.length === 0) return null;
  return cloneSkill(passives[Math.floor(Math.random() * passives.length)]);
}