import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { Rune } from '@/types';

export class RuneSystem {
  private _scene: Phaser.Scene;
  private player: Player;
  private acquiredRunes: Map<string, Rune> = new Map();
  private exclusiveGroups: Map<string, string> = new Map();

  // 基础属性
  private baseStats: Record<string, number> = {
    maxHp: 100,
    attack: 10,
    defense: 5,
    speed: 200,
    critRate: 5,        // 百分比形式 (5 = 5%)
    critDamage: 150,    // 百分比形式 (150 = 150%)
    skillDamageBonus: 0,
    cooldownReduction: 0,
    lifesteal: 0,
  };

  // 保存技能原始冷却
  private baseCooldowns: Map<string, number> = new Map();

  constructor(scene: Phaser.Scene, player: Player) {
    this._scene = scene;
    this.player = player;
  }

  canAcquire(rune: Rune): boolean {
    // 检查互斥组
    if (rune.exclusiveGroup) {
      const currentInGroup = this.exclusiveGroups.get(rune.exclusiveGroup);
      if (currentInGroup && currentInGroup !== rune.id) {
        return false;
      }
    }

    // 检查是否已满级
    const existing = this.acquiredRunes.get(rune.id);
    if (existing && existing.currentLevel && existing.currentLevel >= existing.maxLevel) {
      return false;
    }

    return true;
  }

  acquire(rune: Rune): boolean {
    if (!this.canAcquire(rune)) return false;

    const existing = this.acquiredRunes.get(rune.id);

    if (existing) {
      // 升级现有符文
      existing.currentLevel = (existing.currentLevel || 1) + 1;
      this.reapplyAllRunes();
    } else {
      // 新获得符文
      rune.currentLevel = 1;
      this.acquiredRunes.set(rune.id, { ...rune });

      // 记录互斥组
      if (rune.exclusiveGroup) {
        this.exclusiveGroups.set(rune.exclusiveGroup, rune.id);
      }

      this.reapplyAllRunes();
    }

    return true;
  }

  private reapplyAllRunes(): void {
    // 重置为基础属性
    const stats = { ...this.baseStats };
    stats.currentHp = this.player.stats.currentHp;

    // 应用所有符文
    for (const rune of this.acquiredRunes.values()) {
      this.applyRuneEffects(rune, stats);
    }

    // 更新玩家属性
    this.player.stats.maxHp = Math.floor(stats.maxHp);
    this.player.stats.attack = Math.floor(stats.attack);
    this.player.stats.defense = Math.floor(stats.defense);
    this.player.stats.speed = Math.floor(stats.speed);
    this.player.stats.critRate = stats.critRate / 100; // 转为小数
    this.player.stats.critDamage = stats.critDamage / 100;
    this.player.stats.skillDamageBonus = stats.skillDamageBonus / 100;
    this.player.stats.cooldownReduction = stats.cooldownReduction / 100;
    this.player.stats.lifesteal = stats.lifesteal / 100;

    // 应用冷却减少
    this.applyCooldownReduction(stats.cooldownReduction);
  }

  private applyRuneEffects(rune: Rune, stats: Record<string, number>): void {
    for (const effect of rune.effects) {
      const levelMultiplier = rune.currentLevel || 1;
      const scaledValue = effect.value * levelMultiplier;

      if (effect.type === 'stat_boost' && effect.stat) {
        this.applyStatBoost(effect.stat, scaledValue, effect.isPercent, stats);
      } else if (effect.type === 'skill_enhance') {
        this.applySkillEnhance(rune.id, scaledValue, stats);
      } else if (effect.type === 'passive' && effect.stat) {
        this.applyPassive(effect.stat, scaledValue, stats);
      }
    }
  }

  private applyStatBoost(stat: string, value: number, isPercent: boolean, stats: Record<string, number>): void {
    if (stats[stat] === undefined) return;

    if (isPercent) {
      // 百分比加成（暴击率直接加，其他乘算）
      if (stat === 'critRate') {
        stats[stat] += value;
      } else {
        stats[stat] *= 1 + value / 100;
      }
    } else {
      // 固定值加成
      stats[stat] += value;
    }
  }

  private applySkillEnhance(runeId: string, value: number, stats: Record<string, number>): void {
    if (runeId === 'skill_damage_up') {
      // 技能伤害加成
      stats.skillDamageBonus += value;
    } else if (runeId === 'skill_cooldown_down') {
      // 冷却减少
      stats.cooldownReduction += value;
    }
  }

  private applyPassive(stat: string, value: number, stats: Record<string, number>): void {
    if (stat === 'lifesteal') {
      stats.lifesteal += value;
    }
  }

  private applyCooldownReduction(totalReduction: number): void {
    // 保存原始冷却（首次）
    if (this.baseCooldowns.size === 0) {
      for (const skill of this.player.skills) {
        this.baseCooldowns.set(skill.id, skill.cooldown);
      }
    }

    // 基于原始冷却计算最终冷却
    const reduction = Math.min(totalReduction, 50) / 100; // 最多50%冷却减少
    for (const skill of this.player.skills) {
      const baseCooldown = this.baseCooldowns.get(skill.id) || skill.cooldown;
      skill.cooldown = Math.floor(baseCooldown * (1 - reduction));
    }
  }

  getAcquiredRunes(): Rune[] {
    return Array.from(this.acquiredRunes.values());
  }

  hasRune(runeId: string): boolean {
    return this.acquiredRunes.has(runeId);
  }

  getRuneLevel(runeId: string): number {
    const rune = this.acquiredRunes.get(runeId);
    return rune?.currentLevel || 0;
  }
}
