import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { GameState, Skill } from '@/types';
import { ExpSystem } from '@/systems/ExpSystem';
import { GAME_WIDTH } from '@/config/game.config';

interface SkillUI {
  container: Phaser.GameObjects.Container;
  icon: Phaser.GameObjects.Image;
  cooldownOverlay: Phaser.GameObjects.Graphics;
  cooldownText: Phaser.GameObjects.Text;
  nameText: Phaser.GameObjects.Text;
  skill: Skill;
}

export class HUD {
  private scene: Phaser.Scene;
  private player: Player;
  private gameState: GameState;
  private expSystem: ExpSystem;

  // UI元素
  private hpBar!: Phaser.GameObjects.Graphics;
  private hpText!: Phaser.GameObjects.Text;
  private expBar!: Phaser.GameObjects.Graphics;
  private levelText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private killsText!: Phaser.GameObjects.Text;

  // 技能UI
  private skillUIs: SkillUI[] = [];

  constructor(
    scene: Phaser.Scene,
    player: Player,
    gameState: GameState,
    expSystem: ExpSystem
  ) {
    this.scene = scene;
    this.player = player;
    this.gameState = gameState;
    this.expSystem = expSystem;

    this.createUI();
  }

  private createUI(): void {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const padding = Math.min(20, width * 0.03);
    const barWidth = Math.min(200, width * 0.3);
    const barHeight = Math.min(20, height * 0.03);

    // HP条背景
    this.hpBar = this.scene.add.graphics();
    this.hpBar.setScrollFactor(0);
    this.hpBar.setDepth(100);

    // HP文字
    const fontSize = Math.min(14, width / 50);
    this.hpText = this.scene.add.text(
      padding + barWidth / 2,
      padding + barHeight / 2,
      '',
      { fontSize: `${fontSize}px`, color: '#ffffff' }
    );
    this.hpText.setOrigin(0.5, 0.5);
    this.hpText.setScrollFactor(0);
    this.hpText.setDepth(101);

    // 经验条背景
    this.expBar = this.scene.add.graphics();
    this.expBar.setScrollFactor(0);
    this.expBar.setDepth(100);

    // 等级文字
    const levelFontSize = Math.min(18, width / 35);
    this.levelText = this.scene.add.text(
      padding,
      padding + barHeight + 10,
      'Lv.1',
      { fontSize: `${levelFontSize}px`, color: '#ffcc00', fontStyle: 'bold' }
    );
    this.levelText.setScrollFactor(0);
    this.levelText.setDepth(101);

    // 波次文字
    const infoFontSize = Math.min(20, width / 30);
    this.waveText = this.scene.add.text(
      width - padding,
      padding,
      '波次: 1',
      { fontSize: `${infoFontSize}px`, color: '#ffffff' }
    );
    this.waveText.setOrigin(1, 0);
    this.waveText.setScrollFactor(0);
    this.waveText.setDepth(101);

    // 击杀数文字
    const killsFontSize = Math.min(16, width / 40);
    this.killsText = this.scene.add.text(
      width - padding,
      padding + infoFontSize + 10,
      '击杀: 0',
      { fontSize: `${killsFontSize}px`, color: '#ff4444' }
    );
    this.killsText.setOrigin(1, 0);
    this.killsText.setScrollFactor(0);
    this.killsText.setDepth(101);

    // 创建技能显示
    this.createSkillUI(width, height);
  }

  /**
   * 创建技能UI显示
   */
  private createSkillUI(width: number, height: number): void {
    const skills = this.player.skills;
    if (!skills || skills.length === 0) return;

    const iconSize = Math.min(48, width * 0.1);
    const spacing = Math.min(10, width * 0.02);
    const startX = width / 2 - ((skills.length - 1) * (iconSize + spacing)) / 2;
    const y = height - iconSize - 20;

    skills.forEach((skill, index) => {
      const x = startX + index * (iconSize + spacing);
      const isUltimate = skill.type === 'ultimate';

      // 创建容器
      const container = this.scene.add.container(x, y);
      container.setScrollFactor(0);
      container.setDepth(100);

      // 技能图标背景
      const bg = this.scene.add.graphics();
      bg.fillStyle(0x222233, 1);
      bg.fillRoundedRect(-iconSize / 2, -iconSize / 2, iconSize, iconSize, 6);

      // 大招金色边框
      if (isUltimate) {
        bg.lineStyle(3, 0xffcc00, 1);
      } else {
        bg.lineStyle(2, this.getSkillColor(skill), 0.8);
      }
      bg.strokeRoundedRect(-iconSize / 2, -iconSize / 2, iconSize, iconSize, 6);
      container.add(bg);

      // 技能图标
      const iconKey = `skill_${skill.id}`;
      const icon = this.scene.add.image(0, 0, iconKey);
      icon.setDisplaySize(iconSize - 8, iconSize - 8);
      container.add(icon);

      // 冷却遮罩
      const cooldownOverlay = this.scene.add.graphics();
      cooldownOverlay.fillStyle(0x000000, 0.7);
      container.add(cooldownOverlay);

      // 冷却文字
      const cooldownText = this.scene.add.text(0, 0, '', {
        fontSize: `${Math.min(16, iconSize * 0.35)}px`,
        color: '#ffffff',
        fontStyle: 'bold',
      });
      cooldownText.setOrigin(0.5, 0.5);
      cooldownText.setDepth(101);
      container.add(cooldownText);

      // 技能名称（显示在图标上方）
      const nameText = this.scene.add.text(0, -iconSize / 2 - 12, skill.name, {
        fontSize: `${Math.min(12, width / 50)}px`,
        color: isUltimate ? '#ffcc00' : '#ffffff',
      });
      nameText.setOrigin(0.5, 0.5);
      nameText.setScrollFactor(0);
      nameText.setDepth(101);
      nameText.setVisible(false); // 默认隐藏，悬停时显示
      container.add(nameText);

      // 交互区域
      const hitArea = this.scene.add.rectangle(0, 0, iconSize, iconSize, 0x000000, 0);
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.setScrollFactor(0);
      hitArea.setDepth(102);

      // 悬停显示技能名称
      hitArea.on('pointerover', () => {
        nameText.setVisible(true);
        container.setScale(1.1);
      });
      hitArea.on('pointerout', () => {
        nameText.setVisible(false);
        container.setScale(1);
      });
      container.add(hitArea);

      this.skillUIs.push({
        container,
        icon,
        cooldownOverlay,
        cooldownText,
        nameText,
        skill,
      });
    });
  }

