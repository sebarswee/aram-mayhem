import Phaser from 'phaser';
import { EnemyConfig } from '@/types';
import { Enemy as EnemyEntity } from '@/entities/Enemy';
import { ENEMY_CONFIGS, getEnemyPoolForWave, getElitePoolForWave } from '@/data/enemies';
import { ENEMY_SPAWN_CONFIG, ENEMY_SCALING } from '@/config/balance.config';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/game.config';

export class EnemySystem {
  private scene: Phaser.Scene;
  private enemies: Phaser.Physics.Arcade.Group;
  private player: Phaser.GameObjects.Sprite;
  private wave: number = 1;
  private spawnTimer: Phaser.Time.TimerEvent | null = null;
  private enemiesSpawned: number = 0;
  private enemiesToSpawn: number = 0;

  constructor(scene: Phaser.Scene, player: Phaser.GameObjects.Sprite) {
    this.scene = scene;
    this.player = player;

    // 创建敌人组
    this.enemies = scene.physics.add.group({
      classType: EnemyEntity,
      runChildUpdate: true,
    });
  }

  startWave(wave: number): void {
    this.wave = wave;
    this.enemiesSpawned = 0;
    this.enemiesToSpawn = ENEMY_SPAWN_CONFIG.getEnemyCount(wave);

    // 开始生成敌人
    this.spawnTimer = this.scene.time.addEvent({
      delay: ENEMY_SPAWN_CONFIG.spawnInterval,
      callback: this.spawnEnemy,
      callbackScope: this,
      repeat: this.enemiesToSpawn - 1,
    });
  }

  private spawnEnemy(): void {
    if (!this.player.active) return;

    const pool = getEnemyPoolForWave(this.wave);
    const eliteChance = ENEMY_SPAWN_CONFIG.getEliteChance(this.wave);

    // 决定是否生成精英
    let enemyId: string;
    if (Math.random() < eliteChance) {
      const elitePool = getElitePoolForWave(this.wave);
      enemyId = elitePool[Math.floor(Math.random() * elitePool.length)];
    } else {
      enemyId = pool[Math.floor(Math.random() * pool.length)];
    }

    const config = this.applyScaling(ENEMY_CONFIGS[enemyId]);
    const spawnPos = this.getSpawnPosition();

    const enemy = new EnemyEntity(this.scene, spawnPos.x, spawnPos.y, config);
    enemy.setTarget(this.player);
    this.enemies.add(enemy);

    // 敌人死亡事件
    enemy.on('death', () => {
      this.scene.events.emit('enemyKilled', enemy);
    });

    this.enemiesSpawned++;
  }

  private applyScaling(config: EnemyConfig): EnemyConfig {
    const waveMultiplier = Math.pow(ENEMY_SCALING.hpGrowth, this.wave - 1);

    return {
      ...config,
      hp: Math.floor(config.hp * waveMultiplier),
      damage: Math.floor(config.damage * Math.pow(ENEMY_SCALING.damageGrowth, this.wave - 1)),
      speed: config.speed * Math.pow(ENEMY_SCALING.speedGrowth, this.wave - 1),
      expValue: Math.floor(config.expValue * (1 + this.wave * 0.1)),
    };
  }

  private getSpawnPosition(): { x: number; y: number } {
    // 在屏幕边缘随机生成
    const side = Math.floor(Math.random() * 4);
    let x: number, y: number;

    switch (side) {
      case 0: // 上
        x = Math.random() * GAME_WIDTH;
        y = -50;
        break;
      case 1: // 右
        x = GAME_WIDTH + 50;
        y = Math.random() * GAME_HEIGHT;
        break;
      case 2: // 下
        x = Math.random() * GAME_WIDTH;
        y = GAME_HEIGHT + 50;
        break;
      default: // 左
        x = -50;
        y = Math.random() * GAME_HEIGHT;
    }

    return { x, y };
  }

  getEnemies(): Phaser.Physics.Arcade.Group {
    return this.enemies;
  }

  getActiveEnemyCount(): number {
    return this.enemies.countActive(true);
  }

  pause(): void {
    if (this.spawnTimer) {
      this.spawnTimer.paused = true;
    }
    this.enemies.getChildren().forEach((enemy) => {
      (enemy as EnemyEntity).setVelocity(0, 0);
      ((enemy as EnemyEntity).body as Phaser.Physics.Arcade.Body).enable = false;
    });
  }

  resume(): void {
    if (this.spawnTimer) {
      this.spawnTimer.paused = false;
    }
    this.enemies.getChildren().forEach((enemy) => {
      ((enemy as EnemyEntity).body as Phaser.Physics.Arcade.Body).enable = true;
    });
  }

  destroy(): void {
    if (this.spawnTimer) {
      this.spawnTimer.destroy();
    }
    this.enemies.destroy(true);
  }
}
