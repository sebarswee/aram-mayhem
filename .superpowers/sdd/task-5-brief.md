## Task 5: 实现基于时间的敌人生成系统

**Files:**
- Create: `src/systems/EnemySpawnSystem.ts`
- Modify: `src/scenes/BattleScene.ts`

**Interfaces:**
- Produces: 基于游戏时间的敌人生成系统

- [ ] **Step 1: 创建 EnemySpawnSystem 类**

创建文件 `src/systems/EnemySpawnSystem.ts`:

```typescript
import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { EnemySystem } from '@/systems/EnemySystem';

export interface EnemySpawnConfig {
  baseSpawnRate: number;      // 基础生成率（每分钟）
  minSpawnDistance: number;   // 最小生成距离
  maxSpawnDistance: number;   // 最大生成距离
  waveInterval: number;       // 巨浪间隔（毫秒）
  difficultyScale: number;    // 难度缩放系数
}

export class EnemySpawnSystem {
  private config: EnemySpawnConfig;
  private lastSpawnTime: number = 0;
  private totalEnemiesSpawned: number = 0;

  constructor(
    private scene: Phaser.Scene,
    private player: Player,
    private enemySystem: EnemySystem,
    config?: Partial<EnemySpawnConfig>
  ) {
    // 默认配置（Vampire Survivors 风格）
    this.config = {
      baseSpawnRate: config?.baseSpawnRate || 10,
      minSpawnDistance: config?.minSpawnDistance || 500,
      maxSpawnDistance: config?.maxSpawnDistance || 700,
      waveInterval: config?.waveInterval || 60000,
      difficultyScale: config?.difficultyScale || 1.5,
      ...config
    };
  }

  /**
   * 更新敌人生成（每帧调用）
   */
  update(time: number): void {
    const minutesElapsed = time / 60000;

    // 计算当前生成率（随时间增加）
    const spawnRate = this.config.baseSpawnRate + minutesElapsed * this.config.difficultyScale;

    // 检查是否是巨浪时间（每分钟一次大波）
    const timeSinceLastWave = time % this.config.waveInterval;
    if (timeSinceLastWave < 1000 && time > this.config.waveInterval) {
      // 巨浪生成（3倍数量）
      this.spawnWave(spawnRate * 3, time);
    } else {
      // 常规生成
      this.spawnRegular(spawnRate, time);
    }
  }

  /**
   * 常规敌人生成
   */
  private spawnRegular(spawnRate: number, time: number): void {
    // 基于生成率计算生成间隔
    const spawnInterval = 60000 / spawnRate; // 毫秒

    if (time - this.lastSpawnTime > spawnInterval) {
      this.spawnEnemyNearPlayer();
      this.lastSpawnTime = time;
    }
  }

  /**
   * 巨浪生成（环形生成）
   */
  private spawnWave(count: number, _time: number): void {
    console.log(`[EnemySpawnSystem] Spawning wave with ${count} enemies`);

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const distance = this.config.minSpawnDistance + Math.random() * 200;

      const x = this.player.x + Math.cos(angle) * distance;
      const y = this.player.y + Math.sin(angle) * distance;

      this.spawnEnemy(x, y);
    }

    this.lastSpawnTime = _time;
  }

  /**
   * 在玩家周围生成单个敌人
   */
  private spawnEnemyNearPlayer(): void {
    const angle = Math.random() * Math.PI * 2;
    const distance = this.config.minSpawnDistance +
      Math.random() * (this.config.maxSpawnDistance - this.config.minSpawnDistance);

    const x = this.player.x + Math.cos(angle) * distance;
    const y = this.player.y + Math.sin(angle) * distance;

    this.spawnEnemy(x, y);
  }

  /**
   * 生成敌人
   */
  private spawnEnemy(x: number, y: number): void {
    // 根据游戏时间选择敌人类型
    const time = this.scene.time.now;
    const minutes = time / 60000;

    let enemyType = 'basic';
    if (minutes > 2) {
      enemyType = Math.random() > 0.7 ? 'fast' : 'basic';
    }
    if (minutes > 5) {
      enemyType = Math.random() > 0.5 ? 'tank' : 'fast';
    }

    // 使用 EnemySystem 生成敌人
    this.enemySystem.spawnEnemyAt(x, y, enemyType);

    this.totalEnemiesSpawned++;
  }

  /**
   * 获取统计信息
   */
  getStats(): { totalSpawned: number } {
    return {
      totalSpawned: this.totalEnemiesSpawned
    };
  }
}
```

- [ ] **Step 2: 在 EnemySystem 中添加 spawnEnemyAt 方法**

修改 `src/systems/EnemySystem.ts`，添加方法：

```typescript
/**
 * 在指定位置生成敌人（供 EnemySpawnSystem 使用）
 */
spawnEnemyAt(x: number, y: number, type: string): void {
  const enemyConfig = this.getEnemyConfig(type);
  if (enemyConfig) {
    const enemy = new Enemy(this.scene, x, y, enemyConfig);
    this.enemies.add(enemy);
  }
}

/**
 * 获取敌人配置
 */
private getEnemyConfig(type: string): EnemyConfig | null {
  // 返回对应的敌人配置
  // 这里需要根据你的 EnemyConfig 结构实现
  // 示例：
  const configs: Record<string, EnemyConfig> = {
    basic: {
      type: 'basic',
      hp: 30,
      damage: 10,
      speed: 100,
      expValue: 1,
    },
    fast: {
      type: 'fast',
      hp: 20,
      damage: 8,
      speed: 150,
      expValue: 1,
    },
    tank: {
      type: 'tank',
      hp: 80,
      damage: 15,
      speed: 60,
      expValue: 3,
    },
  };

  return configs[type] || null;
}
```

- [ ] **Step 3: 在 BattleScene 中集成 EnemySpawnSystem**

修改 `src/scenes/BattleScene.ts`:

```typescript
import { EnemySpawnSystem } from '@/systems/EnemySpawnSystem';

export class BattleScene extends Phaser.Scene {
  // ... 其他属性 ...
  private enemySpawnSystem!: EnemySpawnSystem;

  create(): void {
    // ... 其他初始化代码 ...

    // 初始化敌人生成系统
    this.enemySpawnSystem = new EnemySpawnSystem(
      this,
      this.player,
      this.enemySystem,
      {
        baseSpawnRate: 10,
        minSpawnDistance: 500,
        maxSpawnDistance: 700,
        waveInterval: 60000,
        difficultyScale: 1.5
      }
    );

    // ... 其他代码 ...
  }

  update(_time: number, delta: number): void {
    if (this.gameState.isDead || this.gameState.isUpgrading || this.gameState.isSelectingSkill) return;

    // 更新区块管理器
    this.chunkManager.update(this.player.x, this.player.y);

    // 更新敌人生成系统
    this.enemySpawnSystem.update(_time);

    // ... 其他更新代码 ...
  }
}
```

- [ ] **Step 4: 验证敌人生成**

运行游戏，检查：

```bash
npm run dev
```

Expected:
- 敌人开始自动生成
- 随时间推移，敌人生成率增加
- 每分钟触发一次巨浪（大量敌人同时生成）

- [ ] **Step 5: 提交代码**

```bash
git add src/systems/EnemySpawnSystem.ts src/systems/EnemySystem.ts src/scenes/BattleScene.ts
git commit -m "feat(enemy): implement time-based enemy spawn system with waves"
```

---

