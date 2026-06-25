import Phaser from 'phaser';
import { GraphicsFactory } from '@/graphics/GraphicsFactory';

/**
 * 资源类型定义
 */
export type AssetType = 'icon' | 'effect' | 'ui' | 'character' | 'background';

/**
 * 资源加载器
 * 支持外部资源和程序化生成的混合使用
 */
export class AssetLoader {
  private scene: Phaser.Scene;
  private graphicsFactory: GraphicsFactory;
  private loadedAssets: Map<string, boolean> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.graphicsFactory = new GraphicsFactory(scene);
  }

  /**
   * 预加载所有外部资源
   * 在 BootScene 或 BattleScene 中调用
   */
  preload(): void {
    // 加载技能图标
    this.loadSkillIcons();

    // 加载元素图标
    this.loadElementIcons();

    // 加载状态图标
    this.loadStatusIcons();

    // 加载特效
    this.loadEffects();

    // 加载UI组件
    this.loadUI();

    // 加载背景
    this.loadBackgrounds();
  }

  /**
   * 加载技能图标
   */
  private loadSkillIcons(): void {
    const elements = ['fire', 'water', 'ice', 'lightning', 'holy', 'shadow', 'grass', 'earth'];

    for (const element of elements) {
      const skills = this.getSkillsByElement(element);
      for (const skillId of skills) {
        const path = `assets/icons/skills/${element}/${skillId}.png`;
        this.loadImage(`icon_skill_${skillId}`, path);
      }
    }
  }

  /**
   * 获取元素对应的技能ID列表
   */
  private getSkillsByElement(element: string): string[] {
    const skillMap: Record<string, string[]> = {
      fire: ['fireball', 'flame_wave', 'ignite', 'flame_shield', 'meteor', 'dragon_breath', 'inferno'],
      water: ['water_bullet', 'tidal_wave', 'water_dash', 'purify', 'tsunami', 'abyss_vortex', 'frozen_domain'],
      ice: ['ice_shard', 'frost_nova', 'ice_barrage', 'glacial_spike', 'blizzard', 'absolute_zero', 'ice_wall', 'frost_armor'],
      lightning: ['lightning_bolt', 'thunder_storm', 'lightning_focus', 'electric_field', 'arc_lightning', 'static_field', 'thunder_strike', 'thunder_apocalypse'],
      holy: ['holy_light', 'divine_shield', 'halo', 'blessing', 'judgment_light', 'sanctuary'],
      shadow: ['shadow_bolt', 'curse_aura', 'shadow_step', 'hex', 'void_rift', 'shadow_descent', 'death_decay'],
      grass: ['vine_whip', 'poison_cloud', 'seed_bomb', 'thorns', 'overgrowth', 'force_of_nature', 'forest_rage'],
      earth: ['rock_spike', 'sandstorm', 'seismic_wave', 'stone_skin', 'earthquake', 'mountain_collapse', 'earth_guardian'],
    };
    return skillMap[element] || [];
  }

  /**
   * 加载元素图标
   */
  private loadElementIcons(): void {
    const elements = ['fire', 'water', 'ice', 'lightning', 'holy', 'shadow', 'grass', 'earth'];
    for (const element of elements) {
      this.loadImage(`icon_element_${element}`, `assets/icons/elements/${element}.png`);
    }
  }

  /**
   * 加载状态图标
   */
  private loadStatusIcons(): void {
    const buffs = ['shield', 'heal', 'attack_boost', 'speed_boost', 'damage_reflect'];
    const debuffs = ['burn', 'freeze', 'poison', 'stun', 'slow', 'knockback', 'defense_break', 'root'];

    for (const buff of buffs) {
      this.loadImage(`icon_status_${buff}`, `assets/icons/status/buffs/${buff}.png`);
    }
    for (const debuff of debuffs) {
      this.loadImage(`icon_status_${debuff}`, `assets/icons/status/debuffs/${debuff}.png`);
    }
  }

  /**
   * 加载特效资源
   */
  private loadEffects(): void {
    const elements = ['fire', 'water', 'ice', 'lightning', 'holy', 'shadow', 'grass', 'earth'];

    // 爆炸效果序列帧
    for (const element of elements) {
      for (let i = 1; i <= 8; i++) {
        const frameNum = i.toString().padStart(2, '0');
        this.loadImage(
          `effect_explosion_${element}_${frameNum}`,
          `assets/effects/explosions/${element}/explosion_${element}_${frameNum}.png`
        );
      }
    }
  }

  /**
   * 加载UI组件
   */
  private loadUI(): void {
    // 按钮
    const buttonTypes = ['primary', 'danger', 'skill', 'upgrade'];
    const buttonStates = ['normal', 'hover', 'pressed'];

    for (const type of buttonTypes) {
      for (const state of buttonStates) {
        this.loadImage(`ui_button_${type}_${state}`, `assets/ui/buttons/${type}/${state}.png`);
      }
    }

    // 面板
    const panels = ['main', 'tooltip', 'skill_select', 'inventory'];
    for (const panel of panels) {
      this.loadImage(`ui_panel_${panel}`, `assets/ui/panels/${panel}.png`);
    }

    // 进度条
    const bars = ['health_bar', 'mana_bar', 'exp_bar', 'cooldown'];
    for (const bar of bars) {
      this.loadImage(`ui_bar_${bar}`, `assets/ui/progress/${bar}.png`);
    }
  }

  /**
   * 加载背景
   */
  private loadBackgrounds(): void {
    this.loadImage('background_battle', 'assets/backgrounds/battle_arena.png');
    this.loadImage('background_menu', 'assets/backgrounds/main_menu.png');
  }

  /**
   * 安全加载图片（如果文件不存在不会报错）
   */
  private loadImage(key: string, path: string): void {
    // 使用 Phaser 的 file progress 事件来检测加载失败
    this.scene.load.image(key, path);

    // 标记为尝试加载（实际成功/失败在 complete 后检查）
    this.loadedAssets.set(key, false);
  }

  /**
   * 检查资源是否加载成功
   */
  isLoaded(key: string): boolean {
    return this.scene.textures.exists(key);
  }

  /**
   * 获取技能图标
   * 优先使用外部资源，fallback 到程序化生成
   */
  getSkillIcon(skillId: string): string {
    const key = `icon_skill_${skillId}`;

    if (this.isLoaded(key)) {
      return key;
    }

    // Fallback: 使用程序化生成的图标
    if (!this.scene.textures.exists(`skill_${skillId}`)) {
      // GraphicsFactory 会生成图标
      // 这里返回一个通用图标 key
    }

    return `skill_${skillId}`;
  }

  /**
   * 获取元素图标
   */
  getElementIcon(element: string): string {
    const key = `icon_element_${element}`;

    if (this.isLoaded(key)) {
      return key;
    }

    // Fallback: 返回程序化生成的图标
    return `element_${element}`;
  }

  /**
   * 获取状态图标
   */
  getStatusIcon(statusType: string): string {
    const key = `icon_status_${statusType}`;

    if (this.isLoaded(key)) {
      return key;
    }

    // Fallback
    return `status_${statusType}`;
  }

  /**
   * 获取爆炸效果纹理
   */
  getExplosionTexture(element: string, frame: number): string {
    const frameNum = frame.toString().padStart(2, '0');
    const key = `effect_explosion_${element}_${frameNum}`;

    if (this.isLoaded(key)) {
      return key;
    }

    // Fallback: 返回通用的粒子纹理
    return 'particle_glow';
  }

  /**
   * 获取UI纹理
   */
  getUITexture(type: string, name: string, state?: string): string {
    const key = state ? `ui_${type}_${name}_${state}` : `ui_${type}_${name}`;

    if (this.isLoaded(key)) {
      return key;
    }

    // Fallback: 返回一个基础的 UI 纹理
    return 'pixel_white';
  }

  /**
   * 获取背景纹理
   */
  getBackground(name: string): string {
    const key = `background_${name}`;

    if (this.isLoaded(key)) {
      return key;
    }

    // Fallback: 返回 null，使用代码绘制的背景
    return '';
  }

  /**
   * 创建精灵，优先使用外部资源
   */
  createSprite(x: number, y: number, textureKey: string): Phaser.GameObjects.Sprite | null {
    if (this.isLoaded(textureKey)) {
      return this.scene.add.sprite(x, y, textureKey);
    }
    return null;
  }

  /**
   * 创建图片，优先使用外部资源
   */
  createImage(x: number, y: number, textureKey: string): Phaser.GameObjects.Image | null {
    if (this.isLoaded(textureKey)) {
      return this.scene.add.image(x, y, textureKey);
    }
    return null;
  }

  /**
   * 清理资源缓存
   */
  destroy(): void {
    this.loadedAssets.clear();
  }
}
