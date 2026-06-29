// src/data/skillTrees.ts
// 技能升级树数据 - 定义每个技能的升级路径和进化分支

import { SkillUpgradeTree } from '@/types';

/**
 * 火球术升级树
 */
export const FIREBALL_UPGRADE_TREE: SkillUpgradeTree = {
  skillId: 'fireball',

  upgradeOptions: {
    // Lv2 二选一
    2: [
      {
        id: 'fireball_lv2_damage',
        name: '烈焰强化',
        description: '伤害+30%',
        level: 2,
        modifiers: { damage: 0.3 },
      },
      {
        id: 'fireball_lv2_range',
        name: '火焰扩张',
        description: '范围+30%',
        level: 2,
        modifiers: { range: 0.3 },
      },
    ],

    // Lv3 二选一
    3: [
      {
        id: 'fireball_lv3_speed',
        name: '疾速火球',
        description: '飞行速度+50%',
        level: 3,
        modifiers: { speed: 0.5 },
      },
      {
        id: 'fireball_lv3_cooldown',
        name: '快速施法',
        description: '冷却时间-25%',
        level: 3,
        modifiers: { cooldown: -0.25 },
      },
    ],

    // Lv4 二选一
    4: [
      {
        id: 'fireball_lv4_pierce',
        name: '穿透火球',
        description: '火球可穿透2个敌人',
        level: 4,
        specialBehavior: 'pierce:2',
      },
      {
        id: 'fireball_lv4_split',
        name: '分裂火球',
        description: '命中时分裂成2个小火球',
        level: 4,
        specialBehavior: 'split:2',
      },
    ],
  },

  // Lv5 三选一进化
  evolutionBranches: [
    {
      id: 'fireball_evo_meteor',
      name: '陨石火球',
      description: '伤害+200%，范围+100%，冷却+50%，落地爆炸',
      rarity: 'legendary',
      modifiers: {
        damage: 2.0,
        range: 1.0,
        cooldown: 0.5,
      },
      specialBehavior: 'meteor_fall',
      visualChange: {
        scale: 2.0,
        particleEffect: 'fire_trail_large',
      },
    },
    {
      id: 'fireball_evo_triple',
      name: '连发火球',
      description: '连续发射3颗火球，总伤害+50%',
      rarity: 'epic',
      modifiers: {
        projectileCount: 2,  // +2 = 3颗
        damage: 0.5,
      },
      specialBehavior: 'rapid_fire:3',
      visualChange: {
        color: 0xff6600,
      },
    },
    {
      id: 'fireball_evo_homing',
      name: '追踪火球',
      description: '自动追踪最近敌人，伤害-20%，必中',
      rarity: 'epic',
      modifiers: {
        damage: -0.2,
      },
      specialBehavior: 'homing',
      visualChange: {
        particleEffect: 'homing_trail',
      },
    },
  ],
};

/**
 * 冰刺升级树
 */
export const ICE_SHARD_UPGRADE_TREE: SkillUpgradeTree = {
  skillId: 'ice_shard',

  upgradeOptions: {
    // Lv2 二选一
    2: [
      {
        id: 'ice_shard_lv2_freeze',
        name: '深度冻结',
        description: '冻结时间+50%',
        level: 2,
        effectBoost: {
          type: 'freeze',
          durationMultiplier: 1.5,
        },
      },
      {
        id: 'ice_shard_lv2_damage',
        name: '锐利冰刺',
        description: '伤害+40%',
        level: 2,
        modifiers: { damage: 0.4 },
      },
    ],

    // Lv3 二选一
    3: [
      {
        id: 'ice_shard_lv3_pierce',
        name: '寒冰穿透',
        description: '可穿透3个敌人',
        level: 3,
        specialBehavior: 'pierce:3',
      },
      {
        id: 'ice_shard_lv3_count',
        name: '多重冰刺',
        description: '同时发射2枚冰刺',
        level: 3,
        modifiers: { projectileCount: 1 },
      },
    ],

    // Lv4 二选一
    4: [
      {
        id: 'ice_shard_lv4_slow',
        name: '冰霜残留',
        description: '命中后留下减速区域',
        level: 4,
        specialBehavior: 'leave_slow_field',
        effectAdd: {
          type: 'slow',
          value: 0.5,
          duration: 3000,
        },
      },
      {
        id: 'ice_shard_lv4_shatter',
        name: '破碎冰刺',
        description: '冻结敌人受到额外50%伤害',
        level: 4,
        specialBehavior: 'shatter:1.5',
      },
    ],
  },

  evolutionBranches: [
    {
      id: 'ice_shard_evo_blizzard',
      name: '暴风冰刺',
      description: '释放冰风暴，持续冻结区域',
      rarity: 'legendary',
      modifiers: {
        range: 2.0,
        cooldown: 1.0,
      },
      effects: [
        { type: 'freeze' as const, value: 0.5, duration: 4000 },
      ],
      specialBehavior: 'area_blizzard',
      visualChange: {
        scale: 3.0,
        particleEffect: 'blizzard',
      },
    },
    {
      id: 'ice_shard_evo_chain',
      name: '连锁冰刺',
      description: '冰刺命中后弹射到4个敌人',
      rarity: 'epic',
      specialBehavior: 'chain:4',
      visualChange: {
        particleEffect: 'ice_chain',
      },
    },
    {
      id: 'ice_shard_evo_explosion',
      name: '爆裂冰刺',
      description: '命中时爆炸，伤害+100%，范围伤害',
      rarity: 'epic',
      modifiers: {
        damage: 1.0,
      },
      specialBehavior: 'explode_on_hit',
      visualChange: {
        scale: 1.5,
      },
    },
  ],
};

