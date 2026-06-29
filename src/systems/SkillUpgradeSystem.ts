// src/systems/SkillUpgradeSystem.ts
// 技能升级系统 - 处理技能升级选项和应用逻辑

import {
  Skill,
  SkillUpgradeTree,
  SkillUpgradeOption,
  SkillEvolutionBranch,
  SkillEffect
} from '@/types';
import {
  SKILL_UPGRADE_TREES,
  getSkillUpgradeTree,
  hasSkillUpgradeTree
} from '@/data/skillTrees';

export class SkillUpgradeSystem {
  private upgradeTrees: Map<string, SkillUpgradeTree>;

  constructor() {
    this.upgradeTrees = new Map();
    this.loadUpgradeTrees();
  }

  /**
   * 加载所有技能升级树
   */
  private loadUpgradeTrees(): void {
    // 自动加载所有已定义的升级树
    for (const [skillId, tree] of Object.entries(SKILL_UPGRADE_TREES)) {
      this.upgradeTrees.set(skillId, tree);
    }
  }

  /**
   * 获取可升级的技能列表
   * @param skills 玩家的技能列表
   * @returns 可升级的技能数组
   */
  getUpgradableSkills(skills: Skill[]): Skill[] {
    return skills.filter(skill =>
      skill.level < skill.maxLevel &&
      this.upgradeTrees.has(skill.id)
    );
  }

  /**
   * 获取技能的升级选项
   * @param skill 技能对象
   * @returns 升级选项数组（Lv2-4返回2个，Lv5返回3个），如果无法升级返回null
   */
  getUpgradeOptions(skill: Skill): (SkillUpgradeOption | SkillEvolutionBranch)[] | null {
    if (skill.level >= skill.maxLevel) return null;

    const tree = this.upgradeTrees.get(skill.id);
    if (!tree) return null;

    const nextLevel = skill.level + 1;

    if (nextLevel === 5) {
      // Lv5 返回进化分支（三选一）
      return tree.evolutionBranches;
    }

    // Lv2-4 返回升级选项（二选一）
    return tree.upgradeOptions[nextLevel] || null;
  }

  /**
   * 应用升级选项到技能
   * @param skill 技能对象
   * @param optionId 升级选项ID
   * @returns 是否应用成功
   */
  applyUpgrade(skill: Skill, optionId: string): boolean {
    const options = this.getUpgradeOptions(skill);
    if (!options) return false;

    const option = options.find(o => o.id === optionId);
    if (!option) return false;

    // 应用修改器
    if (option.modifiers) {
      this.applyModifiers(skill, option.modifiers);
    }

    // 应用效果增强
    if ('effectAdd' in option && option.effectAdd) {
      skill.effects.push(option.effectAdd as SkillEffect);
    }

    if ('effectBoost' in option && option.effectBoost) {
      this.applyEffectBoost(skill, option.effectBoost);
    }

    // 应用特殊行为
    if (option.specialBehavior) {
      this.applySpecialBehavior(skill, option.specialBehavior);
    }

    // 记录选择
    skill.selectedUpgrades = skill.selectedUpgrades || [];
    skill.selectedUpgrades.push(optionId);
    skill.level++;

    // Lv5 进化处理
    if (skill.level === 5 && 'rarity' in option) {
      skill.evolutionId = optionId;
      // 应用视觉变化
      if (option.visualChange) {
        // TODO: 实现视觉变化
      }
    }

    console.log(`[SkillUpgradeSystem] Skill ${skill.name} upgraded to Lv.${skill.level}, option: ${option.name}`);
    return true;
  }

  /**
   * 应用修改器到技能
   */
  private applyModifiers(
    skill: Skill,
    modifiers: NonNullable<SkillUpgradeOption['modifiers']>
  ): void {
    if (!modifiers) return;

    if (modifiers.damage !== undefined) {
      skill.damage = Math.floor(skill.baseValues.damage * (1 + modifiers.damage));
    }
    if (modifiers.range !== undefined) {
      skill.rangeValue = Math.floor(skill.baseValues.range * (1 + modifiers.range));
    }
    if (modifiers.cooldown !== undefined) {
      skill.cooldown = Math.floor(skill.baseValues.cooldown * (1 + modifiers.cooldown));
    }
    if (modifiers.projectileCount !== undefined) {
      skill.baseValues.projectileCount += modifiers.projectileCount;
    }
    if (modifiers.speed !== undefined && skill.speed) {
      skill.speed = Math.floor(skill.speed * (1 + modifiers.speed));
    }
  }

  /**
   * 应用效果增强
   */
  private applyEffectBoost(
    skill: Skill,
    boost: NonNullable<SkillUpgradeOption['effectBoost']>
  ): void {
    const effect = skill.effects.find(e => e.type === boost.type);
    if (effect) {
      if (boost.valueMultiplier !== undefined && effect.value !== undefined) {
        effect.value = Math.floor(effect.value * boost.valueMultiplier);
      }
      if (boost.durationMultiplier !== undefined && effect.duration !== undefined) {
        effect.duration = Math.floor(effect.duration * boost.durationMultiplier);
      }
    }
  }

  /**
   * 应用特殊行为
   */
  private applySpecialBehavior(skill: Skill, behavior: string): void {
    skill.specialBehaviors = skill.specialBehaviors || [];
    skill.specialBehaviors.push(behavior);
  }

  /**
   * 检查技能是否有升级树
   */
  hasUpgradeTree(skillId: string): boolean {
    return this.upgradeTrees.has(skillId);
  }

  /**
   * 解析特殊行为字符串
   * @param behavior 特殊行为字符串，如 "pierce:2"
   * @returns 行为ID和参数值
   */
  static parseBehavior(behavior: string): { id: string; value?: number } {
    const [id, valueStr] = behavior.split(':');
    return {
      id,
      value: valueStr ? parseFloat(valueStr) : undefined,
    };
  }
}
