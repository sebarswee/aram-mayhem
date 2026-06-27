import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { EnemySystem } from '@/systems/EnemySystem';

export interface EnemySpawnConfig {
  baseSpawnRate: number;      // 基础生成率（每分钟）
  minSpawnDistance: number;   // 最小生成距离
  maxSpawnDistance: number;   // 最大生成距离
  waveInterval: number;       // 巨浪间隔（毫秒）
  difficultyScale: number;    // 难度缩放系数
}

export class EnemySpawnSystem {
  private config: EnemySpawnConfig;
  private lastSpawnTime: number = 0;
  private totalEnemiesSpawned: number = 0;
  private lastWaveTriggerTime: number = -Infinity; // 防止巨浪重复触发

  constructor(
    private scene: Phaser.Scene,
    private player: Player,
    private enemySystem: EnemySystem,
    config?: Partial<EnemySpawnConfig>
  ) {
    // 默认配置（Vampire Survivors 风格）
    this.config = {
      baseSpawnRate: config?.baseSpawnRate || 10,
      minSpawnDistance: config?.minSpawnDistance || 500,
      maxSpawnDistance: config?.maxSpawnDistance || 700,
      waveInterval: config?.waveInterval || 60000,
      difficultyScale: config?.difficultyScale || 1.5,
      ...config
    };
  }

  /**
   * 更新敌人生成（每帧调用）
   */
  update(time: number): void {
    const minutesElapsed = time / 60000;

    // 计算当前生成率（随时间增加）
    const spawnRate = this.config.baseSpawnRate + minutesElapsed * this.config.difficultyScale;

    // 检查是否是巨浪时间（每分钟一次大波）
    // 使用标志位防止在同一时间窗口内重复触发
    const timeSinceLastTrigger = time - this.lastWaveTriggerTime;
    const shouldTriggerWave = time >= this.config.waveInterval &&
                              timeSinceLastTrigger >= this.config.waveInterval;

    if (shouldTriggerWave) {
      // 巨浪生成（3倍数量）
      this.lastWaveTriggerTime = time;
      this.spawnWave(spawnRate * 3, time);
    } else {
      // 常规生成
      this.spawnRegular(spawnRate, time);
    }
  }

  /**
   * 常规敌人生成
   */
  private spawnRegular(spawnRate: number, time: number): void {
    // 基于生成率计算生成间隔
    const spawnInterval = 60000 / spawnRate; // 毫秒

    if (time - this.lastSpawnTime > spawnInterval) {
      this.spawnEnemyNearPlayer();
      this.lastSpawnTime = time;
    }
  }

  /**
   * 巨浪生成（环形生成）
   */
  private spawnWave(count: number, _time: number): void {
    console.log(`[EnemySpawnSystem] Spawning wave with ${count} enemies`);

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const distance = this.config.minSpawnDistance + Math.random() * 200;

      const x = this.player.x + Math.cos(angle) * distance;
      const y = this.player.y + Math.sin(angle) * distance;

      this.spawnEnemy(x, y);
    }

    this.lastSpawnTime = _time;
  }

  /**
   * 在玩家周围生成单个敌人
   */
  private spawnEnemyNearPlayer(): void {
    const angle = Math.random() * Math.PI * 2;
    const distance = this.config.minSpawnDistance +
      Math.random() * (this.config.maxSpawnDistance - this.config.minSpawnDistance);

    const x = this.player.x + Math.cos(angle) * distance;
    const y = this.player.y + Math.sin(angle) * distance;

    this.spawnEnemy(x, y);
  }

  /**
   * 生成敌人
   */
  private spawnEnemy(x: number, y: number): void {
    // 根据游戏时间选择敌人类型
    const time = this.scene.time.now;
    const minutes = time / 60000;

    let enemyType = 'basic';
    if (minutes > 2) {
      enemyType = Math.random() > 0.7 ? 'fast' : 'basic';
    }
    if (minutes > 5) {
      enemyType = Math.random() > 0.5 ? 'tank' : 'fast';
    }

    // 使用 EnemySystem 生成敌人
    this.enemySystem.spawnEnemyAt(x, y, enemyType);

    this.totalEnemiesSpawned++;
  }

  /**
   * 获取统计信息
   */
  getStats(): { totalSpawned: number } {
    return {
      totalSpawned: this.totalEnemiesSpawned
    };
  }
}
