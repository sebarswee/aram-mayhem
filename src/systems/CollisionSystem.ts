import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { Enemy } from '@/entities/Enemy';
import { Projectile } from '@/entities/Projectile';
import { EnemySystem } from '@/systems/EnemySystem';
import { SkillSystem } from '@/systems/SkillSystem';
import { SkillEffects } from '@/graphics/SkillEffects';

export class CollisionSystem {
  private scene: Phaser.Scene;
  private player: Player;
  private enemySystem: EnemySystem;
  private skillSystem: SkillSystem;
  private skillEffects: SkillEffects;

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

  private setupCollisions(): void {
    // 1. 投射物 vs 敌人
    this.scene.physics.add.overlap(
      this.skillSystem.getProjectiles(),
      this.enemySystem.getEnemies(),
      this.handleProjectileHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // 2. 敌人 vs 玩家
    this.scene.physics.add.overlap(
      this.player,
      this.enemySystem.getEnemies(),
      this.handleEnemyHitPlayer as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
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

    console.log(`[CollisionSystem] handleProjectileHitEnemy triggered! proj.active: ${proj.active}, enemy.active: ${enem.active}`);

    // 碰撞保护：投射物创建后 50ms 内不触发碰撞
    // 这是为了防止投射物在玩家位置创建时立即与附近的敌人碰撞
    const creationTime = proj.config.creationTime || 0;
    const age = Date.now() - creationTime;
    if (age < 50) {
      console.log(`[CollisionSystem] Projectile too young, skip collision`);
      return;
    }

    if (!proj.active || !enem.active) return;

    // 检查是否已经命中过这个敌人（穿透时避免重复）
    if (proj.config.hitEnemies && proj.config.hitEnemies.has(enem.instanceId)) {
      return;
    }

    // 记录此敌人已被打击
    if (proj.config.previousTargets) {
      proj.config.previousTargets.add(enem.instanceId);
    }
    if (proj.config.hitEnemies) {
      proj.config.hitEnemies.add(enem.instanceId);
    }

    // 造成伤害
    const damage = proj.getDamage();
    const killed = enem.takeDamage(damage);

    // 触发生命偷取
    this.applyLifesteal(damage);

    // 应用技能效果（冰冻、减速、灼烧等）
    const effects = proj.getEffects();
    console.log(`[CollisionSystem] Applying effects:`, effects.map(e => e.type));
    this.applyEffects(enem, effects);

    // 检查是否可以连锁
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
        previousTargets
      );
    }

    // 检查穿透
    const pierceCount = proj.config.pierceCount || 0;
    if (pierceCount > 0) {
      // 减少穿透次数，不销毁投射物
      proj.config.pierceCount = pierceCount - 1;
    } else {
      // 没有穿透了，销毁投射物
      proj.destroy();
    }

    // 如果击杀敌人，发出事件
    if (killed) {
      this.scene.events.emit('enemyKilled', enem);
    }
  }

  /**
   * 触发生命偷取
   */
  private applyLifesteal(damage: number): void {
    const lifestealPercent = this.player.stats.lifesteal || 0;
    if (lifestealPercent > 0) {
      const healAmount = Math.floor(damage * lifestealPercent);
      this.player.heal(healAmount);
    }
  }

  /**
   * 处理闪电连锁
   */
  private processChainLightning(
    currentEnemy: Enemy,
    currentDamage: number,
    effects: { type: string; value?: number; duration?: number }[],
    chainRemaining: number,
    chainRange: number,
    chainDecay: number,
    previousTargets: Set<string>
  ): void {
    if (chainRemaining <= 0) return;

    const nextTarget = this.findChainTarget(
      currentEnemy.x,
      currentEnemy.y,
      chainRange,
      previousTargets
    );

    if (!nextTarget) return;

    // 添加到已打击列表
    previousTargets.add(nextTarget.instanceId);

    // 创建闪电视觉效果
    this.createChainLightning(
      currentEnemy.x,
      currentEnemy.y,
      nextTarget.x,
      nextTarget.y
    );

    // 延迟打击下一个目标
    this.scene.time.delayedCall(80, () => {
      if (!nextTarget.active) return;

      const chainDamage = Math.floor(currentDamage * chainDecay);
      const killed = nextTarget.takeDamage(chainDamage);
      this.applyEffects(nextTarget, effects);

      // 触发生命偷取
      this.applyLifesteal(chainDamage);

      if (killed) {
        this.scene.events.emit('enemyKilled', nextTarget);
      }

      // 继续连锁
      this.processChainLightning(
        nextTarget,
        chainDamage,
        effects,
        chainRemaining - 1,
        chainRange,
        chainDecay,
        previousTargets
      );
    });
  }

