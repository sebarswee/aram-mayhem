# ARAM Mayhem

一款 Vampire Survivors 风格的 Roguelike 生存游戏。

## 游戏特性

- **无限地图系统**：探索无尽的随机生成世界
- **技能组合**：收集和升级各种元素技能
- **敌人巨浪**：对抗不断增长的敌人浪潮
- **Boss 战斗**：挑战强大的 Boss 敌人

## 无限地图系统

本游戏采用 Vampire Survivors 风格的无限地图系统：

- **Chunk-based 架构**：256x256 区块动态加载
- **程序化生成**：基于种子的装饰物生成
- **基于时间的敌人生成**：随游戏时间增加难度
- **巨浪机制**：每分钟一次大波敌人

### 技术细节

- 区块大小：256x256 像素
- 活动区块：玩家周围 3x3（共 9 个）
- 敌人生成：基于游戏时间，非区块
- 性能：稳定 60 FPS，内存 < 100MB

详见：[docs/architecture/infinite-world-system.md](docs/architecture/infinite-world-system.md)

## 开发指南

### 环境要求

- Node.js 18+
- npm 9+

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 运行测试

```bash
npm test
```

## 项目结构

```
src/
├── config/          # 游戏配置
├── data/            # 技能、敌人等数据定义
├── entities/        # 游戏实体（玩家、敌人、投射物等）
├── graphics/        # 图形生成和视觉效果
├── modifiers/       # 状态效果和属性修改器
├── scenes/          # Phaser 场景
├── strategies/      # 技能和效果策略模式
├── systems/         # 游戏系统（碰撞、生成等）
├── types/           # TypeScript 类型定义
├── ui/              # 用户界面组件
├── utils/           # 工具函数
└── world/           # 无限世界系统（Chunk、ChunkManager）
```

## 技术栈

- **Phaser 3**：游戏引擎
- **TypeScript**：开发语言
- **Vite**：构建工具
- **Vitest**：测试框架

## 许可证

MIT
