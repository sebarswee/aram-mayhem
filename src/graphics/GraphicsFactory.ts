import Phaser from 'phaser';

/**
 * 像素风格图形工厂
 * 程序化生成游戏所需的所有视觉素材
 */
export class GraphicsFactory {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 生成所有游戏素材
   */
  generateAll(): void {
    this.createPlayerSprite();
    this.createEnemySprites();
    this.createProjectileSprites();
    this.createEffectSprites();
    this.createParticles();
    this.createSkillIcons();
    this.createFoodSprites();
    this.createExpOrbSprites();
  }

  /**
   * 只生成技能图标
   */
  generateSkillIcons(): void {
    this.createSkillIcons();
  }

  /**
   * 创建玩家精灵 - 像素风格角色
   */
  private createPlayerSprite(): void {
    const size = 48;
    const graphics = this.scene.add.graphics();

    // 身体主体 - 深蓝色斗篷
    this.drawPixelCircle(graphics, size / 2, size / 2, 16, 0x2d4a6f);

    // 内层 - 浅蓝色
    this.drawPixelCircle(graphics, size / 2, size / 2, 12, 0x4a7db8);

    // 头部
    this.drawPixelCircle(graphics, size / 2, size / 2 - 4, 8, 0xffdbac);

    // 眼睛
    graphics.fillStyle(0x1a1a2e, 1);
    graphics.fillRect(size / 2 - 4, size / 2 - 6, 2, 2);
    graphics.fillRect(size / 2 + 2, size / 2 - 6, 2, 2);

    // 发光光环
    graphics.lineStyle(2, 0x66ccff, 0.8);
    graphics.strokeCircle(size / 2, size / 2, 18);

    graphics.generateTexture('player', size, size);
    graphics.destroy();
  }

  /**
   * 创建敌人精灵
   */
  private createEnemySprites(): void {
    // === 普通敌人 (8种元素) ===
    // 火焰史莱姆
    this.createSlimeSprite('flame_slime', 0xff4400);

    // 水元素
    this.createElementalSprite('water_elemental', 0x4488ff);

    // 冰霜幽灵
    this.createGhostSprite('frost_ghost', 0x88ddff);

    // 雷电精灵
    this.createSpiritSprite('thunder_spirit', 0xffff00);

    // 圣光精灵
    this.createSpiritSprite('holy_sprite', 0xffcc00);

    // 暗影魔
    this.createDemonSprite('shadow_demon', 0x8800ff);

    // 藤蔓怪
    this.createVineMonsterSprite('vine_monster', 0x44ff44);

    // 岩石巨人
    this.createGolemSprite('rock_golem', 0xaa8844);

    // === 精英敌人 (4种) ===
    // 炎魔精英
    this.createEliteFlameLordSprite('elite_flame_lord', 0xff2200);

    // 霜巨人精英
    this.createEliteFrostTitanSprite('elite_frost_titan', 0x66ccff);

    // 雷龙精英
    this.createEliteStormDrakeSprite('elite_storm_drake', 0xcccc00);

    // 暗影领主
    this.createEliteShadowLordSprite('elite_shadow_lord', 0x6600cc);

    // === Boss敌人 (8种) ===
    // 炎魔
    this.createBossFlameLordSprite('boss_flame_lord', 0xff0000);

    // 霜巨人
    this.createBossFrostGiantSprite('boss_frost_giant', 0x44aaff);

    // 雷龙
    this.createBossThunderDragonSprite('boss_thunder_dragon', 0xaaaa00);

    // 暗影之王
    this.createBossShadowKingSprite('boss_shadow_king', 0x4400aa);

    // 自然守护者
    this.createBossNatureGuardianSprite('boss_nature_guardian', 0x22cc22);

    // 巨像领主
    this.createBossGolemLordSprite('boss_golem_lord', 0x886622);

    // 堕落天使
    this.createBossFallenAngelSprite('boss_fallen_angel', 0xccaa00);

    // 九头蛇
    this.createBossHydraSprite('boss_hydra', 0x2266cc);
  }

