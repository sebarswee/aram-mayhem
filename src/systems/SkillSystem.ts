import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { Enemy } from '@/entities/Enemy';
import { Projectile, ProjectileConfig } from '@/entities/Projectile';
import { Skill } from '@/types';
import { SkillEffects } from '@/graphics/SkillEffects';

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
  private skillEffects: SkillEffects;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.skillEffects = new SkillEffects(scene);

    // 创建投射物组
    this.projectiles = scene.physics.add.group({
      classType: Projectile,
      runChildUpdate: true,
    });

    // 调试：确认 runChildUpdate 生效
    console.log(`[SkillSystem] Group runChildUpdate: ${(this.projectiles as any).runChildUpdate}`);
  }

  /**
   * 计算最终伤害（含暴击和技能加成）
   */
  private calculateDamage(baseDamage: number): { damage: number; isCrit: boolean } {
    // 技能伤害加成
    const skillBonus = this.player.stats.skillDamageBonus || 0;
    let damage = baseDamage * (1 + skillBonus);

    // 暴击判定
    const isCrit = Math.random() < (this.player.stats.critRate || 0.05);
    if (isCrit) {
      damage *= this.player.stats.critDamage || 1.5;
    }

    return { damage: Math.floor(damage), isCrit };
  }

  update(delta: number, enemies: Phaser.Physics.Arcade.Group): void {
    if (!this.player.active) return;

    const activeEnemyCount = enemies.countActive(true);
    if (activeEnemyCount === 0) {
      return;
    }

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

    // 检查连射强化
    const multicastCount = this.getMulticastCount(skill);

    for (let i = 0; i < multicastCount; i++) {
      this.scene.time.delayedCall(i * 100, () => {
        if (skill.categories.includes('projectile')) {
          this.castProjectile(skill, target);
        } else if (skill.categories.includes('area')) {
          this.castArea(skill);
        } else if (skill.categories.includes('summon')) {
          this.castSummon(skill);
        } else if (skill.categories.includes('buff')) {
          this.castBuff(skill);
        }
      });
    }
  }

  /**
   * 获取连射次数
   */
  private getMulticastCount(skill: Skill): number {
    let count = 1;
    for (const enhancement of skill.enhancements) {
      if (enhancement.type === 'multicast') {
        count = Math.max(count, enhancement.value);
      }
    }
    return count;
  }

  private castProjectile(skill: Skill, target: Enemy): void {
    const baseAngle = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      target.x,
      target.y
    );

    const color = ELEMENT_COLORS[skill.elements[0]] || 0xffffff;

    // 计算最终伤害（含技能加成和暴击）
    const baseDamage = skill.damage + this.player.stats.attack;
    const { damage } = this.calculateDamage(baseDamage);

    // 获取投射物数量强化
    const projectileCount = this.getProjectileCount(skill);
    const spreadAngle = 0.15; // 散射角度

    for (let i = 0; i < projectileCount; i++) {
      // 计算散射角度
      let angle = baseAngle;
      if (projectileCount > 1) {
        const offset = (i - (projectileCount - 1) / 2) * spreadAngle;
        angle = baseAngle + offset;
      }

      // 获取穿透次数
      const pierceCount = this.getPierceCount(skill);

      const config: ProjectileConfig = {
        skill,
        damage,
        speed: skill.speed || 300,
        range: skill.rangeValue,
        isFromPlayer: true,
        color,
        // 连锁属性
        chainRemaining: skill.chainCount || 0,
        chainRange: skill.chainRange || 150,
        chainDamageDecay: skill.chainDamageDecay || 0.8,
        previousTargets: new Set<string>(),
        // 穿透属性
        pierceCount,
        hitEnemies: new Set<string>(),
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
  }

  /**
   * 获取投射物数量
   */
  private getProjectileCount(skill: Skill): number {
    let count = skill.baseValues.projectileCount || 1;
    for (const enhancement of skill.enhancements) {
      if (enhancement.type === 'projectile_count') {
        count += enhancement.value;
      }
    }
    // 多重箭技能自带3支箭
    if (skill.id === 'multi_shot') {
      count = Math.max(count, 3);
    }
    return count;
  }

  /**
   * 获取穿透次数
   */
  private getPierceCount(skill: Skill): number {
    let count = 0;
    for (const enhancement of skill.enhancements) {
      if (enhancement.type === 'pierce') {
        count += enhancement.value;
      }
    }
    return count;
  }

  private castArea(skill: Skill): void {
    // 计算最终伤害（含技能加成和暴击）
    const baseDamage = skill.damage + this.player.stats.attack;
    const { damage } = this.calculateDamage(baseDamage);

    // 使用新的效果系统
    this.skillEffects.createAreaEffect(skill, this.player.x, this.player.y);

    // 根据技能类型处理伤害
    if (skill.id === 'blizzard') {
      // 暴风雪：持续伤害
      this.castBlizzard(skill, damage);
    } else if (skill.id === 'thunder_storm') {
      // 雷霆风暴：随机雷击
      this.castThunderStorm(skill, damage);
    } else if (skill.id === 'poison_cloud') {
      // 毒雾：持续伤害
      this.castPoisonCloud(skill, damage);
    } else if (skill.id === 'black_hole') {
      // 黑洞：持续伤害
      this.castBlackHole(skill, damage);
    } else if (skill.id === 'time_stop') {
      // 时间停止：范围眩晕
      this.castTimeStop(skill, damage);
    } else if (skill.id === 'holy_light') {
      // 神圣之光：伤害+治疗
      this.castHolyLight(skill, damage);
    } else if (skill.id === 'ground_spike') {
      // 地刺：伤害+击退
      this.castGroundSpike(skill, damage);
    } else {
      // 其他范围技能：立即造成伤害
      const bodies = this.scene.physics.overlapCirc(
        this.player.x,
        this.player.y,
        skill.rangeValue
      ) as Phaser.Physics.Arcade.Body[];

      for (const body of bodies) {
        const enemy = body.gameObject as Enemy;
        // 确保是敌人对象且拥有 config 属性
        if (enemy && enemy.active && enemy.config && enemy.takeDamage) {
          enemy.takeDamage(damage);
          this.applyEffects(enemy, skill.effects);
          // 触发生命偷取
          this.applyLifesteal(damage);
        }
      }
    }
  }

  /**
   * 释放召唤技能
   */
  private castSummon(skill: Skill): void {
    // 创建一个临时精灵跟随玩家攻击
    const spirit = this.scene.add.container(this.player.x, this.player.y);
    spirit.setDepth(45);

    // 精灵外观
    const body = this.scene.add.circle(0, 0, 15, 0xffcc00, 0.8);
    const glow = this.scene.add.circle(0, 0, 20, 0xffff00, 0.4);
    spirit.add([glow, body]);

    // 精灵攻击计时器
    const baseDamage = skill.damage + this.player.stats.attack;
    const { damage } = this.calculateDamage(baseDamage);

    let attackCount = 0;
    const maxAttacks = 5; // 攻击5次后消失

    const attackTimer = this.scene.time.addEvent({
      delay: 800, // 每0.8秒攻击一次
      callback: () => {
        attackCount++;
        if (attackCount > maxAttacks) {
          attackTimer.destroy();
          // 消失动画
          this.scene.tweens.add({
            targets: spirit,
            alpha: 0,
            scale: 0,
            duration: 200,
            onComplete: () => spirit.destroy(),
          });
          return;
        }

        // 寻找最近敌人攻击
        const enemies = this.scene.physics.overlapCirc(
          spirit.x,
          spirit.y,
          skill.rangeValue
        ) as Phaser.Physics.Arcade.Body[];

        for (const body of enemies) {
          const enemy = body.gameObject as Enemy;
          if (enemy && enemy.active && enemy.config && enemy.takeDamage) {
            enemy.takeDamage(damage);
            this.applyLifesteal(damage);

            // 攻击视觉效果
            const beam = this.scene.add.graphics();
            beam.lineStyle(2, 0xffff00, 0.8);
            beam.lineBetween(spirit.x, spirit.y, enemy.x, enemy.y);
            this.scene.time.delayedCall(100, () => beam.destroy());
            break; // 每次只攻击一个
          }
        }
      },
      repeat: maxAttacks,
    });

    // 精灵跟随玩家
    this.scene.tweens.add({
      targets: spirit,
      x: this.player.x,
      y: this.player.y,
      duration: 100,
      repeat: maxAttacks * 4,
      onUpdate: () => {
        spirit.x = this.player.x;
        spirit.y = this.player.y;
      },
    });
  }

  /**
   * 释放增益技能
   */
  private castBuff(skill: Skill): void {
    if (skill.id === 'shield') {
      // 获取护盾值
      const shieldEffect = skill.effects.find(e => e.type === 'shield');
      const shieldValue = shieldEffect?.value || 50;

      // 给玩家添加护盾
      this.player.addShield(shieldValue);

      // 护盾视觉效果
      const shield = this.scene.add.circle(this.player.x, this.player.y, 35, 0x66aaff, 0.3);
      shield.setStrokeStyle(2, 0x66aaff, 0.8);
      shield.setDepth(48);

      // 跟随玩家
      const followEvent = this.scene.time.addEvent({
        delay: 50,
        callback: () => {
          if (!this.player.active || !this.player.hasShield()) {
            followEvent.destroy();
            shield.destroy();
            return;
          }
          shield.setPosition(this.player.x, this.player.y);
        },
        repeat: -1,
      });
    }
  }

  /**
   * 释放黑洞 - 持续伤害和吸引
   */
  private castBlackHole(skill: Skill, damage: number): void {
    const centerX = this.player.x;
    const centerY = this.player.y;
    const radius = skill.rangeValue;
    const duration = 2000;
    const tickInterval = 300;
    let elapsed = 0;

    const damageTimer = this.scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          damageTimer.destroy();
          return;
        }

        const bodies = this.scene.physics.overlapCirc(
          centerX,
          centerY,
          radius
        ) as Phaser.Physics.Arcade.Body[];

        for (const body of bodies) {
          const enemy = body.gameObject as Enemy;
          if (enemy && enemy.active && enemy.config && enemy.takeDamage) {
            // 伤害
            const tickDamage = Math.floor(damage * 0.4);
            enemy.takeDamage(tickDamage);
            this.applyLifesteal(tickDamage);

            // 吸引效果 - 向中心移动
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, centerX, centerY);
            enemy.x += Math.cos(angle) * 20;
            enemy.y += Math.sin(angle) * 20;
          }
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }

  /**
   * 释放时间停止 - 范围眩晕
   */
  private castTimeStop(skill: Skill, damage: number): void {
    const bodies = this.scene.physics.overlapCirc(
      this.player.x,
      this.player.y,
      skill.rangeValue
    ) as Phaser.Physics.Arcade.Body[];

    for (const body of bodies) {
      const enemy = body.gameObject as Enemy;
      if (enemy && enemy.active && enemy.config && enemy.takeDamage) {
        enemy.takeDamage(damage);
        this.applyEffects(enemy, skill.effects);
        this.applyLifesteal(damage);
      }
    }
  }

  /**
   * 释放神圣之光 - 伤害+治疗
   */
  private castHolyLight(skill: Skill, damage: number): void {
    // 伤害敌人
    const bodies = this.scene.physics.overlapCirc(
      this.player.x,
      this.player.y,
      skill.rangeValue
    ) as Phaser.Physics.Arcade.Body[];

    for (const body of bodies) {
      const enemy = body.gameObject as Enemy;
      if (enemy && enemy.active && enemy.config && enemy.takeDamage) {
        enemy.takeDamage(damage);
        this.applyLifesteal(damage);
      }
    }

    // 治疗自己
    const healEffect = skill.effects.find(e => e.type === 'heal');
    if (healEffect) {
      this.player.heal(healEffect.value);
    }
  }

  /**
   * 释放地刺 - 伤害+击退
   */
  private castGroundSpike(skill: Skill, damage: number): void {
    const bodies = this.scene.physics.overlapCirc(
      this.player.x,
      this.player.y,
      skill.rangeValue
    ) as Phaser.Physics.Arcade.Body[];

    for (const body of bodies) {
      const enemy = body.gameObject as Enemy;
      if (enemy && enemy.active && enemy.config && enemy.takeDamage) {
        enemy.takeDamage(damage);
        this.applyLifesteal(damage);

        // 击退效果
        const angle = Phaser.Math.Angle.Between(
          this.player.x,
          this.player.y,
          enemy.x,
          enemy.y
        );
        enemy.x += Math.cos(angle) * 50;
        enemy.y += Math.sin(angle) * 50;
      }
    }
  }

  /**
   * 释放暴风雪 - 持续范围伤害
   */
  private castBlizzard(skill: Skill, damage: number): void {
    const centerX = this.player.x;
    const centerY = this.player.y;
    const radius = skill.rangeValue;
    const duration = 3000; // 3秒
    const tickInterval = 500; // 每0.5秒伤害一次
    let elapsed = 0;

    const damageTimer = this.scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          damageTimer.destroy();
          return;
        }

        // 检测范围内敌人
        const bodies = this.scene.physics.overlapCirc(
          centerX,
          centerY,
          radius
        ) as Phaser.Physics.Arcade.Body[];

        for (const body of bodies) {
          const enemy = body.gameObject as Enemy;
          if (enemy && enemy.active && enemy.config && enemy.takeDamage) {
            const tickDamage = Math.floor(damage * 0.3); // 每次造成30%伤害
            enemy.takeDamage(tickDamage);
            this.applyEffects(enemy, skill.effects);
            this.applyLifesteal(tickDamage);
          }
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }

  /**
   * 释放雷霆风暴 - 随机雷击
   */
  private castThunderStorm(skill: Skill, damage: number): void {
    const centerX = this.player.x;
    const centerY = this.player.y;
    const radius = skill.rangeValue;
    const strikeCount = 8;
    const strikeInterval = 300;
    let currentStrike = 0;

    const strikeTimer = this.scene.time.addEvent({
      delay: strikeInterval,
      callback: () => {
        currentStrike++;
        if (currentStrike > strikeCount) {
          strikeTimer.destroy();
          return;
        }

        // 随机位置雷击
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * radius * 0.8;
        const strikeX = centerX + Math.cos(angle) * dist;
        const strikeY = centerY + Math.sin(angle) * dist;

        // 检测雷击位置的敌人
        const bodies = this.scene.physics.overlapCirc(
          strikeX,
          strikeY,
          50 // 雷击半径
        ) as Phaser.Physics.Arcade.Body[];

        for (const body of bodies) {
          const enemy = body.gameObject as Enemy;
          if (enemy && enemy.active && enemy.config && enemy.takeDamage) {
            enemy.takeDamage(damage);
            this.applyEffects(enemy, skill.effects);
            this.applyLifesteal(damage);
          }
        }
      },
      repeat: strikeCount - 1,
    });
  }

  /**
   * 释放毒雾 - 持续伤害
   */
  private castPoisonCloud(skill: Skill, damage: number): void {
    const centerX = this.player.x;
    const centerY = this.player.y;
    const radius = skill.rangeValue;
    const duration = 3000; // 3秒
    const tickInterval = 500; // 每0.5秒伤害一次
    let elapsed = 0;

    const damageTimer = this.scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          damageTimer.destroy();
          return;
        }

        // 检测范围内敌人
        const bodies = this.scene.physics.overlapCirc(
          centerX,
          centerY,
          radius
        ) as Phaser.Physics.Arcade.Body[];

        for (const body of bodies) {
          const enemy = body.gameObject as Enemy;
          if (enemy && enemy.active && enemy.config && enemy.takeDamage) {
            const tickDamage = Math.floor(damage * 0.3); // 每次造成30%伤害
            enemy.takeDamage(tickDamage);
            // 中毒效果 - 变绿
            enemy.setTint(0x44ff44);
            this.applyLifesteal(tickDamage);
          }
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
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
    // 确保敌人和 config 存在
    if (!enemy || !enemy.config) return;

    const originalSpeed = enemy.config.speed;
    enemy.config.speed *= 0.3;

    this.scene.time.delayedCall(duration, () => {
      if (enemy.active && enemy.config) {
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
