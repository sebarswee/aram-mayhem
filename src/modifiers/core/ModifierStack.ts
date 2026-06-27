// src/modifiers/core/ModifierStack.ts
import { IBuffable } from '../interfaces/IBuffable';
import {
  Modifier,
  ModifierType,
  ModifierOp,
  StackingPolicy
} from '../interfaces/ModifierTypes';
import { StatusEffectModifier, StatusEffectType } from '../modifiers/StatusEffectModifier';
import { AttributeModifier } from '../modifiers/AttributeModifier';
import { TriggerModifier, TriggerType } from '../modifiers/TriggerModifier';

/**
 * 修饰符栈 - 核心管理类
 */
export class ModifierStack {
  // 分类存储
  private attributeModifiers: Map<string, AttributeModifier[]> = new Map();
  private statusEffects: Map<string, StatusEffectModifier> = new Map();
  private triggerModifiers: TriggerModifier[] = [];

  // 标签索引（快速查询）
  private tagIndex: Map<string, Set<string>> = new Map();

  // 所属实体
  private owner: IBuffable;

  constructor(owner: IBuffable) {
    this.owner = owner;
  }

  /**
   * 添加修饰符
   */
  addModifier(modifier: Modifier): void {
    // 处理叠加规则
    if (!this.handleStacking(modifier)) {
      return;
    }

    // 根据类型存储
    switch (modifier.type) {
      case ModifierType.ATTRIBUTE:
        this.addAttributeModifier(modifier as AttributeModifier);
        break;
      case ModifierType.STATUS_EFFECT:
        this.statusEffects.set(modifier.id, modifier as StatusEffectModifier);
        break;
      case ModifierType.TRIGGER:
        this.triggerModifiers.push(modifier as TriggerModifier);
        break;
    }

    // 更新标签索引
    this.updateTagIndex(modifier);

    // 触发回调
    modifier.onApply?.(this.owner);
    this.owner.onModifierAdded?.(modifier);
  }

  /**
   * 添加属性修饰符
   */
  private addAttributeModifier(modifier: AttributeModifier): void {
    const attrName = modifier.targetAttribute;
    if (!this.attributeModifiers.has(attrName)) {
      this.attributeModifiers.set(attrName, []);
    }
    this.attributeModifiers.get(attrName)!.push(modifier);
  }

  /**
   * 更新标签索引
   */
  private updateTagIndex(modifier: Modifier): void {
    modifier.tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(modifier.id);
    });
  }

  /**
   * 处理叠加规则
   */
  private handleStacking(newModifier: Modifier): boolean {
    switch (newModifier.stacking.policy) {
      case StackingPolicy.SINGLE_INSTANCE:
        // 查找相同ID的修饰符
        const existing = this.findModifierById(newModifier.id);
        if (existing) {
          // 刷新持续时间
          existing.remainingTime = newModifier.duration;
          return false;  // 不添加新实例
        }
        return true;

      case StackingPolicy.REFRESH_BY_SOURCE:
        // 查找相同来源的修饰符
        const sameSource = this.findModifierBySource(newModifier.source);
        if (sameSource) {
          sameSource.remainingTime = newModifier.duration;
          if (newModifier.stacking.valueRefresh) {
            sameSource.value = newModifier.value;
          }
          return false;
        }
        return true;

      case StackingPolicy.MAX_STACKS:
        // 检查层数限制
        const stacks = this.countModifiersById(newModifier.id);
        return stacks < (newModifier.stacking.maxStacks || 1);

      default:
        return true;
    }
  }

  /**
   * 根据ID查找修饰符
   */
  private findModifierById(id: string): Modifier | undefined {
    // 查找属性修饰符
    for (const modifiers of this.attributeModifiers.values()) {
      const found = modifiers.find(m => m.id === id);
      if (found) return found;
    }

    // 查找状态效果
    if (this.statusEffects.has(id)) {
      return this.statusEffects.get(id);
    }

    // 查找触发器
    return this.triggerModifiers.find(m => m.id === id);
  }

  /**
   * 根据来源查找修饰符
   */
  private findModifierBySource(source: string): Modifier | undefined {
    // 查找属性修饰符
    for (const modifiers of this.attributeModifiers.values()) {
      const found = modifiers.find(m => m.source === source);
      if (found) return found;
    }

    // 查找状态效果
    for (const effect of this.statusEffects.values()) {
      if (effect.source === source) return effect;
    }

    // 查找触发器
    return this.triggerModifiers.find(m => m.source === source);
  }

  /**
   * 统计相同ID的修饰符数量
   */
  private countModifiersById(id: string): number {
    let count = 0;

    for (const modifiers of this.attributeModifiers.values()) {
      count += modifiers.filter(m => m.id === id).length;
    }

    if (this.statusEffects.has(id)) count++;

    count += this.triggerModifiers.filter(m => m.id === id).length;

    return count;
  }

  /**
   * 计算最终属性值
   * 分阶段计算：先加法，再乘法，最后覆盖
   */
  getAttributeValue(attributeName: string, baseValue: number): number {
    const modifiers = this.attributeModifiers.get(attributeName) || [];

    if (modifiers.length === 0) {
      return baseValue;
    }

    // 按优先级排序
    const sorted = [...modifiers].sort((a, b) => a.priority - b.priority);

    let value = baseValue;

    // Phase 1: 加法操作
    for (const mod of sorted) {
      if (mod.operation === ModifierOp.ADD) {
        value += mod.value;
      } else if (mod.operation === ModifierOp.PERCENT_ADD) {
        value += baseValue * (mod.value / 100);
      }
    }

    // Phase 2: 乘法操作
    for (const mod of sorted) {
      if (mod.operation === ModifierOp.MULTIPLY) {
        value *= mod.value;
      }
    }

    // Phase 3: 覆盖操作
    for (const mod of sorted) {
      if (mod.operation === ModifierOp.OVERRIDE) {
        value = mod.value;
        break;  // 覆盖操作只取最后一个
      }
    }

    return Math.floor(value);
  }

  /**
   * 检查是否有特定标签的修饰符
   */
  hasTag(tag: string): boolean {
    return this.tagIndex.has(tag) && this.tagIndex.get(tag)!.size > 0;
  }

  /**
   * 检查是否有特定类型的状态效果
   */
  hasStatusEffect(effectType: StatusEffectType): boolean {
    for (const effect of this.statusEffects.values()) {
      if (effect.effectType === effectType) {
        return true;
      }
    }
    return false;
  }

  /**
   * 获取状态效果值
   */
  getStatusEffectValue(effectType: StatusEffectType): number {
    for (const effect of this.statusEffects.values()) {
      if (effect.effectType === effectType) {
        return effect.effectValue;
      }
    }
    return 0;
  }

  /**
   * 获取所有触发器
   */
  getTriggers(triggerType: TriggerType): TriggerModifier[] {
    return this.triggerModifiers.filter(mod => mod.triggerType === triggerType);
  }
}
