// src/systems/ElementSystem.ts
import { Element, ElementMark, SynergyResult } from '@/types';
import { getSynergy } from '@/data/elements';

export class ElementSystem {
  // 每个敌人身上的元素标记（enemyId -> marks）
  private enemyMarks: Map<string, ElementMark[]> = new Map();

  // 标记默认持续时间
  private readonly DEFAULT_MARK_DURATION = 5000; // 5秒

  /**
   * 给敌人添加元素标记
   */
  addMark(enemyId: string, element: Element, source: string, duration?: number): void {
    if (!this.enemyMarks.has(enemyId)) {
      this.enemyMarks.set(enemyId, []);
    }

    const marks = this.enemyMarks.get(enemyId)!;
    const now = Date.now();

    // 检查是否已有相同元素的标记
    const existingIndex = marks.findIndex(m => m.element === element);
    if (existingIndex >= 0) {
      // 刷新持续时间
      marks[existingIndex].timestamp = now;
      marks[existingIndex].duration = duration || this.DEFAULT_MARK_DURATION;
    } else {
      // 添加新标记
      marks.push({
        element,
        timestamp: now,
        duration: duration || this.DEFAULT_MARK_DURATION,
        source,
      });
    }
  }

  /**
   * 获取敌人身上的所有有效标记
   */
  getMarks(enemyId: string): ElementMark[] {
    const marks = this.enemyMarks.get(enemyId);
    if (!marks) return [];

    const now = Date.now();
    // 过滤掉过期的标记
    return marks.filter(m => now - m.timestamp < m.duration);
  }

  /**
   * 检查并触发羁绊效果
   * 返回触发的羁绊结果（可能有多个）
   */
  checkSynergy(enemyId: string, newElement: Element, source: string): SynergyResult | null {
    this.addMark(enemyId, newElement, source);

    const marks = this.getMarks(enemyId);
    if (marks.length < 2) return null;

    // 检查所有标记组合
    for (let i = 0; i < marks.length; i++) {
      for (let j = i + 1; j < marks.length; j++) {
        const synergy = getSynergy(marks[i].element, marks[j].element);
        if (synergy) {
          // 触发羁绊后清除这两个标记
          this.clearMarks(enemyId, [marks[i].element, marks[j].element]);
          return synergy;
        }
      }
    }

    return null;
  }

  /**
   * 清除指定元素的标记
   */
  clearMarks(enemyId: string, elements: Element[]): void {
    const marks = this.enemyMarks.get(enemyId);
    if (!marks) return;

    const filtered = marks.filter(m => !elements.includes(m.element));
    this.enemyMarks.set(enemyId, filtered);
  }

  /**
   * 清除敌人的所有标记
   */
  clearAllMarks(enemyId: string): void {
    this.enemyMarks.delete(enemyId);
  }

  /**
   * 更新（清理过期标记）
   */
  update(): void {
    const now = Date.now();
    for (const [enemyId, marks] of this.enemyMarks.entries()) {
      const valid = marks.filter(m => now - m.timestamp < m.duration);
      if (valid.length === 0) {
        this.enemyMarks.delete(enemyId);
      } else if (valid.length !== marks.length) {
        this.enemyMarks.set(enemyId, valid);
      }
    }
  }

  /**
   * 重置
   */
  reset(): void {
    this.enemyMarks.clear();
  }

  destroy(): void {
    this.enemyMarks.clear();
  }
}