// src/data/waves.ts

export interface WaveConfig {
  wave: number;
  normalCount: number;
  eliteCount: number;
  hasBoss: boolean;
  duration: number; // 毫秒
}

// 波次配置
export const WAVE_CONFIGS: WaveConfig[] = [
  { wave: 1, normalCount: 20, eliteCount: 0, hasBoss: false, duration: 60000 },
  { wave: 2, normalCount: 30, eliteCount: 1, hasBoss: false, duration: 60000 },
  { wave: 3, normalCount: 40, eliteCount: 2, hasBoss: false, duration: 60000 },
  { wave: 4, normalCount: 50, eliteCount: 2, hasBoss: false, duration: 60000 },
  { wave: 5, normalCount: 60, eliteCount: 3, hasBoss: true, duration: 90000 },
  { wave: 6, normalCount: 70, eliteCount: 4, hasBoss: false, duration: 60000 },
  { wave: 7, normalCount: 80, eliteCount: 4, hasBoss: false, duration: 60000 },
  { wave: 8, normalCount: 90, eliteCount: 5, hasBoss: false, duration: 60000 },
  { wave: 9, normalCount: 100, eliteCount: 5, hasBoss: false, duration: 60000 },
  { wave: 10, normalCount: 110, eliteCount: 6, hasBoss: true, duration: 90000 },
];

// 获取波次配置
export function getWaveConfig(wave: number): WaveConfig {
  // 如果超过预设波次，动态生成
  if (wave > WAVE_CONFIGS.length) {
    const baseWave = WAVE_CONFIGS[WAVE_CONFIGS.length - 1];
    const extraWaves = wave - WAVE_CONFIGS.length;
    return {
      wave,
      normalCount: baseWave.normalCount + extraWaves * 10,
      eliteCount: baseWave.eliteCount + Math.floor(extraWaves / 2),
      hasBoss: wave % 5 === 0,
      duration: 60000,
    };
  }
  return WAVE_CONFIGS[wave - 1] || WAVE_CONFIGS[0];
}

// 怪物数值成长
export function getEnemyStatGrowth(wave: number): { hpMult: number; damageMult: number } {
  return {
    hpMult: 1 + (wave - 1) * 0.1,  // 每波 +10% HP
    damageMult: 1 + (wave - 1) * 0.05, // 每波 +5% 伤害
  };
}

// 敌人生成间隔（毫秒）
export function getSpawnInterval(wave: number): number {
  // 波次越高，生成越快
  return Math.max(500, 2000 - wave * 50);
}
