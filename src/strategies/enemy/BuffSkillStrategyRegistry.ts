import Phaser from 'phaser';
import { Player, CounterDamageEffect, CounterFreezeEffect } from '@/entities/Player';
import { Skill } from '@/types';
import { createAttackBoostVisualModifier } from '@/modifiers/visual/VisualModifiers';

/**
 * Buff技能执行上下文
 */
export interface BuffSkillContext {
  scene: Phaser.Scene;
  player: Player;
  skill: Skill;
  damage: number;
}

/**
 * Buff技能策略接口
 */
export interface BuffSkillStrategy {
  /**
   * 执行Buff技能
   */
  execute(context: BuffSkillContext): void;
}

/**
 * Buff技能策略注册表
 */
export class BuffSkillStrategyRegistry {
  private static instance: BuffSkillStrategyRegistry;
  private strategies: Map<string, BuffSkillStrategy> = new Map();

  private constructor() {}

  static getInstance(): BuffSkillStrategyRegistry {
    if (!BuffSkillStrategyRegistry.instance) {
      BuffSkillStrategyRegistry.instance = new BuffSkillStrategyRegistry();
    }
    return BuffSkillStrategyRegistry.instance;
  }

  /**
   * 注册Buff技能策略
   */
  register(skillId: string, strategy: BuffSkillStrategy): void {
    this.strategies.set(skillId, strategy);
  }

  /**
   * 执行Buff技能
   */
  execute(skillId: string, context: BuffSkillContext): void {
    const strategy = this.strategies.get(skillId);
    if (strategy) {
      strategy.execute(context);
    }
  }

  /**
   * 检查是否已注册
   */
  hasStrategy(skillId: string): boolean {
    return this.strategies.has(skillId);
  }
}

export const buffSkillStrategyRegistry = BuffSkillStrategyRegistry.getInstance();

// ==================== 具体策略实现 ====================

// 元素颜色映射
const ELEMENT_COLORS: Record<string, number> = {
  fire: 0xff4400,
  water: 0x4488ff,
  ice: 0x88ddff,
  lightning: 0xffff00,
  holy: 0xffcc00,
  shadow: 0x8800ff,
  grass: 0x44ff44,
  earth: 0xaa8844,
  physical: 0xffffff,
};

/**
 * 净化策略 - 清除负面状态
 */
export class PurifyStrategy implements BuffSkillStrategy {
  execute(context: BuffSkillContext): void {
    const { player } = context;
    player.clearDebuffs();
  }
}

/**
 * 光环策略 - 持续治疗
 */
export class HaloStrategy implements BuffSkillStrategy {
  execute(context: BuffSkillContext): void {
    const { scene, player, skill } = context;
    const duration = 5000;
    const tickInterval = 500;
    const healPerTick = skill.effects.find(e => e.type === 'heal')?.value || 5;

    // 光环视觉效果
    const halo = scene.add.circle(player.x, player.y, 40, 0xffcc00, 0.3);
    halo.setStrokeStyle(2, 0xffcc00, 0.6);
    halo.setDepth(48);

    let elapsed = 0;
    const healTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          healTimer.destroy();
          halo.destroy();
          return;
        }
        player.heal(healPerTick);
        halo.setPosition(player.x, player.y);
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }
}

/**
 * 祝福策略 - 提升攻击力和暴击
 */
export class BlessingStrategy implements BuffSkillStrategy {
  execute(context: BuffSkillContext): void {
    const { player } = context;
    player.modifierStack.addModifier(
      createAttackBoostVisualModifier(30, 10000)
    );
  }
}

/**
 * 圣域策略 - 无敌+持续治疗
 */
export class SanctuaryStrategy implements BuffSkillStrategy {
  execute(context: BuffSkillContext): void {
    const { scene, player, skill } = context;
    player.isInvincible = true;
    scene.time.delayedCall(3000, () => {
      player.isInvincible = false;
    });

    // 持续治疗
    const duration = 5000;
    const tickInterval = 500;
    const healPerTick = skill.effects.find(e => e.type === 'heal')?.value || 5;

    const halo = scene.add.circle(player.x, player.y, 40, 0xffcc00, 0.3);
    halo.setStrokeStyle(2, 0xffcc00, 0.6);
    halo.setDepth(48);

    let elapsed = 0;
    const healTimer = scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        elapsed += tickInterval;
        if (elapsed >= duration) {
          healTimer.destroy();
          halo.destroy();
          return;
        }
        player.heal(healPerTick);
        halo.setPosition(player.x, player.y);
      },
      repeat: Math.floor(duration / tickInterval) - 1,
    });
  }
}

/**
 * 大地守护策略 - 巨大护盾
 */
export class EarthGuardianStrategy implements BuffSkillStrategy {
  execute(context: BuffSkillContext): void {
    const { scene, player } = context;
    const guardian = scene.add.circle(player.x, player.y, 50, 0xaa8844, 0.4);
    guardian.setStrokeStyle(3, 0xaa8844, 0.9);
    guardian.setDepth(48);
    scene.tweens.add({
      targets: guardian,
      alpha: 0,
      scale: 1.5,
      duration: 2000,
      onComplete: () => guardian.destroy(),
    });
  }
}

/**
 * 岩石壁垒策略 - 创建岩石墙障碍物
 */
