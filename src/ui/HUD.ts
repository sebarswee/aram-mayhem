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
  private hpBar!: Phaser.GameObjects.Graphics;
  private hpText!: Phaser.GameObjects.Text;
  private expBar!: Phaser.GameObjects.Graphics;
  private levelText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private killsText!: Phaser.GameObjects.Text;

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
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const padding = Math.min(20, width * 0.03);
    const barWidth = Math.min(200, width * 0.3);
    const barHeight = Math.min(20, height * 0.03);

    // HP条背景
    this.hpBar = this.scene.add.graphics();
    this.hpBar.setScrollFactor(0);
    this.hpBar.setDepth(100);

    // HP文字
    const fontSize = Math.min(14, width / 50);
    this.hpText = this.scene.add.text(
      padding + barWidth / 2,
      padding + barHeight / 2,
      '',
      { fontSize: `${fontSize}px`, color: '#ffffff' }
    );
    this.hpText.setOrigin(0.5, 0.5);
    this.hpText.setScrollFactor(0);
    this.hpText.setDepth(101);

    // 经验条背景
    this.expBar = this.scene.add.graphics();
    this.expBar.setScrollFactor(0);
    this.expBar.setDepth(100);

    // 等级文字
    const levelFontSize = Math.min(18, width / 35);
    this.levelText = this.scene.add.text(
      padding,
      padding + barHeight + 10,
      'Lv.1',
      { fontSize: `${levelFontSize}px`, color: '#ffcc00', fontStyle: 'bold' }
    );
    this.levelText.setScrollFactor(0);
    this.levelText.setDepth(101);

    // 波次文字
    const infoFontSize = Math.min(20, width / 30);
    this.waveText = this.scene.add.text(
      width - padding,
      padding,
      '波次: 1',
      { fontSize: `${infoFontSize}px`, color: '#ffffff' }
    );
    this.waveText.setOrigin(1, 0);
    this.waveText.setScrollFactor(0);
    this.waveText.setDepth(101);

    // 击杀数文字
    const killsFontSize = Math.min(16, width / 40);
    this.killsText = this.scene.add.text(
      width - padding,
      padding + infoFontSize + 10,
      '击杀: 0',
      { fontSize: `${killsFontSize}px`, color: '#ff4444' }
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
    const width = this.scene.scale.width;
    const padding = Math.min(20, width * 0.03);
    const barWidth = Math.min(200, width * 0.3);
    const barHeight = Math.min(20, this.scene.scale.height * 0.03);
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
    this.hpText.setPosition(padding + barWidth / 2, padding + barHeight / 2);
    this.hpText.setText(
      `${Math.floor(this.player.stats.currentHp)} / ${this.player.stats.maxHp}`
    );
  }

  private updateExpBar(): void {
    const width = this.scene.scale.width;
    const padding = Math.min(20, width * 0.03);
    const barWidth = Math.min(200, width * 0.3);
    const barHeight = Math.min(12, this.scene.scale.height * 0.02);
    const yOffset = Math.min(55, this.scene.scale.height * 0.08);
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
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const padding = Math.min(20, width * 0.03);
    const infoFontSize = Math.min(20, width / 30);

    this.levelText.setText(`Lv.${this.gameState.level}`);

    // 更新波次和击杀位置
    this.waveText.setPosition(width - padding, padding);
    this.waveText.setFontSize(infoFontSize);
    this.waveText.setText(`波次: ${this.gameState.wave}`);

    this.killsText.setPosition(width - padding, padding + infoFontSize + 10);
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
