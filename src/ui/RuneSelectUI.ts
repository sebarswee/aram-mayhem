import Phaser from 'phaser';
import { Rune } from '@/types';
import { RuneSystem } from '@/systems/RuneSystem';
import { getRandomRunes } from '@/data/runes';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/game.config';

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
    this.container.setVisible(true);
    this.container.removeAll(true);

    // 半透明背景
    const bg = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.7
    );
    this.container.add(bg);

    // 标题
    const title = this.scene.add.text(
      GAME_WIDTH / 2,
      100,
      '选择符文',
      { fontSize: '32px', color: '#ffcc00', fontStyle: 'bold' }
    );
    title.setOrigin(0.5);
    this.container.add(title);

    // 获取已获得符文ID
    const acquiredIds = this.runeSystem.getAcquiredRunes().map((r) => r.id);

    // 随机3个符文
    const runes = getRandomRunes(3, acquiredIds);

    // 创建符文卡片
    const cardWidth = 200;
    const cardHeight = 300;
    const startX = GAME_WIDTH / 2 - (cardWidth * 1.5 + 40);
    const cardY = GAME_HEIGHT / 2;

    runes.forEach((rune, index) => {
      const cardX = startX + index * (cardWidth + 40);
      this.createRuneCard(rune, cardX, cardY, cardWidth, cardHeight);
    });
  }

  private createRuneCard(
    rune: Rune,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    const color = RARITY_COLORS[rune.rarity] || 0xffffff;

    // 卡片背景
    const card = this.scene.add.rectangle(x, y, width, height, 0x222222, 1);
    card.setStrokeStyle(3, color);
    this.container.add(card);

    // 稀有度标签
    const rarityText = this.scene.add.text(
      x,
      y - height / 2 + 30,
      this.getRarityLabel(rune.rarity),
      { fontSize: '14px', color: `#${color.toString(16).padStart(6, '0')}` }
    );
    rarityText.setOrigin(0.5);
    this.container.add(rarityText);

    // 符文名称
    const nameText = this.scene.add.text(x, y - 50, rune.name, {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    nameText.setOrigin(0.5);
    this.container.add(nameText);

    // 符文描述
    const descText = this.scene.add.text(x, y + 20, rune.description, {
      fontSize: '14px',
      color: '#aaaaaa',
      wordWrap: { width: width - 20 },
      align: 'center',
    });
    descText.setOrigin(0.5, 0);
    this.container.add(descText);

    // 当前等级(如果已获得)
    const existingLevel = this.runeSystem.getRuneLevel(rune.id);
    if (existingLevel > 0) {
      const levelText = this.scene.add.text(
        x,
        y + 80,
        `当前: Lv.${existingLevel} → Lv.${existingLevel + 1}`,
        { fontSize: '12px', color: '#00ff00' }
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
