import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { GameState, Skill, SynergyResult } from '@/types';
import { InputSystem } from '@/systems/InputSystem';
import { EnemySystem } from '@/systems/EnemySystem';
import { SkillSystem } from '@/systems/SkillSystem';
import { CollisionSystem } from '@/systems/CollisionSystem';
import { ExpSystem } from '@/systems/ExpSystem';
import { EnhancementSystem } from '@/systems/EnhancementSystem';
import { SkillUpgradeSystem } from '@/systems/SkillUpgradeSystem';
import { ElementSystem } from '@/systems/ElementSystem';
import { DropSystem } from '@/systems/DropSystem';
import { EnemyAbilitySystem } from '@/systems/EnemyAbilitySystem';
import { BossController } from '@/entities/BossController';
import { HUD } from '@/ui/HUD';
import { SkillSelectUI } from '@/ui/SkillSelectUI';
import { UpgradeSelectUI } from '@/ui/UpgradeSelectUI';
import { DamageNumberManager } from '@/ui/DamageNumberManager';
import { getRandomBasicSkills, cloneSkill } from '@/data/skills';
import { GAME_WIDTH, GAME_HEIGHT, updateGameSize, WORLD_WIDTH, WORLD_HEIGHT } from '@/config/game.config';
import { GraphicsFactory } from '@/graphics/GraphicsFactory';

declare global {
  interface Window {
    gameSettings: {
      joystickMode: 'fixed' | 'follow';
    };
  }
}

export class BattleScene extends Phaser.Scene {
  // 游戏对象
  private player!: Player;
  private gameState!: GameState;

  // 系统
  private inputSystem!: InputSystem;
  private enemySystem!: EnemySystem;
  private skillSystem!: SkillSystem;
  private collisionSystem!: CollisionSystem;
  private expSystem!: ExpSystem;
  private enhancementSystem!: EnhancementSystem;
  private skillUpgradeSystem!: SkillUpgradeSystem;
  private elementSystem!: ElementSystem;
  private dropSystem!: DropSystem;
  private enemyAbilitySystem!: EnemyAbilitySystem;
  private bossController!: BossController;

  // UI
  private hud!: HUD;
  private skillSelectUI!: SkillSelectUI;
  private upgradeSelectUI!: UpgradeSelectUI;
  private damageNumberManager!: DamageNumberManager;

  // 波次控制
  private waveTimer!: Phaser.Time.TimerEvent;
  private waveTransitioning: boolean = false;

  // 游戏边界（基于实际屏幕）
  private gameBounds!: Phaser.Geom.Rectangle;

  constructor() {
    super({ key: 'BattleScene' });
  }