  /**
   * 寻找连锁目标
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

      // 检查是否已经打击过
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
   * 创建连锁闪电视觉效果
   */
  private createChainLightning(x1: number, y1: number, x2: number, y2: number): void {
    const graphics = this.scene.add.graphics();
    graphics.setDepth(100);

    // 绘制主闪电
    graphics.lineStyle(4, 0xffff00, 1);
    this.drawLightningBolt(graphics, x1, y1, x2, y2);

    // 绘制发光效果
    graphics.lineStyle(8, 0xffff88, 0.5);
    this.drawLightningBolt(graphics, x1, y1, x2, y2);

    // 添加起点和终点的闪光
    const flash1 = this.scene.add.circle(x1, y1, 15, 0xffff88, 0.8);
    const flash2 = this.scene.add.circle(x2, y2, 15, 0xffff88, 0.8);
    flash1.setDepth(101);
    flash2.setDepth(101);

    // 淡出动画
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
   * 绘制锯齿状闪电
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
   * 应用技能效果到敌人
   */
  private applyEffects(enemy: Enemy, effects: { type: string; value?: number; duration?: number }[]): void {
    console.log(`[CollisionSystem] applyEffects called, effects count: ${effects.length}`);
    for (const effect of effects) {
      console.log(`[CollisionSystem] Processing effect: ${effect.type}, value: ${effect.value}, duration: ${effect.duration}`);
      if (effect.type === 'burn' && effect.value && effect.duration) {
        this.applyBurn(enemy, effect.value, effect.duration);
      } else if (effect.type === 'freeze' && effect.duration) {
        this.applyFreeze(enemy, effect.value || 0.3, effect.duration);
      } else if (effect.type === 'stun' && effect.duration) {
        this.applyStun(enemy, effect.duration);
      } else if (effect.type === 'poison' && effect.value && effect.duration) {
        this.applyPoison(enemy, effect.value, effect.duration);
      }
    }
  }

  /**
   * 灼烧效果 - 持续伤害
   */
  private applyBurn(enemy: Enemy, damagePerSec: number, duration: number): void {
    const tickDamage = damagePerSec;
    const ticks = Math.floor(duration / 1000);

    let ticksRemaining = ticks;
    const burnTimer = this.scene.time.addEvent({
      delay: 1000,
      callback: () => {
        if (enemy.active) {
          enemy.takeDamage(tickDamage);
        }
        ticksRemaining--;
        if (ticksRemaining <= 0) {
          burnTimer.destroy();
        }
      },
      repeat: ticks - 1,
    });
  }

  /**
   * 冰冻效果 - 减速
   */
  private applyFreeze(enemy: Enemy, slowAmount: number, duration: number): void {
    // 确保敌人和 config 存在
    if (!enemy || !enemy.config) {
      console.log(`[CollisionSystem] applyFreeze failed: enemy or config is null`);
      return;
    }

    console.log(`[CollisionSystem] applyFreeze: slowAmount=${slowAmount}, duration=${duration}, currentSpeed=${enemy.config.speed}`);

    const originalSpeed = enemy.config.speed;
    enemy.config.speed *= (1 - slowAmount);

    console.log(`[CollisionSystem] Speed reduced: ${originalSpeed} -> ${enemy.config.speed}`);

    // 视觉效果 - 变蓝
    enemy.setTint(0x88ddff);
    console.log(`[CollisionSystem] Tint set to blue, current tint: 0x${enemy.tintTopLeft.toString(16)}`);

    // 验证 tint 是否生效
    this.scene.time.delayedCall(100, () => {
      console.log(`[CollisionSystem] After 100ms, tint: 0x${enemy.tintTopLeft.toString(16)}, active: ${enemy.active}`);
    });

    this.scene.time.delayedCall(duration, () => {
      if (enemy.active && enemy.config) {
        enemy.config.speed = originalSpeed;
        enemy.clearTint();
        console.log(`[CollisionSystem] Freeze ended, speed restored to ${originalSpeed}`);
      }
    });
  }

  /**
   * 眩晕效果 - 完全停止
   */
  private applyStun(enemy: Enemy, duration: number): void {
    // 确保敌人和 config 存在
    if (!enemy || !enemy.config) return;

    console.log(`[CollisionSystem] applyStun: duration=${duration}`);

    const originalSpeed = enemy.config.speed;
    enemy.config.speed = 0;

    // 视觉效果 - 闪烁
    this.scene.tweens.add({
      targets: enemy,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: Math.floor(duration / 200),
      onComplete: () => {
        if (enemy.active && enemy.config) {
          enemy.config.speed = originalSpeed;
          enemy.setAlpha(1);
        }
      },
    });
  }

  /**
   * 毒效果 - 持续伤害 + 变绿
   */
  private applyPoison(enemy: Enemy, damagePerSec: number, duration: number): void {
    if (!enemy || !enemy.config) return;

    console.log(`[CollisionSystem] applyPoison: damagePerSec=${damagePerSec}, duration=${duration}`);

    const tickDamage = damagePerSec;
    const ticks = Math.floor(duration / 1000);

    // 视觉效果 - 变绿
    enemy.setTint(0x44ff44);

    let ticksRemaining = ticks;
    const poisonTimer = this.scene.time.addEvent({
      delay: 1000,
      callback: () => {
        if (enemy.active) {
          enemy.takeDamage(tickDamage);
        }
        ticksRemaining--;
        if (ticksRemaining <= 0) {
          poisonTimer.destroy();
          if (enemy.active) {
            enemy.clearTint();
          }
        }
      },
      repeat: ticks - 1,
    });
  }

  private handleEnemyHitPlayer(
    player: Phaser.GameObjects.GameObject,
    enemy: Phaser.GameObjects.GameObject
  ): void {
    const ply = player as Player;
    const enem = enemy as Enemy;

    if (!ply.active || !enem.active) return;

    // 计算实际距离，确保真正碰撞
    const distance = Phaser.Math.Distance.Between(ply.x, ply.y, enem.x, enem.y);
    const collisionDistance = 30; // 合理的碰撞距离

    if (distance > collisionDistance) return;

    // 敌人碰撞伤害
    ply.takeDamage(enem.config.damage);

    // 击退敌人
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

    // 短暂无敌后恢复追踪
    this.scene.time.delayedCall(300, () => {
      if (enem.active) {
        enem.setTarget(ply);
      }
    });
  }

  destroy(): void {
    // Phaser会自动清理overlap
  }
}