/**
 * 闪电箭升级树
 */
export const LIGHTNING_BOLT_UPGRADE_TREE: SkillUpgradeTree = {
  skillId: 'lightning_bolt',

  upgradeOptions: {
    // Lv2 二选一
    2: [
      {
        id: 'lightning_bolt_lv2_chain',
        name: '扩展连锁',
        description: '连锁次数+2',
        level: 2,
        specialBehavior: 'chain_add:2',
      },
      {
        id: 'lightning_bolt_lv2_damage',
        name: '雷霆强化',
        description: '伤害+35%',
        level: 2,
        modifiers: { damage: 0.35 },
      },
    ],

    // Lv3 二选一
    3: [
      {
        id: 'lightning_bolt_lv3_stun',
        name: '麻痹效果',
        description: '有30%概率眩晕敌人0.5秒',
        level: 3,
        effectAdd: {
          type: 'stun' as const,
          value: 0.3,
          duration: 500,
        },
      },
      {
        id: 'lightning_bolt_lv3_decay',
        name: '稳定传导',
        description: '连锁衰减降低（0.8→0.9）',
        level: 3,
        specialBehavior: 'chain_decay:0.9',
      },
    ],

    // Lv4 二选一
    4: [
      {
        id: 'lightning_bolt_lv4_range',
        name: '雷击范围',
        description: '连锁范围+50%',
        level: 4,
        specialBehavior: 'chain_range:1.5',
      },
      {
        id: 'lightning_bolt_lv4_multicast',
        name: '双重雷击',
        description: '连续释放2次',
        level: 4,
        specialBehavior: 'multicast:2',
      },
    ],
  },

  evolutionBranches: [
    {
      id: 'lightning_bolt_evo_storm',
      name: '雷暴召唤',
      description: '召唤雷暴区域，持续随机雷击',
      rarity: 'legendary',
      modifiers: {
        cooldown: 2.0,
        range: 3.0,
      },
      specialBehavior: 'summon_lightning_storm',
      visualChange: {
        particleEffect: 'storm_cloud',
      },
    },
    {
      id: 'lightning_bolt_evo_arc',
      name: '电弧网络',
      description: '所有被击中敌人之间形成电弧',
      rarity: 'epic',
      specialBehavior: 'arc_between_targets',
      visualChange: {
        particleEffect: 'electric_arc',
      },
    },
    {
      id: 'lightning_bolt_evo_instant',
      name: '瞬雷',
      description: '瞬发，无飞行时间，伤害-15%',
      rarity: 'epic',
      modifiers: {
        damage: -0.15,
        speed: 9999,
      },
      specialBehavior: 'instant_hit',
      visualChange: {
        particleEffect: 'flash',
      },
    },
  ],
};

/**
 * 水弹升级树
 */
export const WATER_BULLET_UPGRADE_TREE: SkillUpgradeTree = {
  skillId: 'water_bullet',

  upgradeOptions: {
    // Lv2 二选一
    2: [
      {
        id: 'water_bullet_lv2_damage',
        name: '水弹强化',
        description: '伤害+30%',
        level: 2,
        modifiers: { damage: 0.3 },
      },
      {
        id: 'water_bullet_lv2_slow',
        name: '强力减速',
        description: '减速效果提升至40%',
        level: 2,
        effectBoost: {
          type: 'slow',
          valueMultiplier: 1.33,
        },
      },
    ],

    // Lv3 二选一
    3: [
      {
        id: 'water_bullet_lv3_pierce',
        name: '穿透水弹',
        description: '水弹可穿透1个敌人',
        level: 3,
        specialBehavior: 'pierce:1',
      },
      {
        id: 'water_bullet_lv3_count',
        name: '双重水弹',
        description: '同时发射2颗水弹',
        level: 3,
        modifiers: { projectileCount: 1 },
      },
    ],

    // Lv4 二选一
    4: [
      {
        id: 'water_bullet_lv4_split',
        name: '分裂水弹',
        description: '命中后分裂成2个小水弹',
        level: 4,
        specialBehavior: 'split:2',
      },
      {
        id: 'water_bullet_lv4_ripple',
        name: '水波扩散',
        description: '命中后产生水波，伤害周围敌人',
        level: 4,
        specialBehavior: 'ripple_wave',
      },
    ],
  },

  evolutionBranches: [
    {
      id: 'water_bullet_evo_tidal',
      name: '潮汐水弹',
      description: '连续发射3颗水弹，每颗附带减速效果',
      rarity: 'epic',
      modifiers: {
        projectileCount: 2,
        damage: 0.3,
      },
      specialBehavior: 'rapid_fire:3',
      visualChange: {
        color: 0x00aaff,
        particleEffect: 'water_trail',
      },
    },
    {
      id: 'water_bullet_evo_frozen',
      name: '冰冻水弹',
      description: '水弹有30%概率冻结敌人1秒',
      rarity: 'epic',
      effects: [
        { type: 'freeze' as const, value: 0.3, duration: 1000 },
      ],
      modifiers: {
        damage: 0.2,
      },
      visualChange: {
        color: 0x88ccff,
        particleEffect: 'ice_trail',
      },
    },
    {
      id: 'water_bullet_evo_vortex',
      name: '漩涡水弹',
      description: '命中后产生漩涡，吸引周围敌人',
      rarity: 'legendary',
      modifiers: {
        damage: 0.5,
        cooldown: 0.3,
      },
      specialBehavior: 'vortex_on_hit',
      visualChange: {
        scale: 1.5,
        particleEffect: 'vortex',
      },
    },
  ],
};

