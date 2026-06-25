import { SkillStrategy, VisualEffectStrategy, SkillExecutionContext } from '../../SkillStrategy';
import { Skill } from '@/types';
import { Enemy } from '@/entities/Enemy';
import Phaser from 'phaser';

/**
 * 炎龙吐息策略 - 扇形持续火焰
 */
export class DragonBreathStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const duration = 2000;
    const tickInterval = 200;
    const range = skill.rangeValue;
    const angleSpread = Math.PI / 3;

    const breathGraphics = scene.add.graphics();
    breathGraphics.fillStyle(0xff4400, 0.4);
    breathGraphics.beginPath();
    breathGraphics.moveTo(player.x, player.y);
    breathGraphics.arc(player.x, player.y, range, -angleSpread / 2, angleSpread / 2);
    breathGraphics.closePath();
    breathGraphics.fill();
    breathGraphics.setDepth(40);

    let elapsed = 0;
    const breathTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          breathTimer.destroy();
          breathGraphics.destroy();
          return;
        }

        const enemies = findEnemiesInRange(player.x, player.y, range);
        for (const enemy of enemies) {
          const angle = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
          const playerAngle = (player as any).body?.angle || 0;
          if (Math.abs(Phaser.Math.Angle.Wrap(angle - playerAngle)) < angleSpread / 2) {
            applyDamageToEnemy(enemy, Math.floor(damage * 0.3), skill);
          }
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }
}

export class DragonBreathVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    const breath = scene.add.graphics();
    breath.fillStyle(0xff4400, 0.7);

    const points: { x: number; y: number }[] = [];
    for (let i = -30; i <= 30; i += 5) {
      const angle = (i * Math.PI) / 180;
      points.push({ x: x + Math.cos(angle) * radius, y: y + Math.sin(angle) * radius });
    }
    points.push({ x, y });

    breath.beginPath();
    breath.moveTo(x, y);
    for (const p of points) {
      breath.lineTo(p.x, p.y);
    }
    breath.closePath();
    breath.fillPath();
    breath.setDepth(20);

    scene.tweens.add({
      targets: breath,
      alpha: 0,
      duration: 600,
      onComplete: () => breath.destroy(),
    });
  }
}

/**
 * 烈焰风暴策略 - 持续燃烧区域 + 燃烧扩散机制
 * 燃烧的敌人死亡时，燃烧效果扩散到附近敌人
 */
export class InfernoStrategy implements SkillStrategy {
  private burnSpreadRadius = 80; // 燃烧扩散范围
  private activeInfernos: Set<string> = new Set(); // 跟踪活跃的inferno实例

  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, applyEffects } = context;
    const radius = skill.rangeValue;
    const duration = 5000;
    const tickInterval = 300;

    // 生成唯一实例ID
    const instanceId = `inferno_${Date.now()}_${Math.random()}`;
    this.activeInfernos.add(instanceId);

    // 燃烧扩散配置
    const burnValue = 12; // 燃烧伤害
    const burnDuration = 8000; // 燃烧持续时间

    // 监听敌人死亡事件，实现燃烧扩散
    const deathHandler = (enemy: Enemy) => {
      if (!this.activeInfernos.has(instanceId)) return;

      // 检查敌人是否有来自inferno的燃烧状态
      const hasInfernoBurn = enemy.statusEffects.some(
        (effect) => effect.type === 'burn' && effect.source === 'inferno'
      );

      if (hasInfernoBurn) {
        // 燃烧扩散：在死亡位置寻找附近敌人
        const nearbyEnemies = findEnemiesInRange(enemy.x, enemy.y, this.burnSpreadRadius);

        for (const nearbyEnemy of nearbyEnemies) {
          // 应用燃烧效果
          nearbyEnemy.addStatusEffect({
            type: 'burn',
            value: burnValue,
            duration: burnDuration,
            remainingTime: burnDuration,
            source: 'inferno',
          });
        }

        // 燃烧扩散视觉效果
        const spreadEffect = scene.add.circle(enemy.x, enemy.y, this.burnSpreadRadius, 0xff6600, 0.4);
        spreadEffect.setDepth(25);
        scene.tweens.add({
          targets: spreadEffect,
          alpha: 0,
          scale: 1.5,
          duration: 300,
          onComplete: () => spreadEffect.destroy(),
        });
      }
    };

    // 注册死亡事件监听
    scene.events.on('enemyKilled', deathHandler);

    let elapsed = 0;
    const infernoTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          infernoTimer.destroy();
          // 清理事件监听
          this.activeInfernos.delete(instanceId);
          scene.events.off('enemyKilled', deathHandler);
          return;
        }

        const enemies = findEnemiesInRange(player.x, player.y, radius);
        for (const enemy of enemies) {
          // 应用伤害
          applyDamageToEnemy(enemy, Math.floor(damage * 0.15), skill);
          // 直接添加燃烧状态（标记来源为inferno）
          enemy.addStatusEffect({
            type: 'burn',
            value: burnValue,
            duration: burnDuration,
            remainingTime: burnDuration,
            source: 'inferno',
          });
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }
}

