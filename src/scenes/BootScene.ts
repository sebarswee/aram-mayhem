import Phaser from 'phaser';
import { GraphicsFactory } from '@/graphics/GraphicsFactory';
import { EnhancedGraphicsFactory } from '@/graphics/EnhancedGraphicsFactory';
import { JoystickMode } from '@/ui/VirtualJoystick';
import { updateGameSize } from '@/config/game.config';

// 全局设置存储
declare global {
  interface Window {
    gameSettings: {
      joystickMode: JoystickMode;
    };
  }
}

export class BootScene extends Phaser.Scene {
  private joystickMode: JoystickMode = 'follow';
  private progressBox!: Phaser.GameObjects.Graphics;
  private loadingBar!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private percentText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // 更新游戏尺寸
    const width = this.scale.width;
    const height = this.scale.height;
    updateGameSize(width, height);

    // 加载地面平铺纹理
    this.load.image('ground_tile', 'assets/backgrounds/ground_tile.png');

    // 加载玩家精灵表素材
    this.load.spritesheet('player_idle', 'assets/characters/player/player_idle.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('player_move', 'assets/characters/player/player_move.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('player_attack', 'assets/characters/player/player_attack.png', {
      frameWidth: 64,
      frameHeight: 64,
    });

    // 加载普通敌人精灵表素材 (64x64)
    const normalEnemies = [
      'flame_slime', 'water_elemental', 'frost_ghost', 'thunder_spirit',
      'holy_sprite', 'shadow_demon', 'vine_monster', 'rock_golem'
    ];
    for (const enemyId of normalEnemies) {
      this.load.spritesheet(`${enemyId}_idle`, `assets/characters/enemies/normal/${enemyId}_idle.png`, {
        frameWidth: 64,
        frameHeight: 64,
      });
      this.load.spritesheet(`${enemyId}_move`, `assets/characters/enemies/normal/${enemyId}_move.png`, {
        frameWidth: 64,
        frameHeight: 64,
      });
      this.load.spritesheet(`${enemyId}_attack`, `assets/characters/enemies/normal/${enemyId}_attack.png`, {
        frameWidth: 64,
        frameHeight: 64,
      });
    }

    // 加载精英敌人精灵表素材 (96x96)
    const eliteEnemies = [
      'elite_flame_lord', 'elite_water_elemental', 'elite_frost_titan',
      'elite_storm_drake', 'elite_shadow_lord'
    ];
    for (const enemyId of eliteEnemies) {
      this.load.spritesheet(`${enemyId}_idle`, `assets/characters/enemies/elite/${enemyId}_idle.png`, {
        frameWidth: 96,
        frameHeight: 96,
      });
      this.load.spritesheet(`${enemyId}_move`, `assets/characters/enemies/elite/${enemyId}_move.png`, {
        frameWidth: 96,
        frameHeight: 96,
      });
      this.load.spritesheet(`${enemyId}_attack`, `assets/characters/enemies/elite/${enemyId}_attack.png`, {
        frameWidth: 96,
        frameHeight: 96,
      });
    }

    // 加载 Boss 精灵表素材 (128x128)
    const bossEnemies = [
      'boss_flame_lord', 'boss_frost_giant', 'boss_thunder_dragon',
      'boss_shadow_king', 'boss_nature_guardian', 'boss_golem_lord',
      'boss_fallen_angel', 'boss_hydra'
    ];
    for (const enemyId of bossEnemies) {
      this.load.spritesheet(`${enemyId}_idle`, `assets/characters/bosses/${enemyId}_idle.png`, {
        frameWidth: 128,
        frameHeight: 128,
      });
      this.load.spritesheet(`${enemyId}_move`, `assets/characters/bosses/${enemyId}_move.png`, {
        frameWidth: 128,
        frameHeight: 128,
      });
      this.load.spritesheet(`${enemyId}_attack`, `assets/characters/bosses/${enemyId}_attack.png`, {
        frameWidth: 128,
        frameHeight: 128,
      });
    }

    // 加载陨石技能素材
    this.load.image('meteor_falling', 'assets/particles/meteor_falling.png');
    this.load.image('particle_magma', 'assets/particles/particle_magma.png');
    this.load.image('particle_rock', 'assets/particles/particle_rock.png');

    // 加载炎龙吐息技能素材
    this.load.image('dragon_head', 'assets/effects/dragon_head.png');

    // 加载烈焰风暴技能素材
    this.load.image('fire_sprite', 'assets/effects/fire_sprite.png');

    // 加载深渊漩涡技能素材
    this.load.image('vortex_center', 'assets/effects/vortex_center.png');

    // 加载冰封领域技能素材
    this.load.image('ice_crystal_core', 'assets/effects/ice_crystal_core.png');
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // 创建背景
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRect(0, 0, width, height);

    // 标题
    const titleText = this.add.text(width / 2, height * 0.25, '🎮 技能乱斗', {
      font: `bold ${Math.min(48, width / 15)}px Arial`,
      color: '#66ccff',
      stroke: '#000000',
      strokeThickness: 4,
    });
    titleText.setOrigin(0.5, 0.5);

    // 副标题
    const subtitleText = this.add.text(width / 2, height * 0.25 + 50, 'Skill Brawl', {
      font: `${Math.min(24, width / 30)}px Arial`,
      color: '#aaaaaa',
    });
    subtitleText.setOrigin(0.5, 0.5);

    // 加载进度条背景
    const barWidth = Math.min(300, width * 0.5);
    const barHeight = Math.min(20, height * 0.03);
    const barY = height * 0.5;

    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x333355, 0.8);
    this.progressBox.fillRoundedRect(width / 2 - barWidth / 2, barY, barWidth, barHeight, 5);

