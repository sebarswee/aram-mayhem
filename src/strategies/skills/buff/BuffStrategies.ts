import { BuffStrategy, VisualEffectStrategy, SkillExecutionContext } from '../../SkillStrategy';
import { Skill } from '@/types';
import Phaser from 'phaser';

/**
 * 神圣护盾策略 - 提供护盾
 */
export class DivineShieldStrategy implements BuffStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player } = context;

    // 查找护盾效果值
    const shieldEffect = skill.effects?.find(e => e.type === 'shield');
    if (!shieldEffect) return;

    const shieldValue = shieldEffect.value;
    player.addShield(shieldValue);
  }
}

export class DivineShieldVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 护盾光环
    const shield = scene.add.circle(x, y, 35, 0x66aaff, 0.3);
    shield.setStrokeStyle(2, 0x66aaff, 0.8);
    shield.setDepth(48);

    // 扩散效果
    scene.tweens.add({
      targets: shield,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0,
      duration: 500,
      onComplete: () => shield.destroy(),
    });
  }
}

/**
 * 火焰护盾策略 - 护盾 + 反弹伤害
 */
export class FlameShieldStrategy implements BuffStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { player } = context;

    const shieldEffect = skill.effects?.find(e => e.type === 'shield');
    if (shieldEffect) {
      player.addShield(shieldEffect.value);
    }

    const reflectEffect = skill.effects?.find(e => e.type === 'damage_reflect');
    if (reflectEffect) {
      // 使用玩家的 addReflectEffect 方法来正确添加反弹效果
      // value 应该是小数形式 (如 0.3 表示 30%)
      const reflectValue = reflectEffect.value;
      // 如果值大于1，假设它是百分比形式，需要转换
      const normalizedValue = reflectValue > 1 ? reflectValue / 100 : reflectValue;

      if (typeof (player as any).addReflectEffect === 'function') {
        (player as any).addReflectEffect({
          value: normalizedValue,
          duration: reflectEffect.duration || 8000,
        });
      }
    }
  }
}

export class FlameShieldVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 火焰护盾
    const shield = scene.add.circle(x, y, 35, 0xff4400, 0.3);
    shield.setStrokeStyle(3, 0xff6600, 0.8);
    shield.setDepth(48);

    // 火焰粒子
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const flame = scene.add.circle(
        x + Math.cos(angle) * 30,
        y + Math.sin(angle) * 30,
        6,
        0xff8800,
        0.8
      );
      flame.setDepth(49);

      scene.tweens.add({
        targets: flame,
        y: flame.y - 20,
        alpha: 0,
        duration: 400,
        onComplete: () => flame.destroy(),
      });
    }

    scene.tweens.add({
      targets: shield,
      alpha: 0,
      duration: 500,
      onComplete: () => shield.destroy(),
    });
  }
}

/**
 * 岩石皮肤策略 - 提供防御增益
 */
export class StoneSkinStrategy implements BuffStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player } = context;

    // 提供临时防御增益
    const defenseBoost = 20;
    const currentDefense = (player.stats as any).defense || 0;
    (player.stats as any).defense = currentDefense + defenseBoost;

    // 5秒后恢复（使用闭包保存当前值，避免重复扣除）
    const defenseBeforeBoost = currentDefense;
    scene.time.delayedCall(5000, () => {
      (player.stats as any).defense = defenseBeforeBoost;
    });
  }
}

export class StoneSkinVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 岩石纹理效果
    const rocks: Phaser.GameObjects.Graphics[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const rock = scene.add.graphics();
      rock.fillStyle(0x886644, 0.8);
      rock.fillRoundedRect(-6, -6, 12, 12, 3);
      rock.setPosition(x + Math.cos(angle) * 25, y + Math.sin(angle) * 25);
      rock.setDepth(47);
      rocks.push(rock);
    }

    // 消失动画
    scene.tweens.add({
      targets: rocks,
      alpha: 0,
      scale: 0.5,
      duration: 600,
      onComplete: () => rocks.forEach(r => r.destroy()),
    });
  }
}

/**
 * 冰霜护甲策略 - 护盾 + 冰霜光环
 */
export class FrostArmorStrategy implements BuffStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { player } = context;

    const shieldEffect = skill.effects?.find(e => e.type === 'shield');
    if (shieldEffect) {
      player.addShield(shieldEffect.value);
    }

    // 冰霜光环减速附近敌人（由技能系统的 applyEffects 处理）
  }
}

export class FrostArmorVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 冰霜护甲
    const armor = scene.add.circle(x, y, 35, 0x44ccff, 0.3);
    armor.setStrokeStyle(3, 0x88ddff, 0.8);
    armor.setDepth(48);

    // 冰晶装饰
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const crystal = scene.add.graphics();
      crystal.fillStyle(0x88ddff, 0.9);
      crystal.fillTriangle(0, -8, -5, 4, 5, 4);
      crystal.setPosition(x + Math.cos(angle) * 30, y + Math.sin(angle) * 30);
      crystal.setRotation(angle);
      crystal.setDepth(49);

      scene.tweens.add({
        targets: crystal,
        alpha: 0,
        scale: 0.5,
        duration: 500,
        delay: i * 50,
        onComplete: () => crystal.destroy(),
      });
    }

    scene.tweens.add({
      targets: armor,
      alpha: 0,
      duration: 500,
      onComplete: () => armor.destroy(),
    });
  }
}

/**
 * 光环策略 - 持续治疗
 */
