import Phaser from 'phaser';
import { GAME_CONFIG } from './config/game.config';
import { BootScene } from './scenes/BootScene';
import { BattleScene } from './scenes/BattleScene';
import { ResultScene } from './scenes/ResultScene';
import {
  initializeStrategies,
  initializeSynergyStrategies,
  initializeStatusEffectStrategies,
  initializeEnemyAttackAbilities,
  initializeBuffSkillStrategies,
  initializeEnemyAbilityStrategies,
  initializeEnhancementStrategies,
  initializeSkillValueCalculators,
  initializeProjectileVisualStrategies,
  initializeElementDeathStrategies,
  initializeEnemyPassiveAbilities,
  initializeEnemyDeathAbilities,
  initializeEnemyElementDeathStrategies,
  initializeSpecialBehaviorConfigStrategies,
} from './strategies';

// 初始化技能策略系统
initializeStrategies();
// 初始化协同效果策略系统
initializeSynergyStrategies();
// 初始化状态效果策略系统
initializeStatusEffectStrategies();
// 初始化敌人攻击能力策略
initializeEnemyAttackAbilities();
// 初始化Buff技能策略
initializeBuffSkillStrategies();
// 初始化敌人能力策略
initializeEnemyAbilityStrategies();
// 初始化强化效果策略
initializeEnhancementStrategies();
// 初始化技能值计算器
initializeSkillValueCalculators();
// 初始化投射物视觉策略
initializeProjectileVisualStrategies();
// 初始化投射物元素死亡效果策略
initializeElementDeathStrategies();
// 初始化敌人被动能力策略
initializeEnemyPassiveAbilities();
// 初始化敌人死亡能力策略
initializeEnemyDeathAbilities();
// 初始化敌人元素死亡效果策略
initializeEnemyElementDeathStrategies();
// 初始化特殊行为配置策略
initializeSpecialBehaviorConfigStrategies();

// 注册所有场景
const scenes = [BootScene, BattleScene, ResultScene];

// 创建游戏实例
const config: Phaser.Types.Core.GameConfig = {
  ...GAME_CONFIG,
  scene: scenes,
};

new Phaser.Game(config);