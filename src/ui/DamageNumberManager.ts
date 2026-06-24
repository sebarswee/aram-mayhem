import Phaser from 'phaser';

/**
 * Damage number display configuration
 */
interface DamageNumberConfig {
  value: number;
  x: number;
  y: number;
  color?: number;
  fontSize?: string;
  isCrit?: boolean;
  isPlayer?: boolean;
}

/**
 * Damage Number Manager - displays floating damage numbers
 *
 * Features:
 * - Floating text with fade-out animation
 * - Different colors for crit, player damage, counter hit
 * - Prevents overlap by staggering positions
 */
export class DamageNumberManager {
  private scene: Phaser.Scene;
  private activeNumbers: Phaser.GameObjects.Text[] = [];
  private maxActive: number = 50;  // Limit active numbers for performance

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Show damage number at position
   */
  showDamage(config: DamageNumberConfig): void {
    // Limit active numbers
    if (this.activeNumbers.length >= this.maxActive) {
      const oldest = this.activeNumbers.shift();
      if (oldest) oldest.destroy();
    }

    const { value, x, y, isCrit, isPlayer } = config;

    // Determine color and size based on type
    let color: string;
    let fontSize: string;
    let strokeColor: string;

    if (isPlayer) {
      // Player damage - red
      color = '#ff4444';
      fontSize = isCrit ? '24px' : '18px';
      strokeColor = '#000000';
    } else if (isCrit) {
      // Critical hit - yellow/gold
      color = '#ffcc00';
      fontSize = '28px';
      strokeColor = '#ff8800';
    } else {
      // Normal damage - white
      color = '#ffffff';
      fontSize = '20px';
      strokeColor = '#000000';
    }

    // Add small random offset to prevent stacking
    const offsetX = (Math.random() - 0.5) * 20;
    const offsetY = -20 + (Math.random() - 0.5) * 10;

    // Create text
    const text = this.scene.add.text(
      x + offsetX,
      y + offsetY,
      Math.floor(value).toString(),
      {
        fontSize,
        color,
        fontStyle: isCrit ? 'bold' : 'normal',
        stroke: strokeColor,
        strokeThickness: isCrit ? 4 : 2,
      }
    );
    text.setOrigin(0.5);
    text.setDepth(150);  // High depth to be visible above everything

    // Add "!" suffix for crit
    if (isCrit) {
      text.setText(Math.floor(value).toString() + '!');
    }

    this.activeNumbers.push(text);

    // Animation: rise up, fade out, and destroy
    this.scene.tweens.add({
      targets: text,
      y: y + offsetY - 40,
      alpha: 0,
      scale: isCrit ? 1.2 : 0.8,
      duration: 600,
      ease: 'Power2',
      onComplete: () => {
        text.destroy();
        const index = this.activeNumbers.indexOf(text);
        if (index > -1) {
          this.activeNumbers.splice(index, 1);
        }
      },
    });

    // Initial scale animation for crit
    if (isCrit) {
      this.scene.tweens.add({
        targets: text,
        scale: { from: 1.5, to: 1.2 },
        duration: 100,
      });
    }
  }

  /**
   * Show damage on enemy (called from Enemy.takeDamage)
   */
  showEnemyDamage(x: number, y: number, value: number, isCrit: boolean = false, isCounter: boolean = false): void {
    this.showDamage({
      value,
      x,
      y,
      isCrit,
      isPlayer: false,
      color: isCounter ? 0x44ffff : undefined,  // Cyan for counter hit
    });
  }

  /**
   * Show damage on player (called from Player.takeDamage)
   */
  showPlayerDamage(x: number, y: number, value: number): void {
    this.showDamage({
      value,
      x,
      y,
      isPlayer: true,
    });
  }

  /**
   * Show heal number (green)
   */
  showHeal(x: number, y: number, value: number): void {
    const offsetX = (Math.random() - 0.5) * 20;
    const offsetY = -30;

    const text = this.scene.add.text(
      x + offsetX,
      y + offsetY,
      '+' + Math.floor(value).toString(),
      {
        fontSize: '18px',
        color: '#44ff44',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2,
      }
    );
    text.setOrigin(0.5);
    text.setDepth(150);

    this.scene.tweens.add({
      targets: text,
      y: y + offsetY - 30,
      alpha: 0,
      duration: 500,
      onComplete: () => text.destroy(),
    });
  }

  /**
   * Show shield gained (blue)
   */
  showShield(x: number, y: number, value: number): void {
    const offsetX = (Math.random() - 0.5) * 20;
    const offsetY = -30;

    const text = this.scene.add.text(
      x + offsetX,
      y + offsetY,
      '+' + Math.floor(value).toString() + '🛡',
      {
        fontSize: '16px',
        color: '#4488ff',
        stroke: '#000000',
        strokeThickness: 2,
      }
    );
    text.setOrigin(0.5);
    text.setDepth(150);

    this.scene.tweens.add({
      targets: text,
      y: y + offsetY - 25,
      alpha: 0,
      duration: 500,
      onComplete: () => text.destroy(),
    });
  }

  /**
   * Clear all active numbers
   */
  clear(): void {
    for (const text of this.activeNumbers) {
      text.destroy();
    }
    this.activeNumbers = [];
  }

  /**
   * Clean up
   */
  destroy(): void {
    this.clear();
  }
}