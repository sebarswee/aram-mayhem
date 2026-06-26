// src/systems/DropSystem.ts
import Phaser from 'phaser';
import { Enemy } from '@/entities/Enemy';
import { Food } from '@/entities/Food';
import { ExpOrb, createExpOrbConfig } from '@/entities/ExpOrb';
import { getFoodDropRate, getRandomFood } from '@/data/foods';

export class DropSystem {
  private scene: Phaser.Scene;
  private player: Phaser.Physics.Arcade.Sprite;
  private foods: Phaser.Physics.Arcade.Group;
  private expOrbs: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene, player: Phaser.Physics.Arcade.Sprite) {
    this.scene = scene;
    this.player = player;

    // Create food group
    this.foods = scene.physics.add.group({
      classType: Food,
      runChildUpdate: true,
    });

    // Create exp orb group
    this.expOrbs = scene.physics.add.group({
      classType: ExpOrb,
      runChildUpdate: true,
    });

    // Listen for enemy death events
    scene.events.on('enemyKilled', this.onEnemyDeath, this);
  }

  /**
   * Handle enemy death - spawn food and exp orbs
   */
  onEnemyDeath(enemy: Enemy): void {
    if (!enemy.active) return;

    // 检查场景是否暂停或物理组是否有效
    const gameState = (this.scene as any).gameState;
    if (gameState?.isUpgrading || gameState?.isSelectingSkill || gameState?.isPaused) {
      return; // 升级/选技能期间不生成掉落
    }

    // 检查场景和物理世界是否有效
    if (!this.scene || !this.scene.scene.isActive() || !this.scene.physics?.world) {
      return;
    }

    // 确保 expOrbs 组存在
    if (!this.expOrbs || !this.expOrbs.active) {
      return;
    }

    const x = enemy.x;
    const y = enemy.y;

    // Food drop check
    this.trySpawnFood(enemy, x, y);

    // Exp orb drop (always drops)
    this.spawnExpOrbs(enemy, x, y);
  }

  /**
   * Try to spawn food based on drop rate
   */
  private trySpawnFood(enemy: Enemy, x: number, y: number): void {
    // 安全检查
    if (!this.foods || !this.foods.active) {
      return;
    }

    if (!this.scene || !this.scene.scene.isActive() || !this.scene.physics?.world) {
      return;
    }

    const dropRate = getFoodDropRate(enemy.config.type);

    if (Math.random() < dropRate) {
      const foodConfig = getRandomFood();
      if (foodConfig) {
        try {
          const food = new Food(this.scene, x, y, foodConfig, this.player);
          this.foods.add(food);
        } catch (error) {
          console.warn('[DropSystem] Failed to create food:', error);
        }
      }
    }
  }

  /**
   * Spawn exp orbs based on enemy's exp value
   * Split into multiple orbs for large values
   */
  private spawnExpOrbs(enemy: Enemy, x: number, y: number): void {
    const expValue = enemy.getExpValue();

    if (expValue <= 0) return;

    // Determine orb configuration based on value
    if (expValue <= 5) {
      // 1 small orb
      this.createExpOrb(x, y, expValue);
    } else if (expValue <= 20) {
      // 2-3 medium orbs
      const orbCount = Phaser.Math.Between(2, 3);
      const valuePerOrb = Math.ceil(expValue / orbCount);
      this.createSpreadExpOrbs(x, y, orbCount, valuePerOrb, 'medium');
    } else {
      // 3-5 large orbs
      const orbCount = Phaser.Math.Between(3, 5);
      const valuePerOrb = Math.ceil(expValue / orbCount);
      this.createSpreadExpOrbs(x, y, orbCount, valuePerOrb, 'large');
    }
  }

  /**
   * Create a single exp orb at position
   */
  private createExpOrb(x: number, y: number, value: number): ExpOrb | null {
    // 安全检查 - 检查场景、物理组和物理世界是否有效
    if (!this.expOrbs || !this.expOrbs.active) {
      console.warn('[DropSystem] expOrbs group not available');
      return null;
    }

    // 检查场景是否仍然活跃
    if (!this.scene || !this.scene.scene.isActive()) {
      return null;
    }

    // 检查物理世界是否可用
    if (!this.scene.physics || !this.scene.physics.world) {
      return null;
    }

    try {
      const config = createExpOrbConfig(value);
      const orb = new ExpOrb(this.scene, x, y, config, this.player);
      this.expOrbs.add(orb);
      return orb;
    } catch (error) {
      console.warn('[DropSystem] Failed to create exp orb:', error);
      return null;
    }
  }

  /**
   * Create multiple exp orbs spread around a position
   */
  private createSpreadExpOrbs(
    centerX: number,
    centerY: number,
    count: number,
    valuePerOrb: number,
    _size: 'small' | 'medium' | 'large'
  ): void {
    const spreadRadius = 20; // Spread orbs within 20 pixels

    for (let i = 0; i < count; i++) {
      // Calculate position with slight spread
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const distance = Math.random() * spreadRadius;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;

      this.createExpOrb(x, y, valuePerOrb);
    }
  }

  /**
   * Get the foods group for collision detection
   */
  getFoods(): Phaser.Physics.Arcade.Group {
    return this.foods;
  }

  /**
   * Get the exp orbs group for collision detection
   */
  getExpOrbs(): Phaser.Physics.Arcade.Group {
    return this.expOrbs;
  }

  /**
   * Get count of active foods
   */
  getActiveFoodCount(): number {
    return this.foods.countActive(true);
  }

  /**
   * Get count of active exp orbs
   */
  getActiveExpOrbCount(): number {
    return this.expOrbs.countActive(true);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Remove event listener
    this.scene.events.off('enemyKilled', this.onEnemyDeath, this);

    // Destroy groups
    this.foods.destroy(true);
    this.expOrbs.destroy(true);
  }
}
