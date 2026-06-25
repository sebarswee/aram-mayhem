import { Skill, SkillEnhancement } from '@/types';

/**
 * 技能值计算器
 */
export interface SkillValueCalculator {
  /**
   * 计算强化后的技能值
   */
  calculate(baseValue: number, enhancement: SkillEnhancement): number;
}

/**
 * 技能值计算策略注册表
 */
export class SkillValueCalculatorRegistry {
  private static instance: SkillValueCalculatorRegistry;
  private calculators: Map<string, SkillValueCalculator> = new Map();

  private constructor() {}

  static getInstance(): SkillValueCalculatorRegistry {
    if (!SkillValueCalculatorRegistry.instance) {
      SkillValueCalculatorRegistry.instance = new SkillValueCalculatorRegistry();
    }
    return SkillValueCalculatorRegistry.instance;
  }

  /**
   * 注册计算器
   */
  register(type: string, calculator: SkillValueCalculator): void {
    this.calculators.set(type, calculator);
  }

  /**
   * 计算
   */
  calculate(type: string, baseValue: number, enhancement: SkillEnhancement): number {
    const calculator = this.calculators.get(type);
    if (calculator) {
      return calculator.calculate(baseValue, enhancement);
    }
    return baseValue;
  }

  /**
   * 检查是否已注册
   */
  hasCalculator(type: string): boolean {
    return this.calculators.has(type);
  }
}

export const skillValueCalculatorRegistry = SkillValueCalculatorRegistry.getInstance();

// ==================== 具体计算器实现 ====================

/**
 * 伤害计算器
 */
export class DamageCalculator implements SkillValueCalculator {
  calculate(baseValue: number, enhancement: SkillEnhancement): number {
    return Math.floor(baseValue * (1 + enhancement.value));
  }
}

/**
 * 范围计算器
 */
export class RangeCalculator implements SkillValueCalculator {
  calculate(baseValue: number, enhancement: SkillEnhancement): number {
    return Math.floor(baseValue * (1 + enhancement.value));
  }
}

/**
 * 投射物数量计算器
 */
export class ProjectileCountCalculator implements SkillValueCalculator {
  calculate(baseValue: number, enhancement: SkillEnhancement): number {
    return baseValue + enhancement.value;
  }
}

/**
 * 穿透计算器
 */
export class PierceCalculator implements SkillValueCalculator {
  calculate(_baseValue: number, enhancement: SkillEnhancement): number {
    return enhancement.value;
  }
}

/**
 * 连射计算器
 */
export class MulticastCalculator implements SkillValueCalculator {
  calculate(_baseValue: number, enhancement: SkillEnhancement): number {
    return enhancement.value;
  }
}

/**
 * 分裂计算器
 */
export class SplitCalculator implements SkillValueCalculator {
  calculate(_baseValue: number, enhancement: SkillEnhancement): number {
    return enhancement.value;
  }
}

/**
 * 初始化技能值计算器
 */
export function initializeSkillValueCalculators(): void {
  skillValueCalculatorRegistry.register('damage', new DamageCalculator());
  skillValueCalculatorRegistry.register('range', new RangeCalculator());
  skillValueCalculatorRegistry.register('projectile_count', new ProjectileCountCalculator());
  skillValueCalculatorRegistry.register('pierce', new PierceCalculator());
  skillValueCalculatorRegistry.register('multicast', new MulticastCalculator());
  skillValueCalculatorRegistry.register('split', new SplitCalculator());
}
