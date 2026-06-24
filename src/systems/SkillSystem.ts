import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { Enemy, StatusEffect } from '@/entities/Enemy';
import { Projectile, ProjectileConfig } from '@/entities/Projectile';
import { Skill, Element, SynergyResult } from '@/types';
import { SkillEffects } from '@/graphics/SkillEffects';
import { ElementSystem } from '@/systems/ElementSystem';
import { specialBehaviorRegistry } from '@/systems/SpecialBehaviorRegistry';
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
    enemy.takeDamage(damage, skillElement, isCrit);

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
        // True area explosion - damage all enemies in radius
        const explosionRadius = 120;
        const explosionBaseDamage = Math.floor(baseDamage * (synergy.value || 1.0));
        const explosionEnemies = this.findEnemiesInRange(enemy.x, enemy.y, explosionRadius);
        for (const target of explosionEnemies) {
          const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, target.x, target.y);
          // Damage falloff based on distance
          const falloff = 1 - (distance / explosionRadius) * 0.5;
          target.takeDamage(Math.floor(explosionBaseDamage * falloff));
        }
        // Visual explosion effect
        this.createExplosionVisual(enemy.x, enemy.y, explosionRadius);
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

      // Default cases - implement remaining synergy effects
      case 'chain_boost':
        // Enhanced chain lightning - actually chain to nearby enemies
        const chainBoostDamage = Math.floor(baseDamage * (synergy.value || 1.5));
        enemy.takeDamage(chainBoostDamage);
        // Chain to nearby enemies
        this.triggerChainLightning(enemy.x, enemy.y, chainBoostDamage * 0.8, 3, 150);
        break;

      case 'spread_debuff':
        // Spread existing status effects to nearby enemies
        this.spreadDebuffToNearby(enemy);
        break;

      case 'dispel_and_damage':
        // Remove enemy buffs and deal damage
        enemy.statusEffects = []; // Clear all status effects
        enemy.takeDamage(Math.floor(baseDamage * 0.5));
        break;

      case 'damage_increase':
        // Give player a temporary damage buff
        const damageBuffValue = synergy.value || 0.3;
        const damageBuffDuration = synergy.duration || 5000;
        this.player.addStatusEffect({
          type: 'attack_boost',
          value: damageBuffValue,
          duration: damageBuffDuration,
        });
        // Also deal immediate damage
        enemy.takeDamage(baseDamage);
        break;

      case 'burn_spread':
        // Spread burn to nearby enemies
        const nearbyEnemies = this.findEnemiesInRange(enemy.x, enemy.y, 100);
        for (const nearby of nearbyEnemies) {
          if (nearby !== enemy) {
            nearby.addStatusEffect({
              type: 'burn',
              value: 5,
              duration: 3000,
              remainingTime: 3000,
              source: 'synergy_burn_spread',
            });
          }
        }
        break;

      case 'lava_zone':
        // Create lava zone at enemy position
        this.createLavaZone(enemy.x, enemy.y, 100, baseDamage * 0.1, 3000);
        break;

      case 'damage_to_shield':
        // Convert damage to player shield
        const shieldValue = Math.floor(baseDamage * (synergy.value || 0.5));
        this.player.addShield(shieldValue);
        break;

      case 'damage_boost_no_heal':
        // Extra damage but prevent healing
        const boostedDamage = Math.floor(baseDamage * (1 + (synergy.value || 0.5)));
        enemy.takeDamage(boostedDamage);
        // Mark enemy as no-heal for duration (simplified: just deal damage)
        break;

      case 'cooldown_refresh':
        // Refresh skill cooldown
        // Simplified: reduce all cooldowns by 50%
        this.player.skillCooldowns.forEach((cooldown, skillId) => {
          this.player.skillCooldowns.set(skillId, Math.floor(cooldown * 0.5));
        });
        break;

      case 'knockup':
        // Knock enemy up (stun with visual)
        enemy.addStatusEffect({
          type: 'stun',
          value: 0,
          duration: 1000,
          remainingTime: 1000,
          source: 'synergy_knockup',
        });
        // Visual knockup
        this.scene.tweens.add({
          targets: enemy,
          y: enemy.y - 30,
          duration: 200,
          yoyo: true,
          ease: 'Power2',
        });
        break;

      case 'refract_damage':
        // Refract damage to multiple nearby enemies
        const refractDamage = Math.floor(baseDamage * 0.5);
        const refractRadius = 150;
        const refractTargets = this.findEnemiesInRange(enemy.x, enemy.y, refractRadius);
        const refractMaxTargets = 5;
        let refractedCount = 0;
        for (const target of refractTargets) {
          if (target !== enemy && refractedCount < refractMaxTargets) {
            target.takeDamage(refractDamage);
            // Create refract beam visual
            this.createRefractBeam(enemy.x, enemy.y, target.x, target.y);
            refractedCount++;
          }
        }
        break;

      case 'death_explosion':
        // Mark enemy to explode on death with bonus damage
        // Store explosion params on enemy for later trigger
        if (!enemy.deathExplosionParams) {
          enemy.deathExplosionParams = {
            damage: Math.floor(baseDamage * 2),
            radius: 100,
          };
          // Visual indicator
          const indicator = this.scene.add.circle(enemy.x, enemy.y, 15, 0xff0000, 0.4);
          indicator.setDepth(31);
          // Follow enemy
          const followEvent = this.scene.time.addEvent({
            delay: 50,
            callback: () => {
              if (!enemy.active) {
                followEvent.destroy();
                indicator.destroy();
                return;
              }
              indicator.setPosition(enemy.x, enemy.y);
            },
            repeat: -1,
          });
        }
        break;

      case 'tick_speed_double':
        // Double the tick speed of all DoT effects on enemy
        // Add tick_speed_up status effect which doubles tick rate
        enemy.addStatusEffect({
          type: 'tick_speed_up',
          value: 2.0,
          duration: synergy.duration || 5000,
          remainingTime: synergy.duration || 5000,
          source: 'synergy_tick_speed_double',
        });
        // Visual feedback - cyan pulse
        const cyanFlash = this.scene.add.circle(enemy.x, enemy.y, 20, 0x00ffff, 0.6);
        cyanFlash.setDepth(100);
        this.scene.tweens.add({
          targets: cyanFlash,
          alpha: 0,
          scale: 1.5,
          duration: 300,
          onComplete: () => cyanFlash.destroy(),
        });
        break;

      case 'split_3':
        // Create 3 split projectiles from impact point
        this.createSplitProjectilesAt(enemy.x, enemy.y, 3, baseDamage * 0.3);
        break;

      case 'defense_reduce':
        // Reduce enemy defense - make them take more damage from subsequent attacks
        enemy.addStatusEffect({
          type: 'defense_break',
          value: synergy.value || 0.5, // 50% more damage taken
          duration: synergy.duration || 5000,
          remainingTime: synergy.duration || 5000,
          source: 'synergy_defense_reduce',
        });
        // Immediate damage
        enemy.takeDamage(baseDamage);
        break;

      case 'heal_zone':
        // Create healing zone at enemy position
        this.createHealZone(enemy.x, enemy.y, 100, synergy.value || 5, synergy.duration || 5000);
        break;

      case 'barrier':
        // Create barrier around player
        this.player.addShield(50);
        // Visual barrier effect
        const barrier = this.scene.add.circle(this.player.x, this.player.y, 40, 0x66aaff, 0.3);
        barrier.setStrokeStyle(2, 0x66aaff, 0.8);
        barrier.setDepth(48);
        this.scene.tweens.add({
          targets: barrier,
          alpha: 0,
          scale: 1.5,
          duration: synergy.duration || 3000,
          onComplete: () => barrier.destroy(),
        });
        break;

      case 'true_damage_confuse':
        // True damage + confusion (stun)
        const confuseDamage = Math.floor(baseDamage * 0.3);
        enemy.takeDamage(confuseDamage);
        enemy.addStatusEffect({
          type: 'stun',
          value: 0,
          duration: synergy.duration || 2000,
          remainingTime: synergy.duration || 2000,
          source: 'synergy_confuse',
        });
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

    // 检查每个基础技能是否可以释放（大招需要手动触发）
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

  /**
   * Manually cast an ultimate skill by index (0 or 1)
   * Returns true if the skill was cast successfully, false otherwise
   */
  useUltimateByIndex(index: number, enemies: Phaser.Physics.Arcade.Group): boolean {
    if (!this.player.active) return false;

    const ultimate = this.player.ultimateSkills[index];
    if (!ultimate) {
      console.warn(`[SkillSystem] No ultimate skill at index ${index}`);
      return false;
    }

    // Check cooldown
    const cooldown = this.player.skillCooldowns.get(ultimate.id) || 0;
    if (cooldown > 0) {
      console.log(`[SkillSystem] Ultimate ${ultimate.id} is on cooldown: ${cooldown}ms`);
      return false;
    }

    // Find target for ultimate
    const target = this.findTarget(ultimate, enemies);

    if (!target) {
      console.log(`[SkillSystem] No valid target for ultimate`);
      return false;
    }

    // Cast the ultimate
    this.castSkill(ultimate, target);
    console.log(`[SkillSystem] Ultimate ${ultimate.name} cast!`);
    return true;
  }

  /**
   * Manually cast an ultimate skill by skill ID
   * Returns true if the skill was cast successfully, false otherwise
   * @param skillId The ID of the ultimate skill to cast
   * @param enemies The enemy group to target (required for finding targets)
   */
  useUltimate(skillId: string, enemies: Phaser.Physics.Arcade.Group): boolean {
    if (!this.player.active) return false;

    // Find the skill in ultimate skills array
    const skill = this.player.ultimateSkills.find(s => s.id === skillId);
    if (!skill) {
      console.warn(`[SkillSystem] Ultimate skill not found: ${skillId}`);
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

    // 检查特殊行为中的连发数量（支持 multicast 和 rapid_fire）
    const rapidFireValue = specialBehaviorRegistry.getBehaviorValue(skill, 'rapid_fire');
    const multicastValue = specialBehaviorRegistry.getBehaviorValue(skill, 'multicast');
    const rapidFireCount = Math.max(rapidFireValue || 1, multicastValue || 1);

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

      // 应用特殊行为到投射物配置
      specialBehaviorRegistry.applyToConfig(skill, config);

      // 处理瞬发行为
      if (config.isInstant) {
        config.instantHitTarget = { x: target.x, y: target.y };
        config.speed = 9999; // 极速到达
      }

      const projectile = new Projectile(
        this.scene,
        this.player.x,
        this.player.y,
        config
      );

      // 先添加到组，再设置速度（避免被重置）
      this.projectiles.add(projectile);
      projectile.fire(angle);

      // 连发处理 - 延迟发射额外投射物
      if (rapidFireCount > 1) {
        for (let j = 1; j < rapidFireCount; j++) {
          this.scene.time.delayedCall(j * 80, () => {
            const rapidProjectile = new Projectile(
              this.scene,
              this.player.x,
              this.player.y,
              config
            );
            this.projectiles.add(rapidProjectile);
            rapidProjectile.fire(angle);
          });
        }
      }
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
    } else if (skill.id === 'dragon_breath') {
      // 炎龙吐息：扇形持续火焰
      this.castDragonBreath(skill, damage);
    } else if (skill.id === 'inferno') {
      // 烈焰风暴：持续燃烧区域
      this.castInferno(skill, damage);
    } else if (skill.id === 'abyss_vortex') {
      // 深渊漩涡：持续吸引
      this.castAbyssVortex(skill, damage);
    } else if (skill.id === 'frozen_domain') {
      // 冰封领域：持续冻结
      this.castFrozenDomain(skill, damage);
    } else if (skill.id === 'absolute_zero') {
      // 绝对零度：秒杀低血量
      this.castAbsoluteZero(skill, damage);
    } else if (skill.id === 'thunder_apocalypse') {
      // 雷霆万钧：全屏连锁雷击
      this.castThunderApocalypse(skill, damage);
    } else if (skill.id === 'judgment_light') {
      // 审判之光：伤害+治疗
      this.castJudgmentLight(skill, damage);
    } else if (skill.id === 'shadow_descent') {
      // 暗影降临：降防+持续伤害
      this.castShadowDescent(skill, damage);
    } else if (skill.id === 'death_decay') {
      // 死亡凋零：持续吸血
      this.castDeathDecay(skill, damage);
    } else if (skill.id === 'mountain_collapse') {
      // 山崩地裂：范围伤害+击飞
      this.castMountainCollapse(skill, damage);
    } else if (skill.id === 'meteor') {
      // 陨石坠落：大范围爆炸
      this.castMeteor(skill, damage);
    } else if (skill.id === 'tsunami') {
      // 海啸：全屏推开
      this.castTsunami(skill, damage);
    } else if (skill.id === 'earthquake') {
      // 大地震击：全屏眩晕
      this.castEarthquake(skill, damage);
    } else if (skill.id === 'overgrowth') {
      // 过度生长：全屏缠绕
      this.castOvergrowth(skill, damage);
    } else if (skill.id === 'void_rift') {
      // 虚空裂隙：持续吸引+伤害
      this.castVoidRift(skill, damage);
    } else {
      // 其他范围技能：立即造成伤害
      const bodies = this.scene.physics.overlapCirc(
        this.player.x,
        this.player.y,
        skill.rangeValue
      ) as Phaser.Physics.Arcade.Body[];

      for (const body of bodies) {
        const obj = body.gameObject;
        // Ensure it's actually an Enemy instance (not player, orb, food, etc.)
        if (obj && obj instanceof Enemy && obj.active) {
          this.applyDamageToEnemy(obj, damage, skill);
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
          const obj = body.gameObject;
          if (obj && obj instanceof Enemy && obj.active) {
            this.applyDamageToEnemy(obj, damage, skill);

            // 攻击视觉效果
            const beam = this.scene.add.graphics();
            beam.lineStyle(2, 0xffff00, 0.8);
            beam.lineBetween(spirit.x, spirit.y, obj.x, obj.y);
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
    // 处理护盾效果
    const shieldEffect = skill.effects.find(e => e.type === 'shield');
    if (shieldEffect) {
      const shieldBoost = (this.player.stats as any).shieldBoost || 0;
      const shieldValue = Math.floor(shieldEffect.value * (1 + shieldBoost));
      this.player.addShield(shieldValue);

      // 护盾视觉效果
      const color = ELEMENT_COLORS[skill.elements[0]] || 0x66aaff;
      const shield = this.scene.add.circle(this.player.x, this.player.y, 35, color, 0.3);
      shield.setStrokeStyle(2, color, 0.8);
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

    // 处理治疗效果
    const healEffect = skill.effects.find(e => e.type === 'heal');
    if (healEffect) {
      this.player.heal(healEffect.value);
      // 治疗视觉效果
      const healEffect_visual = this.scene.add.circle(this.player.x, this.player.y, 30, 0x44ff44, 0.5);
      healEffect_visual.setDepth(100);
      this.scene.tweens.add({
        targets: healEffect_visual,
        alpha: 0,
        scale: 1.5,
        duration: 500,
        onComplete: () => healEffect_visual.destroy(),
      });
    }

    // 处理反弹效果
    const reflectEffect = skill.effects.find(e => e.type === 'damage_reflect');
    if (reflectEffect) {
      this.player.addReflectEffect({
        value: reflectEffect.value,
        duration: reflectEffect.duration || 8000,
      });
    }

    // 特殊技能效果
    if (skill.id === 'purify') {
      // 净化：清除负面状态
      this.player.clearDebuffs();
    }

    if (skill.id === 'halo') {
      // 光环：持续治疗
      this.createHaloEffect(skill);
    }

    if (skill.id === 'blessing') {
      // 祝福：提升攻击力和暴击
      this.player.addStatusEffect({
        type: 'attack_boost',
        value: 0.3,
        duration: 10000,
      });
    }

    if (skill.id === 'sanctuary') {
      // 圣域：无敌+持续治疗
      this.player.isInvincible = true;
      this.scene.time.delayedCall(3000, () => {
        this.player.isInvincible = false;
      });
      this.createHaloEffect(skill);
    }

    if (skill.id === 'earth_guardian') {
      // 大地守护：巨大护盾
      const guardian = this.scene.add.circle(this.player.x, this.player.y, 50, 0xaa8844, 0.4);
      guardian.setStrokeStyle(3, 0xaa8844, 0.9);
      guardian.setDepth(48);
      this.scene.tweens.add({
        targets: guardian,
        alpha: 0,
        scale: 1.5,
        duration: 2000,
        onComplete: () => guardian.destroy(),
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
          const obj = body.gameObject;
          if (obj && obj instanceof Enemy && obj.active) {
            // 伤害
            const tickDamage = Math.floor(damage * 0.4);
            // Apply with element for counter bonus
            const skillElement = skill.elements[0] || skill.element;
            obj.takeDamage(tickDamage, skillElement);
            this.applyLifesteal(tickDamage);

            // 吸引效果 - 向中心移动
            const angle = Phaser.Math.Angle.Between(obj.x, obj.y, centerX, centerY);
            obj.x += Math.cos(angle) * 20;
            obj.y += Math.sin(angle) * 20;
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
      const obj = body.gameObject;
      if (obj && obj instanceof Enemy && obj.active) {
        this.applyDamageToEnemy(obj, damage, skill);
      }
    }
  }

  /**
   * 释放神圣之光 - 伤害+治疗（带能量流动）
   */
  private castHolyLight(skill: Skill, damage: number): void {
    const healEffect = skill.effects.find(e => e.type === 'heal');
    const healValue = healEffect?.value || 10;
    let totalHeal = 0;

    // 伤害敌人
    const bodies = this.scene.physics.overlapCirc(
      this.player.x,
      this.player.y,
      skill.rangeValue
    ) as Phaser.Physics.Arcade.Body[];

    for (const body of bodies) {
      const obj = body.gameObject;
      if (obj && obj instanceof Enemy && obj.active) {
        this.applyDamageToEnemy(obj, damage, skill);
        totalHeal += healValue;

        // 创建能量流动效果（从敌人到玩家）
        this.createEnergyTransferEffect(obj.x, obj.y, this.player.x, this.player.y, 0xffcc00);
      }
    }

    // 延迟治疗（等待能量流动动画）
    if (totalHeal > 0) {
      this.scene.time.delayedCall(300, () => {
        this.player.heal(totalHeal);
        // 治疗到达时的闪光效果
        const healFlash = this.scene.add.circle(this.player.x, this.player.y, 30, 0x66ff66, 0.6);
        healFlash.setDepth(100);
        this.scene.tweens.add({
          targets: healFlash,
          alpha: 0,
          scale: 1.5,
          duration: 300,
          onComplete: () => healFlash.destroy(),
        });
      });
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
      const obj = body.gameObject;
      if (obj && obj instanceof Enemy && obj.active) {
        this.applyDamageToEnemy(obj, damage, skill);

        // 击退效果
        const angle = Phaser.Math.Angle.Between(
          this.player.x,
          this.player.y,
          obj.x,
          obj.y
        );
        obj.x += Math.cos(angle) * 50;
        obj.y += Math.sin(angle) * 50;
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
          const obj = body.gameObject;
          if (obj && obj instanceof Enemy && obj.active) {
            const tickDamage = Math.floor(damage * 0.3); // 每次造成30%伤害
            // Apply with element for counter bonus
            const skillElement = skill.elements[0] || skill.element;
            obj.takeDamage(tickDamage, skillElement);
            // Apply freeze effect from skill
            this.applyEffects(obj, skill.effects);
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
          const obj = body.gameObject;
          if (obj && obj instanceof Enemy && obj.active) {
            this.applyDamageToEnemy(obj, damage, skill);
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
          const obj = body.gameObject;
          if (obj && obj instanceof Enemy && obj.active) {
            const tickDamage = Math.floor(damage * 0.3); // 每次造成30%伤害
            // Apply with element for counter bonus
            const skillElement = skill.elements[0] || skill.element;
            obj.takeDamage(tickDamage, skillElement);
            // 中毒效果 - 变绿
            obj.setTint(0x44ff44);
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

        case 'knockback':
          // 击退效果 - 立即生效
          const player = this.player;
          const angle = Phaser.Math.Angle.Between(
            player.x,
            player.y,
            enemy.x,
            enemy.y
          );
          const knockbackDistance = effect.value || 100;
          enemy.x += Math.cos(angle) * knockbackDistance;
          enemy.y += Math.sin(angle) * knockbackDistance;
          break;

        case 'damage':
          // damage 效果已在投射物命中或范围技能中处理，这里不需要额外处理
          break;

        case 'heal':
          // 治疗效果 - 恢复玩家生命
          this.player.heal(effect.value || 10);
          break;

        case 'shield':
          // 护盾效果 - 给玩家添加护盾
          this.player.addShield(effect.value || 50);
          break;

        case 'defense_break':
          // 降低敌人防御 - 使其受到更多伤害
          enemy.addStatusEffect({
            type: 'defense_break',
            value: effect.value || 0.3, // 30%额外伤害
            duration: effect.duration || 5000,
            remainingTime: effect.duration || 5000,
            source: 'skill',
          });
          break;

        case 'damage_reflect':
          // 反弹伤害 - 给玩家添加反弹状态
          this.player.addReflectEffect({
            value: effect.value || 0.3, // 反弹30%伤害
            duration: effect.duration || 8000,
          });
          break;

        default:
          // 其他效果暂不处理
          console.warn(`[SkillSystem] Unknown effect type: ${effect.type}`);
          break;
      }
    }
  }

  // Legacy methods removed - status effects now handled via enemy.addStatusEffect()

  /**
   * Find enemies within range of a point
   */
  private findEnemiesInRange(x: number, y: number, range: number): Enemy[] {
    const enemies: Enemy[] = [];
    const bodies = this.scene.physics.overlapCirc(x, y, range) as Phaser.Physics.Arcade.Body[];
    for (const body of bodies) {
      const obj = body.gameObject;
      if (obj && obj instanceof Enemy && obj.active) {
        enemies.push(obj);
      }
    }
    return enemies;
  }

  /**
   * Create explosion visual effect
   */
  private createExplosionVisual(x: number, y: number, radius: number): void {
    // Main explosion
    const explosion = this.scene.add.circle(x, y, radius * 0.5, 0xff6600, 0.8);
    explosion.setDepth(100);

    // Shockwave
    const shockwave = this.scene.add.circle(x, y, radius * 0.3, 0xffff00, 0.6);
    shockwave.setDepth(99);

    // Particle burst
    const particles = this.scene.add.particles(x, y, 'particle_fire', {
      speed: { min: 100, max: 250 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 400,
      quantity: 20,
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
  }

  /**
   * Trigger chain lightning from a point
   */
  private triggerChainLightning(x: number, y: number, damage: number, maxChains: number, range: number): void {
    const hitTargets = new Set<string>();
    let currentX = x;
    let currentY = y;
    let currentDamage = damage;
    let chainsRemaining = maxChains;

    while (chainsRemaining > 0) {
      const nearbyEnemies = this.findEnemiesInRange(currentX, currentY, range);
      const nextTarget = nearbyEnemies.find(e => !hitTargets.has(e.instanceId));

      if (!nextTarget) break;

      hitTargets.add(nextTarget.instanceId);

      // Create lightning visual
      this.createChainBolt(currentX, currentY, nextTarget.x, nextTarget.y);

      // Deal damage
      nextTarget.takeDamage(Math.floor(currentDamage));
      currentDamage *= 0.8; // Decay

      currentX = nextTarget.x;
      currentY = nextTarget.y;
      chainsRemaining--;
    }
  }

  /**
   * Create chain lightning bolt visual
   */
  private createChainBolt(x1: number, y1: number, x2: number, y2: number): void {
    const graphics = this.scene.add.graphics();
    graphics.setDepth(100);

    // Main bolt
    graphics.lineStyle(3, 0xffff00, 1);
    this.drawJaggedLine(graphics, x1, y1, x2, y2);

    // Glow
    graphics.lineStyle(6, 0xffff88, 0.5);
    this.drawJaggedLine(graphics, x1, y1, x2, y2);

    // End flash
    const flash = this.scene.add.circle(x2, y2, 12, 0xffff88, 0.9);
    flash.setDepth(101);

    this.scene.tweens.add({
      targets: [graphics, flash],
      alpha: 0,
      duration: 180,
      onComplete: () => {
        graphics.destroy();
        flash.destroy();
      },
    });
  }

  /**
   * Draw a jagged line (for lightning)
   */
  private drawJaggedLine(graphics: Phaser.GameObjects.Graphics, x1: number, y1: number, x2: number, y2: number): void {
    const segments = 5;
    const dx = (x2 - x1) / segments;
    const dy = (y2 - y1) / segments;

    graphics.beginPath();
    graphics.moveTo(x1, y1);

    for (let i = 1; i < segments; i++) {
      const x = x1 + dx * i + (Math.random() - 0.5) * 15;
      const y = y1 + dy * i + (Math.random() - 0.5) * 15;
      graphics.lineTo(x, y);
    }

    graphics.lineTo(x2, y2);
    graphics.strokePath();
  }

  /**
   * Create refract beam visual
   */
  private createRefractBeam(x1: number, y1: number, x2: number, y2: number): void {
    const graphics = this.scene.add.graphics();
    graphics.setDepth(100);

    graphics.lineStyle(2, 0x88ffff, 0.8);
    graphics.lineBetween(x1, y1, x2, y2);

    this.scene.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: 150,
      onComplete: () => graphics.destroy(),
    });
  }

  /**
   * Spread debuffs from enemy to nearby enemies
   */
  private spreadDebuffToNearby(sourceEnemy: Enemy): void {
    const debuffTypes = ['burn', 'poison', 'slow', 'root'];
    const debuffs = sourceEnemy.statusEffects.filter(e => debuffTypes.includes(e.type));

    if (debuffs.length === 0) return;

    const nearbyEnemies = this.findEnemiesInRange(sourceEnemy.x, sourceEnemy.y, 100);
    for (const enemy of nearbyEnemies) {
      if (enemy === sourceEnemy) continue;
      for (const debuff of debuffs) {
        enemy.addStatusEffect({
          type: debuff.type,
          value: debuff.value,
          duration: debuff.duration,
          remainingTime: debuff.duration,
          source: 'synergy_spread',
        });
      }
    }
  }

  /**
   * Create lava zone at position
   */
  private createLavaZone(x: number, y: number, radius: number, damagePerTick: number, duration: number): void {
    // Visual effect
    const lava = this.scene.add.circle(x, y, radius, 0xff4400, 0.4);
    lava.setDepth(25);

    const tickInterval = 500;
    let elapsed = 0;

    const damageTimer = this.scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          damageTimer.destroy();
          lava.destroy();
          return;
        }

        const enemies = this.findEnemiesInRange(x, y, radius);
        for (const enemy of enemies) {
          enemy.takeDamage(Math.floor(damagePerTick));
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }

  /**
   * Create split projectiles at position (for split_3 synergy)
   */
  private createSplitProjectilesAt(x: number, y: number, count: number, damage: number): void {
    const angleStep = (Math.PI * 2) / count;

    for (let i = 0; i < count; i++) {
      const angle = angleStep * i;
      // Create simple split projectile visual
      const proj = this.scene.add.circle(x, y, 6, 0xffff00, 0.8);
      proj.setDepth(40);

      const speed = 200;
      const distance = 100;

      this.scene.tweens.add({
        targets: proj,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        duration: 300,
        onUpdate: () => {
          // Check collision with enemies during flight
          const enemies = this.findEnemiesInRange(proj.x, proj.y, 20);
          for (const enemy of enemies) {
            enemy.takeDamage(Math.floor(damage));
          }
        },
        onComplete: () => proj.destroy(),
      });
    }
  }

  /**
   * Create heal zone at position
   */
  private createHealZone(x: number, y: number, radius: number, healPerTick: number, duration: number): void {
    // Visual effect
    const healZone = this.scene.add.circle(x, y, radius, 0x44ff44, 0.3);
    healZone.setDepth(25);
    healZone.setStrokeStyle(2, 0x44ff44, 0.6);

    const tickInterval = 500;
    let elapsed = 0;

    const healTimer = this.scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          healTimer.destroy();
          healZone.destroy();
          return;
        }

        // Heal player if in range
        const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y);
        if (distance <= radius) {
          this.player.heal(healPerTick);
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }

  /**
   * 创建能量流动效果（从敌人到玩家）
   * 用于吸血/圣光类技能
   */
  private createEnergyTransferEffect(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    color: number = 0xffcc00 // 默认金色（圣光）
  ): void {
    // 能量光束
    const beam = this.scene.add.graphics();
    beam.lineStyle(3, color, 0.9);
    beam.lineBetween(startX, startY, endX, endY);
    beam.setDepth(100);

    // 能量粒子流动
    const particleCount = 5;
    const distance = Phaser.Math.Distance.Between(startX, startY, endX, endY);
    const angle = Phaser.Math.Angle.Between(startX, startY, endX, endY);
    const particleSpeed = distance / 300; // 300ms到达

    for (let i = 0; i < particleCount; i++) {
      const particle = this.scene.add.circle(startX, startY, 4, color, 0.8);
      particle.setDepth(101);

      // 延迟启动，形成流动效果
      this.scene.tweens.add({
        targets: particle,
        x: endX,
        y: endY,
        alpha: 0.6,
        delay: i * 60,
        duration: 300,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }

    // 光束淡出
    this.scene.tweens.add({
      targets: beam,
      alpha: 0,
      delay: 300,
      duration: 100,
      onComplete: () => beam.destroy(),
    });
  }

  getProjectiles(): Phaser.Physics.Arcade.Group {
    return this.projectiles;
  }

  // ==================== 新增技能实现 ====================

  /**
   * 创建光环效果（持续治疗）
   */
  private createHaloEffect(skill: Skill): void {
    const duration = 5000;
    const tickInterval = 500;
    const healPerTick = skill.effects.find(e => e.type === 'heal')?.value || 5;

    // 光环视觉效果
    const halo = this.scene.add.circle(this.player.x, this.player.y, 40, 0xffcc00, 0.3);
    halo.setStrokeStyle(2, 0xffcc00, 0.6);
    halo.setDepth(48);

    let elapsed = 0;
    const healTimer = this.scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          healTimer.destroy();
          halo.destroy();
          return;
        }
        this.player.heal(healPerTick);
        halo.setPosition(this.player.x, this.player.y);
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }

  /**
   * 炎龙吐息 - 扇形持续火焰
   */
  private castDragonBreath(skill: Skill, damage: number): void {
    const duration = 2000;
    const tickInterval = 200;
    const range = skill.rangeValue;
    const angleSpread = Math.PI / 3; // 60度扇形

    // 扇形视觉效果
    const breathGraphics = this.scene.add.graphics();
    breathGraphics.setDepth(40);

    let elapsed = 0;
    const breathTimer = this.scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          breathTimer.destroy();
          breathGraphics.destroy();
          return;
        }

        // 检测扇形范围内敌人
        const enemies = this.findEnemiesInRange(this.player.x, this.player.y, range);
        for (const enemy of enemies) {
          const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
          const playerAngle = (this.player as any).body?.angle || 0;
          if (Math.abs(Phaser.Math.Angle.Wrap(angle - playerAngle)) < angleSpread / 2) {
            this.applyDamageToEnemy(enemy, Math.floor(damage * 0.3), skill);
          }
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }

  /**
   * 烈焰风暴 - 持续燃烧区域
   */
  private castInferno(skill: Skill, damage: number): void {
    const radius = skill.rangeValue;
    const duration = 5000;
    const tickInterval = 300;

    // 火焰视觉效果
    const inferno = this.scene.add.circle(this.player.x, this.player.y, radius, 0xff4400, 0.4);
    inferno.setDepth(25);

    let elapsed = 0;
    const infernoTimer = this.scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          infernoTimer.destroy();
          inferno.destroy();
          return;
        }

        const enemies = this.findEnemiesInRange(this.player.x, this.player.y, radius);
        for (const enemy of enemies) {
          this.applyDamageToEnemy(enemy, Math.floor(damage * 0.15), skill);
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }

  /**
   * 深渊漩涡 - 持续吸引
   */
  private castAbyssVortex(skill: Skill, damage: number): void {
    const centerX = this.player.x;
    const centerY = this.player.y;
    const radius = skill.rangeValue;
    const duration = 3000;
    const tickInterval = 200;

    // 漩涡视觉效果
    const vortex = this.scene.add.circle(centerX, centerY, radius, 0x2266cc, 0.3);
    vortex.setDepth(25);

    let elapsed = 0;
    const vortexTimer = this.scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          vortexTimer.destroy();
          vortex.destroy();
          return;
        }

        const enemies = this.findEnemiesInRange(centerX, centerY, radius);
        for (const enemy of enemies) {
          // 吸引效果
          const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, centerX, centerY);
          enemy.x += Math.cos(angle) * 30;
          enemy.y += Math.sin(angle) * 30;
          // 伤害
          this.applyDamageToEnemy(enemy, Math.floor(damage * 0.2), skill);
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }

  /**
   * 冰封领域 - 持续冻结
   */
  private castFrozenDomain(skill: Skill, damage: number): void {
    const radius = skill.rangeValue;
    const duration = 4000;
    const tickInterval = 500;

    // 冰霜视觉效果
    const domain = this.scene.add.circle(this.player.x, this.player.y, radius, 0x88ddff, 0.3);
    domain.setDepth(25);

    let elapsed = 0;
    const domainTimer = this.scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          domainTimer.destroy();
          domain.destroy();
          return;
        }

        const enemies = this.findEnemiesInRange(this.player.x, this.player.y, radius);
        for (const enemy of enemies) {
          this.applyDamageToEnemy(enemy, Math.floor(damage * 0.2), skill);
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }

  /**
   * 绝对零度 - 秒杀低血量
   */
  private castAbsoluteZero(skill: Skill, damage: number): void {
    const radius = skill.rangeValue;
    const executeThreshold = 0.15; // 15%血量以下秒杀

    // 极寒视觉效果
    const freeze = this.scene.add.circle(this.player.x, this.player.y, radius, 0x88ffff, 0.5);
    freeze.setDepth(100);
    this.scene.tweens.add({
      targets: freeze,
      alpha: 0,
      scale: 1.5,
      duration: 800,
      onComplete: () => freeze.destroy(),
    });

    const enemies = this.findEnemiesInRange(this.player.x, this.player.y, radius);
    for (const enemy of enemies) {
      const hpPercent = enemy.currentHp / enemy.maxHp;
      if (hpPercent < executeThreshold) {
        // 秒杀
        enemy.takeDamage(enemy.currentHp + 1);
      } else {
        // 正常伤害
        this.applyDamageToEnemy(enemy, damage, skill);
      }
    }
  }

  /**
   * 雷霆万钧 - 全屏连锁雷击
   */
  private castThunderApocalypse(skill: Skill, damage: number): void {
    const strikeCount = 12;
    const strikeInterval = 200;
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
        const dist = Math.random() * skill.rangeValue * 0.8;
        const strikeX = this.player.x + Math.cos(angle) * dist;
        const strikeY = this.player.y + Math.sin(angle) * dist;

        // 雷击视觉效果
        const lightning = this.scene.add.circle(strikeX, strikeY, 40, 0xffff00, 0.8);
        lightning.setDepth(100);
        this.scene.tweens.add({
          targets: lightning,
          alpha: 0,
          duration: 200,
          onComplete: () => lightning.destroy(),
        });

        // 伤害附近敌人
        const enemies = this.findEnemiesInRange(strikeX, strikeY, 60);
        for (const enemy of enemies) {
          this.applyDamageToEnemy(enemy, damage, skill);
        }
      },
      repeat: strikeCount - 1,
    });
  }

  /**
   * 审判之光 - 伤害+治疗（带能量流动）
   */
  private castJudgmentLight(skill: Skill, damage: number): void {
    const radius = skill.rangeValue;
    const healAmount = skill.effects.find(e => e.type === 'heal')?.value || 30;

    // 圣光视觉效果
    const light = this.scene.add.circle(this.player.x, this.player.y, radius, 0xffcc00, 0.4);
    light.setDepth(100);
    this.scene.tweens.add({
      targets: light,
      alpha: 0,
      scale: 1.3,
      duration: 600,
      onComplete: () => light.destroy(),
    });

    // 伤害敌人并创建能量流动
    const enemies = this.findEnemiesInRange(this.player.x, this.player.y, radius);
    for (const enemy of enemies) {
      this.applyDamageToEnemy(enemy, damage, skill);
      // 创建能量流动效果
      this.createEnergyTransferEffect(enemy.x, enemy.y, this.player.x, this.player.y, 0xffcc00);
    }

    // 延迟治疗（等待能量流动）
    if (enemies.length > 0) {
      this.scene.time.delayedCall(400, () => {
        this.player.heal(healAmount);
        // 治疗到达时的强烈闪光
        const healFlash = this.scene.add.circle(this.player.x, this.player.y, 40, 0x66ff66, 0.8);
        healFlash.setDepth(101);
        this.scene.tweens.add({
          targets: healFlash,
          alpha: 0,
          scale: 2,
          duration: 400,
          onComplete: () => healFlash.destroy(),
        });
      });
    }
  }

  /**
   * 暗影降临 - 降防+持续伤害
   */
  private castShadowDescent(skill: Skill, damage: number): void {
    const radius = skill.rangeValue;
    const duration = 4000;
    const tickInterval = 500;

    // 暗影视觉效果
    const shadow = this.scene.add.circle(this.player.x, this.player.y, radius, 0x440066, 0.4);
    shadow.setDepth(25);

    let elapsed = 0;
    const shadowTimer = this.scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          shadowTimer.destroy();
          shadow.destroy();
          return;
        }

        const enemies = this.findEnemiesInRange(this.player.x, this.player.y, radius);
        for (const enemy of enemies) {
          this.applyDamageToEnemy(enemy, Math.floor(damage * 0.15), skill);
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });

    // 立即伤害
    const enemies = this.findEnemiesInRange(this.player.x, this.player.y, radius);
    for (const enemy of enemies) {
      this.applyDamageToEnemy(enemy, damage, skill);
    }
  }

  /**
   * 死亡凋零 - 持续吸血（带能量流动）
   */
  private castDeathDecay(skill: Skill, damage: number): void {
    const radius = skill.rangeValue;
    const duration = 5000;
    const tickInterval = 400;
    const lifestealPercent = 0.3;

    // 死亡视觉效果
    const decay = this.scene.add.circle(this.player.x, this.player.y, radius, 0x440044, 0.3);
    decay.setDepth(25);

    let elapsed = 0;
    const decayTimer = this.scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          decayTimer.destroy();
          decay.destroy();
          return;
        }

        const enemies = this.findEnemiesInRange(this.player.x, this.player.y, radius);
        let totalDamage = 0;
        for (const enemy of enemies) {
          const tickDamage = Math.floor(damage * 0.12);
          this.applyDamageToEnemy(enemy, tickDamage, skill);
          totalDamage += tickDamage;
          // 创建暗紫色能量流动效果
          this.createEnergyTransferEffect(enemy.x, enemy.y, this.player.x, this.player.y, 0x8800ff);
        }
        // 吸血（延迟等待能量流动）
        if (totalDamage > 0) {
          this.scene.time.delayedCall(200, () => {
            this.player.heal(Math.floor(totalDamage * lifestealPercent));
          });
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }

  /**
   * 山崩地裂 - 范围伤害+击飞+眩晕
   */
  private castMountainCollapse(skill: Skill, damage: number): void {
    const radius = skill.rangeValue;
    const knockbackDist = 150;

    // 地裂视觉效果
    const crack = this.scene.add.circle(this.player.x, this.player.y, radius, 0x886644, 0.5);
    crack.setDepth(100);
    this.scene.tweens.add({
      targets: crack,
      alpha: 0,
      scale: 1.5,
      duration: 600,
      onComplete: () => crack.destroy(),
    });

    const enemies = this.findEnemiesInRange(this.player.x, this.player.y, radius);
    for (const enemy of enemies) {
      this.applyDamageToEnemy(enemy, damage, skill);
      // 击飞
      const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      enemy.x += Math.cos(angle) * knockbackDist;
      enemy.y += Math.sin(angle) * knockbackDist;
    }
  }

  /**
   * 陨石坠落 - 大范围爆炸
   */
  private castMeteor(skill: Skill, damage: number): void {
    const radius = skill.rangeValue;

    // 陨石视觉效果
    const meteor = this.scene.add.circle(this.player.x, this.player.y - 100, 30, 0xff4400, 1);
    meteor.setDepth(100);

    // 下落动画
    this.scene.tweens.add({
      targets: meteor,
      y: this.player.y,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        meteor.destroy();
        // 爆炸效果
        this.createExplosionVisual(this.player.x, this.player.y, radius);

        // 伤害
        const enemies = this.findEnemiesInRange(this.player.x, this.player.y, radius);
        for (const enemy of enemies) {
          this.applyDamageToEnemy(enemy, damage, skill);
        }
      },
    });
  }

  /**
   * 海啸 - 全屏推开
   */
  private castTsunami(skill: Skill, damage: number): void {
    const radius = skill.rangeValue;
    const knockbackDist = 200;

    // 海啸视觉效果
    const wave = this.scene.add.circle(this.player.x, this.player.y, 20, 0x4488ff, 0.6);
    wave.setDepth(100);
    this.scene.tweens.add({
      targets: wave,
      scale: radius / 20,
      alpha: 0,
      duration: 800,
      onComplete: () => wave.destroy(),
    });

    const enemies = this.findEnemiesInRange(this.player.x, this.player.y, radius);
    for (const enemy of enemies) {
      this.applyDamageToEnemy(enemy, damage, skill);
      // 推开
      const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      enemy.x += Math.cos(angle) * knockbackDist;
      enemy.y += Math.sin(angle) * knockbackDist;
    }
  }

  /**
   * 大地震击 - 全屏眩晕
   */
  private castEarthquake(skill: Skill, damage: number): void {
    const radius = skill.rangeValue;

    // 地震视觉效果
    this.scene.cameras.main.shake(500, 0.02);
    const quake = this.scene.add.circle(this.player.x, this.player.y, radius, 0x886644, 0.3);
    quake.setDepth(100);
    this.scene.tweens.add({
      targets: quake,
      alpha: 0,
      duration: 500,
      onComplete: () => quake.destroy(),
    });

    const enemies = this.findEnemiesInRange(this.player.x, this.player.y, radius);
    for (const enemy of enemies) {
      this.applyDamageToEnemy(enemy, damage, skill);
    }
  }

  /**
   * 过度生长 - 全屏缠绕
   */
  private castOvergrowth(skill: Skill, damage: number): void {
    const radius = skill.rangeValue;

    // 藤蔓视觉效果
    const vines = this.scene.add.circle(this.player.x, this.player.y, radius, 0x44ff44, 0.3);
    vines.setDepth(100);
    this.scene.tweens.add({
      targets: vines,
      alpha: 0,
      duration: 1000,
      onComplete: () => vines.destroy(),
    });

    const enemies = this.findEnemiesInRange(this.player.x, this.player.y, radius);
    for (const enemy of enemies) {
      this.applyDamageToEnemy(enemy, damage, skill);
    }
  }

  /**
   * 虚空裂隙 - 持续吸引+伤害
   */
  private castVoidRift(skill: Skill, damage: number): void {
    const centerX = this.player.x;
    const centerY = this.player.y;
    const radius = skill.rangeValue;
    const duration = 3000;
    const tickInterval = 300;

    // 裂隙视觉效果
    const rift = this.scene.add.circle(centerX, centerY, radius, 0x8800ff, 0.4);
    rift.setDepth(25);

    let elapsed = 0;
    const riftTimer = this.scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          riftTimer.destroy();
          rift.destroy();
          return;
        }

        const enemies = this.findEnemiesInRange(centerX, centerY, radius);
        for (const enemy of enemies) {
          // 吸引
          const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, centerX, centerY);
          enemy.x += Math.cos(angle) * 25;
          enemy.y += Math.sin(angle) * 25;
          // 伤害
          this.applyDamageToEnemy(enemy, Math.floor(damage * 0.25), skill);
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }

  destroy(): void {
    this.projectiles.destroy(true);
  }
}
