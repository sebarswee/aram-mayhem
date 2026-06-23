import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/game.config';

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
    const { kills, wave, level } = data;

    // 背景
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e);

    // 游戏结束标题
    const title = this.add.text(GAME_WIDTH / 2, 120, '游戏结束', {
      fontSize: '48px',
      color: '#ff4444',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // 分隔线
    const line = this.add.graphics();
    line.lineStyle(2, 0xffffff, 0.3);
    line.beginPath();
    line.moveTo(GAME_WIDTH / 2 - 200, 180);
    line.lineTo(GAME_WIDTH / 2 + 200, 180);
    line.strokePath();

    // 统计数据
    const stats = [
      { label: '击杀数', value: kills, color: '#ff6666' },
      { label: '到达波次', value: wave, color: '#66ff66' },
      { label: '达到等级', value: level, color: '#6666ff' },
    ];

    stats.forEach((stat, index) => {
      const y = 250 + index * 60;

      this.add.text(GAME_WIDTH / 2 - 100, y, stat.label, {
        fontSize: '24px',
        color: '#aaaaaa',
      });

      this.add.text(GAME_WIDTH / 2 + 100, y, String(stat.value), {
        fontSize: '28px',
        color: stat.color,
        fontStyle: 'bold',
      }).setOrigin(1, 0);
    });

    // 计算荣耀点数
    const gloryPoints = Math.floor(kills * 0.1 + wave * 5);

    // 荣耀点数
    const gloryTitle = this.add.text(GAME_WIDTH / 2, 450, '获得荣耀点数', {
      fontSize: '20px',
      color: '#ffcc00',
    });
    gloryTitle.setOrigin(0.5);

    const gloryValue = this.add.text(GAME_WIDTH / 2, 490, `+${gloryPoints}`, {
      fontSize: '36px',
      color: '#ffcc00',
      fontStyle: 'bold',
    });
    gloryValue.setOrigin(0.5);

    // 重新开始按钮
    const restartButton = this.add.rectangle(GAME_WIDTH / 2, 580, 200, 50, 0x444444);
    restartButton.setStrokeStyle(2, 0x00ff00);
    restartButton.setInteractive({ useHandCursor: true });

    const restartText = this.add.text(GAME_WIDTH / 2, 580, '再来一局', {
      fontSize: '20px',
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

    // 返回主菜单按钮(暂未实现)
    const menuButton = this.add.rectangle(GAME_WIDTH / 2, 650, 200, 40, 0x333333);
    menuButton.setInteractive({ useHandCursor: true });

    const menuText = this.add.text(GAME_WIDTH / 2, 650, '返回主菜单', {
      fontSize: '16px',
      color: '#888888',
    });
    menuText.setOrigin(0.5);

    menuButton.on('pointerdown', () => {
      // 后续实现主菜单
      this.restart();
    });
  }

  private restart(): void {
    // 重置游戏状态
    this.registry.set('gameState', {
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
    });

    // 重新开始
    this.scene.start('BattleScene');
  }
}
