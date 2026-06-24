import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { Enemy } from '@/entities/Enemy';
import { EnemyProjectile, EnemyProjectileConfig } from '@/entities/EnemyProjectile';
import { EnemyAbility, Element } from '@/types';
import { EnemySystem } from '@/systems/EnemySystem';
import { ELEMENT_COLORS } from '@/data/elements';

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
    const distanceToPlayer = Phaser.Math.Distance.Between(
      enemy.x, enemy.y, this.player.x, this.player.y
    );

    switch (ability.type) {
      case 'charge':
        // Charge when within medium range
        return distanceToPlayer > 100 && distanceToPlayer < 400;

      case 'shoot':
        // Shoot when within range
        return distanceToPlayer < 500;

      case 'summon':
        // Summon when player is far
        return distanceToPlayer > 200;

      case 'shield':
        // Shield when HP is low
        return enemy.getHpPercentage() < 50;

      case 'heal':
        // Heal when HP is very low
        return enemy.getHpPercentage() < 30;

      case 'rage':
        // Rage at specific HP threshold
        return enemy.getHpPercentage() < 20 && !enemy.isEnraged;

      default:
        return false;
    }
  }

  /**
   * Execute a specific ability
   */
  private executeAbility(enemy: Enemy, ability: EnemyAbility): void {
    // Show warning before execution
    this.showAbilityWarning(enemy, ability.type);

    // Delay execution for warning
    const warningDelay = this.getWarningDelay(ability.type);

    this.scene.time.delayedCall(warningDelay, () => {
      if (!enemy.active) return;

      switch (ability.type) {
        case 'charge':
          this.executeCharge(enemy, ability.params || {});
          break;

        case 'shoot':
          this.executeShoot(enemy, ability.params || {});
          break;

        case 'summon':
          this.executeSummon(enemy, ability.params || {});
          break;

        case 'shield':
          this.executeShield(enemy, ability.params || {});
          break;

        case 'heal':
          this.executeHeal(enemy, ability.params || {});
          break;

        case 'rage':
          this.executeRage(enemy, ability.params || {});
          break;
      }
    });
  }

  /**
   * Get warning delay based on ability type
   */
  private getWarningDelay(type: string): number {
    switch (type) {
      case 'charge':
        return 500; // 0.5s warning for charge
      case 'shoot':
        return 200; // 0.2s warning for shoot
      case 'summon':
        return 300;
      case 'shield':
        return 100;
      case 'heal':
        return 100;
      case 'rage':
        return 400;
      default:
        return 200;
    }
  }

  /**
   * Show ability warning visual
   */
  private showAbilityWarning(enemy: Enemy, abilityType: string): void {
    switch (abilityType) {
      case 'charge':
        // Red warning line towards player
        const line = this.scene.add.graphics();
        line.lineStyle(4, 0xff4444, 0.6);
        line.lineBetween(enemy.x, enemy.y, this.player.x, this.player.y);
        this.scene.tweens.add({
          targets: line,
          alpha: 0,
          duration: 500,
          onComplete: () => line.destroy(),
        });
        break;

      case 'shoot':
        // Yellow glow on enemy
        const glow = this.scene.add.circle(enemy.x, enemy.y, 25, 0xffff00, 0.5);
        glow.setDepth(31);
        this.scene.tweens.add({
          targets: glow,
          scale: 1.5,
          alpha: 0,
          duration: 200,
          onComplete: () => glow.destroy(),
        });
        break;

      case 'summon':
        // Purple ring
        const ring = this.scene.add.circle(enemy.x, enemy.y, 60, 0x8800ff, 0.4);
        ring.setStrokeStyle(3, 0x8800ff, 0.8);
        ring.setDepth(31);
        this.scene.tweens.add({
          targets: ring,
          scale: 1.2,
          alpha: 0,
          duration: 300,
          onComplete: () => ring.destroy(),
        });
        break;

      case 'rage':
        // Red flash
        enemy.setTint(0xff0000);
        this.scene.time.delayedCall(400, () => {
          if (enemy.active) {
            enemy.applyElementTint();
          }
        });
        break;
    }
  }

  // ==================== Ability Implementations ====================

  /**
   * Execute charge - rush towards player
   */
  private executeCharge(enemy: Enemy, params: Record<string, any>): void {
    const speed = params.speed || 400;
    const duration = params.duration || 800;

    // Calculate direction towards player
    const angle = Phaser.Math.Angle.Between(
      enemy.x, enemy.y, this.player.x, this.player.y
    );

    // Store original speed
    const originalSpeed = enemy.config.speed;

    // Apply charge velocity
    enemy.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    // Charge trail effect
    const trailTimer = this.scene.time.addEvent({
      delay: 50,
      callback: () => {
        if (!enemy.active) {
          trailTimer.destroy();
          return;
        }
        const trail = this.scene.add.circle(enemy.x, enemy.y, 15, 0xff4400, 0.4);
        trail.setDepth(29);
        this.scene.tweens.add({
          targets: trail,
          alpha: 0,
          scale: 0.5,
          duration: 150,
          onComplete: () => trail.destroy(),
        });
      },
      repeat: Math.floor(duration / 50) - 1,
    });

    // Reset to normal behavior after charge
    this.scene.time.delayedCall(duration, () => {
      if (enemy.active) {
        enemy.setVelocity(0, 0);
        enemy.setTarget(this.player);
      }
    });
  }

  /**
   * Execute shoot - fire projectile at player
   */
  private executeShoot(enemy: Enemy, params: Record<string, any>): void {
    const damage = params.damage || 15;
    const speed = params.speed || 200;
    const range = params.range || 400;
    const count = params.count || 1;
    const effect = params.effect;
    const effectValue = params.effectValue;
    const effectDuration = params.effectDuration;

    const elementColor = ELEMENT_COLORS[enemy.element] || 0xffffff;

    // Fire multiple projectiles if count > 1
    for (let i = 0; i < count; i++) {
      let targetX = this.player.x;
      let targetY = this.player.y;

      // Spread if multiple projectiles
      if (count > 1) {
        const spreadAngle = ((i - (count - 1) / 2) / count) * Math.PI * 0.3;
        const baseAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, targetX, targetY);
        targetX = enemy.x + Math.cos(baseAngle + spreadAngle) * 300;
        targetY = enemy.y + Math.sin(baseAngle + spreadAngle) * 300;
      }

      const config: EnemyProjectileConfig = {
        damage,
        speed,
        range,
        color: elementColor,
        effect,
        effectValue,
        effectDuration,
        element: enemy.element,
      };

      const projectile = new EnemyProjectile(this.scene, enemy.x, enemy.y, config);
      this.projectiles.add(projectile);
      projectile.fire(targetX, targetY);

      // Muzzle flash
      const flash = this.scene.add.circle(enemy.x, enemy.y, 20, elementColor, 0.7);
      flash.setDepth(41);
      this.scene.tweens.add({
        targets: flash,
        alpha: 0,
        scale: 0.5,
        duration: 100,
        onComplete: () => flash.destroy(),
      });
    }
  }

  /**
   * Execute summon - spawn minions
   */
  private executeSummon(enemy: Enemy, params: Record<string, any>): void {
    const count = params.count || 2;
    const type = params.type || 'normal';

    // Emit summon event for EnemySystem to handle
    this.scene.events.emit('enemySummon', {
      x: enemy.x,
      y: enemy.y,
      count,
      type,
      element: enemy.element,
    });

    // Summon visual effect
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const spawnX = enemy.x + Math.cos(angle) * 60;
      const spawnY = enemy.y + Math.sin(angle) * 60;

      const portal = this.scene.add.circle(spawnX, spawnY, 25, 0x8800ff, 0.5);
      portal.setDepth(31);
      portal.setStrokeStyle(2, 0xaa00ff, 0.8);

      this.scene.tweens.add({
        targets: portal,
        scale: 1.5,
        alpha: 0,
        duration: 400,
        onComplete: () => portal.destroy(),
      });
    }
  }

  /**
   * Execute shield - create protective barrier
   */
  private executeShield(enemy: Enemy, params: Record<string, any>): void {
    const value = params.value || 50;
    const duration = params.duration || 5000;

    enemy.addShield(value);

    // Shield visual
    const shield = this.scene.add.circle(enemy.x, enemy.y, 40, 0x4488ff, 0.4);
    shield.setStrokeStyle(3, 0x4488ff, 0.8);
    shield.setDepth(31);

    // Follow enemy
    const followEvent = this.scene.time.addEvent({
      delay: 50,
      callback: () => {
        if (!enemy.active || !enemy.hasShield()) {
          followEvent.destroy();
          shield.destroy();
          return;
        }
        shield.setPosition(enemy.x, enemy.y);
      },
      repeat: -1,
    });

    // Fade out after duration
    this.scene.time.delayedCall(duration, () => {
      followEvent.destroy();
      this.scene.tweens.add({
        targets: shield,
        alpha: 0,
        duration: 300,
        onComplete: () => shield.destroy(),
      });
    });
  }

  /**
   * Execute heal - restore HP
   */
  private executeHeal(enemy: Enemy, params: Record<string, any>): void {
    const value = params.value || 100;

    enemy.heal(value);
  }

  /**
   * Execute rage - enter enraged state
   */
  private executeRage(enemy: Enemy, params: Record<string, any>): void {
    enemy.activateRage(params);
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