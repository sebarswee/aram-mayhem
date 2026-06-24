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
 * 所有技能升级树映射
 */
export const SKILL_UPGRADE_TREES: Record<string, SkillUpgradeTree> = {
  fireball: FIREBALL_UPGRADE_TREE,
  ice_shard: ICE_SHARD_UPGRADE_TREE,
  lightning_bolt: LIGHTNING_BOLT_UPGRADE_TREE,
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