/**
 * 暗影箭升级树
 */
export const SHADOW_BOLT_UPGRADE_TREE: SkillUpgradeTree = {
  skillId: 'shadow_bolt',

  upgradeOptions: {
    // Lv2 二选一
    2: [
      {
        id: 'shadow_bolt_lv2_damage',
        name: '暗影强化',
        description: '伤害+35%',
        level: 2,
        modifiers: { damage: 0.35 },
      },
      {
        id: 'shadow_bolt_lv2_poison',
        name: '剧毒增强',
        description: '中毒伤害+50%，持续时间+2秒',
        level: 2,
        effectBoost: {
          type: 'poison',
          valueMultiplier: 1.5,
          durationMultiplier: 1.5,
        },
      },
    ],

    // Lv3 二选一
    3: [
      {
        id: 'shadow_bolt_lv3_pierce',
        name: '穿透暗影',
        description: '暗影箭可穿透2个敌人',
        level: 3,
        specialBehavior: 'pierce:2',
      },
      {
        id: 'shadow_bolt_lv3_chain',
        name: '暗影连锁',
        description: '命中后弹射到2个敌人',
        level: 3,
        specialBehavior: 'chain:2',
      },
    ],

    // Lv4 二选一
    4: [
      {
        id: 'shadow_bolt_lv4_mark',
        name: '暗影标记',
        description: '命中后标记敌人，受到的伤害+20%',
        level: 4,
        specialBehavior: 'shadow_mark:1.2',
      },
      {
        id: 'shadow_bolt_lv4_multicast',
        name: '暗影连发',
        description: '连续发射2支暗影箭',
        level: 4,
        specialBehavior: 'multicast:2',
      },
    ],
  },

  evolutionBranches: [
    {
      id: 'shadow_bolt_evo_plague',
      name: '瘟疫暗影',
      description: '中毒效果可传播给附近敌人',
      rarity: 'epic',
      modifiers: {
        damage: 0.3,
      },
      specialBehavior: 'poison_spread',
      visualChange: {
        color: 0x8800ff,
        particleEffect: 'plague_trail',
      },
    },
    {
      id: 'shadow_bolt_evo_void',
      name: '虚空暗影',
      description: '命中后产生虚空裂隙，持续伤害',
      rarity: 'epic',
      modifiers: {
        damage: 0.5,
        cooldown: 0.3,
      },
      specialBehavior: 'void_rift_on_hit',
      visualChange: {
        scale: 1.3,
        particleEffect: 'void_trail',
      },
    },
    {
      id: 'shadow_bolt_evo_death',
      name: '死神之箭',
      description: '对低血量敌人伤害+100%，有概率瞬杀',
      rarity: 'legendary',
      modifiers: {
        damage: 0.8,
      },
      specialBehavior: 'execute:0.3',
      visualChange: {
        color: 0x330033,
        particleEffect: 'death_trail',
      },
    },
  ],
};

/**
 * 藤蔓鞭升级树
 */
