import Phaser from 'phaser';
import { GraphicsFactory } from '@/graphics/GraphicsFactory';
import { EnhancedGraphicsFactory } from '@/graphics/EnhancedGraphicsFactory';
import { JoystickMode } from '@/ui/VirtualJoystick';
import { updateGameSize } from '@/config/game.config';

// 全局设置存储
declare global {
  interface Window {
    gameSettings: {
      joystickMode: JoystickMode;
    };
  }
}

export class BootScene extends Phaser.Scene {
  private joystickMode: JoystickMode = 'follow';
  private loadingBar!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private percentText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // 更新游戏尺寸
    const width = this.scale.width;
    const height = this.scale.height;
    updateGameSize(width, height);
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // 创建背景
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRect(0, 0, width, height);

    // 标题
    const titleText = this.add.text(width / 2, height * 0.25, '🎮 技能乱斗', {
      font: `bold ${Math.min(48, width / 15)}px Arial`,
      color: '#66ccff',
      stroke: '#000000',
      strokeThickness: 4,
    });
    titleText.setOrigin(0.5, 0.5);

    // 副标题
    const subtitleText = this.add.text(width / 2, height * 0.25 + 50, 'Skill Brawl', {
      font: `${Math.min(24, width / 30)}px Arial`,
      color: '#aaaaaa',
    });
    subtitleText.setOrigin(0.5, 0.5);

