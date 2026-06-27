import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { Enemy } from '@/entities/Enemy';
import { Projectile, ProjectileConfig } from '@/entities/Projectile';
import { Skill, Element, SynergyResult } from '@/types';
import { SkillEffects } from '@/graphics/SkillEffects';
import { ElementSystem } from '@/systems/ElementSystem';
import { specialBehaviorRegistry } from '@/systems/SpecialBehaviorRegistry';
import { getCounterBonus, ELEMENT_COLORS as DATA_ELEMENT_COLORS } from '@/data/elements';
import {
  skillStrategyRegistry,
  SkillExecutionContext,
  synergyStrategyRegistry,
  SynergyExecutionContext,
  statusEffectStrategyRegistry,
  StatusEffectExecutionContext,
  buffSkillStrategyRegistry,
} from '@/strategies';
import {
  createBurnVisualModifier,
  createPoisonVisualModifier,
  createSlowVisualModifier,
} from '@/modifiers/visual/VisualModifiers';

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
        this.applySynergyEffect(enemy, synergyResult, damage, skillElement);
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
  private applySynergyEffect(enemy: Enemy, synergy: SynergyResult, baseDamage: number, skillElement?: Element): void {
    // Emit event for UI feedback
    this.synergyEvents.emit('synergy_triggered', {
      synergy,
      enemyId: enemy.instanceId,
      enemyPosition: { x: enemy.x, y: enemy.y },
    });

    console.log(`[SkillSystem] Synergy triggered: ${synergy.name} (${synergy.effect})`);

    // 创建执行上下文
    const context: SynergyExecutionContext = {
      scene: this.scene,
      player: this.player,
      baseDamage,
      skillElement,
      findEnemiesInRange: this.findEnemiesInRange.bind(this),
    };

    // 尝试使用策略模式
    if (synergyStrategyRegistry.hasStrategy(synergy.effect)) {
      synergyStrategyRegistry.execute(synergy, enemy, context);
    } else {
      // 未知效果
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

    // 触发玩家攻击动画
    this.player.playAttackAnimation();

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

  /**
   * 创建投射物（供策略使用）
   */
  private createProjectile(config: ProjectileConfig): Phaser.GameObjects.Container {
    const projectile = new Projectile(
      this.scene,
      this.player.x,
      this.player.y,
      config
    );

    this.projectiles.add(projectile);
    // 角度从 config 中获取（策略设置在 data 中）
    const angle = projectile.getData('angle') || 0;
    projectile.fire(angle);

    return projectile as unknown as Phaser.GameObjects.Container;
  }

  /**
   * 查找范围内最近的敌人（供策略使用）
   */
  private findNearestEnemyByPosition(x: number, y: number, range: number): Enemy | null {
    const enemies = this.findEnemiesInRange(x, y, range);
    return this.findNearestEnemy(enemies);
  }

  private castArea(skill: Skill): void {
    // 计算最终伤害（含技能加成和暴击）
    const baseDamage = skill.damage + this.player.stats.attack;
    const { damage, isCrit } = this.calculateDamage(baseDamage);

    // 创建执行上下文
    const context: SkillExecutionContext = {
      scene: this.scene,
      player: this.player,
      damage,
      isCrit,
      findEnemiesInRange: this.findEnemiesInRange.bind(this),
      findNearestEnemy: this.findNearestEnemyByPosition.bind(this),
      applyDamageToEnemy: this.applyDamageToEnemy.bind(this),
      applyEffects: this.applyEffects.bind(this),
      applyLifesteal: this.applyLifesteal.bind(this),
      createProjectile: this.createProjectile.bind(this),
    };

    // 尝试使用策略模式
    if (skillStrategyRegistry.hasStrategy(skill.id)) {
      // 使用视觉效果系统
      this.skillEffects.createAreaEffect(skill, this.player.x, this.player.y);
      // 执行策略
      skillStrategyRegistry.execute(skill, context);
    } else {
      // 未注册策略的技能：使用旧的分支逻辑或默认处理
      this.castAreaLegacy(skill, damage);
    }
  }

  /**
   * 旧版范围技能处理（兼容未重构的技能）
   */
  private castAreaLegacy(skill: Skill, damage: number): void {
    // 使用新的效果系统
    this.skillEffects.createAreaEffect(skill, this.player.x, this.player.y);

    // 默认范围伤害处理
    this.defaultAreaDamage(skill, damage);
  }

  /**
   * 默认范围伤害处理
   */
  private defaultAreaDamage(skill: Skill, damage: number): void {
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
    // 计算基础伤害
    const baseDamage = skill.damage + this.player.stats.attack;
    const { damage } = this.calculateDamage(baseDamage);

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

    // 处理反击伤害效果（火焰反击）
    const counterDamageEffect = skill.effects.find(e => e.type === 'counter_damage');
    if (counterDamageEffect) {
      this.player.addCounterDamageEffect({
        value: counterDamageEffect.value,
        duration: counterDamageEffect.duration || 10000,
        maxTriggers: 5,
      });
    }

    // 处理反击冻结效果（冰霜屏障）
    const counterFreezeEffect = skill.effects.find(e => e.type === 'counter_freeze');
    if (counterFreezeEffect) {
      this.player.addCounterFreezeEffect({
        duration: counterFreezeEffect.value,
        effectDuration: counterFreezeEffect.duration || 8000,
        maxTriggers: 3,
      });
    }

    // 使用策略模式处理特殊Buff技能
    if (buffSkillStrategyRegistry.hasStrategy(skill.id)) {
      const context = {
        scene: this.scene,
        player: this.player,
        skill,
        damage,
      };
      buffSkillStrategyRegistry.execute(skill.id, context);
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
      // lifestealPercent 是百分比形式 (如 10 表示 10%)，需要除以100
      const healAmount = Math.floor(damage * lifestealPercent / 100);
      this.player.heal(healAmount);
    }
  }

  /**
   * Apply skill effects to enemy using status effect strategies
   */
  private applyEffects(enemy: Enemy, effects: Skill['effects']): void {
    for (const effect of effects) {
      // 跳过已在伤害计算阶段处理的类型
      if (effect.type === 'damage') {
        continue; // 基础伤害已在 applyDamageToEnemy 中处理
      }

      // 创建执行上下文
      const context: StatusEffectExecutionContext = {
        scene: this.scene,
        player: this.player,
        enemy,
      };

      // 尝试使用策略模式
      if (statusEffectStrategyRegistry.hasStrategy(effect.type)) {
        statusEffectStrategyRegistry.execute(effect, context);
      } else {
        // 未知效果
        console.warn(`[SkillSystem] Unknown effect type: ${effect.type}`);
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
    // 使用新修饰符系统检查和传播效果
    const debuffChecks = [
      { type: 'burn', factory: createBurnVisualModifier },
      { type: 'poison', factory: createPoisonVisualModifier },
      { type: 'slow', factory: createSlowVisualModifier },
    ];

    const nearbyEnemies = this.findEnemiesInRange(sourceEnemy.x, sourceEnemy.y, 100);

    for (const check of debuffChecks) {
      // 检查是否有该效果类型（使用标签系统）
      if (sourceEnemy.modifierStack.hasTag(check.type)) {
        // 获取效果值
        const value = sourceEnemy.modifierStack.getStatusEffectValue(
          check.type === 'burn' ? 'BURN' as any :
          check.type === 'poison' ? 'POISON' as any :
          'SLOW' as any
        );

        // 传播给附近敌人
        for (const enemy of nearbyEnemies) {
          if (enemy === sourceEnemy) continue;
          // 使用默认持续时间传播效果
          enemy.modifierStack.addModifier(
            check.factory(value, 3000)
          );
        }
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
    const executeThreshold = 0.10; // 10%血量以下秒杀

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

  // ==================== 新差异化技能实现 ====================

  /**
   * 火焰喷射 - 锥形范围持续伤害
   */
  private castFlameSpray(skill: Skill, damage: number): void {
    const coneAngle = Math.PI / 3;
    const range = skill.rangeValue;
    const duration = 1500;
    const tickInterval = 200;

    // 确定玩家朝向：优先使用最近敌人方向，否则默认朝右
    const nearestEnemy = this.findNearestEnemy(this.findEnemiesInRange(this.player.x, this.player.y, range + 100));
    const playerAngle = nearestEnemy
      ? Phaser.Math.Angle.Between(this.player.x, this.player.y, nearestEnemy.x, nearestEnemy.y)
      : 0;

    const cone = this.scene.add.graphics();
    cone.fillStyle(0xff4400, 0.4);
    cone.beginPath();
    cone.moveTo(this.player.x, this.player.y);
    cone.arc(this.player.x, this.player.y, range, playerAngle - coneAngle / 2, playerAngle + coneAngle / 2);
    cone.closePath();
    cone.fill();
    cone.setDepth(25);

    let elapsed = 0;
    const sprayTimer = this.scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          sprayTimer.destroy();
          cone.destroy();
          return;
        }
        const enemies = this.findEnemiesInRange(this.player.x, this.player.y, range);
        for (const enemy of enemies) {
          const enemyAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
          const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(enemyAngle - playerAngle));
          if (angleDiff < coneAngle / 2) {
            this.applyDamageToEnemy(enemy, Math.floor(damage * 0.25), skill);
          }
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }

  /**
   * 水波推进 - 方向性波浪
   */
  private castWavePush(skill: Skill, damage: number): void {
    const range = skill.rangeValue;
    const waveSpeed = 300;
    const waveWidth = 60;

    const target = this.findNearestEnemy(this.findEnemiesInRange(this.player.x, this.player.y, range + 100));
    if (!target) return;

    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);
    const wave = this.scene.add.graphics();
    wave.fillStyle(0x4488ff, 0.6);
    wave.fillRect(-waveWidth / 2, 0, waveWidth, 50);
    wave.setPosition(this.player.x, this.player.y);
    wave.setRotation(angle);
    wave.setDepth(25);

    let distance = 0;
    const hitEnemies = new Set<string>();
    const waveTimer = this.scene.time.addEvent({
      delay: 50,
      callback: () => {
        distance += waveSpeed * 0.05;
        if (distance >= range) {
          waveTimer.destroy();
          wave.destroy();
          return;
        }
        const cx = this.player.x + Math.cos(angle) * distance;
        const cy = this.player.y + Math.sin(angle) * distance;
        wave.setPosition(cx, cy);
        const enemies = this.findEnemiesInRange(cx, cy, waveWidth);
        for (const enemy of enemies) {
          if (!hitEnemies.has(enemy.instanceId)) {
            hitEnemies.add(enemy.instanceId);
            this.applyDamageToEnemy(enemy, damage, skill);
            enemy.x += Math.cos(angle) * 30;
            enemy.y += Math.sin(angle) * 30;
          }
        }
      },
      repeat: range / (waveSpeed * 0.05),
    });
  }

  /**
   * 冰晶爆发 - 多方向穿透
   */
  private castIceCrystalBurst(skill: Skill, damage: number): void {
    const crystalCount = 8;
    const range = skill.rangeValue;
    const angleStep = (Math.PI * 2) / crystalCount;
    const hitEnemies = new Set<string>();

    for (let i = 0; i < crystalCount; i++) {
      const angle = angleStep * i;
      const crystal = this.scene.add.graphics();
      crystal.fillStyle(0x88ddff, 0.9);
      crystal.fillTriangle(0, -15, -8, 8, 8, 8);
      crystal.setPosition(this.player.x, this.player.y);
      crystal.setRotation(angle);
      crystal.setDepth(40);

      this.scene.tweens.add({
        targets: crystal,
        x: this.player.x + Math.cos(angle) * range,
        y: this.player.y + Math.sin(angle) * range,
        alpha: 0.5,
        duration: 400,
        onUpdate: () => {
          const enemies = this.findEnemiesInRange(crystal.x, crystal.y, 20);
          for (const enemy of enemies) {
            if (!hitEnemies.has(enemy.instanceId)) {
              hitEnemies.add(enemy.instanceId);
              this.applyDamageToEnemy(enemy, damage, skill);
            }
          }
        },
        onComplete: () => crystal.destroy(),
      });
    }
  }

  /**
   * 雷击阵 - 定点雷击
   */
  private castLightningArray(skill: Skill, damage: number): void {
    const strikeCount = 3;
    const range = skill.rangeValue;
    const enemies = this.findEnemiesInRange(this.player.x, this.player.y, range);
    const targets = enemies.slice(0, strikeCount);

    targets.forEach((enemy, index) => {
      const warning = this.scene.add.circle(enemy.x, enemy.y, 30, 0xffff00, 0.3);
      warning.setDepth(20);

      this.scene.time.delayedCall(500 + index * 200, () => {
        warning.destroy();
        const lightning = this.scene.add.graphics();
        lightning.lineStyle(4, 0xffff00, 1);
        lightning.lineBetween(enemy.x, enemy.y - 100, enemy.x, enemy.y);
        lightning.setDepth(100);

        const flash = this.scene.add.circle(enemy.x, enemy.y, 40, 0xffffff, 0.9);
        flash.setDepth(101);

        if (enemy.active) {
          this.applyDamageToEnemy(enemy, damage, skill);
        }

        this.scene.tweens.add({
          targets: [lightning, flash],
          alpha: 0,
          duration: 150,
          onComplete: () => {
            lightning.destroy();
            flash.destroy();
          },
        });
      });
    });
  }

  /**
   * 诅咒链 - 链式传播
   */
  private castCurseChain(skill: Skill, damage: number): void {
    const maxChains = 4;
    const chainRange = 150;

    const startEnemy = this.findNearestEnemy(
      this.findEnemiesInRange(this.player.x, this.player.y, skill.rangeValue)
    );
    if (!startEnemy) return;

    const hitEnemies = new Set<string>();
    let currentEnemy = startEnemy;
    let chainCount = 0;

    while (currentEnemy && chainCount < maxChains) {
      hitEnemies.add(currentEnemy.instanceId);
      this.applyDamageToEnemy(currentEnemy, damage, skill);

      const curseEffect = this.scene.add.circle(currentEnemy.x, currentEnemy.y, 20, 0x8800ff, 0.5);
      curseEffect.setDepth(100);
      this.scene.tweens.add({
        targets: curseEffect,
        alpha: 0,
        scale: 1.5,
        duration: 300,
        onComplete: () => curseEffect.destroy(),
      });

      const nearbyEnemies = this.findEnemiesInRange(currentEnemy.x, currentEnemy.y, chainRange)
        .filter(e => !hitEnemies.has(e.instanceId));

      if (nearbyEnemies.length > 0) {
        const nextEnemy = nearbyEnemies[0];
        const chain = this.scene.add.graphics();
        chain.lineStyle(3, 0x8800ff, 0.8);
        chain.lineBetween(currentEnemy.x, currentEnemy.y, nextEnemy.x, nextEnemy.y);
        chain.setDepth(99);
        this.scene.time.delayedCall(200, () => chain.destroy());
        currentEnemy = nextEnemy;
        chainCount++;
      } else {
        break;
      }
    }
  }

  /**
   * 地刺陷阱 - 陷阱机制
   */
  private castSpikeTrap(skill: Skill, damage: number): void {
    const trapCount = 3;
    const trapRadius = skill.rangeValue;
    const trapDuration = 5000;

    for (let i = 0; i < trapCount; i++) {
      const angle = (i / trapCount) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 80 + Math.random() * 60;
      const trapX = this.player.x + Math.cos(angle) * dist;
      const trapY = this.player.y + Math.sin(angle) * dist;

      const trap = this.scene.add.circle(trapX, trapY, 25, 0x886644, 0.5);
      trap.setStrokeStyle(2, 0xaa8866, 0.8);
      trap.setDepth(20);

      this.scene.tweens.add({
        targets: trap,
        scale: 1.2,
        alpha: 0.7,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });

      const checkTimer = this.scene.time.addEvent({
        delay: 100,
        callback: () => {
          const enemies = this.findEnemiesInRange(trapX, trapY, trapRadius);
          if (enemies.length > 0) {
            checkTimer.destroy();
            trap.destroy();

            const spikes = this.scene.add.graphics();
            spikes.fillStyle(0x886644, 1);
            for (let j = 0; j < 5; j++) {
              const spikeAngle = (j / 5) * Math.PI * 2;
              spikes.fillTriangle(
                trapX + Math.cos(spikeAngle) * 15,
                trapY + Math.sin(spikeAngle) * 15 - 20,
                trapX + Math.cos(spikeAngle) * 25 - 5,
                trapY + Math.sin(spikeAngle) * 25,
                trapX + Math.cos(spikeAngle) * 25 + 5,
                trapY + Math.sin(spikeAngle) * 25
              );
            }
            spikes.setDepth(40);

            for (const enemy of enemies) {
              this.applyDamageToEnemy(enemy, damage, skill);
            }
            this.scene.time.delayedCall(300, () => spikes.destroy());
          }
        },
        repeat: trapDuration / 100,
      });

      this.scene.time.delayedCall(trapDuration, () => {
        checkTimer.destroy();
        trap.destroy();
      });
    }
  }

  /**
   * 流沙陷阱 - 持续陷阱
   */
  private castQuicksandTrap(skill: Skill, damage: number): void {
    const radius = skill.rangeValue;
    const duration = 4000;
    const tickInterval = 400;

    const quicksand = this.scene.add.circle(this.player.x, this.player.y, radius, 0x886633, 0.4);
    quicksand.setDepth(20);

    this.scene.tweens.add({
      targets: quicksand,
      angle: 360,
      duration: 2000,
      repeat: -1,
    });

    let elapsed = 0;
    const trapTimer = this.scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          trapTimer.destroy();
          quicksand.destroy();
          return;
        }
        const enemies = this.findEnemiesInRange(this.player.x, this.player.y, radius);
        for (const enemy of enemies) {
          this.applyDamageToEnemy(enemy, damage, skill);
          enemy.modifierStack.addModifier(
            createSlowVisualModifier(50, 500)
          );
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }

  /**
   * 电荷积累 - 叠加机制
   */
  private castChargeAccumulate(skill: Skill, damage: number): void {
    const range = skill.rangeValue;
    const maxStacks = 2;
    const enemies = this.findEnemiesInRange(this.player.x, this.player.y, range);
    if (enemies.length === 0) return;

    const arc = this.scene.add.graphics();
    arc.lineStyle(2, 0xffff00, 0.8);
    arc.setDepth(99);

    let prevX = this.player.x;
    let prevY = this.player.y;

    enemies.forEach((enemy) => {
      arc.lineBetween(prevX, prevY, enemy.x, enemy.y);
      prevX = enemy.x;
      prevY = enemy.y;

      if (!(enemy as any).chargeStacks) (enemy as any).chargeStacks = 0;
      (enemy as any).chargeStacks++;

      const chargeText = this.scene.add.text(enemy.x, enemy.y - 30, `⚡${(enemy as any).chargeStacks}`, {
        fontSize: '14px',
        color: '#ffff00',
      });
      chargeText.setOrigin(0.5);
      chargeText.setDepth(100);

      if ((enemy as any).chargeStacks >= maxStacks) {
        const burst = this.scene.add.circle(enemy.x, enemy.y, 50, 0xffff00, 0.8);
        burst.setDepth(101);
        this.applyDamageToEnemy(enemy, damage * 2, skill);
        (enemy as any).chargeStacks = 0;

        this.scene.tweens.add({
          targets: [burst, chargeText],
          alpha: 0,
          scale: 1.5,
          duration: 200,
          onComplete: () => {
            burst.destroy();
            chargeText.destroy();
          },
        });
      } else {
        this.scene.time.delayedCall(500, () => chargeText.destroy());
      }

      this.applyDamageToEnemy(enemy, damage * 0.5, skill);
    });

    this.scene.time.delayedCall(200, () => arc.destroy());
  }

  /**
   * 电磁脉冲 - 环形扩散
   */
  private castEMPPulse(skill: Skill, damage: number): void {
    const range = skill.rangeValue;
    const pulseWidth = 40;
    const hitEnemies = new Set<string>();

    const pulse = this.scene.add.circle(this.player.x, this.player.y, 20, 0xffff00, 0.6);
    pulse.setStrokeStyle(4, 0xffffff, 0.8);
    pulse.setDepth(100);

    this.scene.tweens.add({
      targets: pulse,
      radius: range,
      alpha: 0,
      duration: 600,
      onUpdate: () => {
        const currentRadius = (pulse as any).radius;
        const enemies = this.findEnemiesInRange(this.player.x, this.player.y, currentRadius + pulseWidth);
        for (const enemy of enemies) {
          const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
          if (dist >= currentRadius - pulseWidth && dist <= currentRadius + pulseWidth) {
            if (!hitEnemies.has(enemy.instanceId)) {
              hitEnemies.add(enemy.instanceId);
              this.applyDamageToEnemy(enemy, damage, skill);
            }
          }
        }
      },
      onComplete: () => pulse.destroy(),
    });
  }

  /**
   * 暗影分身 - 分身机制
   */
  private castShadowClone(skill: Skill, damage: number): void {
    const clone = this.scene.add.container(this.player.x, this.player.y);
    clone.setDepth(40);

    const body = this.scene.add.circle(0, 0, 15, 0x8800ff, 0.7);
    const glow = this.scene.add.circle(0, 0, 20, 0x6600aa, 0.4);
    clone.add([glow, body]);

    this.scene.tweens.add({
      targets: clone,
      alpha: 0.5,
      scale: 1.1,
      duration: 300,
      yoyo: true,
      repeat: -1,
    });

    const cloneDuration = 3000;
    const attractTimer = this.scene.time.addEvent({
      delay: 200,
      callback: () => {
        const enemies = this.findEnemiesInRange(clone.x, clone.y, 80);
        for (const enemy of enemies) {
          const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, clone.x, clone.y);
          enemy.x += Math.cos(angle) * 10;
          enemy.y += Math.sin(angle) * 10;
        }
      },
      repeat: cloneDuration / 200 - 1,
    });

    this.scene.time.delayedCall(cloneDuration, () => {
      attractTimer.destroy();
      this.scene.tweens.add({
        targets: clone,
        alpha: 0,
        scale: 0.5,
        duration: 300,
        onComplete: () => clone.destroy(),
      });
    });
  }

  /**
   * 地裂线 - 直线地裂
   */
  private castGroundCrackLine(skill: Skill, damage: number): void {
    const range = skill.rangeValue;
    const lineWidth = 60;
    const hitEnemies = new Set<string>();

    const target = this.findNearestEnemy(
      this.findEnemiesInRange(this.player.x, this.player.y, range + 100)
    );
    if (!target) return;

    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);

    const crack = this.scene.add.graphics();
    crack.fillStyle(0x664422, 0.8);
    crack.fillRect(0, -lineWidth / 2, range, lineWidth);
    crack.setPosition(this.player.x, this.player.y);
    crack.setRotation(angle);
    crack.setDepth(25);

    crack.setScale(0, 1);
    this.scene.tweens.add({
      targets: crack,
      scaleX: 1,
      duration: 300,
      onUpdate: () => {
        const enemies = this.findEnemiesInRange(this.player.x, this.player.y, range);
        for (const enemy of enemies) {
          if (hitEnemies.has(enemy.instanceId)) continue;
          const enemyAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
          const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(enemyAngle - angle));
          if (angleDiff < 0.3) {
            hitEnemies.add(enemy.instanceId);
            this.applyDamageToEnemy(enemy, damage, skill);
            enemy.x += Math.cos(angle) * 50;
            enemy.y += Math.sin(angle) * 50;
          }
        }
      },
      onComplete: () => {
        this.scene.tweens.add({
          targets: crack,
          alpha: 0,
          duration: 200,
          onComplete: () => crack.destroy(),
        });
      },
    });
  }

  /**
   * 火焰射线 - 持续射线伤害
   */
  private castFlameRay(skill: Skill, damage: number): void {
    const range = skill.rangeValue;
    const duration = 2000;
    const tickInterval = 150;
    const rayWidth = 30;

    const ray = this.scene.add.graphics();
    ray.lineStyle(rayWidth, 0xff4400, 0.6);
    ray.setDepth(40);

    let elapsed = 0;
    const rayTimer = this.scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          rayTimer.destroy();
          ray.destroy();
          return;
        }

        const currentTarget = this.findNearestEnemy(
          this.findEnemiesInRange(this.player.x, this.player.y, range + 100)
        );
        const targetAngle = currentTarget
          ? Phaser.Math.Angle.Between(this.player.x, this.player.y, currentTarget.x, currentTarget.y)
          : 0;

        ray.clear();
        ray.lineStyle(rayWidth, 0xff4400, 0.6);
        ray.lineBetween(
          this.player.x, this.player.y,
          this.player.x + Math.cos(targetAngle) * range,
          this.player.y + Math.sin(targetAngle) * range
        );

        const enemies = this.findEnemiesInRange(this.player.x, this.player.y, range);
        for (const enemy of enemies) {
          const enemyAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
          const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(enemyAngle - targetAngle));
          if (angleDiff < 0.2) {
            this.applyDamageToEnemy(enemy, damage, skill);
          }
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }

  destroy(): void {
    this.projectiles.destroy(true);
  }
}
