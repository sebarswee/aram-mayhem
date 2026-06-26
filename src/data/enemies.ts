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
    abilities: [{ type: 'burn_on_contact', trigger: 'attack', params: { damage: 3, duration: 2000 } }],
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
      { type: 'burn_on_contact', trigger: 'attack', params: { damage: 8, duration: 3000 } },
      { type: 'hp_boost', trigger: 'passive', params: { multiplier: 1.5 } },
      { type: 'charge', trigger: 'active', cooldown: 5000, params: { speed: 350, duration: 600 } },
    ],
  },
  {
    id: 'elite_water_elemental',
    name: '水元素精英',
    type: 'elite',
    element: 'water',
    hp: 85,
    damage: 9,
    speed: 110,
    expValue: 25,
    color: 0x2288ff,
    abilities: [
      { type: 'speed_boost', trigger: 'passive', params: { multiplier: 1.4 } },
      { type: 'shoot', trigger: 'active', cooldown: 3000, params: { damage: 15, speed: 220, range: 350 } },
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
      { type: 'shield', trigger: 'active', cooldown: 8000, params: { value: 40, duration: 4000 } },
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
      { type: 'shoot', trigger: 'active', cooldown: 2500, params: { damage: 18, speed: 280, range: 400, count: 2 } },
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
      { type: 'summon', trigger: 'active', cooldown: 10000, params: { count: 2, type: 'normal' } },
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
    abilities: [
      { type: 'burn_on_contact', trigger: 'attack', params: { damage: 15, duration: 5000 } },
      { type: 'charge', trigger: 'active', cooldown: 5000, params: { speed: 400, duration: 800 } },
      { type: 'shoot', trigger: 'active', cooldown: 3000, params: { damage: 20, speed: 250, count: 3, effect: 'burn', effectValue: 8, effectDuration: 3000 } },
    ],
    phases: [
      { phase: 1, hpThreshold: 100, abilities: ['burn_on_contact', 'charge'], damageMultiplier: 1.0, speedMultiplier: 1.0 },
      { phase: 2, hpThreshold: 50, abilities: ['burn_on_contact', 'charge', 'shoot'], damageMultiplier: 1.2, speedMultiplier: 1.1 },
      { phase: 3, hpThreshold: 20, abilities: ['burn_on_contact', 'charge', 'shoot', 'rage'], damageMultiplier: 1.5, speedMultiplier: 1.3, specialBehavior: 'rage' },
    ],
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
    abilities: [
      { type: 'slow_on_attack', trigger: 'attack', params: { slow: 0.6, duration: 3000 } },
      { type: 'shield', trigger: 'active', cooldown: 8000, params: { value: 100, duration: 5000 } },
      { type: 'shoot', trigger: 'active', cooldown: 4000, params: { damage: 18, speed: 200, effect: 'slow', effectValue: 0.4, effectDuration: 2000 } },
    ],
    phases: [
      { phase: 1, hpThreshold: 100, abilities: ['slow_on_attack', 'shield'], damageMultiplier: 1.0, speedMultiplier: 1.0 },
      { phase: 2, hpThreshold: 50, abilities: ['slow_on_attack', 'shield', 'shoot'], damageMultiplier: 1.15, speedMultiplier: 1.1 },
      { phase: 3, hpThreshold: 20, abilities: ['slow_on_attack', 'shield', 'shoot', 'rage'], damageMultiplier: 1.4, speedMultiplier: 1.2, specialBehavior: 'rage' },
    ],
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
    abilities: [
      { type: 'explode_on_death', trigger: 'death', params: { damage: 100, radius: 150 } },
      { type: 'charge', trigger: 'active', cooldown: 4000, params: { speed: 500, duration: 600 } },
      { type: 'shoot', trigger: 'active', cooldown: 2000, params: { damage: 25, speed: 300, count: 5 } },
    ],
    phases: [
      { phase: 1, hpThreshold: 100, abilities: ['charge', 'shoot'], damageMultiplier: 1.0, speedMultiplier: 1.0 },
      { phase: 2, hpThreshold: 50, abilities: ['charge', 'shoot'], damageMultiplier: 1.25, speedMultiplier: 1.2 },
      { phase: 3, hpThreshold: 20, abilities: ['charge', 'shoot', 'rage'], damageMultiplier: 1.6, speedMultiplier: 1.4, specialBehavior: 'rage' },
    ],
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
    abilities: [
      { type: 'poison_on_attack', trigger: 'attack', params: { damage: 15, duration: 6000 } },
      { type: 'summon', trigger: 'active', cooldown: 8000, params: { count: 3, type: 'normal' } },
      { type: 'heal', trigger: 'active', cooldown: 10000, params: { value: 150 } },
      { type: 'shoot', trigger: 'active', cooldown: 3000, params: { damage: 20, speed: 220, effect: 'poison', effectValue: 10, effectDuration: 4000 } },
    ],
    phases: [
      { phase: 1, hpThreshold: 100, abilities: ['poison_on_attack', 'summon'], damageMultiplier: 1.0, speedMultiplier: 1.0 },
      { phase: 2, hpThreshold: 50, abilities: ['poison_on_attack', 'summon', 'shoot'], damageMultiplier: 1.2, speedMultiplier: 1.15 },
      { phase: 3, hpThreshold: 20, abilities: ['poison_on_attack', 'summon', 'shoot', 'heal', 'rage'], damageMultiplier: 1.5, speedMultiplier: 1.3, specialBehavior: 'rage' },
    ],
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
    abilities: [
      { type: 'root_on_attack', trigger: 'attack', params: { duration: 2000 } },
      { type: 'summon', trigger: 'active', cooldown: 6000, params: { count: 4, type: 'normal' } },
      { type: 'heal', trigger: 'active', cooldown: 8000, params: { value: 200 } },
      { type: 'shield', trigger: 'active', cooldown: 12000, params: { value: 80, duration: 4000 } },
    ],
    phases: [
      { phase: 1, hpThreshold: 100, abilities: ['root_on_attack', 'summon'], damageMultiplier: 1.0, speedMultiplier: 1.0 },
      { phase: 2, hpThreshold: 50, abilities: ['root_on_attack', 'summon', 'heal'], damageMultiplier: 1.1, speedMultiplier: 1.1 },
      { phase: 3, hpThreshold: 20, abilities: ['root_on_attack', 'summon', 'heal', 'shield', 'rage'], damageMultiplier: 1.3, speedMultiplier: 1.25, specialBehavior: 'rage' },
    ],
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
      { type: 'shield', trigger: 'active', cooldown: 6000, params: { value: 150, duration: 6000 } },
      { type: 'charge', trigger: 'active', cooldown: 8000, params: { speed: 300, duration: 1000 } },
    ],
    phases: [
      { phase: 1, hpThreshold: 100, abilities: ['hp_boost', 'damage_reduction', 'shield'], damageMultiplier: 1.0, speedMultiplier: 1.0 },
      { phase: 2, hpThreshold: 50, abilities: ['hp_boost', 'damage_reduction', 'shield', 'charge'], damageMultiplier: 1.15, speedMultiplier: 1.2 },
      { phase: 3, hpThreshold: 20, abilities: ['hp_boost', 'damage_reduction', 'shield', 'charge', 'rage'], damageMultiplier: 1.4, speedMultiplier: 1.4, specialBehavior: 'rage' },
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
    abilities: [
      { type: 'charge', trigger: 'active', cooldown: 3500, params: { speed: 450, duration: 500 } },
      { type: 'shoot', trigger: 'active', cooldown: 1500, params: { damage: 30, speed: 280, count: 3 } },
      { type: 'heal', trigger: 'active', cooldown: 5000, params: { value: 100 } },
    ],
    phases: [
      { phase: 1, hpThreshold: 100, abilities: ['charge', 'shoot'], damageMultiplier: 1.0, speedMultiplier: 1.0 },
      { phase: 2, hpThreshold: 50, abilities: ['charge', 'shoot', 'heal'], damageMultiplier: 1.3, speedMultiplier: 1.2 },
      { phase: 3, hpThreshold: 20, abilities: ['charge', 'shoot', 'heal', 'rage'], damageMultiplier: 1.7, speedMultiplier: 1.5, specialBehavior: 'rage' },
    ],
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
    abilities: [
      { type: 'speed_boost', trigger: 'passive', params: { multiplier: 1.2 } },
      { type: 'summon', trigger: 'active', cooldown: 5000, params: { count: 5, type: 'normal' } },
      { type: 'shoot', trigger: 'active', cooldown: 2000, params: { damage: 15, speed: 180, count: 3 } },
      { type: 'heal', trigger: 'active', cooldown: 6000, params: { value: 120 } },
    ],
    phases: [
      { phase: 1, hpThreshold: 100, abilities: ['speed_boost', 'shoot'], damageMultiplier: 1.0, speedMultiplier: 1.0 },
      { phase: 2, hpThreshold: 50, abilities: ['speed_boost', 'shoot', 'summon', 'heal'], damageMultiplier: 1.15, speedMultiplier: 1.15 },
      { phase: 3, hpThreshold: 20, abilities: ['speed_boost', 'shoot', 'summon', 'heal', 'rage'], damageMultiplier: 1.35, speedMultiplier: 1.3, specialBehavior: 'rage' },
    ],
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

// ========== 兼容旧系统的导出 ==========

// 转换为 Record 格式（兼容旧系统）
export const ENEMY_CONFIGS: Record<string, EnemyConfig> = Object.fromEntries(
  getAllEnemies().map(e => [e.id, e])
);

// 获取波次敌人池（根据波次解锁）
export function getEnemyPoolForWave(wave: number): string[] {
  // 波次解锁机制：
  // 波次 1-2: 只有前3种元素敌人
  // 波次 3-4: 解锁中间2种元素敌人
  // 波次 5+: 解锁所有元素敌人

  const elementOrder = ['fire', 'water', 'ice', 'lightning', 'holy', 'shadow', 'grass', 'earth'];

  let unlockedElements: string[];
  if (wave <= 2) {
    unlockedElements = elementOrder.slice(0, 3); // fire, water, ice
  } else if (wave <= 4) {
    unlockedElements = elementOrder.slice(0, 5); // + lightning, holy
  } else {
    unlockedElements = elementOrder; // 全部
  }

  return NORMAL_ENEMIES
    .filter(e => unlockedElements.includes(e.element))
    .map(e => e.id);
}

// 获取精英敌人池（根据波次解锁）
export function getElitePoolForWave(wave: number): string[] {
  // 波次解锁机制：
  // 波次 1-9: 无精英
  // 波次 10+: 开始出现精英

  if (wave < 10) {
    return [];
  }

  // 波次 10+: 按元素顺序逐步解锁精英
  const elementOrder = ['fire', 'water', 'ice', 'lightning', 'holy', 'shadow', 'grass', 'earth'];

  // 根据波次决定解锁几个精英
  // 每10波解锁一个新精英
  const unlockedCount = Math.min(Math.floor((wave - 10) / 10) + 1, ELITE_ENEMIES.length);

  return ELITE_ENEMIES
    .slice(0, unlockedCount)
    .map(e => e.id);
}