import Phaser from 'phaser';
import { InputState } from '@/types';
import { VirtualJoystick, JoystickMode } from '@/ui/VirtualJoystick';
import { GAME_HEIGHT } from '@/config/game.config';

export class InputSystem {
  private _scene: Phaser.Scene;
  private joystick: VirtualJoystick;
  private keys: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    UP: Phaser.Input.Keyboard.Key;
    DOWN: Phaser.Input.Keyboard.Key;
    LEFT: Phaser.Input.Keyboard.Key;
    RIGHT: Phaser.Input.Keyboard.Key;
  };

  constructor(scene: Phaser.Scene, joystickMode: JoystickMode = 'follow') {
    this._scene = scene;

    // 创建虚拟摇杆 - 根据模式选择配置
    this.joystick = new VirtualJoystick(scene, { mode: joystickMode });

    // 创建键盘输入
    this.keys = {
      W: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      UP: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      DOWN: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      LEFT: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      RIGHT: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
    };

    // 移动端检测 - 只在移动端显示摇杆
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    this.joystick.setVisible(isMobile);
  }

  getInput(): InputState {
    // 优先使用键盘输入
    let moveX = 0;
    let moveY = 0;

    if (this.keys.A.isDown || this.keys.LEFT.isDown) moveX = -1;
    if (this.keys.D.isDown || this.keys.RIGHT.isDown) moveX = 1;
    if (this.keys.W.isDown || this.keys.UP.isDown) moveY = -1;
    if (this.keys.S.isDown || this.keys.DOWN.isDown) moveY = 1;

    // 如果没有键盘输入，使用摇杆
    if (moveX === 0 && moveY === 0) {
      const joystickVector = this.joystick.getVector();
      moveX = joystickVector.x;
      moveY = joystickVector.y;
    }

    return {
      moveX,
      moveY,
      isMoving: moveX !== 0 || moveY !== 0,
    };
  }

  setJoystickMode(mode: JoystickMode): void {
    this.joystick.setMode(mode);
  }

  destroy(): void {
    this.joystick.destroy();
  }
}
