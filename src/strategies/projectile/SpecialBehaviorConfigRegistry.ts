import { ProjectileConfig } from '@/entities/Projectile';
import { ParsedBehavior } from '@/systems/SpecialBehaviorRegistry';

/**
 * 特殊行为配置策略接口
 */
export interface SpecialBehaviorConfigStrategy {
  /**
   * 应用行为到投射物配置
   */
  apply(config: ProjectileConfig, parsed: ParsedBehavior): void;
}

/**
 * 特殊行为配置策略注册表
 */
export class SpecialBehaviorConfigRegistry {
  private static instance: SpecialBehaviorConfigRegistry;
  private strategies: Map<string, SpecialBehaviorConfigStrategy> = new Map();

  private constructor() {}

  static getInstance(): SpecialBehaviorConfigRegistry {
    if (!SpecialBehaviorConfigRegistry.instance) {
      SpecialBehaviorConfigRegistry.instance = new SpecialBehaviorConfigRegistry();
    }
    return SpecialBehaviorConfigRegistry.instance;
  }

  /**
   * 注册策略
   */
  register(id: string, strategy: SpecialBehaviorConfigStrategy): void {
    this.strategies.set(id, strategy);
  }

  /**
   * 应用行为
   */
  apply(id: string, config: ProjectileConfig, parsed: ParsedBehavior): void {
    const strategy = this.strategies.get(id);
    if (strategy) {
      strategy.apply(config, parsed);
    }
  }

  /**
   * 检查是否已注册
   */
  hasStrategy(id: string): boolean {
    return this.strategies.has(id);
  }
}

export const specialBehaviorConfigRegistry = SpecialBehaviorConfigRegistry.getInstance();

// ==================== 具体策略实现 ====================

/**
 * 穿透策略
 */
export class PierceConfigStrategy implements SpecialBehaviorConfigStrategy {
  apply(config: ProjectileConfig, parsed: ParsedBehavior): void {
    config.pierceCount = (config.pierceCount || 0) + (parsed.value || 1);
  }
}

/**
 * 分裂策略
 */
export class SplitConfigStrategy implements SpecialBehaviorConfigStrategy {
  apply(config: ProjectileConfig, parsed: ParsedBehavior): void {
    config.splitCount = parsed.value || 2;
  }
}

/**
 * 连锁策略
 */
export class ChainConfigStrategy implements SpecialBehaviorConfigStrategy {
  apply(config: ProjectileConfig, parsed: ParsedBehavior): void {
    config.chainRemaining = parsed.value || 3;
    config.chainRange = config.chainRange || 150;
    config.chainDamageDecay = config.chainDamageDecay || 0.8;
  }
}

/**
 * 增加连锁次数策略
 */
export class ChainAddConfigStrategy implements SpecialBehaviorConfigStrategy {
  apply(config: ProjectileConfig, parsed: ParsedBehavior): void {
    config.chainRemaining = (config.chainRemaining || 0) + (parsed.value || 1);
  }
}

/**
 * 连锁衰减策略
 */
export class ChainDecayConfigStrategy implements SpecialBehaviorConfigStrategy {
  apply(config: ProjectileConfig, parsed: ParsedBehavior): void {
    config.chainDamageDecay = parsed.value || 0.9;
  }
}

/**
 * 连锁范围策略
 */
export class ChainRangeConfigStrategy implements SpecialBehaviorConfigStrategy {
  apply(config: ProjectileConfig, parsed: ParsedBehavior): void {
    config.chainRange = (config.chainRange || 150) * (parsed.value || 1);
  }
}

/**
 * 追踪策略
 */
export class HomingConfigStrategy implements SpecialBehaviorConfigStrategy {
  apply(config: ProjectileConfig, _parsed: ParsedBehavior): void {
    config.isHoming = true;
  }
}

/**
 * 瞬发策略
 */
export class InstantHitConfigStrategy implements SpecialBehaviorConfigStrategy {
  apply(config: ProjectileConfig, _parsed: ParsedBehavior): void {
    config.isInstant = true;
  }
}

/**
 * 命中爆炸策略
 */
export class ExplodeOnHitConfigStrategy implements SpecialBehaviorConfigStrategy {
  apply(config: ProjectileConfig, _parsed: ParsedBehavior): void {
    config.explodeOnHit = true;
    config.explodeRadius = 80;
    config.explodeDamage = 1.0;
  }
}

/**
 * 留下减速区域策略
 */
export class LeaveSlowFieldConfigStrategy implements SpecialBehaviorConfigStrategy {
  apply(config: ProjectileConfig, _parsed: ParsedBehavior): void {
    config.leaveSlowField = true;
    config.slowFieldValue = 0.5;
    config.slowFieldDuration = 3000;
  }
}

/**
 * 破碎效果策略
 */
export class ShatterConfigStrategy implements SpecialBehaviorConfigStrategy {
  apply(config: ProjectileConfig, parsed: ParsedBehavior): void {
    config.shatterMultiplier = parsed.value || 1.5;
  }
}

/**
 * 初始化特殊行为配置策略
 */
export function initializeSpecialBehaviorConfigStrategies(): void {
  specialBehaviorConfigRegistry.register('pierce', new PierceConfigStrategy());
  specialBehaviorConfigRegistry.register('split', new SplitConfigStrategy());
  specialBehaviorConfigRegistry.register('chain', new ChainConfigStrategy());
  specialBehaviorConfigRegistry.register('chain_add', new ChainAddConfigStrategy());
  specialBehaviorConfigRegistry.register('chain_decay', new ChainDecayConfigStrategy());
  specialBehaviorConfigRegistry.register('chain_range', new ChainRangeConfigStrategy());
  specialBehaviorConfigRegistry.register('homing', new HomingConfigStrategy());
  specialBehaviorConfigRegistry.register('instant_hit', new InstantHitConfigStrategy());
  specialBehaviorConfigRegistry.register('explode_on_hit', new ExplodeOnHitConfigStrategy());
  specialBehaviorConfigRegistry.register('leave_slow_field', new LeaveSlowFieldConfigStrategy());
  specialBehaviorConfigRegistry.register('shatter', new ShatterConfigStrategy());
}
