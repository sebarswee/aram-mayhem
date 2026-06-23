import Phaser from 'phaser';
import { Rune } from '@/types';
import { RuneSystem } from '@/systems/RuneSystem';
import { getRandomRunes } from '@/data/runes';

// 稀有度颜色
const RARITY_COLORS: Record<string, number> = {
  common: 0xffffff,
  rare: 0x00ff00,
  epic: 0x0088ff,
  legendary: 0xaa00ff,
  mythic: 0xffaa00,
};

export class RuneSelectUI {
  private scene: Phaser.Scene;
  private runeSystem: RuneSystem;
  private container: Phaser.GameObjects.Container;
  private onSelect: () => void;

  constructor(
    scene: Phaser.Scene,
    runeSystem: RuneSystem,
    onSelect: () => void
  ) {
    this.scene = scene;
    this.runeSystem = runeSystem;
    this.onSelect = onSelect;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(200);
    this.container.setVisible(false);
  }

  show(): void {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    this.container.setVisible(true);
    this.container.removeAll(true);

    // 半透明背景
    const bg = this.scene.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0.7
    );
    this.container.add(bg);

    // 标题
    const titleFontSize = Math.min(32, width / 20);
    const title = this.scene.add.text(
      width / 2,
      height * 0.1,
      '选择符文',
      { fontSize: `${titleFontSize}px`, color: '#ffcc00', fontStyle: 'bold' }
    );
    title.setOrigin(0.5);
    this.container.add(title);

    // 获取已获得符文ID
    const acquiredIds = this.runeSystem.getAcquiredRunes().map((r) => r.id);

    // 随机3个符文
    const runes = getRandomRunes(3, acquiredIds);

    // 创建符文卡片 - 响应式尺寸
    const cardWidth = Math.min(200, width * 0.25);
    const cardHeight = Math.min(300, height * 0.5);
    const cardGap = Math.min(40, width * 0.05);
    const totalWidth = cardWidth * 3 + cardGap * 2;
    const startX = (width - totalWidth) / 2 + cardWidth / 2;
    const cardY = height / 2;

    runes.forEach((rune, index) => {
      const cardX = startX + index * (cardWidth + cardGap);
      this.createRuneCard(rune, cardX, cardY, cardWidth, cardHeight, width);
    });
  }

  private createRuneCard(
    rune: Rune,
    x: number,
    y: number,
    cardWidth: number,
    cardHeight: number,
    screenWidth: number
  ): void {
    const color = RARITY_COLORS[rune.rarity] || 0xffffff;

    // 卡片背景
    const card = this.scene.add.rectangle(x, y, cardWidth, cardHeight, 0x222222, 1);
    card.setStrokeStyle(3, color);
    this.container.add(card);

    // 稀有度标签
    const rarityFontSize = Math.min(14, screenWidth / 50);
    const rarityText = this.scene.add.text(
      x,
      y - cardHeight / 2 + 30,
      this.getRarityLabel(rune.rarity),
      { fontSize: `${rarityFontSize}px`, color: `#${color.toString(16).padStart(6, '0')}` }
    );
    rarityText.setOrigin(0.5);
    this.container.add(rarityText);

    // 符文名称
    const nameFontSize = Math.min(20, screenWidth / 35);
    const nameText = this.scene.add.text(x, y - 50, rune.name, {
      fontSize: `${nameFontSize}px`,
      color: '#ffffff',
      fontStyle: 'bold',
    });
    nameText.setOrigin(0.5);
    this.container.add(nameText);

    // 符文描述
    const descFontSize = Math.min(14, screenWidth / 50);
    const descText = this.scene.add.text(x, y + 20, rune.description, {
      fontSize: `${descFontSize}px`,
      color: '#aaaaaa',
      wordWrap: { width: cardWidth - 20 },
      align: 'center',
    });
    descText.setOrigin(0.5, 0);
    this.container.add(descText);

    // 当前等级(如果已获得)
    const existingLevel = this.runeSystem.getRuneLevel(rune.id);
    if (existingLevel > 0) {
      const levelFontSize = Math.min(12, screenWidth / 60);
      const levelText = this.scene.add.text(
        x,
        y + 80,
        `当前: Lv.${existingLevel} → Lv.${existingLevel + 1}`,
        { fontSize: `${levelFontSize}px`, color: '#00ff00' }
      );
      levelText.setOrigin(0.5);
      this.container.add(levelText);
    }

    // 点击选择
    card.setInteractive({ useHandCursor: true });
    card.on('pointerover', () => {
      card.setFillStyle(0x333333);
    });
    card.on('pointerout', () => {
      card.setFillStyle(0x222222);
    });
    card.on('pointerdown', () => {
      this.selectRune(rune);
    });
  }

  private getRarityLabel(rarity: string): string {
    const labels: Record<string, string> = {
      common: '普通',
      rare: '稀有',
      epic: '史诗',
      legendary: '传说',
      mythic: '神话',
    };
    return labels[rarity] || '普通';
  }

  private selectRune(rune: Rune): void {
    const success = this.runeSystem.acquire(rune);

    if (success) {
      this.hide();
      this.onSelect();
    }
  }

  hide(): void {
    this.container.setVisible(false);
    this.container.removeAll(true);
  }

  destroy(): void {
    this.container.destroy();
  }
}
