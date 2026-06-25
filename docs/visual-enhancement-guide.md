# 视觉效果优化指南

本指南说明如何在现有像素风格基础上优化视觉细节，无需外部美术资源。

---

## 🎨 优化概览

### 新增功能

| 功能 | 文件 | 说明 |
|------|------|------|
| **视觉效果增强器** | `src/graphics/VisualEnhancer.ts` | 发光、脉冲、拖尾、阴影等效果 |
| **增强版图形工厂** | `src/graphics/EnhancedGraphicsFactory.ts` | 更精细的像素素材 |

---

## 📋 优化效果对比

### 1. 玩家角色

| 方面 | 优化前 | 优化后 |
|------|--------|--------|
| 细节层次 | 2层颜色 | 4层颜色 + 纹路装饰 |
| 发光效果 | 简单光环 | 渐变发光边缘 |
| 动画帧 | 1帧静态 | 4帧行走动画 |
| 受击反馈 | 无 | 红色闪烁精灵 |

### 2. 敌人精灵

| 方面 | 优化前 | 优化后 |
|------|--------|--------|
| 史莱姆 | 简单椭圆 | 多层+高光+阴影+嘴巴 |
| 元素精灵 | 简单圆形 | 多层+能量波纹 |
| Boss | 单色圆形 | 多层+光晕+能量线 |

### 3. 投射物

| 方面 | 优化前 | 优化后 |
|------|--------|--------|
| 视觉层次 | 单色 | 多层发光+拖尾点 |
| 元素区分 | 形状相同 | 颜色+大小差异 |

### 4. 特效增强

| 效果类型 | 新增功能 |
|----------|----------|
| 发光效果 | 边缘发光、脉冲发光、元素光环 |
| 动画效果 | 粒子拖尾、技能释放光圈、能量聚集 |
| 反馈效果 | 受击闪光、伤害数字、屏幕震动 |
| 氛围效果 | 动态阴影、引导线、屏幕闪烁 |

---

## 🔧 集成方法

### 步骤1: 在 BootScene 中使用增强版素材

```typescript
// src/scenes/BootScene.ts

import { EnhancedGraphicsFactory } from '@/graphics/EnhancedGraphicsFactory';

// 替换原来的 GraphicsFactory
if (!this.textures.exists('player')) {
  // 旧版本
  // const graphicsFactory = new GraphicsFactory(this);
  // graphicsFactory.generateAll();

  // 新版本
  const enhancedFactory = new EnhancedGraphicsFactory(this);
  enhancedFactory.generateEnhanced();
}
```

### 步骤2: 在 BattleScene 中添加视觉效果

```typescript
// src/scenes/BattleScene.ts

import { VisualEnhancer } from '@/graphics/VisualEnhancer';

export class BattleScene extends Phaser.Scene {
  private visualEnhancer!: VisualEnhancer;

  create(): void {
    // 创建视觉效果增强器
    this.visualEnhancer = new VisualEnhancer(this);

    // 为玩家添加发光边缘
    this.visualEnhancer.addGlowEdge(this.player, 0x66ccff, 0.6);

    // 为玩家添加动态阴影
    this.visualEnhancer.createDynamicShadow(this.player);

    // 为玩家添加元素光环（如果使用了元素技能）
    this.visualEnhancer.createElementAura(this.player, 'fire', 50);
  }
}
```

### 步骤3: 在技能系统中使用增强效果

```typescript
// src/systems/SkillSystem.ts 或策略文件中

import { VisualEnhancer } from '@/graphics/VisualEnhancer';

// 在技能释放时
private castSkill(skill: Skill): void {
  const visualEnhancer = new VisualEnhancer(this.scene);

  // 创建技能释放光圈
  visualEnhancer.createSkillCastRing(
    this.player.x,
    this.player.y,
    this.getElementColor(skill.element)
  );

  // 创建能量聚集效果
  visualEnhancer.createEnergyGather(
    this.player.x,
    this.player.y,
    this.getElementColor(skill.element),
    500
  );

  // 大招时添加屏幕震动
  if (skill.type === 'ultimate') {
    visualEnhancer.createScreenShake(0.01, 200);
  }
}
```

### 步骤4: 在碰撞系统中添加反馈效果

```typescript
// src/systems/CollisionSystem.ts

import { VisualEnhancer } from '@/graphics/VisualEnhancer';

private handleEnemyHitPlayer(player: Player, enemy: Enemy): void {
  const visualEnhancer = new VisualEnhancer(this.scene);

  // 击中闪光
  visualEnhancer.createHitFlash(player, 100);

  // 屏幕闪烁
  visualEnhancer.createScreenFlash(0xff4444, 0.2, 50);
}

private handleProjectileHitEnemy(enemy: Enemy, projectile: Projectile): void {
  const visualEnhancer = new VisualEnhancer(this.scene);

  // 伤害数字
  visualEnhancer.createDamageNumber(
    enemy.x,
    enemy.y - 20,
    damage,
    isCritical
  );

  // 击中闪光
  visualEnhancer.createHitFlash(enemy, 80);
}
```

