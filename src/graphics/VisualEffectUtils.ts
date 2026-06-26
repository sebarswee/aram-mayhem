import Phaser from 'phaser';

/**
 * 视觉效果增强工具类
 * 提供丰富的视觉效果生成函数
 */
export class VisualEffectUtils {
  /**
   * 创建粒子爆发效果
   */
  static createParticleBurst(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: {
      count?: number;
      color: number;
      speed?: { min: number; max: number };
      scale?: { start: number; end: number };
      lifespan?: number;
      texture?: string;
      shape?: 'circle' | 'star' | 'spiral' | 'cone';
      angle?: { min: number; max: number };
      depth?: number;
    }
  ): Phaser.GameObjects.Particles.ParticleEmitter {
    const {
      count = 20,
      color,
      speed = { min: 100, max: 250 },
      scale = { start: 0.8, end: 0 },
      lifespan = 600,
      texture = 'particle_glow',
      shape = 'circle',
      angle = { min: 0, max: 360 },
      depth = 30,
    } = config;

    const particles = scene.add.particles(x, y, texture, {
      speed,
      angle,
      scale,
      alpha: { start: 1, end: 0 },
      tint: color,
      lifespan,
      quantity: count,
      emitting: false,
    });
    particles.setDepth(depth);
    particles.explode();

    // 自动清理
    scene.time.delayedCall(lifespan + 100, () => particles.destroy());

    return particles;
  }

  /**
   * 创建多层光环效果
   */
  static createMultiLayerRings(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: {
      radius: number;
      color: number;
      layers?: number;
      duration?: number;
      expanding?: boolean;
      depth?: number;
    }
  ): Phaser.GameObjects.Graphics[] {
    const {
      radius,
      color,
      layers = 3,
      duration = 500,
      expanding = true,
      depth = 25,
    } = config;

    const rings: Phaser.GameObjects.Graphics[] = [];

    for (let i = 0; i < layers; i++) {
      const ring = scene.add.graphics();
      const layerRadius = radius * (0.5 + i * 0.25);
      const alpha = 0.8 - i * 0.2;

      ring.lineStyle(4 - i, color, alpha);
      ring.strokeCircle(0, 0, layerRadius);
      ring.setPosition(x, y);
      ring.setDepth(depth + i);
      rings.push(ring);

      if (expanding) {
        ring.setScale(0.3);
        scene.tweens.add({
          targets: ring,
          scale: 1.5 + i * 0.3,
          alpha: 0,
          duration: duration + i * 100,
          ease: 'Power2',
          onComplete: () => ring.destroy(),
        });
      } else {
        scene.tweens.add({
          targets: ring,
          alpha: 0,
          duration,
          onComplete: () => ring.destroy(),
        });
      }
    }

    return rings;
  }

  /**
   * 创建冲击波效果
   */
  static createShockwave(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: {
      color?: number;
      radius?: number;
      rings?: number;
      duration?: number;
      depth?: number;
    }
  ): void {
    const {
      color = 0xffffff,
      radius = 100,
      rings = 3,
      duration = 400,
      depth = 30,
    } = config;

    for (let i = 0; i < rings; i++) {
      const wave = scene.add.graphics();
      wave.lineStyle(3 - i, color, 1 - i * 0.25);
      wave.strokeCircle(0, 0, 10);
      wave.setPosition(x, y);
      wave.setDepth(depth + i);

      scene.tweens.add({
        targets: wave,
        scale: radius / 10 * (1 + i * 0.3),
        alpha: 0,
        duration: duration + i * 50,
        ease: 'Power2',
        delay: i * 80,
        onComplete: () => wave.destroy(),
      });
    }
  }

  /**
   * 创建能量流动效果
   */
  static createEnergyFlow(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: {
      color: number;
      radius: number;
      particleCount?: number;
      duration?: number;
      depth?: number;
    }
  ): void {
    const {
      color,
      radius,
      particleCount = 12,
      duration = 800,
      depth = 25,
    } = config;

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const startDist = radius * 0.3;
      const endDist = radius;

      const particle = scene.add.circle(
        x + Math.cos(angle) * startDist,
        y + Math.sin(angle) * startDist,
        4,
        color,
        0.9
      );
      particle.setDepth(depth);

      scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * endDist,
        y: y + Math.sin(angle) * endDist,
        alpha: 0,
        scale: 0.5,
        duration,
        delay: i * (duration / particleCount / 2),
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }

