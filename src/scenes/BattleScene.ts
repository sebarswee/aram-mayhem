import Phaser from 'phaser';

export class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' });
  }

  create(): void {
    // 战斗场景将在后续任务中实现
    // 显示临时背景色
    this.cameras.main.setBackgroundColor('#1a1a2e');
  }
}
