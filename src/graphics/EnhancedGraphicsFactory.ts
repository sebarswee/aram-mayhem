import Phaser from 'phaser';

/**
 * 增强版像素风格图形工厂
 * 在原有基础上添加更多视觉细节和动画帧
 */
export class EnhancedGraphicsFactory {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 生成增强版素材
   */
  generateEnhanced(): void {
    this.createEnhancedPlayerSprites();
    this.createEnhancedEnemySprites();
    this.createEnhancedProjectileSprites();
    this.createEnhancedParticles();
    this.createUIElements();
  }

  /**
   * 创建增强版玩家精灵
   * 包含多个动画帧和发光效果
   */
  private createEnhancedPlayerSprites(): void {
    // === 主精灵 (48x48) ===
    const size = 48;
    const graphics = this.scene.add.graphics();

    // 外发光边缘
    graphics.lineStyle(2, 0x66ccff, 0.6);
    graphics.strokeCircle(size / 2, size / 2, 20);

    // 披风外层 - 深蓝色
    this.drawDetailedCircle(graphics, size / 2, size / 2, 16, 0x1a3a5c);

    // 披风中层 - 蓝色
    this.drawDetailedCircle(graphics, size / 2, size / 2, 13, 0x2d4a6f);

    // 身体内层 - 浅蓝色
    this.drawDetailedCircle(graphics, size / 2, size / 2, 10, 0x4a7db8);

    // 头部
    this.drawDetailedCircle(graphics, size / 2, size / 2 - 4, 7, 0xffdbac);
    graphics.fillStyle(0xffeedd, 1);
    graphics.fillRect(size / 2 - 5, size / 2 - 9, 10, 2); // 额头高光

    // 眼睛 - 更精细
    graphics.fillStyle(0x1a1a2e, 1);
    graphics.fillRect(size / 2 - 4, size / 2 - 6, 2, 3);
    graphics.fillRect(size / 2 + 2, size / 2 - 6, 2, 3);

    // 眼睛高光
    graphics.fillStyle(0xffffff, 0.8);
    graphics.fillRect(size / 2 - 4, size / 2 - 7, 1, 1);
    graphics.fillRect(size / 2 + 2, size / 2 - 7, 1, 1);

    // 装饰纹路 - 披风
    graphics.lineStyle(1, 0x66ccff, 0.4);
    graphics.lineBetween(size / 2 - 8, size / 2 + 4, size / 2 + 8, size / 2 + 12);
    graphics.lineBetween(size / 2 + 8, size / 2 + 4, size / 2 - 8, size / 2 + 12);

    graphics.generateTexture('player', size, size);
    graphics.destroy();

    // === 受击精灵 (闪烁版本) ===
    this.createPlayerHitSprite();

    // === 移动动画帧 ===
    this.createPlayerWalkFrames();
  }

  /**
   * 创建玩家受击精灵
   */
  private createPlayerHitSprite(): void {
    const size = 48;
    const graphics = this.scene.add.graphics();

    // 受击时变红
    graphics.lineStyle(2, 0xff4444, 0.8);
    graphics.strokeCircle(size / 2, size / 2, 20);

    this.drawDetailedCircle(graphics, size / 2, size / 2, 16, 0x4a2020);
    this.drawDetailedCircle(graphics, size / 2, size / 2, 13, 0x6a3030);
    this.drawDetailedCircle(graphics, size / 2, size / 2, 10, 0x8a4040);
    this.drawDetailedCircle(graphics, size / 2, size / 2 - 4, 7, 0xffaaaa);

    graphics.fillStyle(0x1a1a2e, 1);
    graphics.fillRect(size / 2 - 4, size / 2 - 6, 2, 3);
    graphics.fillRect(size / 2 + 2, size / 2 - 6, 2, 3);

    graphics.generateTexture('player_hit', size, size);
    graphics.destroy();
  }

