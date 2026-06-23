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
    // 史莱姆 - 绿色果冻状
    this.createSlimeSprite('enemy_slime', 0x44dd66);

    // 蝙蝠 - 紫色飞行
    this.createBatSprite('enemy_bat', 0x8844aa);

    // 骷髅 - 灰白色
    this.createSkeletonSprite('enemy_skeleton', 0xccccaa);

    // 精英兽人 - 深红色大块头
    this.createOrcSprite('enemy_orc', 0xdd4444);

    // 精英法师 - 紫色法袍
    this.createMageSprite('enemy_mage', 0x8844ff);

    // Boss - 巨型暗黑骑士
    this.createBossSprite('enemy_boss', 0x2a0a3a);
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

    // 冰片
    this.createIceShardSprite('projectile_ice', 0x44ccff);

    // 闪电
    this.createLightningSprite('projectile_lightning', 0xffff00);

    // 暗影
    this.createShadowSprite('projectile_shadow', 0x8800ff);

    // 神圣
    this.createHolySprite('projectile_holy', 0xffcc00);
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
    const fireGfx = this.scene.add.graphics();
    fireGfx.fillStyle(0xff8800, 1);
    fireGfx.fillCircle(6, 6, 3);
    fireGfx.fillStyle(0xffff00, 0.8);
    fireGfx.fillCircle(6, 6, 2);
    fireGfx.generateTexture('particle_fire', 12, 12);
    fireGfx.destroy();

    // 冰霜粒子
    const iceGfx = this.scene.add.graphics();
    iceGfx.fillStyle(0x88ddff, 1);
    iceGfx.fillRect(2, 2, 4, 4);
    iceGfx.fillStyle(0xffffff, 0.8);
    iceGfx.fillRect(3, 3, 2, 2);
    iceGfx.generateTexture('particle_ice', 8, 8);
    iceGfx.destroy();

    // 闪电粒子
    const lightningGfx = this.scene.add.graphics();
    lightningGfx.fillStyle(0xffff44, 1);
    lightningGfx.fillRect(0, 4, 8, 2);
    lightningGfx.fillStyle(0xffffff, 1);
    lightningGfx.fillRect(2, 4, 4, 2);
    lightningGfx.generateTexture('particle_lightning', 8, 8);
    lightningGfx.destroy();
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
}
