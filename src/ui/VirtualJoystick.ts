import Phaser from 'phaser';

export class VirtualJoystick {
  private scene: Phaser.Scene;
  private base: Phaser.GameObjects.Arc;
  private thumb: Phaser.GameObjects.Arc;
  private pointer: Phaser.Input.Pointer | null = null;
  private vector: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
  private baseX: number;
  private baseY: number;
  private radius: number = 50;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.baseX = x;
    this.baseY = y;

    // 绘制摇杆底座
    this.base = scene.add.circle(x, y, this.radius + 10, 0x444444, 0.5);
    this.base.setScrollFactor(0);
    this.base.setDepth(1000);

    // 绘制摇杆头
    this.thumb = scene.add.circle(x, y, 30, 0x888888, 0.8);
    this.thumb.setScrollFactor(0);
    this.thumb.setDepth(1001);

    this.setupEvents();
  }

  private setupEvents(): void {
    // 触摸/点击区域 - 左半屏
    const touchZone = this.scene.add
      .zone(0, 0, this.scene.cameras.main.width / 2, this.scene.cameras.main.height)
      .setOrigin(0, 0)
      .setInteractive();

    touchZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.pointer = pointer;
      this.updatePosition(pointer.x, pointer.y);
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.pointer === pointer) {
        this.updatePosition(pointer.x, pointer.y);
      }
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.pointer === pointer) {
        this.reset();
      }
    });
  }

  private updatePosition(x: number, y: number): void {
    const dx = x - this.baseX;
    const dy = y - this.baseY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < this.radius) {
      this.thumb.setPosition(x, y);
      this.vector.set(dx / this.radius, dy / this.radius);
    } else {
      const angle = Math.atan2(dy, dx);
      this.thumb.setPosition(
        this.baseX + Math.cos(angle) * this.radius,
        this.baseY + Math.sin(angle) * this.radius
      );
      this.vector.set(Math.cos(angle), Math.sin(angle));
    }
  }

  private reset(): void {
    this.pointer = null;
    this.thumb.setPosition(this.baseX, this.baseY);
    this.vector.set(0, 0);
  }

  getVector(): Phaser.Math.Vector2 {
    return this.vector.clone();
  }

  setVisible(visible: boolean): void {
    this.base.setVisible(visible);
    this.thumb.setVisible(visible);
  }

  destroy(): void {
    this.base.destroy();
    this.thumb.destroy();
  }
}
