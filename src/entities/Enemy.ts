import Phaser from 'phaser';
import { EnemyConfig, EnemyType } from '@/types';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  public config: EnemyConfig;
  public currentHp: number;
  private target: Phaser.GameObjects.Sprite | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, config: EnemyConfig) {
    super(scene, x, y, '__DEFAULT');

    this.config = config;
    this.currentHp = config.hp;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 设置物理体
    this.setCollideWorldBounds(true);

    // 根据类型设置大小
    const size = this.getSizeByType(config.type);
    this.body?.setSize(size, size);

    // 绘制占位符
    this.drawPlaceholder(config.color, size);
  }

  private getSizeByType(type: EnemyType): number {
    switch (type) {
      case 'normal':
        return 24;
      case 'elite':
        return 36;
      case 'boss':
        return 64;
      default:
        return 24;
    }
  }

  private drawPlaceholder(color: number, size: number): void {
    const key = `enemy_${color}_${size}`;

    // 检查纹理是否已存在
    if (!this.scene.textures.exists(key)) {
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(color, 1);
      graphics.fillRect(-size / 2, -size / 2, size, size);
      graphics.generateTexture(key, size, size);
      graphics.destroy();
    }

    this.setTexture(key);
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
    this.emit('death');
    this.destroy();
  }

  getExpValue(): number {
    return this.config.expValue;
  }
}
