import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { Enemy } from '@/entities/Enemy';
import { Projectile, ProjectileConfig } from '@/entities/Projectile';
import { Food } from '@/entities/Food';
import { ExpOrb } from '@/entities/ExpOrb';
import { EnemySystem } from '@/systems/EnemySystem';
import { SkillSystem } from '@/systems/SkillSystem';
import { ElementSystem } from '@/systems/ElementSystem';
import { DropSystem } from '@/systems/DropSystem';
import { SkillEffects } from '@/graphics/SkillEffects';
import { Element, Skill } from '@/types';

export class CollisionSystem {
  private scene: Phaser.Scene;
  private player: Player;
  private enemySystem: EnemySystem;
  private skillSystem: SkillSystem;
  private skillEffects: SkillEffects;
  private elementSystem: ElementSystem | null = null;
  private dropSystem: DropSystem | null = null;

  constructor(
    scene: Phaser.Scene,
    player: Player,
    enemySystem: EnemySystem,
    skillSystem: SkillSystem
  ) {
    this.scene = scene;
    this.player = player;
    this.enemySystem = enemySystem;
    this.skillSystem = skillSystem;
    this.skillEffects = new SkillEffects(scene);

    this.setupCollisions();
  }

  /**
   * Set the ElementSystem reference (optional, can be set later)
   */
  setElementSystem(elementSystem: ElementSystem): void {
    this.elementSystem = elementSystem;
  }

  /**
   * Set the DropSystem reference (optional, can be set later)
   */
  setDropSystem(dropSystem: DropSystem): void {
    this.dropSystem = dropSystem;
    // Setup food and exp orb collisions once dropSystem is available
    this.setupDropCollisions();
  }

