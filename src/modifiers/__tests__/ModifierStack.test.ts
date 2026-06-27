// src/modifiers/__tests__/ModifierStack.test.ts
import { describe, test, expect, beforeEach } from 'vitest';
import { ModifierStack } from '../core/ModifierStack';
import {
  Modifier,
  ModifierType,
  ModifierOp,
  ModifierPriority,
  StackingPolicy
} from '../interfaces/ModifierTypes';
import { StatusEffectType, StatusEffectModifier } from '../modifiers/StatusEffectModifier';
import { TriggerType } from '../modifiers/TriggerModifier';
import { IBuffable } from '../interfaces/IBuffable';

// Mock IBuffable
class MockEntity implements IBuffable {
  modifierStack: ModifierStack;
  baseAttributes = {
    attack: 100,
    defense: 50,
    speed: 150
  };
  id = 'test_entity';
  isActive = true;

  addedModifiers: Modifier[] = [];
  removedModifiers: Modifier[] = [];

  constructor() {
    this.modifierStack = new ModifierStack(this);
  }

  updateModifiers(delta: number): void {
    this.modifierStack.update(delta);
  }

  onModifierAdded(modifier: Modifier): void {
    this.addedModifiers.push(modifier);
  }

  onModifierRemoved(modifier: Modifier): void {
    this.removedModifiers.push(modifier);
  }
}

