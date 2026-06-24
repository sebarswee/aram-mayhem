diff --git a/src/entities/Projectile.ts b/src/entities/Projectile.ts
index 07c68b5..bfb6f6f 100644
--- a/src/entities/Projectile.ts
+++ b/src/entities/Projectile.ts
@@ -1,22 +1,25 @@
 import Phaser from 'phaser';
 import { Skill, SkillEffect } from '@/types';
 import { PROJECTILE_LIFETIME } from '@/config/balance.config';
 
-// 元素到投射物纹理的映射
+// 元素到投射物纹理的映射（8元素系统）
 const ELEMENT_TEXTURE_MAP: Record<string, string> = {
   fire: 'projectile_fire',
+  water: 'projectile_water',
   ice: 'projectile_ice',
   lightning: 'projectile_lightning',
-  shadow: 'projectile_shadow',
   holy: 'projectile_holy',
-  physical: 'projectile_holy',
+  shadow: 'projectile_shadow',
+  grass: 'projectile_grass',
+  earth: 'projectile_earth',
+  physical: 'projectile_holy', // fallback for physical attacks
 };
 
 export interface ProjectileConfig {
   skill: Skill;
   damage: number;
   speed: number;
   range: number;
   isFromPlayer: boolean;
   color: number;
   creationTime?: number;  // 创建时间，用于碰撞保护（可选，会在构造函数中设置）
@@ -72,30 +75,133 @@ export class Projectile extends Phaser.Physics.Arcade.Sprite {
 
     // 创建尾迹粒子
     this.createTrailParticles(element);
   }
 
   private createTrailParticles(element: string): void {
     // 根据元素选择粒子纹理
     const particleTexture = `particle_${element}` as string;
     const texture = this.scene.textures.exists(particleTexture) ? particleTexture : 'particle_glow';
 
+    // 元素特定的粒子效果配置
+    const elementConfig = this.getElementParticleConfig(element);
+
     this.trailParticles = this.scene.add.particles(this.x, this.y, texture, {
-      speed: 20,
+      speed: elementConfig.speed,
+      scale: elementConfig.scale,
+      alpha: elementConfig.alpha,
+      tint: this.config.color,
+      lifespan: elementConfig.lifespan,
+      frequency: elementConfig.frequency,
+      quantity: elementConfig.quantity,
+      rotate: elementConfig.rotate,
+    });
+    this.trailParticles.setDepth(39);
+  }
+
+  /**
+   * 获取元素特定的粒子效果配置
+   */
+  private getElementParticleConfig(element: string): {
+    speed: { min: number; max: number };
+    scale: { start: number; end: number };
+    alpha: { start: number; end: number };
+    lifespan: number;
+    frequency: number;
+    quantity: number;
+    rotate?: { min: number; max: number };
+  } {
+    const configs: Record<string, ReturnType<typeof this.getElementParticleConfig>> = {
+      // 火焰：快速散开的火星
+      fire: {
+        speed: { min: 30, max: 60 },
+        scale: { start: 0.5, end: 0 },
+        alpha: { start: 0.8, end: 0 },
+        lifespan: 250,
+        frequency: 25,
+        quantity: 2,
+      },
+      // 水：缓慢扩散的水滴
+      water: {
+        speed: { min: 15, max: 30 },
+        scale: { start: 0.6, end: 0 },
+        alpha: { start: 0.6, end: 0 },
+        lifespan: 300,
+        frequency: 35,
+        quantity: 1,
+      },
+      // 冰：闪烁的冰晶
+      ice: {
+        speed: { min: 10, max: 25 },
+        scale: { start: 0.4, end: 0 },
+        alpha: { start: 0.9, end: 0 },
+        lifespan: 200,
+        frequency: 30,
+        quantity: 1,
+      },
+      // 闪电：快速闪烁的电弧
+      lightning: {
+        speed: { min: 50, max: 100 },
+        scale: { start: 0.3, end: 0 },
+        alpha: { start: 1, end: 0 },
+        lifespan: 150,
+        frequency: 20,
+        quantity: 3,
+        rotate: { min: 0, max: 360 },
+      },
+      // 神圣：金光闪烁
+      holy: {
+        speed: { min: 20, max: 40 },
+        scale: { start: 0.5, end: 0 },
+        alpha: { start: 0.8, end: 0 },
+        lifespan: 250,
+        frequency: 30,
+        quantity: 2,
+      },
+      // 暗影：紫色雾气
+      shadow: {
+        speed: { min: 10, max: 20 },
+        scale: { start: 0.7, end: 0 },
+        alpha: { start: 0.5, end: 0 },
+        lifespan: 350,
+        frequency: 40,
+        quantity: 1,
+      },
+      // 草：飘落的叶片
+      grass: {
+        speed: { min: 15, max: 35 },
+        scale: { start: 0.5, end: 0 },
+        alpha: { start: 0.7, end: 0 },
+        lifespan: 300,
+        frequency: 35,
+        quantity: 1,
+        rotate: { min: -180, max: 180 },
+      },
+      // 土：飞溅的碎石
+      earth: {
+        speed: { min: 25, max: 50 },
+        scale: { start: 0.4, end: 0 },
+        alpha: { start: 0.7, end: 0 },
+        lifespan: 250,
+        frequency: 35,
+        quantity: 2,
+      },
+    };
+
+    return configs[element] || {
+      speed: { min: 20, max: 40 },
       scale: { start: 0.4, end: 0 },
       alpha: { start: 0.6, end: 0 },
-      tint: this.config.color,
       lifespan: 200,
       frequency: 30,
       quantity: 1,
-    });
-    this.trailParticles.setDepth(39);
+    };
   }
 
   fire(angle: number): void {
     const velocityX = Math.cos(angle) * this.config.speed;
     const velocityY = Math.sin(angle) * this.config.speed;
     this.setVelocity(velocityX, velocityY);
     this.setRotation(angle);
   }
 
   update(_time: number): void {
@@ -135,31 +241,65 @@ export class Projectile extends Phaser.Physics.Arcade.Sprite {
 
   getEffects(): SkillEffect[] {
     return this.config.skill.effects;
   }
 
   isPlayerProjectile(): boolean {
     return this.config.isFromPlayer;
   }
 
   destroy(): void {
-    // 火球术爆炸效果
-    if (this.config.skill.id === 'fireball') {
-      this.createFireballExplosion();
-    }
+    // 根据元素类型创建不同的死亡效果
+    this.createElementDeathEffect();
 
     if (this.trailParticles) {
       this.trailParticles.destroy();
     }
     super.destroy();
   }
 
+  /**
+   * 创建元素死亡效果
+   */
+  private createElementDeathEffect(): void {
+    const element = this.config.skill.elements[0] || 'fire';
+
+    switch (element) {
+      case 'fire':
+        this.createFireballExplosion();
+        break;
+      case 'water':
+        this.createWaterRipple();
+        break;
+      case 'ice':
+        this.createIceShatter();
+        break;
+      case 'lightning':
+        this.createLightningFlash();
+        break;
+      case 'holy':
+        this.createHolyGlow();
+        break;
+      case 'shadow':
+        this.createShadowBurst();
+        break;
+      case 'grass':
+        this.createGrassLeaves();
+        break;
+      case 'earth':
+        this.createEarthRocks();
+        break;
+      default:
+        break;
+    }
+  }
+
   /**
    * 创建火球爆炸效果 - 范围伤害
    */
   private createFireballExplosion(): void {
     const explosionRadius = 60;
 
     // 爆炸视觉效果
     const explosion = this.scene.add.circle(this.x, this.y, 30, 0xff8800, 0.8);
     explosion.setDepth(41);
 
@@ -202,11 +342,273 @@ export class Projectile extends Phaser.Physics.Arcade.Sprite {
 
     for (const body of bodies) {
       const enemy = body.gameObject;
       // 只对敌人类型造成伤害
       if (enemy && enemy.active && 'takeDamage' in enemy && 'config' in enemy) {
         const explosionDamage = Math.floor(this.config.damage * 0.5); // 爆炸造成50%伤害
         (enemy as any).takeDamage(explosionDamage);
       }
     }
   }
+
+  /**
+   * 创建水波纹效果
+   */
+  private createWaterRipple(): void {
+    const ripple = this.scene.add.circle(this.x, this.y, 20, 0x4488ff, 0.5);
+    ripple.setDepth(41);
+
+    const ripple2 = this.scene.add.circle(this.x, this.y, 15, 0x66aaff, 0.6);
+    ripple2.setDepth(42);
+
+    this.scene.tweens.add({
+      targets: [ripple, ripple2],
+      scaleX: 3,
+      scaleY: 3,
+      alpha: 0,
+      duration: 300,
+      onComplete: () => {
+        ripple.destroy();
+        ripple2.destroy();
+      },
+    });
+
+    // 水滴粒子
+    const particles = this.scene.add.particles(this.x, this.y, 'particle_water', {
+      speed: { min: 40, max: 80 },
+      angle: { min: 0, max: 360 },
+      scale: { start: 0.4, end: 0 },
+      alpha: { start: 0.7, end: 0 },
+      lifespan: 400,
+      quantity: 8,
+      emitting: false,
+    });
+    particles.explode();
+    particles.setDepth(42);
+
+    this.scene.time.delayedCall(400, () => {
+      particles.destroy();
+    });
+  }
+
+  /**
+   * 创建冰碎裂效果
+   */
+  private createIceShatter(): void {
+    // 冰晶碎片
+    const shards: Phaser.GameObjects.Arc[] = [];
+    for (let i = 0; i < 6; i++) {
+      const angle = (i / 6) * Math.PI * 2;
+      const shard = this.scene.add.circle(
+        this.x + Math.cos(angle) * 5,
+        this.y + Math.sin(angle) * 5,
+        8,
+        0x88ddff,
+        0.8
+      );
+      shard.setDepth(41);
+      shards.push(shard);
+
+      this.scene.tweens.add({
+        targets: shard,
+        x: this.x + Math.cos(angle) * 40,
+        y: this.y + Math.sin(angle) * 40,
+        alpha: 0,
+        scale: 0.3,
+        duration: 200,
+        onComplete: () => shard.destroy(),
+      });
+    }
+
+    // 闪光效果
+    const flash = this.scene.add.circle(this.x, this.y, 25, 0xffffff, 0.9);
+    flash.setDepth(40);
+    this.scene.tweens.add({
+      targets: flash,
+      scale: 1.5,
+      alpha: 0,
+      duration: 150,
+      onComplete: () => flash.destroy(),
+    });
+  }
+
+  /**
+   * 创建闪电闪烁效果
+   */
+  private createLightningFlash(): void {
+    // 闪光
+    const flash = this.scene.add.circle(this.x, this.y, 30, 0xffff00, 0.9);
+    flash.setDepth(41);
+
+    // 电弧粒子
+    const particles = this.scene.add.particles(this.x, this.y, 'particle_lightning', {
+      speed: { min: 80, max: 150 },
+      angle: { min: 0, max: 360 },
+      scale: { start: 0.5, end: 0 },
+      alpha: { start: 1, end: 0 },
+      lifespan: 200,
+      quantity: 10,
+      emitting: false,
+    });
+    particles.explode();
+    particles.setDepth(42);
+
+    // 快速闪烁动画
+    this.scene.tweens.add({
+      targets: [flash],
+      alpha: 0,
+      scale: 1.5,
+      duration: 100,
+      yoyo: true,
+      repeat: 2,
+      onComplete: () => {
+        flash.destroy();
+        particles.destroy();
+      },
+    });
+  }
+
+  /**
+   * 创建神圣光芒效果
+   */
+  private createHolyGlow(): void {
+    // 金色光环
+    const ring = this.scene.add.circle(this.x, this.y, 25, 0xffcc00, 0.6);
+    ring.setDepth(41);
+
+    // 光芒粒子
+    const particles = this.scene.add.particles(this.x, this.y, 'particle_holy', {
+      speed: { min: 30, max: 60 },
+      angle: { min: 0, max: 360 },
+      scale: { start: 0.5, end: 0 },
+      alpha: { start: 0.8, end: 0 },
+      lifespan: 350,
+      quantity: 8,
+      emitting: false,
+    });
+    particles.explode();
+    particles.setDepth(42);
+
+    this.scene.tweens.add({
+      targets: ring,
+      scaleX: 2.5,
+      scaleY: 2.5,
+      alpha: 0,
+      duration: 300,
+      onComplete: () => {
+        ring.destroy();
+        particles.destroy();
+      },
+    });
+  }
+
+  /**
+   * 创建暗影爆发效果
+   */
+  private createShadowBurst(): void {
+    // 暗影雾气
+    const shadow = this.scene.add.circle(this.x, this.y, 35, 0x8800ff, 0.5);
+    shadow.setDepth(41);
+
+    // 紫色粒子
+    const particles = this.scene.add.particles(this.x, this.y, 'particle_shadow', {
+      speed: { min: 20, max: 50 },
+      angle: { min: 0, max: 360 },
+      scale: { start: 0.7, end: 0 },
+      alpha: { start: 0.6, end: 0 },
+      lifespan: 500,
+      quantity: 12,
+      emitting: false,
+    });
+    particles.explode();
+    particles.setDepth(42);
+
+    this.scene.tweens.add({
+      targets: shadow,
+      scaleX: 2,
+      scaleY: 2,
+      alpha: 0,
+      duration: 400,
+      onComplete: () => {
+        shadow.destroy();
+        particles.destroy();
+      },
+    });
+  }
+
+  /**
+   * 创建草叶飘落效果
+   */
+  private createGrassLeaves(): void {
+    // 绿色叶片粒子
+    const particles = this.scene.add.particles(this.x, this.y, 'particle_grass', {
+      speed: { min: 30, max: 60 },
+      angle: { min: 200, max: 340 },
+      scale: { start: 0.5, end: 0 },
+      alpha: { start: 0.8, end: 0 },
+      lifespan: 600,
+      quantity: 8,
+      rotate: { min: 0, max: 360 },
+      emitting: false,
+    });
+    particles.explode();
+    particles.setDepth(42);
+
+    // 绿色光环
+    const glow = this.scene.add.circle(this.x, this.y, 20, 0x44ff44, 0.4);
+    glow.setDepth(41);
+
+    this.scene.tweens.add({
+      targets: glow,
+      scale: 1.5,
+      alpha: 0,
+      duration: 300,
+      onComplete: () => {
+        glow.destroy();
+        particles.destroy();
+      },
+    });
+  }
+
+  /**
+   * 创建土石飞溅效果
+   */
+  private createEarthRocks(): void {
+    // 岩石碎片
+    const rocks: Phaser.GameObjects.Arc[] = [];
+    for (let i = 0; i < 5; i++) {
+      const angle = (i / 5) * Math.PI * 2 + Math.random() * 0.5;
+      const rock = this.scene.add.circle(
+        this.x,
+        this.y,
+        6 + Math.random() * 4,
+        0xaa8844,
+        0.9
+      );
+      rock.setDepth(41);
+      rocks.push(rock);
+
+      this.scene.tweens.add({
+        targets: rock,
+        x: this.x + Math.cos(angle) * 35,
+        y: this.y + Math.sin(angle) * 35,
+        alpha: 0,
+        scale: 0.5,
+        duration: 250,
+        onComplete: () => rock.destroy(),
+      });
+    }
+
+    // 尘土
+    const dust = this.scene.add.circle(this.x, this.y, 30, 0x886633, 0.4);
+    dust.setDepth(40);
+
+    this.scene.tweens.add({
+      targets: dust,
+      scaleX: 2,
+      scaleY: 2,
+      alpha: 0,
+      duration: 300,
+      onComplete: () => dust.destroy(),
+    });
+  }
 }
