import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { GameState, Skill } from '@/types';
import { InputSystem } from '@/systems/InputSystem';
import { EnemySystem } from '@/systems/EnemySystem';
import { SkillSystem } from '@/systems/SkillSystem';
import { CollisionSystem } from '@/systems/CollisionSystem';
import { ExpSystem } from '@/systems/ExpSystem';
import { EnhancementSystem } from '@/systems/EnhancementSystem';
import { ElementSystem } from '@/systems/ElementSystem';
import { DropSystem } from '@/systems/DropSystem';
import { HUD } from '@/ui/HUD';
import { SkillSelectUI } from '@/ui/SkillSelectUI';
import { UpgradeSelectUI } from '@/ui/UpgradeSelectUI';
import { getRandomBasicSkills, cloneSkill } from '@/data/skills';
import { GAME_WIDTH, GAME_HEIGHT, updateGameSize } from '@/config/game.config';
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
  private elementSystem!: ElementSystem;
  private dropSystem!: DropSystem;

  // UI
  private hud!: HUD;
  private skillSelectUI!: SkillSelectUI;
  private upgradeSelectUI!: UpgradeSelectUI;

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

    // 计算游戏边界（保持一定边距）
    const padding = 20;
    this.gameBounds = new Phaser.Geom.Rectangle(
      padding,
      padding,
      GAME_WIDTH - padding * 2,
      GAME_HEIGHT - padding * 2
    );

    // 创建玩家
    this.player = new Player(this, GAME_WIDTH / 2, GAME_HEIGHT / 2);

    // 初始化系统 - 读取摇杆设置
    const joystickMode = window.gameSettings?.joystickMode || 'follow';
    this.inputSystem = new InputSystem(this, joystickMode);
    this.enemySystem = new EnemySystem(this, this.player);
    this.elementSystem = new ElementSystem();
    this.skillSystem = new SkillSystem(this, this.player);
    this.skillSystem.setElementSystem(this.elementSystem);
    this.dropSystem = new DropSystem(this, this.player);
    this.collisionSystem = new CollisionSystem(this, this.player, this.enemySystem, this.skillSystem);
    this.collisionSystem.setElementSystem(this.elementSystem);
    this.collisionSystem.setDropSystem(this.dropSystem);
    this.expSystem = new ExpSystem(this, this.gameState);
    this.enhancementSystem = new EnhancementSystem(this, this.player);

    // 初始化UI
    this.hud = new HUD(this, this.player, this.gameState, this.expSystem);

    // 开局技能选择界面
    this.skillSelectUI = new SkillSelectUI(this, (skill: Skill) => {
      this.onStartingSkillSelected(skill);
    });

    // 升级选择界面
    this.upgradeSelectUI = new UpgradeSelectUI(this, this.enhancementSystem, () => {
      this.resumeGame();
    });

    // 设置事件监听
    this.setupEvents();

    // 显示开局技能选择
    this.showStartingSkillSelection();
  }

  private updateSize(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    updateGameSize(width, height);
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
    this.player.skills.push(skill);
    this.player.skillCooldowns.set(skill.id, 0);

    // 开始第一波
    this.startWave(1);
  }

  private setupEvents(): void {
    // 敌人击杀 - DropSystem handles drop spawning via its own listener
    this.events.on('enemyKilled', (enemy: { getExpValue: () => number }) => {
      this.gameState.kills++;
      const exp = enemy.getExpValue();
      this.expSystem.addExp(exp);
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

    // 取消玩家无敌
    this.player.isInvincible = false;

    // 恢复所有系统
    this.physics.resume();
    this.enemySystem.resume();
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
    this.dropSystem?.destroy();
    this.hud?.destroy();
    this.skillSelectUI?.destroy();
    this.upgradeSelectUI?.destroy();
    this.waveTimer?.destroy();

    // 移除事件
    this.events.off('enemyKilled');
    this.events.off('levelUp');

    // 停止所有 tweens
    this.tweens.killAll();

    // 清理所有计时器
    this.time.removeAllEvents();
  }
}
