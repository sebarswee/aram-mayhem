diff --git a/src/entities/ExpOrb.ts b/src/entities/ExpOrb.ts
new file mode 100644
index 0000000..8333b2f
--- /dev/null
+++ b/src/entities/ExpOrb.ts
@@ -0,0 +1,277 @@
+// src/entities/ExpOrb.ts
+import Phaser from 'phaser';
+import { ExpOrbConfig } from '@/types';
+
+// Size-based configurations
+const SIZE_CONFIG: Record<ExpOrbConfig['size'], { radius: number; color: number; glowScale: number }> = {
+  small: { radius: 6, color: 0x66ffff, glowScale: 1.5 },
+  medium: { radius: 10, color: 0x44ffff, glowScale: 1.8 },
+  large: { radius: 16, color: 0x00ffff, glowScale: 2.2 },
+};
+
+// Value mapping for sizes
+const SIZE_VALUES: Record<ExpOrbConfig['size'], number> = {
+  small: 1,
+  medium: 5,
+  large: 20,
+};
+
+export class ExpOrb extends Phaser.Physics.Arcade.Sprite {
+  private value: number;
+  private size: ExpOrbConfig['size'];
+  private player: Phaser.Physics.Arcade.Sprite;
+  private attractRange: number;
+  private isAttracting: boolean = false;
+  private attractSpeed: number = 150;
+  private glowSprite: Phaser.GameObjects.Sprite | null = null;
+  private particles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
+
+  constructor(
+    scene: Phaser.Scene,
+    x: number,
+    y: number,
+    config: ExpOrbConfig,
+    player: Phaser.Physics.Arcade.Sprite
+  ) {
+    super(scene, x, y, 'exp_orb_' + config.size);
+
+    this.value = config.value;
+    this.size = config.size;
+    this.player = player;
+    this.attractRange = config.attractRange;
+
+    scene.add.existing(this);
+    scene.physics.add.existing(this);
+
+    // Set up physics body
+    this.setCollideWorldBounds(false);
+    const sizeData = SIZE_CONFIG[config.size];
+    this.body?.setSize(sizeData.radius * 2, sizeData.radius * 2);
+    this.setDepth(40);
+
+    // Create visual effects
+    this.createGlowEffect();
+    this.createParticleTrail();
+  }
+
+  private createGlowEffect(): void {
+    const sizeData = SIZE_CONFIG[this.size];
+
+    // Create glow sprite
+    this.glowSprite = this.scene.add.sprite(this.x, this.y, 'exp_orb_glow');
+    this.glowSprite.setTint(sizeData.color);
+    this.glowSprite.setAlpha(0.5);
+    this.glowSprite.setScale(sizeData.glowScale);
+    this.glowSprite.setDepth(39);
+
+    // Pulsing glow animation
+    this.scene.tweens.add({
+      targets: this.glowSprite,
+      alpha: { from: 0.3, to: 0.7 },
+      scale: {
+        from: sizeData.glowScale * 0.9,
+        to: sizeData.glowScale * 1.1,
+      },
+      duration: 600,
+      yoyo: true,
+      repeat: -1,
+    });
+  }
+
+  private createParticleTrail(): void {
+    // Create particle trail when moving
+    const sizeData = SIZE_CONFIG[this.size];
+
+    // Check if particle texture exists, if not skip
+    if (!this.scene.textures.exists('particle_cyan')) {
+      return;
+    }
+
+    this.particles = this.scene.add.particles(this.x, this.y, 'particle_cyan', {
+      speed: { min: 10, max: 30 },
+      scale: { start: sizeData.glowScale * 0.3, end: 0 },
+      alpha: { start: 0.6, end: 0 },
+      tint: sizeData.color,
+      lifespan: 300,
+      frequency: 50,
+      emitting: false, // Start not emitting, enable when attracting
+    });
+    this.particles.setDepth(38);
+  }
+
+  getPlayer(): Phaser.Physics.Arcade.Sprite {
+    return this.player;
+  }
+
+  getValue(): number {
+    return this.value;
+  }
+
+  getSize(): ExpOrbConfig['size'] {
+    return this.size;
+  }
+
+  /**
+   * Merge with another orb to increase value
+   * Returns true if merge was successful
+   */
+  canMergeWith(other: ExpOrb): boolean {
+    const mergeDistance = 30;
+    const distance = Phaser.Math.Distance.Between(this.x, this.y, other.x, other.y);
+    return distance < mergeDistance;
+  }
+
+  mergeWith(other: ExpOrb): void {
+    // Increase value
+    this.value += other.getValue();
+
+    // Upgrade size if value exceeds threshold
+    if (this.value >= 20 && this.size !== 'large') {
+      this.upgradeSize('large');
+    } else if (this.value >= 5 && this.size === 'small') {
+      this.upgradeSize('medium');
+    }
+
+    // Destroy the merged orb
+    other.destroy();
+  }
+
+  private upgradeSize(newSize: ExpOrbConfig['size']): void {
+    this.size = newSize;
+    const sizeData = SIZE_CONFIG[newSize];
+
+    // Update texture
+    this.setTexture('exp_orb_' + newSize);
+
+    // Update glow
+    if (this.glowSprite) {
+      this.glowSprite.setScale(sizeData.glowScale);
+      this.glowSprite.setTint(sizeData.color);
+    }
+
+    // Update physics body
+    this.body?.setSize(sizeData.radius * 2, sizeData.radius * 2);
+  }
+
+  update(_delta: number): void {
+    // Calculate distance to player
+    const distance = Phaser.Math.Distance.Between(
+      this.x,
+      this.y,
+      this.player.x,
+      this.player.y
+    );
+
+    // Attract to player within range (magnet effect)
+    if (distance < this.attractRange) {
+      this.isAttracting = true;
+
+      // Enable particles if available
+      if (this.particles && !this.particles.emitting) {
+        this.particles.emitting = true;
+      }
+
+      // Move towards player with acceleration
+      const angle = Phaser.Math.Angle.Between(
+        this.x,
+        this.y,
+        this.player.x,
+        this.player.y
+      );
+
+      // Increase speed as we get closer (magnet effect)
+      const speedMultiplier = 1 + (1 - distance / this.attractRange) * 3;
+      const speed = this.attractSpeed * speedMultiplier;
+
+      this.setVelocity(
+        Math.cos(angle) * speed,
+        Math.sin(angle) * speed
+      );
+    } else if (this.isAttracting) {
+      // Stop attracting when player moves out of range
+      this.isAttracting = false;
+      this.setVelocity(0, 0);
+
+      // Disable particles
+      if (this.particles) {
+        this.particles.emitting = false;
+      }
+    }
+
+    // Update visual positions
+    if (this.glowSprite) {
+      this.glowSprite.setPosition(this.x, this.y);
+    }
+    if (this.particles) {
+      this.particles.setPosition(this.x, this.y);
+    }
+  }
+
+  /**
+   * Called when player picks up the exp orb
+   * Emits event with the exp value
+   */
+  onPickup(): void {
+    // Create pickup effect
+    this.createPickupEffect();
+
+    // Emit pickup event with exp value
+    this.scene.events.emit('expOrbPickedUp', this.value);
+
+    // Destroy the orb
+    this.destroy();
+  }
+
+  private createPickupEffect(): void {
+    const sizeData = SIZE_CONFIG[this.size];
+
+    // Create brief flash effect
+    const flash = this.scene.add.circle(this.x, this.y, sizeData.radius * 2, sizeData.color, 0.8);
+    flash.setDepth(100);
+
+    this.scene.tweens.add({
+      targets: flash,
+      scale: 3,
+      alpha: 0,
+      duration: 150,
+      onComplete: () => flash.destroy(),
+    });
+  }
+
+  destroy(): void {
+    if (this.glowSprite) {
+      this.glowSprite.destroy();
+      this.glowSprite = null;
+    }
+    if (this.particles) {
+      this.particles.destroy();
+      this.particles = null;
+    }
+    super.destroy();
+  }
+}
+
+/**
+ * Factory function to create ExpOrb with appropriate value based on size
+ */
+export function createExpOrbConfig(value: number): ExpOrbConfig {
+  let size: ExpOrbConfig['size'];
+  let attractRange: number;
+
+  if (value >= 20) {
+    size = 'large';
+    attractRange = 120;
+  } else if (value >= 5) {
+    size = 'medium';
+    attractRange = 110;
+  } else {
+    size = 'small';
+    attractRange = 100;
+  }
+
+  return {
+    value,
+    size,
+    attractRange,
+  };
+}
diff --git a/src/entities/Food.ts b/src/entities/Food.ts
new file mode 100644
index 0000000..5acaa07
--- /dev/null
+++ b/src/entities/Food.ts
@@ -0,0 +1,232 @@
+// src/entities/Food.ts
+import Phaser from 'phaser';
+import { FoodConfig, Rarity } from '@/types';
+
+// Rarity-based glow colors
+const RARITY_COLORS: Record<Rarity, number> = {
+  common: 0xffffff,
+  rare: 0x4a9eff,
+  epic: 0xa855f7,
+  legendary: 0xffd700,
+  mythic: 0xff6b9d,
+};
+
+// Rarity-based scale
+const RARITY_SCALE: Record<Rarity, number> = {
+  common: 1.0,
+  rare: 1.1,
+  epic: 1.2,
+  legendary: 1.4,
+  mythic: 1.5,
+};
+
+export class Food extends Phaser.Physics.Arcade.Sprite {
+  private config: FoodConfig;
+  private player: Phaser.Physics.Arcade.Sprite;
+  private lifespan: number = 10000; // 10 seconds
+  private spawnTime: number;
+  private isAttracting: boolean = false;
+  private attractSpeed: number = 200;
+  private attractRange: number = 50;
+  private glowSprite: Phaser.GameObjects.Sprite | null = null;
+  private emojiText: Phaser.GameObjects.Text | null = null;
+
+  constructor(
+    scene: Phaser.Scene,
+    x: number,
+    y: number,
+    config: FoodConfig,
+    player: Phaser.Physics.Arcade.Sprite
+  ) {
+    super(scene, x, y, 'food_' + config.rarity);
+
+    this.config = config;
+    this.player = player;
+    this.spawnTime = scene.time.now;
+
+    scene.add.existing(this);
+    scene.physics.add.existing(this);
+
+    // Set up physics body
+    this.setCollideWorldBounds(false);
+    this.body?.setSize(24, 24);
+    this.setDepth(45);
+
+    // Apply rarity-based scale
+    this.setScale(RARITY_SCALE[config.rarity]);
+
+    // Create visual effects
+    this.createGlowEffect();
+    this.createEmojiText();
+
+    // Floating animation
+    this.createFloatingAnimation();
+  }
+
+  private createGlowEffect(): void {
+    const glowColor = RARITY_COLORS[this.config.rarity];
+
+    // Create glow sprite
+    this.glowSprite = this.scene.add.sprite(this.x, this.y, 'food_glow');
+    this.glowSprite.setTint(glowColor);
+    this.glowSprite.setAlpha(0.6);
+    this.glowSprite.setScale(RARITY_SCALE[this.config.rarity] * 1.5);
+    this.glowSprite.setDepth(44);
+
+    // Pulsing glow animation
+    this.scene.tweens.add({
+      targets: this.glowSprite,
+      alpha: { from: 0.4, to: 0.8 },
+      scale: {
+        from: RARITY_SCALE[this.config.rarity] * 1.4,
+        to: RARITY_SCALE[this.config.rarity] * 1.6,
+      },
+      duration: 800,
+      yoyo: true,
+      repeat: -1,
+    });
+  }
+
+  private createEmojiText(): void {
+    // Display emoji as text overlay
+    this.emojiText = this.scene.add.text(this.x, this.y, this.config.emoji, {
+      fontSize: '20px',
+    });
+    this.emojiText.setOrigin(0.5);
+    this.emojiText.setDepth(46);
+  }
+
+  private createFloatingAnimation(): void {
+    // Gentle floating effect
+    this.scene.tweens.add({
+      targets: this,
+      y: this.y - 5,
+      duration: 1000,
+      yoyo: true,
+      repeat: -1,
+      ease: 'Sine.easeInOut',
+    });
+  }
+
+  getPlayer(): Phaser.Physics.Arcade.Sprite {
+    return this.player;
+  }
+
+  getConfig(): FoodConfig {
+    return this.config;
+  }
+
+  update(_delta: number): void {
+    // Check lifespan
+    const elapsed = this.scene.time.now - this.spawnTime;
+    if (elapsed >= this.lifespan) {
+      this.destroy();
+      return;
+    }
+
+    // Fade out near end of life
+    const remainingLife = this.lifespan - elapsed;
+    if (remainingLife < 2000) {
+      const alpha = remainingLife / 2000;
+      this.setAlpha(alpha);
+      if (this.glowSprite) this.glowSprite.setAlpha(alpha * 0.6);
+      if (this.emojiText) this.emojiText.setAlpha(alpha);
+    }
+
+    // Calculate distance to player
+    const distance = Phaser.Math.Distance.Between(
+      this.x,
+      this.y,
+      this.player.x,
+      this.player.y
+    );
+
+    // Attract to player within range
+    if (distance < this.attractRange) {
+      this.isAttracting = true;
+
+      // Move towards player with acceleration
+      const angle = Phaser.Math.Angle.Between(
+        this.x,
+        this.y,
+        this.player.x,
+        this.player.y
+      );
+
+      // Increase speed as we get closer
+      const speedMultiplier = 1 + (1 - distance / this.attractRange) * 2;
+      const speed = this.attractSpeed * speedMultiplier;
+
+      this.setVelocity(
+        Math.cos(angle) * speed,
+        Math.sin(angle) * speed
+      );
+    } else if (this.isAttracting) {
+      // Stop attracting when player moves out of range
+      this.isAttracting = false;
+      this.setVelocity(0, 0);
+    }
+
+    // Update visual positions
+    if (this.glowSprite) {
+      this.glowSprite.setPosition(this.x, this.y);
+    }
+    if (this.emojiText) {
+      this.emojiText.setPosition(this.x, this.y);
+    }
+  }
+
+  /**
+   * Called when player picks up the food
+   * Returns heal amount and applies special effects
+   */
+  onPickup(player: Phaser.Physics.Arcade.Sprite & { heal: (amount: number) => void; stats: { currentHp: number; maxHp: number } }): void {
+    // Apply healing
+    if (this.config.special === 'full_heal') {
+      player.heal(player.stats.maxHp);
+    } else {
+      player.heal(this.config.healAmount);
+    }
+
+    // Apply special effects
+    if (this.config.special === 'clear_debuff') {
+      // Emit event for debuff clearing
+      this.scene.events.emit('clearDebuffs');
+    }
+
+    // Pickup effect
+    this.createPickupEffect();
+
+    // Destroy the food
+    this.destroy();
+  }
+
+  private createPickupEffect(): void {
+    // Create brief flash effect
+    const flash = this.scene.add.circle(this.x, this.y, 20, RARITY_COLORS[this.config.rarity], 0.8);
+    flash.setDepth(100);
+
+    this.scene.tweens.add({
+      targets: flash,
+      scale: 2,
+      alpha: 0,
+      duration: 200,
+      onComplete: () => flash.destroy(),
+    });
+
+    // Emit pickup event
+    this.scene.events.emit('foodPickedUp', this.config);
+  }
+
+  destroy(): void {
+    if (this.glowSprite) {
+      this.glowSprite.destroy();
+      this.glowSprite = null;
+    }
+    if (this.emojiText) {
+      this.emojiText.destroy();
+      this.emojiText = null;
+    }
+    super.destroy();
+  }
+}
diff --git a/src/graphics/GraphicsFactory.ts b/src/graphics/GraphicsFactory.ts
index de53307..c43b1cd 100644
--- a/src/graphics/GraphicsFactory.ts
+++ b/src/graphics/GraphicsFactory.ts
@@ -14,20 +14,22 @@ export class GraphicsFactory {
   /**
    * 生成所有游戏素材
    */
   generateAll(): void {
     this.createPlayerSprite();
     this.createEnemySprites();
     this.createProjectileSprites();
     this.createEffectSprites();
     this.createParticles();
     this.createSkillIcons();
+    this.createFoodSprites();
+    this.createExpOrbSprites();
   }
 
   /**
    * 只生成技能图标
    */
   generateSkillIcons(): void {
     this.createSkillIcons();
   }
 
   /**
@@ -616,11 +618,165 @@ export class GraphicsFactory {
 
   /**
    * 颜色变亮
    */
   private lighten(color: number, amount: number): number {
     const r = Math.min(255, Math.floor(((color >> 16) & 0xff) * (1 + amount)));
     const g = Math.min(255, Math.floor(((color >> 8) & 0xff) * (1 + amount)));
     const b = Math.min(255, Math.floor((color & 0xff) * (1 + amount)));
     return (r << 16) | (g << 8) | b;
   }
+
+  /**
+   * 创建食物精灵
+   */
+  private createFoodSprites(): void {
+    // 食物发光背景
+    this.createFoodGlowSprite();
+
+    // 按稀有度创建食物
+    const rarityColors: Record<string, number> = {
+      common: 0x88ff88,
+      rare: 0x4a9eff,
+      epic: 0xa855f7,
+      legendary: 0xffd700,
+      mythic: 0xff6b9d,
+    };
+
+    for (const [rarity, color] of Object.entries(rarityColors)) {
+      this.createFoodSprite(`food_${rarity}`, color);
+    }
+  }
+
+  /**
+   * 创建单个食物精灵
+   */
+  private createFoodSprite(key: string, color: number): void {
+    const size = 32;
+    const graphics = this.scene.add.graphics();
+
+    // 外层光晕
+    graphics.fillStyle(color, 0.4);
+    graphics.fillCircle(size / 2, size / 2, 12);
+
+    // 主体圆形
+    graphics.fillStyle(color, 0.8);
+    graphics.fillCircle(size / 2, size / 2, 8);
+
+    // 核心高光
+    graphics.fillStyle(0xffffff, 0.9);
+    graphics.fillCircle(size / 2 - 2, size / 2 - 2, 3);
+
+    graphics.generateTexture(key, size, size);
+    graphics.destroy();
+  }
+
+  /**
+   * 创建食物发光精灵
+   */
+  private createFoodGlowSprite(): void {
+    const size = 48;
+    const graphics = this.scene.add.graphics();
+
+    // 多层发光效果
+    graphics.fillStyle(0xffffff, 0.2);
+    graphics.fillCircle(size / 2, size / 2, 20);
+
+    graphics.fillStyle(0xffffff, 0.3);
+    graphics.fillCircle(size / 2, size / 2, 14);
+
+    graphics.fillStyle(0xffffff, 0.4);
+    graphics.fillCircle(size / 2, size / 2, 8);
+
+    graphics.generateTexture('food_glow', size, size);
+    graphics.destroy();
+  }
+
+  /**
+   * 创建经验球精灵
+   */
+  private createExpOrbSprites(): void {
+    // 经验球发光背景
+    this.createExpOrbGlowSprite();
+
+    // 青色粒子（用于拖尾效果）
+    this.createCyanParticle();
+
+    // 三种尺寸的经验球
+    const sizes: Array<{ name: string; radius: number; color: number }> = [
+      { name: 'small', radius: 6, color: 0x66ffff },
+      { name: 'medium', radius: 10, color: 0x44ffff },
+      { name: 'large', radius: 16, color: 0x00ffff },
+    ];
+
+    for (const { name, radius, color } of sizes) {
+      this.createExpOrbSprite(`exp_orb_${name}`, radius, color);
+    }
+  }
+
+  /**
+   * 创建单个经验球精灵
+   */
+  private createExpOrbSprite(key: string, radius: number, color: number): void {
+    const size = radius * 2 + 8;
+    const graphics = this.scene.add.graphics();
+    const center = size / 2;
+
+    // 外层光晕
+    graphics.fillStyle(color, 0.3);
+    graphics.fillCircle(center, center, radius + 3);
+
+    // 主体
+    graphics.fillStyle(color, 0.8);
+    graphics.fillCircle(center, center, radius);
+
+    // 核心 - 更亮的中心
+    graphics.fillStyle(0xffffff, 0.9);
+    graphics.fillCircle(center, center, radius * 0.5);
+
+    // 高光点
+    graphics.fillStyle(0xffffff, 1);
+    graphics.fillCircle(center - radius * 0.3, center - radius * 0.3, radius * 0.25);
+
+    graphics.generateTexture(key, size, size);
+    graphics.destroy();
+  }
+
+  /**
+   * 创建经验球发光精灵
+   */
+  private createExpOrbGlowSprite(): void {
+    const size = 40;
+    const graphics = this.scene.add.graphics();
+    const center = size / 2;
+
+    // 多层发光效果
+    graphics.fillStyle(0x00ffff, 0.15);
+    graphics.fillCircle(center, center, 18);
+
+    graphics.fillStyle(0x00ffff, 0.25);
+    graphics.fillCircle(center, center, 12);
+
+    graphics.fillStyle(0x00ffff, 0.35);
+    graphics.fillCircle(center, center, 6);
+
+    graphics.generateTexture('exp_orb_glow', size, size);
+    graphics.destroy();
+  }
+
+  /**
+   * 创建青色粒子（经验球拖尾用）
+   */
+  private createCyanParticle(): void {
+    const size = 12;
+    const graphics = this.scene.add.graphics();
+
+    graphics.fillStyle(0x00ffff, 0.8);
+    graphics.fillCircle(size / 2, size / 2, 4);
+
+    graphics.fillStyle(0xffffff, 0.6);
+    graphics.fillCircle(size / 2, size / 2, 2);
+
+    graphics.generateTexture('particle_cyan', size, size);
+    graphics.destroy();
+  }
 }
