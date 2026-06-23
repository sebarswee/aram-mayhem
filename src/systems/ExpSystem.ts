import Phaser from 'phaser';
import { GameState } from '@/types';
import { EXP_BASE, EXP_GROWTH } from '@/config/balance.config';

export class ExpSystem {
  private scene: Phaser.Scene;
  private gameState: GameState;

  constructor(scene: Phaser.Scene, gameState: GameState) {
    this.scene = scene;
    this.gameState = gameState;
  }

  addExp(amount: number): boolean {
    if (this.gameState.isDead || this.gameState.isUpgrading) return false;

    this.gameState.exp += amount;

    // 检查升级
    while (this.gameState.exp >= this.gameState.expToNext) {
      this.gameState.exp -= this.gameState.expToNext;
      this.levelUp();
    }

    return true;
  }

  private levelUp(): void {
    this.gameState.level++;
    this.gameState.expToNext = this.calculateExpNeeded(this.gameState.level);

    // 发出升级事件
    this.scene.events.emit('levelUp', this.gameState.level);
  }

  private calculateExpNeeded(level: number): number {
    return Math.floor(EXP_BASE * Math.pow(level, EXP_GROWTH));
  }

  getExpProgress(): number {
    return this.gameState.exp / this.gameState.expToNext;
  }

  getLevel(): number {
    return this.gameState.level;
  }

  getCurrentExp(): number {
    return this.gameState.exp;
  }

  getExpToNext(): number {
    return this.gameState.expToNext;
  }
}
