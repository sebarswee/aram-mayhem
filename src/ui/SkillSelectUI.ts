import Phaser from 'phaser';
import { Skill } from '@/types';
import { ELEMENT_COLORS, getElementColor, ELEMENT_NAMES } from '@/data/elements';

/**
 * 开局技能选择界面 - 增强版
 * 显示4个随机基础技能供玩家选择
 *
 * 增强功能：
 * - 卡片依次飞入动画
 * - 流光边框效果
 * - 悬停元素光芒
 * - 选中全屏闪光+冲击波
 * - 动态渐变背景
 * - 粒子漂浮效果
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

    // scrollFactor(0) 固定在屏幕上，容器位置设为 (0,0)
    // 容器内元素使用屏幕坐标定位
    this.container.setPosition(0, 0);
    this.container.setScrollFactor(0);

    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    // 动态渐变背景
    this.createGradientBackground(width, height);

    // 背景粒子效果
    this.createBackgroundParticles(width, height);

    // 标题 - 响应式字体大小
    const titleFontSize = Math.min(36, width / 18);
    const title = this.scene.add.text(width / 2, height * 0.06, '选择初始技能', {
      fontSize: `${titleFontSize}px`,
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    title.setOrigin(0.5);
    title.setAlpha(0);
    this.container.add(title);

    // 标题动画
    this.scene.tweens.add({
      targets: title,
      alpha: 1,
      y: height * 0.08,
      duration: 400,
      ease: 'Power2',
    });

    // 副标题
    const subtitleFontSize = Math.min(16, width / 40);
    const subtitle = this.scene.add.text(
      width / 2,
      height * 0.14,
      '选择一个技能开始你的冒险',
      {
        fontSize: `${subtitleFontSize}px`,
        color: '#aaaaaa',
      }
    );
    subtitle.setOrigin(0.5);
    subtitle.setAlpha(0);
    this.container.add(subtitle);

    this.scene.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 400,
      delay: 100,
    });

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
      this.createSkillCard(skill, cardX, cardY, cardWidth, cardHeight, index);
    });
  }

  /**
   * 创建动态渐变背景
   */
  private createGradientBackground(width: number, height: number): void {
    // 创建网格背景
    const grid = this.scene.add.graphics();

    // 渐变网格效果
    const gridSize = 50;
    for (let x = 0; x < width; x += gridSize) {
      for (let y = 0; y < height; y += gridSize) {
        const distFromCenter = Math.sqrt(
          Math.pow(x - width / 2, 2) + Math.pow(y - height / 2, 2)
        );
        const maxDist = Math.sqrt(Math.pow(width / 2, 2) + Math.pow(height / 2, 2));
        const alpha = 0.05 + (1 - distFromCenter / maxDist) * 0.1;

        grid.fillStyle(0x4a4a6a, alpha);
        grid.fillRect(x, y, gridSize - 1, gridSize - 1);
      }
    }

    grid.setAlpha(0.3);
    this.container.add(grid);

    // 网格呼吸动画
    this.scene.tweens.add({
      targets: grid,
      alpha: 0.5,
      duration: 2000,
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * 创建背景粒子效果
   */
  private createBackgroundParticles(width: number, height: number): void {
    // 创建漂浮的光点
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 3 + 1;
      const alpha = Math.random() * 0.4 + 0.1;

      const particle = this.scene.add.circle(x, y, size, 0xffffff, alpha);
      this.container.add(particle);

      // 漂浮动画
      this.scene.tweens.add({
        targets: particle,
        y: particle.y - 80 - Math.random() * 80,
        alpha: 0,
        duration: 3000 + Math.random() * 2000,
        repeat: -1,
        onRepeat: () => {
          particle.y = height + 10;
          particle.x = Math.random() * width;
          particle.alpha = alpha;
        },
      });
    }
  }

  /**
   * 创建技能卡片 - 增强版
   */
  private createSkillCard(
    skill: Skill,
    x: number,
    y: number,
    width: number,
    height: number,
    index: number
  ): void {
    // 卡片容器直接设置交互
    const card = this.scene.add.container(x, y);
    card.setScrollFactor(0);
    card.setSize(width, height); // 设置容器大小用于交互
    card.setInteractive({ useHandCursor: true });
    card.setAlpha(0);
    card.setY(y - 150); // 初始位置在屏幕上方

    // 使用统一的元素颜色
    const color = getElementColor(skill.elements[0]);

    // 流光边框效果 - 创建在卡片前面
    const glowEffect = this.scene.add.graphics();

    // 外层光晕
    glowEffect.fillStyle(color, 0.1);
    glowEffect.fillRoundedRect(-width / 2 - 8, -height / 2 - 8, width + 16, height + 16, 14);
    card.add(glowEffect);

    // 卡片框
    const bg = this.scene.add.rectangle(0, 0, width, height, 0x1a1a2e, 1);
    bg.setStrokeStyle(3, color, 1);
    card.add(bg);

    // 内部渐变效果
    const innerGlow = this.scene.add.graphics();
    innerGlow.fillStyle(color, 0.05);
    innerGlow.fillRoundedRect(-width / 2 + 5, -height / 2 + 5, width - 10, height - 10, 8);
    card.add(innerGlow);

    // 响应式字体大小
    const iconFontSize = Math.min(36, width / 4);
    const nameFontSize = Math.min(16, width / 9);
    const typeFontSize = Math.min(11, width / 13);
    const descFontSize = Math.min(10, width / 15);
    const elementFontSize = Math.min(10, width / 15);

    // 技能图标区域 - 带光晕
    const iconGlow = this.scene.add.circle(0, -height / 2 + 35, 30, color, 0.25);
    card.add(iconGlow);

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

    // 流光动画 - 光线从左到右移动
    this.createFlowingLight(card, width, height, color);

    // 边框脉动
    this.scene.tweens.add({
      targets: bg,
      strokeAlpha: 0.6,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    // 入场动画 - 错开飞入
    this.scene.tweens.add({
      targets: card,
      y: y,
      alpha: 1,
      duration: 500,
      delay: index * 120,
      ease: 'Back.out',
    });

    // 交互事件绑定到容器
    card.on('pointerover', () => {
      // 光晕扩散
      this.scene.tweens.add({
        targets: glowEffect,
        scaleX: 1.05,
        scaleY: 1.05,
        alpha: 1,
        duration: 200,
      });

      // 图标光晕增强
      this.scene.tweens.add({
        targets: iconGlow,
        scale: 1.3,
        alpha: 0.5,
        duration: 200,
      });

      bg.setStrokeStyle(4, 0xffffff, 1);
      bg.setFillStyle(0x2a2a4e, 1);

      // 图标放大
      this.scene.tweens.add({
        targets: iconText,
        scale: 1.2,
        duration: 150,
      });
    });

    card.on('pointerout', () => {
      this.scene.tweens.add({
        targets: glowEffect,
        scaleX: 1,
        scaleY: 1,
        alpha: 0.1,
        duration: 200,
      });

      this.scene.tweens.add({
        targets: iconGlow,
        scale: 1,
        alpha: 0.25,
        duration: 200,
      });

      bg.setStrokeStyle(3, color, 1);
      bg.setFillStyle(0x1a1a2e, 1);

      this.scene.tweens.add({
        targets: iconText,
        scale: 1,
        duration: 150,
      });
    });

    card.on('pointerdown', () => {
      this.selectSkill(skill, card, width, height);
    });

    this.container.add(card);
  }

  /**
   * 创建流光效果
   */
  private createFlowingLight(
    card: Phaser.GameObjects.Container,
    width: number,
    height: number,
    color: number
  ): void {
    // 创建流光线
    const light = this.scene.add.graphics();
    light.fillStyle(0xffffff, 0.4);
    light.fillRect(-width / 2, -height / 2, 3, height);
    card.addAt(light, 1);

    // 初始位置
    light.x = -width;
    light.setAlpha(0);

    // 流动动画
    this.scene.tweens.add({
      targets: light,
      x: width,
      alpha: { from: 0, to: 0.8 },
      duration: 1500,
      delay: Math.random() * 1000,
      repeat: -1,
      repeatDelay: 2000,
    });
  }

  /**
   * 选择技能 - 带特效
   */
  private selectSkill(skill: Skill, card: Phaser.GameObjects.Container, width: number, height: number): void {
    this.selectedSkill = skill;

    // 全屏闪光
    const flash = this.scene.add.rectangle(0, 0, width * 2, height * 2, 0xffffff, 0.5);
    flash.setOrigin(0.5);
    flash.setScrollFactor(0);
    flash.setDepth(999);
    this.container.add(flash);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy(),
    });

    // 冲击波效果
    const shockwave = this.scene.add.graphics();
    shockwave.lineStyle(5, getElementColor(skill.elements[0]), 1);
    shockwave.strokeCircle(0, 0, 20);
    shockwave.setPosition(card.x, card.y);
    shockwave.setScrollFactor(0);
    shockwave.setDepth(999);
    this.container.add(shockwave);

    this.scene.tweens.add({
      targets: shockwave,
      scale: 8,
      alpha: 0,
      duration: 500,
      onComplete: () => shockwave.destroy(),
    });

    // 选中卡片放大并消失
    this.scene.tweens.add({
      targets: card,
      scale: 1.3,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.hide();
        this.onSelectCallback(skill);
      },
    });
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
      frost_nova: '💠',
      poison_cloud: '☠️',
      holy_light: '✨',
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
