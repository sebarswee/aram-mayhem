import Phaser from 'phaser';
import { EnemyConfig } from '@/types';
import { Enemy as EnemyEntity } from '@/entities/Enemy';
import {
  ENEMY_CONFIGS,
  getEnemyPoolForWave,
  getElitePoolForWave,
  BOSS_ENEMIES,
  getEnemiesByType
} from '@/data/enemies';
import { ENEMY_SPAWN_CONFIG, ENEMY_SCALING } from '@/config/balance.config';

// Constants for infinite map spawning
const MIN_SPAWN_RADIUS = 400; // Outside camera view
const MAX_SPAWN_RADIUS = 600;
const MAX_ENEMIES = 100;
const RAPID_SPAWN_THRESHOLD = 30;
const NORMAL_SPAWN_THRESHOLD = 60;

// Spawn intervals based on enemy count
const RAPID_SPAWN_INTERVAL = 400; // ms
const NORMAL_SPAWN_INTERVAL = 800; // ms
const SLOW_SPAWN_INTERVAL = 1500; // ms

export class EnemySystem {
  private scene: Phaser.Scene;
  private enemies: Phaser.Physics.Arcade.Group;
  private player: Phaser.GameObjects.Sprite;
  private wave: number = 1;
  private spawnTimer: Phaser.Time.TimerEvent | null = null;
  private bossActive: boolean = false;
  private lastBossWave: number = 0;

  constructor(scene: Phaser.Scene, player: Phaser.GameObjects.Sprite) {
    this.scene = scene;
    this.player = player;

    // Create enemy group
    this.enemies = scene.physics.add.group({
      classType: EnemyEntity,
      runChildUpdate: true,
    });

    // Listen for summon events
    this.scene.events.on('enemySummon', this.handleSummonEvent, this);

    // Start continuous spawning
    this.startContinuousSpawning();
  }

  /**
   * Handle summon event from boss/elite abilities
   */
  private handleSummonEvent(data: { x: number; y: number; count: number; type: string; element?: string }): void {
    // Get random normal enemy config
    const enemyConfig = this.getSummonedEnemyConfig(data.type, data.element);

    for (let i = 0; i < data.count; i++) {
      // Spawn in a circle around the summoner
      const angle = (i / data.count) * Math.PI * 2;
      const distance = 50 + Math.random() * 30;
      const spawnX = data.x + Math.cos(angle) * distance;
      const spawnY = data.y + Math.sin(angle) * distance;

      const enemy = new EnemyEntity(this.scene, spawnX, spawnY, enemyConfig);
      enemy.setTarget(this.player);
      this.enemies.add(enemy);

      // Enemy death event
      enemy.on('death', () => {
        this.scene.events.emit('enemyKilled', enemy);
      });
    }
  }

  /**
   * Get enemy config for summoned enemies
   */
  private getSummonedEnemyConfig(type: string, element?: string): EnemyConfig {
    // Get a random normal enemy
    const normalEnemies = getEnemiesByType('normal');

    // If element specified, try to find matching element
    if (element) {
      const matchingElement = normalEnemies.find(e => e.element === element);
      if (matchingElement) {
        return { ...matchingElement };
      }
    }

    // Otherwise return random
    const randomIndex = Math.floor(Math.random() * normalEnemies.length);
    return { ...normalEnemies[randomIndex] };
  }

  /**
   * Start continuous spawning - enemies spawn continuously regardless of wave state
   */
  private startContinuousSpawning(): void {
    // Remove existing timer if any
    if (this.spawnTimer) {
      this.spawnTimer.destroy();
    }

    // Create new spawn timer with dynamic interval
    this.spawnTimer = this.scene.time.addEvent({
      delay: this.getSpawnInterval(),
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true,
    });
  }

  /**
   * Get spawn interval based on current enemy count
   */
  private getSpawnInterval(): number {
    const count = this.getActiveEnemyCount();

    if (count < RAPID_SPAWN_THRESHOLD) {
      return RAPID_SPAWN_INTERVAL;
    } else if (count < NORMAL_SPAWN_THRESHOLD) {
      return NORMAL_SPAWN_INTERVAL;
    } else {
      return SLOW_SPAWN_INTERVAL;
    }
  }

  /**
   * Start wave - for backward compatibility with existing code
   * In the new continuous spawning system, this just sets the wave number
   */
  startWave(wave: number): void {
    this.setWave(wave);
  }

