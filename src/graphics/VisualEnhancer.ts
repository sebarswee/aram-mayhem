import Phaser from 'phaser';

/**
 * 视觉效果增强器
 * 为现有的像素风格素材添加更多视觉细节
 */
export class VisualEnhancer {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 创建发光边缘效果
   * 为任何游戏对象添加发光边缘
   */
  addGlowEdge(
    target: Phaser.GameObjects.GameObject & { x: number; y: number },
    color: number = 0x66ccff,
    intensity: number = 0.5
  ): Phaser.GameObjects.Graphics {
    const glow = this.scene.add.graphics();
    glow.lineStyle(3, color, intensity);
    glow.strokeCircle(target.x, target.y, 22);
    glow.setDepth((target as any).depth - 1 || 0);

    // 更新发光跟随目标
    const updateCallback = () => {
      if (!target.active) {
        glow.destroy();
        return;
      }
      glow.clear();
      glow.lineStyle(3, color, intensity);
      glow.strokeCircle(target.x, target.y, 22);
    };
    this.scene.events.on('update', updateCallback);

    return glow;
  }

  /**
   * 创建脉冲发光效果
   */
  addPulsingGlow(
    x: number,
    y: number,
    radius: number,
    color: number,
    duration: number = 1000
  ): Phaser.GameObjects.Arc {
    const glow = this.scene.add.circle(x, y, radius, color, 0.3);
    glow.setDepth(10);

    this.scene.tweens.add({
      targets: glow,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0.1,
      duration: duration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    return glow;
  }

  /**
   * 创建多层叠加效果
   * 用于技能效果，添加深度感
   */
  createLayeredEffect(
    x: number,
    y: number,
    radius: number,
    colors: number[],
    alphas: number[]
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    // 从外到内创建多层
    for (let i = 0; i < colors.length; i++) {
      const layerRadius = radius * (1 - i * 0.2);
      const layer = this.scene.add.circle(0, 0, layerRadius, colors[i], alphas[i]);
      layer.setDepth(i);
      container.add(layer);
    }

    return container;
  }

  /**
   * 创建粒子拖尾效果
   */
  createParticleTrail(
    target: Phaser.GameObjects.GameObject & { x: number; y: number; body?: Phaser.Physics.Arcade.Body },
    color: number,
    particleCount: number = 3,
    interval: number = 100
  ): Phaser.Time.TimerEvent {
    const particles: Phaser.GameObjects.Arc[] = [];

    const timer = this.scene.time.addEvent({
      delay: interval,
      callback: () => {
        if (!target.active) {
          timer.destroy();
          particles.forEach((p) => p.destroy());
          return;
        }

        // 创建新粒子
        const particle = this.scene.add.circle(
          target.x + Phaser.Math.Between(-5, 5),
          target.y + Phaser.Math.Between(-5, 5),
          Phaser.Math.Between(2, 4),
          color,
          0.6
        );
        particle.setDepth((target as any).depth - 1 || 0);
        particles.push(particle);

        // 粒子淡出动画
        this.scene.tweens.add({
          targets: particle,
          alpha: 0,
          scale: 0.3,
          duration: 300,
          onComplete: () => {
            particle.destroy();
            const index = particles.indexOf(particle);
            if (index > -1) particles.splice(index, 1);
          },
        });

        // 限制粒子数量
        while (particles.length > particleCount * 3) {
          const old = particles.shift();
          old?.destroy();
        }
      },
      repeat: -1,
    });

    return timer;
  }

  /**
   * 创建动态阴影
   */
  createDynamicShadow(
    target: Phaser.GameObjects.GameObject & { x: number; y: number },
    offsetY: number = 10
  ): Phaser.GameObjects.Ellipse {
    const shadow = this.scene.add.ellipse(target.x, target.y + offsetY, 30, 12, 0x000000, 0.3);
    shadow.setDepth(-1);

    // 阴影跟随目标
    this.scene.events.on('update', () => {
      if (!target.active) {
        shadow.destroy();
        return;
      }
      shadow.setPosition(target.x, target.y + offsetY);
    });

    return shadow;
  }

  /**
   * 创建击中闪光效果
   */
  createHitFlash(
    target: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image,
    duration: number = 100
  ): void {
    const originalTint = (target as any).tintTopLeft || 0xffffff;

    target.setTint(0xffffff);

    this.scene.time.delayedCall(duration, () => {
      if (target.active) {
        target.setTint(originalTint);
      }
    });
  }

  /**
   * 创建伤害数字弹出效果
   */
  createDamageNumber(
    x: number,
    y: number,
    damage: number,
    isCrit: boolean = false
  ): Phaser.GameObjects.Text {
    const color = isCrit ? '#ffff00' : '#ff4444';
    const size = isCrit ? '24px' : '18px';

    const text = this.scene.add
      .text(x, y, damage.toString(), {
        fontSize: size,
        color: color,
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(200);

    // 弹出动画
    this.scene.tweens.add({
      targets: text,
      y: y - 40,
      alpha: 0,
      scale: isCrit ? 1.5 : 1.2,
      duration: 800,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });

    return text;
  }

  /**
   * 创建屏幕震动效果
   */
  createScreenShake(intensity: number = 0.005, duration: number = 100): void {
    this.scene.cameras.main.shake(duration, intensity);
  }

  /**
   * 创建屏幕闪烁效果
   */
  createScreenFlash(
    color: number = 0xffffff,
    alpha: number = 0.3,
    duration: number = 100
  ): void {
    const flash = this.scene.add.rectangle(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height / 2,
      this.scene.cameras.main.width * 2,
      this.scene.cameras.main.height * 2,
      color,
      alpha
    );
    flash.setScrollFactor(0);
    flash.setDepth(1000);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: duration,
      onComplete: () => flash.destroy(),
    });
  }

  /**
   * 创建技能释放光圈
   */
  createSkillCastRing(
    x: number,
    y: number,
    color: number,
    maxRadius: number = 60
  ): Phaser.GameObjects.Graphics {
    const ring = this.scene.add.graphics();
    ring.lineStyle(3, color, 0.8);
    ring.setDepth(15);

    const targetObj = { r: 0 };
    this.scene.tweens.add({
      targets: targetObj,
      r: maxRadius,
      duration: 300,
      onUpdate: () => {
        const value = targetObj.r;
        ring.clear();
        ring.lineStyle(3, color, 0.8 * (1 - value / maxRadius));
        ring.strokeCircle(x, y, value);
      },
      onComplete: () => ring.destroy(),
    });

    return ring;
  }

  /**
   * 创建能量聚集效果
   */
  createEnergyGather(
    x: number,
    y: number,
    color: number,
    duration: number = 500
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    container.setDepth(20);

    // 创建多个旋转的能量环
    for (let i = 0; i < 3; i++) {
      const ring = this.scene.add.graphics();
      ring.lineStyle(2, color, 0.6);
      ring.strokeCircle(0, 0, 20 + i * 10);
      container.add(ring);

      // 旋转动画
      this.scene.tweens.add({
        targets: ring,
        rotation: Math.PI * 2 * (i % 2 === 0 ? 1 : -1),
        duration: duration,
        ease: 'Power2',
      });
    }

    // 中心发光
    const center = this.scene.add.circle(0, 0, 15, color, 0.5);
    container.add(center);

    this.scene.tweens.add({
      targets: center,
      scale: 1.5,
      alpha: 0.8,
      duration: duration / 2,
      yoyo: true,
    });

    // 自动销毁
    this.scene.time.delayedCall(duration, () => {
      this.scene.tweens.add({
        targets: container,
        alpha: 0,
        scale: 2,
        duration: 200,
        onComplete: () => container.destroy(),
      });
    });

    return container;
  }

  /**
   * 创建元素光环效果
   */
  createElementAura(
    target: Phaser.GameObjects.GameObject & { x: number; y: number },
    element: string,
    radius: number = 40
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(target.x, target.y);
    container.setDepth(-1);

    // 元素颜色映射
    const elementColors: Record<string, number> = {
      fire: 0xff4400,
      water: 0x4488ff,
      ice: 0x88ddff,
      lightning: 0xffff44,
      holy: 0xffdd00,
      shadow: 0x8800ff,
      grass: 0x44ff44,
      earth: 0xaa8844,
    };

    const color = elementColors[element] || 0xffffff;

    // 外环
    const outer = this.scene.add.circle(0, 0, radius, color, 0.15);
    container.add(outer);

    // 内环
    const inner = this.scene.add.circle(0, 0, radius * 0.6, color, 0.25);
    container.add(inner);

    // 脉动动画
    this.scene.tweens.add({
      targets: [outer, inner],
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0.1,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // 跟随目标
    const updateCallback = () => {
      if (!target.active) {
        container.destroy();
        this.scene.events.off('update', updateCallback);
        return;
      }
      container.setPosition(target.x, target.y);
    };
    this.scene.events.on('update', updateCallback);

    return container;
  }

  /**
   * 创建引导线效果
   */
  createGuidingLine(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    color: number = 0x66ccff,
    duration: number = 500
  ): Phaser.GameObjects.Graphics {
    const line = this.scene.add.graphics();
    line.lineStyle(2, color, 0.6);
    line.setDepth(15);

    const targetObj = { p: 0 };
    this.scene.tweens.add({
      targets: targetObj,
      p: 1,
      duration: duration,
      onUpdate: () => {
        const progress = targetObj.p;
        const currentX = startX + (endX - startX) * progress;
        const currentY = startY + (endY - startY) * progress;

        line.clear();
        line.lineStyle(2, color, 0.6 * (1 - progress));
        line.lineBetween(startX, startY, currentX, currentY);
      },
      onComplete: () => line.destroy(),
    });

    return line;
  }

  /**
   * 颜色工具：调亮
   */
  private lighten(color: number, amount: number): number {
    const r = Math.min(255, ((color >> 16) & 0xff) + 255 * amount);
    const g = Math.min(255, ((color >> 8) & 0xff) + 255 * amount);
    const b = Math.min(255, (color & 0xff) + 255 * amount);
    return (r << 16) | (g << 8) | b;
  }

  /**
   * 颜色工具：调暗
   */
  private darken(color: number, amount: number): number {
    const r = Math.max(0, ((color >> 16) & 0xff) * (1 - amount));
    const g = Math.max(0, ((color >> 8) & 0xff) * (1 - amount));
    const b = Math.max(0, (color & 0xff) * (1 - amount));
    return (r << 16) | (g << 8) | b;
  }
}