export class StoneSkinStrategy implements BuffSkillStrategy {
  execute(context: BuffSkillContext): void {
    const { scene, player, skill } = context;
    const barrierEffect = skill.effects.find(e => e.type === 'barrier');
    const barrierDuration = barrierEffect?.value || 3000;
    const range = skill.rangeValue || 120;

    // 在玩家前方创建岩石墙
    const barrierX = player.x + range;
    const barrierY = player.y;

    // 岩石墙视觉效果
    const barrier = scene.add.container(barrierX, barrierY);
    barrier.setDepth(45);

    // 创建岩石墙主体（由多个岩石块组成）
    for (let i = 0; i < 5; i++) {
      const offsetX = (Math.random() - 0.5) * 30;
      const offsetY = i * 25 - 50;
      const scale = 0.8 + Math.random() * 0.4;

      const rock = scene.add.rectangle(offsetX, offsetY, 40 * scale, 30 * scale, 0x886644, 0.9);
      rock.setStrokeStyle(2, 0x664422, 1);
      barrier.add(rock);
    }

    // 岩石墙阻挡区域标记
    const barrierZone = scene.add.rectangle(barrierX, barrierY, 50, 100, 0x886644, 0.3);
    barrierZone.setDepth(30);
    barrier.add(barrierZone);

    // 岩石墙消失动画
    scene.time.delayedCall(barrierDuration, () => {
      scene.tweens.add({
        targets: barrier,
        alpha: 0,
        scale: 0.8,
        duration: 300,
        onComplete: () => barrier.destroy(),
      });
    });
  }
}

/**
 * 火焰反击策略 - 受击时反弹固定伤害
 */
export class FlameShieldStrategy implements BuffSkillStrategy {
  execute(context: BuffSkillContext): void {
    const { scene, player, skill } = context;
    const counterEffect = skill.effects.find(e => e.type === 'counter_damage');
    if (!counterEffect) return;

    // 添加反击伤害效果
    player.addCounterDamageEffect({
      value: counterEffect.value,
      duration: counterEffect.duration || 10000,
      maxTriggers: 5,  // 最多触发5次
    });

    // 火焰反击视觉效果（持续光环）
    const flameAura = scene.add.circle(player.x, player.y, 35, 0xff4400, 0.4);
    flameAura.setStrokeStyle(3, 0xff6600, 0.8);
    flameAura.setDepth(48);

    // 跟随玩家
    const followEvent = scene.time.addEvent({
      delay: 50,
      callback: () => {
        if (!player.active || !player.hasCounterDamage()) {
          followEvent.destroy();
          scene.tweens.add({
            targets: flameAura,
            alpha: 0,
            scale: 0.5,
            duration: 200,
            onComplete: () => flameAura.destroy(),
          });
          return;
        }
        flameAura.setPosition(player.x, player.y);
        // 脉动效果
        flameAura.setScale(1 + Math.sin(Date.now() / 200) * 0.1);
      },
      repeat: -1,
    });
  }
}

/**
 * 冰霜屏障策略 - 受击时冻结攻击者
 */
export class FrostArmorStrategy implements BuffSkillStrategy {
  execute(context: BuffSkillContext): void {
    const { scene, player, skill } = context;
    const counterEffect = skill.effects.find(e => e.type === 'counter_freeze');
    if (!counterEffect) return;

    // 添加反击冻结效果
    player.addCounterFreezeEffect({
      duration: counterEffect.value,  // 冻结持续时间
      effectDuration: counterEffect.duration || 8000,
      maxTriggers: 3,  // 最多触发3次
    });

    // 冰霜屏障视觉效果（持续光环）
    const frostAura = scene.add.circle(player.x, player.y, 35, 0x88ddff, 0.4);
    frostAura.setStrokeStyle(3, 0x88ffff, 0.8);
    frostAura.setDepth(48);

    // 跟随玩家
    const followEvent = scene.time.addEvent({
      delay: 50,
      callback: () => {
        if (!player.active || !player.hasCounterFreeze()) {
          followEvent.destroy();
          scene.tweens.add({
            targets: frostAura,
            alpha: 0,
            scale: 0.5,
            duration: 200,
            onComplete: () => frostAura.destroy(),
          });
          return;
        }
        frostAura.setPosition(player.x, player.y);
        // 冰晶闪烁效果
        frostAura.setScale(1 + Math.sin(Date.now() / 300) * 0.05);
      },
      repeat: -1,
    });
  }
}

/**
 * 初始化Buff技能策略
 */
export function initializeBuffSkillStrategies(): void {
  buffSkillStrategyRegistry.register('purify', new PurifyStrategy());
  buffSkillStrategyRegistry.register('halo', new HaloStrategy());
  buffSkillStrategyRegistry.register('blessing', new BlessingStrategy());
  buffSkillStrategyRegistry.register('sanctuary', new SanctuaryStrategy());
  buffSkillStrategyRegistry.register('earth_guardian', new EarthGuardianStrategy());
  buffSkillStrategyRegistry.register('stone_skin', new StoneSkinStrategy());
  buffSkillStrategyRegistry.register('flame_shield', new FlameShieldStrategy());
  buffSkillStrategyRegistry.register('frost_armor', new FrostArmorStrategy());
}
