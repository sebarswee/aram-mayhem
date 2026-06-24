// src/data/enemies.ts
import { EnemyConfig, EnemyAbility } from '@/types';
import { Element } from '@/types';

// 普通怪物（8种元素各1种）
export const NORMAL_ENEMIES: EnemyConfig[] = [
  {
    id: 'flame_slime',
    name: '火焰史莱姆',
    type: 'normal',
    element: 'fire',
    hp: 20,
    damage: 5,
    speed: 80,
    expValue: 5,
    color: 0xff4400,
    abilities: [{ type: 'burn_on_contact', trigger: 'passive', params: { damage: 3, duration: 2000 } }],
  },
  {
    id: 'water_elemental',
    name: '水元素',
    type: 'normal',
    element: 'water',
    hp: 18,
    damage: 4,
    speed: 104,
    expValue: 5,
    color: 0x4488ff,
    abilities: [{ type: 'speed_boost', trigger: 'passive', params: { multiplier: 1.3 } }],
  },
  {
    id: 'frost_ghost',
    name: '冰霜幽灵',
    type: 'normal',
    element: 'ice',
    hp: 22,
    damage: 4,
    speed: 75,
    expValue: 5,
    color: 0x88ddff,
    abilities: [{ type: 'slow_on_attack', trigger: 'attack', params: { slow: 0.3, duration: 1500 } }],
  },
  {
    id: 'thunder_spirit',
    name: '雷电精灵',
    type: 'normal',
    element: 'lightning',
    hp: 15,
    damage: 6,
    speed: 90,
    expValue: 5,
    color: 0xffff00,
    abilities: [{ type: 'explode_on_death', trigger: 'death', params: { damage: 10, radius: 50 } }],
  },
  {
    id: 'holy_sprite',
    name: '圣光精灵',
    type: 'normal',
    element: 'holy',
    hp: 25,
    damage: 3,
    speed: 70,
    expValue: 5,
    color: 0xffcc00,
    abilities: [{ type: 'damage_reduction', trigger: 'passive', params: { reduction: 0.3 } }],
  },
  {
    id: 'shadow_demon',
    name: '暗影魔',
    type: 'normal',
    element: 'shadow',
    hp: 18,
    damage: 5,
    speed: 85,
    expValue: 5,
    color: 0x8800ff,
    abilities: [{ type: 'poison_on_attack', trigger: 'attack', params: { damage: 4, duration: 3000 } }],
  },
  {
    id: 'vine_monster',
    name: '藤蔓怪',
    type: 'normal',
    element: 'grass',
    hp: 20,
    damage: 4,
    speed: 75,
    expValue: 5,
    color: 0x44ff44,
    abilities: [{ type: 'root_on_attack', trigger: 'attack', params: { duration: 500 } }],
  },
  {
    id: 'rock_golem',
    name: '岩石巨人',
    type: 'normal',
    element: 'earth',
    hp: 30,
    damage: 6,
    speed: 56,
    expValue: 6,
    color: 0xaa8844,
    abilities: [{ type: 'hp_boost', trigger: 'passive', params: { multiplier: 1.5 } }],
  },
];

// 精英怪物
export const ELITE_ENEMIES: EnemyConfig[] = [
  {
    id: 'elite_flame_lord',
    name: '炎魔精英',
    type: 'elite',
    element: 'fire',
    hp: 100,
    damage: 10,
    speed: 96,
    expValue: 25,
    color: 0xff2200,
    abilities: [
      { type: 'burn_on_contact', trigger: 'passive', params: { damage: 8, duration: 3000 } },
      { type: 'hp_boost', trigger: 'passive', params: { multiplier: 1.5 } },
    ],
  },
  {
    id: 'elite_frost_titan',
    name: '霜巨人精英',
    type: 'elite',
    element: 'ice',
    hp: 120,
    damage: 8,
    speed: 70,
    expValue: 25,
    color: 0x66ccff,
    abilities: [
      { type: 'slow_on_attack', trigger: 'attack', params: { slow: 0.5, duration: 2000 } },
      { type: 'hp_boost', trigger: 'passive', params: { multiplier: 1.5 } },
    ],
  },
  {
    id: 'elite_storm_drake',
    name: '雷龙精英',
    type: 'elite',
    element: 'lightning',
    hp: 80,
    damage: 12,
    speed: 100,
    expValue: 25,
    color: 0xcccc00,
    abilities: [
      { type: 'explode_on_death', trigger: 'death', params: { damage: 30, radius: 80 } },
      { type: 'speed_boost', trigger: 'passive', params: { multiplier: 1.2 } },
    ],
  },
  {
    id: 'elite_shadow_lord',
    name: '暗影领主',
    type: 'elite',
    element: 'shadow',
    hp: 90,
    damage: 10,
    speed: 90,
    expValue: 25,
    color: 0x6600cc,
    abilities: [
      { type: 'poison_on_attack', trigger: 'attack', params: { damage: 10, duration: 5000 } },
      { type: 'hp_boost', trigger: 'passive', params: { multiplier: 1.3 } },
    ],
  },
];