export class HaloStrategy implements BuffStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player } = context;

    const healEffect = skill.effects?.find(e => e.type === 'heal');
    if (healEffect) {
      // 持续治疗
      const duration = healEffect.duration || 5000;
      const tickInterval = 1000;
      const healPerTick = healEffect.value / (duration / tickInterval);

      let elapsed = 0;
      const healTimer = scene.time.addEvent({
        delay: tickInterval,
        callback: () => {
          elapsed += tickInterval;
          if (elapsed >= duration) {
            healTimer.destroy();
            return;
          }
          player.heal(healPerTick);
        },
        repeat: Math.floor(duration / tickInterval) - 1,
      });
    }
  }
}

export class HaloVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 光环
    const halo = scene.add.circle(x, y, 40, 0xffcc00, 0.3);
    halo.setStrokeStyle(2, 0xffdd00, 0.6);
    halo.setDepth(45);

    // 光芒
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const ray = scene.add.graphics();
      ray.fillStyle(0xffdd00, 0.5);
      ray.fillRect(-2, 0, 4, 30);
      ray.setPosition(x, y);
      ray.setRotation(angle);
      ray.setDepth(46);

      scene.tweens.add({
        targets: ray,
        scaleX: 1.5,
        alpha: 0,
        duration: 400,
        delay: i * 30,
        onComplete: () => ray.destroy(),
      });
    }

    scene.tweens.add({
      targets: halo,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 500,
      onComplete: () => halo.destroy(),
    });
  }
}

/**
 * 祝福策略 - 属性提升
 */
export class BlessingStrategy implements BuffStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { scene, player } = context;

    // 提供攻击力增益
    const attackBoost = 15;
    const currentAttack = player.stats.attack;
    player.stats.attack = currentAttack + attackBoost;

    // 使用闭包保存增益前的值，避免重复叠加问题
    const attackBeforeBoost = currentAttack;
    scene.time.delayedCall(8000, () => {
      player.stats.attack = attackBeforeBoost;
    });
  }
}

export class BlessingVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 祝福光环
    const blessing = scene.add.circle(x, y - 20, 25, 0xffcc00, 0.5);
    blessing.setDepth(48);

    // 羽毛效果
    for (let i = 0; i < 4; i++) {
      const feather = scene.add.graphics();
      feather.fillStyle(0xffffff, 0.8);
      feather.fillEllipse(0, 0, 4, 10);
      feather.setPosition(x + (i - 1.5) * 15, y - 30);
      feather.setDepth(49);

      scene.tweens.add({
        targets: feather,
        y: feather.y + 40,
        alpha: 0,
        duration: 600,
        delay: i * 100,
        onComplete: () => feather.destroy(),
      });
    }

    scene.tweens.add({
      targets: blessing,
      alpha: 0,
      duration: 500,
      onComplete: () => blessing.destroy(),
    });
  }
}

/**
 * 荆棘策略 - 反弹伤害
 */
export class ThornsStrategy implements BuffStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { player } = context;

    const reflectEffect = skill.effects?.find(e => e.type === 'damage_reflect');
    if (reflectEffect) {
      // 使用玩家的 addReflectEffect 方法来正确添加反弹效果
      // value 应该是小数形式 (如 0.3 表示 30%)
      const reflectValue = reflectEffect.value;
      // 如果值大于1，假设它是百分比形式，需要转换
      const normalizedValue = reflectValue > 1 ? reflectValue / 100 : reflectValue;

      if (typeof (player as any).addReflectEffect === 'function') {
        (player as any).addReflectEffect({
          value: normalizedValue,
          duration: reflectEffect.duration || 8000,
        });
      }
    }
  }
}

export class ThornsVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 荆棘环
    const thorns: Phaser.GameObjects.Graphics[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const thorn = scene.add.graphics();
      thorn.fillStyle(0x44aa44, 0.9);
      thorn.fillTriangle(0, -8, -3, 0, 3, 0);
      thorn.setPosition(x + Math.cos(angle) * 25, y + Math.sin(angle) * 25);
      thorn.setRotation(angle);
      thorn.setDepth(48);
      thorns.push(thorn);
    }

    // 脉动效果
    scene.tweens.add({
      targets: thorns,
      scale: 1.3,
      alpha: 0.5,
      duration: 300,
      yoyo: true,
      repeat: 2,
      onComplete: () => thorns.forEach(t => t.destroy()),
    });
  }
}

/**
 * 净化策略 - 移除负面效果
 */
export class PurifyStrategy implements BuffStrategy {
  execute(skill: Skill, context: SkillExecutionContext): void {
    const { player } = context;

    // 使用玩家的 clearDebuffs 方法清除负面效果
    // Player 类已经有 clearDebuffs() 方法来正确清除状态效果和视觉效果
    if (typeof (player as any).clearDebuffs === 'function') {
      (player as any).clearDebuffs();
    }

    // 恢复生命
    const healEffect = skill.effects?.find(e => e.type === 'heal');
    if (healEffect) {
      player.heal(healEffect.value);
    }
  }
}

export class PurifyVisualStrategy implements VisualEffectStrategy {
  createEffect(scene: Phaser.Scene, x: number, y: number, radius: number, _element?: string): void {
    // 净化光环
    const purify = scene.add.circle(x, y, 40, 0xffffff, 0.4);
    purify.setDepth(48);

    // 光芒扩散
    scene.tweens.add({
      targets: purify,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 600,
      onComplete: () => purify.destroy(),
    });

    // 净化粒子
    for (let i = 0; i < 8; i++) {
      const particle = scene.add.circle(x, y, 4, 0xffffff, 0.8);
      particle.setDepth(49);
      const angle = (i / 8) * Math.PI * 2;

      scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 50,
        y: y + Math.sin(angle) * 50,
        alpha: 0,
        duration: 400,
        delay: i * 30,
        onComplete: () => particle.destroy(),
      });
    }
  }
}
