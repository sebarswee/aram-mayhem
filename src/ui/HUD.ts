import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { GameState } from '@/types';
import { ExpSystem } from '@/systems/ExpSystem';
import { GAME_WIDTH } from '@/config/game.config';

export class HUD {
  private scene: Phaser.Scene;
  private player: Player;
  private gameState: GameState;
  private expSystem: ExpSystem;

  // UI元素
  private hpBar: Phaser.GameObjects.Graphics;
  private hpText: Phaser.GameObjects.Text;
  private expBar: Phaser.GameObjects.Graphics;
  private levelText: Phaser.GameObjects.Text;
  private waveText: Phaser.GameObjects.Text;
  private killsText: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    player: Player,
    gameState: GameState,
    expSystem: ExpSystem
  ) {
    this.scene = scene;
    this.player = player;
    this.gameState = gameState;
    this.expSystem = expSystem;

    this.createUI();
  }

  private createUI(): void {
    const padding = 20;
    const barWidth = 200;
    const barHeight = 20;

    // HP条背景
    this.hpBar = this.scene.add.graphics();
    this.hpBar.setScrollFactor(0);
    this.hpBar.setDepth(100);

    // HP文字
    this.hpText = this.scene.add.text(
      padding + barWidth / 2,
      padding + barHeight / 2,
      '',
      { fontSize: '14px', color: '#ffffff' }
    );
    this.hpText.setOrigin(0.5, 0.5);
    this.hpText.setScrollFactor(0);
    this.hpText.setDepth(101);

    // 经验条背景
    this.expBar = this.scene.add.graphics();
    this.expBar.setScrollFactor(0);
    this.expBar.setDepth(100);

    // 等级文字
    this.levelText = this.scene.add.text(
      padding,
      padding + barHeight + 10,
      'Lv.1',
      { fontSize: '18px', color: '#ffcc00', fontStyle: 'bold' }
    );
    this.levelText.setScrollFactor(0);
    this.levelText.setDepth(101);

    // 波次文字
    this.waveText = this.scene.add.text(
      GAME_WIDTH - padding,
      padding,
      '波次: 1',
      { fontSize: '20px', color: '#ffffff' }
    );
    this.waveText.setOrigin(1, 0);
    this.waveText.setScrollFactor(0);
    this.waveText.setDepth(101);

    // 击杀数文字
    this.killsText = this.scene.add.text(
      GAME_WIDTH - padding,
      padding + 30,
      '击杀: 0',
      { fontSize: '16px', color: '#ff4444' }
    );
    this.killsText.setOrigin(1, 0);
    this.killsText.setScrollFactor(0);
    this.killsText.setDepth(101);
  }

  update(): void {
    this.updateHpBar();
    this.updateExpBar();
    this.updateTexts();
  }

  private updateHpBar(): void {
    const padding = 20;
    const barWidth = 200;
    const barHeight = 20;
    const hpPercent = this.player.stats.currentHp / this.player.stats.maxHp;

    this.hpBar.clear();

    // 背景
    this.hpBar.fillStyle(0x333333, 1);
    this.hpBar.fillRect(padding, padding, barWidth, barHeight);

    // HP条
    this.hpBar.fillStyle(0xff0000, 1);
    this.hpBar.fillRect(padding, padding, barWidth * hpPercent, barHeight);

    // 边框
    this.hpBar.lineStyle(2, 0xffffff, 1);
    this.hpBar.strokeRect(padding, padding, barWidth, barHeight);

    // 文字
    this.hpText.setText(
      `${Math.floor(this.player.stats.currentHp)} / ${this.player.stats.maxHp}`
    );
  }

  private updateExpBar(): void {
    const padding = 20;
    const barWidth = 200;
    const barHeight = 12;
    const yOffset = 55;
    const expPercent = this.expSystem.getExpProgress();

    this.expBar.clear();

    // 背景
    this.expBar.fillStyle(0x333333, 1);
    this.expBar.fillRect(padding, yOffset, barWidth, barHeight);

    // 经验条
    this.expBar.fillStyle(0x00ff00, 1);
    this.expBar.fillRect(padding, yOffset, barWidth * expPercent, barHeight);

    // 边框
    this.expBar.lineStyle(1, 0xffffff, 0.5);
    this.expBar.strokeRect(padding, yOffset, barWidth, barHeight);
  }

  private updateTexts(): void {
    this.levelText.setText(`Lv.${this.gameState.level}`);
    this.waveText.setText(`波次: ${this.gameState.wave}`);
    this.killsText.setText(`击杀: ${this.gameState.kills}`);
  }

  destroy(): void {
    this.hpBar.destroy();
    this.hpText.destroy();
    this.expBar.destroy();
    this.levelText.destroy();
    this.waveText.destroy();
    this.killsText.destroy();
  }
}
