import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ModifierStack } from '@/modifiers/core/ModifierStack';
import { IBuffable } from '@/modifiers/interfaces/IBuffable';
import {
  Modifier,
  ModifierType,
  ModifierOp,
  ModifierPriority,
  StackingPolicy
} from '@/modifiers/interfaces/ModifierTypes';
import { createBurnVisualModifier } from '@/modifiers/visual/VisualModifiers';

/**
 * Player.modifiers.test.ts
 *
 * 测试策略：
 * 1. 类型检查测试：编译时验证 Player 类正确实现 IBuffable 接口
 * 2. MockPlayer 测试：验证 IBuffable 实现的运行时行为
 */

// ============================================
// 类型检查测试 - 确保编译时接口正确性
// ============================================
// 使用类型导入来验证 Player 正确实现 IBuffable 接口
// 这不会在运行时加载 Phaser，但会在编译时验证类型正确性
import type { Player } from '../Player';

// 编译时类型检查：如果 Player 未正确实现 IBuffable，下面这行会编译失败
// 这是真正的类型安全测试 - 不需要任何运行时代码
type _PlayerImplementsIBuffable = Player extends IBuffable ? true : false;

describe('Player IBuffable Type Check', () => {
  it('should correctly implement IBuffable interface at type level', () => {
    // 类型断言：确保 Player 类正确实现 IBuffable 接口
    // 这个测试主要价值在于编译时验证
    // 如果 Player 未实现 IBuffable，TypeScript 编译器会在类型导入时报错
    // 编译时类型检查 _PlayerImplementsIBuffable 已验证了类型兼容性
    // 运行时我们验证类型声明存在
    const typeCheck: _PlayerImplementsIBuffable = true;
    expect(typeCheck).toBe(true);
  });
});

// 创建一个模拟的 Player 类来测试 IBuffable 实现
// 这避免了 Phaser 依赖问题，同时验证接口实现逻辑
class MockPlayer implements IBuffable {
  readonly modifierStack: ModifierStack;
  readonly id: string;

  private _active: boolean = true;

  // 模拟 Player stats
  stats = {
    maxHp: 100,
    attack: 50,
    defense: 20,
    speed: 150,
    lifesteal: 0,
  };

