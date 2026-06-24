diff --git a/src/systems/SkillSystem.ts b/src/systems/SkillSystem.ts
index 52e1a9f..55abb74 100644
--- a/src/systems/SkillSystem.ts
+++ b/src/systems/SkillSystem.ts
@@ -1,87 +1,308 @@
 import Phaser from 'phaser';
 import { Player } from '@/entities/Player';
-import { Enemy } from '@/entities/Enemy';
+import { Enemy, StatusEffect } from '@/entities/Enemy';
 import { Projectile, ProjectileConfig } from '@/entities/Projectile';
-import { Skill } from '@/types';
+import { Skill, Element, SynergyResult } from '@/types';
 import { SkillEffects } from '@/graphics/SkillEffects';
+import { ElementSystem } from '@/systems/ElementSystem';
+import { getCounterBonus, ELEMENT_COLORS as DATA_ELEMENT_COLORS } from '@/data/elements';
 
-// 元素颜色映射
+// 元素颜色映射 (all 8 elements)
 const ELEMENT_COLORS: Record<string, number> = {
   fire: 0xff4400,
-  ice: 0x44ccff,
+  water: 0x4488ff,
+  ice: 0x88ddff,
   lightning: 0xffff00,
-  physical: 0xffffff,
-  shadow: 0x8800ff,
   holy: 0xffcc00,
+  shadow: 0x8800ff,
+  grass: 0x44ff44,
+  earth: 0xaa8844,
+  physical: 0xffffff,
 };
 
 export class SkillSystem {
   private scene: Phaser.Scene;
   private player: Player;
   private projectiles: Phaser.Physics.Arcade.Group;
   private skillEffects: SkillEffects;
+  private elementSystem: ElementSystem | null = null;
+
+  // Event emitter for synergy effects (for UI feedback)
+  private synergyEvents: Phaser.Events.EventEmitter = new Phaser.Events.EventEmitter();
 
-  constructor(scene: Phaser.Scene, player: Player) {
+  constructor(scene: Phaser.Scene, player: Player, elementSystem?: ElementSystem) {
     this.scene = scene;
     this.player = player;
     this.skillEffects = new SkillEffects(scene);
+    this.elementSystem = elementSystem || null;
 
     // 创建投射物组
     this.projectiles = scene.physics.add.group({
       classType: Projectile,
       runChildUpdate: true,
     });
   }
 
+  /**
+   * Set the ElementSystem reference (can be set later if not available in constructor)
+   */
+  setElementSystem(elementSystem: ElementSystem | null): void {
+    this.elementSystem = elementSystem;
+  }
+
+  /**
+   * Get the synergy event emitter for UI feedback
+   */
+  getSynergyEvents(): Phaser.Events.EventEmitter {
+    return this.synergyEvents;
+  }
+
   /**
    * 计算最终伤害（含暴击和技能加成）
+   * Note: Counter bonus is applied separately in applyDamageToEnemy()
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
 
+  /**
+   * Apply damage to enemy with element system integration
+   * Handles: counter bonus, element marks, and synergy triggers
+   */
+  private applyDamageToEnemy(
+    enemy: Enemy,
+    damage: number,
+    skill: Skill,
+    isCrit: boolean = false
+  ): void {
+    const skillElement = skill.elements[0] || skill.element;
+
+    // Apply damage with element for counter bonus
+    // Enemy.takeDamage() handles counter bonus calculation and visual feedback
+    enemy.takeDamage(damage, skillElement);
+
+    // Apply element mark and check for synergy
+    if (this.elementSystem && skillElement) {
+      const synergyResult = this.elementSystem.checkSynergy(
+        enemy.instanceId,
+        skillElement,
+        skill.id
+      );
+
+      if (synergyResult) {
+        this.applySynergyEffect(enemy, synergyResult, damage);
+      }
+    }
+
+    // Apply status effects from skill
+    this.applyEffects(enemy, skill.effects);
+
+    // Trigger lifesteal
+    this.applyLifesteal(damage);
+  }
+
+  /**
+   * Apply synergy effect to enemy
+   */
+  private applySynergyEffect(enemy: Enemy, synergy: SynergyResult, baseDamage: number): void {
+    // Emit event for UI feedback
+    this.synergyEvents.emit('synergy_triggered', {
+      synergy,
+      enemyId: enemy.instanceId,
+      enemyPosition: { x: enemy.x, y: enemy.y },
+    });
+
+    console.log(`[SkillSystem] Synergy triggered: ${synergy.name} (${synergy.effect})`);
+
+    switch (synergy.effect) {
+      case 'true_damage_percent':
+        // True damage as percentage of base damage
+        const trueDamage = Math.floor(baseDamage * (synergy.value || 0.2));
+        enemy.takeDamage(trueDamage);
+        break;
+
+      case 'freeze':
+        enemy.addStatusEffect({
+          type: 'freeze',
+          value: 0,
+          duration: synergy.duration || 3000,
+          remainingTime: synergy.duration || 3000,
+          source: 'synergy',
+        });
+        break;
+
+      case 'stun':
+        enemy.addStatusEffect({
+          type: 'stun',
+          value: 0,
+          duration: synergy.duration || 1500,
+          remainingTime: synergy.duration || 1500,
+          source: 'synergy',
+        });
+        break;
+
+      case 'slow':
+        enemy.addStatusEffect({
+          type: 'slow',
+          value: synergy.value || 0.3,
+          duration: synergy.duration || 3000,
+          remainingTime: synergy.duration || 3000,
+          source: 'synergy',
+        });
+        break;
+
+      case 'root':
+        enemy.addStatusEffect({
+          type: 'root',
+          value: 0,
+          duration: synergy.duration || 2000,
+          remainingTime: synergy.duration || 2000,
+          source: 'synergy',
+        });
+        break;
+
+      case 'double_damage':
+        // Apply additional damage equal to base damage
+        enemy.takeDamage(baseDamage);
+        break;
+
+      case 'explosion':
+        // Area damage around enemy (simplified - just extra damage for now)
+        const explosionDamage = Math.floor(baseDamage * (synergy.value || 1.0));
+        enemy.takeDamage(explosionDamage);
+        // Could expand to hit nearby enemies
+        break;
+
+      case 'lifesteal':
+        // Heal player
+        const healAmount = Math.floor(baseDamage * (synergy.value || 0.3));
+        this.player.heal(healAmount);
+        break;
+
+      case 'guaranteed_crit':
+        // Extra damage as guaranteed crit bonus
+        const critBonus = Math.floor(baseDamage * (synergy.value || 0.5));
+        enemy.takeDamage(critBonus);
+        break;
+
+      // Default cases - log for debugging
+      case 'chain_boost':
+      case 'spread_debuff':
+      case 'dispel_and_damage':
+      case 'damage_increase':
+      case 'burn_spread':
+      case 'lava_zone':
+      case 'damage_to_shield':
+      case 'damage_boost_no_heal':
+      case 'cooldown_refresh':
+      case 'knockup':
+      case 'refract_damage':
+      case 'death_explosion':
+      case 'tick_speed_double':
+      case 'split_3':
+      case 'defense_reduce':
+      case 'heal_zone':
+      case 'barrier':
+      case 'true_damage_confuse':
+        console.log(`[SkillSystem] Synergy effect '${synergy.effect}' not yet implemented`);
+        break;
+
+      default:
+        console.log(`[SkillSystem] Unknown synergy effect: ${synergy.effect}`);
+    }
+  }
+
   update(delta: number, enemies: Phaser.Physics.Arcade.Group): void {
     if (!this.player.active) return;
 
     const activeEnemyCount = enemies.countActive(true);
     if (activeEnemyCount === 0) {
       return;
     }
 
     // 更新技能冷却
     this.player.update(delta);
 
     // 检查每个技能是否可以释放
+    // Note: Ultimate skills are NOT auto-cast; they must be triggered via useUltimate()
     for (const skill of this.player.skills) {
+      // Skip ultimate skills for auto-cast
+      if (skill.type === 'ultimate') {
+        continue;
+      }
+
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
 
+  /**
+   * Manually cast an ultimate skill by skill ID
+   * Returns true if the skill was cast successfully, false otherwise
+   * @param skillId The ID of the ultimate skill to cast
+   * @param enemies The enemy group to target (required for finding targets)
+   */
+  useUltimate(skillId: string, enemies: Phaser.Physics.Arcade.Group): boolean {
+    if (!this.player.active) return false;
+
+    // Find the skill
+    const skill = this.player.skills.find(s => s.id === skillId);
+    if (!skill) {
+      console.warn(`[SkillSystem] Skill not found: ${skillId}`);
+      return false;
+    }
+
+    // Verify it's an ultimate
+    if (skill.type !== 'ultimate') {
+      console.warn(`[SkillSystem] Skill ${skillId} is not an ultimate skill`);
+      return false;
+    }
+
+    // Check cooldown
+    const cooldown = this.player.skillCooldowns.get(skill.id) || 0;
+    if (cooldown > 0) {
+      console.log(`[SkillSystem] Ultimate ${skillId} is on cooldown: ${cooldown}ms`);
+      return false;
+    }
+
+    // Find target for ultimate
+    const target = this.findTarget(skill, enemies);
+
+    if (!target) {
+      console.log(`[SkillSystem] No valid target for ultimate`);
+      return false;
+    }
+
+    // Cast the ultimate
+    this.castSkill(skill, target);
+    console.log(`[SkillSystem] Ultimate ${skill.name} cast!`);
+    return true;
+  }
+
   private findTarget(
     skill: Skill,
     enemies: Phaser.Physics.Arcade.Group
   ): Enemy | null {
     const activeEnemies = enemies.getChildren().filter(
       (e) => (e as Enemy).active
     ) as Enemy[];
 
     if (activeEnemies.length === 0) return null;
 
@@ -299,25 +520,22 @@ export class SkillSystem {
       // 其他范围技能：立即造成伤害
       const bodies = this.scene.physics.overlapCirc(
         this.player.x,
         this.player.y,
         skill.rangeValue
       ) as Phaser.Physics.Arcade.Body[];
 
       for (const body of bodies) {
         const enemy = body.gameObject as Enemy;
         // 确保是敌人对象且拥有 config 属性
-        if (enemy && enemy.active && enemy.config && enemy.takeDamage) {
-          enemy.takeDamage(damage);
-          this.applyEffects(enemy, skill.effects);
-          // 触发生命偷取
-          this.applyLifesteal(damage);
+        if (enemy && enemy.active && enemy.config) {
+          this.applyDamageToEnemy(enemy, damage, skill);
         }
       }
     }
   }
 
   /**
    * 释放召唤技能
    */
   private castSummon(skill: Skill): void {
     // 创建一个临时精灵跟随玩家攻击
@@ -355,23 +573,22 @@ export class SkillSystem {
 
         // 寻找最近敌人攻击
         const enemies = this.scene.physics.overlapCirc(
           spirit.x,
           spirit.y,
           skill.rangeValue
         ) as Phaser.Physics.Arcade.Body[];
 
         for (const body of enemies) {
           const enemy = body.gameObject as Enemy;
-          if (enemy && enemy.active && enemy.config && enemy.takeDamage) {
-            enemy.takeDamage(damage);
-            this.applyLifesteal(damage);
+          if (enemy && enemy.active && enemy.config) {
+            this.applyDamageToEnemy(enemy, damage, skill);
 
             // 攻击视觉效果
             const beam = this.scene.add.graphics();
             beam.lineStyle(2, 0xffff00, 0.8);
             beam.lineBetween(spirit.x, spirit.y, enemy.x, enemy.y);
             this.scene.time.delayedCall(100, () => beam.destroy());
             break; // 每次只攻击一个
           }
         }
       },
@@ -446,24 +663,26 @@ export class SkillSystem {
         }
 
         const bodies = this.scene.physics.overlapCirc(
           centerX,
           centerY,
           radius
         ) as Phaser.Physics.Arcade.Body[];
 
         for (const body of bodies) {
           const enemy = body.gameObject as Enemy;
-          if (enemy && enemy.active && enemy.config && enemy.takeDamage) {
+          if (enemy && enemy.active && enemy.config) {
             // 伤害
             const tickDamage = Math.floor(damage * 0.4);
-            enemy.takeDamage(tickDamage);
+            // Apply with element for counter bonus
+            const skillElement = skill.elements[0] || skill.element;
+            enemy.takeDamage(tickDamage, skillElement);
             this.applyLifesteal(tickDamage);
 
             // 吸引效果 - 向中心移动
             const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, centerX, centerY);
             enemy.x += Math.cos(angle) * 20;
             enemy.y += Math.sin(angle) * 20;
           }
         }
       },
       repeat: Math.floor(duration / tickInterval) - 1,
@@ -475,44 +694,41 @@ export class SkillSystem {
    */
   private castTimeStop(skill: Skill, damage: number): void {
     const bodies = this.scene.physics.overlapCirc(
       this.player.x,
       this.player.y,
       skill.rangeValue
     ) as Phaser.Physics.Arcade.Body[];
 
     for (const body of bodies) {
       const enemy = body.gameObject as Enemy;
-      if (enemy && enemy.active && enemy.config && enemy.takeDamage) {
-        enemy.takeDamage(damage);
-        this.applyEffects(enemy, skill.effects);
-        this.applyLifesteal(damage);
+      if (enemy && enemy.active && enemy.config) {
+        this.applyDamageToEnemy(enemy, damage, skill);
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
-      if (enemy && enemy.active && enemy.config && enemy.takeDamage) {
-        enemy.takeDamage(damage);
-        this.applyLifesteal(damage);
+      if (enemy && enemy.active && enemy.config) {
+        this.applyDamageToEnemy(enemy, damage, skill);
       }
     }
 
     // 治疗自己
     const healEffect = skill.effects.find(e => e.type === 'heal');
     if (healEffect) {
       this.player.heal(healEffect.value);
     }
   }
 
@@ -521,23 +737,22 @@ export class SkillSystem {
    */
   private castGroundSpike(skill: Skill, damage: number): void {
     const bodies = this.scene.physics.overlapCirc(
       this.player.x,
       this.player.y,
       skill.rangeValue
     ) as Phaser.Physics.Arcade.Body[];
 
     for (const body of bodies) {
       const enemy = body.gameObject as Enemy;
-      if (enemy && enemy.active && enemy.config && enemy.takeDamage) {
-        enemy.takeDamage(damage);
-        this.applyLifesteal(damage);
+      if (enemy && enemy.active && enemy.config) {
+        this.applyDamageToEnemy(enemy, damage, skill);
 
         // 击退效果
         const angle = Phaser.Math.Angle.Between(
           this.player.x,
           this.player.y,
           enemy.x,
           enemy.y
         );
         enemy.x += Math.cos(angle) * 50;
         enemy.y += Math.sin(angle) * 50;
@@ -567,23 +782,26 @@ export class SkillSystem {
 
         // 检测范围内敌人
         const bodies = this.scene.physics.overlapCirc(
           centerX,
           centerY,
           radius
         ) as Phaser.Physics.Arcade.Body[];
 
         for (const body of bodies) {
           const enemy = body.gameObject as Enemy;
-          if (enemy && enemy.active && enemy.config && enemy.takeDamage) {
+          if (enemy && enemy.active && enemy.config) {
             const tickDamage = Math.floor(damage * 0.3); // 每次造成30%伤害
-            enemy.takeDamage(tickDamage);
+            // Apply with element for counter bonus
+            const skillElement = skill.elements[0] || skill.element;
+            enemy.takeDamage(tickDamage, skillElement);
+            // Apply freeze effect from skill
             this.applyEffects(enemy, skill.effects);
             this.applyLifesteal(tickDamage);
           }
         }
       },
       repeat: Math.floor(duration / tickInterval) - 1,
     });
   }
 
   /**
@@ -614,24 +832,22 @@ export class SkillSystem {
 
         // 检测雷击位置的敌人
         const bodies = this.scene.physics.overlapCirc(
           strikeX,
           strikeY,
           50 // 雷击半径
         ) as Phaser.Physics.Arcade.Body[];
 
         for (const body of bodies) {
           const enemy = body.gameObject as Enemy;
-          if (enemy && enemy.active && enemy.config && enemy.takeDamage) {
-            enemy.takeDamage(damage);
-            this.applyEffects(enemy, skill.effects);
-            this.applyLifesteal(damage);
+          if (enemy && enemy.active && enemy.config) {
+            this.applyDamageToEnemy(enemy, damage, skill);
           }
         }
       },
       repeat: strikeCount - 1,
     });
   }
 
   /**
    * 释放毒雾 - 持续伤害
    */
@@ -654,23 +870,25 @@ export class SkillSystem {
 
         // 检测范围内敌人
         const bodies = this.scene.physics.overlapCirc(
           centerX,
           centerY,
           radius
         ) as Phaser.Physics.Arcade.Body[];
 
         for (const body of bodies) {
           const enemy = body.gameObject as Enemy;
-          if (enemy && enemy.active && enemy.config && enemy.takeDamage) {
+          if (enemy && enemy.active && enemy.config) {
             const tickDamage = Math.floor(damage * 0.3); // 每次造成30%伤害
-            enemy.takeDamage(tickDamage);
+            // Apply with element for counter bonus
+            const skillElement = skill.elements[0] || skill.element;
+            enemy.takeDamage(tickDamage, skillElement);
             // 中毒效果 - 变绿
             enemy.setTint(0x44ff44);
             this.applyLifesteal(tickDamage);
           }
         }
       },
       repeat: Math.floor(duration / tickInterval) - 1,
     });
   }
 
@@ -678,62 +896,92 @@ export class SkillSystem {
    * 触发生命偷取
    */
   private applyLifesteal(damage: number): void {
     const lifestealPercent = this.player.stats.lifesteal || 0;
     if (lifestealPercent > 0) {
       const healAmount = Math.floor(damage * lifestealPercent);
       this.player.heal(healAmount);
     }
   }
 
+  /**
+   * Apply skill effects to enemy using enemy's addStatusEffect method
+   */
   private applyEffects(enemy: Enemy, effects: Skill['effects']): void {
     for (const effect of effects) {
-      if (effect.type === 'burn') {
-        this.applyBurn(enemy, effect.value, effect.duration || 3000);
-      } else if (effect.type === 'freeze') {
-        this.applyFreeze(enemy, effect.duration || 1000);
-      }
-    }
-  }
-
-  private applyBurn(enemy: Enemy, damagePerSec: number, duration: number): void {
-    const tickDamage = damagePerSec;
-    const ticks = Math.floor(duration / 1000);
-
-    let ticksRemaining = ticks;
-    const burnTimer = this.scene.time.addEvent({
-      delay: 1000,
-      callback: () => {
-        if (enemy.active) {
-          enemy.takeDamage(tickDamage);
-        }
-        ticksRemaining--;
-        if (ticksRemaining <= 0) {
-          burnTimer.destroy();
-        }
-      },
-      repeat: ticks - 1,
-    });
-  }
-
-  private applyFreeze(enemy: Enemy, duration: number): void {
-    // 确保敌人和 config 存在
-    if (!enemy || !enemy.config) return;
+      // Convert skill effect to status effect
+      const statusEffect: StatusEffect = {
+        type: effect.type as StatusEffect['type'],
+        value: effect.value,
+        duration: effect.duration || 3000,
+        remainingTime: effect.duration || 3000,
+        source: 'skill',
+      };
 
-    const originalSpeed = enemy.config.speed;
-    enemy.config.speed *= 0.3;
+      switch (effect.type) {
+        case 'burn':
+          enemy.addStatusEffect({
+            type: 'burn',
+            value: effect.value,
+            duration: effect.duration || 3000,
+            remainingTime: effect.duration || 3000,
+            source: 'skill',
+          });
+          break;
+
+        case 'freeze':
+          enemy.addStatusEffect({
+            type: 'freeze',
+            value: 0,
+            duration: effect.duration || 1000,
+            remainingTime: effect.duration || 1000,
+            source: 'skill',
+          });
+          break;
+
+        case 'stun':
+          enemy.addStatusEffect({
+            type: 'stun',
+            value: 0,
+            duration: effect.duration || 1000,
+            remainingTime: effect.duration || 1000,
+            source: 'skill',
+          });
+          break;
+
+        case 'poison':
+          enemy.addStatusEffect({
+            type: 'poison',
+            value: effect.value,
+            duration: effect.duration || 3000,
+            remainingTime: effect.duration || 3000,
+            source: 'skill',
+          });
+          break;
+
+        case 'slow':
+          enemy.addStatusEffect({
+            type: 'slow',
+            value: effect.value, // value is the slow percentage (e.g., 0.3 = 30% slow)
+            duration: effect.duration || 2000,
+            remainingTime: effect.duration || 2000,
+            source: 'skill',
+          });
+          break;
 
-    this.scene.time.delayedCall(duration, () => {
-      if (enemy.active && enemy.config) {
-        enemy.config.speed = originalSpeed;
+        default:
+          // Other effects like heal, shield, knockback are handled separately
+          break;
       }
-    });
+    }
   }
 
+  // Legacy methods removed - status effects now handled via enemy.addStatusEffect()
+
   getProjectiles(): Phaser.Physics.Arcade.Group {
     return this.projectiles;
   }
 
   destroy(): void {
     this.projectiles.destroy(true);
   }
 }