  private setupCollisions(): void {
    // 1. Projectile vs Enemy
    this.scene.physics.add.overlap(
      this.skillSystem.getProjectiles(),
      this.enemySystem.getEnemies(),
      this.handleProjectileHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // 2. Enemy vs Player
    this.scene.physics.add.overlap(
      this.player,
      this.enemySystem.getEnemies(),
      this.handleEnemyHitPlayer as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // 3. Listen for enemy explosion events
    this.scene.events.on('enemyExplosion', this.handleEnemyExplosion, this);
  }

  /**
   * Handle enemy explosion (from explode_on_death ability)
   */
  private handleEnemyExplosion(data: { x: number; y: number; radius: number; damage: number; sourceEnemy: Enemy }): void {
    // Damage player if in range
    const distanceToPlayer = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      data.x,
      data.y
    );

    if (distanceToPlayer <= data.radius) {
      this.player.takeDamage(data.damage);
    }
  }

  /**
   * Setup collision handlers for food and exp orbs
   * Called after dropSystem is set
   */
  private setupDropCollisions(): void {
    if (!this.dropSystem) return;

    // Player vs Food (pickup)
    this.scene.physics.add.overlap(
      this.player,
      this.dropSystem.getFoods(),
      this.handleFoodPickup as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // Player vs ExpOrb (pickup)
    this.scene.physics.add.overlap(
      this.player,
      this.dropSystem.getExpOrbs(),
      this.handleExpOrbPickup as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
  }

  private handleProjectileHitEnemy(
    projectile: Phaser.GameObjects.GameObject,
    enemy: Phaser.GameObjects.GameObject
  ): void {
    const proj = projectile as Projectile;
    const enem = enemy as Enemy;

    // Collision protection: projectile created within 50ms doesn't trigger collision
    // This prevents projectiles from colliding immediately with nearby enemies at creation position
    const creationTime = proj.config.creationTime || 0;
    const age = Date.now() - creationTime;
    if (age < 50) {
      return;
    }

    if (!proj.active || !enem.active) return;

    // Check if already hit this enemy (avoid duplicate hits when piercing)
    if (proj.config.hitEnemies && proj.config.hitEnemies.has(enem.instanceId)) {
      return;
    }

    // Record this enemy as hit
    if (proj.config.previousTargets) {
      proj.config.previousTargets.add(enem.instanceId);
    }
    if (proj.config.hitEnemies) {
      proj.config.hitEnemies.add(enem.instanceId);
    }

    // Deal damage
    const damage = proj.getDamage();
    const killed = enem.takeDamage(damage);

    // Trigger lifesteal
    this.applyLifesteal(damage);

    // Get skill element for synergy check
    const skillElement = proj.config.skill.elements[0] as Element | undefined;

    // Apply skill effects (burn, freeze, stun, poison, etc.)
    const effects = proj.getEffects();
    this.applyEffects(enem, effects, skillElement);

    // Check chain lightning
    const chainRemaining = proj.config.chainRemaining;
    const chainRange = proj.config.chainRange;
    const chainDecay = proj.config.chainDamageDecay;

    if (chainRemaining && chainRemaining > 0 && chainRange) {
      const previousTargets = proj.config.previousTargets || new Set<string>();
      this.processChainLightning(
        enem,
        damage,
        effects,
        chainRemaining,
        chainRange,
        chainDecay || 0.8,
        previousTargets,
        skillElement
      );
    }

    // Check piercing
    const pierceCount = proj.config.pierceCount || 0;
    if (pierceCount > 0) {
      // Decrease pierce count, don't destroy projectile
      proj.config.pierceCount = pierceCount - 1;
    } else {
      // Check for split enhancement before destroying
      const splitCount = this.getSplitCount(proj.config.skill);
      if (splitCount > 0) {
        this.createSplitProjectiles(proj, splitCount);
      }
      // No more piercing, destroy projectile
      proj.destroy();
    }

    // If enemy killed, emit event
    if (killed) {
      this.scene.events.emit('enemyKilled', enem);
    }
  }

  /**
   * Get split count from skill enhancements
   */
  private getSplitCount(skill: Skill): number {
    let splitCount = 0;
    for (const enhancement of skill.enhancements) {
      if (enhancement.type === 'split') {
        // split_1 = 2 projectiles, split_2 = 3 projectiles
        splitCount = Math.max(splitCount, enhancement.value);
      }
    }
    return splitCount;
  }

  /**
   * Create split projectiles when original projectile is destroyed
   */
  private createSplitProjectiles(originalProj: Projectile, splitCount: number): void {
    const baseAngle = originalProj.rotation;
    const spreadAngle = Math.PI / 2; // 90 degree spread
    const splitDamage = Math.floor(originalProj.getDamage() * 0.6); // Split projectiles deal 60% damage

    for (let i = 0; i < splitCount; i++) {
      // Calculate angle for each split projectile
      const angleOffset = (i - (splitCount - 1) / 2) * (spreadAngle / splitCount);
      const angle = baseAngle + angleOffset;

      const config: ProjectileConfig = {
        skill: originalProj.config.skill,
        damage: splitDamage,
        speed: originalProj.config.speed,
        range: originalProj.config.range * 0.3, // Split projectiles have shorter range
        isFromPlayer: true,
        color: originalProj.config.color,
        creationTime: Date.now(),
        // Split projectiles don't chain or pierce
        chainRemaining: 0,
        chainRange: 0,
        chainDamageDecay: 0,
        previousTargets: new Set<string>(),
        pierceCount: 0,
        hitEnemies: new Set<string>(),
      };

      const splitProj = new Projectile(
        this.scene,
        originalProj.x,
        originalProj.y,
        config
      );

      this.skillSystem.getProjectiles().add(splitProj);
      splitProj.fire(angle);

      // Visual effect for split
      this.scene.tweens.add({
        targets: splitProj,
        scale: { from: 0.5, to: 1 },
        alpha: { from: 0.5, to: 1 },
        duration: 100,
      });
    }
  }

  /**
   * Trigger lifesteal
   */
  private applyLifesteal(damage: number): void {
    const lifestealPercent = this.player.stats.lifesteal || 0;
    if (lifestealPercent > 0) {
      const healAmount = Math.floor(damage * lifestealPercent);
      this.player.heal(healAmount);
    }
  }

  /**
   * Handle chain lightning
   */
  private processChainLightning(
    currentEnemy: Enemy,
    currentDamage: number,
    effects: { type: string; value?: number; duration?: number }[],
    chainRemaining: number,
    chainRange: number,
    chainDecay: number,
    previousTargets: Set<string>,
    skillElement?: Element
  ): void {
    if (chainRemaining <= 0) return;

    const nextTarget = this.findChainTarget(
      currentEnemy.x,
      currentEnemy.y,
      chainRange,
      previousTargets
    );

    if (!nextTarget) return;

    // Add to hit list
    previousTargets.add(nextTarget.instanceId);

    // Create lightning visual effect
    this.createChainLightning(
      currentEnemy.x,
      currentEnemy.y,
      nextTarget.x,
      nextTarget.y
    );

    // Delayed hit on next target
    this.scene.time.delayedCall(80, () => {
      if (!nextTarget.active) return;

      const chainDamage = Math.floor(currentDamage * chainDecay);
      const killed = nextTarget.takeDamage(chainDamage);
      this.applyEffects(nextTarget, effects, skillElement);

      // Trigger lifesteal
      this.applyLifesteal(chainDamage);

      if (killed) {
        this.scene.events.emit('enemyKilled', nextTarget);
      }

      // Continue chain
      this.processChainLightning(
        nextTarget,
        chainDamage,
        effects,
        chainRemaining - 1,
        chainRange,
        chainDecay,
        previousTargets,
        skillElement
      );
    });
  }

  /**
   * Find chain lightning target
   */
  private findChainTarget(
    x: number,
    y: number,
    range: number,
    previousTargets: Set<string>
  ): Enemy | null {
    const enemies = this.enemySystem.getEnemies().getChildren() as Enemy[];
    let nearestEnemy: Enemy | null = null;
    let nearestDistance = range;

    for (const enemy of enemies) {
      if (!enemy.active) continue;

      // Check if already hit
      if (previousTargets.has(enemy.instanceId)) continue;

      const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestEnemy = enemy;
      }
    }

    return nearestEnemy;
  }

  /**
   * Create chain lightning visual effect
   */
  private createChainLightning(x1: number, y1: number, x2: number, y2: number): void {
    const graphics = this.scene.add.graphics();
    graphics.setDepth(100);

    // Main lightning bolt
    graphics.lineStyle(4, 0xffff00, 1);
    this.drawLightningBolt(graphics, x1, y1, x2, y2);

    // Glow effect
    graphics.lineStyle(8, 0xffff88, 0.5);
    this.drawLightningBolt(graphics, x1, y1, x2, y2);

    // Flash at start and end points
    const flash1 = this.scene.add.circle(x1, y1, 15, 0xffff88, 0.8);
    const flash2 = this.scene.add.circle(x2, y2, 15, 0xffff88, 0.8);
    flash1.setDepth(101);
    flash2.setDepth(101);

    // Fade out animation
    this.scene.tweens.add({
      targets: [graphics, flash1, flash2],
      alpha: 0,
      duration: 150,
      onComplete: () => {
        graphics.destroy();
        flash1.destroy();
        flash2.destroy();
      },
    });
  }

  /**
   * Draw jagged lightning bolt
   */
  private drawLightningBolt(
    graphics: Phaser.GameObjects.Graphics,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): void {
    const segments = 5;
    const dx = (x2 - x1) / segments;
    const dy = (y2 - y1) / segments;

    graphics.beginPath();
    graphics.moveTo(x1, y1);

    for (let i = 1; i < segments; i++) {
      const x = x1 + dx * i + (Math.random() - 0.5) * 20;
      const y = y1 + dy * i + (Math.random() - 0.5) * 20;
      graphics.lineTo(x, y);
    }

    graphics.lineTo(x2, y2);
    graphics.strokePath();
  }

  /**
   * Apply skill effects to enemy
   * Uses Enemy.addStatusEffect() for all status types
   */
  private applyEffects(
    enemy: Enemy,
    effects: { type: string; value?: number; duration?: number }[],
    skillElement?: Element
  ): void {
    for (const effect of effects) {
      enemy.addStatusEffect({
        type: effect.type as any,
        value: effect.value || 0,
        duration: effect.duration || 1000,
        remainingTime: effect.duration || 1000,
        source: 'skill',
      });
    }

    // Apply element mark for synergy check
    if (this.elementSystem && skillElement) {
      this.elementSystem.checkSynergy(enemy.instanceId, skillElement, 'skill');
    }
  }

  private handleEnemyHitPlayer(
    player: Phaser.GameObjects.GameObject,
    enemy: Phaser.GameObjects.GameObject
  ): void {
    const ply = player as Player;
    const enem = enemy as Enemy;

    if (!ply.active || !enem.active) return;

    // Calculate actual distance to ensure real collision
    const distance = Phaser.Math.Distance.Between(ply.x, ply.y, enem.x, enem.y);
    const collisionDistance = 30; // Reasonable collision distance

    if (distance > collisionDistance) return;

    // Enemy collision damage
    ply.takeDamage(enem.config.damage);

    // Trigger enemy attack abilities
    this.triggerEnemyAttackAbilities(enem, ply);

    // Knockback enemy
    const angle = Phaser.Math.Angle.Between(
      ply.x,
      ply.y,
      enem.x,
      enem.y
    );
    enem.setVelocity(
      Math.cos(angle) * 200,
      Math.sin(angle) * 200
    );

    // Resume chasing after brief invulnerability
    this.scene.time.delayedCall(300, () => {
      if (enem.active) {
        enem.setTarget(ply);
      }
    });
  }

  /**
   * Trigger enemy attack abilities when hitting player
   */
  private triggerEnemyAttackAbilities(enemy: Enemy, player: Player): void {
    const abilities = enemy.getAttackAbilities();

    for (const ability of abilities) {
      switch (ability.type) {
        case 'burn_on_contact':
          // Apply burn to player
          if (player.addStatusEffect) {
            player.addStatusEffect({
              type: 'burn',
              value: ability.params?.damage || 5,
              duration: ability.params?.duration || 2000,
            });
          }
          break;

        case 'slow_on_attack':
          // Apply slow to player
          if (player.addStatusEffect) {
            player.addStatusEffect({
              type: 'slow',
              value: ability.params?.slow || 0.3,
              duration: ability.params?.duration || 1500,
            });
          }
          break;

        case 'poison_on_attack':
          // Apply poison to player
          if (player.addStatusEffect) {
            player.addStatusEffect({
              type: 'poison',
              value: ability.params?.damage || 5,
              duration: ability.params?.duration || 3000,
            });
          }
          break;

        case 'root_on_attack':
          // Apply root to player
          if (player.addStatusEffect) {
            player.addStatusEffect({
              type: 'root',
              value: 1,
              duration: ability.params?.duration || 500,
            });
          }
          break;
      }
    }
  }

  /**
   * Handle food pickup collision
   */
  private handleFoodPickup(
    player: Phaser.GameObjects.GameObject,
    food: Phaser.GameObjects.GameObject
  ): void {
    const ply = player as Player;
    const foodItem = food as Food;

    if (!ply.active || !foodItem.active) return;

    // Food handles its own pickup logic and destruction
    foodItem.onPickup(ply);
  }

  /**
   * Handle exp orb pickup collision
   */
  private handleExpOrbPickup(
    player: Phaser.GameObjects.GameObject,
    orb: Phaser.GameObjects.GameObject
  ): void {
    const ply = player as Player;
    const expOrb = orb as ExpOrb;

    if (!ply.active || !expOrb.active) return;

    // ExpOrb handles its own pickup logic and destruction
    expOrb.onPickup();
  }

  destroy(): void {
    // Phaser automatically cleans up overlap handlers
  }
}