export const VINE_WHIP_UPGRADE_TREE: SkillUpgradeTree = {
  skillId: 'vine_whip',

  upgradeOptions: {
    // Lv2 二选一
    2: [
      {
        id: 'vine_whip_lv2_damage',
        name: '藤蔓强化',
        description: '伤害+40%',
        level: 2,
        modifiers: { damage: 0.4 },
      },
      {
        id: 'vine_whip_lv2_stun',
        name: '缠绕延长',
        description: '眩晕时间+50%',
        level: 2,
        effectBoost: {
          type: 'stun',
          durationMultiplier: 1.5,
        },
      },
    ],

    // Lv3 二选一
    3: [
      {
        id: 'vine_whip_lv3_range',
        name: '藤蔓延伸',
        description: '范围+40%',
        level: 3,
        modifiers: { range: 0.4 },
      },
      {
        id: 'vine_whip_lv3_pierce',
        name: '穿透藤蔓',
        description: '藤蔓可穿透2个敌人',
        level: 3,
        specialBehavior: 'pierce:2',
      },
    ],

    // Lv4 二选一
    4: [
      {
        id: 'vine_whip_lv4_whip',
        name: '连续鞭打',
        description: '连续挥鞭2次',
        level: 4,
        specialBehavior: 'multicast:2',
      },
      {
        id: 'vine_whip_lv4_root',
        name: '扎根效果',
        description: '命中后在原地生成藤蔓陷阱',
        level: 4,
        specialBehavior: 'leave_trap',
      },
    ],
  },

  evolutionBranches: [
    {
      id: 'vine_whip_evo_entangle',
      name: '缠绕藤蔓',
      description: '眩晕时间翻倍，并附加持续伤害',
      rarity: 'epic',
      modifiers: {
        damage: 0.3,
      },
      effects: [
        { type: 'poison' as const, value: 10, duration: 3000 },
        { type: 'stun' as const, value: 1, duration: 1600 },
      ],
      specialBehavior: 'stun_duration_double',
      visualChange: {
        scale: 1.5,
        particleEffect: 'vine_entangle',
      },
    },
    {
      id: 'vine_whip_evo_wild',
      name: '狂野藤蔓',
      description: '发射3条藤蔓，向不同方向攻击',
      rarity: 'epic',
      modifiers: {
        projectileCount: 2,
        damage: 0.2,
      },
      specialBehavior: 'spread_fire:3',
      visualChange: {
        color: 0x228b22,
        particleEffect: 'wild_vine',
      },
    },
    {
      id: 'vine_whip_evo_forest',
      name: '森林之怒',
      description: '命中后召唤藤蔓森林，持续缠绕敌人',
      rarity: 'legendary',
      modifiers: {
        damage: 0.6,
        cooldown: 0.5,
      },
      specialBehavior: 'summon_vine_forest',
      visualChange: {
        scale: 2.0,
        particleEffect: 'forest_summon',
      },
    },
  ],
};

/**
 * 陨石坠落升级树
 */
export const METEOR_UPGRADE_TREE: SkillUpgradeTree = {
  skillId: 'meteor',

  upgradeOptions: {
    // Lv2 二选一
    2: [
      {
        id: 'meteor_lv2_damage',
        name: '陨石强化',
        description: '伤害+40%',
        level: 2,
        modifiers: { damage: 0.4 },
      },
      {
        id: 'meteor_lv2_range',
        name: '爆炸范围',
        description: '范围+40%',
        level: 2,
        modifiers: { range: 0.4 },
      },
    ],

    // Lv3 二选一
    3: [
      {
        id: 'meteor_lv3_burn',
        name: '持续灼烧',
        description: '燃烧伤害+50%，持续时间+3秒',
        level: 3,
        effectBoost: {
          type: 'burn',
          valueMultiplier: 1.5,
          durationMultiplier: 1.6,
        },
      },
      {
        id: 'meteor_lv3_count',
        name: '双重陨石',
        description: '召唤2颗陨石',
        level: 3,
        specialBehavior: 'multicast:2',
      },
    ],

    // Lv4 二选一
    4: [
      {
        id: 'meteor_lv4_stun',
        name: '陨石冲击',
        description: '附加1秒眩晕效果',
        level: 4,
        effectAdd: {
          type: 'stun' as const,
          value: 1,
          duration: 1000,
        },
      },
      {
        id: 'meteor_lv4_cooldown',
        name: '快速召唤',
        description: '冷却时间-30%',
        level: 4,
        modifiers: { cooldown: -0.3 },
      },
    ],
  },

  evolutionBranches: [
    {
      id: 'meteor_evo_rain',
      name: '流星雨',
      description: '召唤6颗小陨石，覆盖大范围',
      rarity: 'legendary',
      modifiers: {
        damage: -0.3,
        cooldown: 0.3,
      },
      specialBehavior: 'meteor_rain:6',
      visualChange: {
        particleEffect: 'meteor_rain',
      },
    },
    {
      id: 'meteor_evo_destruction',
      name: '毁灭陨石',
      description: '伤害+150%，范围+100%，冷却+50%',
      rarity: 'epic',
      modifiers: {
        damage: 1.5,
        range: 1.0,
        cooldown: 0.5,
      },
      visualChange: {
        scale: 2.0,
        particleEffect: 'destruction_meteor',
      },
    },
    {
      id: 'meteor_evo_magma',
      name: '岩浆陨石',
      description: '命中后留下岩浆区域，持续伤害',
      rarity: 'epic',
      modifiers: {
        damage: 0.5,
      },
      specialBehavior: 'magma_pool',
      effects: [
        { type: 'burn' as const, value: 20, duration: 5000 },
      ],
      visualChange: {
        color: 0xff4400,
        particleEffect: 'magma_trail',
      },
    },
  ],
};

/**
 * 雷神之怒升级树
 */
