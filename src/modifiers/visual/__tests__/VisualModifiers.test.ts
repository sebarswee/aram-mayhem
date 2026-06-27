// src/modifiers/visual/__tests__/VisualModifiers.test.ts
import { describe, it, expect } from 'vitest';
import {
  createBurnVisualModifier,
  createPoisonVisualModifier,
  createFreezeVisualModifier,
  createStunVisualModifier,
  createRootVisualModifier,
  createSlowVisualModifier,
  createAttackBoostVisualModifier,
  createSpeedBoostVisualModifier,
  createDefenseBreakVisualModifier,
  createShieldVisualModifier,
} from '../VisualModifiers';
import { StatusEffectType } from '../../modifiers/StatusEffectModifier';
import { ModifierType } from '../../interfaces/ModifierTypes';

describe('Visual Modifiers', () => {
  describe('createBurnVisualModifier', () => {
    it('should create burn modifier with correct properties', () => {
      const modifier = createBurnVisualModifier(10, 3000);

      expect(modifier.type).toBe(ModifierType.STATUS_EFFECT);
      expect(modifier.effectType).toBe(StatusEffectType.BURN);
      expect(modifier.value).toBe(10);
      expect(modifier.duration).toBe(3000);
      expect(modifier.tags.has('burn')).toBe(true);
      expect(modifier.tags.has('dot')).toBe(true);
      expect(modifier.tags.has('debuff')).toBe(true);
      expect(modifier.tickInterval).toBe(500);
      expect(modifier.onApply).toBeDefined();
      expect(modifier.onRemove).toBeDefined();
      expect(modifier.onUpdate).toBeDefined();
    });

    it('should create burn modifier with element type', () => {
      const modifier = createBurnVisualModifier(10, 3000, 'fire');

      expect(modifier.element).toBe('fire');
    });

    it('should have correct stacking policy', () => {
      const modifier = createBurnVisualModifier(10, 3000);

      expect(modifier.stacking.policy).toBe('refresh_by_source');
      expect(modifier.stacking.valueRefresh).toBe(true);
    });

    it('should have correct priority', () => {
      const modifier = createBurnVisualModifier(10, 3000);

      expect(modifier.priority).toBe(50); // ModifierPriority.NORMAL
    });
  });

  describe('createPoisonVisualModifier', () => {
    it('should create poison modifier with correct properties', () => {
      const modifier = createPoisonVisualModifier(5, 5000);

      expect(modifier.effectType).toBe(StatusEffectType.POISON);
      expect(modifier.value).toBe(5);
      expect(modifier.duration).toBe(5000);
      expect(modifier.tickInterval).toBe(1000);
      expect(modifier.tags.has('poison')).toBe(true);
      expect(modifier.tags.has('dot')).toBe(true);
      expect(modifier.tags.has('debuff')).toBe(true);
    });

    it('should have onApply, onRemove, and onUpdate callbacks', () => {
      const modifier = createPoisonVisualModifier(5, 5000);

      expect(modifier.onApply).toBeDefined();
      expect(modifier.onRemove).toBeDefined();
      expect(modifier.onUpdate).toBeDefined();
    });

    it('should have correct stacking policy', () => {
      const modifier = createPoisonVisualModifier(5, 5000);

      expect(modifier.stacking.policy).toBe('refresh_by_source');
      expect(modifier.stacking.valueRefresh).toBe(true);
    });
  });

  describe('createFreezeVisualModifier', () => {
    it('should create freeze modifier with correct properties', () => {
      const modifier = createFreezeVisualModifier(2000);

      expect(modifier.effectType).toBe(StatusEffectType.FREEZE);
      expect(modifier.duration).toBe(2000);
      expect(modifier.value).toBe(0);
      expect(modifier.effectValue).toBe(0);
      expect(modifier.tags.has('freeze')).toBe(true);
      expect(modifier.tags.has('control')).toBe(true);
      expect(modifier.tags.has('debuff')).toBe(true);
    });

    it('should have high priority', () => {
      const modifier = createFreezeVisualModifier(2000);

      expect(modifier.priority).toBe(75); // ModifierPriority.HIGH
    });

    it('should have onApply and onRemove callbacks', () => {
      const modifier = createFreezeVisualModifier(2000);

      expect(modifier.onApply).toBeDefined();
      expect(modifier.onRemove).toBeDefined();
    });

    it('should not have onUpdate callback', () => {
      const modifier = createFreezeVisualModifier(2000);

      expect(modifier.onUpdate).toBeUndefined();
    });
  });

  describe('createStunVisualModifier', () => {
    it('should create stun modifier with correct properties', () => {
      const modifier = createStunVisualModifier(1500);

      expect(modifier.effectType).toBe(StatusEffectType.STUN);
      expect(modifier.duration).toBe(1500);
      expect(modifier.value).toBe(0);
      expect(modifier.effectValue).toBe(0);
      expect(modifier.tags.has('stun')).toBe(true);
      expect(modifier.tags.has('control')).toBe(true);
      expect(modifier.tags.has('debuff')).toBe(true);
    });

    it('should have high priority', () => {
      const modifier = createStunVisualModifier(1500);

      expect(modifier.priority).toBe(75); // ModifierPriority.HIGH
    });

    it('should have onApply and onRemove callbacks', () => {
      const modifier = createStunVisualModifier(1500);

      expect(modifier.onApply).toBeDefined();
      expect(modifier.onRemove).toBeDefined();
    });
  });

  describe('createRootVisualModifier', () => {
    it('should create root modifier with correct properties', () => {
      const modifier = createRootVisualModifier(3000);

      expect(modifier.effectType).toBe(StatusEffectType.ROOT);
      expect(modifier.duration).toBe(3000);
      expect(modifier.value).toBe(0);
      expect(modifier.effectValue).toBe(0);
      expect(modifier.tags.has('root')).toBe(true);
      expect(modifier.tags.has('control')).toBe(true);
      expect(modifier.tags.has('debuff')).toBe(true);
    });

    it('should have normal priority', () => {
      const modifier = createRootVisualModifier(3000);

      expect(modifier.priority).toBe(50); // ModifierPriority.NORMAL
    });

    it('should only have onRemove callback (no visual on apply)', () => {
      const modifier = createRootVisualModifier(3000);

      expect(modifier.onRemove).toBeDefined();
    });
  });

  describe('createSlowVisualModifier', () => {
    it('should create slow modifier with correct properties', () => {
      const modifier = createSlowVisualModifier(30, 4000);

      expect(modifier.effectType).toBe(StatusEffectType.SLOW);
      expect(modifier.value).toBe(30);
      expect(modifier.effectValue).toBe(30);
      expect(modifier.duration).toBe(4000);
      expect(modifier.tags.has('slow')).toBe(true);
      expect(modifier.tags.has('debuff')).toBe(true);
    });

    it('should have correct stacking policy', () => {
      const modifier = createSlowVisualModifier(30, 4000);

      expect(modifier.stacking.policy).toBe('refresh_by_source');
      expect(modifier.stacking.valueRefresh).toBe(true);
    });

    it('should have onRemove callback only', () => {
      const modifier = createSlowVisualModifier(30, 4000);

      expect(modifier.onRemove).toBeDefined();
      expect(modifier.onApply).toBeUndefined();
    });
  });

  describe('createAttackBoostVisualModifier', () => {
    it('should create attack boost modifier with correct properties', () => {
      const modifier = createAttackBoostVisualModifier(50, 5000);

      expect(modifier.effectType).toBe(StatusEffectType.ATTACK_BOOST);
      expect(modifier.value).toBe(50);
      expect(modifier.effectValue).toBe(50);
      expect(modifier.duration).toBe(5000);
      expect(modifier.tags.has('attack_boost')).toBe(true);
      expect(modifier.tags.has('buff')).toBe(true);
    });

    it('should have correct stacking policy', () => {
      const modifier = createAttackBoostVisualModifier(50, 5000);

      expect(modifier.stacking.policy).toBe('refresh_by_source');
      expect(modifier.stacking.valueRefresh).toBe(true);
    });

    it('should have onApply and onRemove callbacks', () => {
      const modifier = createAttackBoostVisualModifier(50, 5000);

      expect(modifier.onApply).toBeDefined();
      expect(modifier.onRemove).toBeDefined();
    });
  });

  describe('createSpeedBoostVisualModifier', () => {
    it('should create speed boost modifier with correct properties', () => {
      const modifier = createSpeedBoostVisualModifier(30, 3000);

      expect(modifier.effectType).toBe(StatusEffectType.SPEED_BOOST);
      expect(modifier.value).toBe(30);
      expect(modifier.effectValue).toBe(30);
      expect(modifier.duration).toBe(3000);
      expect(modifier.tags.has('speed_boost')).toBe(true);
      expect(modifier.tags.has('buff')).toBe(true);
    });

    it('should have correct stacking policy', () => {
      const modifier = createSpeedBoostVisualModifier(30, 3000);

      expect(modifier.stacking.policy).toBe('refresh_by_source');
      expect(modifier.stacking.valueRefresh).toBe(true);
    });

    it('should have onApply and onRemove callbacks for particle effects', () => {
      const modifier = createSpeedBoostVisualModifier(30, 3000);

      expect(modifier.onApply).toBeDefined();
      expect(modifier.onRemove).toBeDefined();
    });
  });

  describe('createDefenseBreakVisualModifier', () => {
    it('should create defense break modifier with correct properties', () => {
      const modifier = createDefenseBreakVisualModifier(20, 5000);

      expect(modifier.effectType).toBe(StatusEffectType.DEFENSE_BREAK);
      expect(modifier.value).toBe(20);
      expect(modifier.effectValue).toBe(20);
      expect(modifier.duration).toBe(5000);
      expect(modifier.tags.has('defense_break')).toBe(true);
      expect(modifier.tags.has('debuff')).toBe(true);
    });

    it('should have correct stacking policy', () => {
      const modifier = createDefenseBreakVisualModifier(20, 5000);

      expect(modifier.stacking.policy).toBe('refresh_by_source');
      expect(modifier.stacking.valueRefresh).toBe(true);
    });

    it('should have onRemove callback only', () => {
      const modifier = createDefenseBreakVisualModifier(20, 5000);

      expect(modifier.onRemove).toBeDefined();
      expect(modifier.onApply).toBeUndefined();
    });
  });

  describe('createShieldVisualModifier', () => {
    it('should create shield modifier with correct properties', () => {
      const modifier = createShieldVisualModifier(100);

      expect(modifier.effectType).toBe(StatusEffectType.SHIELD);
      expect(modifier.value).toBe(100);
      expect(modifier.effectValue).toBe(100);
      expect(modifier.duration).toBe(-1); // 无时间限制
      expect(modifier.remainingTime).toBe(-1);
      expect(modifier.tags.has('shield')).toBe(true);
      expect(modifier.tags.has('buff')).toBe(true);
    });

    it('should have independent stacking policy', () => {
      const modifier = createShieldVisualModifier(100);

      expect(modifier.stacking.policy).toBe('independent');
    });

    it('should have onApply callback to add shield value', () => {
      const modifier = createShieldVisualModifier(100);

      expect(modifier.onApply).toBeDefined();
    });

    it('should have normal priority', () => {
      const modifier = createShieldVisualModifier(100);

      expect(modifier.priority).toBe(50); // ModifierPriority.NORMAL
    });
  });

  describe('All modifiers', () => {
    it('should have unique IDs', () => {
      const modifiers = [
        createBurnVisualModifier(10, 3000),
        createPoisonVisualModifier(5, 5000),
        createFreezeVisualModifier(2000),
        createStunVisualModifier(1500),
        createRootVisualModifier(3000),
        createSlowVisualModifier(30, 4000),
        createAttackBoostVisualModifier(50, 5000),
        createSpeedBoostVisualModifier(30, 3000),
        createDefenseBreakVisualModifier(20, 5000),
        createShieldVisualModifier(100),
      ];

      const ids = modifiers.map(m => m.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(10);
    });

    it('should all have STATUS_EFFECT type', () => {
      const modifiers = [
        createBurnVisualModifier(10, 3000),
        createPoisonVisualModifier(5, 5000),
        createFreezeVisualModifier(2000),
        createStunVisualModifier(1500),
        createRootVisualModifier(3000),
        createSlowVisualModifier(30, 4000),
        createAttackBoostVisualModifier(50, 5000),
        createSpeedBoostVisualModifier(30, 3000),
        createDefenseBreakVisualModifier(20, 5000),
        createShieldVisualModifier(100),
      ];

      modifiers.forEach(m => {
        expect(m.type).toBe(ModifierType.STATUS_EFFECT);
      });
    });

    it('should all have correct source', () => {
      const modifiers = [
        createBurnVisualModifier(10, 3000),
        createPoisonVisualModifier(5, 5000),
        createFreezeVisualModifier(2000),
        createStunVisualModifier(1500),
        createRootVisualModifier(3000),
        createSlowVisualModifier(30, 4000),
        createAttackBoostVisualModifier(50, 5000),
        createSpeedBoostVisualModifier(30, 3000),
        createDefenseBreakVisualModifier(20, 5000),
        createShieldVisualModifier(100),
      ];

      modifiers.forEach(m => {
        expect(m.source).toBe('status_effect_system');
      });
    });

    it('should all have ADD operation', () => {
      const modifiers = [
        createBurnVisualModifier(10, 3000),
        createPoisonVisualModifier(5, 5000),
        createFreezeVisualModifier(2000),
        createStunVisualModifier(1500),
        createRootVisualModifier(3000),
        createSlowVisualModifier(30, 4000),
        createAttackBoostVisualModifier(50, 5000),
        createSpeedBoostVisualModifier(30, 3000),
        createDefenseBreakVisualModifier(20, 5000),
        createShieldVisualModifier(100),
      ];

      modifiers.forEach(m => {
        expect(m.operation).toBe('add');
      });
    });
  });
});