describe('ModifierStack', () => {
  let entity: MockEntity;
  let stack: ModifierStack;

  beforeEach(() => {
    entity = new MockEntity();
    stack = entity.modifierStack;
  });

  describe('Attribute Calculation', () => {
    test('should calculate attribute with ADD operation', () => {
      const mod: Modifier = {
        id: 'test_add',
        type: ModifierType.ATTRIBUTE,
        targetAttribute: 'attack',
        operation: ModifierOp.ADD,
        value: 10,
        priority: ModifierPriority.NORMAL,
        duration: -1,
        remainingTime: -1,
        source: 'test',
        tags: new Set(['test']),
        stacking: { policy: StackingPolicy.INDEPENDENT }
      };

      stack.addModifier(mod);
      expect(stack.getAttributeValue('attack', 100)).toBe(110);
    });

    test('should calculate attribute with MULTIPLY operation', () => {
      const mod: Modifier = {
        id: 'test_multiply',
        type: ModifierType.ATTRIBUTE,
        targetAttribute: 'attack',
        operation: ModifierOp.MULTIPLY,
        value: 1.5, // +50%
        priority: ModifierPriority.NORMAL,
        duration: -1,
        remainingTime: -1,
        source: 'test',
        tags: new Set(['test']),
        stacking: { policy: StackingPolicy.INDEPENDENT }
      };

      stack.addModifier(mod);
      expect(stack.getAttributeValue('attack', 100)).toBe(150);
    });

    test('should calculate attribute with PERCENT_ADD operation', () => {
      const mod: Modifier = {
        id: 'test_percent',
        type: ModifierType.ATTRIBUTE,
        targetAttribute: 'attack',
        operation: ModifierOp.PERCENT_ADD,
        value: 30, // +30%
        priority: ModifierPriority.NORMAL,
        duration: -1,
        remainingTime: -1,
        source: 'test',
        tags: new Set(['test']),
        stacking: { policy: StackingPolicy.INDEPENDENT }
      };

      stack.addModifier(mod);
      expect(stack.getAttributeValue('attack', 100)).toBe(130);
    });

    test('should calculate attribute with OVERRIDE operation', () => {
      const mod: Modifier = {
        id: 'test_override',
        type: ModifierType.ATTRIBUTE,
        targetAttribute: 'attack',
        operation: ModifierOp.OVERRIDE,
        value: 999,
        priority: ModifierPriority.OVERRIDE,
        duration: -1,
        remainingTime: -1,
        source: 'test',
        tags: new Set(['test']),
        stacking: { policy: StackingPolicy.INDEPENDENT }
      };

      stack.addModifier(mod);
      expect(stack.getAttributeValue('attack', 100)).toBe(999);
    });

    test('should apply operations in correct order', () => {
      // Add +20, then multiply by 1.5, then override to 200
      const addMod: Modifier = {
        id: 'add_mod',
        type: ModifierType.ATTRIBUTE,
        targetAttribute: 'attack',
        operation: ModifierOp.ADD,
        value: 20,
        priority: ModifierPriority.NORMAL,
        duration: -1,
        remainingTime: -1,
        source: 'test',
        tags: new Set(['test']),
        stacking: { policy: StackingPolicy.INDEPENDENT }
      };

      const multMod: Modifier = {
        id: 'mult_mod',
        type: ModifierType.ATTRIBUTE,
        targetAttribute: 'attack',
        operation: ModifierOp.MULTIPLY,
        value: 1.5,
        priority: ModifierPriority.HIGH,
        duration: -1,
        remainingTime: -1,
        source: 'test',
        tags: new Set(['test']),
        stacking: { policy: StackingPolicy.INDEPENDENT }
      };

      stack.addModifier(addMod);
      stack.addModifier(multMod);

      // (100 + 20) * 1.5 = 180
      expect(stack.getAttributeValue('attack', 100)).toBe(180);
    });
  });

  describe('Stacking Policies', () => {
    test('should handle INDEPENDENT stacking', () => {
      const mod1: Modifier = {
        id: 'ind_1',
        type: ModifierType.ATTRIBUTE,
        targetAttribute: 'attack',
        operation: ModifierOp.ADD,
        value: 10,
        priority: ModifierPriority.NORMAL,
        duration: -1,
        remainingTime: -1,
        source: 'test',
        tags: new Set(['test']),
        stacking: { policy: StackingPolicy.INDEPENDENT }
      };

      const mod2: Modifier = {
        ...mod1,
        id: 'ind_2'
      };

      stack.addModifier(mod1);
      stack.addModifier(mod2);

      expect(stack.getAttributeValue('attack', 100)).toBe(120);
    });

    test('should handle SINGLE_INSTANCE stacking', () => {
      const mod1: Modifier = {
        id: 'single_1',
        type: ModifierType.ATTRIBUTE,
        targetAttribute: 'attack',
        operation: ModifierOp.ADD,
        value: 10,
        priority: ModifierPriority.NORMAL,
        duration: 5000,
        remainingTime: 5000,
        source: 'test',
        tags: new Set(['test']),
        stacking: { policy: StackingPolicy.SINGLE_INSTANCE }
      };

      const mod2: Modifier = {
        ...mod1,
        duration: 10000,
        remainingTime: 10000
      };

      stack.addModifier(mod1);
      stack.addModifier(mod2);

      // Should only have one instance
      expect(stack.getAttributeValue('attack', 100)).toBe(110);
    });
  });

  describe('Status Effects', () => {
    test('should check status effect presence', () => {
      const mod: StatusEffectModifier = {
        id: 'burn_1',
        type: ModifierType.STATUS_EFFECT,
        effectType: StatusEffectType.BURN,
        operation: ModifierOp.ADD,
        value: 5,
        effectValue: 5,
        duration: 3000,
        remainingTime: 3000,
        priority: ModifierPriority.NORMAL,
        source: 'test',
        tags: new Set(['burn']),
        stacking: { policy: StackingPolicy.INDEPENDENT }
      };

      stack.addModifier(mod);
      expect(stack.hasStatusEffect(StatusEffectType.BURN)).toBe(true);
      expect(stack.getStatusEffectValue(StatusEffectType.BURN)).toBe(5);
    });
  });

  describe('Update and Removal', () => {
    test('should remove expired modifiers', () => {
      const mod: Modifier = {
        id: 'temp_mod',
        type: ModifierType.ATTRIBUTE,
        targetAttribute: 'attack',
        operation: ModifierOp.ADD,
        value: 10,
        priority: ModifierPriority.NORMAL,
        duration: 1000,
        remainingTime: 1000,
        source: 'test',
        tags: new Set(['test']),
        stacking: { policy: StackingPolicy.INDEPENDENT }
      };

      stack.addModifier(mod);
      expect(stack.getAttributeValue('attack', 100)).toBe(110);

      // Update past duration
      stack.update(1500);

      expect(stack.getAttributeValue('attack', 100)).toBe(100);
      expect(entity.removedModifiers.length).toBe(1);
    });
  });
});
