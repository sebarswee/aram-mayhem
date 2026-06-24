import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { GameState, Skill, Element } from '@/types';
import { ExpSystem } from '@/systems/ExpSystem';
import { GAME_WIDTH } from '@/config/game.config';
import { ELEMENT_COLORS, getElementColor, getSynergy } from '@/data/elements';
import { SynergyResult } from '@/types';

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

  // 羁绊通知
  private synergyNotifications: Array<{ text: Phaser.GameObjects.Text; timer: number }> = [];

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
    const allSkills = this.player.getAllSkills();
    const basicSkills = this.player.skills;
    const ultimateSkills = this.player.ultimateSkills;

    if (!basicSkills || basicSkills.length === 0) return;

    const iconSize = Math.min(48, width * 0.1);
    const spacing = Math.min(10, width * 0.02);

    // 基础技能：居中显示在底部
    const startX = width / 2 - ((basicSkills.length - 1) * (iconSize + spacing)) / 2;
    const y = height - iconSize - 40; // 给技能名称留出空间

    basicSkills.forEach((skill, index) => {
      const x = startX + index * (iconSize + spacing);
      this.createSkillIcon(skill, x, y, iconSize, false, index);
    });

    // 大招：显示在右侧，带按键提示
    ultimateSkills.forEach((skill, index) => {
      const x = width - iconSize - 20;
      const ultimateY = height - iconSize * (2.5 - index * 1.5) - 20;
      this.createSkillIcon(skill, x, ultimateY, iconSize, true, index);
    });
  }

  /**
   * 创建单个技能图标
   */
  private createSkillIcon(
    skill: Skill,
    x: number,
    y: number,
    iconSize: number,
    isUltimate: boolean,
    index: number
  ): void {
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
    // 检查纹理是否存在，如果不存在则使用默认图标
    const textureExists = this.scene.textures.exists(iconKey);
    const icon = this.scene.add.image(0, 0, textureExists ? iconKey : 'player');
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

    // 大招按键提示
    if (isUltimate) {
      const keyText = this.scene.add.text(0, -iconSize / 2 - 12, index === 0 ? '[Q]' : '[E]', {
        fontSize: '12px',
        color: '#ffcc00',
        fontStyle: 'bold',
      });
      keyText.setOrigin(0.5, 0.5);
      keyText.setScrollFactor(0);
      keyText.setDepth(101);
      container.add(keyText);
    }

    // 技能名称（显示在图标下方）
    const nameText = this.scene.add.text(0, iconSize / 2 + 8, skill.name, {
      fontSize: '11px',
      color: isUltimate ? '#ffcc00' : '#ffffff',
    });
    nameText.setOrigin(0.5, 0);
    nameText.setScrollFactor(0);
    nameText.setDepth(101);
    container.add(nameText);

    // 交互区域（悬停放大效果 + 大招点击）
    const hitArea = this.scene.add.rectangle(0, 0, iconSize, iconSize, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.setScrollFactor(0);
    hitArea.setDepth(102);

    // 悬停放大效果
    hitArea.on('pointerover', () => {
      container.setScale(1.1);
    });
    hitArea.on('pointerout', () => {
      container.setScale(1);
    });

    // 大招点击释放
    if (isUltimate) {
      hitArea.on('pointerdown', () => {
        const battleScene = this.scene as any;
        if (battleScene.skillSystem && battleScene.gameState) {
          if (!battleScene.gameState.isSelectingSkill && !battleScene.gameState.isPaused && !battleScene.gameState.isUpgrading) {
            battleScene.skillSystem.useUltimateByIndex(index, battleScene.enemySystem.getEnemies());
            // 按下动画反馈
            this.scene.tweens.add({
              targets: container,
              scale: 0.9,
              duration: 80,
              yoyo: true,
            });
          }
        }
      });
    }
    container.add(hitArea);

    this.skillUIs.push({
      container,
      icon,
      cooldownOverlay,
      cooldownText,
      nameText,
      skill,
    });
  }

  /**
   * 获取技能对应颜色
   */
  private getSkillColor(skill: Skill): number {
    return getElementColor(skill.elements[0]);
  }

  /**
   * 显示羁绊通知（增强版）
   */
  showSynergyNotification(synergy: SynergyResult): void {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    // 创建容器
    const container = this.scene.add.container(width / 2, height / 3);
    container.setScrollFactor(0);
    container.setDepth(200);
    container.setAlpha(0);

    // 背景光晕
    const bgGlow = this.scene.add.graphics();
    const color1 = getElementColor(synergy.elements[0]);
    const color2 = getElementColor(synergy.elements[1]);
    bgGlow.fillStyle(0x000000, 0.7);
    bgGlow.fillRoundedRect(-150, -50, 300, 100, 15);
    bgGlow.lineStyle(3, 0xffcc00, 1);
    bgGlow.strokeRoundedRect(-150, -50, 300, 100, 15);
    container.add(bgGlow);

    // 元素图标/圆圈
    const circle1 = this.scene.add.circle(-80, -10, 25, color1, 0.9);
    circle1.setStrokeStyle(2, 0xffffff, 0.8);
    container.add(circle1);

    const circle2 = this.scene.add.circle(80, -10, 25, color2, 0.9);
    circle2.setStrokeStyle(2, 0xffffff, 0.8);
    container.add(circle2);

    // 元素符号
    const elementSymbols: Record<string, string> = {
      fire: '🔥',
      water: '💧',
      ice: '❄️',
      lightning: '⚡',
      holy: '✨',
      shadow: '🌑',
      grass: '🌿',
      earth: '🪨',
    };
    const symbol1 = elementSymbols[synergy.elements[0]] || '●';
    const symbol2 = elementSymbols[synergy.elements[1]] || '●';

    const elem1Text = this.scene.add.text(-80, -10, symbol1, { fontSize: '24px' });
    elem1Text.setOrigin(0.5, 0.5);
    container.add(elem1Text);

    const elem2Text = this.scene.add.text(80, -10, symbol2, { fontSize: '24px' });
    elem2Text.setOrigin(0.5, 0.5);
    container.add(elem2Text);

    // 连接线动画效果
    const connector = this.scene.add.graphics();
    connector.lineStyle(3, 0xffcc00, 0.8);
    connector.lineBetween(-55, -10, 55, -10);
    container.add(connector);

    // 羁绊名称（大字体）
    const titleFontSize = Math.min(28, width / 20);
    const titleText = this.scene.add.text(0, -45, `羁绊触发`, {
      fontSize: '14px',
      color: '#aaaaaa',
    });
    titleText.setOrigin(0.5, 0.5);
    container.add(titleText);

    const nameText = this.scene.add.text(0, 15, synergy.name, {
      fontSize: `${titleFontSize}px`,
      color: '#ffcc00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    });
    nameText.setOrigin(0.5, 0.5);
    container.add(nameText);

    // 效果描述
    const effectDesc = this.getEffectDescription(synergy);
    const descText = this.scene.add.text(0, 45, effectDesc, {
      fontSize: '12px',
      color: '#ffffff',
    });
    descText.setOrigin(0.5, 0.5);
    container.add(descText);

    // 粒子效果
    const particles = this.scene.add.particles(container.x, container.y, 'particle_glow', {
      speed: { min: 50, max: 100 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 600,
      quantity: 20,
      tint: [color1, color2, 0xffcc00],
      emitting: false,
    });
    particles.setDepth(199);
    particles.explode();

    // 动画：缩放弹入
    container.setScale(0.5);

    this.scene.tweens.add({
      targets: container,
      alpha: 1,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        // 停留 1.5 秒后淡出
        this.scene.time.delayedCall(1500, () => {
          this.scene.tweens.add({
            targets: container,
            alpha: 0,
            scale: 0.8,
            y: container.y - 30,
            duration: 300,
            onComplete: () => {
              container.destroy();
              particles.destroy();
            },
          });
        });
      },
    });

    // 额外：屏幕边缘闪光效果
    const flash = this.scene.add.rectangle(0, 0, width, height, 0xffcc00, 0.15);
    flash.setOrigin(0, 0);
    flash.setScrollFactor(0);
    flash.setDepth(198);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 400,
      onComplete: () => flash.destroy(),
    });
  }

  /**
   * 获取羁绊效果的简短描述
   */
  private getEffectDescription(synergy: SynergyResult): string {
    const effectDescriptions: Record<string, string> = {
      'true_damage_percent': `真实伤害 +${Math.floor((synergy.value || 0.2) * 100)}%`,
      'freeze': '冻结敌人',
      'chain_boost': `连锁伤害 +${Math.floor((synergy.value || 1.5) * 100 - 100)}%`,
      'spread_debuff': '传播负面效果',
      'slow': `减速 ${(synergy.value || 0.7) * 100}%`,
      'dispel_and_damage': '驱散 + 伤害',
      'damage_increase': `伤害提升 +${Math.floor((synergy.value || 0.3) * 100)}%`,
      'double_damage': '双倍伤害',
      'explosion': '范围爆炸',
      'burn_spread': '火焰蔓延',
      'lava_zone': '熔岩区域',
      'damage_to_shield': '伤害转化为护盾',
      'damage_boost_no_heal': '高伤禁疗',
      'cooldown_refresh': '冷却缩减 50%',
      'root': '定身',
      'knockup': '击飞',
      'refract_damage': '伤害折射',
      'death_explosion': '死亡爆炸',
      'tick_speed_double': 'DoT 加速',
      'split_3': '分裂 3 发',
      'stun': '眩晕',
      'guaranteed_crit': '必定暴击',
      'lifesteal': `生命偷取 ${Math.floor((synergy.value || 0.3) * 100)}%`,
      'defense_reduce': `防御削减 ${Math.floor((synergy.value || 0.5) * 100)}%`,
      'heal_zone': '治疗区域',
      'barrier': '护盾屏障',
      'true_damage_confuse': '真实伤害 + 混乱',
    };
    return effectDescriptions[synergy.effect] || synergy.effect;
  }

  update(): void {
    this.updateHpBar();
    this.updateExpBar();
    this.updateTexts();
    this.updateSkillUIs();
    this.updateSkillCooldowns();
  }

  /**
   * 更新技能UI（检测技能变化）
   */
  private updateSkillUIs(): void {
    const currentSkills = this.player.getAllSkills();

    // 检查技能数量是否变化
    if (currentSkills.length !== this.skillUIs.length) {
      this.rebuildSkillUIs();
      return;
    }

    // 检查技能ID是否变化
    for (let i = 0; i < currentSkills.length; i++) {
      if (currentSkills[i].id !== this.skillUIs[i].skill.id) {
        this.rebuildSkillUIs();
        return;
      }
    }
  }

  /**
   * 重新构建技能UI
   */
  private rebuildSkillUIs(): void {
    // 清理旧的技能UI
    this.skillUIs.forEach((skillUI) => {
      skillUI.container.destroy();
    });
    this.skillUIs = [];

    // 创建新的技能UI
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    this.createSkillUI(width, height);
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