  create(): void {
    // 更新游戏尺寸
    this.updateSize();

    // 设置无限世界边界（吸血鬼幸存者风格）
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // 创建背景（深色，覆盖整个世界）
    this.createInfiniteBackground();

    // 确保纹理存在（防止热重载或直接进入场景时纹理丢失）
    if (!this.textures.exists('player')) {
      console.log('Generating textures...');
      const graphicsFactory = new GraphicsFactory(this);
      graphicsFactory.generateAll();
    }

    // 确保技能图标纹理存在
    if (!this.textures.exists('skill_fireball')) {
      console.log('Generating skill icons...');
      const graphicsFactory = new GraphicsFactory(this);
      graphicsFactory.generateSkillIcons();
    }

    // 初始化游戏状态 - 每次开始都创建新状态，避免旧状态污染
    this.gameState = this.createDefaultGameState();

    // 游戏边界不再需要固定屏幕大小，使用整个世界
    // 但保留 gameBounds 用于某些 UI 计算
    const padding = 20;
    this.gameBounds = new Phaser.Geom.Rectangle(
      padding,
      padding,
      GAME_WIDTH - padding * 2,
      GAME_HEIGHT - padding * 2
    );

    // 创建玩家（在世界中心）
    this.player = new Player(this, WORLD_WIDTH / 2, WORLD_HEIGHT / 2);

    // 设置摄像机跟随玩家（吸血鬼幸存者风格）
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // 初始化系统 - 读取摇杆设置
    const joystickMode = window.gameSettings?.joystickMode || 'follow';
    this.inputSystem = new InputSystem(this, joystickMode);
    this.enemySystem = new EnemySystem(this, this.player);
    this.elementSystem = new ElementSystem();
    this.skillSystem = new SkillSystem(this, this.player);
    this.skillSystem.setElementSystem(this.elementSystem);
    this.dropSystem = new DropSystem(this, this.player);
    this.enemyAbilitySystem = new EnemyAbilitySystem(this, this.player, this.enemySystem);
    this.bossController = new BossController(this);
    this.collisionSystem = new CollisionSystem(this, this.player, this.enemySystem, this.skillSystem);
    this.collisionSystem.setElementSystem(this.elementSystem);
    this.collisionSystem.setDropSystem(this.dropSystem);
    this.collisionSystem.setEnemyAbilitySystem(this.enemyAbilitySystem);
    this.expSystem = new ExpSystem(this, this.gameState);
    this.enhancementSystem = new EnhancementSystem(this, this.player);
    this.skillUpgradeSystem = new SkillUpgradeSystem();

    // 初始化UI
    this.hud = new HUD(this, this.player, this.gameState, this.expSystem);

    // 开局技能选择界面
    this.skillSelectUI = new SkillSelectUI(this, (skill: Skill) => {
      this.onStartingSkillSelected(skill);
    });

    // 升级选择界面
    this.upgradeSelectUI = new UpgradeSelectUI(this, this.enhancementSystem, this.skillUpgradeSystem, () => {
      this.resumeGame();
    });

    // 设置事件监听
    this.setupEvents();

    // 设置大招按键监听
    this.setupUltimateKeys();

    // 显示开局技能选择
    this.showStartingSkillSelection();
  }

  private updateSize(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    updateGameSize(width, height);
  }