  /**
   * 获取技能对应颜色
   */
  private getSkillColor(skill: Skill): number {
    const colors: Record<string, number> = {
      fire: 0xff4400,
      ice: 0x44ccff,
      lightning: 0xffff00,
      shadow: 0x8800ff,
      holy: 0xffcc00,
      physical: 0xffffff,
    };
    return colors[skill.elements[0]] || 0xffffff;
  }

  update(): void {
    this.updateHpBar();
    this.updateExpBar();
    this.updateTexts();
    this.updateSkillCooldowns();
  }

  /**
   * 更新技能冷却显示
   */
  private updateSkillCooldowns(): void {
    const iconSize = Math.min(48, this.scene.scale.width * 0.1);

    this.skillUIs.forEach((skillUI) => {
      const cooldown = this.player.skillCooldowns.get(skillUI.skill.id) || 0;
      const maxCooldown = skillUI.skill.cooldown;
      const cooldownPercent = cooldown / maxCooldown;

      // 更新冷却遮罩
      skillUI.cooldownOverlay.clear();
      if (cooldownPercent > 0) {
        // 绘制扇形冷却遮罩
        skillUI.cooldownOverlay.fillStyle(0x000000, 0.7);
        skillUI.cooldownOverlay.slice(
          0,
          0,
          iconSize / 2,
          Phaser.Math.DegToRad(-90),
          Phaser.Math.DegToRad(-90 + 360 * cooldownPercent),
          true
        );
        skillUI.cooldownOverlay.fillPath();

        // 显示冷却秒数
        const seconds = Math.ceil(cooldown / 1000);
        skillUI.cooldownText.setText(`${seconds}`);
        skillUI.cooldownText.setVisible(true);
      } else {
        skillUI.cooldownText.setVisible(false);
      }
    });
  }

  private updateHpBar(): void {
    const width = this.scene.scale.width;
    const padding = Math.min(20, width * 0.03);
    const barWidth = Math.min(200, width * 0.3);
    const barHeight = Math.min(20, this.scene.scale.height * 0.03);
    const hpPercent = this.player.stats.currentHp / this.player.stats.maxHp;

    this.hpBar.clear();

    // 背景
    this.hpBar.fillStyle(0x333333, 1);
    this.hpBar.fillRect(padding, padding, barWidth, barHeight);

    // HP条
    this.hpBar.fillStyle(0xff0000, 1);
    this.hpBar.fillRect(padding, padding, barWidth * hpPercent, barHeight);

    // 边框
    this.hpBar.lineStyle(2, 0xffffff, 1);
    this.hpBar.strokeRect(padding, padding, barWidth, barHeight);

    // 文字
    this.hpText.setPosition(padding + barWidth / 2, padding + barHeight / 2);
    this.hpText.setText(
      `${Math.floor(this.player.stats.currentHp)} / ${this.player.stats.maxHp}`
    );
  }

  private updateExpBar(): void {
    const width = this.scene.scale.width;
    const padding = Math.min(20, width * 0.03);
    const barWidth = Math.min(200, width * 0.3);
    const barHeight = Math.min(12, this.scene.scale.height * 0.02);
    const yOffset = Math.min(55, this.scene.scale.height * 0.08);
    const expPercent = this.expSystem.getExpProgress();

    this.expBar.clear();

    // 背景
    this.expBar.fillStyle(0x333333, 1);
    this.expBar.fillRect(padding, yOffset, barWidth, barHeight);

    // 经验条
    this.expBar.fillStyle(0x00ff00, 1);
    this.expBar.fillRect(padding, yOffset, barWidth * expPercent, barHeight);

    // 边框
    this.expBar.lineStyle(1, 0xffffff, 0.5);
    this.expBar.strokeRect(padding, yOffset, barWidth, barHeight);
  }

  private updateTexts(): void {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const padding = Math.min(20, width * 0.03);
    const infoFontSize = Math.min(20, width / 30);

    this.levelText.setText(`Lv.${this.gameState.level}`);

    // 更新波次和击杀位置
    this.waveText.setPosition(width - padding, padding);
    this.waveText.setFontSize(infoFontSize);
    this.waveText.setText(`波次: ${this.gameState.wave}`);

    this.killsText.setPosition(width - padding, padding + infoFontSize + 10);
    this.killsText.setText(`击杀: ${this.gameState.kills}`);
  }

  destroy(): void {
    this.hpBar.destroy();
    this.hpText.destroy();
    this.expBar.destroy();
    this.levelText.destroy();
    this.waveText.destroy();
    this.killsText.destroy();

    // 清理技能UI
    this.skillUIs.forEach((skillUI) => {
      skillUI.container.destroy();
    });
    this.skillUIs = [];
  }
}
