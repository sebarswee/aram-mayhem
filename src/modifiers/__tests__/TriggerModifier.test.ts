// src/modifiers/__tests__/TriggerModifier.test.ts
import { describe, test, expect } from 'vitest';
import {
  TriggerType,
  TriggerModifier,
  createCounterDamageTrigger
} from '../modifiers/TriggerModifier';
import { ModifierType, ModifierOp, StackingPolicy } from '../interfaces/ModifierTypes';

describe('TriggerModifier', () => {
  describe('createCounterDamageTrigger', () => {
    test('should create a counter damage trigger with correct properties', () => {
      const value = 50;
      const maxTriggers = 3;
      const duration = 5000;
      const source = 'test_skill';

      const trigger = createCounterDamageTrigger(value, maxTriggers, duration, source);

      expect(trigger.type).toBe(ModifierType.TRIGGER);
      expect(trigger.triggerType).toBe(TriggerType.ON_HIT);
      expect(trigger.maxTriggers).toBe(maxTriggers);
      expect(trigger.remainingTriggers).toBe(maxTriggers);
      expect(trigger.duration).toBe(duration);
      expect(trigger.remainingTime).toBe(duration);
      expect(trigger.source).toBe(source);
      expect(trigger.value).toBe(value);
      expect(trigger.operation).toBe(ModifierOp.ADD);
      expect(trigger.stacking.policy).toBe(StackingPolicy.SINGLE_INSTANCE);
    });

    test('should have correct trigger effect', () => {
      const trigger = createCounterDamageTrigger(50, 3, 5000, 'test');

      expect(trigger.triggerEffect.type).toBe('damage');
      expect(trigger.triggerEffect.value).toBe(50);
      expect(trigger.triggerEffect.target).toBe('attacker');
    });

    test('should have correct tags', () => {
      const trigger = createCounterDamageTrigger(50, 3, 5000, 'test');

      expect(trigger.tags.has('counter')).toBe(true);
      expect(trigger.tags.has('trigger')).toBe(true);
    });

    test('should generate unique IDs', () => {
      const trigger1 = createCounterDamageTrigger(50, 3, 5000, 'test');
      const trigger2 = createCounterDamageTrigger(50, 3, 5000, 'test');

      expect(trigger1.id).not.toBe(trigger2.id);
    });
  });

  describe('TriggerType enum', () => {
    test('should have all expected trigger types', () => {
      expect(TriggerType.ON_HIT).toBe('on_hit');
      expect(TriggerType.ON_DAMAGE_DEALT).toBe('on_damage_dealt');
      expect(TriggerType.ON_KILL).toBe('on_kill');
      expect(TriggerType.ON_TAKE_DAMAGE).toBe('on_take_damage');
    });
  });

  describe('TriggerModifier interface', () => {
    test('should satisfy Modifier interface', () => {
      const trigger: TriggerModifier = createCounterDamageTrigger(50, 3, 5000, 'test');

      // Check all Modifier properties
      expect(typeof trigger.id).toBe('string');
      expect(trigger.type).toBe(ModifierType.TRIGGER);
      expect(typeof trigger.source).toBe('string');
      expect(trigger.operation).toBeDefined();
      expect(typeof trigger.value).toBe('number');
      expect(typeof trigger.priority).toBe('number');
      expect(typeof trigger.duration).toBe('number');
      expect(typeof trigger.remainingTime).toBe('number');
      expect(trigger.tags).toBeInstanceOf(Set);
      expect(trigger.stacking).toBeDefined();
    });
  });
});
