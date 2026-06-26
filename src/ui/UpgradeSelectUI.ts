import Phaser from 'phaser';
import { Skill, SkillEnhancer, StatBoost, UpgradeOption, SkillUpgradeData, SkillUpgradeOption as SkillUpgradeOptionType, SkillEvolutionBranch } from '@/types';
import { EnhancementSystem } from '@/systems/EnhancementSystem';
import { SkillUpgradeSystem } from '@/systems/SkillUpgradeSystem';
import { getRandomSkill, cloneSkill, getRandomPassiveSkill } from '@/data/skills';
import { getElementColor, ELEMENT_NAMES } from '@/data/elements';

/**
 * 升级选择界面 - 增强版
 * 支持四种选项：新技能、技能升级、技能强化石、属性提升
 *
 * 增强功能：
 * - 卡片入场动画（错开飞入）
 * - 光晕扩散效果
 * - 稀有度边框脉动
 * - 选中闪光冲击波
 * - 动态元素背景
 */
export class UpgradeSelectUI {
  private scene: Phaser.Scene;
  private enhancementSystem: EnhancementSystem;
  private skillUpgradeSystem: SkillUpgradeSystem;
  private container: Phaser.GameObjects.Container;
  private options: UpgradeOption[] = [];
  private onSelectCallback: () => void;

  constructor(
    scene: Phaser.Scene,
    enhancementSystem: EnhancementSystem,
    skillUpgradeSystem: SkillUpgradeSystem,
    onSelect: () => void
  ) {
    this.scene = scene;
    this.enhancementSystem = enhancementSystem;
    this.skillUpgradeSystem = skillUpgradeSystem;
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

    // scrollFactor(0) 固定在屏幕上，容器位置设为 (0,0)
    // 容器内元素使用屏幕坐标定位
    this.container.setPosition(0, 0);
    this.container.setScrollFactor(0);

    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    // 半透明背景 - 带模糊效果
    const bg = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.9);
    bg.setOrigin(0, 0);
    this.container.add(bg);

    // 背景粒子效果
    this.createBackgroundParticles(width, height);

    // 标题 - 响应式字体
    const titleFontSize = Math.min(36, width / 16);
    const title = this.scene.add.text(width / 2, height * 0.06, '升级！', {
      fontSize: `${titleFontSize}px`,
      color: '#ffcc00',
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
      duration: 300,
      ease: 'Power2',
    });

    // 副标题
    const subtitleFontSize = Math.min(16, width / 35);
    const subtitle = this.scene.add.text(width / 2, height * 0.14, '选择一项强化', {
      fontSize: `${subtitleFontSize}px`,
      color: '#aaaaaa',
    });
    subtitle.setOrigin(0.5);
    subtitle.setAlpha(0);
    this.container.add(subtitle);

