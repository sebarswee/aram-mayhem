import Phaser from 'phaser';
import { ObjectPool, ObjectPoolOptions } from './ObjectPool';

/**
 * 视觉效果配置接口
 */
export interface VisualEffectConfig {
  x: number;
  y: number;
  duration?: number;
  [key: string]: any;
}

/**
 * 视觉效果对象池
 *
 * 专门管理技能视觉效果，提供 Container 的复用
 *
 * @template C 配置类型，必须继承 VisualEffectConfig
 */
export class VisualEffectPool<C extends VisualEffectConfig = VisualEffectConfig> extends ObjectPool<Phaser.GameObjects.Container> {
  protected createFn: () => Phaser.GameObjects.Container;
  protected resetFn: (obj: Phaser.GameObjects.Container, config: C) => void;

  constructor(
    scene: Phaser.Scene,
    createFn: () => Phaser.GameObjects.Container,
    resetFn: (obj: Phaser.GameObjects.Container, config: C) => void,
    options: ObjectPoolOptions = {}
  ) {
    // 调用父类构造函数
    super(scene, options);
    this.createFn = createFn;
    this.resetFn = resetFn;
  }

  /**
   * 创建便捷构造方法（向后兼容）
   *
   * @deprecated 使用构造函数直接传递 options
   */
  static create<C extends VisualEffectConfig>(
    scene: Phaser.Scene,
    createFn: () => Phaser.GameObjects.Container,
    resetFn: (obj: Phaser.GameObjects.Container, config: C) => void,
    initialSize: number = 10
  ): VisualEffectPool<C> {
    return new VisualEffectPool(scene, createFn, resetFn, { initialSize });
  }

  protected create(): Phaser.GameObjects.Container {
    return this.createFn();
  }

  protected reset(obj: Phaser.GameObjects.Container): void {
    // 重置由 acquireWithConfig 处理
  }

  /**
   * 获取并配置对象
   */
  acquireWithConfig(config: C): Phaser.GameObjects.Container | null {
    const obj = this.acquire();
    if (obj) {
      this.resetFn(obj, config);
    }
    return obj;
  }

  protected deactivate(obj: Phaser.GameObjects.Container): void {
    obj.setActive(false);
    obj.setVisible(false);
    obj.setPosition(-9999, -9999); // 移出屏幕

    // 停止所有 tweens
    this.scene.tweens.killTweensOf(obj);

    // 清理子对象的 tweens
    obj.list.forEach((child: any) => {
      if (child.active) {
        this.scene.tweens.killTweensOf(child);
      }
    });
  }

  protected destroyObject(obj: Phaser.GameObjects.Container): void {
    if (obj && obj.active) {
      obj.destroy();
    }
  }
}