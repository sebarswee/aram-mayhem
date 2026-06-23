import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { Enemy } from '@/entities/Enemy';
import { Projectile } from '@/entities/Projectile';
import { EnemySystem } from '@/systems/EnemySystem';
import { SkillSystem } from '@/systems/SkillSystem';

export class CollisionSystem {
  private scene: Phaser.Scene;
  private player: Player;
  private enemySystem: EnemySystem;
  private skillSystem: SkillSystem;

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

    // 造成伤害
    const damage = proj.getDamage();
    const killed = enem.takeDamage(damage);

    // 应用技能效果（冰冻、减速、灼烧等）
    const effects = proj.getEffects();
    this.applyEffects(enem, effects);

    // 销毁投射物
    proj.destroy();

    // 如果击杀敌人，发出事件
    if (killed) {
      this.scene.events.emit('enemyKilled', enem);
    }
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