export class InfernoVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    const inferno = scene.add.circle(x, y, radius, 0xff4400, 0.3);
    inferno.setDepth(20);

    scene.time.delayedCall(5000, () => {
      scene.tweens.add({
        targets: inferno,
        alpha: 0,
        duration: 500,
        onComplete: () => inferno.destroy(),
      });
    });
  }
}

/**
 * 深渊漩涡策略 - 持续吸引
 */
export class AbyssVortexStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const centerX = player.x;
    const centerY = player.y;
    const radius = skill.rangeValue;
    const duration = 3000;
    const tickInterval = 200;

    let elapsed = 0;
    const vortexTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          vortexTimer.destroy();
          return;
        }

        const enemies = findEnemiesInRange(centerX, centerY, radius);
        for (const enemy of enemies) {
          // 吸引效果
          const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, centerX, centerY);
          if (enemy.active && enemy.body) {
            enemy.x += Math.cos(angle) * 30;
            enemy.y += Math.sin(angle) * 30;
          }
          applyDamageToEnemy(enemy, Math.floor(damage * 0.2), skill);
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }
}

export class AbyssVortexVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    const vortex = scene.add.circle(x, y, 30, 0x2266cc, 1);
    vortex.setDepth(21);

    const rings: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 3; i++) {
      const ring = scene.add.circle(x, y, radius - i * 30, 0x4488ff, 0.2 - i * 0.05);
      ring.setDepth(20);
      rings.push(ring);
    }

    scene.tweens.add({
      targets: rings,
      angle: 360,
      duration: 1000,
      repeat: 3,
    });

    scene.time.delayedCall(3000, () => {
      scene.tweens.add({
        targets: [vortex, ...rings],
        alpha: 0,
        scale: 0.5,
        duration: 300,
        onComplete: () => {
          vortex.destroy();
          rings.forEach(r => r.destroy());
        },
      });
    });
  }
}

/**
 * 冰封领域策略 - 持续冻结
 */
export class FrozenDomainStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const radius = skill.rangeValue;
    const duration = 4000;
    const tickInterval = 500;

    let elapsed = 0;
    const domainTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          domainTimer.destroy();
          return;
        }

        const enemies = findEnemiesInRange(player.x, player.y, radius);
        for (const enemy of enemies) {
          applyDamageToEnemy(enemy, Math.floor(damage * 0.2), skill);
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }
}

export class FrozenDomainVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    const domain = scene.add.circle(x, y, radius, 0x88ddff, 0.3);
    domain.setDepth(20);

    scene.time.delayedCall(4000, () => {
      scene.tweens.add({
        targets: domain,
        alpha: 0,
        duration: 500,
        onComplete: () => domain.destroy(),
      });
    });
  }
}

/**
 * 绝对零度策略 - 秒杀低血量
 */
export class AbsoluteZeroStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const radius = skill.rangeValue;
    const executeThreshold = 0.10;

    const enemies = findEnemiesInRange(player.x, player.y, radius);
    for (const enemy of enemies) {
      const hpPercent = enemy.currentHp / enemy.maxHp;
      if (hpPercent < executeThreshold) {
        enemy.takeDamage(enemy.currentHp + 1);
      } else {
        applyDamageToEnemy(enemy, damage, skill);
      }
    }
  }
}

