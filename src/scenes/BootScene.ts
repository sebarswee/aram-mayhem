import Phaser from 'phaser';
import { GraphicsFactory } from '@/graphics/GraphicsFactory';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // 显示加载进度
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 背景
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRect(0, 0, width, height);

    const progressBox = this.add.graphics();
    const progressBar = this.add.graphics();

    const loadingText = this.add.text(width / 2, height / 2 - 50, '🎮 技能乱斗', {
      font: 'bold 28px Arial',
      color: '#66ccff',
    });
    loadingText.setOrigin(0.5, 0.5);

    const subText = this.add.text(width / 2, height / 2, '生成像素素材...', {
      font: '16px Arial',
      color: '#aaaaaa',
    });
    subText.setOrigin(0.5, 0.5);

    const percentText = this.add.text(width / 2, height / 2 + 50, '0%', {
      font: '18px Arial',
      color: '#ffffff',
    });
    percentText.setOrigin(0.5, 0.5);

    progressBox.fillStyle(0x333355, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 + 70, 320, 30);

    // 模拟加载进度（生成素材需要时间）
    let progress = 0;
    const progressInterval = this.time.addEvent({
      delay: 50,
      callback: () => {
        progress += 0.05;
        if (progress > 1) progress = 1;
        percentText.setText(Math.floor(progress * 100) + '%');
        progressBar.clear();
        progressBar.fillStyle(0x66ccff, 1);
        progressBar.fillRect(width / 2 - 155, height / 2 + 75, 310 * progress, 20);
      },
      repeat: 19,
    });

    // 加载进度事件
    this.load.on('progress', (value: number) => {
      percentText.setText(Math.floor(value * 100) + '%');
      progressBar.clear();
      progressBar.fillStyle(0x66ccff, 1);
      progressBar.fillRect(width / 2 - 155, height / 2 + 75, 310 * value, 20);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      subText.destroy();
      percentText.destroy();
      progressInterval.destroy();
    });

    // 加载占位符资源(使用Phaser内置图形)
    // 后续替换为实际资源
  }

  create(): void {
    // 生成所有像素风格视觉素材
    const graphicsFactory = new GraphicsFactory(this);
    graphicsFactory.generateAll();

    // 初始化全局游戏状态
    this.registry.set('gameState', this.createInitialState());

    // 跳转到战斗场景
    this.scene.start('BattleScene');
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
