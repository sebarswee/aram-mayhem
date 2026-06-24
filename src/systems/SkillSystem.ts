import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { Enemy, StatusEffect } from '@/entities/Enemy';
import { Projectile, ProjectileConfig } from '@/entities/Projectile';
import { Skill, Element, SynergyResult } from '@/types';
import { SkillEffects } from '@/graphics/SkillEffects';
import { ElementSystem } from '@/systems/ElementSystem';
import { getCounterBonus, ELEMENT_COLORS as DATA_ELEMENT_COLORS } from '@/data/elements';

// 元素颜色映射 (all 8 elements)
const ELEMENT_COLORS: Record<string, number> = {
  fire: 0xff4400,
  water: 0x4488ff,
  ice: 0x88ddff,
  lightning: 0xffff00,
  holy: 0xffcc00,
  shadow: 0x8800ff,
  grass: 0x44ff44,
  earth: 0xaa8844,
  physical: 0xffffff,
};

export class SkillSystem {
  private scene: Phaser.Scene;
  private player: Player;
  private projectiles: Phaser.Physics.Arcade.Group;
  private skillEffects: SkillEffects;
  private elementSystem: ElementSystem | null = null;

  // Event emitter for synergy effects (for UI feedback)
  private synergyEvents: Phaser.Events.EventEmitter = new Phaser.Events.EventEmitter();

  constructor(scene: Phaser.Scene, player: Player, elementSystem?: ElementSystem) {
    this.scene = scene;
    this.player = player;
    this.skillEffects = new SkillEffects(scene);
    this.elementSystem = elementSystem || null;

    // 创建投射物组
    this.projectiles = scene.physics.add.group({
      classType: Projectile,
      runChildUpdate: true,
    });
  }

  /**
   * Set the ElementSystem reference (can be set later if not available in constructor)
   */
  setElementSystem(elementSystem: ElementSystem | null): void {
    this.elementSystem = elementSystem;
  }

  /**
   * Get the synergy event emitter for UI feedback
   */
  getSynergyEvents(): Phaser.Events.EventEmitter {
    return this.synergyEvents;
  }

  /**
   * 计算最终伤害（含暴击和技能加成）
   * Note: Counter bonus is applied separately in applyDamageToEnemy()
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

  /**
   * Apply damage to enemy with element system integration
   * Handles: counter bonus, element marks, and synergy triggers
   */
  private applyDamageToEnemy(
    enemy: Enemy,
    damage: number,
    skill: Skill,
    isCrit: boolean = false
  ): void {
    const skillElement = skill.elements[0] || skill.element;

    // Apply damage with element for counter bonus
    // Enemy.takeDamage() handles counter bonus calculation and visual feedback
    enemy.takeDamage(damage, skillElement);

    // Apply element mark and check for synergy
    if (this.elementSystem && skillElement) {
      const synergyResult = this.elementSystem.checkSynergy(
        enemy.instanceId,
        skillElement,
        skill.id
      );

      if (synergyResult) {
        this.applySynergyEffect(enemy, synergyResult, damage);
      }
    }

    // Apply status effects from skill
    this.applyEffects(enemy, skill.effects);

    // Trigger lifesteal
    this.applyLifesteal(damage);
  }