export const THUNDER_STRIKE_UPGRADE_TREE: SkillUpgradeTree = {
  skillId: 'thunder_strike',

  upgradeOptions: {
    // Lv2 二选一
    2: [
      {
        id: 'thunder_strike_lv2_damage',
        name: '雷霆强化',
        description: '伤害+35%',
        level: 2,
        modifiers: { damage: 0.35 },
      },
      {
        id: 'thunder_strike_lv2_count',
        name: '雷击强化',
        description: '雷击次数+5次',
        level: 2,
        specialBehavior: 'strike_count_add:5',
      },
    ],

    // Lv3 二选一
    3: [
      {
        id: 'thunder_strike_lv3_stun',
        name: '麻痹效果',
        description: '附加0.5秒眩晕',
        level: 3,
        effectAdd: {
          type: 'stun' as const,
          value: 1,
          duration: 500,
        },
      },
      {
        id: 'thunder_strike_lv3_chain',
        name: '连锁雷击',
        description: '每次雷击可连锁1次',
        level: 3,
        specialBehavior: 'chain_per_strike:1',
      },
    ],

    // Lv4 二选一
    4: [
      {
        id: 'thunder_strike_lv4_cooldown',
        name: '快速冷却',
        description: '冷却时间-30%',
        level: 4,
        modifiers: { cooldown: -0.3 },
      },
      {
        id: 'thunder_strike_lv4_focus',
        name: '聚焦雷击',
        description: '优先攻击最近的敌人',
        level: 4,
        specialBehavior: 'focus_nearest',
      },
    ],
  },

  evolutionBranches: [
    {
      id: 'thunder_strike_evo_judgment',
      name: '天罚之雷',
      description: '雷击次数翻倍，每次伤害-20%',
      rarity: 'epic',
      modifiers: {
        damage: -0.2,
      },
      specialBehavior: 'strike_count_double',
      visualChange: {
        particleEffect: 'judgment_lightning',
      },
    },
    {
      id: 'thunder_strike_evo_storm',
      name: '雷霆风暴',
      description: '召唤持续3秒的雷暴区域',
      rarity: 'legendary',
      modifiers: {
        damage: 0.3,
        cooldown: 0.5,
      },
      specialBehavior: 'lightning_storm_zone',
      visualChange: {
        particleEffect: 'storm_cloud',
      },
    },
    {
      id: 'thunder_strike_evo_instant',
      name: '瞬雷降临',
      description: '所有雷击同时落下，伤害+50%',
      rarity: 'epic',
      modifiers: {
        damage: 0.5,
      },
      specialBehavior: 'instant_all_strikes',
      visualChange: {
        particleEffect: 'flash',
      },
    },
  ],
};

/**
 * 神圣护盾升级树
 */
export const DIVINE_SHIELD_UPGRADE_TREE: SkillUpgradeTree = {
  skillId: 'divine_shield',

  upgradeOptions: {
    // Lv2 二选一
    2: [
      {
        id: 'divine_shield_lv2_shield',
        name: '护盾强化',
        description: '护盾值+40%',
        level: 2,
        effectBoost: {
          type: 'shield',
          valueMultiplier: 1.4,
        },
      },
      {
        id: 'divine_shield_lv2_duration',
        name: '持续时间',
        description: '护盾持续时间+25%',
        level: 2,
        effectBoost: {
          type: 'damage_reflect',
          durationMultiplier: 1.25,
        },
      },
    ],

    // Lv3 二选一
    3: [
      {
        id: 'divine_shield_lv3_reflect',
        name: '反弹强化',
        description: '反弹伤害提升至50%',
        level: 3,
        effectBoost: {
          type: 'damage_reflect',
          valueMultiplier: 1.67,
        },
      },
      {
        id: 'divine_shield_lv3_heal',
        name: '护盾治疗',
        description: '护盾存在时每秒治疗5生命',
        level: 3,
        specialBehavior: 'shield_heal:5',
      },
    ],

    // Lv4 二选一
    4: [
      {
        id: 'divine_shield_lv4_cooldown',
        name: '快速冷却',
        description: '冷却时间-30%',
        level: 4,
        modifiers: { cooldown: -0.3 },
      },
      {
        id: 'divine_shield_lv4_expand',
        name: '护盾扩展',
        description: '护盾消失时治愈周围队友',
        level: 4,
        specialBehavior: 'shield_burst_heal',
      },
    ],
  },

  evolutionBranches: [
    {
      id: 'divine_shield_evo_angelic',
      name: '天使护盾',
      description: '免疫所有伤害3秒，冷却+50%',
      rarity: 'legendary',
      modifiers: {
        cooldown: 0.5,
      },
      specialBehavior: 'invincibility:3000',
      visualChange: {
        particleEffect: 'angelic_wings',
      },
    },
    {
      id: 'divine_shield_evo_divine',
      name: '神圣庇护',
      description: '护盾破碎时治疗全队30生命',
      rarity: 'epic',
      specialBehavior: 'shield_break_aoe_heal:30',
      visualChange: {
        particleEffect: 'divine_light',
      },
    },
    {
      id: 'divine_shield_evo_reflect',
      name: '圣光反噬',
      description: '反弹伤害提升至100%，护盾值-30%',
      rarity: 'epic',
      effects: [
        { type: 'damage_reflect' as const, value: 1.0, duration: 8000 },
      ],
      visualChange: {
        particleEffect: 'holy_reflect',
      },
    },
  ],
};

/**
 * 净化升级树
 */
