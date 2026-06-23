import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { Enemy } from '@/entities/Enemy';
import { Projectile, ProjectileConfig } from '@/entities/Projectile';
import { Skill } from '@/types';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/game.config';

// 元素颜色映射
const ELEMENT_COLORS: Record<string, number> = {
  fire: 0xff4400,
  ice: 0x44ccff,
  lightning: 0xffff00,
  physical: 0xffffff,
  shadow: 0x8800ff,
  holy: 0xffcc00,
};

export class SkillSystem {
  private scene: Phaser.Scene;
  private player: Player;
  private projectiles: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;

    // 创建投射物组
    this.projectiles = scene.physics.add.group({
      classType: Projectile,
      runChildUpdate: true,
    });
  }

  update(delta: number, enemies: Phaser.Physics.Arcade.Group): void {
    if (!this.player.active || enemies.countActive(true) === 0) return;

    // 更新技能冷却
    this.player.update(delta);

    // 检查每个技能是否可以释放
    for (const skill of this.player.skills) {
      const cooldown = this.player.skillCooldowns.get(skill.id) || 0;

      if (cooldown <= 0) {
        // 找到目标并释放
        const target = this.findTarget(skill, enemies);
        if (target) {
          this.castSkill(skill, target);
        }
      }
    }
  }

  private findTarget(
    skill: Skill,
    enemies: Phaser.Physics.Arcade.Group
  ): Enemy | null {
    const activeEnemies = enemies.getChildren().filter(
      (e) => (e as Enemy).active
    ) as Enemy[];

    if (activeEnemies.length === 0) return null;

    // 根据技能类型选择目标
    if (skill.categories.includes('area') && skill.range === 'melee') {
      return this.findNearestEnemy(activeEnemies);
    }

    if (skill.categories.includes('projectile')) {
      return this.findNearestEnemy(activeEnemies);
    }

    if (skill.type === 'ultimate') {
      return this.findDensestArea(activeEnemies);
    }

    return this.findNearestEnemy(activeEnemies);
  }

  private findNearestEnemy(enemies: Enemy[]): Enemy | null {
    let nearest: Enemy | null = null;
    let minDistance = Infinity;

    for (const enemy of enemies) {
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        enemy.x,
        enemy.y
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = enemy;
      }
    }

    return nearest;
  }

  private findDensestArea(enemies: Enemy[]): Enemy | null {
    if (enemies.length === 0) return null;

    let centerEnemy = enemies[0];
    let maxNearby = 0;

    for (const enemy of enemies) {
      const nearby = enemies.filter(
        (e) =>
          Phaser.Math.Distance.Between(enemy.x, enemy.y, e.x, e.y) < 150
      ).length;

      if (nearby > maxNearby) {
        maxNearby = nearby;
        centerEnemy = enemy;
      }
    }

    return centerEnemy;
  }

  private castSkill(skill: Skill, target: Enemy): void {
    this.player.skillCooldowns.set(skill.id, skill.cooldown);

    if (skill.categories.includes('projectile')) {
      this.castProjectile(skill, target);
    } else if (skill.categories.includes('area')) {
      this.castArea(skill);
    } else if (skill.categories.includes('dash')) {
      this.castDash(skill, target);
    }
  }

  private castProjectile(skill: Skill, target: Enemy): void {
    const angle = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      target.x,
      target.y
    );

    const color = ELEMENT_COLORS[skill.elements[0]] || 0xffffff;

    const config: ProjectileConfig = {
      skill,
      damage: skill.damage + this.player.stats.attack,
      speed: skill.speed || 300,
      range: skill.rangeValue,
      isFromPlayer: true,
      color,
    };

    const projectile = new Projectile(
      this.scene,
      this.player.x,
      this.player.y,
      config
    );

    projectile.fire(angle);
    this.projectiles.add(projectile);
  }

  private castArea(skill: Skill): void {
    const damage = skill.damage + this.player.stats.attack;

    const color = ELEMENT_COLORS[skill.elements[0]] || 0xffffff;
    this.drawAreaEffect(this.player.x, this.player.y, skill.rangeValue, color);

    // 对范围内敌人造成伤害
    const bodies = this.scene.physics.overlapCirc(
      this.player.x,
      this.player.y,
      skill.rangeValue
    ) as Phaser.Types.Physics.Arcade.ArcadeBodyType[];

    for (const body of bodies) {
      const enemy = body.gameObject as Enemy;
      if (enemy && enemy.active && enemy.takeDamage) {
        enemy.takeDamage(damage);
        this.applyEffects(enemy, skill.effects);
      }
    }
  }

  private castDash(skill: Skill, target: Enemy): void {
    const angle = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      target.x,
      target.y
    );

    const dashDistance = skill.rangeValue;
    const newX = this.player.x + Math.cos(angle) * dashDistance;
    const newY = this.player.y + Math.sin(angle) * dashDistance;

    const clampedX = Phaser.Math.Clamp(newX, 20, GAME_WIDTH - 20);
    const clampedY = Phaser.Math.Clamp(newY, 20, GAME_HEIGHT - 20);

    this.scene.tweens.add({
      targets: this.player,
      x: clampedX,
      y: clampedY,
      duration: 150,
      onComplete: () => {
        this.damageEnemiesInArea(clampedX, clampedY, skill.damage);
      },
    });
  }

  private damageEnemiesInArea(x: number, y: number, damage: number): void {
    const bodies = this.scene.physics.overlapCirc(x, y, 50) as Phaser.Types.Physics.Arcade.ArcadeBodyType[];
    for (const body of bodies) {
      const enemy = body.gameObject as Enemy;
      if (enemy && enemy.active && enemy.takeDamage) {
        enemy.takeDamage(damage);
      }
    }
  }

  private drawAreaEffect(x: number, y: number, radius: number, color: number): void {
    const circle = this.scene.add.circle(x, y, radius, color, 0.3);
    circle.setDepth(10);

    this.scene.tweens.add({
      targets: circle,
      alpha: 0,
      scale: 1.5,
      duration: 300,
      onComplete: () => circle.destroy(),
    });
  }

  private applyEffects(enemy: Enemy, effects: Skill['effects']): void {
    for (const effect of effects) {
      if (effect.type === 'burn') {
        this.applyBurn(enemy, effect.value, effect.duration || 3000);
      } else if (effect.type === 'freeze') {
        this.applyFreeze(enemy, effect.duration || 1000);
      }
    }
  }

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

  private applyFreeze(enemy: Enemy, duration: number): void {
    const originalSpeed = enemy.config.speed;
    enemy.config.speed *= 0.3;

    this.scene.time.delayedCall(duration, () => {
      if (enemy.active) {
        enemy.config.speed = originalSpeed;
      }
    });
  }

  getProjectiles(): Phaser.Physics.Arcade.Group {
    return this.projectiles;
  }

  destroy(): void {
    this.projectiles.destroy(true);
  }
}