  /**
   * Apply synergy effect to enemy
   */
  private applySynergyEffect(enemy: Enemy, synergy: SynergyResult, baseDamage: number): void {
    // Emit event for UI feedback
    this.synergyEvents.emit('synergy_triggered', {
      synergy,
      enemyId: enemy.instanceId,
      enemyPosition: { x: enemy.x, y: enemy.y },
    });

    console.log(`[SkillSystem] Synergy triggered: ${synergy.name} (${synergy.effect})`);

    switch (synergy.effect) {
      case 'true_damage_percent':
        // True damage as percentage of base damage
        const trueDamage = Math.floor(baseDamage * (synergy.value || 0.2));
        enemy.takeDamage(trueDamage);
        break;

      case 'freeze':
        enemy.addStatusEffect({
          type: 'freeze',
          value: 0,
          duration: synergy.duration || 3000,
          remainingTime: synergy.duration || 3000,
          source: 'synergy',
        });
        break;

      case 'stun':
        enemy.addStatusEffect({
          type: 'stun',
          value: 0,
          duration: synergy.duration || 1500,
          remainingTime: synergy.duration || 1500,
          source: 'synergy',
        });
        break;

      case 'slow':
        enemy.addStatusEffect({
          type: 'slow',
          value: synergy.value || 0.3,
          duration: synergy.duration || 3000,
          remainingTime: synergy.duration || 3000,
          source: 'synergy',
        });
        break;

      case 'root':
        enemy.addStatusEffect({
          type: 'root',
          value: 0,
          duration: synergy.duration || 2000,
          remainingTime: synergy.duration || 2000,
          source: 'synergy',
        });
        break;

      case 'double_damage':
        // Apply additional damage equal to base damage
        enemy.takeDamage(baseDamage);
        break;

      case 'explosion':
        // Area damage around enemy (simplified - just extra damage for now)
        const explosionDamage = Math.floor(baseDamage * (synergy.value || 1.0));
        enemy.takeDamage(explosionDamage);
        // Could expand to hit nearby enemies
        break;

      case 'lifesteal':
        // Heal player
        const healAmount = Math.floor(baseDamage * (synergy.value || 0.3));
        this.player.heal(healAmount);
        break;

      case 'guaranteed_crit':
        // Extra damage as guaranteed crit bonus
        const critBonus = Math.floor(baseDamage * (synergy.value || 0.5));
        enemy.takeDamage(critBonus);
        break;

      // Default cases - log for debugging
      case 'chain_boost':
      case 'spread_debuff':
      case 'dispel_and_damage':
      case 'damage_increase':
      case 'burn_spread':
      case 'lava_zone':
      case 'damage_to_shield':
      case 'damage_boost_no_heal':
      case 'cooldown_refresh':
      case 'knockup':
      case 'refract_damage':
      case 'death_explosion':
      case 'tick_speed_double':
      case 'split_3':
      case 'defense_reduce':
      case 'heal_zone':
      case 'barrier':
      case 'true_damage_confuse':
        console.log(`[SkillSystem] Synergy effect '${synergy.effect}' not yet implemented`);
        break;

      default:
        console.log(`[SkillSystem] Unknown synergy effect: ${synergy.effect}`);
    }
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
    // Note: Ultimate skills are NOT auto-cast; they must be triggered via useUltimate()
    for (const skill of this.player.skills) {
      // Skip ultimate skills for auto-cast
      if (skill.type === 'ultimate') {
        continue;
      }

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

  /**
   * Manually cast an ultimate skill by skill ID
   * Returns true if the skill was cast successfully, false otherwise
   * @param skillId The ID of the ultimate skill to cast
   * @param enemies The enemy group to target (required for finding targets)
   */
  useUltimate(skillId: string, enemies: Phaser.Physics.Arcade.Group): boolean {
    if (!this.player.active) return false;

    // Find the skill
    const skill = this.player.skills.find(s => s.id === skillId);
    if (!skill) {
      console.warn(`[SkillSystem] Skill not found: ${skillId}`);
      return false;
    }

    // Verify it's an ultimate
    if (skill.type !== 'ultimate') {
      console.warn(`[SkillSystem] Skill ${skillId} is not an ultimate skill`);
      return false;
    }

    // Check cooldown
    const cooldown = this.player.skillCooldowns.get(skill.id) || 0;
    if (cooldown > 0) {
      console.log(`[SkillSystem] Ultimate ${skillId} is on cooldown: ${cooldown}ms`);
      return false;
    }

    // Find target for ultimate
    const target = this.findTarget(skill, enemies);

    if (!target) {
      console.log(`[SkillSystem] No valid target for ultimate`);
      return false;
    }

    // Cast the ultimate
    this.castSkill(skill, target);
    console.log(`[SkillSystem] Ultimate ${skill.name} cast!`);
    return true;
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

      // 先添加到组，再设置速度（避免被重置）
      this.projectiles.add(projectile);
      projectile.fire(angle);
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
        if (enemy && enemy.active && enemy.config) {
          this.applyDamageToEnemy(enemy, damage, skill);
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
          if (enemy && enemy.active && enemy.config) {
            this.applyDamageToEnemy(enemy, damage, skill);

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
          if (enemy && enemy.active && enemy.config) {
            // 伤害
            const tickDamage = Math.floor(damage * 0.4);
            // Apply with element for counter bonus
            const skillElement = skill.elements[0] || skill.element;
            enemy.takeDamage(tickDamage, skillElement);
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
      if (enemy && enemy.active && enemy.config) {
        this.applyDamageToEnemy(enemy, damage, skill);
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
      if (enemy && enemy.active && enemy.config) {
        this.applyDamageToEnemy(enemy, damage, skill);
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
      if (enemy && enemy.active && enemy.config) {
        this.applyDamageToEnemy(enemy, damage, skill);

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
          if (enemy && enemy.active && enemy.config) {
            const tickDamage = Math.floor(damage * 0.3); // 每次造成30%伤害
            // Apply with element for counter bonus
            const skillElement = skill.elements[0] || skill.element;
            enemy.takeDamage(tickDamage, skillElement);
            // Apply freeze effect from skill
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
          if (enemy && enemy.active && enemy.config) {
            this.applyDamageToEnemy(enemy, damage, skill);
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
          if (enemy && enemy.active && enemy.config) {
            const tickDamage = Math.floor(damage * 0.3); // 每次造成30%伤害
            // Apply with element for counter bonus
            const skillElement = skill.elements[0] || skill.element;
            enemy.takeDamage(tickDamage, skillElement);
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

  /**
   * Apply skill effects to enemy using enemy's addStatusEffect method
   */
  private applyEffects(enemy: Enemy, effects: Skill['effects']): void {
    for (const effect of effects) {
      // Convert skill effect to status effect
      const statusEffect: StatusEffect = {
        type: effect.type as StatusEffect['type'],
        value: effect.value,
        duration: effect.duration || 3000,
        remainingTime: effect.duration || 3000,
        source: 'skill',
      };

      switch (effect.type) {
        case 'burn':
          enemy.addStatusEffect({
            type: 'burn',
            value: effect.value,
            duration: effect.duration || 3000,
            remainingTime: effect.duration || 3000,
            source: 'skill',
          });
          break;

        case 'freeze':
          enemy.addStatusEffect({
            type: 'freeze',
            value: 0,
            duration: effect.duration || 1000,
            remainingTime: effect.duration || 1000,
            source: 'skill',
          });
          break;

        case 'stun':
          enemy.addStatusEffect({
            type: 'stun',
            value: 0,
            duration: effect.duration || 1000,
            remainingTime: effect.duration || 1000,
            source: 'skill',
          });
          break;

        case 'poison':
          enemy.addStatusEffect({
            type: 'poison',
            value: effect.value,
            duration: effect.duration || 3000,
            remainingTime: effect.duration || 3000,
            source: 'skill',
          });
          break;

        case 'slow':
          enemy.addStatusEffect({
            type: 'slow',
            value: effect.value, // value is the slow percentage (e.g., 0.3 = 30% slow)
            duration: effect.duration || 2000,
            remainingTime: effect.duration || 2000,
            source: 'skill',
          });
          break;

        default:
          // Other effects like heal, shield, knockback are handled separately
          break;
      }
    }
  }

  // Legacy methods removed - status effects now handled via enemy.addStatusEffect()

  getProjectiles(): Phaser.Physics.Arcade.Group {
    return this.projectiles;
  }

  destroy(): void {
    this.projectiles.destroy(true);
  }
}
