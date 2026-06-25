import { SkillStrategy, VisualEffectStrategy, SkillExecutionContext } from '../../../SkillStrategy';
import { Skill } from '@/types';
import { Enemy } from '@/entities/Enemy';
import Phaser from 'phaser';

/**
 * 电磁脉冲策略 - 环形扩散
 * 以玩家为中心释放脉冲波，对环形路径上的敌人造成伤害
 */
export class ArcLightningStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const range = skill.rangeValue;
    const pulseWidth = 40;
    const hitEnemies = new Set<string>();

    // 脉冲环
    const pulse = scene.add.circle(player.x, player.y, 20, 0xffff00, 0.6);
    pulse.setStrokeStyle(4, 0xffffff, 0.8);
    pulse.setDepth(100);

    scene.tweens.add({
      targets: pulse,
      radius: range,
      alpha: 0,
      duration: 600,
      onUpdate: () => {
        const currentRadius = (pulse as any).radius;
        const enemies = findEnemiesInRange(player.x, player.y, currentRadius + pulseWidth);
        for (const enemy of enemies) {
          const dist = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
          if (dist >= currentRadius - pulseWidth && dist <= currentRadius + pulseWidth) {
            if (!hitEnemies.has(enemy.instanceId)) {
              hitEnemies.add(enemy.instanceId);
              applyDamageToEnemy(enemy, damage, skill);
            }
          }
        }
      },
      onComplete: () => pulse.destroy(),
    });
  }
}

/**
 * 电磁脉冲视觉效果策略
 */
export class ArcLightningVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    const pulse = scene.add.circle(x, y, 20, 0xffff00, 0.6);
    pulse.setStrokeStyle(4, 0xffffff, 0.8);
    pulse.setDepth(100);

    scene.tweens.add({
      targets: pulse,
      radius: radius,
      alpha: 0,
      duration: 600,
      onComplete: () => pulse.destroy(),
    });
  }
}

/**
 * 电荷积累策略 - 叠加机制
 * 对范围内敌人施加电荷，3层时爆发大量伤害
 */
export class StaticFieldStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const range = skill.rangeValue;
    const maxStacks = 3;
    const enemies = findEnemiesInRange(player.x, player.y, range);
    if (enemies.length === 0) return;

    // 电弧视觉
    const arc = scene.add.graphics();
    arc.lineStyle(2, 0xffff00, 0.8);
    arc.setDepth(99);

    let prevX = player.x;
    let prevY = player.y;

    enemies.forEach((enemy: Enemy) => {
      arc.lineBetween(prevX, prevY, enemy.x, enemy.y);
      prevX = enemy.x;
      prevY = enemy.y;

      if (!(enemy as any).chargeStacks) (enemy as any).chargeStacks = 0;
      (enemy as any).chargeStacks++;

      const chargeText = scene.add.text(enemy.x, enemy.y - 30, `⚡${(enemy as any).chargeStacks}`, {
        fontSize: '14px',
        color: '#ffff00',
      });
      chargeText.setOrigin(0.5);
      chargeText.setDepth(100);

      if ((enemy as any).chargeStacks >= maxStacks) {
        const burst = scene.add.circle(enemy.x, enemy.y, 50, 0xffff00, 0.8);
        burst.setDepth(101);
        applyDamageToEnemy(enemy, damage * 2, skill);
        (enemy as any).chargeStacks = 0;

        scene.tweens.add({
          targets: [burst, chargeText],
          alpha: 0,
          scale: 1.5,
          duration: 200,
          onComplete: () => {
            burst.destroy();
            chargeText.destroy();
          },
        });
      } else {
        scene.time.delayedCall(500, () => chargeText.destroy());
      }

      applyDamageToEnemy(enemy, damage * 0.5, skill);
    });

    scene.time.delayedCall(200, () => arc.destroy());
  }
}

/**
 * 暗影分身策略 - 分身机制
 * 在当前位置留下暗影分身，吸引敌人攻击
 */
