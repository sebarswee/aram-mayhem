// src/entities/ExpOrb.ts
import Phaser from 'phaser';
import { ExpOrbConfig } from '@/types';

// Size-based configurations
const SIZE_CONFIG: Record<ExpOrbConfig['size'], { radius: number; color: number; glowScale: number }> = {
  small: { radius: 6, color: 0x66ffff, glowScale: 1.5 },
  medium: { radius: 10, color: 0x44ffff, glowScale: 1.8 },
  large: { radius: 16, color: 0x00ffff, glowScale: 2.2 },
};

// Value mapping for sizes
const SIZE_VALUES: Record<ExpOrbConfig['size'], number> = {
  small: 1,
  medium: 5,
  large: 20,
};

export class ExpOrb extends Phaser.Physics.Arcade.Sprite {
  private value: number;
  private size: ExpOrbConfig['size'];
  private player: Phaser.Physics.Arcade.Sprite;
  private attractRange: number;
  private isAttracting: boolean = false;
  private attractSpeed: number = 150;
  private glowSprite: Phaser.GameObjects.Sprite | null = null;
  private particles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: ExpOrbConfig,
    player: Phaser.Physics.Arcade.Sprite
  ) {
    super(scene, x, y, 'exp_orb_' + config.size);

    this.value = config.value;
    this.size = config.size;
    this.player = player;
    this.attractRange = config.attractRange;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Set up physics body
    this.setCollideWorldBounds(false);
    const sizeData = SIZE_CONFIG[config.size];
    this.body?.setSize(sizeData.radius * 2, sizeData.radius * 2);
    this.setDepth(40);

    // Create visual effects
    this.createGlowEffect();
    this.createParticleTrail();
  }

  private createGlowEffect(): void {
    const sizeData = SIZE_CONFIG[this.size];

    // Create glow sprite
    this.glowSprite = this.scene.add.sprite(this.x, this.y, 'exp_orb_glow');
    this.glowSprite.setTint(sizeData.color);
    this.glowSprite.setAlpha(0.5);
    this.glowSprite.setScale(sizeData.glowScale);
    this.glowSprite.setDepth(39);

    // Pulsing glow animation
    this.scene.tweens.add({
      targets: this.glowSprite,
      alpha: { from: 0.3, to: 0.7 },
      scale: {
        from: sizeData.glowScale * 0.9,
        to: sizeData.glowScale * 1.1,
      },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });
  }

  private createParticleTrail(): void {
    // Create particle trail when moving
    const sizeData = SIZE_CONFIG[this.size];

    // Check if particle texture exists, if not skip
    if (!this.scene.textures.exists('particle_cyan')) {
      return;
    }

    this.particles = this.scene.add.particles(this.x, this.y, 'particle_cyan', {
      speed: { min: 10, max: 30 },
      scale: { start: sizeData.glowScale * 0.3, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: sizeData.color,
      lifespan: 300,
      frequency: 50,
      emitting: false, // Start not emitting, enable when attracting
    });
    this.particles.setDepth(38);
  }

  getPlayer(): Phaser.Physics.Arcade.Sprite {
    return this.player;
  }

  getValue(): number {
    return this.value;
  }

  getSize(): ExpOrbConfig['size'] {
    return this.size;
  }

  /**
   * Merge with another orb to increase value
   * Returns true if merge was successful
   */
  canMergeWith(other: ExpOrb): boolean {
    const mergeDistance = 30;
    const distance = Phaser.Math.Distance.Between(this.x, this.y, other.x, other.y);
    return distance < mergeDistance;
  }

  mergeWith(other: ExpOrb): void {
    // Increase value
    this.value += other.getValue();

    // Upgrade size if value exceeds threshold
    if (this.value >= 20 && this.size !== 'large') {
      this.upgradeSize('large');
    } else if (this.value >= 5 && this.size === 'small') {
      this.upgradeSize('medium');
    }

    // Destroy the merged orb
    other.destroy();
  }

  private upgradeSize(newSize: ExpOrbConfig['size']): void {
    this.size = newSize;
    const sizeData = SIZE_CONFIG[newSize];

    // Update texture
    this.setTexture('exp_orb_' + newSize);

    // Update glow
    if (this.glowSprite) {
      this.glowSprite.setScale(sizeData.glowScale);
      this.glowSprite.setTint(sizeData.color);
    }

    // Update physics body
    this.body?.setSize(sizeData.radius * 2, sizeData.radius * 2);
  }

  update(_delta: number): void {
    // Calculate distance to player
    const distance = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      this.player.x,
      this.player.y
    );

    // Attract to player within range (magnet effect)
    if (distance < this.attractRange) {
      this.isAttracting = true;

      // Enable particles if available
      if (this.particles && !this.particles.emitting) {
        this.particles.emitting = true;
      }

      // Move towards player with acceleration
      const angle = Phaser.Math.Angle.Between(
        this.x,
        this.y,
        this.player.x,
        this.player.y
      );

      // Increase speed as we get closer (magnet effect)
      const speedMultiplier = 1 + (1 - distance / this.attractRange) * 3;
      const speed = this.attractSpeed * speedMultiplier;

      this.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );
    } else if (this.isAttracting) {
      // Stop attracting when player moves out of range
      this.isAttracting = false;
      this.setVelocity(0, 0);

      // Disable particles
      if (this.particles) {
        this.particles.emitting = false;
      }
    }

    // Update visual positions
    if (this.glowSprite) {
      this.glowSprite.setPosition(this.x, this.y);
    }
    if (this.particles) {
      this.particles.setPosition(this.x, this.y);
    }
  }

  /**
   * Called when player picks up the exp orb
   * Emits event with the exp value
   */
  onPickup(): void {
    // Create pickup effect
    this.createPickupEffect();

    // Emit pickup event with exp value
    this.scene.events.emit('expOrbPickedUp', this.value);

    // Destroy the orb
    this.destroy();
  }

  private createPickupEffect(): void {
    const sizeData = SIZE_CONFIG[this.size];

    // Create brief flash effect
    const flash = this.scene.add.circle(this.x, this.y, sizeData.radius * 2, sizeData.color, 0.8);
    flash.setDepth(100);

    this.scene.tweens.add({
      targets: flash,
      scale: 3,
      alpha: 0,
      duration: 150,
      onComplete: () => flash.destroy(),
    });
  }

  destroy(): void {
    if (this.glowSprite) {
      this.glowSprite.destroy();
      this.glowSprite = null;
    }
    if (this.particles) {
      this.particles.destroy();
      this.particles = null;
    }
    super.destroy();
  }
}

/**
 * Factory function to create ExpOrb with appropriate value based on size
 */
export function createExpOrbConfig(value: number): ExpOrbConfig {
  let size: ExpOrbConfig['size'];
  let attractRange: number;

  if (value >= 20) {
    size = 'large';
    attractRange = 120;
  } else if (value >= 5) {
    size = 'medium';
    attractRange = 110;
  } else {
    size = 'small';
    attractRange = 100;
  }

  return {
    value,
    size,
    attractRange,
  };
}