  /**
   * 史莱姆精灵
   */
  private createSlimeSprite(key: string, color: number): void {
    const size = 40;
    const graphics = this.scene.add.graphics();

    // 身体 - 椭圆形
    graphics.fillStyle(color, 1);
    graphics.fillEllipse(size / 2, size / 2 + 4, 32, 24);

    // 高光
    graphics.fillStyle(0xffffff, 0.4);
    graphics.fillEllipse(size / 2 - 6, size / 2 - 2, 8, 6);

    // 眼睛
    graphics.fillStyle(0x111111, 1);
    graphics.fillCircle(size / 2 - 6, size / 2, 3);
    graphics.fillCircle(size / 2 + 6, size / 2, 3);

    // 瞳孔高光
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(size / 2 - 5, size / 2 - 1, 1);
    graphics.fillCircle(size / 2 + 7, size / 2 - 1, 1);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  /**
   * 蝙蝠精灵
   */
  private createBatSprite(key: string, color: number): void {
    const size = 40;
    const graphics = this.scene.add.graphics();

    // 翅膀
    graphics.fillStyle(color, 1);
    graphics.fillTriangle(4, size / 2, size / 2 - 4, size / 2 - 6, size / 2 - 4, size / 2 + 10);
    graphics.fillTriangle(size - 4, size / 2, size / 2 + 4, size / 2 - 6, size / 2 + 4, size / 2 + 10);

    // 身体
    graphics.fillStyle(this.darken(color, 0.3), 1);
    graphics.fillEllipse(size / 2, size / 2, 12, 16);

    // 头部
    graphics.fillStyle(this.darken(color, 0.2), 1);
    graphics.fillCircle(size / 2, size / 2 - 8, 6);

    // 眼睛 - 发红光
    graphics.fillStyle(0xff0000, 1);
    graphics.fillCircle(size / 2 - 3, size / 2 - 8, 2);
    graphics.fillCircle(size / 2 + 3, size / 2 - 8, 2);

    // 耳朵
    graphics.fillStyle(color, 1);
    graphics.fillTriangle(size / 2 - 6, size / 2 - 12, size / 2 - 4, size / 2 - 18, size / 2 - 2, size / 2 - 12);
    graphics.fillTriangle(size / 2 + 2, size / 2 - 12, size / 2 + 4, size / 2 - 18, size / 2 + 6, size / 2 - 12);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  /**
   * 骷髅精灵
   */
  private createSkeletonSprite(key: string, color: number): void {
    const size = 44;
    const graphics = this.scene.add.graphics();

    // 头骨
    graphics.fillStyle(color, 1);
    graphics.fillCircle(size / 2, size / 2 - 8, 12);

    // 眼眶
    graphics.fillStyle(0x111111, 1);
    graphics.fillCircle(size / 2 - 5, size / 2 - 10, 4);
    graphics.fillCircle(size / 2 + 5, size / 2 - 10, 4);

    // 鼻子洞
    graphics.fillTriangle(size / 2 - 2, size / 2 - 4, size / 2 + 2, size / 2 - 4, size / 2, size / 2);

    // 下巴
    graphics.fillStyle(color, 1);
    graphics.fillRect(size / 2 - 8, size / 2 + 2, 16, 6);

    // 牙齿
    graphics.fillStyle(0xeeeeee, 1);
    for (let i = 0; i < 4; i++) {
      graphics.fillRect(size / 2 - 7 + i * 4, size / 2 + 2, 3, 4);
    }

    // 身体骨架
    graphics.fillStyle(this.darken(color, 0.2), 1);
    graphics.fillRect(size / 2 - 2, size / 2 + 8, 4, 12);

    // 肋骨
    graphics.fillRect(size / 2 - 10, size / 2 + 10, 20, 2);
    graphics.fillRect(size / 2 - 8, size / 2 + 14, 16, 2);
    graphics.fillRect(size / 2 - 6, size / 2 + 18, 12, 2);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  /**
   * 兽人精灵
   */
  private createOrcSprite(key: string, color: number): void {
    const size = 56;
    const graphics = this.scene.add.graphics();

    // 身体
    graphics.fillStyle(color, 1);
    this.drawPixelCircle(graphics, size / 2, size / 2 + 4, 20, color);

    // 头部
    this.drawPixelCircle(graphics, size / 2, size / 2 - 12, 12, this.lighten(color, 0.1));

    // 眼睛 - 愤怒的红眼
    graphics.fillStyle(0xffff00, 1);
    graphics.fillRect(size / 2 - 8, size / 2 - 14, 4, 4);
    graphics.fillRect(size / 2 + 4, size / 2 - 14, 4, 4);
    graphics.fillStyle(0xff0000, 1);
    graphics.fillRect(size / 2 - 7, size / 2 - 13, 2, 2);
    graphics.fillRect(size / 2 + 5, size / 2 - 13, 2, 2);

    // 獠牙
    graphics.fillStyle(0xffffee, 1);
    graphics.fillTriangle(size / 2 - 6, size / 2 - 4, size / 2 - 4, size / 2 + 2, size / 2 - 2, size / 2 - 4);
    graphics.fillTriangle(size / 2 + 2, size / 2 - 4, size / 2 + 4, size / 2 + 2, size / 2 + 6, size / 2 - 4);

    // 装甲肩甲
    graphics.fillStyle(0x555555, 1);
    graphics.fillRect(size / 2 - 24, size / 2 - 4, 10, 14);
    graphics.fillRect(size / 2 + 14, size / 2 - 4, 10, 14);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  /**
   * 法师精灵
   */
  private createMageSprite(key: string, color: number): void {
    const size = 52;
    const graphics = this.scene.add.graphics();

    // 法袍
    graphics.fillStyle(color, 1);
    graphics.fillTriangle(size / 2, size / 2 - 16, size / 2 - 18, size / 2 + 20, size / 2 + 18, size / 2 + 20);

    // 法袍边缘
    graphics.fillStyle(this.lighten(color, 0.2), 1);
    graphics.fillRect(size / 2 - 2, size / 2 - 16, 4, 36);

    // 头部
    graphics.fillStyle(0xaaddff, 1);
    graphics.fillCircle(size / 2, size / 2 - 10, 8);

    // 兜帽
    graphics.fillStyle(this.darken(color, 0.3), 1);
    graphics.fillTriangle(size / 2, size / 2 - 22, size / 2 - 12, size / 2 - 6, size / 2 + 12, size / 2 - 6);

    // 眼睛 - 发光
    graphics.fillStyle(0xff00ff, 1);
    graphics.fillCircle(size / 2 - 3, size / 2 - 10, 2);
    graphics.fillCircle(size / 2 + 3, size / 2 - 10, 2);

    // 法杖光球
    graphics.fillStyle(0xff66ff, 0.8);
    graphics.fillCircle(size / 2 + 16, size / 2, 6);
    graphics.fillStyle(0xffffff, 0.6);
    graphics.fillCircle(size / 2 + 16, size / 2, 3);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  /**
   * Boss精灵
   */
  private createBossSprite(key: string, color: number): void {
    const size = 80;
    const graphics = this.scene.add.graphics();

    // 黑暗光环背景
    graphics.fillStyle(0x110022, 0.5);
    graphics.fillCircle(size / 2, size / 2, 38);

    // 重甲身体
    graphics.fillStyle(0x333344, 1);
    this.drawPixelCircle(graphics, size / 2, size / 2 + 4, 28, 0x333344);

    // 头盔
    graphics.fillStyle(0x222233, 1);
    this.drawPixelCircle(graphics, size / 2, size / 2 - 16, 16, 0x222233);

    // 头盔角
    graphics.fillStyle(0x444455, 1);
    graphics.fillTriangle(size / 2 - 16, size / 2 - 20, size / 2 - 12, size / 2 - 40, size / 2 - 8, size / 2 - 20);
    graphics.fillTriangle(size / 2 + 8, size / 2 - 20, size / 2 + 12, size / 2 - 40, size / 2 + 16, size / 2 - 20);

    // 眼睛缝隙 - 发红光
    graphics.fillStyle(0xff0000, 1);
    graphics.fillRect(size / 2 - 10, size / 2 - 18, 8, 3);
    graphics.fillRect(size / 2 + 2, size / 2 - 18, 8, 3);

    // 剑
    graphics.fillStyle(0x666677, 1);
    graphics.fillRect(size / 2 + 24, size / 2 - 30, 8, 50);
    graphics.fillStyle(0xff4444, 0.8);
    graphics.fillRect(size / 2 + 26, size / 2 - 28, 4, 46);

    // 披风
    graphics.fillStyle(0x440000, 1);
    graphics.fillTriangle(size / 2 - 28, size / 2 + 10, size / 2 - 38, size / 2 + 38, size / 2 - 18, size / 2 + 10);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  /**
   * 创建投射物精灵
   */
  private createProjectileSprites(): void {
    // 火球
    this.createFireballSprite('projectile_fire', 0xff4400);

    // 水流
    this.createWaterSprite('projectile_water', 0x4488ff);

    // 冰片
    this.createIceShardSprite('projectile_ice', 0x44ccff);

    // 闪电
    this.createLightningSprite('projectile_lightning', 0xffff00);

    // 神圣
    this.createHolySprite('projectile_holy', 0xffcc00);

    // 暗影
    this.createShadowSprite('projectile_shadow', 0x8800ff);

    // 草叶
    this.createGrassSprite('projectile_grass', 0x44ff44);

    // 岩石
    this.createEarthSprite('projectile_earth', 0xaa8844);
  }

  /**
   * 火球精灵
   */
  private createFireballSprite(key: string, color: number): void {
    const size = 32;
    const graphics = this.scene.add.graphics();

    // 外焰
    graphics.fillStyle(0xff2200, 0.8);
    graphics.fillCircle(size / 2, size / 2, 12);

    // 内焰
    graphics.fillStyle(0xff8800, 1);
    graphics.fillCircle(size / 2, size / 2, 8);

    // 核心
    graphics.fillStyle(0xffff00, 1);
    graphics.fillCircle(size / 2, size / 2, 4);

    // 火焰尾巴
    graphics.fillStyle(0xff4400, 0.6);
    graphics.fillTriangle(size / 2, size / 2 - 8, size / 2 - 6, size / 2 + 10, size / 2 + 6, size / 2 + 10);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  /**
   * 冰片精灵
   */
  private createIceShardSprite(key: string, color: number): void {
    const size = 32;
    const graphics = this.scene.add.graphics();

    // 冰晶主体
    graphics.fillStyle(color, 1);
    graphics.fillTriangle(size / 2, 4, 6, size / 2, size - 6, size / 2);

    // 高光
    graphics.fillStyle(0xffffff, 0.6);
    graphics.fillTriangle(size / 2, 8, size / 2 - 4, size / 2 - 2, size / 2 + 2, size / 2 - 2);

    // 冰晶边缘
    graphics.fillStyle(this.lighten(color, 0.3), 1);
    graphics.fillTriangle(size / 2, 4, size / 2 - 6, size / 2, size / 2 + 6, size / 2);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  /**
   * 闪电精灵
   */
  private createLightningSprite(key: string, color: number): void {
    const size = 40;
    const graphics = this.scene.add.graphics();

    // 闪电主体
    graphics.fillStyle(color, 1);
    graphics.fillRect(size / 2 - 2, 4, 4, 12);
    graphics.fillRect(size / 2 - 4, 14, 8, 4);
    graphics.fillRect(size / 2 + 4, 16, 4, 8);
    graphics.fillRect(size / 2 - 2, 22, 8, 4);
    graphics.fillRect(size / 2 - 4, 24, 4, 12);

    // 发光边缘
    graphics.fillStyle(0xffffff, 0.8);
    graphics.fillRect(size / 2 - 1, 4, 2, 12);
    graphics.fillRect(size / 2 - 2, 14, 4, 2);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  /**
   * 暗影精灵
   */
  private createShadowSprite(key: string, color: number): void {
    const size = 32;
    const graphics = this.scene.add.graphics();

    // 暗影核心
    graphics.fillStyle(color, 1);
    graphics.fillCircle(size / 2, size / 2, 10);

    // 暗影波动
    graphics.fillStyle(this.darken(color, 0.2), 0.8);
    graphics.fillCircle(size / 2, size / 2, 14);

    // 外环
    graphics.fillStyle(this.darken(color, 0.4), 0.5);
    graphics.fillCircle(size / 2, size / 2, 16);

    // 黑暗核心
    graphics.fillStyle(0x000000, 0.8);
    graphics.fillCircle(size / 2, size / 2, 4);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  /**
   * 神圣精灵
   */
  private createHolySprite(key: string, color: number): void {
    const size = 36;
    const graphics = this.scene.add.graphics();

    // 光芒
    graphics.fillStyle(color, 0.4);
    graphics.fillCircle(size / 2, size / 2, 16);

    // 核心
    graphics.fillStyle(color, 1);
    graphics.fillCircle(size / 2, size / 2, 10);

    // 十字光
    graphics.fillStyle(0xffffff, 0.9);
    graphics.fillRect(size / 2 - 2, size / 2 - 14, 4, 28);
    graphics.fillRect(size / 2 - 14, size / 2 - 2, 28, 4);

    // 中心亮点
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(size / 2, size / 2, 4);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  /**
   * 水流精灵
   */
  private createWaterSprite(key: string, color: number): void {
    const size = 32;
    const graphics = this.scene.add.graphics();

    // 水滴外形
    graphics.fillStyle(color, 0.7);
    graphics.fillCircle(size / 2, size / 2 + 2, 10);

    // 水波纹
    graphics.fillStyle(this.lighten(color, 0.2), 0.9);
    graphics.fillCircle(size / 2 - 3, size / 2, 5);

    // 高光
    graphics.fillStyle(0xffffff, 0.8);
    graphics.fillCircle(size / 2 - 4, size / 2 - 2, 3);

    // 水滴尾巴
    graphics.fillStyle(color, 0.6);
    graphics.fillTriangle(size / 2, size / 2 - 10, size / 2 - 5, size / 2, size / 2 + 5, size / 2);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  /**
   * 草叶精灵
   */
  private createGrassSprite(key: string, color: number): void {
    const size = 32;
    const graphics = this.scene.add.graphics();

    // 主叶片
    graphics.fillStyle(color, 1);
    graphics.fillTriangle(size / 2, 4, size / 2 - 8, size / 2 + 8, size / 2 + 8, size / 2 + 8);

    // 左叶片
    graphics.fillStyle(this.darken(color, 0.1), 0.9);
    graphics.fillTriangle(size / 2 - 6, size / 2 - 4, size / 2 - 14, size / 2 + 10, size / 2 - 2, size / 2 + 6);

    // 右叶片
    graphics.fillStyle(this.lighten(color, 0.1), 0.9);
    graphics.fillTriangle(size / 2 + 6, size / 2 - 4, size / 2 + 14, size / 2 + 10, size / 2 + 2, size / 2 + 6);

    // 叶脉高光
    graphics.fillStyle(0xffffff, 0.5);
    graphics.fillRect(size / 2 - 1, size / 2 - 4, 2, 10);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  /**
   * 岩石精灵
   */
  private createEarthSprite(key: string, color: number): void {
    const size = 36;
    const graphics = this.scene.add.graphics();

    // 岩石主体 - 不规则形状
    graphics.fillStyle(color, 1);
    this.drawPixelCircle(graphics, size / 2, size / 2, 12, color);

    // 岩石纹理
    graphics.fillStyle(this.darken(color, 0.15), 1);
    graphics.fillRect(size / 2 - 8, size / 2 - 4, 4, 6);
    graphics.fillRect(size / 2 + 4, size / 2 + 2, 3, 4);

    // 高光
    graphics.fillStyle(this.lighten(color, 0.2), 0.8);
    graphics.fillRect(size / 2 - 6, size / 2 - 8, 4, 3);

    // 裂纹
    graphics.fillStyle(this.darken(color, 0.3), 1);
    graphics.fillRect(size / 2 - 2, size / 2 - 2, 1, 8);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  /**
   * 创建效果精灵
   */
  private createEffectSprites(): void {
    // 范围效果圆环
    this.createAreaRing('effect_ring_fire', 0xff4400, 100);
    this.createAreaRing('effect_ring_ice', 0x44ccff, 100);
    this.createAreaRing('effect_ring_lightning', 0xffff00, 100);
    this.createAreaRing('effect_ring_shadow', 0x8800ff, 100);
  }

  /**
   * 范围效果圆环
   */
  private createAreaRing(key: string, color: number, radius: number): void {
    const size = radius * 2 + 20;
    const graphics = this.scene.add.graphics();

    // 外环发光
    graphics.lineStyle(8, color, 0.3);
    graphics.strokeCircle(size / 2, size / 2, radius);

    // 主环
    graphics.lineStyle(4, color, 0.6);
    graphics.strokeCircle(size / 2, size / 2, radius - 4);

    // 内环
    graphics.lineStyle(2, 0xffffff, 0.4);
    graphics.strokeCircle(size / 2, size / 2, radius - 8);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  /**
   * 创建粒子纹理
   */
  private createParticles(): void {
    // 通用发光粒子
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(8, 8, 4);
    graphics.generateTexture('particle_glow', 16, 16);
    graphics.destroy();

    // 火焰粒子
    this.createElementParticle('particle_fire', 0xff8800, 'circle');

    // 水粒子
    this.createElementParticle('particle_water', 0x4488ff, 'droplet');

    // 冰霜粒子
    this.createElementParticle('particle_ice', 0x88ddff, 'square');

    // 闪电粒子
    this.createElementParticle('particle_lightning', 0xffff44, 'line');

    // 神圣粒子
    this.createElementParticle('particle_holy', 0xffdd00, 'star');

    // 暗影粒子
    this.createElementParticle('particle_shadow', 0x8800ff, 'ring');

    // 草叶粒子
    this.createElementParticle('particle_grass', 0x44ff44, 'leaf');

    // 岩石粒子
    this.createElementParticle('particle_earth', 0xaa8844, 'rock');
  }

  /**
   * 创建元素粒子
   */
  private createElementParticle(key: string, color: number, shape: 'circle' | 'droplet' | 'square' | 'line' | 'star' | 'ring' | 'leaf' | 'rock'): void {
    const size = 12;
    const graphics = this.scene.add.graphics();

    switch (shape) {
      case 'circle':
        graphics.fillStyle(color, 1);
        graphics.fillCircle(size / 2, size / 2, 4);
        graphics.fillStyle(0xffffff, 0.8);
        graphics.fillCircle(size / 2, size / 2, 2);
        break;

      case 'droplet':
        graphics.fillStyle(color, 0.9);
        graphics.fillCircle(size / 2, size / 2 + 1, 3);
        graphics.fillTriangle(size / 2, size / 2 - 4, size / 2 - 2, size / 2, size / 2 + 2, size / 2);
        graphics.fillStyle(0xffffff, 0.7);
        graphics.fillCircle(size / 2 - 1, size / 2, 1);
        break;

      case 'square':
        graphics.fillStyle(color, 1);
        graphics.fillRect(2, 2, 8, 8);
        graphics.fillStyle(0xffffff, 0.8);
        graphics.fillRect(3, 3, 4, 4);
        break;

      case 'line':
        graphics.fillStyle(color, 1);
        graphics.fillRect(0, size / 2 - 1, size, 2);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(4, size / 2 - 1, 4, 2);
        break;

      case 'star':
        graphics.fillStyle(color, 0.4);
        graphics.fillCircle(size / 2, size / 2, 5);
        graphics.fillStyle(color, 1);
        graphics.fillCircle(size / 2, size / 2, 3);
        graphics.fillStyle(0xffffff, 0.9);
        graphics.fillRect(size / 2 - 1, size / 2 - 5, 2, 10);
        graphics.fillRect(size / 2 - 5, size / 2 - 1, 10, 2);
        break;

      case 'ring':
        graphics.fillStyle(color, 0.7);
        graphics.fillCircle(size / 2, size / 2, 5);
        graphics.fillStyle(0x000000, 0.8);
        graphics.fillCircle(size / 2, size / 2, 2);
        break;

      case 'leaf':
        graphics.fillStyle(color, 1);
        graphics.fillTriangle(size / 2, 2, 2, size - 2, size - 2, size - 2);
        graphics.fillStyle(0xffffff, 0.5);
        graphics.fillRect(size / 2 - 1, 4, 2, 4);
        break;

      case 'rock':
        graphics.fillStyle(color, 1);
        graphics.fillRect(2, 4, 8, 6);
        graphics.fillRect(4, 2, 4, 8);
        graphics.fillStyle(this.lighten(color, 0.2), 0.8);
        graphics.fillRect(3, 3, 3, 3);
        break;
    }

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  /**
   * 绘制像素风格圆形
   */
  private drawPixelCircle(graphics: Phaser.GameObjects.Graphics, cx: number, cy: number, radius: number, color: number): void {
    graphics.fillStyle(color, 1);
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        if (x * x + y * y <= radius * radius) {
          graphics.fillRect(cx + x, cy + y, 1, 1);
        }
      }
    }
  }

  /**
   * 创建技能图标
   */
  private createSkillIcons(): void {
    // 投射物技能
    this.createSkillIcon('skill_fireball', 0xff4400, '🔥');
    this.createSkillIcon('skill_ice_shard', 0x44ccff, '❄️');
    this.createSkillIcon('skill_lightning_bolt', 0xffff00, '⚡');
    this.createSkillIcon('skill_multi_shot', 0xaaaaaa, '🏹');
    this.createSkillIcon('skill_boomerang', 0x888888, '🪃');
    this.createSkillIcon('skill_homing_missile', 0xff6600, '🚀');
    this.createSkillIcon('skill_poison_dart', 0x44ff44, '🎯');

    // 范围技能
    this.createSkillIcon('skill_flame_circle', 0xff8800, '🔥');
    this.createSkillIcon('skill_frost_nova', 0x88ddff, '❄️');
    this.createSkillIcon('skill_whirlwind', 0xcccccc, '🌀');
    this.createSkillIcon('skill_poison_cloud', 0x44ff44, '☠️');
    this.createSkillIcon('skill_ground_spike', 0x886644, '⛰️');
    this.createSkillIcon('skill_holy_light', 0xffcc00, '✨');
    this.createSkillIcon('skill_black_hole', 0x8800ff, '🕳️');
    this.createSkillIcon('skill_time_stop', 0x6644ff, '⏱️');

    // 召唤/防御技能
    this.createSkillIcon('skill_summon', 0xffcc00, '👻');
    this.createSkillIcon('skill_shield', 0x66aaff, '🛡️');

    // 大招
    this.createSkillIcon('skill_meteor', 0xff6600, '☄️');
    this.createSkillIcon('skill_blizzard', 0x66ccff, '🌨️');
    this.createSkillIcon('skill_thunder_storm', 0xffff44, '🌩️');
  }

  /**
   * 创建单个技能图标
   */
  private createSkillIcon(key: string, color: number, _emoji: string): void {
    const size = 48;
    const graphics = this.scene.add.graphics();

    // 背景 - 圆角矩形
    graphics.fillStyle(0x222233, 1);
    graphics.fillRoundedRect(2, 2, size - 4, size - 4, 6);

    // 边框
    graphics.lineStyle(2, color, 0.8);
    graphics.strokeRoundedRect(2, 2, size - 4, size - 4, 6);

    // 内部发光
    graphics.fillStyle(color, 0.3);
    graphics.fillRoundedRect(6, 6, size - 12, size - 12, 4);

    // 中心图标区域
    graphics.fillStyle(color, 0.6);
    graphics.fillCircle(size / 2, size / 2, 14);

    // 高光
    graphics.fillStyle(0xffffff, 0.4);
    graphics.fillCircle(size / 2 - 4, size / 2 - 4, 6);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  /**
   * 颜色变暗
   */
  private darken(color: number, amount: number): number {
    const r = Math.floor(((color >> 16) & 0xff) * (1 - amount));
    const g = Math.floor(((color >> 8) & 0xff) * (1 - amount));
    const b = Math.floor((color & 0xff) * (1 - amount));
    return (r << 16) | (g << 8) | b;
  }

  /**
   * 颜色变亮
   */
  private lighten(color: number, amount: number): number {
    const r = Math.min(255, Math.floor(((color >> 16) & 0xff) * (1 + amount)));
    const g = Math.min(255, Math.floor(((color >> 8) & 0xff) * (1 + amount)));
    const b = Math.min(255, Math.floor((color & 0xff) * (1 + amount)));
    return (r << 16) | (g << 8) | b;
  }

  /**
   * 创建食物精灵
   */
  private createFoodSprites(): void {
    // 食物发光背景
    this.createFoodGlowSprite();

    // 按稀有度创建食物
    const rarityColors: Record<string, number> = {
      common: 0x88ff88,
      rare: 0x4a9eff,
      epic: 0xa855f7,
      legendary: 0xffd700,
      mythic: 0xff6b9d,
    };

    for (const [rarity, color] of Object.entries(rarityColors)) {
      this.createFoodSprite(`food_${rarity}`, color);
    }
  }

  /**
   * 创建单个食物精灵
   */
  private createFoodSprite(key: string, color: number): void {
    const size = 32;
    const graphics = this.scene.add.graphics();

    // 外层光晕
    graphics.fillStyle(color, 0.4);
    graphics.fillCircle(size / 2, size / 2, 12);

    // 主体圆形
    graphics.fillStyle(color, 0.8);
    graphics.fillCircle(size / 2, size / 2, 8);

    // 核心高光
    graphics.fillStyle(0xffffff, 0.9);
    graphics.fillCircle(size / 2 - 2, size / 2 - 2, 3);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  /**
   * 创建食物发光精灵
   */
  private createFoodGlowSprite(): void {
    const size = 48;
    const graphics = this.scene.add.graphics();

    // 多层发光效果
    graphics.fillStyle(0xffffff, 0.2);
    graphics.fillCircle(size / 2, size / 2, 20);

    graphics.fillStyle(0xffffff, 0.3);
    graphics.fillCircle(size / 2, size / 2, 14);

    graphics.fillStyle(0xffffff, 0.4);
    graphics.fillCircle(size / 2, size / 2, 8);

    graphics.generateTexture('food_glow', size, size);
    graphics.destroy();
  }

  /**
   * 创建经验球精灵
   */
  private createExpOrbSprites(): void {
    // 经验球发光背景
    this.createExpOrbGlowSprite();

    // 青色粒子（用于拖尾效果）
    this.createCyanParticle();

    // 三种尺寸的经验球
    const sizes: Array<{ name: string; radius: number; color: number }> = [
      { name: 'small', radius: 6, color: 0x66ffff },
      { name: 'medium', radius: 10, color: 0x44ffff },
      { name: 'large', radius: 16, color: 0x00ffff },
    ];

    for (const { name, radius, color } of sizes) {
      this.createExpOrbSprite(`exp_orb_${name}`, radius, color);
    }
  }

  /**
   * 创建单个经验球精灵
   */
  private createExpOrbSprite(key: string, radius: number, color: number): void {
    const size = radius * 2 + 8;
    const graphics = this.scene.add.graphics();
    const center = size / 2;

    // 外层光晕
    graphics.fillStyle(color, 0.3);
    graphics.fillCircle(center, center, radius + 3);

    // 主体
    graphics.fillStyle(color, 0.8);
    graphics.fillCircle(center, center, radius);

    // 核心 - 更亮的中心
    graphics.fillStyle(0xffffff, 0.9);
    graphics.fillCircle(center, center, radius * 0.5);

    // 高光点
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(center - radius * 0.3, center - radius * 0.3, radius * 0.25);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  /**
   * 创建经验球发光精灵
   */
  private createExpOrbGlowSprite(): void {
    const size = 40;
    const graphics = this.scene.add.graphics();
    const center = size / 2;

    // 多层发光效果
    graphics.fillStyle(0x00ffff, 0.15);
    graphics.fillCircle(center, center, 18);

    graphics.fillStyle(0x00ffff, 0.25);
    graphics.fillCircle(center, center, 12);

    graphics.fillStyle(0x00ffff, 0.35);
    graphics.fillCircle(center, center, 6);

    graphics.generateTexture('exp_orb_glow', size, size);
    graphics.destroy();
  }

  /**
   * 创建青色粒子（经验球拖尾用）
   */
  private createCyanParticle(): void {
    const size = 12;
    const graphics = this.scene.add.graphics();

    graphics.fillStyle(0x00ffff, 0.8);
    graphics.fillCircle(size / 2, size / 2, 4);

    graphics.fillStyle(0xffffff, 0.6);
    graphics.fillCircle(size / 2, size / 2, 2);

    graphics.generateTexture('particle_cyan', size, size);
    graphics.destroy();
  }
}
