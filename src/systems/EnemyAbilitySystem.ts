import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { Enemy } from '@/entities/Enemy';
import { EnemyProjectile, EnemyProjectileConfig } from '@/entities/EnemyProjectile';
import { EnemyAbility, Element } from '@/types';
import { EnemySystem } from '@/systems/EnemySystem';
import { ELEMENT_COLORS } from '@/data/elements';
import { enemyAbilityStrategyRegistry } from '@/strategies';

/**
 * Enemy Ability System - executes active abilities for enemies
 *
 * Handles:
 * - charge: Rush towards player
 * - shoot: Fire projectile at player
 * - summon: Spawn minions
 * - shield: Create protective barrier
 * - heal: Restore HP
 * - rage: Enter enraged state
 */
export class EnemyAbilitySystem {
  private scene: Phaser.Scene;
  private player: Player;
  private enemySystem: EnemySystem;
  private projectiles: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene, player: Player, enemySystem: EnemySystem) {
    this.scene = scene;
    this.player = player;
    this.enemySystem = enemySystem;

    // Create projectile group
    this.projectiles = scene.physics.add.group({
      classType: EnemyProjectile,
      runChildUpdate: true,
    });
  }

  /**
   * Update all enemies' active abilities
   */
  update(delta: number, enemies: Enemy[]): void {
    for (const enemy of enemies) {
      if (!enemy.active || enemy.isImmobilized()) continue;

      // Update cooldowns
      enemy.updateAbilityCooldowns(delta);

      // Execute abilities based on chance and cooldown
      this.tryExecuteAbilities(enemy);
    }
  }

  /**
   * Try to execute abilities for an enemy
   */
  private tryExecuteAbilities(enemy: Enemy): void {
    const activeAbilities = enemy.getActiveAbilities();

    for (const ability of activeAbilities) {
      // Check cooldown
      if (!enemy.isAbilityReady(ability.type)) continue;

      // Execute based on type
      const shouldExecute = this.checkAbilityConditions(enemy, ability);
      if (shouldExecute) {
        this.executeAbility(enemy, ability);
        // Set cooldown
        if (ability.cooldown) {
          enemy.setAbilityCooldown(ability.type, ability.cooldown);
        }
      }
    }
  }

  /**
   * Check conditions for ability execution (range, etc.)
   */
  private checkAbilityConditions(enemy: Enemy, ability: EnemyAbility): boolean {
    const context = {
      scene: this.scene,
      player: this.player,
      enemy,
      projectileGroup: this.projectiles,
    };

    // 使用策略模式检查条件
    const strategy = enemyAbilityStrategyRegistry.get(ability.type);
    if (strategy) {
      return strategy.checkConditions(context);
    }

    return false;
  }

  /**
   * Execute a specific ability
   */
  private executeAbility(enemy: Enemy, ability: EnemyAbility): void {
    // 使用策略模式获取警告延迟
    const strategy = enemyAbilityStrategyRegistry.get(ability.type);
    const warningDelay = strategy?.getWarningDelay() || 200;

    // Show warning before execution
    this.showAbilityWarning(enemy, ability.type);

    // Delay execution for warning
    this.scene.time.delayedCall(warningDelay, () => {
      if (!enemy.active) return;

      // 使用策略模式执行能力
      if (strategy) {
        const context = {
          scene: this.scene,
          player: this.player,
          enemy,
          projectileGroup: this.projectiles,
        };
        strategy.execute(context, ability.params || {});
      }
    });
  }

  /**
   * Show ability warning visual
   */
  private showAbilityWarning(enemy: Enemy, abilityType: string): void {
    // 使用策略模式显示警告
    const strategy = enemyAbilityStrategyRegistry.get(abilityType);
    if (strategy) {
      const context = {
        scene: this.scene,
        player: this.player,
        enemy,
        projectileGroup: this.projectiles,
      };
      strategy.showWarning(context);
    }
  }

  /**
   * Get projectiles group for collision detection
   */
  getProjectiles(): Phaser.Physics.Arcade.Group {
    return this.projectiles;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.projectiles.destroy(true);
  }
}