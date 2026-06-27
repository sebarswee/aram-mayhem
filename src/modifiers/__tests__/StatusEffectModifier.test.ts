import { describe, test, expect } from 'vitest';
import {
  StatusEffectType,
  createBurnEffect,
  createSlowEffect
} from '../modifiers/StatusEffectModifier';
import { ModifierType, ModifierOp, StackingPolicy } from '../interfaces/ModifierTypes';

describe('StatusEffectModifier', () => {
  describe('StatusEffectType enum', () => {
    test('should have DoT effect types', () => {
      expect(StatusEffectType.BURN).toBe('burn');
      expect(StatusEffectType.POISON).toBe('poison');
    });

    test('should have control effect types', () => {
      expect(StatusEffectType.FREEZE).toBe('freeze');
      expect(StatusEffectType.STUN).toBe('stun');
      expect(StatusEffectType.ROOT).toBe('root');
      expect(StatusEffectType.SLOW).toBe('slow');
    });

    test('should have buff effect types', () => {
      expect(StatusEffectType.SHIELD).toBe('shield');
      expect(StatusEffectType.ATTACK_BOOST).toBe('attack_boost');
      expect(StatusEffectType.SPEED_BOOST).toBe('speed_boost');
      expect(StatusEffectType.DEFENSE_BOOST).toBe('defense_boost');
    });
  });

  describe('createBurnEffect', () => {
    test('should create burn effect with correct properties', () => {
      const effect = createBurnEffect(5, 3000, 'fireball');

      expect(effect.type).toBe(ModifierType.STATUS_EFFECT);
      expect(effect.effectType).toBe(StatusEffectType.BURN);
      expect(effect.value).toBe(5);
      expect(effect.effectValue).toBe(5);
      expect(effect.duration).toBe(3000);
      expect(effect.remainingTime).toBe(3000);
      expect(effect.tickInterval).toBe(500);
      expect(effect.element).toBe('fire');
      expect(effect.source).toBe('fireball');
      expect(effect.tags.has('burn')).toBe(true);
      expect(effect.tags.has('dot')).toBe(true);
      expect(effect.stacking.policy).toBe(StackingPolicy.REFRESH_BY_SOURCE);
    });
  });

  describe('createSlowEffect', () => {
    test('should create slow effect with correct properties', () => {
      const effect = createSlowEffect(30, 2000, 'ice_shard');

      expect(effect.type).toBe(ModifierType.STATUS_EFFECT);
      expect(effect.effectType).toBe(StatusEffectType.SLOW);
      expect(effect.value).toBe(-30); // 负数表示减速
      expect(effect.effectValue).toBe(30);
      expect(effect.duration).toBe(2000);
      expect(effect.remainingTime).toBe(2000);
      expect(effect.source).toBe('ice_shard');
      expect(effect.tags.has('slow')).toBe(true);
      expect(effect.stacking.policy).toBe(StackingPolicy.SINGLE_INSTANCE);
    });
  });
});