    // 加载进度条背景
    const barWidth = Math.min(300, width * 0.5);
    const barHeight = Math.min(20, height * 0.03);
    const barY = height * 0.5;

    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x333355, 0.8);
    progressBox.fillRoundedRect(width / 2 - barWidth / 2, barY, barWidth, barHeight, 5);

    // 加载进度条
    this.loadingBar = this.add.graphics();

    // 加载文字
    this.loadingText = this.add.text(width / 2, barY - 30, '正在加载资源...', {
      font: `${Math.min(18, width / 35)}px Arial`,
      color: '#ffffff',
    });
    this.loadingText.setOrigin(0.5, 0.5);

    // 百分比文字
    this.percentText = this.add.text(width / 2, barY + barHeight + 20, '0%', {
      font: `${Math.min(20, width / 30)}px Arial`,
      color: '#66ccff',
    });
    this.percentText.setOrigin(0.5, 0.5);

    // 开始异步加载资源
    this.loadAssets(width, height, barWidth, barHeight, barY);
  }

  private async loadAssets(
    width: number,
    height: number,
    barWidth: number,
    barHeight: number,
    barY: number
  ): Promise<void> {
    // 模拟加载进度，因为 GraphicsFactory 是同步的
    const steps = 10;
    const delayPerStep = 100; // 每步100ms

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;

      // 更新进度条
      this.loadingBar.clear();
      this.loadingBar.fillStyle(0x66ccff, 1);
      this.loadingBar.fillRoundedRect(
        width / 2 - barWidth / 2,
        barY,
        barWidth * progress,
        barHeight,
        5
      );

      // 更新百分比文字
      this.percentText.setText(`${Math.floor(progress * 100)}%`);

      // 在进度50%时生成纹理（如果不存在）
      if (i === 5) {
        this.loadingText.setText('正在生成像素素材...');
        // 检查纹理是否已存在，避免重复生成
        if (!this.textures.exists('player')) {
          const graphicsFactory = new GraphicsFactory(this);
          graphicsFactory.generateAll();
        }
      }

      // 在进度80%时初始化状态
      if (i === 8) {
        this.loadingText.setText('正在初始化游戏...');
        this.registry.set('gameState', this.createInitialState());
        window.gameSettings = {
          joystickMode: this.joystickMode,
        };
      }

      // 等待一段时间
      await this.delay(delayPerStep);
    }

    // 加载完成
    this.loadingText.setText('加载完成！');

    // 短暂延迟后显示开始按钮
    await this.delay(300);

    // 清理加载界面
    this.loadingBar.destroy();
    this.loadingText.destroy();
    this.percentText.destroy();

    // 显示开始界面
    this.showStartScreen(width, height);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      this.time.delayedCall(ms, resolve);
    });
  }

  private showStartScreen(width: number, height: number): void {
    // 创建开始按钮
    this.createStartButton(width, height);

    // 创建设置按钮
    this.createSettingsButton(width, height);
  }

  private createStartButton(width: number, height: number): void {
    const btnWidth = Math.min(200, width * 0.4);
    const btnHeight = Math.min(50, height * 0.08);
    const btnY = height * 0.5;

    // 按钮背景
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(0x4a7db8, 1);
    buttonBg.fillRoundedRect(width / 2 - btnWidth / 2, btnY, btnWidth, btnHeight, 10);
    buttonBg.lineStyle(3, 0x66ccff, 1);
    buttonBg.strokeRoundedRect(width / 2 - btnWidth / 2, btnY, btnWidth, btnHeight, 10);

    // 按钮文字
    const buttonText = this.add.text(width / 2, btnY + btnHeight / 2, '开始游戏', {
      font: `bold ${Math.min(24, width / 25)}px Arial`,
      color: '#ffffff',
    });
    buttonText.setOrigin(0.5, 0.5);

    // 按钮交互区域
    const hitArea = this.add.rectangle(width / 2, btnY + btnHeight / 2, btnWidth, btnHeight, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });

    // 悬停效果
    hitArea.on('pointerover', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0x5a8dc8, 1);
      buttonBg.fillRoundedRect(width / 2 - btnWidth / 2, btnY, btnWidth, btnHeight, 10);
      buttonBg.lineStyle(3, 0x88ddff, 1);
      buttonBg.strokeRoundedRect(width / 2 - btnWidth / 2, btnY, btnWidth, btnHeight, 10);
    });

    hitArea.on('pointerout', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0x4a7db8, 1);
      buttonBg.fillRoundedRect(width / 2 - btnWidth / 2, btnY, btnWidth, btnHeight, 10);
      buttonBg.lineStyle(3, 0x66ccff, 1);
      buttonBg.strokeRoundedRect(width / 2 - btnWidth / 2, btnY, btnWidth, btnHeight, 10);
    });

    // 点击开始游戏
    hitArea.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('BattleScene');
      });
    });

    // 提示文字
    const tipText = this.add.text(width / 2, height - 30, 'WASD / 方向键 移动', {
      font: `${Math.min(14, width / 40)}px Arial`,
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
    const settingsBtn = this.add.text(width - 50, 30, '⚙️', {
      font: `${Math.min(32, width / 20)}px Arial`,
    });
    settingsBtn.setOrigin(0.5, 0.5);
    settingsBtn.setInteractive({ useHandCursor: true });

    settingsBtn.on('pointerover', () => settingsBtn.setScale(1.2));
    settingsBtn.on('pointerout', () => settingsBtn.setScale(1));
    settingsBtn.on('pointerdown', () => this.showSettingsPanel(width, height));
  }

  private showSettingsPanel(width: number, height: number): void {
    const panelWidth = Math.min(400, width * 0.8);
    const panelHeight = Math.min(300, height * 0.6);

    // 半透明背景
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    overlay.setDepth(100);
    overlay.setInteractive();

    // 设置面板
    const panel = this.add.graphics();
    panel.fillStyle(0x2a2a4e, 1);
    panel.fillRoundedRect(width / 2 - panelWidth / 2, height / 2 - panelHeight / 2, panelWidth, panelHeight, 15);
    panel.lineStyle(3, 0x66ccff, 1);
    panel.strokeRoundedRect(width / 2 - panelWidth / 2, height / 2 - panelHeight / 2, panelWidth, panelHeight, 15);
    panel.setDepth(101);

    // 标题
    const title = this.add.text(width / 2, height / 2 - panelHeight / 2 + 30, '⚙️ 设置', {
      font: `bold ${Math.min(28, width / 20)}px Arial`,
      color: '#66ccff',
    });
    title.setOrigin(0.5, 0.5);
    title.setDepth(102);

    // 摇杆模式标题
    const modeTitle = this.add.text(width / 2, height / 2 - 20, '虚拟摇杆模式', {
      font: `${Math.min(20, width / 30)}px Arial`,
      color: '#ffffff',
    });
    modeTitle.setOrigin(0.5, 0.5);
    modeTitle.setDepth(102);

    // 跟随手指按钮
    const followBtn = this.createModeButton(
      width / 2 - panelWidth / 4,
      height / 2 + 30,
      '跟随手指',
      'follow'
    );

    // 固定位置按钮
    const fixedBtn = this.createModeButton(
      width / 2 + panelWidth / 4,
      height / 2 + 30,
      '固定位置',
      'fixed'
    );

    // 关闭按钮
    const closeBtn = this.add.text(width / 2, height / 2 + panelHeight / 2 - 50, '关闭', {
      font: `${Math.min(20, width / 30)}px Arial`,
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

  private createModeButton(x: number, y: number, text: string, mode: JoystickMode): Phaser.GameObjects.Text {
    const isSelected = this.joystickMode === mode;
    const color = isSelected ? '#66ccff' : '#888888';
    const bgColor = isSelected ? '#224466' : '#333344';

    const button = this.add.text(x, y, text, {
      font: `${Math.min(18, this.scale.width / 35)}px Arial`,
      color: color,
      backgroundColor: bgColor,
      padding: { x: 20, y: 10 },
    });
    button.setOrigin(0.5, 0.5);
    button.setDepth(102);
    button.setInteractive({ useHandCursor: true });

    button.on('pointerdown', () => {
      this.joystickMode = mode;
      window.gameSettings.joystickMode = mode;
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