    // 加载进度条
    this.loadingBar = this.add.graphics();

    // 加载文字
    this.loadingText = this.add.text(width / 2, barY - 30, '正在加载资源...', {
      font: `${Math.min(18, width / 35)}px Arial`,
      color: '#ffffff',
    });
    this.loadingText.setOrigin(0.5, 0.5);

    // 百分比文字
    this.percentText = this.add.text(width / 2, barY + barHeight + 20, '0%', {
      font: `${Math.min(20, width / 30)}px Arial`,
      color: '#66ccff',
    });
    this.percentText.setOrigin(0.5, 0.5);

    // 开始异步加载资源
    this.loadAssets(width, height, barWidth, barHeight, barY);
  }

  private async loadAssets(
    width: number,
    height: number,
    barWidth: number,
    barHeight: number,
    barY: number
  ): Promise<void> {
    // 添加加载错误处理
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.warn(`Failed to load: ${file.key}, falling back to generated textures`);
    });

    // 模拟加载进度，因为 GraphicsFactory 是同步的
    const steps = 10;
    const delayPerStep = 100; // 每步100ms

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;

      // 更新进度条
      this.loadingBar.clear();
      this.loadingBar.fillStyle(0x66ccff, 1);
      this.loadingBar.fillRoundedRect(
        width / 2 - barWidth / 2,
        barY,
        barWidth * progress,
        barHeight,
        5
      );

      // 更新百分比文字
      this.percentText.setText(`${Math.floor(progress * 100)}%`);

      // 在进度50%时生成纹理（如果不存在）
      if (i === 5) {
        this.loadingText.setText('正在生成像素素材...');
        // 检查玩家素材是否已加载
        const playerLoaded = this.textures.exists('player_idle');
        // 检查敌人素材是否已加载（检查一个普通敌人作为标志）
        const enemiesLoaded = this.textures.exists('flame_slime_idle');

        if (!playerLoaded) {
          console.log('[BootScene] Player assets not loaded, generating fallback textures');
        } else {
          console.log('[BootScene] Player assets loaded successfully');
        }

        if (!enemiesLoaded) {
          console.log('[BootScene] Enemy assets not loaded, generating fallback textures');
        } else {
          console.log('[BootScene] Enemy assets loaded successfully');
        }

        // 检查 Boss 素材是否已加载
        const bossesLoaded = this.textures.exists('boss_flame_lord_idle');
        if (!bossesLoaded) {
          console.log('[BootScene] Boss assets not loaded, generating fallback textures');
        } else {
          console.log('[BootScene] Boss assets loaded successfully');
        }

        const graphicsFactory = new GraphicsFactory(this);

        if (!playerLoaded) {
          graphicsFactory.generatePlayerSprite();
        }

        if (!enemiesLoaded) {
          graphicsFactory.generateEnemySprites();
        }

        if (!bossesLoaded) {
          graphicsFactory.generateBossSprites();
        }

        // 其他素材始终需要生成
        graphicsFactory.generateProjectileSprites();
        graphicsFactory.generateEffectSprites();
        graphicsFactory.generateParticles();
        graphicsFactory.generateSkillIcons();
        graphicsFactory.generateFoodSprites();
        graphicsFactory.generateExpOrbSprites();

        // 创建玩家动画
        this.createPlayerAnimations();
        // 创建敌人动画
        this.createEnemyAnimations();
      }

      // 在进度80%时初始化状态
      if (i === 8) {
        this.loadingText.setText('正在初始化游戏...');
        this.registry.set('gameState', this.createInitialState());
        window.gameSettings = {
          joystickMode: this.joystickMode,
        };
      }

      // 等待一段时间
      await this.delay(delayPerStep);
    }

    // 加载完成
    this.loadingText.setText('加载完成！');

    // 短暂延迟后显示开始按钮
    await this.delay(300);

    // 清理加载界面
    this.progressBox.destroy();
    this.loadingBar.destroy();
    this.loadingText.destroy();
    this.percentText.destroy();

    // 显示开始界面
    this.showStartScreen(width, height);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      this.time.delayedCall(ms, resolve);
    });
  }

  private showStartScreen(width: number, height: number): void {
    // 创建开始按钮
    this.createStartButton(width, height);

    // 创建设置按钮
    this.createSettingsButton(width, height);
  }

  private createStartButton(width: number, height: number): void {
    const btnWidth = Math.min(200, width * 0.4);
    const btnHeight = Math.min(50, height * 0.08);
    const btnY = height * 0.5;

    // 按钮背景
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(0x4a7db8, 1);
    buttonBg.fillRoundedRect(width / 2 - btnWidth / 2, btnY, btnWidth, btnHeight, 10);
    buttonBg.lineStyle(3, 0x66ccff, 1);
    buttonBg.strokeRoundedRect(width / 2 - btnWidth / 2, btnY, btnWidth, btnHeight, 10);

    // 按钮文字
    const buttonText = this.add.text(width / 2, btnY + btnHeight / 2, '开始游戏', {
      font: `bold ${Math.min(24, width / 25)}px Arial`,
      color: '#ffffff',
    });
    buttonText.setOrigin(0.5, 0.5);

    // 按钮交互区域
    const hitArea = this.add.rectangle(width / 2, btnY + btnHeight / 2, btnWidth, btnHeight, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });

    // 悬停效果
    hitArea.on('pointerover', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0x5a8dc8, 1);
      buttonBg.fillRoundedRect(width / 2 - btnWidth / 2, btnY, btnWidth, btnHeight, 10);
      buttonBg.lineStyle(3, 0x88ddff, 1);
      buttonBg.strokeRoundedRect(width / 2 - btnWidth / 2, btnY, btnWidth, btnHeight, 10);
    });

    hitArea.on('pointerout', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0x4a7db8, 1);
      buttonBg.fillRoundedRect(width / 2 - btnWidth / 2, btnY, btnWidth, btnHeight, 10);
      buttonBg.lineStyle(3, 0x66ccff, 1);
      buttonBg.strokeRoundedRect(width / 2 - btnWidth / 2, btnY, btnWidth, btnHeight, 10);
    });

    // 点击开始游戏
    hitArea.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('BattleScene');
      });
    });

    // 提示文字
    const tipText = this.add.text(width / 2, height - 30, 'WASD / 方向键 移动', {
      font: `${Math.min(14, width / 40)}px Arial`,
      color: '#666666',
    });
    tipText.setOrigin(0.5, 0.5);

    // 键盘也可以开始
    this.input.keyboard?.once('keydown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('BattleScene');
      });
    });
  }

  private createSettingsButton(width: number, height: number): void {
    const settingsBtn = this.add.text(width - 50, 30, '⚙️', {
      font: `${Math.min(32, width / 20)}px Arial`,
    });
    settingsBtn.setOrigin(0.5, 0.5);
    settingsBtn.setInteractive({ useHandCursor: true });

    settingsBtn.on('pointerover', () => settingsBtn.setScale(1.2));
    settingsBtn.on('pointerout', () => settingsBtn.setScale(1));
    settingsBtn.on('pointerdown', () => this.showSettingsPanel(width, height));
  }

  private showSettingsPanel(width: number, height: number): void {
    const panelWidth = Math.min(400, width * 0.8);
    const panelHeight = Math.min(300, height * 0.6);

    // 半透明背景
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    overlay.setDepth(100);
    overlay.setInteractive();

    // 设置面板
    const panel = this.add.graphics();
    panel.fillStyle(0x2a2a4e, 1);
    panel.fillRoundedRect(width / 2 - panelWidth / 2, height / 2 - panelHeight / 2, panelWidth, panelHeight, 15);
    panel.lineStyle(3, 0x66ccff, 1);
    panel.strokeRoundedRect(width / 2 - panelWidth / 2, height / 2 - panelHeight / 2, panelWidth, panelHeight, 15);
    panel.setDepth(101);

    // 标题
    const title = this.add.text(width / 2, height / 2 - panelHeight / 2 + 30, '⚙️ 设置', {
      font: `bold ${Math.min(28, width / 20)}px Arial`,
      color: '#66ccff',
    });
    title.setOrigin(0.5, 0.5);
    title.setDepth(102);

    // 摇杆模式标题
    const modeTitle = this.add.text(width / 2, height / 2 - 20, '虚拟摇杆模式', {
      font: `${Math.min(20, width / 30)}px Arial`,
      color: '#ffffff',
    });
    modeTitle.setOrigin(0.5, 0.5);
    modeTitle.setDepth(102);

    // 跟随手指按钮
    const followBtn = this.createModeButton(
      width / 2 - panelWidth / 4,
      height / 2 + 30,
      '跟随手指',
      'follow'
    );

    // 固定位置按钮
    const fixedBtn = this.createModeButton(
      width / 2 + panelWidth / 4,
      height / 2 + 30,
      '固定位置',
      'fixed'
    );

    // 关闭按钮
    const closeBtn = this.add.text(width / 2, height / 2 + panelHeight / 2 - 50, '关闭', {
      font: `${Math.min(20, width / 30)}px Arial`,
      color: '#ff6666',
      backgroundColor: '#442222',
      padding: { x: 30, y: 10 },
    });
    closeBtn.setOrigin(0.5, 0.5);
    closeBtn.setDepth(102);
    closeBtn.setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
      overlay.destroy();
      panel.destroy();
      title.destroy();
      modeTitle.destroy();
      followBtn.destroy();
      fixedBtn.destroy();
      closeBtn.destroy();
    });
  }

  private createModeButton(x: number, y: number, text: string, mode: JoystickMode): Phaser.GameObjects.Text {
    const isSelected = this.joystickMode === mode;
    const color = isSelected ? '#66ccff' : '#888888';
    const bgColor = isSelected ? '#224466' : '#333344';

    const button = this.add.text(x, y, text, {
      font: `${Math.min(18, this.scale.width / 35)}px Arial`,
      color: color,
      backgroundColor: bgColor,
      padding: { x: 20, y: 10 },
    });
    button.setOrigin(0.5, 0.5);
    button.setDepth(102);
    button.setInteractive({ useHandCursor: true });

    button.on('pointerdown', () => {
      this.joystickMode = mode;
      window.gameSettings.joystickMode = mode;
      this.scene.restart();
    });

    return button;
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

  /**
   * 创建玩家动画
   */
  private createPlayerAnimations(): void {
    // 检查素材是否存在
    if (!this.textures.exists('player_idle')) {
      console.warn('[BootScene] Player textures not loaded, skipping animations');
      return;
    }

    // 待机动画
    if (!this.anims.exists('player_idle_anim')) {
      this.anims.create({
        key: 'player_idle_anim',
        frames: this.anims.generateFrameNumbers('player_idle', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1,
      });
    }

    // 移动动画
    if (!this.anims.exists('player_move_anim')) {
      this.anims.create({
        key: 'player_move_anim',
        frames: this.anims.generateFrameNumbers('player_move', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1,
      });
    }

    // 攻击动画
    if (!this.anims.exists('player_attack_anim')) {
      this.anims.create({
        key: 'player_attack_anim',
        frames: this.anims.generateFrameNumbers('player_attack', { start: 0, end: 3 }),
        frameRate: 12,
        repeat: 0, // 攻击动画只播放一次
      });
    }

    console.log('[BootScene] Player animations created');
  }

  /**
   * 创建敌人动画
   */
  private createEnemyAnimations(): void {
    // 普通敌人动画
    const normalEnemies = [
      'flame_slime', 'water_elemental', 'frost_ghost', 'thunder_spirit',
      'holy_sprite', 'shadow_demon', 'vine_monster', 'rock_golem'
    ];

    for (const enemyId of normalEnemies) {
      if (this.textures.exists(`${enemyId}_idle`)) {
        // 待机动画
        if (!this.anims.exists(`${enemyId}_idle_anim`)) {
          this.anims.create({
            key: `${enemyId}_idle_anim`,
            frames: this.anims.generateFrameNumbers(`${enemyId}_idle`, { start: 0, end: 3 }),
            frameRate: 6,
            repeat: -1,
          });
        }
        // 移动动画
        if (!this.anims.exists(`${enemyId}_move_anim`)) {
          this.anims.create({
            key: `${enemyId}_move_anim`,
            frames: this.anims.generateFrameNumbers(`${enemyId}_move`, { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1,
          });
        }
        // 攻击动画
        if (!this.anims.exists(`${enemyId}_attack_anim`)) {
          this.anims.create({
            key: `${enemyId}_attack_anim`,
            frames: this.anims.generateFrameNumbers(`${enemyId}_attack`, { start: 0, end: 3 }),
            frameRate: 10,
            repeat: 0,
          });
        }
      }
    }

    // 精英敌人动画
    const eliteEnemies = [
      'elite_flame_lord', 'elite_water_elemental', 'elite_frost_titan',
      'elite_storm_drake', 'elite_shadow_lord'
    ];

    for (const enemyId of eliteEnemies) {
      if (this.textures.exists(`${enemyId}_idle`)) {
        // 待机动画
        if (!this.anims.exists(`${enemyId}_idle_anim`)) {
          this.anims.create({
            key: `${enemyId}_idle_anim`,
            frames: this.anims.generateFrameNumbers(`${enemyId}_idle`, { start: 0, end: 3 }),
            frameRate: 6,
            repeat: -1,
          });
        }
        // 移动动画
        if (!this.anims.exists(`${enemyId}_move_anim`)) {
          this.anims.create({
            key: `${enemyId}_move_anim`,
            frames: this.anims.generateFrameNumbers(`${enemyId}_move`, { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1,
          });
        }
        // 攻击动画
        if (!this.anims.exists(`${enemyId}_attack_anim`)) {
          this.anims.create({
            key: `${enemyId}_attack_anim`,
            frames: this.anims.generateFrameNumbers(`${enemyId}_attack`, { start: 0, end: 3 }),
            frameRate: 10,
            repeat: 0,
          });
        }
      }
    }

    // Boss 敌人动画
    const bossEnemies = [
      'boss_flame_lord', 'boss_frost_giant', 'boss_thunder_dragon',
      'boss_shadow_king', 'boss_nature_guardian', 'boss_golem_lord',
      'boss_fallen_angel', 'boss_hydra'
    ];

    for (const enemyId of bossEnemies) {
      if (this.textures.exists(`${enemyId}_idle`)) {
        // 待机动画
        if (!this.anims.exists(`${enemyId}_idle_anim`)) {
          this.anims.create({
            key: `${enemyId}_idle_anim`,
            frames: this.anims.generateFrameNumbers(`${enemyId}_idle`, { start: 0, end: 3 }),
            frameRate: 5,
            repeat: -1,
          });
        }
        // 移动动画
        if (!this.anims.exists(`${enemyId}_move_anim`)) {
          this.anims.create({
            key: `${enemyId}_move_anim`,
            frames: this.anims.generateFrameNumbers(`${enemyId}_move`, { start: 0, end: 3 }),
            frameRate: 7,
            repeat: -1,
          });
        }
        // 攻击动画
        if (!this.anims.exists(`${enemyId}_attack_anim`)) {
          this.anims.create({
            key: `${enemyId}_attack_anim`,
            frames: this.anims.generateFrameNumbers(`${enemyId}_attack`, { start: 0, end: 3 }),
            frameRate: 10,
            repeat: 0,
          });
        }
      }
    }

    console.log('[BootScene] Enemy animations created');
  }
}