  /**
   * Set wave number - affects difficulty, not spawn timing
   */
  setWave(wave: number): void {
    this.wave = wave;

    // Check if this is a boss wave (every 5 waves)
    if (wave % 5 === 0 && wave !== this.lastBossWave && !this.bossActive) {
      this.spawnBoss();
      this.lastBossWave = wave;
    }

    // Restart spawn timer with new interval
    this.restartSpawnTimer();
  }

  /**
   * Restart spawn timer with current interval
   */
  private restartSpawnTimer(): void {
    if (this.spawnTimer) {
      this.spawnTimer.destroy();
    }

    this.spawnTimer = this.scene.time.addEvent({
      delay: this.getSpawnInterval(),
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true,
    });
  }

  /**
   * Spawn an enemy relative to player position (infinite map support)
   */
  private spawnEnemy(): void {
    // Don't spawn if player is not active
    if (!this.player.active) return;

    // Check max enemy count
    const currentCount = this.getActiveEnemyCount();
    if (currentCount >= MAX_ENEMIES) {
      return;
    }

    // Get enemy pool and elite chance
    const pool = getEnemyPoolForWave(this.wave);
    const eliteChance = ENEMY_SPAWN_CONFIG.getEliteChance(this.wave);
    const elitePool = getElitePoolForWave(this.wave);

    // Decide whether to spawn elite
    let enemyId: string | undefined;

    // Only spawn elite if pool is not empty
    if (elitePool.length > 0 && Math.random() < eliteChance) {
      enemyId = elitePool[Math.floor(Math.random() * elitePool.length)];
    }

    // Fall back to normal enemy pool
    if (!enemyId && pool.length > 0) {
      enemyId = pool[Math.floor(Math.random() * pool.length)];
    }

    // Safety check
    if (!enemyId) {
      console.warn('[EnemySystem] No enemy available for spawn');
      return;
    }

    const enemyConfig = ENEMY_CONFIGS[enemyId];
    if (!enemyConfig) {
      console.error(`[EnemySystem] Enemy config not found for id: ${enemyId}`);
      return;
    }

    const config = this.applyScaling(enemyConfig);
    const spawnPos = this.getSpawnPosition();

    const enemy = new EnemyEntity(this.scene, spawnPos.x, spawnPos.y, config);
    enemy.setTarget(this.player);
    this.enemies.add(enemy);

    // Enemy death event
    enemy.on('death', () => {
      this.scene.events.emit('enemyKilled', enemy);
    });

    // Restart spawn timer with updated interval
    this.restartSpawnTimer();
  }

  /**
   * Spawn a boss with announcement and special animation
   */
  private spawnBoss(): void {
    if (this.bossActive) return;

    // Get boss for this wave
    const bossConfig = this.getBossForWave(this.wave);
    if (!bossConfig) return;

    this.bossActive = true;

    // Show boss announcement
    this.showBossAnnouncement(bossConfig.name);

    // Spawn boss with delay after announcement
    this.scene.time.delayedCall(1500, () => {
      const spawnPos = this.getSpawnPosition();
      const scaledConfig = this.applyScaling(bossConfig);

      const boss = new EnemyEntity(this.scene, spawnPos.x, spawnPos.y, scaledConfig);
      boss.setTarget(this.player);
      this.enemies.add(boss);

      // Play boss spawn animation
      this.playBossSpawnAnimation(boss);

      // Boss death event
      boss.on('death', () => {
        this.bossActive = false;
        this.scene.events.emit('enemyKilled', boss);
        this.scene.events.emit('bossDefeated', this.wave);
      });
    });
  }

  /**
   * Get boss configuration for a specific wave
   */
  private getBossForWave(wave: number): EnemyConfig | undefined {
    // Select boss based on wave number for variety
    const bossIndex = (Math.floor(wave / 5) - 1) % BOSS_ENEMIES.length;
    return BOSS_ENEMIES[bossIndex];
  }

  /**
   * Show boss announcement with visual effect
   */
  private showBossAnnouncement(bossName: string): void {
    // Emit event for UI to handle
    this.scene.events.emit('bossSpawn', { name: bossName, wave: this.wave });

    // Screen shake effect
    this.scene.cameras.main.shake(500, 0.01);

    // Flash effect
    this.scene.cameras.main.flash(300, 255, 0, 0);
  }