    this.scene.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 300,
      delay: 100,
    });

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
   * 创建背景粒子效果
   */
  private createBackgroundParticles(width: number, height: number): void {
    // 创建漂浮的光点
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 3 + 1;
      const alpha = Math.random() * 0.3 + 0.1;

      const particle = this.scene.add.circle(x, y, size, 0xffffff, alpha);
      this.container.add(particle);

      // 漂浮动画
      this.scene.tweens.add({
        targets: particle,
        y: particle.y - 50 - Math.random() * 50,
        alpha: 0,
        duration: 2000 + Math.random() * 1000,
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
   * 生成升级选项
   */
  private generateOptions(): UpgradeOption[] {
    const options: UpgradeOption[] = [];
    const player = (this.scene as any).player;

    // 选项1：技能升级（优先级最高）
    const upgradableSkills = this.skillUpgradeSystem.getUpgradableSkills(player.skills);
    if (upgradableSkills.length > 0) {
      // 随机选一个可升级技能
      const skill = upgradableSkills[Math.floor(Math.random() * upgradableSkills.length)];
      const upgradeOptions = this.skillUpgradeSystem.getUpgradeOptions(skill);
      if (upgradeOptions) {
        options.push({
          type: 'skill_upgrade',
          data: {
            skillId: skill.id,
            skillName: skill.name,
            currentLevel: skill.level,
            options: upgradeOptions,
          } as SkillUpgradeData,
        });
      }
    }

    // 选项2：新技能（如果基础技能槽位未满）
    if (player.canLearnBasicSkill()) {
      const currentSkills = player.getAllSkills();
      const existingIds = currentSkills.map((s: Skill) => s.id);
      const newSkill = getRandomSkill(existingIds);
      if (newSkill) {
        options.push({ type: 'new_skill', data: cloneSkill(newSkill) });
      }
    }

    // 选项3：技能强化石
    const enhancerOptions = this.enhancementSystem.getApplicableEnhancersForPlayer();
    if (enhancerOptions.length > 0) {
      // 随机选一个
      const randomChoice = enhancerOptions[Math.floor(Math.random() * enhancerOptions.length)];
      options.push({
        type: 'skill_enhancer',
        data: { ...randomChoice.enhancer, skillId: randomChoice.skillId } as any,
      });
    }

    // 选项4：属性提升
    const statBoost = this.enhancementSystem.getAvailableStatBoosts()[
      Math.floor(Math.random() * this.enhancementSystem.getAvailableStatBoosts().length)
    ];
    if (statBoost) {
      options.push({ type: 'stat_boost', data: statBoost });
    }

    // 选项5：被动技能（30%概率出现）
    if (Math.random() < 0.3) {
      const existingPassiveIds = player.passiveSkills.map((s: Skill) => s.id);
      const passiveSkill = getRandomPassiveSkill(existingPassiveIds);
      if (passiveSkill) {
        options.push({ type: 'passive_skill', data: cloneSkill(passiveSkill) });
      }
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
   * 创建选项卡片 - 增强版
   */
  private createOptionCard(
    option: UpgradeOption,
    index: number,
    x: number,
    y: number,
    width: number,
    height: number,
    isSmallScreen: boolean
  ): void {
    const card = this.scene.add.container(x, y);
    card.setScrollFactor(0); // 固定在屏幕上
    card.setSize(width, height); // 设置容器大小用于交互
    card.setInteractive({ useHandCursor: true });
    card.setAlpha(0);
    card.setY(y - 100); // 初始位置在屏幕上方

    // 稀有度颜色
    let color = 0xffffff;
    let rarityText = '';
    let title = '';
    let description = '';
    let icon = '⭐';
    let elementInfo = '';
    let glowColor = 0xffffff;

    if (option.type === 'new_skill') {
      const skill = option.data as Skill;
      // 使用统一的元素颜色
      color = getElementColor(skill.elements[0]);
      glowColor = color;
      title = skill.name;
      description = skill.description;
      icon = this.getSkillIcon(skill);
      rarityText = '新技能';
      // 显示元素信息
      elementInfo = skill.elements.map(e => ELEMENT_NAMES[e]).join('·');
    } else if (option.type === 'skill_upgrade') {
      const upgradeData = option.data as SkillUpgradeData;
      color = 0xffcc00;  // 金色
      glowColor = 0xffcc00;
      title = `${upgradeData.skillName} Lv.${upgradeData.currentLevel}→${upgradeData.currentLevel + 1}`;
      const optionCount = upgradeData.options.length === 3 ? '进化选择' : '技能升级';
      description = optionCount;
      icon = '⬆️';
      rarityText = '技能升级';
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
      glowColor = color;
      title = enhancer.name;
      description = enhancer.description;
      icon = this.getEnhancerIcon(enhancer);
      rarityText = this.getRarityText(enhancer.rarity);
      // 显示元素限制信息
      if (enhancer.skillElements && enhancer.skillElements.length > 0) {
        elementInfo = '限定: ' + enhancer.skillElements.map(e => ELEMENT_NAMES[e]).join('·');
      } else if (enhancer.excludeElements && enhancer.excludeElements.length > 0) {
        elementInfo = '排除: ' + enhancer.excludeElements.map(e => ELEMENT_NAMES[e]).join('·');
      }
    } else if (option.type === 'stat_boost') {
      const boost = option.data as StatBoost;
      title = boost.name;
      description = boost.description;
      icon = '📈';
      rarityText = '属性';
      glowColor = 0x44ff44;
    } else if (option.type === 'passive_skill') {
      const passive = option.data as Skill;
      color = getElementColor(passive.elements[0]);
      glowColor = color;
      title = passive.name;
      description = passive.description;
      icon = '🔮';
      rarityText = '被动技能';
      elementInfo = passive.elements.map(e => ELEMENT_NAMES[e]).join('·');
    }

    // 动态背景光晕
    const bgGlow = this.scene.add.graphics();
    bgGlow.fillStyle(glowColor, 0.15);
    bgGlow.fillRoundedRect(-width / 2 - 5, -height / 2 - 5, width + 10, height + 10, 12);
    card.add(bgGlow);

    // 卡片背景
    const bg = this.scene.add.rectangle(0, 0, width, height, 0x1a1a2e, 1);
    bg.setStrokeStyle(3, color, 1);
    card.add(bg);

    // 内部渐变效果
    const innerGlow = this.scene.add.graphics();
    innerGlow.fillStyle(glowColor, 0.05);
    innerGlow.fillRoundedRect(-width / 2 + 5, -height / 2 + 5, width - 10, height - 10, 8);
    card.add(innerGlow);

    // 响应式字体大小
    const rarityFontSize = Math.min(11, width / 14);
    const iconFontSize = Math.min(40, width / 4);
    const titleFontSize = Math.min(16, width / 10);
    const descFontSize = Math.min(11, width / 14);
    const elementFontSize = Math.min(10, width / 16);

    // 稀有度标签 - 带背景
    const rarityBg = this.scene.add.rectangle(0, -height / 2 + 15, width * 0.6, 18, color, 0.3);
    rarityBg.setStrokeStyle(1, color, 0.5);
    card.add(rarityBg);

    const rarityLabel = this.scene.add.text(0, -height / 2 + 15, rarityText, {
      fontSize: `${rarityFontSize}px`,
      color: `#${color.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    });
    rarityLabel.setOrigin(0.5);
    card.add(rarityLabel);

    // 图标 - 带光晕
    const iconGlow = this.scene.add.circle(0, isSmallScreen ? -height / 2 + 40 : -20, 25, glowColor, 0.2);
    card.add(iconGlow);

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

    // 元素信息（如果有）
    let yOffset = isSmallScreen ? -height / 2 + 90 : 50;
    if (elementInfo) {
      const elementText = this.scene.add.text(0, yOffset, elementInfo, {
        fontSize: `${elementFontSize}px`,
        color: `#${color.toString(16).padStart(6, '0')}`,
      });
      elementText.setOrigin(0.5);
      card.add(elementText);
      yOffset += 15;
    }

    // 描述 - 截断长文本
    const descMaxWidth = width - 15;
    const descText = this.truncateText(description, descMaxWidth, descFontSize, isSmallScreen ? 2 : 3);
    const desc = this.scene.add.text(0, yOffset, descText, {
      fontSize: `${descFontSize}px`,
      color: '#cccccc',
      wordWrap: { width: descMaxWidth },
      align: 'center',
      lineSpacing: 2,
    });
    desc.setOrigin(0.5, 0);
    card.add(desc);

    // 边框脉动效果
    this.scene.tweens.add({
      targets: bg,
      strokeColor: this.lightenColor(color, 0.2),
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // 入场动画 - 错开飞入
    this.scene.tweens.add({
      targets: card,
      y: y,
      alpha: 1,
      duration: 400,
      delay: index * 100,
      ease: 'Back.out',
    });

    // 交互事件绑定到容器
    card.on('pointerover', () => {
      // 光晕扩散效果
      this.scene.tweens.add({
        targets: bgGlow,
        scaleX: 1.1,
        scaleY: 1.1,
        alpha: 0.4,
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
        targets: bgGlow,
        scaleX: 1,
        scaleY: 1,
        alpha: 0.15,
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
      this.selectOption(option, card, width, height);
    });

    this.container.add(card);
  }

  /**
   * 选择选项 - 带特效
   */
  private selectOption(option: UpgradeOption, card: Phaser.GameObjects.Container, width: number, height: number): void {
    // 创建冲击波效果
    const shockwave = this.scene.add.graphics();
    shockwave.lineStyle(4, 0xffffff, 1);
    shockwave.strokeCircle(0, 0, 10);
    shockwave.setPosition(card.x, card.y);
    shockwave.setScrollFactor(0);
    shockwave.setDepth(999);
    this.container.add(shockwave);

    // 冲击波扩散
    this.scene.tweens.add({
      targets: shockwave,
      scale: 5,
      alpha: 0,
      duration: 400,
      onComplete: () => shockwave.destroy(),
    });

    // 选中卡片闪光
    this.scene.tweens.add({
      targets: card,
      scale: 1.1,
      duration: 100,
      yoyo: true,
      onComplete: () => {
        this.applyOption(option);
      },
    });
  }

  /**
   * 应用选择
   */
  private applyOption(option: UpgradeOption): void {
    const player = (this.scene as any).player;

    if (option.type === 'new_skill') {
      const skill = option.data as Skill;

      // Check skill type and available slots
      if (skill.type === 'ultimate') {
        if (!player.canLearnUltimateSkill()) {
          console.warn('[UpgradeSelectUI] Ultimate skill slots full');
          return;
        }
        player.addUltimateSkill(skill);
      } else {
        if (!player.canLearnBasicSkill()) {
          console.warn('[UpgradeSelectUI] Basic skill slots full');
          return;
        }
        player.addBasicSkill(skill);
      }
    } else if (option.type === 'skill_upgrade') {
      // 显示技能升级选择界面
      const upgradeData = option.data as SkillUpgradeData;
      this.showSkillUpgradeSelection(upgradeData);
      return; // 不关闭主界面，等待子选择完成
    } else if (option.type === 'skill_enhancer') {
      const enhancer = option.data as SkillEnhancer & { skillId?: string };
      this.enhancementSystem.applyEnhancer(enhancer, enhancer.skillId);
    } else if (option.type === 'stat_boost') {
      const boost = option.data as StatBoost;
      this.enhancementSystem.applyStatBoost(boost);
    } else if (option.type === 'passive_skill') {
      const passive = option.data as Skill;
      player.addPassiveSkill(passive);
    }

    this.hide();
    this.onSelectCallback();
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
      flame_wave: '🌊',
      flame_shield: '🛡️',
      ignite: '🔥',
      water_bullet: '💧',
      tidal_wave: '🌊',
      water_dash: '💨',
      purify: '✨',
      ice_shard: '❄️',
      frost_nova: '💠',
      ice_wall: '🧊',
      frost_armor: '🛡️',
      lightning_bolt: '⚡',
      thunder_storm: '⛈️',
      static_field: '⚡',
      arc_lightning: '⚡',
      holy_light: '✨',
      divine_shield: '🛡️',
      halo: '💫',
      blessing: '🙏',
      shadow_bolt: '🌑',
      curse_aura: '☠️',
      shadow_step: '👤',
      hex: '💀',
      vine_whip: '🌿',
      poison_cloud: '☠️',
      seed_bomb: '🌰',
      thorns: '🌵',
      rock_spike: '⛰️',
      sandstorm: '🌪️',
      stone_skin: '🛡️',
      seismic_wave: '💨',
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
      frost_add: '❄️',
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
   * 颜色变亮
   */
  private lightenColor(color: number, amount: number): number {
    const r = Math.min(255, Math.floor(((color >> 16) & 0xff) * (1 + amount)));
    const g = Math.min(255, Math.floor(((color >> 8) & 0xff) * (1 + amount)));
    const b = Math.min(255, Math.floor((color & 0xff) * (1 + amount)));
    return (r << 16) | (g << 8) | b;
  }

  /**
   * 显示技能升级选择界面（二选一或三选一）- 增强版
   */
  private showSkillUpgradeSelection(upgradeData: SkillUpgradeData): void {
    const player = (this.scene as any).player;
    const skill = player.skills.find((s: Skill) => s.id === upgradeData.skillId);
    if (!skill) return;

    // 清空当前容器
    this.container.removeAll(true);

    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    // 半透明背景
    const bg = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.92);
    bg.setOrigin(0, 0);
    this.container.add(bg);

    // 背景粒子
    this.createBackgroundParticles(width, height);

    // 标题
    const titleFontSize = Math.min(28, width / 20);
    const title = this.scene.add.text(
      width / 2,
      height * 0.1,
      `${skill.name} Lv.${upgradeData.currentLevel} → Lv.${upgradeData.currentLevel + 1}`,
      {
        fontSize: `${titleFontSize}px`,
        color: '#ffcc00',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      }
    );
    title.setOrigin(0.5);
    title.setAlpha(0);
    this.container.add(title);

    this.scene.tweens.add({
      targets: title,
      alpha: 1,
      y: height * 0.12,
      duration: 300,
    });

    // 子标题
    const isEvolution = upgradeData.options.length === 3;
    const subtitle = this.scene.add.text(
      width / 2,
      height * 0.18,
      isEvolution ? '选择进化分支' : '选择强化方向',
      {
        fontSize: '16px',
        color: '#aaaaaa',
      }
    );
    subtitle.setOrigin(0.5);
    subtitle.setAlpha(0);
    this.container.add(subtitle);

    this.scene.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 300,
      delay: 100,
    });

    // 选项卡片
    const cardWidth = Math.min(150, (width - 60) / upgradeData.options.length);
    const cardHeight = isEvolution ? 200 : 150;
    const startX = width / 2 - ((upgradeData.options.length - 1) * (cardWidth + 20)) / 2;
    const cardY = height / 2;

    upgradeData.options.forEach((opt, index) => {
      const cardX = startX + index * (cardWidth + 20);
      this.createUpgradeOptionCard(opt, cardX, cardY, cardWidth, cardHeight, isEvolution, skill, index);
    });
  }

  /**
   * 创建升级选项卡片 - 增强版
   */
  private createUpgradeOptionCard(
    option: SkillUpgradeOptionType | SkillEvolutionBranch,
    x: number,
    y: number,
    width: number,
    height: number,
    isEvolution: boolean,
    skill: Skill,
    index: number
  ): void {
    const card = this.scene.add.container(x, y);
    card.setScrollFactor(0);
    card.setSize(width, height);
    card.setInteractive({ useHandCursor: true });
    card.setAlpha(0);
    card.setY(y - 80);

    // 稀有度颜色
    let borderColor = 0xffffff;
    let glowColor = 0xffffff;
    if (isEvolution && 'rarity' in option) {
      const rarityColors: Record<string, number> = {
        epic: 0x0088ff,
        legendary: 0xaa00ff,
        mythic: 0xffaa00,
      };
      borderColor = rarityColors[option.rarity] || 0xffffff;
      glowColor = borderColor;
    }

    // 背景光晕
    const bgGlow = this.scene.add.graphics();
    bgGlow.fillStyle(glowColor, 0.15);
    bgGlow.fillRoundedRect(-width / 2 - 5, -height / 2 - 5, width + 10, height + 10, 10);
    card.add(bgGlow);

    // 卡片背景
    const bg = this.scene.add.rectangle(0, 0, width, height, 0x1a1a2e, 1);
    bg.setStrokeStyle(3, borderColor, 1);
    card.add(bg);

    // 名称
    const nameFontSize = Math.min(14, width / 10);
    const nameText = this.scene.add.text(0, -height / 2 + 25, option.name, {
      fontSize: `${nameFontSize}px`,
      color: '#ffffff',
      fontStyle: 'bold',
    });
    nameText.setOrigin(0.5);
    card.add(nameText);

    // 稀有度标签（进化）
    if (isEvolution && 'rarity' in option) {
      const rarityText = this.scene.add.text(0, -height / 2 + 45, this.getRarityText(option.rarity), {
        fontSize: '11px',
        color: `#${borderColor.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      });
      rarityText.setOrigin(0.5);
      card.add(rarityText);
    }

    // 描述
    const descFontSize = Math.min(11, width / 14);
    const descText = this.scene.add.text(0, 10, option.description, {
      fontSize: `${descFontSize}px`,
      color: '#cccccc',
      wordWrap: { width: width - 20 },
      align: 'center',
    });
    descText.setOrigin(0.5);
    card.add(descText);

    // 入场动画
    this.scene.tweens.add({
      targets: card,
      y: y,
      alpha: 1,
      duration: 350,
      delay: index * 80,
      ease: 'Back.out',
    });

    // 交互
    card.on('pointerover', () => {
      this.scene.tweens.add({
        targets: bgGlow,
        scaleX: 1.1,
        scaleY: 1.1,
        alpha: 0.4,
        duration: 200,
      });

      bg.setStrokeStyle(4, 0xffffff, 1);
      bg.setFillStyle(0x2a2a4e, 1);
    });

    card.on('pointerout', () => {
      this.scene.tweens.add({
        targets: bgGlow,
        scaleX: 1,
        scaleY: 1,
        alpha: 0.15,
        duration: 200,
      });

      bg.setStrokeStyle(3, borderColor, 1);
      bg.setFillStyle(0x1a1a2e, 1);
    });

    card.on('pointerdown', () => {
      // 冲击波
      const shockwave = this.scene.add.graphics();
      shockwave.lineStyle(3, glowColor, 1);
      shockwave.strokeCircle(0, 0, 10);
      shockwave.setPosition(x, y);
      shockwave.setScrollFactor(0);
      shockwave.setDepth(999);
      this.container.add(shockwave);

      this.scene.tweens.add({
        targets: shockwave,
        scale: 4,
        alpha: 0,
        duration: 350,
        onComplete: () => shockwave.destroy(),
      });

      this.applySkillUpgrade(skill, option);
    });

    this.container.add(card);
  }

  /**
   * 应用技能升级
   */
  private applySkillUpgrade(skill: Skill, option: SkillUpgradeOptionType | SkillEvolutionBranch): void {
    // 使用 SkillUpgradeSystem 应用升级
    this.skillUpgradeSystem.applyUpgrade(skill, option.id);

    // 关闭界面
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
