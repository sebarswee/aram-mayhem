/**
 * 状态效果颜色映射策略
 */

export type StatusEffectType = 'freeze' | 'stun' | 'poison' | 'defense_break' | 'slow' | 'burn';

/**
 * 状态效果颜色注册表
 */
export class StatusEffectColorRegistry {
  private static instance: StatusEffectColorRegistry;
  private colors: Map<StatusEffectType, number> = new Map();

  private constructor() {
    this.initializeDefaultColors();
  }

  static getInstance(): StatusEffectColorRegistry {
    if (!StatusEffectColorRegistry.instance) {
      StatusEffectColorRegistry.instance = new StatusEffectColorRegistry();
    }
    return StatusEffectColorRegistry.instance;
  }

  private initializeDefaultColors(): void {
    this.colors.set('freeze', 0x88ddff);     // 淡蓝色
    this.colors.set('stun', 0xffff88);       // 黄色
    this.colors.set('poison', 0x88ff88);     // 绿色
    this.colors.set('defense_break', 0xff8888); // 红色
    this.colors.set('slow', 0xaaddff);       // 浅蓝灰色
    this.colors.set('burn', 0xffaa44);       // 橙色
  }

  /**
   * 获取状态效果颜色
   */
  getColor(type: StatusEffectType): number | undefined {
    return this.colors.get(type);
  }

  /**
   * 检查是否有颜色映射
   */
  hasColor(type: string): boolean {
    return this.colors.has(type as StatusEffectType);
  }
}

export const statusEffectColorRegistry = StatusEffectColorRegistry.getInstance();

/**
 * 敌人类型缩放映射
 */
export class EnemyTypeScaleRegistry {
  private static instance: EnemyTypeScaleRegistry;
  private scales: Map<string, number> = new Map();

  private constructor() {
    this.initializeDefaultScales();
  }

  static getInstance(): EnemyTypeScaleRegistry {
    if (!EnemyTypeScaleRegistry.instance) {
      EnemyTypeScaleRegistry.instance = new EnemyTypeScaleRegistry();
    }
    return EnemyTypeScaleRegistry.instance;
  }

  private initializeDefaultScales(): void {
    this.scales.set('normal', 1);
    this.scales.set('elite', 1.3);
    this.scales.set('boss', 1.8);
  }

  /**
   * 获取缩放值
   */
  getScale(type: string): number {
    return this.scales.get(type) || 1;
  }
}

export const enemyTypeScaleRegistry = EnemyTypeScaleRegistry.getInstance();
