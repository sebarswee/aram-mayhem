import Phaser from 'phaser';

/**
 * Damage number display configuration
 */
interface DamageNumberConfig {
  value: number;
  x: number;
  y: number;
  color?: number;
  fontSize?: string;
  isCrit?: boolean;
  isPlayer?: boolean;
  isCounter?: boolean;
  element?: string; // 元素类型，用于颜色
}

/**
 * 伤害数字管理器 - 显示飘动的伤害数字
 *
 * 功能增强：
 * - 暴击震动效果+更大缩放
 * - 元素颜色支持
 * - 连续伤害错开排列
 * - 治疗数字绿色光芒轨迹
 * - 护盾数字蓝色光圈效果
 * - 大额伤害屏幕震动
 */
export class DamageNumberManager {
  private scene: Phaser.Scene;
  private activeNumbers: Phaser.GameObjects.Container[] = [];
  private maxActive: number = 50;  // 性能限制
  private recentDamagePositions: Array<{ x: number; y: number; time: number }> = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 显示伤害数字
   */
  showDamage(config: DamageNumberConfig): void {
    // 限制活动数字数量
    if (this.activeNumbers.length >= this.maxActive) {
      const oldest = this.activeNumbers.shift();
      if (oldest) oldest.destroy();
    }

    const { value, x, y, isCrit, isPlayer, isCounter, element } = config;

    // 清理过期的位置记录
    const now = Date.now();
    this.recentDamagePositions = this.recentDamagePositions.filter(p => now - p.time < 300);

    // 计算错开偏移（防止重叠）
    const offset = this.calculateStaggerOffset(x, y);

    // 记录当前位置
    this.recentDamagePositions.push({ x, y, time: now });

    // 创建容器
    const container = this.scene.add.container(x + offset.x, y + offset.y);
    container.setDepth(150);

    // 确定颜色和大小
    const colorInfo = this.getDamageColor(isPlayer || false, isCrit || false, isCounter || false, element);
    const fontSize = this.getDamageFontSize(value, isCrit || false, isPlayer || false);

    // 创建背景光晕效果
    if (isCrit || Math.abs(value) >= 100) {
      this.createDamageGlow(container, colorInfo.glowColor, isCrit ? 30 : 20);
    }

    // 创建主文字
    const text = this.scene.add.text(0, 0, this.formatDamageText(value, isCrit || false), {
      fontSize,
      color: colorInfo.textColor,
      fontStyle: isCrit ? 'bold' : 'normal',
      stroke: colorInfo.strokeColor,
      strokeThickness: isCrit ? 5 : 3,
      shadow: {
        offsetX: 0,
        offsetY: 2,
        color: colorInfo.shadowColor,
        blur: 4,
        fill: true,
      },
    });
    text.setOrigin(0.5, 0.5);
    container.add(text);

    // 添加装饰效果
    if (isCrit) {
      this.addCritDecorations(container, colorInfo.textColor);
    }

    // 入场动画
    this.playEntranceAnimation(container, isCrit || false, value);

    // 大额伤害屏幕震动
    if (Math.abs(value) >= 200 || (isCrit && Math.abs(value) >= 100)) {
      this.scene.cameras.main.shake(100, 0.003);
    }

    this.activeNumbers.push(container);

    // 漂浮并消失动画
    this.scene.tweens.add({
      targets: container,
      y: container.y - 50,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      delay: isCrit ? 200 : 100,
      onComplete: () => {
        container.destroy();
        const index = this.activeNumbers.indexOf(container);
        if (index > -1) {
          this.activeNumbers.splice(index, 1);
        }
      },
    });
  }

  /**
   * 计算错开偏移（防止伤害数字重叠）
   */
  private calculateStaggerOffset(x: number, y: number): { x: number; y: number } {
    const nearbyCount = this.recentDamagePositions.filter(
      p => Math.abs(p.x - x) < 30 && Math.abs(p.y - y) < 30
    ).length;

    // 根据附近的数字数量计算偏移
    const angle = (nearbyCount * 45) % 360;
    const distance = nearbyCount * 15;

    return {
      x: Math.cos(angle * Math.PI / 180) * distance,
      y: Math.sin(angle * Math.PI / 180) * distance - 20,
    };
  }

