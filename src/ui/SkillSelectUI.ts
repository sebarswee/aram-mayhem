import Phaser from 'phaser';
import { Skill } from '@/types';
import { ELEMENT_COLORS, getElementColor, ELEMENT_NAMES } from '@/data/elements';

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

    // 标题 - 响应式字体大小
    const titleFontSize = Math.min(32, width / 20);
    const title = this.scene.add.text(width / 2, height * 0.08, '选择初始技能', {
      fontSize: `${titleFontSize}px`,
      color: '#ffffff',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    this.container.add(title);

    // 副标题
    const subtitleFontSize = Math.min(16, width / 40);
    const subtitle = this.scene.add.text(
      width / 2,
      height * 0.13,
      '选择一个技能开始你的冒险',
      {
        fontSize: `${subtitleFontSize}px`,
        color: '#aaaaaa',
      }
    );
    subtitle.setOrigin(0.5);
    this.container.add(subtitle);

    // 技能卡片 - 响应式布局
    // 在小屏幕上使用2行2列，大屏幕使用1行4列
    const isSmallScreen = width < 500;
    const columns = isSmallScreen ? 2 : 4;
    const rows = isSmallScreen ? 2 : 1;

    const padding = 20;
    const gap = 15;
    const cardWidth = Math.min(150, (width - padding * 2 - gap * (columns - 1)) / columns);
    const cardHeight = isSmallScreen ? 180 : 200;

    const totalWidth = cardWidth * columns + gap * (columns - 1);
    const totalHeight = cardHeight * rows + gap * (rows - 1);
    const startX = (width - totalWidth) / 2 + cardWidth / 2;
    const startY = height / 2 - totalHeight / 2 + cardHeight / 2;

    skills.forEach((skill, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const cardX = startX + col * (cardWidth + gap);
      const cardY = startY + row * (cardHeight + gap);
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

    // 使用统一的元素颜色
    const color = getElementColor(skill.elements[0]);

    // 卡片框
    const bg = this.scene.add.rectangle(0, 0, width, height, 0x222233, 1);
    bg.setStrokeStyle(3, color, 1);
    card.add(bg);

    // 响应式字体大小
    const iconFontSize = Math.min(36, width / 4);
    const nameFontSize = Math.min(16, width / 9);
    const typeFontSize = Math.min(11, width / 13);
    const descFontSize = Math.min(10, width / 15);
    const elementFontSize = Math.min(10, width / 15);

    // 技能图标区域
    const iconBg = this.scene.add.rectangle(0, -height / 2 + 35, width - 10, 50, color, 0.3);
    card.add(iconBg);

    // 技能图标（使用文字代替）
    const iconText = this.scene.add.text(0, -height / 2 + 35, this.getSkillIcon(skill), {
      fontSize: `${iconFontSize}px`,
    });
    iconText.setOrigin(0.5);
    card.add(iconText);

    // 技能名称
    const name = this.scene.add.text(0, -height / 2 + 70, skill.name, {
      fontSize: `${nameFontSize}px`,
      color: '#ffffff',
      fontStyle: 'bold',
    });
    name.setOrigin(0.5);
    card.add(name);

    // 元素类型标签
    const elementNames = skill.elements.map(e => ELEMENT_NAMES[e]).join('·');
    const elementText = this.scene.add.text(0, -height / 2 + 88, elementNames, {
      fontSize: `${elementFontSize}px`,
      color: `#${color.toString(16).padStart(6, '0')}`,
    });
    elementText.setOrigin(0.5);
    card.add(elementText);

    // 技能类型
    const typeText = this.scene.add.text(0, -height / 2 + 102, this.getSkillTypeText(skill), {
      fontSize: `${typeFontSize}px`,
      color: '#888888',
    });
    typeText.setOrigin(0.5);
    card.add(typeText);

    // 技能描述 - 限制最大行数，超出显示省略号
    const descMaxWidth = width - 15;
    const descText = this.truncateText(skill.description, descMaxWidth, descFontSize, 3);
    const desc = this.scene.add.text(0, -height / 2 + 115, descText, {
      fontSize: `${descFontSize}px`,
      color: '#cccccc',
      wordWrap: { width: descMaxWidth },
      align: 'center',
      lineSpacing: 2,
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
   * 截断文本，超出显示省略号
   */
  private truncateText(text: string, maxWidth: number, fontSize: number, maxLines: number): string {
    // 简单估算：中文字符约等于 fontSize 像素宽
    const charsPerLine = Math.floor(maxWidth / fontSize);
    const maxChars = charsPerLine * maxLines;

    if (text.length <= maxChars) {
      return text;
    }

    return text.substring(0, maxChars - 1) + '…';
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