export class AbsoluteZeroVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    const core = scene.add.circle(x, y, 50, 0xffffff, 1);
    core.setDepth(21);

    const wave = scene.add.circle(x, y, radius, 0x88ffff, 0.8);
    wave.setDepth(20);

    scene.tweens.add({
      targets: [core, wave],
      scale: 1.5,
      alpha: 0,
      duration: 800,
      onComplete: () => {
        core.destroy();
        wave.destroy();
      },
    });
  }
}

/**
 * 雷霆万钧策略 - 全屏连锁雷击
 */
export class ThunderApocalypseStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const strikeCount = 12;
    const strikeInterval = 200;
    let currentStrike = 0;

    const strikeTimer = scene.time.addEvent({
      delay: strikeInterval,
      callback: () => {
        currentStrike++;
        if (currentStrike > strikeCount) {
          strikeTimer.destroy();
          return;
        }

        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * skill.rangeValue * 0.8;
        const strikeX = player.x + Math.cos(angle) * dist;
        const strikeY = player.y + Math.sin(angle) * dist;

        const enemies = findEnemiesInRange(strikeX, strikeY, 60);
        for (const enemy of enemies) {
          applyDamageToEnemy(enemy, damage, skill);
        }
      },
      repeat: strikeCount - 1,
    });
  }
}

export class ThunderApocalypseVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    const cloud = scene.add.circle(x, y, radius, 0x333355, 0.3);
    cloud.setDepth(20);

    const strikes: Phaser.GameObjects.Graphics[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius * 0.7;
      const strikeX = x + Math.cos(angle) * dist;
      const strikeY = y + Math.sin(angle) * dist;

      const lightning = scene.add.graphics();
      lightning.lineStyle(3, 0xffff00, 1);
      lightning.lineBetween(strikeX, strikeY - 50, strikeX, strikeY);
      lightning.setDepth(21);
      strikes.push(lightning);

      scene.tweens.add({
        targets: lightning,
        alpha: 0,
        delay: i * 100,
        duration: 150,
        onComplete: () => lightning.destroy(),
      });
    }

    scene.time.delayedCall(1000, () => cloud.destroy());
  }
}

/**
 * 审判之光策略 - 伤害+治疗
 */
export class JudgmentLightStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const radius = skill.rangeValue;
    const healAmount = skill.effects.find(e => e.type === 'heal')?.value || 30;

    const enemies = findEnemiesInRange(player.x, player.y, radius);
    for (const enemy of enemies) {
      applyDamageToEnemy(enemy, damage, skill);
    }

    if (enemies.length > 0) {
      scene.time.delayedCall(400, () => {
        player.heal(healAmount);
      });
    }
  }
}

export class JudgmentLightVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    const light = scene.add.circle(x, y, radius, 0xffcc00, 0.4);
    light.setDepth(100);
    scene.tweens.add({
      targets: light,
      alpha: 0,
      scale: 1.3,
      duration: 600,
      onComplete: () => light.destroy(),
    });
  }
}

/**
 * 暗影降临策略 - 降防+持续伤害
 */
export class ShadowDescentStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const radius = skill.rangeValue;
    const duration = 4000;
    const tickInterval = 500;

    let elapsed = 0;
    const shadowTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          shadowTimer.destroy();
          return;
        }

        const enemies = findEnemiesInRange(player.x, player.y, radius);
        for (const enemy of enemies) {
          applyDamageToEnemy(enemy, Math.floor(damage * 0.15), skill);
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });

    // 立即伤害
    const enemies = findEnemiesInRange(player.x, player.y, radius);
    for (const enemy of enemies) {
      applyDamageToEnemy(enemy, damage, skill);
    }
  }
}

export class ShadowDescentVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    const shadow = scene.add.circle(x, y, radius, 0x440066, 0.5);
    shadow.setDepth(20);

    scene.time.delayedCall(4000, () => {
      scene.tweens.add({
        targets: shadow,
        alpha: 0,
        duration: 500,
        onComplete: () => shadow.destroy(),
      });
    });
  }
}

/**
 * 死亡凋零策略 - 持续吸血
 */
export class DeathDecayStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const radius = skill.rangeValue;
    const duration = 5000;
    const tickInterval = 400;
    const lifestealPercent = 0.3;

    let elapsed = 0;
    const decayTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          decayTimer.destroy();
          return;
        }

        const enemies = findEnemiesInRange(player.x, player.y, radius);
        let totalDamage = 0;
        for (const enemy of enemies) {
          const tickDamage = Math.floor(damage * 0.12);
          applyDamageToEnemy(enemy, tickDamage, skill);
          totalDamage += tickDamage;
        }

        if (totalDamage > 0) {
          scene.time.delayedCall(200, () => {
            player.heal(Math.floor(totalDamage * lifestealPercent));
          });
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }
}

