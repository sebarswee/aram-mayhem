# Task 5: Player实体 - 玩家角色

## File to Create
`src/entities/Player.ts`

## Code
```typescript
import Phaser from 'phaser';
import { PlayerStats, Skill } from '@/types';
import { INITIAL_PLAYER_STATS } from '@/config/balance.config';

export class Player extends Phaser.Physics.Arcade.Sprite {
  public stats: PlayerStats;
  public skills: Skill[] = [];
  public skillCooldowns: Map<string, number> = new Map();
  private lastDamageTime: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, '__DEFAULT'); // 使用默认纹理

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 初始化属性
    this.stats = { ...INITIAL_PLAYER_STATS };

    // 设置物理体
    this.setCollideWorldBounds(true);
    this.setDrag(500);
    this.setBounce(0);

    // 设置碰撞体大小
    this.body?.setSize(32, 32);

    // 绘制占位符图形(绿色方块)
    this.drawPlaceholder();
  }

  private drawPlaceholder(): void {
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0x00ff00, 1);
    graphics.fillRect(-16, -16, 32, 32);
    graphics.generateTexture('player', 32, 32);
    graphics.destroy();
    this.setTexture('player');
  }

  move(velocityX: number, velocityY: number): void {
    this.setVelocity(velocityX, velocityY);
  }

  takeDamage(amount: number): boolean {
    const now = Date.now();

    // 碰撞伤害间隔限制
    if (now - this.lastDamageTime < 500) {
      return false;
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
  }
}
```

## Commit
Message: "feat: add Player entity with movement and damage\n\nCo-Authored-By: Claude <noreply@anthropic.com>"

## Report
Write to `.superpowers/sdd/task-5-report.md`
