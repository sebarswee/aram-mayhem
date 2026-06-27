import { describe, test, expect } from 'vitest';
import {
  ModifierType,
  ModifierOp,
  ModifierPriority,
  StackingPolicy
} from '../interfaces/ModifierTypes';

describe('ModifierTypes', () => {
  test('ModifierType enum values', () => {
    expect(ModifierType.ATTRIBUTE).toBe('attribute');
    expect(ModifierType.STATUS_EFFECT).toBe('status_effect');
    expect(ModifierType.TRIGGER).toBe('trigger');
  });

  test('ModifierOp enum values', () => {
    expect(ModifierOp.ADD).toBe('add');
    expect(ModifierOp.MULTIPLY).toBe('multiply');
    expect(ModifierOp.PERCENT_ADD).toBe('percent_add');
    expect(ModifierOp.OVERRIDE).toBe('override');
  });

  test('ModifierPriority enum values', () => {
    expect(ModifierPriority.LOWEST).toBe(0);
    expect(ModifierPriority.LOW).toBe(25);
    expect(ModifierPriority.NORMAL).toBe(50);
    expect(ModifierPriority.HIGH).toBe(75);
    expect(ModifierPriority.HIGHEST).toBe(100);
    expect(ModifierPriority.OVERRIDE).toBe(200);
  });

  test('StackingPolicy enum values', () => {
    expect(StackingPolicy.INDEPENDENT).toBe('independent');
    expect(StackingPolicy.REFRESH_BY_SOURCE).toBe('refresh_by_source');
    expect(StackingPolicy.SINGLE_INSTANCE).toBe('single_instance');
    expect(StackingPolicy.MAX_STACKS).toBe('max_stacks');
  });
});