  /**
   * 创建玩家行走动画帧
   */
  private createPlayerWalkFrames(): void {
    const size = 48;
    const frameCount = 4;

    for (let frame = 0; frame < frameCount; frame++) {
      const graphics = this.scene.add.graphics();
      const bounce = Math.sin((frame / frameCount) * Math.PI * 2) * 2;

      // 外发光
      graphics.lineStyle(2, 0x66ccff, 0.5 + Math.abs(bounce) * 0.1);
      graphics.strokeCircle(size / 2, size / 2 + bounce, 20);

      // 披风 (随动画波动)
      this.drawDetailedCircle(graphics, size / 2, size / 2 + bounce, 16, 0x1a3a5c);
      this.drawDetailedCircle(graphics, size / 2, size / 2 + bounce, 13, 0x2d4a6f);
      this.drawDetailedCircle(graphics, size / 2, size / 2 + bounce, 10, 0x4a7db8);

      // 头部
      this.drawDetailedCircle(graphics, size / 2, size / 2 - 4 + bounce, 7, 0xffdbac);

      // 眼睛
      graphics.fillStyle(0x1a1a2e, 1);
      graphics.fillRect(size / 2 - 4, size / 2 - 6 + bounce, 2, 3);
      graphics.fillRect(size / 2 + 2, size / 2 - 6 + bounce, 2, 3);

      graphics.generateTexture(`player_walk_${frame}`, size, size);
      graphics.destroy();
    }
  }

  /**
   * 创建增强版敌人精灵
   */
  private createEnhancedEnemySprites(): void {
    // 史莱姆系列 - 添加弹跳动画帧
    this.createEnhancedSlimeSprites();

    // 元素精灵系列 - 添加光晕效果
    this.createEnhancedElementalSprites();

    // Boss - 添加更精细的细节
    this.createEnhancedBossSprites();
  }

  /**
   * 创建增强版史莱姆精灵
   */
  private createEnhancedSlimeSprites(): void {
    const slimeTypes = [
      { key: 'flame_slime', color: 0xff4400, glowColor: 0xff8800 },
      { key: 'water_slime', color: 0x4488ff, glowColor: 0x66aaff },
      { key: 'ice_slime', color: 0x88ddff, glowColor: 0xaaeeff },
      { key: 'lightning_slime', color: 0xffff44, glowColor: 0xffffaa },
      { key: 'holy_slime', color: 0xffcc00, glowColor: 0xffdd66 },
      { key: 'shadow_slime', color: 0x8800ff, glowColor: 0xaa44ff },
      { key: 'grass_slime', color: 0x44ff44, glowColor: 0x66ff88 },
      { key: 'earth_slime', color: 0xaa8844, glowColor: 0xccaa66 },
    ];

    for (const slime of slimeTypes) {
      this.createSingleSlimeSprite(slime.key, slime.color, slime.glowColor);
    }
  }