export class ShadowStepStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;

    const clone = scene.add.container(player.x, player.y);
    clone.setDepth(40);

    const body = scene.add.circle(0, 0, 15, 0x8800ff, 0.7);
    const glow = scene.add.circle(0, 0, 20, 0x6600aa, 0.4);
    clone.add([glow, body]);

    scene.tweens.add({
      targets: clone,
      alpha: 0.5,
      scale: 1.1,
      duration: 300,
      yoyo: true,
      repeat: -1,
    });

    const cloneDuration = 3000;
    const attractTimer = scene.time.addEvent({
      delay: 200,
      callback: () => {
        const enemies = findEnemiesInRange(clone.x, clone.y, 80);
        for (const enemy of enemies) {
          const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, clone.x, clone.y);
          if (enemy.active && enemy.body) {
            enemy.x += Math.cos(angle) * 10;
            enemy.y += Math.sin(angle) * 10;
          }
        }
      },
      repeat: cloneDuration / 200 - 1,
    });

    scene.time.delayedCall(cloneDuration, () => {
      attractTimer.destroy();
      scene.tweens.add({
        targets: clone,
        alpha: 0,
        scale: 0.5,
        duration: 300,
        onComplete: () => clone.destroy(),
      });
    });
  }
}

/**
 * 暗影分身视觉效果策略
 */
export class ShadowStepVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, _radius: number, _element?: string): void {
    const clone = scene.add.container(x, y);
    clone.setDepth(40);

    const body = scene.add.circle(0, 0, 15, 0x8800ff, 0.7);
    const glow = scene.add.circle(0, 0, 20, 0x6600aa, 0.4);
    clone.add([glow, body]);

    scene.tweens.add({
      targets: clone,
      alpha: 0.5,
      scale: 1.1,
      duration: 300,
      yoyo: true,
      repeat: -1,
    });

    scene.time.delayedCall(3000, () => {
      scene.tweens.add({
        targets: clone,
        alpha: 0,
        scale: 0.5,
        duration: 300,
        onComplete: () => clone.destroy(),
      });
    });
  }
}

/**
 * 火焰射线策略 - 持续射线伤害
 * 持续2秒跟踪最近敌人的火焰射线
 */
export class IgniteStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const range = skill.rangeValue;
    const duration = 2000;
    const tickInterval = 150;
    const rayWidth = 30;

    const ray = scene.add.graphics();
    ray.setDepth(40);

    let elapsed = 0;
    const rayTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          rayTimer.destroy();
          ray.destroy();
          return;
        }

        // 找最近敌人
        const enemies = findEnemiesInRange(player.x, player.y, range + 100);
        let currentTarget: Enemy | null = null;
        let minDist = Infinity;
        for (const enemy of enemies) {
          const dist = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
          if (dist < minDist) {
            minDist = dist;
            currentTarget = enemy;
          }
        }

        const targetAngle = currentTarget
          ? Phaser.Math.Angle.Between(player.x, player.y, currentTarget.x, currentTarget.y)
          : 0;

        ray.clear();
        ray.lineStyle(rayWidth, 0xff4400, 0.6);
        ray.lineBetween(
          player.x, player.y,
          player.x + Math.cos(targetAngle) * range,
          player.y + Math.sin(targetAngle) * range
        );

        // 对射线上的敌人造成伤害
        const enemiesInRange = findEnemiesInRange(player.x, player.y, range);
        for (const enemy of enemiesInRange) {
          const enemyAngle = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
          const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(enemyAngle - targetAngle));
          if (angleDiff < 0.2) {
            applyDamageToEnemy(enemy, damage, skill);
          }
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }
}

/**
 * 火焰射线视觉效果策略
 */
export class IgniteVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    const ray = scene.add.graphics();
    ray.lineStyle(30, 0xff4400, 0.6);
    ray.lineBetween(x, y, x + radius, y);
    ray.setDepth(40);

    scene.tweens.add({
      targets: ray,
      alpha: 0,
      duration: 2000,
      onComplete: () => ray.destroy(),
    });
  }
}