  /**
   * 创建无限背景（吸血鬼幸存者风格）
   * 使用深色背景，玩家可以自由移动
   */
  private createInfiniteBackground(): void {
    // 创建一个大的深色背景覆盖整个世界
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    bg.setDepth(-1); // 最底层

    // 创建网格线效果（可选，增加视觉参考）
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x2a2a3e, 0.3);
    const gridSize = 100;
    for (let x = 0; x <= WORLD_WIDTH; x += gridSize) {
      grid.moveTo(x, 0);
      grid.lineTo(x, WORLD_HEIGHT);
    }
    for (let y = 0; y <= WORLD_HEIGHT; y += gridSize) {
      grid.moveTo(0, y);
      grid.lineTo(WORLD_WIDTH, y);
    }
    grid.strokePath();
    grid.setDepth(-1);
  }

  /**
   * 显示开局技能选择
   */
  private showStartingSkillSelection(): void {
    this.gameState.isSelectingSkill = true;
    this.player.isInvincible = true;
    this.physics.pause();

    // 获取4个随机基础技能
    const skills = getRandomBasicSkills(4);
    this.skillSelectUI.show(skills);
  }

  /**
   * 玩家选择初始技能后
   */
  private onStartingSkillSelected(skill: Skill): void {
    this.gameState.isSelectingSkill = false;
    this.player.isInvincible = false;
    this.physics.resume();

    // 添加技能到玩家
    this.player.addBasicSkill(skill);

    // 开始第一波
    this.startWave(1);
  }

  private setupEvents(): void {
    // 初始化伤害数值管理器
    this.damageNumberManager = new DamageNumberManager(this);

    // 敌人击杀 - DropSystem handles drop spawning via its own listener
    this.events.on('enemyKilled', (enemy: { getExpValue: () => number }) => {
      this.gameState.kills++;
      // 经验不再直接获取，改为拾取经验球
    });

    // 拾取经验球获得经验
    this.events.on('expOrbPickedUp', (value: number) => {
      this.expSystem.addExp(value);
    });

    // 升级
    this.events.on('levelUp', (level: number) => {
      // 检查大招解锁
      if (this.enhancementSystem.shouldUnlockUltimate(level)) {
        const ultimate = this.enhancementSystem.unlockUltimate();
        if (ultimate) {
          // 显示大招解锁提示
          this.showUltimateUnlockMessage(ultimate);
        }
      }

      // 显示升级选择
      this.pauseForUpgrade();
    });

    // 玩家死亡
    this.player.on('death', () => {
      this.gameOver();
    });

    // 羁绊触发通知 - 连接 SkillSystem 和 HUD
    this.skillSystem.getSynergyEvents().on('synergy_triggered', (data: { synergy: SynergyResult; enemyPosition?: { x: number; y: number } }) => {
      // 在敌人位置显示羁绊名称
      if (data.enemyPosition) {
        this.showSynergyAtPosition(data.synergy, data.enemyPosition.x, data.enemyPosition.y);
      }
    });

    // 伤害数值事件
    this.events.on('enemyDamage', (data: { x: number; y: number; damage: number; isCrit: boolean; isCounter: boolean }) => {
      this.damageNumberManager.showEnemyDamage(data.x, data.y, data.damage, data.isCrit, data.isCounter);
    });

    this.events.on('playerDamage', (data: { x: number; y: number; damage: number }) => {
      this.damageNumberManager.showPlayerDamage(data.x, data.y, data.damage);
    });

    this.events.on('playerHeal', (data: { x: number; y: number; value: number }) => {
      this.damageNumberManager.showHeal(data.x, data.y, data.value);
    });

    this.events.on('playerShield', (data: { x: number; y: number; value: number }) => {
      this.damageNumberManager.showShield(data.x, data.y, data.value);
    });
  }

  /**
   * 设置大招按键监听 (Q和E)
   */
  private setupUltimateKeys(): void {
    // Q键 - 第一个大招
    this.input.keyboard?.on('keydown-Q', () => {
      if (!this.gameState.isSelectingSkill && !this.gameState.isPaused) {
        this.skillSystem.useUltimateByIndex(0, this.enemySystem.getEnemies());
      }
    });

    // E键 - 第二个大招
    this.input.keyboard?.on('keydown-E', () => {
      if (!this.gameState.isSelectingSkill && !this.gameState.isPaused) {
        this.skillSystem.useUltimateByIndex(1, this.enemySystem.getEnemies());
      }
    });
  }

  /**
   * 显示大招解锁消息
   */
  private showUltimateUnlockMessage(ultimate: Skill): void {
    const width = this.scale.width;
    const height = this.scale.height;

    const container = this.add.container(width / 2, height / 2 - 100);
    container.setDepth(999);

    const bg = this.add.rectangle(0, 0, 300, 80, 0x000000, 0.8);
    container.add(bg);

    const text = this.add.text(0, -15, '大招解锁！', {
      fontSize: '20px',
      color: '#ffcc00',
      fontStyle: 'bold',
    });
    text.setOrigin(0.5);
    container.add(text);

    const skillName = this.add.text(0, 15, ultimate.name, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    skillName.setOrigin(0.5);
    container.add(skillName);

    // 动画
    this.tweens.add({
      targets: container,
      alpha: 0,
      y: height / 2 - 150,
      delay: 2000,
      duration: 500,
      onComplete: () => container.destroy(),
    });
  }

  /**
   * 在敌人位置显示羁绊名称
   */
  private showSynergyAtPosition(synergy: SynergyResult, x: number, y: number): void {
    // 创建羁绊名称文字
    const text = this.add.text(x, y - 20, synergy.name, {
      fontSize: '16px',
      color: '#ffcc00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    });
    text.setOrigin(0.5, 0.5);
    text.setDepth(150);

    // 上浮并淡出动画
    this.tweens.add({
      targets: text,
      y: y - 60,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  private startWave(wave: number): void {
    this.gameState.wave = wave;
    this.waveTransitioning = false;
    this.enemySystem.startWave(wave);

    // 设置波次计时器
    this.waveTimer = this.time.addEvent({
      delay: 60000, // 60秒一波
      callback: this.onWaveComplete,
      callbackScope: this,
    });
  }

  private onWaveComplete(): void {
    if (this.waveTransitioning) return;
    this.waveTransitioning = true;

    // 波次结束，开始下一波
    this.time.delayedCall(2000, () => {
      const nextWave = this.gameState.wave + 1;
      this.startWave(nextWave);
    });
  }

  private pauseForUpgrade(): void {
    this.gameState.isUpgrading = true;

    // 玩家无敌，防止被杀
    this.player.isInvincible = true;

    // 暂停所有系统
    this.physics.pause();
    this.enemySystem.pause();

    // 显示升级选择
    this.upgradeSelectUI.show();
  }

  private resumeGame(): void {
    this.gameState.isUpgrading = false;

    // 先推开靠近玩家的敌人，防止卡住
    this.pushEnemiesAwayFromPlayer();

    // 先重置敌人状态（速度为0），再恢复全局物理
    this.enemySystem.resume();
    this.physics.resume();

    // 给玩家短暂无敌时间（1.5秒），防止恢复后立即被包围
    this.player.isInvincible = true;
    this.time.delayedCall(1500, () => {
      if (this.player.active) {
        this.player.isInvincible = false;
      }
    });
  }

  /**
   * 推开靠近玩家的敌人，防止恢复后玩家卡在敌人体内
   */
  private pushEnemiesAwayFromPlayer(): void {
    const minDistance = 100; // 增大最小安全距离
    const enemies = this.enemySystem.getEnemies().getChildren() as any[];

    for (const enemy of enemies) {
      if (!enemy.active) continue;

      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        enemy.x, enemy.y
      );

      if (distance < minDistance) {
        // 计算推开方向（从玩家指向敌人）
        const angle = Phaser.Math.Angle.Between(
          this.player.x, this.player.y,
          enemy.x, enemy.y
        );
        // 推到最小距离外，增加额外缓冲
        const pushDistance = minDistance - distance + 30;
        enemy.x += Math.cos(angle) * pushDistance;
        enemy.y += Math.sin(angle) * pushDistance;
      }
    }
  }

  private gameOver(): void {
    this.gameState.isDead = true;

    // 清理
    this.waveTimer?.destroy();

    // 延迟跳转结算场景
    this.time.delayedCall(1500, () => {
      this.scene.start('ResultScene', {
        kills: this.gameState.kills,
        wave: this.gameState.wave,
        level: this.gameState.level,
      });
    });
  }

  update(_time: number, delta: number): void {
    if (this.gameState.isDead || this.gameState.isUpgrading || this.gameState.isSelectingSkill) return;

    // 处理输入
    const input = this.inputSystem.getInput();
    if (input.isMoving) {
      const speed = this.player.stats.speed;
      this.player.move(input.moveX * speed, input.moveY * speed);
    } else {
      this.player.move(0, 0);
    }

    // 更新技能系统
    this.skillSystem.update(delta, this.enemySystem.getEnemies());

    // 更新敌人主动能力系统
    const enemies = this.enemySystem.getEnemies().getChildren() as any[];
    this.enemyAbilitySystem.update(delta, enemies);

    // 更新 Boss 阶段
    for (const enemy of enemies) {
      if (enemy.config.type === 'boss') {
        this.bossController.checkPhaseTransition(enemy);
      }
    }

    // 更新HUD
    this.hud.update();

    // 检查波次完成
    if (!this.waveTransitioning && this.enemySystem.getActiveEnemyCount() === 0) {
      this.onWaveComplete();
    }
  }

  private createDefaultGameState(): GameState {
    return {
      stats: {
        maxHp: 100,
        currentHp: 100,
        attack: 10,
        defense: 5,
        speed: 280, // 使用更新后的速度
        critRate: 0.05,
        critDamage: 1.5,
        lifesteal: 0,
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
      isSelectingSkill: false,
      ultimateSlots: 0,
    };
  }

  shutdown(): void {
    // 清理系统
    this.inputSystem?.destroy();
    this.enemySystem?.destroy();
    this.skillSystem?.destroy();
    this.collisionSystem?.destroy();
    this.enhancementSystem?.destroy();
    this.elementSystem?.destroy();
    this.enemyAbilitySystem?.destroy();
    this.dropSystem?.destroy();
    this.hud?.destroy();
    this.skillSelectUI?.destroy();
    this.upgradeSelectUI?.destroy();
    this.damageNumberManager?.destroy();
    this.waveTimer?.destroy();

    // 移除事件
    this.events.off('enemyKilled');
    this.events.off('levelUp');
    this.events.off('enemyDamage');
    this.events.off('playerDamage');
    this.events.off('playerHeal');
    this.events.off('playerShield');

    // 停止所有 tweens
    this.tweens.killAll();

    // 清理所有计时器
    this.time.removeAllEvents();
  }
}