  /**
   * Play unique spawn animation for boss
   */
  private playBossSpawnAnimation(boss: EnemyEntity): void {
    // Initial scale to 0
    boss.setScale(0);

    // Dramatic entrance animation
    this.scene.tweens.add({
      targets: boss,
      scale: boss.config.type === 'boss' ? 1.8 : 1, // Boss scale from Enemy.ts
      duration: 800,
      ease: 'Back.easeOut',
    });

    // Particle burst effect
    const particles = this.scene.add.particles(boss.x, boss.y, 'particle_glow', {
      speed: { min: 100, max: 300 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: 0xff0000,
      lifespan: 800,
      quantity: 30,
      emitting: false,
    });
    particles.explode();
    this.scene.time.delayedCall(1000, () => particles.destroy());

    // Glow pulse effect
    this.scene.tweens.add({
      targets: boss,
      alpha: { from: 0.5, to: 1 },
      duration: 200,
      yoyo: 2,
      repeat: 2,
    });
  }

  /**
   * Get spawn position in a ring around the player (infinite map support)
   */
  private getSpawnPosition(): { x: number; y: number } {
    const angle = Math.random() * Math.PI * 2;
    const radius = MIN_SPAWN_RADIUS + Math.random() * (MAX_SPAWN_RADIUS - MIN_SPAWN_RADIUS);

    return {
      x: this.player.x + Math.cos(angle) * radius,
      y: this.player.y + Math.sin(angle) * radius,
    };
  }

  /**
   * Apply wave-based scaling to enemy config
   */
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

  /**
   * Get the enemy group
   */
  getEnemies(): Phaser.Physics.Arcade.Group {
    return this.enemies;
  }

  /**
   * Get count of active enemies
   */
  getActiveEnemyCount(): number {
    return this.enemies.countActive(true);
  }

  /**
   * 在指定位置生成敌人（供 EnemySpawnSystem 使用）
   */
  spawnEnemyAt(x: number, y: number, type: string): void {
    const enemyConfig = this.getEnemyConfig(type);
    if (enemyConfig) {
      const enemy = new EnemyEntity(this.scene, x, y, enemyConfig);
      enemy.setTarget(this.player);
      this.enemies.add(enemy);

      // Enemy death event
      enemy.on('death', () => {
        this.scene.events.emit('enemyKilled', enemy);
      });
    }
  }

  /**
   * 获取敌人配置（Vampire Survivors 风格的基础敌人类型）
   */
  private getEnemyConfig(type: string): EnemyConfig | null {
    // 基础敌人配置（使用现有元素敌人）
    const configs: Record<string, EnemyConfig> = {
      basic: {
        id: 'flame_slime',
        name: 'Flame Slime',
        type: 'normal',
        element: 'fire',
        hp: 30,
        damage: 10,
        speed: 100,
        expValue: 1,
        color: 0xff4400,
        abilities: [],
      },
      fast: {
        id: 'thunder_spirit',
        name: 'Thunder Spirit',
        type: 'normal',
        element: 'lightning',
        hp: 20,
        damage: 8,
        speed: 150,
        expValue: 1,
        color: 0xffff00,
        abilities: [],
      },
      tank: {
        id: 'rock_golem',
        name: 'Rock Golem',
        type: 'normal',
        element: 'earth',
        hp: 80,
        damage: 15,
        speed: 60,
        expValue: 3,
        color: 0xaa8844,
        abilities: [],
      },
    };

    return configs[type] || null;
  }

  /**
   * Check if a boss is currently active
   */
  isBossActive(): boolean {
    return this.bossActive;
  }

  /**
   * Pause spawning and enemy movement
   */
  pause(): void {
    if (this.spawnTimer) {
      this.spawnTimer.paused = true;
    }
    this.enemies.getChildren().forEach((enemy) => {
      (enemy as EnemyEntity).setVelocity(0, 0);
      ((enemy as EnemyEntity).body as Phaser.Physics.Arcade.Body).enable = false;
    });
  }

  /**
   * Resume spawning and enemy movement
   */
  resume(): void {
    if (this.spawnTimer) {
      this.spawnTimer.paused = false;
    }
    this.enemies.getChildren().forEach((enemy) => {
      const body = ((enemy as EnemyEntity).body as Phaser.Physics.Arcade.Body);
      // 重置速度，防止残留速度导致敌人突然冲向玩家
      body.setVelocity(0, 0);
      body.enable = true;
    });
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.spawnTimer) {
      this.spawnTimer.destroy();
    }
    this.enemies.destroy(true);
  }
}
