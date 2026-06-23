import Phaser from 'phaser';
import { GAME_CONFIG } from './config/game.config';
import { BootScene } from './scenes/BootScene';
import { BattleScene } from './scenes/BattleScene';
import { ResultScene } from './scenes/ResultScene';

// 注册所有场景
const scenes = [BootScene, BattleScene, ResultScene];

// 创建游戏实例
const config: Phaser.Types.Core.GameConfig = {
  ...GAME_CONFIG,
  scene: scenes,
};

new Phaser.Game(config);
