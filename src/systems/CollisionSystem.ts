import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { Enemy } from '@/entities/Enemy';
import { Projectile, ProjectileConfig } from '@/entities/Projectile';
import { EnemyProjectile } from '@/entities/EnemyProjectile';
import { Food } from '@/entities/Food';
import { ExpOrb } from '@/entities/ExpOrb';
import { EnemySystem } from '@/systems/EnemySystem';
import { SkillSystem } from '@/systems/SkillSystem';
import { EnemyAbilitySystem } from '@/systems/EnemyAbilitySystem';
import { ElementSystem } from '@/systems/ElementSystem';
import { DropSystem } from '@/systems/DropSystem';
import { specialBehaviorRegistry } from '@/systems/SpecialBehaviorRegistry';
import { SkillEffects } from '@/graphics/SkillEffects';
import { Element, Skill } from '@/types';
import { statusEffectStrategyRegistry, StatusEffectExecutionContext, enemyAttackAbilityRegistry } from '@/strategies';

export class CollisionSystem {
  private scene: Phaser.Scene;
  private player: Player;
  private enemySystem: EnemySystem;
  private skillSystem: SkillSystem;
  private skillEffects: SkillEffects;
  private elementSystem: ElementSystem | null = null;
  private dropSystem: DropSystem | null = null;
  private enemyAbilitySystem: EnemyAbilitySystem | null = null;

