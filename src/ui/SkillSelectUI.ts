import Phaser from 'phaser';
import { Skill } from '@/types';

/**
 * 开局技能选择界面
 * 显示4个随机基础技能供玩家选择
 */
export class SkillSelectUI {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private skills: Skill[] = [];
  private selectedSkill: Skill | null = null;
  private onSelectCallback: (skill: Skill) => void;

  constructor(
    scene: Phaser.Scene,
    onSelect: (skill: Skill) => void
  ) {
    this.scene = scene;
    this.onSelectCallback = onSelect;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(1000);
    this.container.setVisible(false);
  }

  /**
   * 显示技能选择界面
   */
  show(skills: Skill[]): void {
    this.skills = skills;
    this.selectedSkill = null;
    this.container.removeAll(true);
    this.container.setVisible(true);

    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    // 半透明背景
    const bg = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.8);
    bg.setOrigin(0, 0);
    this.container.add(bg);

    // 标题
    const title = this.scene.add.text(width / 2, 60, '选择初始技能', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    this.container.add(title);

    // 副标题
    const subtitle = this.scene.add.text(
      width / 2,
      100,
      '选择一个技能开始你的冒险',
      {
        fontSize: '16px',
        color: '#aaaaaa',
      }
    );
    subtitle.setOrigin(0.5);
    this.container.add(subtitle);

    // 技能卡片
    const cardWidth = Math.min(160, (width - 100) / 4);
    const cardHeight = 220;
    const gap = 20;
    const totalWidth = cardWidth * 4 + gap * 3;
    const startX = (width - totalWidth) / 2 + cardWidth / 2;
    const cardY = height / 2;

    skills.forEach((skill, index) => {
      const cardX = startX + index * (cardWidth + gap);
      this.createSkillCard(skill, cardX, cardY, cardWidth, cardHeight);
    });
  }

  /**
   * 创建技能卡片
   */
  private createSkillCard(
    skill: Skill,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    // 卡片背景
    const card = this.scene.add.container(x, y);

    // 根据元素选择颜色
    const elementColors: Record<string, number> = {
      fire: 0xff4400,
      ice: 0x44ccff,
      lightning: 0xffff00,
      physical: 0xaaaaaa,
      shadow: 0x8800ff,
      holy: 0xffcc00,
    };
    const color = elementColors[skill.elements[0]] || 0xffffff;

    // 卡片框
    const bg = this.scene.add.rectangle(0, 0, width, height, 0x222233, 1);
    bg.setStrokeStyle(3, color, 1);
    card.add(bg);

    // 技能图标区域
    const iconBg = this.scene.add.rectangle(0, -50, width - 20, 80, color, 0.3);
    card.add(iconBg);

    // 技能图标（使用文字代替）
    const iconText = this.scene.add.text(0, -50, this.getSkillIcon(skill), {
      fontSize: '40px',
    });
    iconText.setOrigin(0.5);
    card.add(iconText);

    // 技能名称
    const name = this.scene.add.text(0, 20, skill.name, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    name.setOrigin(0.5);
    card.add(name);

    // 技能类型
    const typeText = this.scene.add.text(0, 45, this.getSkillTypeText(skill), {
      fontSize: '12px',
      color: '#888888',
    });
    typeText.setOrigin(0.5);
    card.add(typeText);

    // 技能描述
    const desc = this.scene.add.text(0, 75, skill.description, {
      fontSize: '11px',
      color: '#cccccc',
      wordWrap: { width: width - 20 },
      align: 'center',
    });
    desc.setOrigin(0.5, 0);
    card.add(desc);

    // 点击交互
    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerover', () => {
      bg.setStrokeStyle(4, 0xffffff, 1);
      bg.setFillStyle(0x333344, 1);
    });

    bg.on('pointerout', () => {
      bg.setStrokeStyle(3, color, 1);
      bg.setFillStyle(0x222233, 1);
    });

    bg.on('pointerdown', () => {
      this.selectSkill(skill);
    });

    this.container.add(card);
  }

  /**
   * 获取技能图标（emoji）
   */
  private getSkillIcon(skill: Skill): string {
    const icons: Record<string, string> = {
      fireball: '🔥',
      ice_shard: '❄️',
      lightning_bolt: '⚡',
      multi_shot: '🏹',
      boomerang: '🪃',
      homing_missile: '🚀',
      poison_dart: '🎯',
      flame_circle: '💫',
      frost_nova: '💠',
      whirlwind: '🌀',
      poison_cloud: '☠️',
      ground_spike: '⛰️',
      holy_light: '✨',
      black_hole: '🕳️',
      time_stop: '⏱️',
      summon: '👻',
      shield: '🛡️',
    };
    return icons[skill.id] || '⭐';
  }

  /**
   * 获取技能类型文本
   */
  private getSkillTypeText(skill: Skill): string {
    if (skill.categories.includes('projectile')) return '投射物';
    if (skill.categories.includes('area')) return '范围';
    if (skill.categories.includes('summon')) return '召唤';
    if (skill.categories.includes('buff')) return '增益';
    if (skill.categories.includes('control')) return '控制';
    return '基础';
  }

  /**
   * 选择技能
   */
  private selectSkill(skill: Skill): void {
    this.selectedSkill = skill;
    this.hide();
    this.onSelectCallback(skill);
  }

  /**
   * 隐藏界面
   */
  hide(): void {
    this.container.setVisible(false);
    this.container.removeAll(true);
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.container.destroy();
  }
}
