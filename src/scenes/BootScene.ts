import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // 资源加载将在后续任务中实现
  }

  create(): void {
    // 启动战斗场景
    this.scene.start('BattleScene');
  }
}
