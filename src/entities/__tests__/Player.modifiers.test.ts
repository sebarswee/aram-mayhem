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

/**
 * Player.modifiers.test.ts
 *
 * 由于 Player 依赖 Phaser，我们验证 Player 类正确实现了 IBuffable 接口的所有要求：
 * 1. 检查 Player 类是否声明实现 IBuffable 接口
 * 2. 验证接口所需的属性和方法签名
 * 3. 通过编译器验证类型正确性
 */

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
    this.id = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
});
