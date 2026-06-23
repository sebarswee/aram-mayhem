# Task 1: 项目初始化与基础配置

## Global Constraints
- 技术栈: Phaser 3.80+, TypeScript 5.x, Vite 5.x
- 渲染: WebGL优先，Canvas fallback
- 目标帧率: 60fps
- 画布尺寸: 1280x720 (响应式适配)
- 物理引擎: Arcade Physics (2D)
- 代码规范: ESLint + Prettier，严格模式

## Files to Create
1. `package.json`
2. `tsconfig.json`
3. `vite.config.ts`
4. `public/index.html`
5. `src/main.ts`
6. `src/config/game.config.ts`

## Interfaces
- Produces: `GAME_CONFIG` (Phaser游戏配置对象)
- Produces: `GAME_WIDTH` = 1280
- Produces: `GAME_HEIGHT` = 720

## Steps

### Step 1: 创建package.json

```json
{
  "name": "aram-mayhem",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write \"src/**/*.ts\""
  },
  "dependencies": {
    "phaser": "^3.80.1"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.2.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint": "^8.57.0",
    "prettier": "^3.2.0"
  }
}
```

### Step 2: 创建tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    },
    "baseUrl": "."
  },
  "include": ["src"]
}
```

### Step 3: 创建vite.config.ts

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

### Step 4: 创建public/index.html

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
    <title>技能乱斗 - Aram Mayhem</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        background: #1a1a2e;
        overflow: hidden;
        touch-action: none;
      }
      #game-container {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100vw;
        height: 100vh;
      }
      canvas {
        max-width: 100%;
        max-height: 100%;
      }
    </style>
  </head>
  <body>
    <div id="game-container"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

### Step 5: 创建src/config/game.config.ts

```typescript
import Phaser from 'phaser';

export const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1280,
  height: 720,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [], // 将在main.ts中动态添加
};

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
```

### Step 6: 创建src/main.ts

```typescript
import Phaser from 'phaser';
import { GAME_CONFIG } from './config/game.config';
import { BootScene } from './scenes/BootScene';
import { BattleScene } from './scenes/BattleScene';
import { ResultScene } from './scenes/ResultScene';

// 注册所有场景
const scenes = [BootScene, BattleScene, ResultScene];

// 创建游戏实例
const config: Phaser.Types.Core.GameConfig = {
  ...GAME_CONFIG,
  scene: scenes,
};

new Phaser.Game(config);
```

### Step 7: 安装依赖并验证

```bash
npm install
npm run dev
```

预期: 浏览器打开 http://localhost:3000，显示黑色画布，控制台无报错

### Step 8: 提交

```bash
git add .
git commit -m "chore: initialize project with Phaser 3 + TypeScript + Vite

Co-Authored-By: Claude <noreply@anthropic.com>"
```
