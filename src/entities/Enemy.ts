import Phaser from 'phaser';
import { EnemyConfig, EnemyType } from '@/types';

// 敌人类型到精灵纹理的映射
const ENEMY_TEXTURE_MAP: Record<string, string> = {
  'slime': 'enemy_slime',
  'bat': 'enemy_bat',
  'skeleton': 'enemy_skeleton',
  'elite_orc': 'enemy_orc',
  'elite_mage': 'enemy_mage',
  'boss': 'enemy_boss',
};

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  public config: EnemyConfig;
  public currentHp: number;
  public instanceId: string; // 唯一实例ID（用于连锁判定）
  private target: Phaser.GameObjects.Sprite | null = null;
  private shadowGraphics: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, config: EnemyConfig) {
    // 根据敌人配置选择纹理
    const textureKey = ENEMY_TEXTURE_MAP[config.id] || 'enemy_slime';
    super(scene, x, y, textureKey);

    this.config = config;
    this.currentHp = config.hp;
    this.instanceId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 设置物理体
    this.setCollideWorldBounds(true);

    // 根据类型设置大小和缩放
    const scale = this.getScaleByType(config.type);
    this.setScale(scale);
    this.body?.setSize(24 * scale, 24 * scale);

    // 设置深度
    this.setDepth(30);

    // 创建阴影效果
    this.createShadow();
  }

  private getScaleByType(type: EnemyType): number {
    switch (type) {
      case 'normal':
        return 1;
      case 'elite':
        return 1.3;
      case 'boss':
        return 1.8;
      default:
        return 1;
    }
  }

  private createShadow(): void {
    this.shadowGraphics = this.scene.add.graphics();
    this.updateShadow();
    this.shadowGraphics.setDepth(29);
  }

  private updateShadow(): void {
    if (!this.shadowGraphics) return;
    this.shadowGraphics.clear();
    this.shadowGraphics.fillStyle(0x000000, 0.3);
    this.shadowGraphics.fillEllipse(this.x, this.y + 10, 30 * this.scaleX, 10);
  }

  setTarget(target: Phaser.GameObjects.Sprite): void {
    this.target = target;
  }

  update(_delta: number): void {
    if (!this.target || !this.active) return;

    // 追踪目标
    const speed = this.config.speed;
    const angle = Phaser.Math.Angle.Between(
      this.x,
      this.y,
      this.target.x,
      this.target.y
    );

    this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    // 更新阴影位置
    if (this.shadowGraphics) {
      this.updateShadow();
    }

    // 根据移动方向轻微翻转
    if (this.body?.velocity.x && this.body.velocity.x < 0) {
      this.setFlipX(true);
    } else if (this.body?.velocity.x && this.body.velocity.x > 0) {
      this.setFlipX(false);
    }
  }

  takeDamage(amount: number): boolean {
    this.currentHp -= amount;

    // 受伤闪烁
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 50,
      yoyo: true,
    });

    if (this.currentHp <= 0) {
      this.die();
      return true;
    }

    return false;
  }

  private die(): void {
    // 创建死亡粒子效果
    this.createDeathEffect();

    // 清理阴影
    if (this.shadowGraphics) {
      this.shadowGraphics.destroy();
    }

    this.emit('death');
    this.destroy();
  }

  private createDeathEffect(): void {
    // 简单的爆炸粒子效果
    const particles = this.scene.add.particles(this.x, this.y, 'particle_glow', {
      speed: { min: 50, max: 150 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: this.config.color,
      lifespan: 400,
      quantity: 8,
      emitting: false,
    });

    particles.explode();
    this.scene.time.delayedCall(500, () => particles.destroy());
  }

  destroy(): void {
    if (this.shadowGraphics) {
      this.shadowGraphics.destroy();
    }
    super.destroy();
  }

  getExpValue(): number {
    return this.config.expValue;
  }
}
