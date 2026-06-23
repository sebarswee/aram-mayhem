import Phaser from 'phaser';
import { GraphicsFactory } from '@/graphics/GraphicsFactory';
import { JoystickMode } from '@/ui/VirtualJoystick';

// 全局设置存储
declare global {
  interface Window {
    gameSettings: {
      joystickMode: JoystickMode;
    };
  }
}

export class BootScene extends Phaser.Scene {
  private joystickMode: JoystickMode = 'follow'; // 默认跟随手指模式

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

    // 初始化全局设置
    window.gameSettings = {
      joystickMode: this.joystickMode,
    };

    // 创建开始按钮
    this.createStartButton(width, height);

    // 创建设置按钮
    this.createSettingsButton(width, height);
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
    const tipText = this.add.text(width / 2, height - 50, 'WASD / 方向键 移动', {
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

  private createSettingsButton(width: number, height: number): void {
    // 设置按钮 - 右上角齿轮图标
    const settingsBtn = this.add.text(width - 60, 40, '⚙️', {
      font: '32px Arial',
    });
    settingsBtn.setOrigin(0.5, 0.5);
    settingsBtn.setInteractive({ useHandCursor: true });

    // 悬停效果
    settingsBtn.on('pointerover', () => {
      settingsBtn.setScale(1.2);
    });

    settingsBtn.on('pointerout', () => {
      settingsBtn.setScale(1);
    });

    // 点击打开设置
    settingsBtn.on('pointerdown', () => {
      this.showSettingsPanel(width, height);
    });
  }

  private showSettingsPanel(width: number, height: number): void {
    // 半透明背景
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    overlay.setDepth(100);
    overlay.setInteractive();

    // 设置面板
    const panel = this.add.graphics();
    panel.fillStyle(0x2a2a4e, 1);
    panel.fillRoundedRect(width / 2 - 200, height / 2 - 150, 400, 300, 15);
    panel.lineStyle(3, 0x66ccff, 1);
    panel.strokeRoundedRect(width / 2 - 200, height / 2 - 150, 400, 300, 15);
    panel.setDepth(101);

    // 标题
    const title = this.add.text(width / 2, height / 2 - 110, '⚙️ 设置', {
      font: 'bold 28px Arial',
      color: '#66ccff',
    });
    title.setOrigin(0.5, 0.5);
    title.setDepth(102);

    // 摇杆模式标题
    const modeTitle = this.add.text(width / 2, height / 2 - 50, '虚拟摇杆模式', {
      font: '20px Arial',
      color: '#ffffff',
    });
    modeTitle.setOrigin(0.5, 0.5);
    modeTitle.setDepth(102);

    // 跟随手指按钮
    const followBtn = this.createModeButton(
      width / 2 - 90,
      height / 2 + 10,
      '跟随手指',
      'follow',
      width,
      height
    );

    // 固定位置按钮
    const fixedBtn = this.createModeButton(
      width / 2 + 90,
      height / 2 + 10,
      '固定位置',
      'fixed',
      width,
      height
    );

    // 关闭按钮
    const closeBtn = this.add.text(width / 2, height / 2 + 100, '关闭', {
      font: '20px Arial',
      color: '#ff6666',
      backgroundColor: '#442222',
      padding: { x: 30, y: 10 },
    });
    closeBtn.setOrigin(0.5, 0.5);
    closeBtn.setDepth(102);
    closeBtn.setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
      overlay.destroy();
      panel.destroy();
      title.destroy();
      modeTitle.destroy();
      followBtn.destroy();
      fixedBtn.destroy();
      closeBtn.destroy();
    });
  }

  private createModeButton(
    x: number,
    y: number,
    text: string,
    mode: JoystickMode,
    _width: number,
    _height: number
  ): Phaser.GameObjects.Text {
    const isSelected = this.joystickMode === mode;
    const color = isSelected ? '#66ccff' : '#888888';
    const bgColor = isSelected ? '#224466' : '#333344';

    const button = this.add.text(x, y, text, {
      font: '18px Arial',
      color: color,
      backgroundColor: bgColor,
      padding: { x: 20, y: 10 },
    });
    button.setOrigin(0.5, 0.5);
    button.setDepth(102);
    button.setInteractive({ useHandCursor: true });

    button.on('pointerover', () => {
      if (this.joystickMode !== mode) {
        button.setStyle({ backgroundColor: '#444455' });
      }
    });

    button.on('pointerout', () => {
      if (this.joystickMode !== mode) {
        button.setStyle({ backgroundColor: bgColor });
      }
    });

    button.on('pointerdown', () => {
      this.joystickMode = mode;
      window.gameSettings.joystickMode = mode;
      // 刷新按钮样式
      this.scene.restart();
    });

    return button;
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