  /**
   * 创建元素光晕
   */
  static createElementGlow(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: {
      color: number;
      radius?: number;
      duration?: number;
      pulseCount?: number;
      depth?: number;
    }
  ): Phaser.GameObjects.Container {
    const {
      color,
      radius = 40,
      duration = 600,
      pulseCount = 2,
      depth = 20,
    } = config;

    const container = scene.add.container(x, y);
    container.setDepth(depth);

    // 核心光点
    const core = scene.add.circle(0, 0, radius * 0.3, 0xffffff, 1);
    container.add(core);

    // 中间层
    const mid = scene.add.circle(0, 0, radius * 0.6, color, 0.7);
    container.add(mid);

    // 外层光晕
    const outer = scene.add.circle(0, 0, radius, color, 0.3);
    container.add(outer);

    // 脉动动画
    for (let i = 0; i < pulseCount; i++) {
      scene.time.delayedCall(i * 150, () => {
        const pulse = scene.add.circle(0, 0, radius * 0.5, color, 0.5);
        container.add(pulse);

        scene.tweens.add({
          targets: pulse,
          scale: 1.8,
          alpha: 0,
          duration: duration,
          onComplete: () => pulse.destroy(),
        });
      });
    }

    // 消失动画
    scene.tweens.add({
      targets: container,
      alpha: 0,
      duration: duration * 1.5,
      onComplete: () => container.destroy(),
    });

    return container;
  }

  /**
   * 创建拖尾效果
   */
  static createTrailEffect(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: {
      color: number;
      count?: number;
      duration?: number;
      depth?: number;
    }
  ): Phaser.GameObjects.Container[] {
    const {
      color,
      count = 5,
      duration = 300,
      depth = 35,
    } = config;

    const trails: Phaser.GameObjects.Container[] = [];

    for (let i = 0; i < count; i++) {
      const trail = scene.add.container(x, y);
      trail.setDepth(depth - i);

      const glow = scene.add.circle(0, 0, 15 - i * 2, color, 0.5 - i * 0.1);
      trail.add(glow);

      scene.tweens.add({
        targets: trail,
        alpha: 0,
        scale: 0.5,
        duration: duration - i * 30,
        delay: i * 40,
        onComplete: () => {
          trail.destroy();
        },
      });

      trails.push(trail);
    }

    return trails;
  }

  /**
   * 创建螺旋粒子效果
   */
  static createSpiralParticles(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: {
      color: number;
      radius: number;
      count?: number;
      duration?: number;
      depth?: number;
    }
  ): void {
    const {
      color,
      radius,
      count = 20,
      duration = 800,
      depth = 25,
    } = config;

    for (let i = 0; i < count; i++) {
      const progress = i / count;
      const spiralAngle = progress * Math.PI * 4; // 两圈螺旋
      const spiralRadius = radius * progress;

      const particle = scene.add.circle(
        x + Math.cos(spiralAngle) * spiralRadius,
        y + Math.sin(spiralAngle) * spiralRadius,
        3 + (1 - progress) * 4,
        color,
        0.8
      );
      particle.setDepth(depth);

      scene.tweens.add({
        targets: particle,
        alpha: 0,
        scale: 0,
        duration: duration * (1 - progress * 0.5),
        delay: i * 20,
        onComplete: () => particle.destroy(),
      });
    }
  }

  /**
   * 创建星形爆发效果
   */
  static createStarBurst(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: {
      color: number;
      rays?: number;
      radius?: number;
      duration?: number;
      depth?: number;
    }
  ): void {
    const {
      color,
      rays = 8,
      radius = 80,
      duration = 400,
      depth = 30,
    } = config;

    for (let i = 0; i < rays; i++) {
      const angle = (i / rays) * Math.PI * 2;

      const ray = scene.add.graphics();
      ray.fillStyle(color, 0.8);
      ray.fillTriangle(0, 0, -8, radius, 8, radius);
      ray.setPosition(x, y);
      ray.setRotation(angle);
      ray.setDepth(depth);

      scene.tweens.add({
        targets: ray,
        scaleX: 0,
        scaleY: 1.5,
        alpha: 0,
        duration,
        delay: i * 20,
        onComplete: () => ray.destroy(),
      });
    }
  }

