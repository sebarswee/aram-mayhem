import Phaser from 'phaser';
import { PlayerStats, Skill } from '@/types';
import { INITIAL_PLAYER_STATS } from '@/config/balance.config';

export class Player extends Phaser.Physics.Arcade.Sprite {
  public stats: PlayerStats;
  public skills: Skill[] = [];
  public skillCooldowns: Map<string, number> = new Map();
  private lastDamageTime: number = 0;
  private glowSprite: Phaser.GameObjects.Sprite | null = null;
  public isInvincible: boolean = false; // 无敌状态
  private shieldValue: number = 0; // 护盾值

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 初始化属性
    this.stats = { ...INITIAL_PLAYER_STATS };

    // 设置物理体
    this.setCollideWorldBounds(true);
    this.setDrag(0); // 禁用惯性漂移
    this.setBounce(0);

    // 设置碰撞体大小
    this.body?.setSize(32, 32);

    // 设置深度
    this.setDepth(50);

    // 创建发光效果
    this.createGlowEffect();
  }

  private createGlowEffect(): void {
    // 玩家周围的光环效果
    this.glowSprite = this.scene.add.sprite(this.x, this.y, 'player');
    this.glowSprite.setAlpha(0.3);
    this.glowSprite.setTint(0x66ccff);
    this.glowSprite.setScale(1.3);
    this.glowSprite.setDepth(49);
  }

  move(velocityX: number, velocityY: number): void {
    this.setVelocity(velocityX, velocityY);
  }

  takeDamage(amount: number): boolean {
    const now = Date.now();

    // 无敌状态不受伤
    if (this.isInvincible) {
      return false;
    }

    // 碰撞伤害间隔限制
    if (now - this.lastDamageTime < 500) {
      return false;
    }

    // 先扣护盾
    if (this.shieldValue > 0) {
      if (this.shieldValue >= amount) {
        this.shieldValue -= amount;
        return false;
      } else {
        amount -= this.shieldValue;
        this.shieldValue = 0;
      }
    }

    // 计算实际伤害(考虑防御)
    const actualDamage = Math.max(1, amount - this.stats.defense * 0.5);
    this.stats.currentHp = Math.max(0, this.stats.currentHp - actualDamage);
    this.lastDamageTime = now;

    // 受伤闪烁效果
    this.scene.tweens.add({
      targets: this,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 2,
    });

    // 检查死亡
    if (this.stats.currentHp <= 0) {
      this.die();
      return true;
    }

    return false;
  }

  /**
   * 添加护盾
   */
  addShield(amount: number): void {
    this.shieldValue += amount;
  }

  /**
   * 检查是否有护盾
   */
  hasShield(): boolean {
    return this.shieldValue > 0;
  }

  /**
   * 获取当前护盾值
   */
  getShield(): number {
    return this.shieldValue;
  }

  heal(amount: number): void {
    this.stats.currentHp = Math.min(
      this.stats.maxHp,
      this.stats.currentHp + amount
    );
  }

  private die(): void {
    this.emit('death');
    this.setActive(false);
    this.setVisible(false);
  }

  reset(x: number, y: number): void {
    this.stats = { ...INITIAL_PLAYER_STATS };
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.skillCooldowns.clear();
  }

  update(delta: number): void {
    // 更新技能冷却
    this.skillCooldowns.forEach((cooldown, skillId) => {
      if (cooldown > 0) {
        this.skillCooldowns.set(skillId, Math.max(0, cooldown - delta));
      }
    });

    // 更新发光效果位置
    if (this.glowSprite) {
      this.glowSprite.setPosition(this.x, this.y);
      // 轻微的脉动效果
      this.glowSprite.setAlpha(0.2 + Math.sin(Date.now() / 300) * 0.1);
    }
  }

  destroy(): void {
    if (this.glowSprite) {
      this.glowSprite.destroy();
    }
    super.destroy();
  }
}