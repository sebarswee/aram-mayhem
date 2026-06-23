import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { Rune } from '@/types';
import { getRandomRunes } from '@/data/runes';

export class RuneSystem {
  private scene: Phaser.Scene;
  private player: Player;
  private acquiredRunes: Map<string, Rune> = new Map();
  private exclusiveGroups: Map<string, string> = new Map();
  private baseStats: Record<string, number>;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.baseStats = {
      maxHp: 100,
      attack: 10,
      defense: 5,
      speed: 200,
      critRate: 5,
      critDamage: 150,
    };
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
  }

  private applyRuneEffects(rune: Rune, stats: Record<string, number>): void {
    for (const effect of rune.effects) {
      const levelMultiplier = rune.currentLevel || 1;
      const scaledValue = effect.value * levelMultiplier;

      if (effect.type === 'stat_boost' && effect.stat) {
        if (effect.isPercent) {
          if (effect.stat === 'critRate') {
            stats[effect.stat] += scaledValue;
          } else if (stats[effect.stat] !== undefined) {
            stats[effect.stat] *= 1 + scaledValue / 100;
          }
        } else {
          if (stats[effect.stat] !== undefined) {
            stats[effect.stat] += scaledValue;
          }
        }
      }

      // 急速效果
      if (effect.type === 'skill_enhance' && rune.id === 'skill_cooldown_down') {
        this.applyCooldownReduction(scaledValue);
      }
    }
  }

  private applyCooldownReduction(percent: number): void {
    // 更新所有技能冷却
    for (const skill of this.player.skills) {
      const baseCooldown = skill.cooldown;
      skill.cooldown = Math.floor(baseCooldown * (1 - percent / 100));
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