  constructor() {
    this.id = `player_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    this.modifierStack = new ModifierStack(this);
  }

  get baseAttributes(): Readonly<Record<string, number>> {
    return {
      maxHp: this.stats.maxHp,
      attack: this.stats.attack,
      defense: this.stats.defense,
      speed: this.stats.speed,
      lifesteal: this.stats.lifesteal,
    };
  }

  get isActive(): boolean {
    return this._active;
  }

  setActive(value: boolean): void {
    this._active = value;
  }

  updateModifiers(delta: number): void {
    this.modifierStack.update(delta);
  }

  // 便捷方法：检查是否有特定标签的状态效果
  hasStatusEffect(tag: string): boolean {
    return this.modifierStack.hasTag(tag);
  }

  // 便捷方法：获取计算后的速度
  getEffectiveSpeed(): number {
    const baseSpeed = this.stats.speed;
    return this.modifierStack.getAttributeValue('speed', baseSpeed);
  }

  // 便捷方法：获取计算后的攻击力
  getEffectiveAttack(): number {
    const baseAttack = this.stats.attack;
    return this.modifierStack.getAttributeValue('attack', baseAttack);
  }

  // 可选回调
  onModifierAdded?(modifier: Modifier): void;
  onModifierRemoved?(modifier: Modifier): void;
}

describe('Player - Modifier Integration (IBuffable Implementation)', () => {
  let player: MockPlayer;

  beforeEach(() => {
    player = new MockPlayer();
  });

  describe('IBuffable Interface Implementation', () => {
    it('should have modifierStack property that is instance of ModifierStack', () => {
      expect(player.modifierStack).toBeInstanceOf(ModifierStack);
    });

    it('should have id property with correct format', () => {
      expect(player.id).toBeDefined();
      expect(typeof player.id).toBe('string');
      expect(player.id).toMatch(/^player_/);
    });

    it('should have baseAttributes getter returning correct attributes', () => {
      const attrs = player.baseAttributes;

      // 验证所有必需属性存在
      expect(attrs).toHaveProperty('maxHp');
      expect(attrs).toHaveProperty('attack');
      expect(attrs).toHaveProperty('defense');
      expect(attrs).toHaveProperty('speed');
      expect(attrs).toHaveProperty('lifesteal');

      // 验证属性值正确映射自 stats
      expect(attrs.maxHp).toBe(player.stats.maxHp);
      expect(attrs.attack).toBe(player.stats.attack);
      expect(attrs.defense).toBe(player.stats.defense);
      expect(attrs.speed).toBe(player.stats.speed);
      expect(attrs.lifesteal).toBe(player.stats.lifesteal);
    });

    it('should have isActive property that reflects active state', () => {
      expect(player.isActive).toBe(true);

      player.setActive(false);
      expect(player.isActive).toBe(false);

      player.setActive(true);
      expect(player.isActive).toBe(true);
    });

    it('should have updateModifiers method that is callable', () => {
      expect(typeof player.updateModifiers).toBe('function');
    });
  });

  describe('ModifierStack Integration', () => {
    it('should update modifiers when updateModifiers is called', () => {
      const updateSpy = vi.spyOn(player.modifierStack, 'update');

      player.updateModifiers(16);

      expect(updateSpy).toHaveBeenCalledWith(16);
    });

    it('should accept modifiers and calculate attributes correctly', () => {
      const attackMod: Modifier = {
        id: 'test_attack_boost',
        type: ModifierType.ATTRIBUTE,
        targetAttribute: 'attack',
        operation: ModifierOp.ADD,
        value: 25,
        priority: ModifierPriority.NORMAL,
        duration: -1,
        remainingTime: -1,
        source: 'test_skill',
        tags: new Set(['test']),
        stacking: { policy: StackingPolicy.INDEPENDENT }
      };

      player.modifierStack.addModifier(attackMod);

      const baseAttack = player.stats.attack;
      const modifiedAttack = player.modifierStack.getAttributeValue('attack', baseAttack);

      expect(modifiedAttack).toBe(baseAttack + 25);
    });

    it('should remove expired modifiers after update', () => {
      const tempMod: Modifier = {
        id: 'temp_buff',
        type: ModifierType.ATTRIBUTE,
        targetAttribute: 'speed',
        operation: ModifierOp.ADD,
        value: 50,
        priority: ModifierPriority.NORMAL,
        duration: 1000, // 1 second duration
        remainingTime: 1000,
        source: 'test',
        tags: new Set(['test']),
        stacking: { policy: StackingPolicy.INDEPENDENT }
      };

      player.modifierStack.addModifier(tempMod);

      const baseSpeed = player.stats.speed;
      expect(player.modifierStack.getAttributeValue('speed', baseSpeed)).toBe(baseSpeed + 50);

      // Update past the duration
      player.updateModifiers(1500);

      // Modifier should be removed
      expect(player.modifierStack.getAttributeValue('speed', baseSpeed)).toBe(baseSpeed);
    });
  });

  describe('baseAttributes Immutability', () => {
    it('should return a new object each time (not cached reference)', () => {
      const attrs1 = player.baseAttributes;
      const attrs2 = player.baseAttributes;

      // 应该是不同的对象引用
      expect(attrs1).not.toBe(attrs2);
      // 但值应该相等
      expect(attrs1).toEqual(attrs2);
    });

    it('should reflect stats changes', () => {
      const initialAttrs = player.baseAttributes;

      player.stats.attack = 100;

      const newAttrs = player.baseAttributes;
      expect(newAttrs.attack).toBe(100);
      expect(initialAttrs.attack).toBe(50); // 原始值不变
    });
  });

  describe('Convenience Methods', () => {
    it('should check status effect via hasStatusEffect', () => {
      const modifier = createBurnVisualModifier(10, 3000);
      player.modifierStack.addModifier(modifier);

      expect(player.hasStatusEffect('burn')).toBe(true);
      expect(player.hasStatusEffect('freeze')).toBe(false);
    });

    it('should calculate effective speed with modifiers', () => {
      const baseSpeed = player.stats.speed;

      // 无修饰符时，返回基础速度
      expect(player.getEffectiveSpeed()).toBe(baseSpeed);

      // 添加速度属性修饰符
      const speedMod: Modifier = {
        id: 'test_speed_boost',
        type: ModifierType.ATTRIBUTE,
        targetAttribute: 'speed',
        operation: ModifierOp.ADD,
        value: 30,
        priority: ModifierPriority.NORMAL,
        duration: -1,
        remainingTime: -1,
        source: 'test_skill',
        tags: new Set(['speed_boost', 'buff']),
        stacking: { policy: StackingPolicy.INDEPENDENT }
      };

      player.modifierStack.addModifier(speedMod);
      expect(player.getEffectiveSpeed()).toBe(baseSpeed + 30);
    });

    it('should calculate effective attack with modifiers', () => {
      const baseAttack = player.stats.attack;

      // 无修饰符时，返回基础攻击力
      expect(player.getEffectiveAttack()).toBe(baseAttack);

      // 添加攻击属性修饰符
      const attackMod: Modifier = {
        id: 'test_attack_boost',
        type: ModifierType.ATTRIBUTE,
        targetAttribute: 'attack',
        operation: ModifierOp.PERCENT_ADD,
        value: 50, // +50%
        priority: ModifierPriority.NORMAL,
        duration: -1,
        remainingTime: -1,
        source: 'test_skill',
        tags: new Set(['attack_boost', 'buff']),
        stacking: { policy: StackingPolicy.INDEPENDENT }
      };

      player.modifierStack.addModifier(attackMod);
      expect(player.getEffectiveAttack()).toBe(Math.floor(baseAttack * 1.5));
    });

    it('should return false for hasStatusEffect when no matching tag', () => {
      expect(player.hasStatusEffect('burn')).toBe(false);
      expect(player.hasStatusEffect('freeze')).toBe(false);
      expect(player.hasStatusEffect('poison')).toBe(false);
    });
  });
});