// Boss怪物
export const BOSS_ENEMIES: EnemyConfig[] = [
  {
    id: 'boss_flame_lord',
    name: '炎魔',
    type: 'boss',
    element: 'fire',
    hp: 1000,
    damage: 15,
    speed: 64,
    expValue: 100,
    color: 0xff0000,
    abilities: [{ type: 'burn_on_contact', trigger: 'passive', params: { damage: 15, duration: 5000 } }],
  },
  {
    id: 'boss_frost_giant',
    name: '霜巨人',
    type: 'boss',
    element: 'ice',
    hp: 1200,
    damage: 12,
    speed: 56,
    expValue: 100,
    color: 0x44aaff,
    abilities: [{ type: 'slow_on_attack', trigger: 'attack', params: { slow: 0.6, duration: 3000 } }],
  },
  {
    id: 'boss_thunder_dragon',
    name: '雷龙',
    type: 'boss',
    element: 'lightning',
    hp: 800,
    damage: 18,
    speed: 72,
    expValue: 100,
    color: 0xaaaa00,
    abilities: [{ type: 'explode_on_death', trigger: 'death', params: { damage: 100, radius: 150 } }],
  },
  {
    id: 'boss_shadow_king',
    name: '暗影之王',
    type: 'boss',
    element: 'shadow',
    hp: 900,
    damage: 16,
    speed: 68,
    expValue: 100,
    color: 0x4400aa,
    abilities: [{ type: 'poison_on_attack', trigger: 'attack', params: { damage: 15, duration: 6000 } }],
  },
  {
    id: 'boss_nature_guardian',
    name: '自然守护者',
    type: 'boss',
    element: 'grass',
    hp: 1100,
    damage: 14,
    speed: 60,
    expValue: 100,
    color: 0x22cc22,
    abilities: [{ type: 'root_on_attack', trigger: 'attack', params: { duration: 2000 } }],
  },
  {
    id: 'boss_golem_lord',
    name: '巨像领主',
    type: 'boss',
    element: 'earth',
    hp: 1500,
    damage: 10,
    speed: 48,
    expValue: 100,
    color: 0x886622,
    abilities: [
      { type: 'hp_boost', trigger: 'passive', params: { multiplier: 2.0 } },
      { type: 'damage_reduction', trigger: 'passive', params: { reduction: 0.3 } },
    ],
  },
  {
    id: 'boss_fallen_angel',
    name: '堕落天使',
    type: 'boss',
    element: 'holy',
    hp: 700,
    damage: 22,
    speed: 80,
    expValue: 100,
    color: 0xccaa00,
    abilities: [],
  },
  {
    id: 'boss_hydra',
    name: '九头蛇',
    type: 'boss',
    element: 'water',
    hp: 1000,
    damage: 12,
    speed: 64,
    expValue: 100,
    color: 0x2266cc,
    abilities: [{ type: 'speed_boost', trigger: 'passive', params: { multiplier: 1.2 } }],
  },
];

// 获取所有敌人配置
export function getAllEnemies(): EnemyConfig[] {
  return [...NORMAL_ENEMIES, ...ELITE_ENEMIES, ...BOSS_ENEMIES];
}

// 获取单个敌人配置
export function getEnemyConfig(id: string): EnemyConfig | undefined {
  return getAllEnemies().find(e => e.id === id);
}

// 按类型获取敌人
export function getEnemiesByType(type: 'normal' | 'elite' | 'boss'): EnemyConfig[] {
  if (type === 'normal') return [...NORMAL_ENEMIES];
  if (type === 'elite') return [...ELITE_ENEMIES];
  return [...BOSS_ENEMIES];
}

// 按元素获取敌人
export function getEnemiesByElement(element: Element): EnemyConfig[] {
  return getAllEnemies().filter(e => e.element === element);
}

// 随机获取普通敌人
export function getRandomNormalEnemy(): EnemyConfig {
  return NORMAL_ENEMIES[Math.floor(Math.random() * NORMAL_ENEMIES.length)];
}

// 随机获取精英敌人
export function getRandomEliteEnemy(): EnemyConfig {
  return ELITE_ENEMIES[Math.floor(Math.random() * ELITE_ENEMIES.length)];
}

// 随机获取Boss
export function getRandomBoss(): EnemyConfig {
  return BOSS_ENEMIES[Math.floor(Math.random() * BOSS_ENEMIES.length)];
}