  /**
   * 获取伤害颜色配置
   */
  private getDamageColor(
    isPlayer: boolean,
    isCrit: boolean,
    isCounter: boolean,
    element?: string
  ): { textColor: string; strokeColor: string; shadowColor: string; glowColor: number } {
    // 元素颜色映射
    const elementColors: Record<string, { text: string; stroke: string; glow: number }> = {
      fire: { text: '#ff6644', stroke: '#ff2200', glow: 0xff4400 },
      water: { text: '#44aaff', stroke: '#0066ff', glow: 0x4488ff },
      ice: { text: '#88ddff', stroke: '#44aaff', glow: 0x88ddff },
      lightning: { text: '#ffff44', stroke: '#ffaa00', glow: 0xffff00 },
      holy: { text: '#ffdd44', stroke: '#ffaa00', glow: 0xffcc00 },
      shadow: { text: '#aa66ff', stroke: '#6600cc', glow: 0x8800ff },
      grass: { text: '#66ff66', stroke: '#22aa22', glow: 0x44ff44 },
      earth: { text: '#ccaa66', stroke: '#886622', glow: 0xaa8844 },
    };

    if (isPlayer) {
      return { textColor: '#ff4444', strokeColor: '#aa0000', shadowColor: '#000000', glowColor: 0xff4444 };
    }

    if (isCounter) {
      return { textColor: '#44ffff', strokeColor: '#00aaaa', shadowColor: '#004444', glowColor: 0x44ffff };
    }

    if (isCrit) {
      return { textColor: '#ffcc00', strokeColor: '#ff8800', shadowColor: '#ff4400', glowColor: 0xffcc00 };
    }

    // 元素伤害颜色
    if (element && elementColors[element]) {
      const ec = elementColors[element];
      return { textColor: ec.text, strokeColor: ec.stroke, shadowColor: '#000000', glowColor: ec.glow };
    }

    return { textColor: '#ffffff', strokeColor: '#000000', shadowColor: '#000000', glowColor: 0xffffff };
  }

  /**
   * 获取伤害数字字体大小
   */
  private getDamageFontSize(value: number, isCrit: boolean, isPlayer: boolean): string {
    if (isPlayer) return isCrit ? '22px' : '16px';
    if (isCrit) return '26px';

    const absValue = Math.abs(value);
    if (absValue >= 500) return '28px';
    if (absValue >= 200) return '24px';
    if (absValue >= 100) return '22px';
    return '18px';
  }

  /**
   * 格式化伤害文字
   */
  private formatDamageText(value: number, isCrit: boolean): string {
    const prefix = value >= 0 ? '' : '+';
    const suffix = isCrit ? '!' : '';
    return `${prefix}${Math.floor(Math.abs(value))}${suffix}`;
  }

  /**
   * 创建伤害光晕效果
   */
  private createDamageGlow(container: Phaser.GameObjects.Container, color: number, size: number): void {
    // 外层光晕
    const glow = this.scene.add.graphics();
    glow.fillStyle(color, 0.2);
    glow.fillCircle(0, 0, size);
    glow.fillStyle(color, 0.1);
    glow.fillCircle(0, 0, size * 1.5);
    container.addAt(glow, 0);

    // 光晕脉动动画
    this.scene.tweens.add({
      targets: glow,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
    });
  }

  /**
   * 添加暴击装饰效果
   */
  private addCritDecorations(container: Phaser.GameObjects.Container, color: string): void {
    // 创建星芒效果
    const spark = this.scene.add.graphics();
    spark.lineStyle(2, 0xffffff, 0.8);

    // 绘制十字星芒
    for (let i = 0; i < 4; i++) {
      const angle = (i * 90) * Math.PI / 180;
      const length = 20;
      spark.moveTo(0, 0);
      spark.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
    }
    spark.strokePath();
    container.addAt(spark, 0);

    // 星芒旋转消失动画
    this.scene.tweens.add({
      targets: spark,
      rotation: Math.PI,
      alpha: 0,
      scale: 1.5,
      duration: 400,
      ease: 'Power2',
    });

    // 添加小粒子飞散效果
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60) * Math.PI / 180;
      const particle = this.scene.add.circle(0, 0, 3, 0xffffff, 0.8);
      container.add(particle);

