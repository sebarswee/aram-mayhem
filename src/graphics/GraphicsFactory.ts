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
   * 只生成敌人精灵
   */
  generateEnemySprites(): void {
    this.createEnemySprites();
  }

  /**
   * 只生成投射物精灵
   */
  generateProjectileSprites(): void {
    this.createProjectileSprites();
  }

  /**
   * 只生成效果精灵
   */
  generateEffectSprites(): void {
    this.createEffectSprites();
  }

  /**
   * 只生成粒子
   */
  generateParticles(): void {
    this.createParticles();
  }

  /**
   * 只生成食物精灵
   */
  generateFoodSprites(): void {
    this.createFoodSprites();
  }

  /**
   * 只生成经验球精灵
   */
  generateExpOrbSprites(): void {
    this.createExpOrbSprites();
  }

  /**
   * 只生成玩家精灵
   */
  generatePlayerSprite(): void {
    this.createPlayerSprite();
  }

  /**
   * 只生成 Boss 精灵
   */
  generateBossSprites(): void {
    this.createBossSprites();
  }

  /**
   * 创建玩家精灵 - 像素风格角色（增强版）
   */
  private createPlayerSprite(): void {
    const size = 48;
    const graphics = this.scene.add.graphics();

    // 外发光边缘
    graphics.lineStyle(2, 0x66ccff, 0.5);
    graphics.strokeCircle(size / 2, size / 2, 20);

    // 身体主体 - 深蓝色斗篷
    this.drawPixelCircle(graphics, size / 2, size / 2, 16, 0x2d4a6f);

    // 中层 - 蓝色过渡
    this.drawPixelCircle(graphics, size / 2, size / 2, 14, 0x3a5d8a);

    // 内层 - 浅蓝色
    this.drawPixelCircle(graphics, size / 2, size / 2, 12, 0x4a7db8);

    // 头部
    this.drawPixelCircle(graphics, size / 2, size / 2 - 4, 8, 0xffdbac);

    // 头部高光
    graphics.fillStyle(0xffffff, 0.3);
    graphics.fillRect(size / 2 - 3, size / 2 - 10, 6, 2);

    // 眼睛
    graphics.fillStyle(0x1a1a2e, 1);
    graphics.fillRect(size / 2 - 4, size / 2 - 6, 2, 2);
    graphics.fillRect(size / 2 + 2, size / 2 - 6, 2, 2);

    // 眼睛高光
    graphics.fillStyle(0xffffff, 0.7);
    graphics.fillRect(size / 2 - 4, size / 2 - 7, 1, 1);
    graphics.fillRect(size / 2 + 2, size / 2 - 7, 1, 1);

    // 内部发光光环
    graphics.lineStyle(1, 0x88ddff, 0.4);
    graphics.strokeCircle(size / 2, size / 2, 16);

    graphics.generateTexture('player', size, size);
    graphics.destroy();
  }

  /**
   * 创建敌人精灵（普通和精英）
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

    // === 精英敌人 (5种) ===
    // 炎魔精英 - 火焰恶魔形状
    this.createEliteFlameLordSprite('elite_flame_lord', 0xff2200);

    // 霜巨人精英 - 冰霜巨人形状
    this.createEliteFrostTitanSprite('elite_frost_titan', 0x66ccff);

    // 雷龙精英 - 龙形状
    this.createEliteStormDrakeSprite('elite_storm_drake', 0xcccc00);

    // 暗影领主 - 恶魔形状
    this.createEliteShadowLordSprite('elite_shadow_lord', 0x6600cc);

    // 水元素精英 - 水元素形状
    this.createEliteWaterElementalSprite('elite_water_elemental', 0x2288ff);
  }

  /**
   * 创建 Boss 精灵
   */
  private createBossSprites(): void {
    // === Boss敌人 (8种) ===
    // 炎魔 - 大型火焰恶魔
    this.createBossFlameLordSprite('boss_flame_lord', 0xff0000);

    // 霜巨人 - 大型冰霜巨人
    this.createBossFrostGiantSprite('boss_frost_giant', 0x44aaff);

    // 雷龙 - 大型龙
    this.createBossThunderDragonSprite('boss_thunder_dragon', 0xaaaa00);

    // 暗影之王 - 大型恶魔
    this.createBossShadowKingSprite('boss_shadow_king', 0x4400aa);

    // 自然守护者 - 大型植物
    this.createBossNatureGuardianSprite('boss_nature_guardian', 0x22cc22);

    // 巨像领主 - 大型岩石
    this.createBossGolemLordSprite('boss_golem_lord', 0x886622);

    // 堕落天使 - 大型天使
    this.createBossFallenAngelSprite('boss_fallen_angel', 0xccaa00);

    // 九头蛇 - 大型蛇形
    this.createBossHydraSprite('boss_hydra', 0x2266cc);
  }

  /**
   * 史莱姆精灵（增强版）
   */
  private createSlimeSprite(key: string, color: number): void {
    const size = 40;
    const graphics = this.scene.add.graphics();

    // 底部阴影
    graphics.fillStyle(0x000000, 0.15);
    graphics.fillEllipse(size / 2, size / 2 + 8, 30, 10);

    // 身体 - 椭圆形
    graphics.fillStyle(color, 1);
    graphics.fillEllipse(size / 2, size / 2 + 4, 32, 24);

    // 身体暗部
    graphics.fillStyle(this.darken(color, 0.25), 0.4);
    graphics.fillEllipse(size / 2, size / 2 + 6, 26, 12);

    // 高光
    graphics.fillStyle(0xffffff, 0.45);
    graphics.fillEllipse(size / 2 - 6, size / 2 - 2, 10, 7);

    // 次高光
    graphics.fillStyle(0xffffff, 0.25);
    graphics.fillEllipse(size / 2 + 4, size / 2, 5, 4);

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
   * 创建粒子纹理 - 增强版
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

    // === 新增增强粒子纹理 ===
    this.createEnhancedParticles();
  }

  /**
   * 创建增强版粒子纹理
   */
  private createEnhancedParticles(): void {
    // 火焰核心粒子（更亮）
    this.createFireCoreParticle();

    // 火花粒子
    this.createSparkParticle();

    // 冰晶粒子
    this.createIceCrystalParticle();

    // 闪电弧粒子
    this.createLightningArcParticle();

    // 光芒粒子
    this.createLightRayParticle();

    // 漩涡粒子
    this.createVortexParticle();

    // 能量环粒子
    this.createEnergyRingParticle();

    // 冲击波粒子
    this.createShockwaveParticle();

    // 星芒粒子
    this.createStarBurstParticle();

    // 螺旋粒子
    this.createSpiralParticle();

    // 元素核心粒子（8种元素）
    this.createElementCoreParticles();

    // 拖尾粒子
    this.createTrailParticle();
  }

  /**
   * 创建火焰核心粒子
   */
  private createFireCoreParticle(): void {
    const size = 20;
    const graphics = this.scene.add.graphics();

    // 外焰（红色）
    graphics.fillStyle(0xff2200, 0.6);
    graphics.fillCircle(size / 2, size / 2, 9);

    // 中焰（橙色）
    graphics.fillStyle(0xff6600, 0.8);
    graphics.fillCircle(size / 2, size / 2, 6);

    // 内焰（黄色）
    graphics.fillStyle(0xffcc00, 1);
    graphics.fillCircle(size / 2, size / 2, 4);

    // 核心（白色）
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(size / 2, size / 2, 2);

    graphics.generateTexture('particle_fire_core', size, size);
    graphics.destroy();
  }

  /**
   * 创建火花粒子
   */
  private createSparkParticle(): void {
    const size = 16;
    const graphics = this.scene.add.graphics();

    // 中心亮点
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(size / 2, size / 2, 2);

    // 火花射线
    graphics.lineStyle(1, 0xffff88, 0.8);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      graphics.beginPath();
      graphics.moveTo(size / 2, size / 2);
      graphics.lineTo(
        size / 2 + Math.cos(angle) * 6,
        size / 2 + Math.sin(angle) * 6
      );
      graphics.strokePath();
    }

    graphics.generateTexture('particle_spark', size, size);
    graphics.destroy();
  }

  /**
   * 创建冰晶粒子
   */
  private createIceCrystalParticle(): void {
    const size = 16;
    const graphics = this.scene.add.graphics();

    // 冰晶形状（六角形）
    graphics.fillStyle(0x88ddff, 0.9);
    graphics.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const x = size / 2 + Math.cos(angle) * 6;
      const y = size / 2 + Math.sin(angle) * 6;
      if (i === 0) {
        graphics.moveTo(x, y);
      } else {
        graphics.lineTo(x, y);
      }
    }
    graphics.closePath();
    graphics.fillPath();

    // 中心亮点
    graphics.fillStyle(0xffffff, 0.9);
    graphics.fillCircle(size / 2, size / 2, 2);

    graphics.generateTexture('particle_ice_crystal', size, size);
    graphics.destroy();
  }

  /**
   * 创建闪电弧粒子
   */
  private createLightningArcParticle(): void {
    const size = 24;
    const graphics = this.scene.add.graphics();

    // 锯齿闪电
    graphics.lineStyle(2, 0xffff00, 1);
    graphics.beginPath();
    graphics.moveTo(4, 4);
    graphics.lineTo(10, 10);
    graphics.lineTo(6, 12);
    graphics.lineTo(14, 18);
    graphics.lineTo(10, 20);
    graphics.strokePath();

    // 光晕
    graphics.lineStyle(4, 0xffff88, 0.4);
    graphics.beginPath();
    graphics.moveTo(4, 4);
    graphics.lineTo(10, 10);
    graphics.lineTo(6, 12);
    graphics.lineTo(14, 18);
    graphics.lineTo(10, 20);
    graphics.strokePath();

    graphics.generateTexture('particle_lightning_arc', size, size);
    graphics.destroy();
  }

  /**
   * 创建光芒粒子
   */
  private createLightRayParticle(): void {
    const size = 20;
    const graphics = this.scene.add.graphics();

    // 中心
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(size / 2, size / 2, 3);

    // 光芒
    graphics.lineStyle(2, 0xffffcc, 0.7);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      graphics.beginPath();
      graphics.moveTo(size / 2, size / 2);
      graphics.lineTo(
        size / 2 + Math.cos(angle) * 9,
        size / 2 + Math.sin(angle) * 9
      );
      graphics.strokePath();
    }

    graphics.generateTexture('particle_light_ray', size, size);
    graphics.destroy();
  }

  /**
   * 创建漩涡粒子
   */
  private createVortexParticle(): void {
    const size = 24;
    const graphics = this.scene.add.graphics();

    // 漩涡线条
    graphics.lineStyle(2, 0x4488ff, 0.8);
    graphics.beginPath();
    for (let i = 0; i < 30; i++) {
      const angle = i * 0.4;
      const radius = 2 + i * 0.3;
      const x = size / 2 + Math.cos(angle) * radius;
      const y = size / 2 + Math.sin(angle) * radius;
      if (i === 0) {
        graphics.moveTo(x, y);
      } else {
        graphics.lineTo(x, y);
      }
    }
    graphics.strokePath();

    // 中心亮点
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(size / 2, size / 2, 2);

    graphics.generateTexture('particle_vortex', size, size);
    graphics.destroy();
  }

  /**
   * 创建能量环粒子
   */
  private createEnergyRingParticle(): void {
    const size = 20;
    const graphics = this.scene.add.graphics();

    // 外环
    graphics.lineStyle(2, 0x88ff88, 0.8);
    graphics.strokeCircle(size / 2, size / 2, 8);

    // 内环
    graphics.lineStyle(1, 0xffffff, 0.9);
    graphics.strokeCircle(size / 2, size / 2, 5);

    graphics.generateTexture('particle_energy_ring', size, size);
    graphics.destroy();
  }

  /**
   * 创建冲击波粒子
   */
  private createShockwaveParticle(): void {
    const size = 32;
    const graphics = this.scene.add.graphics();

    // 冲击波环
    graphics.lineStyle(3, 0xffffff, 0.8);
    graphics.strokeCircle(size / 2, size / 2, 12);

    // 内环
    graphics.lineStyle(2, 0xffff88, 0.5);
    graphics.strokeCircle(size / 2, size / 2, 8);

    graphics.generateTexture('particle_shockwave', size, size);
    graphics.destroy();
  }

  /**
   * 创建星芒粒子
   */
  private createStarBurstParticle(): void {
    const size = 20;
    const graphics = this.scene.add.graphics();

    // 星芒（4条射线）
    graphics.fillStyle(0xffff88, 1);
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      graphics.fillTriangle(
        size / 2, size / 2,
        size / 2 + Math.cos(angle - 0.2) * 8, size / 2 + Math.sin(angle - 0.2) * 8,
        size / 2 + Math.cos(angle + 0.2) * 8, size / 2 + Math.sin(angle + 0.2) * 8
      );
    }

    // 中心
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(size / 2, size / 2, 2);

    graphics.generateTexture('particle_star_burst', size, size);
    graphics.destroy();
  }

  /**
   * 创建螺旋粒子
   */
  private createSpiralParticle(): void {
    const size = 20;
    const graphics = this.scene.add.graphics();

    // 螺旋
    graphics.lineStyle(2, 0xaa88ff, 0.8);
    graphics.beginPath();
    for (let i = 0; i < 20; i++) {
      const angle = i * 0.5;
      const radius = 1 + i * 0.4;
      const x = size / 2 + Math.cos(angle) * radius;
      const y = size / 2 + Math.sin(angle) * radius;
      if (i === 0) {
        graphics.moveTo(x, y);
      } else {
        graphics.lineTo(x, y);
      }
    }
    graphics.strokePath();

    graphics.generateTexture('particle_spiral', size, size);
    graphics.destroy();
  }

  /**
   * 创建元素核心粒子（8种元素）
   */
  private createElementCoreParticles(): void {
    const elements = [
      { name: 'fire', color: 0xff4400, glow: 0xff8800 },
      { name: 'water', color: 0x4488ff, glow: 0x66aaff },
      { name: 'ice', color: 0x88ddff, glow: 0xaaffff },
      { name: 'lightning', color: 0xffff00, glow: 0xffff88 },
      { name: 'holy', color: 0xffcc00, glow: 0xffdd66 },
      { name: 'shadow', color: 0x8800ff, glow: 0xaa44ff },
      { name: 'grass', color: 0x44ff44, glow: 0x88ff88 },
      { name: 'earth', color: 0xaa8844, glow: 0xccaa66 },
    ];

    for (const elem of elements) {
      this.createElementCoreParticle(elem.name, elem.color, elem.glow);
    }
  }

  /**
   * 创建单个元素核心粒子
   */
  private createElementCoreParticle(name: string, color: number, glow: number): void {
    const size = 24;
    const graphics = this.scene.add.graphics();

    // 外层光晕
    graphics.fillStyle(glow, 0.3);
    graphics.fillCircle(size / 2, size / 2, 10);

    // 中层
    graphics.fillStyle(color, 0.7);
    graphics.fillCircle(size / 2, size / 2, 7);

    // 核心
    graphics.fillStyle(0xffffff, 0.9);
    graphics.fillCircle(size / 2, size / 2, 4);

    // 高光
    graphics.fillStyle(0xffffff, 0.5);
    graphics.fillCircle(size / 2 - 2, size / 2 - 2, 2);

    graphics.generateTexture(`particle_${name}_core`, size, size);
    graphics.destroy();
  }

  /**
   * 创建拖尾粒子
   */
  private createTrailParticle(): void {
    const size = 16;
    const graphics = this.scene.add.graphics();

    // 渐变拖尾效果
    for (let i = 0; i < 4; i++) {
      const alpha = 0.8 - i * 0.2;
      graphics.fillStyle(0xffffff, alpha);
      graphics.fillCircle(size / 2 + i * 2, size / 2, 4 - i);
    }

    graphics.generateTexture('particle_trail', size, size);
    graphics.destroy();
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
    this.createSkillIcon('skill_frost_nova', 0x88ddff, '❄️');
    this.createSkillIcon('skill_poison_cloud', 0x44ff44, '☠️');
    this.createSkillIcon('skill_holy_light', 0xffcc00, '✨');

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
    // 三种尺寸的经验球（精简版，只有主体和核心）
    const sizes: Array<{ name: string; radius: number; color: number }> = [
      { name: 'small', radius: 5, color: 0x66ffff },
      { name: 'medium', radius: 8, color: 0x44ffff },
      { name: 'large', radius: 12, color: 0x00ffff },
    ];

    for (const { name, radius, color } of sizes) {
      this.createExpOrbSprite(`exp_orb_${name}`, radius, color);
    }

    // 发光纹理（单一尺寸，用于所有经验球）
    const glowSize = 24;
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0x00ffff, 0.25);
    graphics.fillCircle(glowSize / 2, glowSize / 2, 10);
    graphics.generateTexture('exp_orb_glow', glowSize, glowSize);
    graphics.destroy();

    // 青色粒子（简化版）
    const particleSize = 8;
    const particleGraphics = this.scene.add.graphics();
    particleGraphics.fillStyle(0x00ffff, 0.7);
    particleGraphics.fillCircle(particleSize / 2, particleSize / 2, 3);
    particleGraphics.generateTexture('particle_cyan', particleSize, particleSize);
    particleGraphics.destroy();
  }

  /**
   * 创建单个经验球精灵（精简版）
   */
  private createExpOrbSprite(key: string, radius: number, color: number): void {
    const size = radius * 2 + 4;
    const graphics = this.scene.add.graphics();
    const center = size / 2;

    // 主体
    graphics.fillStyle(color, 0.9);
    graphics.fillCircle(center, center, radius);

    // 核心（高亮中心）
    graphics.fillStyle(0xffffff, 0.8);
    graphics.fillCircle(center, center, radius * 0.4);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  // === 新敌人精灵方法 ===

  private createElementalSprite(key: string, color: number): void {
    const size = 36;
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(color, 0.8);
    graphics.fillCircle(size / 2, size / 2, 14);
    graphics.fillStyle(this.lighten(color, 0.3), 1);
    graphics.fillCircle(size / 2 - 4, size / 2 - 4, 6);
    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  private createGhostSprite(key: string, color: number): void {
    const size = 40;
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(color, 0.6);
    graphics.fillEllipse(size / 2, size / 2, 18, 24);
    graphics.fillStyle(this.lighten(color, 0.2), 0.8);
    graphics.fillCircle(size / 2 - 5, size / 2 - 6, 4);
    graphics.fillCircle(size / 2 + 5, size / 2 - 6, 4);
    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  private createSpiritSprite(key: string, color: number): void {
    const size = 32;
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(color, 0.7);
    graphics.fillTriangle(size / 2, 4, 4, size - 4, size - 4, size - 4);
    graphics.fillStyle(0xffffff, 0.8);
    graphics.fillCircle(size / 2, size / 2 - 4, 4);
    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  private createDemonSprite(key: string, color: number): void {
    const size = 44;
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(color, 1);
    graphics.fillCircle(size / 2, size / 2 + 2, 16);
    graphics.fillStyle(this.darken(color, 0.2), 1);
    graphics.fillTriangle(8, 8, 14, 16, 4, 12);
    graphics.fillTriangle(size - 8, 8, size - 14, 16, size - 4, 12);
    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  private createVineMonsterSprite(key: string, color: number): void {
    const size = 38;
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(color, 1);
    graphics.fillCircle(size / 2, size / 2, 12);
    graphics.fillStyle(this.lighten(color, 0.1), 1);
    graphics.fillRect(size / 2 - 1, 4, 2, 10);
    graphics.fillRect(4, size / 2, 8, 2);
    graphics.fillRect(size - 12, size / 2, 8, 2);
    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  private createGolemSprite(key: string, color: number): void {
    const size = 48;
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(color, 1);
    graphics.fillRect(8, 16, 32, 28);
    graphics.fillStyle(this.darken(color, 0.15), 1);
    graphics.fillRect(12, 8, 8, 8);
    graphics.fillRect(28, 8, 8, 8);
    graphics.fillStyle(this.lighten(color, 0.2), 1);
    graphics.fillRect(18, 20, 12, 12);
    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  private createEliteFlameLordSprite(key: string, color: number): void {
    const size = 56;
    const graphics = this.scene.add.graphics();

    // 身体 - 更大的圆形
    graphics.fillStyle(color, 1);
    graphics.fillCircle(size / 2, size / 2 + 4, 20);

    // 火焰光环
    graphics.fillStyle(0xff4400, 0.4);
    graphics.fillCircle(size / 2, size / 2 + 4, 24);

    // 头部
    graphics.fillStyle(this.lighten(color, 0.1), 1);
    graphics.fillCircle(size / 2, size / 2 - 14, 12);

    // 眼睛 - 燃烧的眼睛
    graphics.fillStyle(0xffff00, 1);
    graphics.fillCircle(size / 2 - 5, size / 2 - 16, 4);
    graphics.fillCircle(size / 2 + 5, size / 2 - 16, 4);
    graphics.fillStyle(0xff0000, 1);
    graphics.fillCircle(size / 2 - 5, size / 2 - 16, 2);
    graphics.fillCircle(size / 2 + 5, size / 2 - 16, 2);

    // 角
    graphics.fillStyle(this.darken(color, 0.2), 1);
    graphics.fillTriangle(size / 2 - 12, size / 2 - 22, size / 2 - 8, size / 2 - 36, size / 2 - 4, size / 2 - 22);
    graphics.fillTriangle(size / 2 + 4, size / 2 - 22, size / 2 + 8, size / 2 - 36, size / 2 + 12, size / 2 - 22);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  private createEliteFrostTitanSprite(key: string, color: number): void {
    const size = 60;
    const graphics = this.scene.add.graphics();

    // 身体 - 巨人形状
    graphics.fillStyle(color, 1);
    graphics.fillRect(12, 20, 36, 36);

    // 头部
    graphics.fillStyle(this.lighten(color, 0.15), 1);
    graphics.fillRect(16, 4, 28, 20);

    // 冰晶
    graphics.fillStyle(0xffffff, 0.8);
    graphics.fillTriangle(size / 2, 0, size / 2 - 6, 8, size / 2 + 6, 8);
    graphics.fillTriangle(8, 8, 14, 12, 8, 20);
    graphics.fillTriangle(size - 8, 8, size - 14, 12, size - 8, 20);

    // 眼睛
    graphics.fillStyle(0x0044aa, 1);
    graphics.fillRect(22, 10, 6, 6);
    graphics.fillRect(32, 10, 6, 6);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  private createEliteStormDrakeSprite(key: string, color: number): void {
    const size = 56;
    const graphics = this.scene.add.graphics();

    // 身体 - 龙形
    graphics.fillStyle(color, 1);
    graphics.fillEllipse(size / 2, size / 2 + 4, 28, 18);

    // 翅膀
    graphics.fillStyle(this.darken(color, 0.15), 1);
    graphics.fillTriangle(8, size / 2, 4, size / 2 - 16, 16, size / 2 + 4);
    graphics.fillTriangle(size - 8, size / 2, size - 4, size / 2 - 16, size - 16, size / 2 + 4);

    // 头部
    graphics.fillStyle(this.lighten(color, 0.1), 1);
    graphics.fillEllipse(size / 2 - 8, size / 2 - 8, 14, 10);

    // 眼睛
    graphics.fillStyle(0xff0000, 1);
    graphics.fillCircle(size / 2 - 12, size / 2 - 10, 3);

    // 尾巴
    graphics.fillStyle(this.darken(color, 0.2), 1);
    graphics.fillTriangle(size - 8, size / 2 + 8, size - 4, size / 2 + 20, size - 12, size / 2 + 12);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  private createEliteShadowLordSprite(key: string, color: number): void {
    const size = 54;
    const graphics = this.scene.add.graphics();

    // 身体 - 暗影形状
    graphics.fillStyle(color, 0.8);
    graphics.fillCircle(size / 2, size / 2, 22);

    // 暗影波动
    graphics.fillStyle(this.darken(color, 0.3), 0.6);
    graphics.fillCircle(size / 2, size / 2, 26);

    // 头部
    graphics.fillStyle(this.darken(color, 0.1), 1);
    graphics.fillCircle(size / 2, size / 2 - 16, 10);

    // 眼睛 - 紫色发光
    graphics.fillStyle(0xff00ff, 1);
    graphics.fillCircle(size / 2 - 4, size / 2 - 18, 3);
    graphics.fillCircle(size / 2 + 4, size / 2 - 18, 3);

    // 角
    graphics.fillStyle(color, 1);
    graphics.fillTriangle(size / 2 - 10, size / 2 - 24, size / 2 - 6, size / 2 - 36, size / 2 - 2, size / 2 - 24);
    graphics.fillTriangle(size / 2 + 2, size / 2 - 24, size / 2 + 6, size / 2 - 36, size / 2 + 10, size / 2 - 24);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  private createEliteWaterElementalSprite(key: string, color: number): void {
    const size = 54;
    const graphics = this.scene.add.graphics();

    // 水波纹外圈
    graphics.fillStyle(this.lighten(color, 0.2), 0.3);
    graphics.fillCircle(size / 2, size / 2, 26);

    // 身体 - 水滴形状
    graphics.fillStyle(color, 0.8);
    graphics.fillEllipse(size / 2, size / 2, 24, 28);

    // 内部水流动效果
    graphics.fillStyle(this.lighten(color, 0.4), 0.5);
    graphics.fillEllipse(size / 2 - 4, size / 2 - 4, 12, 14);

    // 头部
    graphics.fillStyle(color, 1);
    graphics.fillCircle(size / 2, size / 2 - 18, 10);

    // 眼睛 - 水蓝色
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(size / 2 - 4, size / 2 - 20, 3);
    graphics.fillCircle(size / 2 + 4, size / 2 - 20, 3);
    graphics.fillStyle(0x4488ff, 1);
    graphics.fillCircle(size / 2 - 4, size / 2 - 20, 2);
    graphics.fillCircle(size / 2 + 4, size / 2 - 20, 2);

    // 水花飞溅效果
    graphics.fillStyle(this.lighten(color, 0.3), 0.6);
    graphics.fillCircle(size / 2 - 16, size / 2 + 8, 4);
    graphics.fillCircle(size / 2 + 18, size / 2 + 6, 3);
    graphics.fillCircle(size / 2, size / 2 + 18, 5);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  private createBossFlameLordSprite(key: string, color: number): void {
    const size = 80;
    const graphics = this.scene.add.graphics();

    // 火焰光环背景
    graphics.fillStyle(0xff2200, 0.3);
    graphics.fillCircle(size / 2, size / 2, 36);

    // 身体
    graphics.fillStyle(color, 1);
    graphics.fillCircle(size / 2, size / 2 + 6, 28);

    // 头部
    graphics.fillStyle(this.lighten(color, 0.1), 1);
    graphics.fillCircle(size / 2, size / 2 - 20, 16);

    // 眼睛 - 燃烧的眼睛
    graphics.fillStyle(0xffff00, 1);
    graphics.fillCircle(size / 2 - 8, size / 2 - 22, 6);
    graphics.fillCircle(size / 2 + 8, size / 2 - 22, 6);
    graphics.fillStyle(0xff0000, 1);
    graphics.fillCircle(size / 2 - 8, size / 2 - 22, 3);
    graphics.fillCircle(size / 2 + 8, size / 2 - 22, 3);

    // 大角
    graphics.fillStyle(this.darken(color, 0.3), 1);
    graphics.fillTriangle(size / 2 - 20, size / 2 - 28, size / 2 - 12, size / 2 - 52, size / 2 - 4, size / 2 - 28);
    graphics.fillTriangle(size / 2 + 4, size / 2 - 28, size / 2 + 12, size / 2 - 52, size / 2 + 20, size / 2 - 28);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  private createBossFrostGiantSprite(key: string, color: number): void {
    const size = 84;
    const graphics = this.scene.add.graphics();

    // 身体 - 巨大的巨人
    graphics.fillStyle(color, 1);
    graphics.fillRect(16, 28, 52, 52);

    // 冰晶装饰
    graphics.fillStyle(0xffffff, 0.6);
    graphics.fillTriangle(20, 20, 28, 12, 36, 20);
    graphics.fillTriangle(48, 20, 56, 12, 64, 20);

    // 头部
    graphics.fillStyle(this.lighten(color, 0.2), 1);
    graphics.fillRect(24, 4, 36, 28);

    // 眼睛 - 冰蓝色
    graphics.fillStyle(0x0033aa, 1);
    graphics.fillRect(32, 12, 8, 8);
    graphics.fillRect(44, 12, 8, 8);
    graphics.fillStyle(0xffffff, 0.8);
    graphics.fillRect(34, 14, 3, 3);
    graphics.fillRect(46, 14, 3, 3);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  private createBossThunderDragonSprite(key: string, color: number): void {
    const size = 80;
    const graphics = this.scene.add.graphics();

    // 身体 - 大龙形
    graphics.fillStyle(color, 1);
    graphics.fillEllipse(size / 2, size / 2 + 8, 40, 24);

    // 大翅膀
    graphics.fillStyle(this.darken(color, 0.2), 1);
    graphics.fillTriangle(8, size / 2, 4, size / 2 - 24, 20, size / 2 + 8);
    graphics.fillTriangle(size - 8, size / 2, size - 4, size / 2 - 24, size - 20, size / 2 + 8);

    // 头部
    graphics.fillStyle(this.lighten(color, 0.15), 1);
    graphics.fillEllipse(size / 2 - 12, size / 2 - 12, 18, 14);

    // 眼睛 - 红色发光
    graphics.fillStyle(0xff0000, 1);
    graphics.fillCircle(size / 2 - 16, size / 2 - 14, 5);
    graphics.fillStyle(0xffff00, 0.8);
    graphics.fillCircle(size / 2 - 16, size / 2 - 14, 2);

    // 尾巴
    graphics.fillStyle(this.darken(color, 0.3), 1);
    graphics.fillTriangle(size - 12, size / 2 + 12, size - 8, size / 2 + 32, size - 20, size / 2 + 18);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  private createBossShadowKingSprite(key: string, color: number): void {
    const size = 78;
    const graphics = this.scene.add.graphics();

    // 暗影光环
    graphics.fillStyle(0x000000, 0.4);
    graphics.fillCircle(size / 2, size / 2, 34);

    // 身体
    graphics.fillStyle(color, 0.9);
    graphics.fillCircle(size / 2, size / 2 + 4, 26);

    // 头部
    graphics.fillStyle(this.darken(color, 0.1), 1);
    graphics.fillCircle(size / 2, size / 2 - 20, 14);

    // 眼睛 - 强烈的紫色发光
    graphics.fillStyle(0xff00ff, 1);
    graphics.fillCircle(size / 2 - 6, size / 2 - 22, 5);
    graphics.fillCircle(size / 2 + 6, size / 2 - 22, 5);
    graphics.fillStyle(0xffffff, 0.8);
    graphics.fillCircle(size / 2 - 6, size / 2 - 22, 2);
    graphics.fillCircle(size / 2 + 6, size / 2 - 22, 2);

    // 大角
    graphics.fillStyle(color, 1);
    graphics.fillTriangle(size / 2 - 18, size / 2 - 30, size / 2 - 10, size / 2 - 50, size / 2 - 2, size / 2 - 30);
    graphics.fillTriangle(size / 2 + 2, size / 2 - 30, size / 2 + 10, size / 2 - 50, size / 2 + 18, size / 2 - 30);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  private createBossNatureGuardianSprite(key: string, color: number): void {
    const size = 76;
    const graphics = this.scene.add.graphics();

    // 身体 - 植物形状
    graphics.fillStyle(color, 1);
    graphics.fillCircle(size / 2, size / 2 + 8, 24);

    // 叶子装饰
    graphics.fillStyle(this.lighten(color, 0.2), 1);
    graphics.fillTriangle(12, size / 2 + 4, 8, size / 2 - 12, 20, size / 2 + 8);
    graphics.fillTriangle(size - 12, size / 2 + 4, size - 8, size / 2 - 12, size - 20, size / 2 + 8);
    graphics.fillTriangle(size / 2, 8, size / 2 - 12, 20, size / 2 + 12, 20);

    // 头部
    graphics.fillStyle(this.lighten(color, 0.1), 1);
    graphics.fillCircle(size / 2, size / 2 - 16, 12);

    // 眼睛
    graphics.fillStyle(0xffff00, 1);
    graphics.fillCircle(size / 2 - 4, size / 2 - 18, 3);
    graphics.fillCircle(size / 2 + 4, size / 2 - 18, 3);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  private createBossGolemLordSprite(key: string, color: number): void {
    const size = 80;
    const graphics = this.scene.add.graphics();

    // 身体 - 巨大岩石
    graphics.fillStyle(color, 1);
    graphics.fillRect(12, 24, 56, 52);

    // 岩石纹理
    graphics.fillStyle(this.darken(color, 0.2), 1);
    graphics.fillRect(20, 32, 12, 12);
    graphics.fillRect(48, 40, 8, 8);

    // 头部
    graphics.fillStyle(this.darken(color, 0.1), 1);
    graphics.fillRect(24, 4, 32, 24);

    // 眼睛 - 发光
    graphics.fillStyle(0xffff00, 1);
    graphics.fillRect(28, 10, 8, 8);
    graphics.fillRect(44, 10, 8, 8);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  private createBossFallenAngelSprite(key: string, color: number): void {
    const size = 78;
    const graphics = this.scene.add.graphics();

    // 光环背景
    graphics.fillStyle(color, 0.2);
    graphics.fillCircle(size / 2, size / 2, 32);

    // 身体
    graphics.fillStyle(color, 1);
    graphics.fillEllipse(size / 2, size / 2 + 8, 24, 18);

    // 翅膀 - 一边堕落（暗）
    graphics.fillStyle(0xffffff, 0.6);
    graphics.fillTriangle(8, size / 2, 4, size / 2 - 20, 16, size / 2 + 4);
    graphics.fillStyle(0x333333, 1);
    graphics.fillTriangle(size - 8, size / 2, size - 4, size / 2 - 20, size - 16, size / 2 + 4);

    // 头部
    graphics.fillStyle(0xaaddff, 1);
    graphics.fillCircle(size / 2, size / 2 - 16, 12);

    // 眼睛 - 一边正常，一边红色
    graphics.fillStyle(0x4444ff, 1);
    graphics.fillCircle(size / 2 - 5, size / 2 - 18, 3);
    graphics.fillStyle(0xff0000, 1);
    graphics.fillCircle(size / 2 + 5, size / 2 - 18, 3);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  private createBossHydraSprite(key: string, color: number): void {
    const size = 82;
    const graphics = this.scene.add.graphics();

    // 身体 - 蛇形
    graphics.fillStyle(color, 1);
    graphics.fillEllipse(size / 2, size / 2 + 12, 36, 22);

    // 多个头（简化为3个）
    graphics.fillStyle(this.lighten(color, 0.1), 1);
    graphics.fillCircle(size / 2 - 16, size / 2 - 16, 10);
    graphics.fillCircle(size / 2, size / 2 - 20, 12);
    graphics.fillCircle(size / 2 + 16, size / 2 - 16, 10);

    // 眼睛
    graphics.fillStyle(0xff6600, 1);
    graphics.fillCircle(size / 2 - 18, size / 2 - 18, 3);
    graphics.fillCircle(size / 2 - 14, size / 2 - 18, 3);
    graphics.fillCircle(size / 2 - 3, size / 2 - 22, 3);
    graphics.fillCircle(size / 2 + 3, size / 2 - 22, 3);
    graphics.fillCircle(size / 2 + 14, size / 2 - 18, 3);
    graphics.fillCircle(size / 2 + 18, size / 2 - 18, 3);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }
}