  /**
   * 创建光环脉动效果
   */
  static createPulsingAura(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: {
      color: number;
      radius: number;
      duration?: number;
      pulseCount?: number;
      depth?: number;
    }
  ): Phaser.GameObjects.Container {
    const {
      color,
      radius,
      duration = 5000,
      pulseCount = -1,
      depth = 20,
    } = config;

    const container = scene.add.container(x, y);
    container.setDepth(depth);

    // 外圈
    const outer = scene.add.circle(0, 0, radius, color, 0.15);
    outer.setStrokeStyle(2, color, 0.5);
    container.add(outer);

    // 中圈
    const mid = scene.add.circle(0, 0, radius * 0.7, color, 0.1);
    mid.setStrokeStyle(1, color, 0.3);
    container.add(mid);

    // 内圈
    const inner = scene.add.circle(0, 0, radius * 0.4, color, 0.08);
    container.add(inner);

    // 脉动动画
    scene.tweens.add({
      targets: [outer, mid],
      scaleX: 1.1,
      scaleY: 1.1,
      alpha: { from: 0.2, to: 0.4 },
      duration: 800,
      yoyo: true,
      repeat: pulseCount,
    });

    // 内圈反向脉动
    scene.tweens.add({
      targets: inner,
      scaleX: 0.9,
      scaleY: 0.9,
      alpha: { from: 0.1, to: 0.2 },
      duration: 600,
      yoyo: true,
      repeat: pulseCount,
    });

    // 设置定时销毁
    if (duration > 0) {
      scene.time.delayedCall(duration, () => {
        scene.tweens.add({
          targets: container,
          alpha: 0,
          duration: 300,
          onComplete: () => container.destroy(),
        });
      });
    }

    return container;
  }

  /**
   * 创建锥形范围效果
   */
  static createConeEffect(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: {
      color: number;
      angle: number;
      radius: number;
      duration?: number;
      depth?: number;
    }
  ): Phaser.GameObjects.Graphics {
    const {
      color,
      angle,
      radius,
      duration = 500,
      depth = 25,
    } = config;

    const cone = scene.add.graphics();
    cone.fillStyle(color, 0.5);
    cone.beginPath();
    cone.moveTo(x, y);
    cone.arc(x, y, radius, -angle / 2, angle / 2);
    cone.closePath();
    cone.fill();
    cone.setDepth(depth);

    scene.tweens.add({
      targets: cone,
      alpha: 0,
      duration,
      onComplete: () => cone.destroy(),
    });

    return cone;
  }

  /**
   * 创建闪电效果
   */
  static createLightningEffect(
    scene: Phaser.Scene,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    config: {
      color?: number;
      width?: number;
      segments?: number;
      jitter?: number;
      duration?: number;
      depth?: number;
    }
  ): Phaser.GameObjects.Graphics {
    const {
      color = 0xffff00,
      width = 4,
      segments = 6,
      jitter = 15,
      duration = 200,
      depth = 45,
    } = config;

    const lightning = scene.add.graphics();
    lightning.lineStyle(width, color, 1);
    lightning.setDepth(depth);

    // 绘制锯齿状闪电
    lightning.beginPath();
    lightning.moveTo(startX, startY);

    const dx = (endX - startX) / segments;
    const dy = (endY - startY) / segments;

    for (let i = 1; i < segments; i++) {
      const px = startX + dx * i + (Math.random() - 0.5) * jitter;
      const py = startY + dy * i + (Math.random() - 0.5) * jitter;
      lightning.lineTo(px, py);
    }

    lightning.lineTo(endX, endY);
    lightning.strokePath();

    // 闪烁效果
    scene.tweens.add({
      targets: lightning,
      alpha: 0,
      duration,
      yoyo: true,
      repeat: 2,
      onComplete: () => lightning.destroy(),
    });

    return lightning;
  }