---

## 🎯 效果使用示例

### 发光边缘效果

```typescript
// 为任何游戏对象添加发光边缘
const glow = visualEnhancer.addGlowEdge(enemy, 0xff4400, 0.5);
```

### 脉冲发光效果

```typescript
// 创建持续脉动的发光效果
const pulse = visualEnhancer.addPulsingGlow(x, y, 30, 0xff4400, 1000);
```

### 多层叠加效果

```typescript
// 创建多层技能效果
const layers = visualEnhancer.createLayeredEffect(
  x, y, 100,
  [0xff4400, 0xff6644, 0xff8866],  // 颜色数组
  [0.3, 0.5, 0.7]                   // 透明度数组
);
```

### 粒子拖尾效果

```typescript
// 为投射物添加拖尾
const trail = visualEnhancer.createParticleTrail(
  projectile,
  0xff4400,  // 颜色
  5,         // 最大粒子数
  50         // 生成间隔(ms)
);
```

### 元素光环效果

```typescript
// 为角色添加元素光环
const aura = visualEnhancer.createElementAura(
  player,
  'fire',  // 元素类型
  50       // 半径
);
```

### 技能释放效果

```typescript
// 技能释放光圈
visualEnhancer.createSkillCastRing(x, y, 0x66ccff, 60);

// 能量聚集
visualEnhancer.createEnergyGather(x, y, 0x66ccff, 500);

// 引导线
visualEnhancer.createGuidingLine(startX, startY, endX, endY, 0x66ccff, 500);
```

### 屏幕效果

```typescript
// 屏幕震动
visualEnhancer.createScreenShake(0.005, 100);

// 屏幕闪烁
visualEnhancer.createScreenFlash(0xffffff, 0.3, 100);
```

---

## 🎮 性能优化建议

### 1. 对象池管理

```typescript
// 使用对象池避免频繁创建/销毁
class EffectPool {
  private pool: Phaser.GameObjects.Graphics[] = [];

  get(): Phaser.GameObjects.Graphics {
    return this.pool.pop() || this.scene.add.graphics();
  }

  release(obj: Phaser.GameObjects.Graphics): void {
    obj.clear();
    this.pool.push(obj);
  }
}
```

### 2. 效果数量限制

```typescript
// 限制同屏效果数量
const MAX_PARTICLES = 50;
const MAX_GLOWS = 20;

if (activeEffects.length < MAX_GLOWS) {
  visualEnhancer.addGlowEdge(target);
}
```

### 3. 分层渲染

```typescript
// 使用不同的 depth 层级
const DEPTHS = {
  BACKGROUND: 0,
  GROUND: 10,
  SHADOW: 15,
  CHARACTER: 20,
  EFFECT: 30,
  PROJECTILE: 40,
  UI: 100,
};
```

---

## 📊 效果对比测试

### 测试方法

```typescript
// 在游戏中按 F1 切换效果
if (Phaser.Input.Keyboard.JustDown(this.keyF1)) {
  this.useEnhancedEffects = !this.useEnhancedEffects;
  console.log('Enhanced effects:', this.useEnhancedEffects);
}
```

### 测试检查项

- [ ] 玩家移动时是否有行走动画
- [ ] 受击时是否有红色闪烁
- [ ] 敌人是否有阴影效果
- [ ] 投射物是否有拖尾
- [ ] 技能释放是否有光圈效果
- [ ] 伤害数字是否正常显示
- [ ] FPS 是否保持在 60

---

## 🚀 快速启用

### 最简单的启用方式

修改 `BootScene.ts`:

```typescript
// 找到这一行
import { GraphicsFactory } from '@/graphics/GraphicsFactory';

// 改为
import { EnhancedGraphicsFactory } from '@/graphics/EnhancedGraphicsFactory';

// 找到这一行
const graphicsFactory = new GraphicsFactory(this);
graphicsFactory.generateAll();

// 改为
const enhancedFactory = new EnhancedGraphicsFactory(this);
enhancedFactory.generateEnhanced();
```

仅此一步，即可获得所有增强版素材！

---

## 📝 后续优化方向

1. **添加更多动画帧** - 攻击、死亡动画
2. **优化粒子系统** - 批量渲染、GPU加速
3. **添加后处理** - Bloom、色彩校正
4. **UI动画** - 按钮悬停、面板展开
5. **天气系统** - 雨雪效果
