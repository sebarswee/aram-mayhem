import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { GameState } from '@/types';
import { InputSystem } from '@/systems/InputSystem';
import { EnemySystem } from '@/systems/EnemySystem';
import { SkillSystem } from '@/systems/SkillSystem';
import { CollisionSystem } from '@/systems/CollisionSystem';
import { ExpSystem } from '@/systems/ExpSystem';
import { RuneSystem } from '@/systems/RuneSystem';
import { HUD } from '@/ui/HUD';
import { RuneSelectUI } from '@/ui/RuneSelectUI';
import { getRandomSkillSet } from '@/data/skills';
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
  private runeSystem!: RuneSystem;

  // UI
  private hud!: HUD;
  private runeSelectUI!: RuneSelectUI;

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

    // 初始化游戏状态
    this.gameState = this.registry.get('gameState') || this.createDefaultGameState();

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

    // 初始化技能
    this.initPlayerSkills();

    // 初始化系统 - 读取摇杆设置
    const joystickMode = window.gameSettings?.joystickMode || 'follow';
    this.inputSystem = new InputSystem(this, joystickMode);
    this.enemySystem = new EnemySystem(this, this.player);
    this.skillSystem = new SkillSystem(this, this.player);
    this.collisionSystem = new CollisionSystem(this, this.player, this.enemySystem, this.skillSystem);
    this.expSystem = new ExpSystem(this, this.gameState);
    this.runeSystem = new RuneSystem(this, this.player);

    // 初始化UI
    this.hud = new HUD(this, this.player, this.gameState, this.expSystem);
    this.runeSelectUI = new RuneSelectUI(this, this.runeSystem, () => {
      this.resumeGame();
    });

    // 设置事件监听
    this.setupEvents();

    // 开始第一波
    this.startWave(1);

    // 监听窗口大小变化
    this.scale.on('resize', this.handleResize, this);
  }

  private updateSize(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    updateGameSize(width, height);
  }

  private handleResize(): void {
    this.updateSize();
    // 更新游戏边界
    const padding = 20;
    this.gameBounds = new Phaser.Geom.Rectangle(
      padding,
      padding,
      GAME_WIDTH - padding * 2,
      GAME_HEIGHT - padding * 2
    );
    // 更新物理世界边界
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  private initPlayerSkills(): void {
    const skillSet = getRandomSkillSet();
    this.player.skills = [...skillSet.basics, skillSet.ultimate];

    // 初始化冷却
    for (const skill of this.player.skills) {
      this.player.skillCooldowns.set(skill.id, 0);
    }
  }

  private setupEvents(): void {
    // 敌人击杀
    this.events.on('enemyKilled', (enemy: { getExpValue: () => number }) => {
      this.gameState.kills++;
      const exp = enemy.getExpValue();
      this.expSystem.addExp(exp);
    });

    // 升级
    this.events.on('levelUp', () => {
      this.pauseForUpgrade();
    });

    // 玩家死亡
    this.player.on('death', () => {
      this.gameOver();
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

    // 显示符文选择
    this.runeSelectUI.show();
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
    if (this.gameState.isDead || this.gameState.isUpgrading) return;

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

  shutdown(): void {
    // 清理系统
    this.inputSystem?.destroy();
    this.enemySystem?.destroy();
    this.skillSystem?.destroy();
    this.collisionSystem?.destroy();
    this.hud?.destroy();
    this.runeSelectUI?.destroy();
    this.waveTimer?.destroy();

    // 移除事件
    this.events.off('enemyKilled');
    this.events.off('levelUp');
    this.scale.off('resize', this.handleResize, this);

    // 停止所有 tweens
    this.tweens.killAll();

    // 清理所有计时器
    this.time.removeAllEvents();
  }
}