export const PURIFY_UPGRADE_TREE: SkillUpgradeTree = {
  skillId: 'purify',

  upgradeOptions: {
    // Lv2 二选一
    2: [
      {
        id: 'purify_lv2_heal',
        name: '治愈强化',
        description: '治疗量+50%',
        level: 2,
        effectBoost: {
          type: 'heal',
          valueMultiplier: 1.5,
        },
      },
      {
        id: 'purify_lv2_cooldown',
        name: '快速净化',
        description: '冷却时间-25%',
        level: 2,
        modifiers: { cooldown: -0.25 },
      },
    ],

    // Lv3 二选一
    3: [
      {
        id: 'purify_lv3_aoe',
        name: '范围净化',
        description: '净化周围100范围内的队友',
        level: 3,
        specialBehavior: 'aoe_purify:100',
      },
      {
        id: 'purify_lv3_shield',
        name: '净化护盾',
        description: '净化后获得短暂护盾',
        level: 3,
        effectAdd: {
          type: 'shield' as const,
          value: 20,
          duration: 3000,
        },
      },
    ],

    // Lv4 二选一
    4: [
      {
        id: 'purify_lv4_speed',
        name: '神圣加速',
        description: '净化后移速+30%持续3秒',
        level: 4,
        specialBehavior: 'purify_speed_boost',
      },
      {
        id: 'purify_lv4_regenerate',
        name: '持续恢复',
        description: '净化后每秒恢复5生命，持续5秒',
        level: 4,
        effectAdd: {
          type: 'heal' as const,
          value: 5,
          duration: 5000,
        },
      },
    ],
  },

  evolutionBranches: [
    {
      id: 'purify_evo_holy',
      name: '神圣净化',
      description: '净化时对周围敌人造成光属性伤害',
      rarity: 'epic',
      specialBehavior: 'purify_damage_aoe',
      modifiers: {
        damage: 30,
      },
      visualChange: {
        particleEffect: 'holy_burst',
      },
    },
    {
      id: 'purify_evo_fountain',
      name: '生命之泉',
      description: '在原地创建治疗泉，持续治疗周围队友',
      rarity: 'legendary',
      specialBehavior: 'create_healing_fountain',
      modifiers: {
        cooldown: 0.5,
      },
      visualChange: {
        particleEffect: 'healing_spring',
      },
    },
    {
      id: 'purify_evo_cleanse',
      name: '绝对纯净',
      description: '净化后免疫负面状态5秒',
      rarity: 'epic',
      specialBehavior: 'immunity:5000',
      visualChange: {
        particleEffect: 'purity_aura',
      },
    },
  ],
};

/**
 * 圣光升级树
 */
export const HOLY_LIGHT_UPGRADE_TREE: SkillUpgradeTree = {
  skillId: 'holy_light',

  upgradeOptions: {
    // Lv2 二选一
    2: [
      {
        id: 'holy_light_lv2_damage',
        name: '圣光强化',
        description: '伤害+35%',
        level: 2,
        modifiers: { damage: 0.35 },
      },
      {
        id: 'holy_light_lv2_heal',
        name: '治愈强化',
        description: '治疗量+50%',
        level: 2,
        effectBoost: {
          type: 'heal',
          valueMultiplier: 1.5,
        },
      },
    ],

    // Lv3 二选一
    3: [
      {
        id: 'holy_light_lv3_range',
        name: '光芒扩展',
        description: '范围+50%',
        level: 3,
        modifiers: { range: 0.5 },
      },
      {
        id: 'holy_light_lv3_cooldown',
        name: '快速施法',
        description: '冷却时间-25%',
        level: 3,
        modifiers: { cooldown: -0.25 },
      },
    ],

    // Lv4 二选一
    4: [
      {
        id: 'holy_light_lv4_stun',
        name: '圣光眩晕',
        description: '有30%概率眩晕敌人0.5秒',
        level: 4,
        effectAdd: {
          type: 'stun' as const,
          value: 0.3,
          duration: 500,
        },
      },
      {
        id: 'holy_light_lv4_multicast',
        name: '双重圣光',
        description: '连续释放2次',
        level: 4,
        specialBehavior: 'multicast:2',
      },
    ],
  },

  evolutionBranches: [
    {
      id: 'holy_light_evo_judgment',
      name: '审判圣光',
      description: '伤害+150%，不再治疗自己',
      rarity: 'epic',
      modifiers: {
        damage: 1.5,
      },
      specialBehavior: 'remove_heal',
      visualChange: {
        particleEffect: 'judgment_light',
        color: 0xffdd00,
      },
    },
    {
      id: 'holy_light_evo_healing',
      name: '治愈圣光',
      description: '治疗量翻倍，伤害-50%，同时治疗周围队友',
      rarity: 'epic',
      modifiers: {
        damage: -0.5,
      },
      effects: [
        { type: 'heal' as const, value: 20 },
      ],
      specialBehavior: 'aoe_heal',
      visualChange: {
        particleEffect: 'healing_aura',
        color: 0x88ffaa,
      },
    },
    {
      id: 'holy_light_evo_purify',
      name: '净化圣光',
      description: '清除范围内队友的负面状态，对敌人造成伤害',
      rarity: 'legendary',
      specialBehavior: 'holy_purify_aoe',
      modifiers: {
        cooldown: 0.3,
      },
      visualChange: {
        particleEffect: 'purify_burst',
      },
    },
  ],
};

