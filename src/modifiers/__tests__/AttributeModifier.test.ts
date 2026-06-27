import { describe, test, expect } from 'vitest';
import {
  AttributeModifier,
  createAttackBoostModifier,
  createSpeedBoostModifier
} from '../modifiers/AttributeModifier';
import { ModifierType, ModifierOp, StackingPolicy } from '../interfaces/ModifierTypes';

describe('AttributeModifier', () => {
  describe('createAttackBoostModifier', () => {
    test('should create attack boost modifier with correct properties', () => {
      const modifier = createAttackBoostModifier(15, 10000, 'blessing');

      expect(modifier.type).toBe(ModifierType.ATTRIBUTE);
      expect(modifier.targetAttribute).toBe('attack');
      expect(modifier.operation).toBe(ModifierOp.ADD);
      expect(modifier.value).toBe(15);
      expect(modifier.duration).toBe(10000);
      expect(modifier.remainingTime).toBe(10000);
      expect(modifier.source).toBe('blessing');
      expect(modifier.tags.has('buff')).toBe(true);
      expect(modifier.tags.has('attack')).toBe(true);
      expect(modifier.stacking.policy).toBe(StackingPolicy.INDEPENDENT);
    });

    test('should generate unique IDs', () => {
      const mod1 = createAttackBoostModifier(10, 5000, 'test');
      const mod2 = createAttackBoostModifier(10, 5000, 'test');

      expect(mod1.id).not.toBe(mod2.id);
    });
  });

  describe('createSpeedBoostModifier', () => {
    test('should create speed boost modifier with correct properties', () => {
      const modifier = createSpeedBoostModifier(30, 8000, 'haste');

      expect(modifier.type).toBe(ModifierType.ATTRIBUTE);
      expect(modifier.targetAttribute).toBe('speed');
      expect(modifier.operation).toBe(ModifierOp.PERCENT_ADD);
      expect(modifier.value).toBe(30);
      expect(modifier.duration).toBe(8000);
      expect(modifier.remainingTime).toBe(8000);
      expect(modifier.source).toBe('haste');
      expect(modifier.tags.has('buff')).toBe(true);
      expect(modifier.tags.has('speed')).toBe(true);
      expect(modifier.stacking.policy).toBe(StackingPolicy.INDEPENDENT);
    });
  });
});