import Phaser from 'phaser';
import { GraphicsFactory } from '@/graphics/GraphicsFactory';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // 背景
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRect(0, 0, width, height);

    // 标题
    const titleText = this.add.text(width / 2, height / 2 - 80, '🎮 技能乱斗', {
      font: 'bold 48px Arial',
      color: '#66ccff',
      stroke: '#000000',
      strokeThickness: 4,
    });
    titleText.setOrigin(0.5, 0.5);

    // 副标题
    const subtitleText = this.add.text(width / 2, height / 2 - 30, 'Skill Brawl', {
      font: '24px Arial',
      color: '#aaaaaa',
    });
    subtitleText.setOrigin(0.5, 0.5);

    // 生成素材进度文字
    const loadingText = this.add.text(width / 2, height / 2 + 40, '生成像素素材...', {
      font: '16px Arial',
      color: '#888888',
    });
    loadingText.setOrigin(0.5, 0.5);
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 生成所有像素风格视觉素材
    const graphicsFactory = new GraphicsFactory(this);
    graphicsFactory.generateAll();

    // 初始化全局游戏状态
    this.registry.set('gameState', this.createInitialState());

    // 创建开始按钮
    this.createStartButton(width, height);
  }

  private createStartButton(width: number, height: number): void {
    // 按钮背景
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(0x4a7db8, 1);
    buttonBg.fillRoundedRect(width / 2 - 100, height / 2 + 60, 200, 50, 10);
    buttonBg.lineStyle(3, 0x66ccff, 1);
    buttonBg.strokeRoundedRect(width / 2 - 100, height / 2 + 60, 200, 50, 10);

    // 按钮文字
    const buttonText = this.add.text(width / 2, height / 2 + 85, '开始游戏', {
      font: 'bold 24px Arial',
      color: '#ffffff',
    });
    buttonText.setOrigin(0.5, 0.5);

    // 按钮交互区域
    const hitArea = this.add.rectangle(width / 2, height / 2 + 85, 200, 50, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });

    // 悬停效果
    hitArea.on('pointerover', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0x5a8dc8, 1);
      buttonBg.fillRoundedRect(width / 2 - 100, height / 2 + 60, 200, 50, 10);
      buttonBg.lineStyle(3, 0x88ddff, 1);
      buttonBg.strokeRoundedRect(width / 2 - 100, height / 2 + 60, 200, 50, 10);
    });

    hitArea.on('pointerout', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0x4a7db8, 1);
      buttonBg.fillRoundedRect(width / 2 - 100, height / 2 + 60, 200, 50, 10);
      buttonBg.lineStyle(3, 0x66ccff, 1);
      buttonBg.strokeRoundedRect(width / 2 - 100, height / 2 + 60, 200, 50, 10);
    });

    // 点击开始游戏
    hitArea.on('pointerdown', () => {
      // 点击动画
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('BattleScene');
      });
    });

    // 提示文字
    const tipText = this.add.text(width / 2, height - 50, 'WASD / 方向键 移动 | 点击任意位置开始', {
      font: '14px Arial',
      color: '#666666',
    });
    tipText.setOrigin(0.5, 0.5);

    // 键盘也可以开始
    this.input.keyboard?.once('keydown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('BattleScene');
      });
    });
  }

  private createInitialState() {
    return {
      stats: {
        maxHp: 100,
        currentHp: 100,
        attack: 10,
        defense: 5,
        speed: 200,
        critRate: 0.05,
        critDamage: 1.5,
      },
      skills: [],
      runes: [],
      level: 1,
      exp: 0,
      expToNext: 10,
      wave: 1,
      kills: 0,
      bossesKilled: 0,
      isPaused: false,
      isDead: false,
      isUpgrading: false,
    };
  }
}