export class DeathDecayVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    const decay = scene.add.circle(x, y, radius, 0x440044, 0.4);
    decay.setDepth(20);

    scene.time.delayedCall(5000, () => {
      scene.tweens.add({
        targets: decay,
        alpha: 0,
        duration: 500,
        onComplete: () => decay.destroy(),
      });
    });
  }
}

/**
 * 山崩地裂策略 - 范围伤害+击飞
 */
export class MountainCollapseStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const radius = skill.rangeValue;
    const knockbackDist = 150;

    const enemies = findEnemiesInRange(player.x, player.y, radius);
    for (const enemy of enemies) {
      applyDamageToEnemy(enemy, damage, skill);
      if (enemy.active && enemy.body) {
        const angle = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
        enemy.x += Math.cos(angle) * knockbackDist;
        enemy.y += Math.sin(angle) * knockbackDist;
      }
    }
  }
}

export class MountainCollapseVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    const crack = scene.add.circle(x, y, radius, 0x886644, 0.5);
    crack.setDepth(100);
    scene.tweens.add({
      targets: crack,
      alpha: 0,
      scale: 1.5,
      duration: 600,
      onComplete: () => crack.destroy(),
    });
  }
}

/**
 * 陨石坠落策略 - 大范围爆炸
 */
export class MeteorStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const radius = skill.rangeValue;

    // 延迟爆炸（陨石下落）
    scene.time.delayedCall(500, () => {
      const enemies = findEnemiesInRange(player.x, player.y, radius);
      for (const enemy of enemies) {
        applyDamageToEnemy(enemy, damage, skill);
      }
    });
  }
}

export class MeteorVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 预警
    const warning = scene.add.circle(x, y, radius, 0xff4400, 0.3);
    warning.setDepth(20);

    scene.tweens.add({
      targets: warning,
      alpha: 0.6,
      duration: 200,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        warning.destroy();

        // 爆炸
        const impact = scene.add.circle(x, y, radius, 0xff8800, 0.8);
        impact.setDepth(21);

        const shockwave = scene.add.graphics();
        shockwave.lineStyle(4, 0xffff00, 0.8);
        shockwave.strokeCircle(x, y, radius);
        shockwave.setDepth(23);

        scene.tweens.add({
          targets: impact,
          scale: 1.2,
          alpha: 0,
          duration: 500,
          onComplete: () => impact.destroy(),
        });

        scene.tweens.add({
          targets: shockwave,
          scaleX: 2,
          scaleY: 2,
          alpha: 0,
          duration: 400,
          onComplete: () => shockwave.destroy(),
        });
      },
    });
  }
}

/**
 * 海啸策略 - 全屏推开
 */
export class TsunamiStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const radius = skill.rangeValue;
    const knockbackDist = 200;

    const enemies = findEnemiesInRange(player.x, player.y, radius);
    for (const enemy of enemies) {
      applyDamageToEnemy(enemy, damage, skill);
      if (enemy.active && enemy.body) {
        const angle = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
        enemy.x += Math.cos(angle) * knockbackDist;
        enemy.y += Math.sin(angle) * knockbackDist;
      }
    }
  }
}

export class TsunamiVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    const wave = scene.add.circle(x, y, 20, 0x4488ff, 0.6);
    wave.setDepth(100);
    scene.tweens.add({
      targets: wave,
      scale: radius / 20,
      alpha: 0,
      duration: 800,
      onComplete: () => wave.destroy(),
    });
  }
}

/**
 * 大地震击策略 - 全屏眩晕
 */
 export class EarthquakeStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const radius = skill.rangeValue;

    scene.cameras.main.shake(500, 0.02);

    const enemies = findEnemiesInRange(player.x, player.y, radius);
    for (const enemy of enemies) {
      applyDamageToEnemy(enemy, damage, skill);
    }
  }
}