/**
 * 毒雾升级树
 */
export const POISON_CLOUD_UPGRADE_TREE: SkillUpgradeTree = {
  skillId: 'poison_cloud',

  upgradeOptions: {
    // Lv2 二选一
    2: [
      {
        id: 'poison_cloud_lv2_damage',
        name: '毒雾强化',
        description: '中毒伤害+50%',
        level: 2,
        effectBoost: {
          type: 'poison',
          valueMultiplier: 1.5,
        },
      },
      {
        id: 'poison_cloud_lv2_range',
        name: '范围扩散',
        description: '范围+40%',
        level: 2,
        modifiers: { range: 0.4 },
      },
    ],

    // Lv3 二选一
    3: [
      {
        id: 'poison_cloud_lv3_duration',
        name: '持续时间',
        description: '毒雾持续时间+60%',
        level: 3,
        effectBoost: {
          type: 'poison',
          durationMultiplier: 1.6,
        },
      },
      {
        id: 'poison_cloud_lv3_slow',
        name: '剧毒减速',
        description: '毒雾内敌人减速30%',
        level: 3,
        effectAdd: {
          type: 'slow' as const,
          value: 0.3,
          duration: 2000,
        },
      },
    ],

    // Lv4 二选一
    4: [
      {
        id: 'poison_cloud_lv4_spread',
        name: '毒雾扩散',
        description: '中毒敌人死亡时扩散毒雾到周围',
        level: 4,
        specialBehavior: 'poison_spread_on_death',
      },
      {
        id: 'poison_cloud_lv4_cooldown',
        name: '快速释放',
        description: '冷却时间-30%',
        level: 4,
        modifiers: { cooldown: -0.3 },
      },
    ],
  },

  evolutionBranches: [
    {
      id: 'poison_cloud_evo_toxic',
      name: '剧毒沼泽',
      description: '毒雾范围翻倍，中毒伤害+100%',
      rarity: 'legendary',
      modifiers: {
        range: 1.0,
      },
      effects: [
        { type: 'poison' as const, value: 16, duration: 5000 },
      ],
      visualChange: {
        scale: 2.0,
        particleEffect: 'toxic_swamp',
      },
    },
    {
      id: 'poison_cloud_evo_corrosive',
      name: '腐蚀毒云',
      description: '降低敌人防御35%',
      rarity: 'epic',
      effects: [
        { type: 'defense_break' as const, value: 0.35, duration: 4000 },
      ],
      visualChange: {
        color: 0x9933ff,
        particleEffect: 'corrosive_cloud',
      },
    },
    {
      id: 'poison_cloud_evo_plague',
      name: '瘟疫之云',
      description: '中毒效果可传播给附近敌人',
      rarity: 'epic',
      specialBehavior: 'plague_spread',
      visualChange: {
        particleEffect: 'plague_cloud',
      },
    },
  ],
};

/**
 * 地刺陷阱升级树
 */
export const ROCK_SPIKE_UPGRADE_TREE: SkillUpgradeTree = {
  skillId: 'rock_spike',

  upgradeOptions: {
    // Lv2 二选一
    2: [
      {
        id: 'rock_spike_lv2_damage',
        name: '地刺强化',
        description: '伤害+40%',
        level: 2,
        modifiers: { damage: 0.4 },
      },
      {
        id: 'rock_spike_lv2_range',
        name: '触发范围',
        description: '触发范围+50%',
        level: 2,
        modifiers: { range: 0.5 },
      },
    ],

    // Lv3 二选一
    3: [
      {
        id: 'rock_spike_lv3_stun',
        name: '眩晕延长',
        description: '眩晕时间+100%',
        level: 3,
        effectBoost: {
          type: 'stun',
          durationMultiplier: 2.0,
        },
      },
      {
        id: 'rock_spike_lv3_count',
        name: '多重地刺',
        description: '同时生成2个地刺',
        level: 3,
        specialBehavior: 'multi_trap:2',
      },
    ],

    // Lv4 二选一
    4: [
      {
        id: 'rock_spike_lv4_knockback',
        name: '强力击飞',
        description: '击飞距离+50%',
        level: 4,
        effectBoost: {
          type: 'knockback',
          valueMultiplier: 1.5,
        },
      },
      {
        id: 'rock_spike_lv4_cooldown',
        name: '快速冷却',
        description: '冷却时间-30%',
        level: 4,
        modifiers: { cooldown: -0.3 },
      },
    ],
  },

  evolutionBranches: [
    {
      id: 'rock_spike_evo_array',
      name: '地刺阵',
      description: '在范围内生成5个地刺',
      rarity: 'legendary',
      specialBehavior: 'spike_array:5',
      modifiers: {
        cooldown: 0.3,
      },
      visualChange: {
        scale: 0.8,
        particleEffect: 'earth_spike_array',
      },
    },
    {
      id: 'rock_spike_evo_pierce',
      name: '穿心地刺',
      description: '伤害+150%，无视防御',
      rarity: 'epic',
      modifiers: {
        damage: 1.5,
      },
      specialBehavior: 'ignore_defense',
      visualChange: {
        scale: 1.5,
        particleEffect: 'piercing_spike',
      },
    },
    {
      id: 'rock_spike_evo_chain',
      name: '连锁地刺',
      description: '地刺触发后在附近生成新的地刺',
      rarity: 'epic',
      specialBehavior: 'chain_spike:2',
      visualChange: {
        particleEffect: 'chain_earth',
      },
    },
  ],
};

