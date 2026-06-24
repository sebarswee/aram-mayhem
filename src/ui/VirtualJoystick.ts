import Phaser from 'phaser';

export type JoystickMode = 'fixed' | 'follow';

export interface JoystickConfig {
  mode: JoystickMode;
  fixedX?: number;
  fixedY?: number;
}

export class VirtualJoystick {
  private scene: Phaser.Scene;
  private base: Phaser.GameObjects.Arc;
  private thumb: Phaser.GameObjects.Arc;
  private pointer: Phaser.Input.Pointer | null = null;
  private vector: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
  private baseX: number;
  private baseY: number;
  private radius: number = 60;  // 增大摇杆活动范围
  private touchRadius: number = 100;  // 增大触控响应区域
  private mode: JoystickMode;
  private isVisible: boolean = true;
  private touchZone: Phaser.GameObjects.Zone | null = null;
  private isDisabled: boolean = false;
  // 绑定的事件处理器，用于精确移除
  private boundPointerDown: (pointer: Phaser.Input.Pointer) => void;
  private boundPointerMove: (pointer: Phaser.Input.Pointer) => void;
  private boundPointerUp: (pointer: Phaser.Input.Pointer) => void;

  constructor(scene: Phaser.Scene, config: JoystickConfig = { mode: 'fixed' }) {
    this.scene = scene;
    this.mode = config.mode;

    // 绑定事件处理器
    this.boundPointerDown = this.handlePointerDown.bind(this);
    this.boundPointerMove = this.handlePointerMove.bind(this);
    this.boundPointerUp = this.handlePointerUp.bind(this);

    // 计算固定位置（根据屏幕尺寸自适应）
    const width = scene.scale.width;
    const height = scene.scale.height;
    const padding = Math.min(100, width * 0.15, height * 0.1);
    this.baseX = config.fixedX ?? padding;
    this.baseY = config.fixedY ?? height - padding;

    // 绘制摇杆底座
    this.base = scene.add.circle(this.baseX, this.baseY, this.radius + 10, 0x444444, 0.5);
    this.base.setScrollFactor(0);
    this.base.setDepth(1000);

    // 绘制摇杆头
    this.thumb = scene.add.circle(this.baseX, this.baseY, 30, 0x888888, 0.8);
    this.thumb.setScrollFactor(0);
    this.thumb.setDepth(1001);

    this.setupEvents();
  }

  private setupEvents(): void {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    if (this.mode === 'fixed') {
      // 固定模式：只在摇杆区域内响应
      this.base.setInteractive(
        new Phaser.Geom.Circle(this.baseX, this.baseY, this.touchRadius),
        Phaser.Geom.Circle.Contains
      );

      this.base.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (this.isDisabled) return;
        this.pointer = pointer;
        this.updatePosition(pointer.x, pointer.y);
      });
    } else {
      // 跟随模式：直接监听全局触摸事件，判断是否在左半屏
      // 不使用 Zone，因为它可能有问题
      this.scene.input.on('pointerdown', this.boundPointerDown);
    }

    // 使用绑定的事件处理器
    this.scene.input.on('pointermove', this.boundPointerMove);
    this.scene.input.on('pointerup', this.boundPointerUp);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.isDisabled) return;
    const width = this.scene.scale.width;
    // 只响应左半屏的触摸
    if (pointer.x <= width / 2) {
      this.pointer = pointer;
      // 摇杆出现在手指位置
      this.baseX = pointer.x;
      this.baseY = pointer.y;
      this.base.setPosition(this.baseX, this.baseY);
      this.thumb.setPosition(this.baseX, this.baseY);
      this.updatePosition(pointer.x, pointer.y);
    }
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.isDisabled) return;
    if (this.pointer === pointer) {
      this.updatePosition(pointer.x, pointer.y);
    }
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    if (this.pointer === pointer) {
      this.reset();
    }
  }

  private updatePosition(x: number, y: number): void {
    const dx = x - this.baseX;
    const dy = y - this.baseY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 死区设置 - 小范围移动不触发
    const deadZone = 10;
    if (distance < deadZone) {
      this.thumb.setPosition(this.baseX, this.baseY);
      this.vector.set(0, 0);
      return;
    }

    if (distance < this.radius) {
      this.thumb.setPosition(x, y);
      // 固定速度：只返回方向，不根据距离缩放
      const angle = Math.atan2(dy, dx);
      this.vector.set(Math.cos(angle), Math.sin(angle));
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

    // 跟随模式下，重置到默认位置（隐藏状态）
    if (this.mode === 'follow') {
      const height = this.scene.scale.height;
      const padding = Math.min(100, this.scene.scale.width * 0.15, height * 0.1);
      this.baseX = padding;
      this.baseY = height - padding;
      this.base.setPosition(this.baseX, this.baseY);
    }
  }

  getVector(): Phaser.Math.Vector2 {
    return this.vector.clone();
  }

  setVisible(visible: boolean): void {
    this.isVisible = visible;
    this.base.setVisible(visible);
    this.thumb.setVisible(visible);
    if (this.touchZone) {
      this.touchZone.setVisible(visible);
      // touchZone 需要保持交互，即使不可见
      // 不调用 disableInteractive()，只控制可见性
    }
  }

  setMode(mode: JoystickMode): void {
    this.mode = mode;
    this.reset();
    // 清理旧的事件监听
    if (this.touchZone) {
      this.touchZone.destroy();
      this.touchZone = null;
    }
    // 移除 follow 模式的 pointerdown 监听
    this.scene.input.off('pointerdown', this.boundPointerDown);
    this.base.removeAllListeners();
    this.setupEvents();
  }

  setDisabled(disabled: boolean): void {
    this.isDisabled = disabled;
    if (disabled) {
      this.reset();
    }
  }

  destroy(): void {
    // 精确移除绑定的事件监听器
    this.scene.input.off('pointerdown', this.boundPointerDown);
    this.scene.input.off('pointermove', this.boundPointerMove);
    this.scene.input.off('pointerup', this.boundPointerUp);
    this.base.destroy();
    this.thumb.destroy();
    if (this.touchZone) {
      this.touchZone.destroy();
    }
  }
}
