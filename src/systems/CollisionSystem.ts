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

    if (!proj.active || !enem.active) return;

    // 记录此敌人已被打击
    if (proj.config.previousTargets) {
      proj.config.previousTargets.add(enem.instanceId);
    }

    // 造成伤害
    const damage = proj.getDamage();
    const killed = enem.takeDamage(damage);

    // 应用技能效果（冰冻、减速、灼烧等）
    const effects = proj.getEffects();
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

    // 销毁投射物
    proj.destroy();

    // 如果击杀敌人，发出事件
    if (killed) {
      this.scene.events.emit('enemyKilled', enem);
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
    for (const effect of effects) {
      if (effect.type === 'burn' && effect.value && effect.duration) {
        this.applyBurn(enemy, effect.value, effect.duration);
      } else if (effect.type === 'freeze' && effect.duration) {
        this.applyFreeze(enemy, effect.value || 0.3, effect.duration);
      } else if (effect.type === 'stun' && effect.duration) {
        this.applyStun(enemy, effect.duration);
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
    const originalSpeed = enemy.config.speed;
    enemy.config.speed *= (1 - slowAmount);

    // 视觉效果 - 变蓝
    enemy.setTint(0x88ddff);

    this.scene.time.delayedCall(duration, () => {
      if (enemy.active) {
        enemy.config.speed = originalSpeed;
        enemy.clearTint();
      }
    });
  }

  /**
   * 眩晕效果 - 完全停止
   */
  private applyStun(enemy: Enemy, duration: number): void {
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
        if (enemy.active) {
          enemy.config.speed = originalSpeed;
          enemy.setAlpha(1);
        }
      },
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
