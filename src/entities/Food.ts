// src/entities/Food.ts
import Phaser from 'phaser';
import { FoodConfig, Rarity } from '@/types';

// Rarity-based glow colors
const RARITY_COLORS: Record<Rarity, number> = {
  common: 0xffffff,
  rare: 0x4a9eff,
  epic: 0xa855f7,
  legendary: 0xffd700,
  mythic: 0xff6b9d,
};

// Rarity-based scale
const RARITY_SCALE: Record<Rarity, number> = {
  common: 1.0,
  rare: 1.1,
  epic: 1.2,
  legendary: 1.4,
  mythic: 1.5,
};

export class Food extends Phaser.Physics.Arcade.Sprite {
  private config: FoodConfig;
  private player: Phaser.Physics.Arcade.Sprite;
  private lifespan: number = 10000; // 10 seconds
  private spawnTime: number;
  private isAttracting: boolean = false;
  private attractSpeed: number = 200;
  private attractRange: number = 50;
  private glowSprite: Phaser.GameObjects.Sprite | null = null;
  private emojiText: Phaser.GameObjects.Text | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: FoodConfig,
    player: Phaser.Physics.Arcade.Sprite
  ) {
    super(scene, x, y, 'food_' + config.rarity);

    this.config = config;
    this.player = player;
    this.spawnTime = scene.time.now;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Set up physics body
    this.setCollideWorldBounds(false);
    this.body?.setSize(24, 24);
    this.setDepth(45);

    // Apply rarity-based scale
    this.setScale(RARITY_SCALE[config.rarity]);

    // Create visual effects
    this.createGlowEffect();
    this.createEmojiText();

    // Floating animation
    this.createFloatingAnimation();
  }

  private createGlowEffect(): void {
    const glowColor = RARITY_COLORS[this.config.rarity];

    // Create glow sprite
    this.glowSprite = this.scene.add.sprite(this.x, this.y, 'food_glow');
    this.glowSprite.setTint(glowColor);
    this.glowSprite.setAlpha(0.6);
    this.glowSprite.setScale(RARITY_SCALE[this.config.rarity] * 1.5);
    this.glowSprite.setDepth(44);

    // Pulsing glow animation
    this.scene.tweens.add({
      targets: this.glowSprite,
      alpha: { from: 0.4, to: 0.8 },
      scale: {
        from: RARITY_SCALE[this.config.rarity] * 1.4,
        to: RARITY_SCALE[this.config.rarity] * 1.6,
      },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }

  private createEmojiText(): void {
    // Display emoji as text overlay
    this.emojiText = this.scene.add.text(this.x, this.y, this.config.emoji, {
      fontSize: '20px',
    });
    this.emojiText.setOrigin(0.5);
    this.emojiText.setDepth(46);
  }

  private createFloatingAnimation(): void {
    // Gentle floating effect
    this.scene.tweens.add({
      targets: this,
      y: this.y - 5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  getPlayer(): Phaser.Physics.Arcade.Sprite {
    return this.player;
  }

  getConfig(): FoodConfig {
    return this.config;
  }

  update(_delta: number): void {
    // Check lifespan
    const elapsed = this.scene.time.now - this.spawnTime;
    if (elapsed >= this.lifespan) {
      this.destroy();
      return;
    }

    // Fade out near end of life
    const remainingLife = this.lifespan - elapsed;
    if (remainingLife < 2000) {
      const alpha = remainingLife / 2000;
      this.setAlpha(alpha);
      if (this.glowSprite) this.glowSprite.setAlpha(alpha * 0.6);
      if (this.emojiText) this.emojiText.setAlpha(alpha);
    }

    // Calculate distance to player
    const distance = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      this.player.x,
      this.player.y
    );

    // Attract to player within range
    if (distance < this.attractRange) {
      this.isAttracting = true;

      // Move towards player with acceleration
      const angle = Phaser.Math.Angle.Between(
        this.x,
        this.y,
        this.player.x,
        this.player.y
      );

      // Increase speed as we get closer
      const speedMultiplier = 1 + (1 - distance / this.attractRange) * 2;
      const speed = this.attractSpeed * speedMultiplier;

      this.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );
    } else if (this.isAttracting) {
      // Stop attracting when player moves out of range
      this.isAttracting = false;
      this.setVelocity(0, 0);
    }

    // Update visual positions
    if (this.glowSprite) {
      this.glowSprite.setPosition(this.x, this.y);
    }
    if (this.emojiText) {
      this.emojiText.setPosition(this.x, this.y);
    }
  }

  /**
   * Called when player picks up the food
   * Returns heal amount and applies special effects
   */
  onPickup(player: Phaser.Physics.Arcade.Sprite & { heal: (amount: number) => void; stats: { currentHp: number; maxHp: number } }): void {
    // Apply healing
    if (this.config.special === 'full_heal') {
      player.heal(player.stats.maxHp);
    } else {
      player.heal(this.config.healAmount);
    }

    // Apply special effects
    if (this.config.special === 'clear_debuff') {
      // Emit event for debuff clearing
      this.scene.events.emit('clearDebuffs');
    }

    // Pickup effect
    this.createPickupEffect();

    // Destroy the food
    this.destroy();
  }

  private createPickupEffect(): void {
    // Create brief flash effect
    const flash = this.scene.add.circle(this.x, this.y, 20, RARITY_COLORS[this.config.rarity], 0.8);
    flash.setDepth(100);

    this.scene.tweens.add({
      targets: flash,
      scale: 2,
      alpha: 0,
      duration: 200,
      onComplete: () => flash.destroy(),
    });

    // Emit pickup event
    this.scene.events.emit('foodPickedUp', this.config);
  }

  destroy(): void {
    if (this.glowSprite) {
      this.glowSprite.destroy();
      this.glowSprite = null;
    }
    if (this.emojiText) {
      this.emojiText.destroy();
      this.emojiText = null;
    }
    super.destroy();
  }
}