  /**
   * 创建单个史莱姆精灵（增强版）
   */
  private createSingleSlimeSprite(key: string, color: number, glowColor: number): void {
    const size = 40;
    const graphics = this.scene.add.graphics();

    // 底部阴影
    graphics.fillStyle(0x000000, 0.2);
    graphics.fillEllipse(size / 2, size / 2 + 10, 34, 10);

    // 外发光
    graphics.fillStyle(glowColor, 0.15);
    graphics.fillEllipse(size / 2, size / 2 + 4, 38, 30);

    // 身体主体
    graphics.fillStyle(color, 1);
    graphics.fillEllipse(size / 2, size / 2 + 4, 32, 24);

    // 身体暗部
    graphics.fillStyle(this.darken(color, 0.3), 0.5);
    graphics.fillEllipse(size / 2, size / 2 + 8, 28, 12);

    // 身体高光
    graphics.fillStyle(0xffffff, 0.5);
    graphics.fillEllipse(size / 2 - 6, size / 2 - 2, 10, 8);

    // 次高光
    graphics.fillStyle(0xffffff, 0.25);
    graphics.fillEllipse(size / 2 + 4, size / 2 + 2, 6, 4);

    // 眼睛
    graphics.fillStyle(0x111111, 1);
    graphics.fillCircle(size / 2 - 6, size / 2, 3);
    graphics.fillCircle(size / 2 + 6, size / 2, 3);

    // 瞳孔高光
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(size / 2 - 5, size / 2 - 1, 1);
    graphics.fillCircle(size / 2 + 7, size / 2 - 1, 1);

    // 小嘴巴
    graphics.lineStyle(1, this.darken(color, 0.4), 1);
    graphics.strokeCircle(size / 2, size / 2 + 6, 2);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  /**
   * 创建增强版元素精灵
   */
  private createEnhancedElementalSprites(): void {
    const elementals = [
      { key: 'water_elemental', color: 0x4488ff },
      { key: 'frost_ghost', color: 0x88ddff },
      { key: 'thunder_spirit', color: 0xffff44 },
      { key: 'holy_sprite', color: 0xffcc00 },
      { key: 'shadow_demon', color: 0x8800ff },
      { key: 'vine_monster', color: 0x44ff44 },
      { key: 'rock_golem', color: 0xaa8844 },
    ];

    for (const elemental of elementals) {
      this.createSingleElementalSprite(elemental.key, elemental.color);
    }
  }

  /**
   * 创建单个元素精灵（增强版）
   */
  private createSingleElementalSprite(key: string, color: number): void {
    const size = 44;
    const graphics = this.scene.add.graphics();

    // 外部光晕
    graphics.fillStyle(color, 0.1);
    graphics.fillCircle(size / 2, size / 2, 20);

    // 身体
    graphics.fillStyle(color, 0.9);
    graphics.fillCircle(size / 2, size / 2, 14);

    // 内部亮部
    graphics.fillStyle(this.lighten(color, 0.3), 0.6);
    graphics.fillCircle(size / 2 - 3, size / 2 - 3, 8);

    // 核心发光点
    graphics.fillStyle(0xffffff, 0.8);
    graphics.fillCircle(size / 2 - 4, size / 2 - 4, 3);

    // 能量波纹
    graphics.lineStyle(1, color, 0.4);
    graphics.strokeCircle(size / 2, size / 2, 16);
    graphics.strokeCircle(size / 2, size / 2, 18);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  /**
   * 创建增强版Boss精灵
   */
  private createEnhancedBossSprites(): void {
    const bosses = [
      { key: 'boss_flame_lord', color: 0xff0000, size: 96 },
      { key: 'boss_frost_giant', color: 0x44aaff, size: 96 },
      { key: 'boss_thunder_dragon', color: 0xaaaa00, size: 96 },
      { key: 'boss_shadow_king', color: 0x4400aa, size: 96 },
      { key: 'boss_nature_guardian', color: 0x22cc22, size: 96 },
      { key: 'boss_golem_lord', color: 0x886622, size: 96 },
      { key: 'boss_fallen_angel', color: 0xccaa00, size: 96 },
      { key: 'boss_hydra', color: 0x2266cc, size: 96 },
    ];

    for (const boss of bosses) {
      this.createSingleBossSprite(boss.key, boss.color, boss.size);
    }
  }

  /**
   * 创建单个Boss精灵（增强版）
   */
  private createSingleBossSprite(key: string, color: number, size: number): void {
    const graphics = this.scene.add.graphics();

    // 外部光环
    graphics.fillStyle(color, 0.1);
    graphics.fillCircle(size / 2, size / 2, size / 2 - 4);

    // 多层身体
    graphics.fillStyle(this.darken(color, 0.3), 1);
    graphics.fillCircle(size / 2, size / 2, size / 2 - 8);

    graphics.fillStyle(color, 1);
    graphics.fillCircle(size / 2, size / 2, size / 2 - 14);

    graphics.fillStyle(this.lighten(color, 0.2), 0.8);
    graphics.fillCircle(size / 2 - 8, size / 2 - 8, size / 4);

    // 核心发光
    graphics.fillStyle(0xffffff, 0.9);
    graphics.fillCircle(size / 2 - 10, size / 2 - 10, size / 8);

    // 眼睛
    graphics.fillStyle(0xff0000, 1);
    graphics.fillCircle(size / 2 - 12, size / 2 - 4, 6);
    graphics.fillCircle(size / 2 + 12, size / 2 - 4, 6);

    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(size / 2 - 10, size / 2 - 6, 2);
    graphics.fillCircle(size / 2 + 14, size / 2 - 6, 2);

    // 能量线条
    graphics.lineStyle(2, this.lighten(color, 0.4), 0.6);
    graphics.strokeCircle(size / 2, size / 2, size / 2 - 6);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  /**
   * 创建增强版投射物精灵
   */
  private createEnhancedProjectileSprites(): void {
    const projectiles = [
      { key: 'proj_fireball', color: 0xff4400, size: 24 },
      { key: 'proj_water_bullet', color: 0x4488ff, size: 16 },
      { key: 'proj_ice_shard', color: 0x88ddff, size: 20 },
      { key: 'proj_lightning_bolt', color: 0xffff44, size: 24 },
      { key: 'proj_holy_light', color: 0xffcc00, size: 20 },
      { key: 'proj_shadow_bolt', color: 0x8800ff, size: 20 },
      { key: 'proj_vine', color: 0x44ff44, size: 20 },
      { key: 'proj_rock', color: 0xaa8844, size: 20 },
    ];

    for (const proj of projectiles) {
      this.createSingleProjectile(proj.key, proj.color, proj.size);
    }
  }

  /**
   * 创建单个投射物精灵（增强版）
   */
  private createSingleProjectile(key: string, color: number, size: number): void {
    const graphics = this.scene.add.graphics();

    // 外发光
    graphics.fillStyle(color, 0.2);
    graphics.fillCircle(size / 2, size / 2, size / 2);

    // 核心
    graphics.fillStyle(color, 0.9);
    graphics.fillCircle(size / 2, size / 2, size / 3);

    // 高光
    graphics.fillStyle(0xffffff, 0.8);
    graphics.fillCircle(size / 2 - 2, size / 2 - 2, size / 6);

    // 拖尾点（用于创建拖尾效果的参考）
    graphics.fillStyle(this.lighten(color, 0.3), 0.4);
    graphics.fillCircle(size / 2 + 4, size / 2 + 4, size / 5);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  /**
   * 创建增强版粒子纹理
   */
  private createEnhancedParticles(): void {
    // 通用发光粒子（增强版）
    const size = 16;
    const graphics = this.scene.add.graphics();

    // 外层柔和光晕
    graphics.fillStyle(0xffffff, 0.2);
    graphics.fillCircle(size / 2, size / 2, 8);

    // 中层
    graphics.fillStyle(0xffffff, 0.5);
    graphics.fillCircle(size / 2, size / 2, 5);

    // 核心
    graphics.fillStyle(0xffffff, 0.9);
    graphics.fillCircle(size / 2, size / 2, 3);

    graphics.generateTexture('particle_glow_enhanced', size, size);
    graphics.destroy();

    // 元素粒子
    this.createElementalParticles();
  }

  /**
   * 创建元素粒子纹理
   */
  private createElementalParticles(): void {
    const elements = [
      { key: 'particle_fire', color: 0xff4400 },
      { key: 'particle_water', color: 0x4488ff },
      { key: 'particle_ice', color: 0x88ddff },
      { key: 'particle_lightning', color: 0xffff44 },
      { key: 'particle_holy', color: 0xffcc00 },
      { key: 'particle_shadow', color: 0x8800ff },
      { key: 'particle_grass', color: 0x44ff44 },
      { key: 'particle_earth', color: 0xaa8844 },
    ];

    for (const element of elements) {
      const size = 12;
      const graphics = this.scene.add.graphics();

      // 外发光
      graphics.fillStyle(element.color, 0.3);
      graphics.fillCircle(size / 2, size / 2, 6);

      // 核心
      graphics.fillStyle(element.color, 0.9);
      graphics.fillCircle(size / 2, size / 2, 4);

      // 中心亮点
      graphics.fillStyle(0xffffff, 0.7);
      graphics.fillCircle(size / 2 - 1, size / 2 - 1, 2);

      graphics.generateTexture(element.key, size, size);
      graphics.destroy();
    }
  }

  /**
   * 创建UI元素
   */
  private createUIElements(): void {
    // 技能槽边框
    this.createSkillSlotFrame();

    // 按钮背景
    this.createButtonBackground();

    // 面板边框
    this.createPanelFrame();
  }

  /**
   * 创建技能槽边框
   */
  private createSkillSlotFrame(): void {
    const size = 64;
    const graphics = this.scene.add.graphics();

    // 外框
    graphics.lineStyle(2, 0x66ccff, 0.8);
    graphics.strokeRoundedRect(2, 2, size - 4, size - 4, 8);

    // 内框高光
    graphics.lineStyle(1, 0x88ddff, 0.5);
    graphics.strokeRoundedRect(4, 4, size - 8, size - 8, 6);

    // 角落装饰
    graphics.fillStyle(0x66ccff, 0.6);
    graphics.fillRect(2, 2, 6, 2);
    graphics.fillRect(2, 2, 2, 6);
    graphics.fillRect(size - 8, 2, 6, 2);
    graphics.fillRect(size - 4, 2, 2, 6);
    graphics.fillRect(2, size - 4, 6, 2);
    graphics.fillRect(2, size - 8, 2, 6);
    graphics.fillRect(size - 8, size - 4, 6, 2);
    graphics.fillRect(size - 4, size - 8, 2, 6);

    graphics.generateTexture('ui_skill_slot', size, size);
    graphics.destroy();
  }

  /**
   * 创建按钮背景
   */
  private createButtonBackground(): void {
    const width = 200;
    const height = 50;
    const graphics = this.scene.add.graphics();

    // 按钮阴影
    graphics.fillStyle(0x000000, 0.3);
    graphics.fillRoundedRect(4, 4, width - 4, height - 4, 10);

    // 按钮主体
    graphics.fillStyle(0x4a7db8, 1);
    graphics.fillRoundedRect(0, 0, width - 4, height - 4, 10);

    // 高光边缘
    graphics.lineStyle(2, 0x66ccff, 0.8);
    graphics.strokeRoundedRect(0, 0, width - 4, height - 4, 10);

    // 顶部高光
    graphics.fillStyle(0xffffff, 0.15);
    graphics.fillRoundedRect(4, 4, width - 12, height / 3, 6);

    graphics.generateTexture('ui_button', width, height);
    graphics.destroy();
  }

  /**
   * 创建面板边框
   */
  private createPanelFrame(): void {
    const width = 400;
    const height = 300;
    const graphics = this.scene.add.graphics();

    // 背景
    graphics.fillStyle(0x1a1a2e, 0.95);
    graphics.fillRoundedRect(0, 0, width, height, 15);

    // 外边框
    graphics.lineStyle(2, 0x66ccff, 0.6);
    graphics.strokeRoundedRect(0, 0, width, height, 15);

    // 内边框
    graphics.lineStyle(1, 0x4a5a7e, 0.4);
    graphics.strokeRoundedRect(4, 4, width - 8, height - 8, 12);

    // 角落装饰
    const cornerSize = 20;
    graphics.fillStyle(0x66ccff, 0.3);
    graphics.fillRect(0, 0, cornerSize, 3);
    graphics.fillRect(0, 0, 3, cornerSize);
    graphics.fillRect(width - cornerSize, 0, cornerSize, 3);
    graphics.fillRect(width - 3, 0, 3, cornerSize);
    graphics.fillRect(0, height - 3, cornerSize, 3);
    graphics.fillRect(0, height - cornerSize, 3, cornerSize);
    graphics.fillRect(width - cornerSize, height - 3, cornerSize, 3);
    graphics.fillRect(width - 3, height - cornerSize, 3, cornerSize);

    graphics.generateTexture('ui_panel', width, height);
    graphics.destroy();
  }

  // === 辅助方法 ===

  /**
   * 绘制精细圆形（带边缘高光）
   */
  private drawDetailedCircle(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    radius: number,
    color: number
  ): void {
    // 主体
    graphics.fillStyle(color, 1);
    graphics.fillCircle(x, y, radius);

    // 边缘暗部
    graphics.fillStyle(this.darken(color, 0.2), 0.3);
    graphics.fillCircle(x + 1, y + 1, radius - 1);
  }

  /**
   * 调亮颜色
   */
  private lighten(color: number, amount: number): number {
    const r = Math.min(255, ((color >> 16) & 0xff) + 255 * amount);
    const g = Math.min(255, ((color >> 8) & 0xff) + 255 * amount);
    const b = Math.min(255, (color & 0xff) + 255 * amount);
    return (r << 16) | (g << 8) | b;
  }

  /**
   * 调暗颜色
   */
  private darken(color: number, amount: number): number {
    const r = Math.max(0, ((color >> 16) & 0xff) * (1 - amount));
    const g = Math.max(0, ((color >> 8) & 0xff) * (1 - amount));
    const b = Math.max(0, (color & 0xff) * (1 - amount));
    return (r << 16) | (g << 8) | b;
  }
}