export class EarthquakeVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    const waves: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 3; i++) {
      const wave = scene.add.circle(x, y, radius * (0.3 + i * 0.3), 0x886644, 0.4 - i * 0.1);
      wave.setDepth(20);
      waves.push(wave);
    }

    scene.tweens.add({
      targets: waves,
      scale: 1.5,
      alpha: 0,
      duration: 500,
      onComplete: () => waves.forEach(w => w.destroy()),
    });
  }
}

/**
 * 过度生长策略 - 全屏缠绕
 */
export class OvergrowthStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const radius = skill.rangeValue;

    const enemies = findEnemiesInRange(player.x, player.y, radius);
    for (const enemy of enemies) {
      applyDamageToEnemy(enemy, damage, skill);
    }
  }
}

export class OvergrowthVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    const vines = scene.add.circle(x, y, radius, 0x44ff44, 0.3);
    vines.setDepth(100);
    scene.tweens.add({
      targets: vines,
      alpha: 0,
      duration: 1000,
      onComplete: () => vines.destroy(),
    });
  }
}

/**
 * 虚空裂隙策略 - 持续吸引+伤害
 */
export class VoidRiftStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const centerX = player.x;
    const centerY = player.y;
    const radius = skill.rangeValue;
    const duration = 3000;
    const tickInterval = 300;

    let elapsed = 0;
    const riftTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          riftTimer.destroy();
          return;
        }

        const enemies = findEnemiesInRange(centerX, centerY, radius);
        for (const enemy of enemies) {
          if (enemy.active && enemy.body) {
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, centerX, centerY);
            enemy.x += Math.cos(angle) * 25;
            enemy.y += Math.sin(angle) * 25;
          }
          applyDamageToEnemy(enemy, Math.floor(damage * 0.25), skill);
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }
}

export class VoidRiftVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    const rift = scene.add.circle(x, y, 40, 0x8800ff, 0.8);
    rift.setDepth(21);

    const rings: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 3; i++) {
      const ring = scene.add.circle(x, y, radius - i * 30, 0x6600aa, 0.3 - i * 0.08);
      ring.setDepth(20);
      rings.push(ring);
    }

    scene.tweens.add({
      targets: rings,
      angle: 360,
      duration: 800,
      repeat: 3,
    });

    scene.time.delayedCall(3000, () => {
      scene.tweens.add({
        targets: [rift, ...rings],
        alpha: 0,
        scale: 0.5,
        duration: 300,
        onComplete: () => {
          rift.destroy();
          rings.forEach(r => r.destroy());
        },
      });
    });
  }
}

/**
 * 黑洞策略 - 持续吸引+伤害
 */
export class BlackHoleStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy, applyLifesteal } = context;
    const centerX = player.x;
    const centerY = player.y;
    const radius = skill.rangeValue;
    const duration = 2000;
    const tickInterval = 300;
    let elapsed = 0;

    const damageTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          damageTimer.destroy();
          return;
        }

        const bodies = scene.physics.overlapCirc(
          centerX, centerY, radius
        ) as Phaser.Physics.Arcade.Body[];

        for (const body of bodies) {
          const obj = body.gameObject;
          if (obj && obj instanceof Enemy && obj.active) {
            const tickDamage = Math.floor(damage * 0.4);
            const skillElement = skill.elements[0] || skill.element;
            obj.takeDamage(tickDamage, skillElement);
            applyLifesteal(tickDamage);

            // 吸引效果
            const angle = Phaser.Math.Angle.Between(obj.x, obj.y, centerX, centerY);
            obj.x += Math.cos(angle) * 20;
            obj.y += Math.sin(angle) * 20;
          }
        }
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }
}

/**
 * 地刺策略 - 伤害+击退
 */
export class GroundSpikeStrategy implements SkillStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player, damage, findEnemiesInRange, applyDamageToEnemy } = context;
    const bodies = scene.physics.overlapCirc(
      player.x, player.y, skill.rangeValue
    ) as Phaser.Physics.Arcade.Body[];

    for (const body of bodies) {
      const obj = body.gameObject;
      if (obj && obj instanceof Enemy && obj.active) {
        applyDamageToEnemy(obj, damage, skill);

        // 击退效果
        const angle = Phaser.Math.Angle.Between(
          player.x, player.y, obj.x, obj.y
        );
        obj.x += Math.cos(angle) * 50;
        obj.y += Math.sin(angle) * 50;
      }
    }
  }
}