  // 碰撞冷却追踪 - 防止同一敌人短时间内多次触发碰撞
  private enemyCollisionCooldowns: Map<string, number> = new Map();
  private readonly COLLISION_COOLDOWN = 500; // 碰撞冷却时间（毫秒）

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
   * 更新方法 - 定期清理过期的碰撞冷却记录
   */
  update(): void {
    const now = Date.now();
    // 清理超过2秒未更新的碰撞冷却记录
    for (const [enemyId, lastTime] of this.enemyCollisionCooldowns.entries()) {
      if (now - lastTime > 2000) {
        this.enemyCollisionCooldowns.delete(enemyId);
      }
    }
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

  /**
   * Set the EnemyAbilitySystem reference (optional, can be set later)
   */
  setEnemyAbilitySystem(enemyAbilitySystem: EnemyAbilitySystem): void {
    this.enemyAbilitySystem = enemyAbilitySystem;
    // Setup enemy projectile collisions
    this.setupEnemyProjectileCollisions();
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

    // 4. Listen for enemy summon events
    this.scene.events.on('enemySummon', this.handleEnemySummon, this);
  }

  /**
   * Handle enemy summon event (from summon ability)
   */
  private handleEnemySummon(data: { x: number; y: number; count: number; type: string; element?: string }): void {
    // Emit to EnemySystem to handle spawning
    // This will be handled by EnemySystem listening to the same event
  }

  /**
   * Handle enemy explosion (from explode_on_death ability)
   */
  private handleEnemyExplosion(data: { x: number; y: number; radius: number; damage: number; sourceEnemy: Enemy }): void {
    // Damage player if in range - apply element resistance from source enemy
    const distanceToPlayer = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      data.x,
      data.y
    );

    if (distanceToPlayer <= data.radius) {
      // Use source enemy's element for resistance calculation
      this.player.takeElementalDamage(data.damage, data.sourceEnemy.element);
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

  /**
   * Setup collision handlers for enemy projectiles
   */
  private setupEnemyProjectileCollisions(): void {
    if (!this.enemyAbilitySystem) return;

    // Player vs Enemy Projectile
    this.scene.physics.add.overlap(
      this.player,
      this.enemyAbilitySystem.getProjectiles(),
      this.handleEnemyProjectileHitPlayer as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
  }

  /**
   * Handle enemy projectile hitting player
   */
  private handleEnemyProjectileHitPlayer(
    player: Phaser.GameObjects.GameObject,
    projectile: Phaser.GameObjects.GameObject
  ): void {
    const ply = player as Player;
    const proj = projectile as EnemyProjectile;

    if (!ply.active || !proj.active) return;

    // Deal damage to player - apply element resistance
    const damage = proj.getDamage();
    const element = proj.getElement();
    if (element) {
      ply.takeElementalDamage(damage, element);
    } else {
      ply.takeDamage(damage);
    }

    // Apply effect if any
    const effect = proj.getEffect();
    if (effect) {
      ply.addStatusEffect({
        type: effect.type as any,
        value: effect.value,
        duration: effect.duration,
      });
    }

    // Destroy projectile
    proj.destroy();
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

    // Check for shatter effect (extra damage to frozen enemies)
    let damage = proj.getDamage();
    if (proj.config.shatterMultiplier && proj.config.shatterMultiplier > 1) {
      const hasFreeze = enem.statusEffects.some(e => e.type === 'freeze');
      if (hasFreeze) {
        damage = Math.floor(damage * proj.config.shatterMultiplier);
        // Create shatter visual effect
        this.createShatterEffect(enem.x, enem.y);
      }
    }

    // Get skill element for synergy check and counter bonus
    const skillElement = proj.config.skill.elements[0] as Element | undefined;

    // Deal damage with element for counter bonus
    const killed = enem.takeDamage(damage, skillElement);

    // Trigger lifesteal
    this.applyLifesteal(damage);

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

    // Leave slow field if configured
    if (proj.config.leaveSlowField) {
      this.createSlowField(
        proj.x,
        proj.y,
        proj.config.slowFieldValue || 0.5,
        proj.config.slowFieldDuration || 3000
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

      // Check for explode on hit
      if (proj.config.explodeOnHit) {
        this.createExplosionOnHit(
          proj.x,
          proj.y,
          proj.config.explodeRadius || 60,
          Math.floor(damage * (proj.config.explodeDamage || 0.5)),
          skillElement
        );
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
   * Get split count from skill enhancements and special behaviors
   */
  private getSplitCount(skill: Skill): number {
    let splitCount = 0;

    // Check enhancements (old system)
    for (const enhancement of skill.enhancements) {
      if (enhancement.type === 'split') {
        // split_1 = 2 projectiles, split_2 = 3 projectiles
        splitCount = Math.max(splitCount, enhancement.value);
      }
    }

    // Check special behaviors (new upgrade system)
    const behaviorSplit = specialBehaviorRegistry.getBehaviorValue(skill, 'split');
    if (behaviorSplit) {
      splitCount = Math.max(splitCount, behaviorSplit);
    }

    return splitCount;
  }

  /**
   * Create explosion on projectile hit
   */
  private createExplosionOnHit(x: number, y: number, radius: number, damage: number, skillElement?: Element): void {
    // Visual explosion
    const explosion = this.scene.add.circle(x, y, radius * 0.5, 0xff6600, 0.8);
    explosion.setDepth(100);

    const shockwave = this.scene.add.circle(x, y, radius * 0.3, 0xffff00, 0.6);
    shockwave.setDepth(99);

    // Particle burst
    const particles = this.scene.add.particles(x, y, 'particle_fire', {
      speed: { min: 100, max: 250 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 400,
      quantity: 15,
      emitting: false,
    });
    particles.explode();
    particles.setDepth(101);

    // Animation
    this.scene.tweens.add({
      targets: [explosion, shockwave],
      scaleX: 2.5,
      scaleY: 2.5,
      alpha: 0,
      duration: 350,
      onComplete: () => {
        explosion.destroy();
        shockwave.destroy();
        particles.destroy();
      },
    });

    // Damage enemies in range
    const enemies = this.enemySystem.getEnemies().getChildren() as Enemy[];
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
      if (distance <= radius) {
        // Damage falloff
        const falloff = 1 - (distance / radius) * 0.3;
        enemy.takeDamage(Math.floor(damage * falloff), skillElement);
      }
    }
  }

  /**
   * Create shatter visual effect
   */
  private createShatterEffect(x: number, y: number): void {
    // Ice shards burst
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const shard = this.scene.add.circle(
        x + Math.cos(angle) * 5,
        y + Math.sin(angle) * 5,
        8,
        0x88ddff,
        0.8
      );
      shard.setDepth(100);

      this.scene.tweens.add({
        targets: shard,
        x: x + Math.cos(angle) * 50,
        y: y + Math.sin(angle) * 50,
        alpha: 0,
        scale: 0.3,
        duration: 300,
        onComplete: () => shard.destroy(),
      });
    }

    // White flash
    const flash = this.scene.add.circle(x, y, 30, 0xffffff, 0.9);
    flash.setDepth(99);
    this.scene.tweens.add({
      targets: flash,
      scale: 1.5,
      alpha: 0,
      duration: 200,
      onComplete: () => flash.destroy(),
    });
  }

  /**
   * Create slow field at position
   */
  private createSlowField(x: number, y: number, slowValue: number, duration: number): void {
    // Visual slow field
    const field = this.scene.add.circle(x, y, 80, 0x88aaff, 0.3);
    field.setDepth(25);
    field.setStrokeStyle(2, 0x88aaff, 0.5);

    // Apply slow to enemies in range periodically
    const tickInterval = 500;
    let elapsed = 0;

    const slowTimer = this.scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          slowTimer.destroy();
          field.destroy();
          return;
        }

        // Apply slow to enemies in range
        const enemies = this.enemySystem.getEnemies().getChildren() as Enemy[];
        for (const enemy of enemies) {
          if (!enemy.active) continue;
          const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
          if (distance <= 80) {
            enemy.addStatusEffect({
              type: 'slow',
              value: slowValue,
              duration: tickInterval + 100,
              remainingTime: tickInterval + 100,
              source: 'slow_field',
            });
          }
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
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
      const killed = nextTarget.takeDamage(chainDamage, skillElement);
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
   * Uses Enemy.addStatusEffect() for status types, handles instant effects separately
   */
  private applyEffects(
    enemy: Enemy,
    effects: { type: string; value?: number; duration?: number }[],
    skillElement?: Element
  ): void {
    const player = this.player;

    for (const effect of effects) {
      // 创建执行上下文
      const context: StatusEffectExecutionContext = {
        scene: this.scene,
        player,
        enemy,
      };

      // 尝试使用策略模式
      if (statusEffectStrategyRegistry.hasStrategy(effect.type)) {
        statusEffectStrategyRegistry.execute(effect as any, context);
      }
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

    // 碰撞冷却检查 - 防止同一敌人短时间内多次触发碰撞
    const now = Date.now();
    const lastCollision = this.enemyCollisionCooldowns.get(enem.instanceId) || 0;
    if (now - lastCollision < this.COLLISION_COOLDOWN) {
      return; // 冷却期内，跳过此次碰撞
    }
    this.enemyCollisionCooldowns.set(enem.instanceId, now);

    // Calculate actual distance to ensure real collision
    const distance = Phaser.Math.Distance.Between(ply.x, ply.y, enem.x, enem.y);
    const collisionDistance = 30; // Reasonable collision distance

    if (distance > collisionDistance) return;

    // Get enemy damage before applying
    const enemyDamage = enem.config.damage;

    // Enemy collision damage - apply element resistance
    ply.takeElementalDamage(enemyDamage, enem.element);

    // 玩家击退效果 - 将玩家推开（防止重叠）
    if (ply.body) {
      const pushAngle = Phaser.Math.Angle.Between(enem.x, enem.y, ply.x, ply.y);
      const pushSpeed = 250; // 击退速度
      (ply.body as Phaser.Physics.Arcade.Body).setVelocity(
        Math.cos(pushAngle) * pushSpeed,
        Math.sin(pushAngle) * pushSpeed
      );

      // 短暂禁用玩家控制，避免立即返回
      // 无敌时间与伤害间隔一致（500ms）
      ply.isInvincible = true;
      this.scene.time.delayedCall(500, () => {
        ply.isInvincible = false;
      });
    }

    // Apply reflect damage if player has reflect effect
    if (ply.hasReflect()) {
      const reflectPercent = ply.getReflectValue();
      const reflectDamage = Math.floor(enemyDamage * reflectPercent);
      if (reflectDamage > 0) {
        enem.takeDamage(reflectDamage);

        // Visual feedback for reflect
        const reflectFlash = this.scene.add.circle(ply.x, ply.y, 40, 0xffff88, 0.6);
        reflectFlash.setDepth(100);
        this.scene.tweens.add({
          targets: reflectFlash,
          alpha: 0,
          scale: 1.5,
          duration: 200,
          onComplete: () => reflectFlash.destroy(),
        });

        // Create reflect beam visual
        const beam = this.scene.add.graphics();
        beam.lineStyle(3, 0xffff88, 0.8);
        beam.lineBetween(ply.x, ply.y, enem.x, enem.y);
        this.scene.tweens.add({
          targets: beam,
          alpha: 0,
          duration: 150,
          onComplete: () => beam.destroy(),
        });
      }
    }

    // Apply counter damage if player has counter damage effect (火焰反击)
    if (ply.hasCounterDamage()) {
      const counterDamage = ply.triggerCounterDamage();
      if (counterDamage > 0) {
        enem.takeDamage(counterDamage);

        // Visual feedback for counter damage - fire burst
        const fireBurst = this.scene.add.circle(enem.x, enem.y, 30, 0xff4400, 0.8);
        fireBurst.setDepth(100);
        this.scene.tweens.add({
          targets: fireBurst,
          alpha: 0,
          scale: 1.5,
          duration: 200,
          onComplete: () => fireBurst.destroy(),
        });

        // Fire beam from player to enemy
        const fireBeam = this.scene.add.graphics();
        fireBeam.lineStyle(4, 0xff4400, 0.9);
        fireBeam.lineBetween(ply.x, ply.y, enem.x, enem.y);
        this.scene.tweens.add({
          targets: fireBeam,
          alpha: 0,
          duration: 150,
          onComplete: () => fireBeam.destroy(),
        });
      }
    }

    // Apply counter freeze if player has counter freeze effect (冰霜屏障)
    if (ply.hasCounterFreeze()) {
      const freezeDuration = ply.triggerCounterFreeze();
      if (freezeDuration > 0) {
        // Apply freeze to enemy
        enem.addStatusEffect({
          type: 'freeze',
          value: 1,
          duration: freezeDuration,
          remainingTime: freezeDuration,
          source: 'counter_freeze',
        });

        // Visual feedback for counter freeze - ice burst
        const iceBurst = this.scene.add.circle(enem.x, enem.y, 30, 0x88ddff, 0.8);
        iceBurst.setDepth(100);
        this.scene.tweens.add({
          targets: iceBurst,
          alpha: 0,
          scale: 1.5,
          duration: 200,
          onComplete: () => iceBurst.destroy(),
        });

        // Frost beam from player to enemy
        const frostBeam = this.scene.add.graphics();
        frostBeam.lineStyle(4, 0x88ffff, 0.9);
        frostBeam.lineBetween(ply.x, ply.y, enem.x, enem.y);
        this.scene.tweens.add({
          targets: frostBeam,
          alpha: 0,
          duration: 150,
          onComplete: () => frostBeam.destroy(),
        });
      }
    }

    // Trigger enemy attack abilities
    this.triggerEnemyAttackAbilities(enem, ply);

    // Knockback enemy (only if still active)
    if (enem.active && enem.body) {
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
        if (enem.active && enem.body) {
          enem.setTarget(ply);
        }
      });
    }
  }

  /**
   * Trigger enemy attack abilities when hitting player
   */
  private triggerEnemyAttackAbilities(enemy: Enemy, player: Player): void {
    const abilities = enemy.getAttackAbilities();

    for (const ability of abilities) {
      // 使用策略模式
      if (enemyAttackAbilityRegistry.hasStrategy(ability.type)) {
        enemyAttackAbilityRegistry.execute(ability.type, { enemy, player }, ability.params);
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
    // 清理碰撞冷却记录
    this.enemyCollisionCooldowns.clear();
  }
}