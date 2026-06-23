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

    // 销毁投射物
    proj.destroy();

    // 如果击杀敌人，发出事件
    if (killed) {
      this.scene.events.emit('enemyKilled', enem);
    }
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