/**
 * 炎龙吐息升级树
 */
export const DRAGON_BREATH_UPGRADE_TREE: SkillUpgradeTree = {
  skillId: 'dragon_breath',

  upgradeOptions: {
    // Lv2 二选一
    2: [
      {
        id: 'dragon_breath_lv2_damage',
        name: '炎龙之怒',
        description: '伤害+30%',
        level: 2,
        modifiers: { damage: 0.3 },
      },
      {
        id: 'dragon_breath_lv2_spread',
        name: '龙息扩展',
        description: '扇形角度 60° → 90°',
        level: 2,
        specialBehavior: 'angle_spread:1.5',
      },
    ],

    // Lv3 二选一
    3: [
      {
        id: 'dragon_breath_lv3_burn',
        name: '燃烧之心',
        description: '燃烧伤害+50%',
        level: 3,
        effectBoost: {
          type: 'burn',
          valueMultiplier: 1.5,
        },
      },
      {
        id: 'dragon_breath_lv3_range',
        name: '深渊吐息',
        description: '距离+40%',
        level: 3,
        modifiers: { range: 0.4 },
      },
    ],

    // Lv4 二选一
    4: [
      {
        id: 'dragon_breath_lv4_slow',
        name: '龙威',
        description: '被吐息击中的敌人减速 30%',
        level: 4,
        effectAdd: {
          type: 'slow' as const,
          value: 0.3,
          duration: 2000,
        },
      },
      {
        id: 'dragon_breath_lv4_defense',
        name: '龙鳞',
        description: '施法期间获得 30% 减伤',
        level: 4,
        specialBehavior: 'damage_reduction_while_casting:0.3',
      },
    ],
  },

  evolutionBranches: [
    // 🔥 烈焰分支 - 伤害强化
    {
      id: 'dragon_breath_evo_inferno',
      name: '炎龙噬魂',
      description: '燃烧敌人死亡时爆炸，对周围敌人造成伤害',
      rarity: 'legendary',
      modifiers: {
        damage: 0.5,
      },
      specialBehavior: 'burn_death_explosion',
      visualChange: {
        particleEffect: 'dragon_inferno',
        color: 0xff4400,
      },
    },
    // 🌊 巨颚分支 - 范围扩展
    {
      id: 'dragon_breath_evo_dual',
      name: '双重吐息',
      description: '前后双向喷射，伤害-20%',
      rarity: 'epic',
      modifiers: {
        damage: -0.2,
      },
      specialBehavior: 'dual_breath',
      visualChange: {
        particleEffect: 'dual_dragon_breath',
      },
    },
    // 🌟 天龙分支 - 终极形态
    {
      id: 'dragon_breath_evo_omni',
      name: '全屏吐息',
      description: '360° 环绕火焰，伤害降低 40%',
      rarity: 'epic',
      modifiers: {
        damage: -0.4,
      },
      specialBehavior: 'omni_breath',
      visualChange: {
        scale: 1.5,
        particleEffect: 'omni_dragon_breath',
        color: 0xffaa00,
      },
    },
  ],
};

/**
 * 所有技能升级树映射
 */
export const SKILL_UPGRADE_TREES: Record<string, SkillUpgradeTree> = {
  fireball: FIREBALL_UPGRADE_TREE,
  ice_shard: ICE_SHARD_UPGRADE_TREE,
  lightning_bolt: LIGHTNING_BOLT_UPGRADE_TREE,
  water_bullet: WATER_BULLET_UPGRADE_TREE,
  shadow_bolt: SHADOW_BOLT_UPGRADE_TREE,
  vine_whip: VINE_WHIP_UPGRADE_TREE,
  meteor: METEOR_UPGRADE_TREE,
  thunder_strike: THUNDER_STRIKE_UPGRADE_TREE,
  divine_shield: DIVINE_SHIELD_UPGRADE_TREE,
  purify: PURIFY_UPGRADE_TREE,
  holy_light: HOLY_LIGHT_UPGRADE_TREE,
  poison_cloud: POISON_CLOUD_UPGRADE_TREE,
  rock_spike: ROCK_SPIKE_UPGRADE_TREE,
  dragon_breath: DRAGON_BREATH_UPGRADE_TREE,
};

/**
 * 获取技能升级树
 */
export function getSkillUpgradeTree(skillId: string): SkillUpgradeTree | undefined {
  return SKILL_UPGRADE_TREES[skillId];
}

/**
 * 检查技能是否有升级树
 */
export function hasSkillUpgradeTree(skillId: string): boolean {
  return skillId in SKILL_UPGRADE_TREES;
}
