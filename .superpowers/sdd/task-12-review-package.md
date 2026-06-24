diff --git a/src/systems/EnemySystem.ts b/src/systems/EnemySystem.ts
index 02d20a9..f4c38a1 100644
--- a/src/systems/EnemySystem.ts
+++ b/src/systems/EnemySystem.ts
@@ -1,143 +1,342 @@
 import Phaser from 'phaser';
 import { EnemyConfig } from '@/types';
 import { Enemy as EnemyEntity } from '@/entities/Enemy';
-import { ENEMY_CONFIGS, getEnemyPoolForWave, getElitePoolForWave } from '@/data/enemies';
+import {
+  ENEMY_CONFIGS,
+  getEnemyPoolForWave,
+  getElitePoolForWave,
+  BOSS_ENEMIES
+} from '@/data/enemies';
 import { ENEMY_SPAWN_CONFIG, ENEMY_SCALING } from '@/config/balance.config';
-import { GAME_WIDTH, GAME_HEIGHT } from '@/config/game.config';
+
+// Constants for infinite map spawning
+const MIN_SPAWN_RADIUS = 400; // Outside camera view
+const MAX_SPAWN_RADIUS = 600;
+const MAX_ENEMIES = 100;
+const RAPID_SPAWN_THRESHOLD = 30;
+const NORMAL_SPAWN_THRESHOLD = 60;
+
+// Spawn intervals based on enemy count
+const RAPID_SPAWN_INTERVAL = 400; // ms
+const NORMAL_SPAWN_INTERVAL = 800; // ms
+const SLOW_SPAWN_INTERVAL = 1500; // ms
 
 export class EnemySystem {
   private scene: Phaser.Scene;
   private enemies: Phaser.Physics.Arcade.Group;
   private player: Phaser.GameObjects.Sprite;
   private wave: number = 1;
   private spawnTimer: Phaser.Time.TimerEvent | null = null;
-  private enemiesSpawned: number = 0;
-  private enemiesToSpawn: number = 0;
+  private bossActive: boolean = false;
+  private lastBossWave: number = 0;
 
   constructor(scene: Phaser.Scene, player: Phaser.GameObjects.Sprite) {
     this.scene = scene;
     this.player = player;
 
-    // 创建敌人组
+    // Create enemy group
     this.enemies = scene.physics.add.group({
       classType: EnemyEntity,
       runChildUpdate: true,
     });
+
+    // Start continuous spawning
+    this.startContinuousSpawning();
+  }
+
+  /**
+   * Start continuous spawning - enemies spawn continuously regardless of wave state
+   */
+  private startContinuousSpawning(): void {
+    // Remove existing timer if any
+    if (this.spawnTimer) {
+      this.spawnTimer.destroy();
+    }
+
+    // Create new spawn timer with dynamic interval
+    this.spawnTimer = this.scene.time.addEvent({
+      delay: this.getSpawnInterval(),
+      callback: this.spawnEnemy,
+      callbackScope: this,
+      loop: true,
+    });
+  }
+
+  /**
+   * Get spawn interval based on current enemy count
+   */
+  private getSpawnInterval(): number {
+    const count = this.getActiveEnemyCount();
+
+    if (count < RAPID_SPAWN_THRESHOLD) {
+      return RAPID_SPAWN_INTERVAL;
+    } else if (count < NORMAL_SPAWN_THRESHOLD) {
+      return NORMAL_SPAWN_INTERVAL;
+    } else {
+      return SLOW_SPAWN_INTERVAL;
+    }
   }
 
+  /**
+   * Start wave - for backward compatibility with existing code
+   * In the new continuous spawning system, this just sets the wave number
+   */
   startWave(wave: number): void {
+    this.setWave(wave);
+  }
+
+  /**
+   * Set wave number - affects difficulty, not spawn timing
+   */
+  setWave(wave: number): void {
     this.wave = wave;
-    this.enemiesSpawned = 0;
-    this.enemiesToSpawn = ENEMY_SPAWN_CONFIG.getEnemyCount(wave);
 
-    // 开始生成敌人
+    // Check if this is a boss wave (every 5 waves)
+    if (wave % 5 === 0 && wave !== this.lastBossWave && !this.bossActive) {
+      this.spawnBoss();
+      this.lastBossWave = wave;
+    }
+
+    // Restart spawn timer with new interval
+    this.restartSpawnTimer();
+  }
+
+  /**
+   * Restart spawn timer with current interval
+   */
+  private restartSpawnTimer(): void {
+    if (this.spawnTimer) {
+      this.spawnTimer.destroy();
+    }
+
     this.spawnTimer = this.scene.time.addEvent({
-      delay: ENEMY_SPAWN_CONFIG.spawnInterval,
+      delay: this.getSpawnInterval(),
       callback: this.spawnEnemy,
       callbackScope: this,
-      repeat: this.enemiesToSpawn - 1,
+      loop: true,
     });
   }
 
+  /**
+   * Spawn an enemy relative to player position (infinite map support)
+   */
   private spawnEnemy(): void {
+    // Don't spawn if player is not active
     if (!this.player.active) return;
 
+    // Check max enemy count
+    const currentCount = this.getActiveEnemyCount();
+    if (currentCount >= MAX_ENEMIES) {
+      return;
+    }
+
+    // Get enemy pool and elite chance
     const pool = getEnemyPoolForWave(this.wave);
     const eliteChance = ENEMY_SPAWN_CONFIG.getEliteChance(this.wave);
 
-    // 决定是否生成精英
+    // Decide whether to spawn elite
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
 
-    // 敌人死亡事件
+    // Enemy death event
     enemy.on('death', () => {
       this.scene.events.emit('enemyKilled', enemy);
     });
 
-    this.enemiesSpawned++;
+    // Restart spawn timer with updated interval
+    this.restartSpawnTimer();
   }
 
+  /**
+   * Spawn a boss with announcement and special animation
+   */
+  private spawnBoss(): void {
+    if (this.bossActive) return;
+
+    // Get boss for this wave
+    const bossConfig = this.getBossForWave(this.wave);
+    if (!bossConfig) return;
+
+    this.bossActive = true;
+
+    // Show boss announcement
+    this.showBossAnnouncement(bossConfig.name);
+
+    // Spawn boss with delay after announcement
+    this.scene.time.delayedCall(1500, () => {
+      const spawnPos = this.getSpawnPosition();
+      const scaledConfig = this.applyScaling(bossConfig);
+
+      const boss = new EnemyEntity(this.scene, spawnPos.x, spawnPos.y, scaledConfig);
+      boss.setTarget(this.player);
+      this.enemies.add(boss);
+
+      // Play boss spawn animation
+      this.playBossSpawnAnimation(boss);
+
+      // Boss death event
+      boss.on('death', () => {
+        this.bossActive = false;
+        this.scene.events.emit('enemyKilled', boss);
+        this.scene.events.emit('bossDefeated', this.wave);
+      });
+    });
+  }
+
+  /**
+   * Get boss configuration for a specific wave
+   */
+  private getBossForWave(wave: number): EnemyConfig | undefined {
+    // Select boss based on wave number for variety
+    const bossIndex = (Math.floor(wave / 5) - 1) % BOSS_ENEMIES.length;
+    return BOSS_ENEMIES[bossIndex];
+  }
+
+  /**
+   * Show boss announcement with visual effect
+   */
+  private showBossAnnouncement(bossName: string): void {
+    // Emit event for UI to handle
+    this.scene.events.emit('bossSpawn', { name: bossName, wave: this.wave });
+
+    // Screen shake effect
+    this.scene.cameras.main.shake(500, 0.01);
+
+    // Flash effect
+    this.scene.cameras.main.flash(300, 255, 0, 0);
+  }
+
+  /**
+   * Play unique spawn animation for boss
+   */
+  private playBossSpawnAnimation(boss: EnemyEntity): void {
+    // Initial scale to 0
+    boss.setScale(0);
+
+    // Dramatic entrance animation
+    this.scene.tweens.add({
+      targets: boss,
+      scale: boss.config.type === 'boss' ? 1.8 : 1, // Boss scale from Enemy.ts
+      duration: 800,
+      ease: 'Back.easeOut',
+    });
+
+    // Particle burst effect
+    const particles = this.scene.add.particles(boss.x, boss.y, 'particle_glow', {
+      speed: { min: 100, max: 300 },
+      scale: { start: 1, end: 0 },
+      alpha: { start: 1, end: 0 },
+      tint: 0xff0000,
+      lifespan: 800,
+      quantity: 30,
+      emitting: false,
+    });
+    particles.explode();
+    this.scene.time.delayedCall(1000, () => particles.destroy());
+
+    // Glow pulse effect
+    this.scene.tweens.add({
+      targets: boss,
+      alpha: { from: 0.5, to: 1 },
+      duration: 200,
+      yoyo: 2,
+      repeat: 2,
+    });
+  }
+
+  /**
+   * Get spawn position in a ring around the player (infinite map support)
+   */
+  private getSpawnPosition(): { x: number; y: number } {
+    const angle = Math.random() * Math.PI * 2;
+    const radius = MIN_SPAWN_RADIUS + Math.random() * (MAX_SPAWN_RADIUS - MIN_SPAWN_RADIUS);
+
+    return {
+      x: this.player.x + Math.cos(angle) * radius,
+      y: this.player.y + Math.sin(angle) * radius,
+    };
+  }
+
+  /**
+   * Apply wave-based scaling to enemy config
+   */
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
 
-  private getSpawnPosition(): { x: number; y: number } {
-    // 在屏幕边缘随机生成
-    const side = Math.floor(Math.random() * 4);
-    let x: number, y: number;
-
-    switch (side) {
-      case 0: // 上
-        x = Math.random() * GAME_WIDTH;
-        y = -50;
-        break;
-      case 1: // 右
-        x = GAME_WIDTH + 50;
-        y = Math.random() * GAME_HEIGHT;
-        break;
-      case 2: // 下
-        x = Math.random() * GAME_WIDTH;
-        y = GAME_HEIGHT + 50;
-        break;
-      default: // 左
-        x = -50;
-        y = Math.random() * GAME_HEIGHT;
-    }
-
-    return { x, y };
-  }
-
+  /**
+   * Get the enemy group
+   */
   getEnemies(): Phaser.Physics.Arcade.Group {
     return this.enemies;
   }
 
+  /**
+   * Get count of active enemies
+   */
   getActiveEnemyCount(): number {
     return this.enemies.countActive(true);
   }
 
+  /**
+   * Check if a boss is currently active
+   */
+  isBossActive(): boolean {
+    return this.bossActive;
+  }
+
+  /**
+   * Pause spawning and enemy movement
+   */
   pause(): void {
     if (this.spawnTimer) {
       this.spawnTimer.paused = true;
     }
     this.enemies.getChildren().forEach((enemy) => {
       (enemy as EnemyEntity).setVelocity(0, 0);
       ((enemy as EnemyEntity).body as Phaser.Physics.Arcade.Body).enable = false;
     });
   }
 
+  /**
+   * Resume spawning and enemy movement
+   */
   resume(): void {
     if (this.spawnTimer) {
       this.spawnTimer.paused = false;
     }
     this.enemies.getChildren().forEach((enemy) => {
       ((enemy as EnemyEntity).body as Phaser.Physics.Arcade.Body).enable = true;
     });
   }
 
+  /**
+   * Clean up resources
+   */
   destroy(): void {
     if (this.spawnTimer) {
       this.spawnTimer.destroy();
     }
     this.enemies.destroy(true);
   }
 }