      this.scene.tweens.add({
        targets: particle,
        x: Math.cos(angle) * 30,
        y: Math.sin(angle) * 30,
        alpha: 0,
        scale: 0,
        duration: 300,
        delay: 50,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }

  /**
   * 播放入场动画
   */
  private playEntranceAnimation(container: Phaser.GameObjects.Container, isCrit: boolean, value: number): void {
    if (isCrit) {
      // 暴击：大缩放弹跳 + 轻微震动
      container.setScale(1.8);
      this.scene.tweens.add({
        targets: container,
        scale: 1,
        duration: 150,
        ease: 'Back.out',
      });

      // 震动效果
      this.scene.tweens.add({
        targets: container,
        x: container.x + 2,
        duration: 30,
        yoyo: true,
        repeat: 3,
      });
    } else {
      // 普通伤害：小缩放
      const absValue = Math.abs(value);
      const startScale = absValue >= 100 ? 1.3 : 1.1;
      container.setScale(startScale);

      this.scene.tweens.add({
        targets: container,
        scale: 1,
        duration: 100,
        ease: 'Back.out',
      });
    }
  }

  /**
   * 显示敌人伤害（从 Enemy.takeDamage 调用）
   */
  showEnemyDamage(
    x: number,
    y: number,
    value: number,
    isCrit: boolean = false,
    isCounter: boolean = false,
    element?: string
  ): void {
    this.showDamage({
      value,
      x,
      y,
      isCrit,
      isPlayer: false,
      isCounter,
      element,
    });
  }

  /**
   * 显示玩家伤害（从 Player.takeDamage 调用）
   */
  showPlayerDamage(x: number, y: number, value: number): void {
    this.showDamage({
      value,
      x,
      y,
      isPlayer: true,
    });
  }

  /**
   * 显示治疗数字（绿色）- 增强版
   */
  showHeal(x: number, y: number, value: number): void {
    // 计算错开偏移
    const offset = this.calculateStaggerOffset(x, y);

    const container = this.scene.add.container(x + offset.x, y + offset.y - 20);
    container.setDepth(150);

    // 创建绿色光芒轨迹背景
    const trail = this.scene.add.graphics();
    trail.fillStyle(0x44ff44, 0.3);
    trail.fillCircle(0, 0, 20);
    container.add(trail);

    // 光芒脉动
    this.scene.tweens.add({
      targets: trail,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 400,
    });

    // 创建十字光环
    const cross = this.scene.add.graphics();
    cross.lineStyle(2, 0x88ff88, 0.8);
    cross.lineBetween(-15, 0, 15, 0);
    cross.lineBetween(0, -15, 0, 15);
    container.add(cross);

    this.scene.tweens.add({
      targets: cross,
      rotation: Math.PI / 4,
      alpha: 0,
      duration: 500,
    });

    // 主文字
    const text = this.scene.add.text(0, 0, '+' + Math.floor(value).toString(), {
      fontSize: '20px',
      color: '#44ff44',
      fontStyle: 'bold',
      stroke: '#006600',
      strokeThickness: 3,
      shadow: {
        offsetX: 0,
        offsetY: 1,
        color: '#004400',
        blur: 3,
        fill: true,
      },
    });
    text.setOrigin(0.5, 0.5);
    container.add(text);

    // 弹跳入场
    container.setScale(1.3);
    this.scene.tweens.add({
      targets: container,
      scale: 1,
      y: container.y - 40,
      alpha: 0,
      duration: 600,
      ease: 'Back.out',
      onComplete: () => container.destroy(),
    });
  }

  /**
   * 显示护盾数值（蓝色）- 增强版
   */
  showShield(x: number, y: number, value: number): void {
    const container = this.scene.add.container(x, y);
    container.setDepth(150);

    // 创建盾牌图标光圈
    const shieldGlow = this.scene.add.graphics();
    shieldGlow.fillStyle(0x4488ff, 0.4);
    shieldGlow.fillCircle(0, 0, 18);
    shieldGlow.lineStyle(2, 0x66aaff, 0.8);
    shieldGlow.strokeCircle(0, 0, 18);
    container.add(shieldGlow);

    // 光圈扩散动画
    this.scene.tweens.add({
      targets: shieldGlow,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 500,
    });

    // 创建小盾牌图标
    const shieldIcon = this.scene.add.text(0, -10, '🛡️', {
      fontSize: '16px',
    });
    shieldIcon.setOrigin(0.5, 0.5);
    container.add(shieldIcon);

    // 主文字
    const text = this.scene.add.text(0, 8, '+' + Math.floor(value).toString(), {
      fontSize: '16px',
      color: '#4488ff',
      fontStyle: 'bold',
      stroke: '#002266',
      strokeThickness: 2,
    });
    text.setOrigin(0.5, 0.5);
    container.add(text);

    // 动画
    container.setScale(0.8);
    this.scene.tweens.add({
      targets: container,
      scale: 1,
      y: container.y - 35,
      alpha: 0,
      duration: 600,
      ease: 'Back.out',
      onComplete: () => container.destroy(),
    });
  }

  /**
   * 清除所有活动数字
   */
  clear(): void {
    for (const container of this.activeNumbers) {
      container.destroy();
    }
    this.activeNumbers = [];
    this.recentDamagePositions = [];
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.clear();
  }
}
