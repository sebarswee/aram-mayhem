import Phaser from 'phaser';
import { Skill, SkillEnhancer, StatBoost, UpgradeOption } from '@/types';
import { EnhancementSystem } from '@/systems/EnhancementSystem';
import { getRandomSkill, cloneSkill } from '@/data/skills';

/**
 * 升级选择界面
 * 支持三种选项：新技能、技能强化石、属性提升
 */
export class UpgradeSelectUI {
  private scene: Phaser.Scene;
  private enhancementSystem: EnhancementSystem;
  private container: Phaser.GameObjects.Container;
  private options: UpgradeOption[] = [];
  private onSelectCallback: () => void;

  constructor(
    scene: Phaser.Scene,
    enhancementSystem: EnhancementSystem,
    onSelect: () => void
  ) {
    this.scene = scene;
    this.enhancementSystem = enhancementSystem;
    this.onSelectCallback = onSelect;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(1000);
    this.container.setVisible(false);
  }

  /**
   * 显示升级选择界面
   */
  show(): void {
    this.options = this.generateOptions();
    this.container.removeAll(true);
    this.container.setVisible(true);

    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    // 半透明背景
    const bg = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.85);
    bg.setOrigin(0, 0);
    this.container.add(bg);

    // 标题 - 响应式字体
    const titleFontSize = Math.min(32, width / 18);
    const title = this.scene.add.text(width / 2, height * 0.08, '升级！', {
      fontSize: `${titleFontSize}px`,
      color: '#ffcc00',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    this.container.add(title);

    // 副标题
    const subtitleFontSize = Math.min(16, width / 35);
    const subtitle = this.scene.add.text(width / 2, height * 0.14, '选择一项强化', {
      fontSize: `${subtitleFontSize}px`,
      color: '#aaaaaa',
    });
    subtitle.setOrigin(0.5);
    this.container.add(subtitle);

    // 选项卡片 - 响应式布局
    const isSmallScreen = width < 500;
    const columns = Math.min(this.options.length, isSmallScreen ? 1 : 3);
    const rows = Math.ceil(this.options.length / columns);

    const padding = 20;
    const gap = 15;
    const cardWidth = Math.min(180, (width - padding * 2 - gap * (columns - 1)) / columns);
    const cardHeight = isSmallScreen ? 160 : 220;

    const totalWidth = cardWidth * columns + gap * (columns - 1);
    const totalHeight = cardHeight * rows + gap * (rows - 1);
    const startX = (width - totalWidth) / 2 + cardWidth / 2;
    const startY = height / 2 - totalHeight / 2 + cardHeight / 2;

    this.options.forEach((option, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const cardX = startX + col * (cardWidth + gap);
      const cardY = startY + row * (cardHeight + gap);
      this.createOptionCard(option, index, cardX, cardY, cardWidth, cardHeight, isSmallScreen);
    });
  }

  /**
   * 生成升级选项
   */
  private generateOptions(): UpgradeOption[] {
    const options: UpgradeOption[] = [];
    const player = (this.scene as any).player;
    const currentSkills = player?.skills || [];

    // 选项1：新技能（如果技能数量少于6个）
    if (currentSkills.length < 6) {
      const existingIds = currentSkills.map((s: Skill) => s.id);
      const newSkill = getRandomSkill(existingIds);
      if (newSkill) {
        options.push({ type: 'new_skill', data: cloneSkill(newSkill) });
      }
    }

    // 选项2：技能强化石
    const enhancerOptions = this.enhancementSystem.getApplicableEnhancersForPlayer();
    if (enhancerOptions.length > 0) {
      // 随机选一个
      const randomChoice = enhancerOptions[Math.floor(Math.random() * enhancerOptions.length)];
      options.push({
        type: 'skill_enhancer',
        data: { ...randomChoice.enhancer, skillId: randomChoice.skillId } as any,
      });
    }

    // 选项3：属性提升
    const statBoost = this.enhancementSystem.getAvailableStatBoosts()[
      Math.floor(Math.random() * this.enhancementSystem.getAvailableStatBoosts().length)
    ];
    if (statBoost) {
      options.push({ type: 'stat_boost', data: statBoost });
    }

    // 确保至少有3个选项
    while (options.length < 3) {
      const fallbackStat = this.enhancementSystem.getAvailableStatBoosts()[
        Math.floor(Math.random() * this.enhancementSystem.getAvailableStatBoosts().length)
      ];
      if (fallbackStat && !options.some((o) => o.type === 'stat_boost' && (o.data as StatBoost).id === fallbackStat.id)) {
        options.push({ type: 'stat_boost', data: fallbackStat });
      } else {
        break;
      }
    }

    return options.slice(0, 3);
  }

  /**
   * 创建选项卡片
   */
  private createOptionCard(
    option: UpgradeOption,
    _index: number,
    x: number,
    y: number,
    width: number,
    height: number,
    isSmallScreen: boolean
  ): void {
    const card = this.scene.add.container(x, y);

    // 稀有度颜色
    let color = 0xffffff;
    let rarityText = '';
    let title = '';
    let description = '';
    let icon = '⭐';

    if (option.type === 'new_skill') {
      const skill = option.data as Skill;
      const elementColors: Record<string, number> = {
        fire: 0xff4400,
        ice: 0x44ccff,
        lightning: 0xffff00,
        physical: 0xaaaaaa,
        shadow: 0x8800ff,
        holy: 0xffcc00,
      };
      color = elementColors[skill.elements[0]] || 0xffffff;
      title = skill.name;
      description = skill.description;
      icon = this.getSkillIcon(skill);
      rarityText = '新技能';
    } else if (option.type === 'skill_enhancer') {
      const enhancer = option.data as SkillEnhancer & { skillId?: string };
      const rarityColors: Record<string, number> = {
        common: 0xffffff,
        rare: 0x00ff00,
        epic: 0x0088ff,
        legendary: 0xaa00ff,
        mythic: 0xffaa00,
      };
      color = rarityColors[enhancer.rarity] || 0xffffff;
      title = enhancer.name;
      description = enhancer.description;
      icon = this.getEnhancerIcon(enhancer);
      rarityText = this.getRarityText(enhancer.rarity);
    } else if (option.type === 'stat_boost') {
      const boost = option.data as StatBoost;
      title = boost.name;
      description = boost.description;
      icon = '📈';
      rarityText = '属性';
    }

    // 卡片背景
    const bg = this.scene.add.rectangle(0, 0, width, height, 0x222233, 1);
    bg.setStrokeStyle(3, color, 1);
    card.add(bg);

    // 响应式字体大小
    const rarityFontSize = Math.min(11, width / 14);
    const iconFontSize = Math.min(40, width / 4);
    const titleFontSize = Math.min(16, width / 10);
    const descFontSize = Math.min(11, width / 14);

    // 稀有度标签
    const rarityLabel = this.scene.add.text(0, -height / 2 + 15, rarityText, {
      fontSize: `${rarityFontSize}px`,
      color: `#${color.toString(16).padStart(6, '0')}`,
    });
    rarityLabel.setOrigin(0.5);
    card.add(rarityLabel);

    // 图标
    const iconText = this.scene.add.text(0, isSmallScreen ? -height / 2 + 40 : -20, icon, {
      fontSize: `${iconFontSize}px`,
    });
    iconText.setOrigin(0.5);
    card.add(iconText);

    // 标题
    const titleText = this.scene.add.text(0, isSmallScreen ? -height / 2 + 70 : 30, title, {
      fontSize: `${titleFontSize}px`,
      color: '#ffffff',
      fontStyle: 'bold',
    });
    titleText.setOrigin(0.5);
    card.add(titleText);

    // 描述 - 截断长文本
    const descMaxWidth = width - 15;
    const descText = this.truncateText(description, descMaxWidth, descFontSize, isSmallScreen ? 2 : 3);
    const desc = this.scene.add.text(0, isSmallScreen ? -height / 2 + 95 : 60, descText, {
      fontSize: `${descFontSize}px`,
      color: '#cccccc',
      wordWrap: { width: descMaxWidth },
      align: 'center',
      lineSpacing: 2,
    });
    desc.setOrigin(0.5, 0);
    card.add(desc);

    // 交互
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
      this.selectOption(option);
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
   * 获取技能图标
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
   * 获取强化石图标
   */
  private getEnhancerIcon(enhancer: SkillEnhancer): string {
    const icons: Record<string, string> = {
      split_1: '✂️',
      split_2: '✂️',
      pierce_1: '🗡️',
      pierce_2: '🗡️',
      multicast_1: '🔁',
      multicast_2: '🔁',
      range_up_1: '📏',
      range_up_2: '📏',
      damage_up_1: '💪',
      damage_up_2: '💪',
      cooldown_down_1: '⏩',
      cooldown_down_2: '⏩',
      projectile_count_1: '🎯',
      projectile_count_2: '🎯',
      burn_add: '🔥',
      freeze_add: '❄️',
      chain_add: '⚡',
      poison_add: '☠️',
    };
    return icons[enhancer.id] || '💎';
  }

  /**
   * 获取稀有度文本
   */
  private getRarityText(rarity: string): string {
    const texts: Record<string, string> = {
      common: '普通',
      rare: '稀有',
      epic: '史诗',
      legendary: '传说',
      mythic: '神话',
    };
    return texts[rarity] || '';
  }

  /**
   * 选择选项
   */
  private selectOption(option: UpgradeOption): void {
    const player = (this.scene as any).player;

    if (option.type === 'new_skill') {
      const skill = option.data as Skill;
      player.skills.push(skill);
      player.skillCooldowns.set(skill.id, 0);
    } else if (option.type === 'skill_enhancer') {
      const enhancer = option.data as SkillEnhancer & { skillId?: string };
      this.enhancementSystem.applyEnhancer(enhancer, enhancer.skillId);
    } else if (option.type === 'stat_boost') {
      const boost = option.data as StatBoost;
      this.enhancementSystem.applyStatBoost(boost);
    }

    this.hide();
    this.onSelectCallback();
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
