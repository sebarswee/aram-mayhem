import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { Skill, SkillEnhancer, SkillEnhancement, StatBoost, PlayerStats } from '@/types';
import { SKILL_ENHANCERS, STAT_BOOSTS, getApplicableEnhancers, selectEnhancerByRarity, getRandomStatBoost } from '@/data/skillEnhancers';
import { getRandomUltimate } from '@/data/skills';
import { INITIAL_PLAYER_STATS } from '@/config/balance.config';

/**
 * 技能强化系统
 * 替代原符文系统，处理技能强化、属性提升、大招解锁
 */
export class EnhancementSystem {
  private scene: Phaser.Scene;
  private player: Player;

  // 已获得的强化石等级
  private enhancerLevels: Map<string, number> = new Map();

  // 基础属性（用于重新计算）
  private baseStats: PlayerStats;

  // 已解锁的大招ID列表
  private unlockedUltimates: string[] = [];

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.baseStats = { ...INITIAL_PLAYER_STATS };
  }

  /**
   * 应用技能强化石
   */
  applyEnhancer(enhancer: SkillEnhancer, skillId?: string): boolean {
    // 获取或创建等级记录
    const currentLevel = this.enhancerLevels.get(enhancer.id) || 0;
    if (currentLevel >= enhancer.maxLevel) {
      return false;
    }

    // 更新等级
    this.enhancerLevels.set(enhancer.id, currentLevel + 1);

    // 找到要强化的技能
    const targetSkill = skillId
      ? this.player.skills.find((s) => s.id === skillId)
      : this.findBestSkillForEnhancer(enhancer);

    if (targetSkill) {
      // 添加强化到技能
      const enhancement: SkillEnhancement = {
        id: `${enhancer.id}_${Date.now()}`,
        type: enhancer.type,
        value: enhancer.value,
        source: enhancer.id,
      };
      targetSkill.enhancements.push(enhancement);

      // 应用强化效果
      this.applyEnhancementToSkill(targetSkill, enhancement);
    }

    return true;
  }

  /**
   * 应用属性提升
   */
  applyStatBoost(boost: StatBoost): void {
    if (boost.isPercent) {
      this.player.stats[boost.stat as keyof PlayerStats] *= 1 + boost.value / 100;
    } else {
      this.player.stats[boost.stat as keyof PlayerStats] += boost.value;
    }
  }

  /**
   * 解锁大招
   */
  unlockUltimate(): Skill | null {
    const ultimate = getRandomUltimate(this.unlockedUltimates);
    if (!ultimate) return null;

    this.unlockedUltimates.push(ultimate.id);

    // 克隆大招并添加到玩家技能列表
    const ultimateCopy = {
      ...ultimate,
      effects: [...ultimate.effects],
      enhancements: [],
      baseValues: { ...ultimate.baseValues },
    };

    this.player.skills.push(ultimateCopy);
    this.player.skillCooldowns.set(ultimate.id, 0);

    return ultimateCopy;
  }

  /**
   * 检查大招解锁条件
   */
  shouldUnlockUltimate(currentLevel: number): boolean {
    // 等级5解锁第一个大招
    if (currentLevel === 5 && this.unlockedUltimates.length === 0) {
      return true;
    }
    // 等级10解锁第二个大招
    if (currentLevel === 10 && this.unlockedUltimates.length === 1) {
      return true;
    }
    return false;
  }

  /**
   * 获取已解锁大招数量
   */
  getUnlockedUltimateCount(): number {
    return this.unlockedUltimates.length;
  }

  /**
   * 获取适用于玩家技能的强化石列表
   */
  getApplicableEnhancersForPlayer(): Array<{ enhancer: SkillEnhancer; skillId: string }> {
    const result: Array<{ enhancer: SkillEnhancer; skillId: string }> = [];

    for (const skill of this.player.skills) {
      const applicable = getApplicableEnhancers(skill.categories, skill.elements);
      for (const enhancer of applicable) {
        const currentLevel = this.enhancerLevels.get(enhancer.id) || 0;
        if (currentLevel < enhancer.maxLevel) {
          result.push({ enhancer, skillId: skill.id });
        }
      }
    }

    return result;
  }

  /**
   * 获取可用的属性提升列表
   */
  getAvailableStatBoosts(): StatBoost[] {
    return [...STAT_BOOSTS];
  }

  /**
   * 应用强化效果到技能
   */
  private applyEnhancementToSkill(skill: Skill, enhancement: SkillEnhancement): void {
    switch (enhancement.type) {
      case 'range':
        skill.rangeValue = Math.floor(skill.baseValues.range * (1 + enhancement.value));
        break;

      case 'damage':
        skill.damage = Math.floor(skill.baseValues.damage * (1 + enhancement.value));
        break;

      case 'cooldown':
        skill.cooldown = Math.floor(skill.baseValues.cooldown * (1 - enhancement.value));
        break;

      case 'pierce':
        // 穿透效果在投射物系统中处理
        break;

      case 'split':
        // 分裂效果在投射物系统中处理
        break;

      case 'multicast':
        // 连射效果在技能系统中处理
        break;

      case 'projectile_count':
        skill.baseValues.projectileCount += enhancement.value;
        break;

      case 'effect':
        // 效果附加在碰撞系统中处理
        break;
    }
  }

  /**
   * 找到最适合的技能应用强化
   */
  private findBestSkillForEnhancer(enhancer: SkillEnhancer): Skill | undefined {
    const applicable = this.player.skills.filter((skill) => {
      // 检查类别限制
      if (enhancer.skillCategories) {
        const hasCategory = skill.categories.some((cat) =>
          enhancer.skillCategories!.includes(cat)
        );
        if (!hasCategory) return false;
      }

      // 检查元素排除
      if (enhancer.excludeElements) {
        const hasExcluded = skill.elements.some((el) =>
          enhancer.excludeElements!.includes(el)
        );
        if (hasExcluded) return false;
      }

      return true;
    });

    // 返回第一个可用技能
    return applicable[0];
  }

  /**
   * 计算技能的最终值（考虑所有强化）
   */
  calculateSkillValues(skill: Skill): {
    damage: number;
    range: number;
    projectileCount: number;
    pierce: number;
    multicast: number;
    split: number;
  } {
    let damage = skill.baseValues.damage;
    let range = skill.baseValues.range;
    let projectileCount = skill.baseValues.projectileCount;
    let pierce = 0;
    let multicast = 1;
    let split = 0;

    for (const enhancement of skill.enhancements) {
      switch (enhancement.type) {
        case 'damage':
          damage = Math.floor(skill.baseValues.damage * (1 + enhancement.value));
          break;
        case 'range':
          range = Math.floor(skill.baseValues.range * (1 + enhancement.value));
          break;
        case 'projectile_count':
          projectileCount += enhancement.value;
          break;
        case 'pierce':
          pierce += enhancement.value;
          break;
        case 'multicast':
          multicast = enhancement.value;
          break;
        case 'split':
          split = enhancement.value;
          break;
      }
    }

    return { damage, range, projectileCount, pierce, multicast, split };
  }

  /**
   * 重置系统
   */
  reset(): void {
    this.enhancerLevels.clear();
    this.unlockedUltimates = [];
    this.baseStats = { ...INITIAL_PLAYER_STATS };
  }

  destroy(): void {
    // 清理
  }
}
