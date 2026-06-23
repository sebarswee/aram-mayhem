import { EnemyConfig } from '@/types';

// 敌人配置数据
export const ENEMY_CONFIGS: Record<string, EnemyConfig> = {
  // 普通敌人
  slime: {
    id: 'slime',
    name: '史莱姆',
    type: 'normal',
    hp: 20,
    damage: 5,
    speed: 80,
    behavior: 'chase',
    expValue: 2,
    abilities: [],
    color: 0x44aa44, // 绿色
  },
  bat: {
    id: 'bat',
    name: '蝙蝠',
    type: 'normal',
    hp: 15,
    damage: 8,
    speed: 120,
    behavior: 'chase',
    expValue: 3,
    abilities: [],
    color: 0x884488, // 紫色
  },
  skeleton: {
    id: 'skeleton',
    name: '骷髅',
    type: 'normal',
    hp: 30,
    damage: 10,
    speed: 70,
    behavior: 'chase',
    expValue: 4,
    abilities: [],
    color: 0xcccccc, // 白色
  },

  // 精英敌人
  elite_orc: {
    id: 'elite_orc',
    name: '兽人战士',
    type: 'elite',
    hp: 100,
    damage: 20,
    speed: 90,
    behavior: 'chase',
    expValue: 15,
    abilities: [
      {
        type: 'charge',
        cooldown: 5000,
        params: { speed: 400, distance: 200 },
      },
    ],
    color: 0x884400, // 棕色
  },
  elite_mage: {
    id: 'elite_mage',
    name: '暗影法师',
    type: 'elite',
    hp: 80,
    damage: 25,
    speed: 60,
    behavior: 'ranged',
    expValue: 20,
    abilities: [
      {
        type: 'shoot',
        cooldown: 3000,
        params: { projectileSpeed: 200, damage: 25 },
      },
    ],
    color: 0x440088, // 深紫色
  },
};

// 根据波次获取敌人类型池
export function getEnemyPoolForWave(wave: number): string[] {
  const pool: string[] = [];

  // 波次1-3: 只有史莱姆
  if (wave <= 3) {
    pool.push('slime');
  }
  // 波次4-6: 史莱姆 + 蝙蝠
  else if (wave <= 6) {
    pool.push('slime', 'bat');
  }
  // 波次7+: 史莱姆 + 蝙蝠 + 骷髅
  else {
    pool.push('slime', 'bat', 'skeleton');
  }

  return pool;
}

// 精英敌人池
export function getElitePoolForWave(wave: number): string[] {
  if (wave < 4) return [];
  if (wave < 10) return ['elite_orc'];
  return ['elite_orc', 'elite_mage'];
}
