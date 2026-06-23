import Phaser from 'phaser';

interface ResultData {
  kills: number;
  wave: number;
  level: number;
}

export class ResultScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultScene' });
  }

  create(data: ResultData): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const { kills, wave, level } = data;

    // 背景
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    // 游戏结束标题
    const title = this.add.text(width / 2, height * 0.15, '游戏结束', {
      fontSize: `${Math.min(48, width / 15)}px`,
      color: '#ff4444',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // 分隔线
    const line = this.add.graphics();
    line.lineStyle(2, 0xffffff, 0.3);
    line.beginPath();
    line.moveTo(width / 2 - Math.min(200, width * 0.3), height * 0.22);
    line.lineTo(width / 2 + Math.min(200, width * 0.3), height * 0.22);
    line.strokePath();

    // 统计数据
    const stats = [
      { label: '击杀数', value: kills, color: '#ff6666' },
      { label: '到达波次', value: wave, color: '#66ff66' },
      { label: '达到等级', value: level, color: '#6666ff' },
    ];

    const fontSize = Math.min(24, width / 30);
    const valueFontSize = Math.min(28, width / 25);

    stats.forEach((stat, index) => {
      const y = height * 0.32 + index * height * 0.08;

      this.add.text(width / 2 - Math.min(100, width * 0.15), y, stat.label, {
        fontSize: `${fontSize}px`,
        color: '#aaaaaa',
      });

      this.add.text(width / 2 + Math.min(100, width * 0.15), y, String(stat.value), {
        fontSize: `${valueFontSize}px`,
        color: stat.color,
        fontStyle: 'bold',
      }).setOrigin(1, 0);
    });

    // 计算荣耀点数
    const gloryPoints = Math.floor(kills * 0.1 + wave * 5);

    // 荣耀点数
    const gloryTitle = this.add.text(width / 2, height * 0.6, '获得荣耀点数', {
      fontSize: `${Math.min(20, width / 35)}px`,
      color: '#ffcc00',
    });
    gloryTitle.setOrigin(0.5);

    const gloryValue = this.add.text(width / 2, height * 0.65, `+${gloryPoints}`, {
      fontSize: `${Math.min(36, width / 20)}px`,
      color: '#ffcc00',
      fontStyle: 'bold',
    });
    gloryValue.setOrigin(0.5);

    // 重新开始按钮
    const btnWidth = Math.min(200, width * 0.4);
    const btnHeight = Math.min(50, height * 0.07);

    const restartButton = this.add.rectangle(width / 2, height * 0.78, btnWidth, btnHeight, 0x444444);
    restartButton.setStrokeStyle(2, 0x00ff00);
    restartButton.setInteractive({ useHandCursor: true });

    const restartText = this.add.text(width / 2, height * 0.78, '再来一局', {
      fontSize: `${Math.min(20, width / 30)}px`,
      color: '#00ff00',
    });
    restartText.setOrigin(0.5);

    restartButton.on('pointerover', () => {
      restartButton.setFillStyle(0x555555);
    });

    restartButton.on('pointerout', () => {
      restartButton.setFillStyle(0x444444);
    });

    restartButton.on('pointerdown', () => {
      this.restart();
    });

    // 返回主菜单按钮
    const menuButton = this.add.rectangle(width / 2, height * 0.88, btnWidth, btnHeight * 0.8, 0x333333);
    menuButton.setInteractive({ useHandCursor: true });

    const menuText = this.add.text(width / 2, height * 0.88, '返回主菜单', {
      fontSize: `${Math.min(16, width / 40)}px`,
      color: '#888888',
    });
    menuText.setOrigin(0.5);

    menuButton.on('pointerdown', () => {
      this.backToMenu();
    });
  }

  private restart(): void {
    // 重置游戏状态
    this.registry.set('gameState', this.createDefaultGameState());

    // 返回 BootScene 重新加载资源
    this.scene.start('BootScene');
  }

  private backToMenu(): void {
    // 返回主菜单
    this.registry.set('gameState', this.createDefaultGameState());
    this.scene.start('BootScene');
  }

  private createDefaultGameState() {
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