  /**
   * 创建持续粒子区域
   */
  static createParticleZone(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: {
      color: number;
      radius: number;
      duration?: number;
      particleRate?: number;
      depth?: number;
    }
  ): Phaser.GameObjects.Particles.ParticleEmitter {
    const {
      color,
      radius,
      duration = 3000,
      particleRate = 50,
      depth = 22,
    } = config;

    const particles = scene.add.particles(x, y, 'particle_glow', {
      speed: { min: 20, max: 60 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: color,
      lifespan: 1500,
      frequency: particleRate,
      quantity: 2,
      emitZone: {
        type: 'random' as const,
        source: new Phaser.Geom.Circle(0, 0, radius) as Phaser.Types.GameObjects.Particles.RandomZoneSource,
      },
    });
    particles.setDepth(depth);

    // 定时停止
    scene.time.delayedCall(duration, () => {
      particles.stop();
      scene.tweens.add({
        targets: particles,
        alpha: 0,
        duration: 500,
        onComplete: () => particles.destroy(),
      });
    });

    return particles;
  }

  /**
   * 创建旋转能量环
   */
  static createRotatingRings(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: {
      color: number;
      radius: number;
      ringCount?: number;
      duration?: number;
      rotationSpeed?: number;
      depth?: number;
    }
  ): Phaser.GameObjects.Container {
    const {
      color,
      radius,
      ringCount = 3,
      duration = 2000,
      rotationSpeed = 1000,
      depth = 25,
    } = config;

    const container = scene.add.container(x, y);
    container.setDepth(depth);

    for (let i = 0; i < ringCount; i++) {
      const ring = scene.add.graphics();
      ring.lineStyle(3 - i, color, 0.8 - i * 0.2);
      ring.strokeCircle(0, 0, radius - i * 15);
      ring.setAngle(i * 30); // 错开角度
      container.add(ring);

      // 不同方向旋转
      scene.tweens.add({
        targets: ring,
        angle: i % 2 === 0 ? 360 : -360,
        duration: rotationSpeed + i * 200,
        repeat: -1,
      });
    }

    // 定时销毁
    scene.time.delayedCall(duration, () => {
      scene.tweens.add({
        targets: container,
        alpha: 0,
        scale: 0.5,
        duration: 300,
        onComplete: () => container.destroy(),
      });
    });

    return container;
  }

  /**
   * 屏幕震动效果包装器
   */
  static screenShake(
    scene: Phaser.Scene,
    config: {
      intensity?: number;
      duration?: number;
    }
  ): void {
    const { intensity = 0.01, duration = 200 } = config;
    scene.cameras.main.shake(duration, intensity);
  }

  /**
   * 屏幕闪光效果
   */
  static screenFlash(
    scene: Phaser.Scene,
    config: {
      color?: number;
      intensity?: number;
      duration?: number;
    }
  ): void {
    const { color = 0xffffff, intensity = 0.3, duration = 150 } = config;

    const flash = scene.add.rectangle(
      scene.scale.width / 2,
      scene.scale.height / 2,
      scene.scale.width * 2,
      scene.scale.height * 2,
      color,
      intensity
    );
    flash.setScrollFactor(0);
    flash.setDepth(200);

    scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration,
      onComplete: () => flash.destroy(),
    });
  }

  /**
   * 创建弧形能量波
   */
  static createArcWave(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: {
      color: number;
      startAngle: number;
      arcAngle: number;
      radius: number;
      duration?: number;
      depth?: number;
    }
  ): Phaser.GameObjects.Graphics {
    const {
      color,
      startAngle,
      arcAngle,
      radius,
      duration = 400,
      depth = 25,
    } = config;

    const arc = scene.add.graphics();
    arc.lineStyle(6, color, 0.8);
    arc.beginPath();
    arc.arc(x, y, radius, startAngle, startAngle + arcAngle, false);
    arc.strokePath();
    arc.setDepth(depth);

    scene.tweens.add({
      targets: arc,
      alpha: 0,
      scale: 1.5,
      duration,
      onComplete: () => arc.destroy(),
    });

    return arc;
  }

  /**
   * 创建光柱效果
   */
  static createLightPillar(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: {
      color: number;
      width?: number;
      height?: number;
      duration?: number;
      depth?: number;
    }
  ): Phaser.GameObjects.Container {
    const {
      color,
      width = 40,
      height = 200,
      duration = 600,
      depth = 40,
    } = config;

    const container = scene.add.container(x, y);
    container.setDepth(depth);

    // 外层光柱
    const outer = scene.add.rectangle(0, 0, width, height, color, 0.3);
    container.add(outer);

    // 中层光柱
    const mid = scene.add.rectangle(0, 0, width * 0.7, height, color, 0.5);
    container.add(mid);

    // 内层光柱
    const inner = scene.add.rectangle(0, 0, width * 0.4, height, 0xffffff, 0.7);
    container.add(inner);

    // 光柱扩展动画
    container.setScale(0, 0);
    scene.tweens.add({
      targets: container,
      scaleX: 1,
      scaleY: 1,
      duration: 150,
      ease: 'Power2',
      onComplete: () => {
        scene.tweens.add({
          targets: container,
          alpha: 0,
          scaleX: 1.5,
          duration: duration - 150,
          onComplete: () => container.destroy(),
        });
      },
    });

    return container;
  }

  /**
   * 创建元素颜色映射
   */
  static getElementColors(): Record<string, { primary: number; secondary: number; glow: number }> {
    return {
      fire: { primary: 0xff4400, secondary: 0xff8800, glow: 0xff2200 },
      water: { primary: 0x4488ff, secondary: 0x66aaff, glow: 0x2266cc },
      ice: { primary: 0x88ddff, secondary: 0xaaeeff, glow: 0x44ccff },
      lightning: { primary: 0xffff00, secondary: 0xffff88, glow: 0xcccc00 },
      holy: { primary: 0xffcc00, secondary: 0xffdd44, glow: 0xddaa00 },
      shadow: { primary: 0x8800ff, secondary: 0xaa44ff, glow: 0x6600cc },
      grass: { primary: 0x44ff44, secondary: 0x88ff88, glow: 0x22cc22 },
      earth: { primary: 0xaa8844, secondary: 0xccaa66, glow: 0x886622 },
    };
  }
}