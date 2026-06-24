import Phaser from 'phaser';
import { Enemy } from '@/entities/Enemy';
import { BossPhase } from '@/types';

/**
 * Boss Controller - manages boss phases and phase transitions
 *
 * Features:
 * - Phase detection based on HP threshold
 * - Phase transition effects
 * - Ability unlocking per phase
 */
export class BossController {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Check and handle phase transitions for all bosses
   */
  checkPhaseTransition(boss: Enemy): void {
    if (!boss.bossPhases || boss.bossPhases.length === 0) return;

    const hpPercent = boss.getHpPercentage();
    const phases = boss.bossPhases;

    // Find the appropriate phase based on current HP
    // Phases are ordered by hpThreshold descending (100 -> 50 -> 20)
    for (let i = phases.length - 1; i >= 0; i--) {
      const phase = phases[i];

      // If HP is below threshold and not already in this phase
      if (hpPercent <= phase.hpThreshold && boss.bossPhase < phase.phase) {
        this.transitionToPhase(boss, phase);
        break;
      }
    }
  }

  /**
   * Transition boss to a new phase
   */
  private transitionToPhase(boss: Enemy, phase: BossPhase): void {
    const previousPhase = boss.bossPhase;
    boss.bossPhase = phase.phase;

    // Apply phase modifiers
    if (phase.damageMultiplier !== 1.0) {
      const baseDamage = boss.config.damage / (boss.isEnraged ? 1.5 : 1);
      boss.config.damage = Math.floor(baseDamage * phase.damageMultiplier);
    }

    if (phase.speedMultiplier !== 1.0) {
      const baseSpeed = boss.config.speed / (boss.isEnraged ? 1.3 : 1);
      boss.config.speed = Math.floor(baseSpeed * phase.speedMultiplier);
    }

    // Handle special behaviors
    if (phase.specialBehavior === 'rage' && !boss.isEnraged) {
      boss.activateRage({});
    }

    // Show phase transition effect
    this.showPhaseTransitionEffect(boss, previousPhase, phase.phase);

    // Emit event for UI
    this.scene.events.emit('bossPhaseChange', {
      boss,
      phase: phase.phase,
      hpThreshold: phase.hpThreshold,
    });
  }

  /**
   * Show visual effect for phase transition
   */
  private showPhaseTransitionEffect(boss: Enemy, fromPhase: number, toPhase: number): void {
    // Screen shake
    this.scene.cameras.main.shake(300, 0.02);

    // Color based on phase
    const phaseColors: Record<number, number> = {
      1: 0xffffff,
      2: 0xffff00,
      3: 0xff4444,
    };
    const color = phaseColors[toPhase] || 0xff0000;

    // Flash effect
    this.scene.cameras.main.flash(200, color >> 16, (color >> 8) & 0xff, color & 0xff);

    // Boss glow effect
    const glow = this.scene.add.circle(boss.x, boss.y, 50, color, 0.6);
    glow.setDepth(31);

    this.scene.tweens.add({
      targets: glow,
      scale: 2,
      alpha: 0,
      duration: 500,
      onComplete: () => glow.destroy(),
    });

    // Phase announcement text
    const phaseText = this.scene.add.text(
      this.scene.scale.width / 2,
      100,
      `Phase ${toPhase}`,
      {
        fontSize: '32px',
        color: '#ff4444',
        fontStyle: 'bold',
      }
    );
    phaseText.setScrollFactor(0);
    phaseText.setDepth(200);
    phaseText.setOrigin(0.5);

    this.scene.tweens.add({
      targets: phaseText,
      alpha: 0,
      y: 80,
      duration: 1500,
      onComplete: () => phaseText.destroy(),
    });

    // Pulse effect on boss
    const originalScale = boss.scaleX;
    this.scene.tweens.add({
      targets: boss,
      scale: originalScale * 1.2,
      duration: 200,
      yoyo: true,
      repeat: 2,
    });
  }

  /**
   * Show ability warning for boss abilities
   */
  showAbilityWarning(boss: Enemy, abilityType: string, target?: { x: number; y: number }): void {
    switch (abilityType) {
      case 'charge':
        if (target) {
          const line = this.scene.add.graphics();
          line.lineStyle(6, 0xff4444, 0.8);
          line.lineBetween(boss.x, boss.y, target.x, target.y);

          // Animated dash effect
          this.scene.tweens.add({
            targets: line,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: 4,
            onComplete: () => line.destroy(),
          });
        }
        break;

      case 'shoot':
        const glow = this.scene.add.circle(boss.x, boss.y, 40, 0xffff00, 0.5);
        glow.setStrokeStyle(3, 0xffff00, 0.8);
        glow.setDepth(31);

        this.scene.tweens.add({
          targets: glow,
          scale: 1.5,
          alpha: 0,
          duration: 200,
          yoyo: true,
          repeat: 1,
          onComplete: () => glow.destroy(),
        });
        break;

      case 'summon':
        const ring = this.scene.add.circle(boss.x, boss.y, 80, 0x8800ff, 0.3);
        ring.setStrokeStyle(4, 0x8800ff, 0.6);
        ring.setDepth(31);

        this.scene.tweens.add({
          targets: ring,
          scale: 1.3,
          alpha: 0,
          duration: 300,
          yoyo: true,
          repeat: 1,
          onComplete: () => ring.destroy(),
        });
        break;

      case 'rage':
        // Intense red pulsing
        const rageGlow = this.scene.add.circle(boss.x, boss.y, 60, 0xff0000, 0.7);
        rageGlow.setDepth(31);

        this.scene.tweens.add({
          targets: rageGlow,
          scale: 2,
          alpha: 0,
          duration: 400,
          onComplete: () => rageGlow.destroy(),
        });

        // Temporarily tint boss
        boss.setTint(0xff4444);
        this.scene.time.delayedCall(400, () => {
          if (boss.active) {
            boss.applyElementTint();
          }
        });
        break;
    }
  }
}