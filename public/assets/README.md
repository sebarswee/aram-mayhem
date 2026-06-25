# 资源目录结构说明

本目录存放所有游戏美术资源，替代程序化生成的像素素材。

---

## 📁 目录结构

```
public/assets/
│
├── icons/                    # 图标资源
│   ├── skills/               # 技能图标 (70个)
│   │   ├── fire/             # 火系技能图标
│   │   │   ├── fireball.png
│   │   │   ├── flame_wave.png
│   │   │   ├── meteor.png
│   │   │   └── ...
│   │   ├── water/            # 水系技能图标
│   │   ├── ice/              # 冰系技能图标
│   │   ├── lightning/        # 雷系技能图标
│   │   ├── holy/             # 光系技能图标
│   │   ├── shadow/           # 暗系技能图标
│   │   ├── grass/            # 草系技能图标
│   │   └── earth/            # 土系技能图标
│   │
│   ├── elements/             # 元素图标 (8个)
│   │   ├── fire.png
│   │   ├── water.png
│   │   ├── ice.png
│   │   ├── lightning.png
│   │   ├── holy.png
│   │   ├── shadow.png
│   │   ├── grass.png
│   │   └── earth.png
│   │
│   └── status/               # 状态效果图标 (15个)
│       ├── buffs/            # 增益状态
│       │   ├── shield.png
│       │   ├── heal.png
│       │   └── ...
│       ├── debuffs/          # 减益状态
│       │   ├── burn.png
│       │   ├── freeze.png
│       │   ├── poison.png
│       │   └── ...
│
├── effects/                  # 技能特效资源
│   ├── explosions/           # 爆炸效果 (8套元素)
│   │   ├── fire/             # 火焰爆炸序列帧
│   │   │   ├── fire_explosion_01.png
│   │   │   ├── fire_explosion_02.png
│   │   │   ├── ...
│   │   │   └── fire_explosion_08.png
│   │   ├── water/            # 水花爆炸
│   │   ├── ice/              # 冰晶破碎
│   │   ├── lightning/        # 电光爆发
│   │   ├── holy/             # 圣光爆发
│   │   ├── shadow/           # 暗影爆发
│   │   ├── grass/            # 自然爆发
│   │   └── earth/            # 土石爆发
│   │
│   ├── projectiles/          # 投射物外观 (15套)
│   │   ├── fireball.png      # 火球
│   │   ├── water_bullet.png  # 水弹
│   │   ├── ice_shard.png     # 冰刺
│   │   ├── lightning_bolt.png # 闪电箭
│   │   └── ...
│   │
│   ├── areas/                # 区域持续效果 (15套)
│   │   ├── poison_cloud.png  # 毒雾
│   │   ├── blizzard.png      # 暴风雪
│   │   ├── electric_field.png # 电场
│   │   ├── healing_circle.png # 治疗圈
│   │   └── ...
│   │
│   ├── ultimates/            # 大招特效 (20套)
│   │   ├── meteor.png        # 陨石坠落
│   │   ├── tsunami.png       # 海啸
│   │   ├── thunder_storm.png # 雷暴
│   │   ├── blizzard.png      # 暴风雪
│   │   └── ...
│   │
│   └── buffs/                # Buff效果 (10套)
│   │   ├── shield_fire.png   # 火焰护盾
│   │   ├── shield_ice.png    # 冰霜护盾
│   │   ├── shield_holy.png   # 神圣护盾
│   │   ├── healing_aura.png  # 治疗光环
│   │   └── ...
│
├── ui/                       # UI组件资源
│   ├── buttons/              # 按钮资源
│   │   ├── primary/          # 主要按钮
│   │   │   ├── normal.png
│   │   │   ├── hover.png
│   │   │   └── pressed.png
│   │   ├── danger/           # 危险按钮（红）
│   │   ├── skill/            # 技能槽按钮
│   │   └── upgrade/          # 升级按钮
│   │
│   ├── panels/               # 面板资源
│   │   ├── main.png          # 主面板（9-slice）
│   │   ├── tooltip.png       # 提示框
│   │   ├── skill_select.png  # 技能选择面板
│   │   └── inventory.png     # 背包面板
│   │
│   └── progress/             # 进度条资源
│   │   ├── health_bar.png    # 血条
│   │   ├── mana_bar.png      # 魔法条
│       ├── exp_bar.png       # 经验条
│       └── cooldown.png      # 冷却遮罩
│
├── characters/               # 角色/敌人资源
│   ├── player/               # 玩家角色
│   │   ├── idle/             # 待机动画
│   │   │   ├── player_idle_01.png
│   │   │   ├── ...
│   │   ├── walk/             # 行走动画
│   │   ├── attack/           # 攻击动画
│   │   └── hit/              # 受击动画
│   │
│   ├── enemies/              # 敌人精灵
│   │   ├── normal/           # 普通敌人
│   │   ├── elite/            # 精英敌人
│   │   └── boss/             # Boss
│   │
│   └── bosses/               # Boss资源
│       ├── boss_01.png       # Boss 主图
│       └── boss_01_phases/   # Boss 多阶段
│
├── backgrounds/              # 背景资源
│   ├── battle_arena.png      # 战斗场景
│   ├── main_menu.png         # 主菜单背景
│   └── upgrade_screen.png    # 升级界面背景
│
└── fonts/                    # 字体资源
    ├── pixel_numbers.png     # 像素数字（用于伤害显示）
    └── game_font.ttf         # 游戏字体
```

---

## 📏 资源规格要求

### 图标规格

| 类型 | 尺寸 | 格式 | 说明 |
|------|------|------|------|
| 技能图标 | 64x64 或 128x128 | PNG (透明) | 建议 64x64 |
| 元素图标 | 64x64 | PNG (透明) | 与技能图标同尺寸 |
| 状态图标 | 32x32 或 64x64 | PNG (透明) | 小尺寸 |

### 特效规格

| 类型 | 尺寸 | 格式 | 说明 |
|------|------|------|------|
| 爆炸单帧 | 256x256 | PNG (透明) | 可缩放 |
| 爆炸序列帧 | 每帧 128x128 | PNG (透明) | 8帧为一个周期 |
| 投射物 | 32x32 或 64x64 | PNG (透明) | 视复杂度 |
| 区域效果 | 256x256 | PNG (透明) | 持续效果背景 |

### UI规格

| 类型 | 尺寸 | 格式 | 说明 |
|------|------|------|------|
| 按钮 | 200x60 (可变) | PNG (透明) | 需要 9-slice |
| 面板 | 400x300 (可变) | PNG (透明) | 需要 9-slice |
| 进度条 | 200x20 (可变) | PNG (透明) | 分离背景和填充 |

### 背景规格

| 类型 | 尺寸 | 格式 | 说明 |
|------|------|------|------|
| 战斗场景 | 1920x1080 | PNG/JPG | 按屏幕比例 |
| 主菜单 | 1920x1080 | PNG/JPG | 全屏背景 |

---

## 📝 文件命名规范

### 图标命名

```
技能图标: [skill_id].png
例: fireball.png, ice_shard.png, lightning_bolt.png

元素图标: element_[name].png
例: element_fire.png, element_ice.png

状态图标: status_[name].png
例: status_burn.png, status_freeze.png
```

### 特效命名

```
爆炸序列帧: explosion_[element]_[frame].png
例: explosion_fire_01.png ~ explosion_fire_08.png

投射物: projectile_[name].png
例: projectile_fireball.png, projectile_ice_shard.png

大招: ultimate_[name].png
例: ultimate_meteor.png, ultimate_tsunami.png
```

### UI命名

```
按钮: button_[type]_[state].png
例: button_primary_normal.png
    button_primary_hover.png
    button_primary_pressed.png

面板: panel_[name].png
例: panel_main.png, panel_tooltip.png

进度条: bar_[type].png
例: bar_health.png, bar_mana.png
```

---

## 🎨 9-slice 可拉伸说明

UI组件需要设计为可拉伸的 9-slice 格式：

### 设计要求

```
┌───┬─────────────┬───┐
│ A │     B       │ C │  ← 顶部边缘 (固定高度)
├───┼─────────────┼───┤
│   │             │   │
│ D │     E       │ F │  ← 中间区域 (可拉伸)
│   │             │   │
├───┼─────────────┼───┤
│ G │     H       │ I │  ← 底部边缘 (固定高度)
└───┴─────────────┴───┘
  ←─   中间宽度    ─→

A, C, G, I: 四角 (固定尺寸，不拉伸)
B, H: 上下边缘 (水平拉伸)
D, F: 左右边缘 (垂直拉伸)
E: 中心区域 (水平+垂直拉伸)
```

### 拉伸区域大小

```
边角大小: 10-15px (建议)
边缘宽度: 10-15px
```

---

## 🔧 资源使用优先级

### 混合使用策略

```
优先级 1: 外部资源 (public/assets/)
         - 如果存在同名文件，使用外部资源

优先级 2: 程序化生成 (GraphicsFactory)
         - 如果外部资源不存在，使用代码生成
```

这样可以：
- 逐步替换资源，无需一次性全部生成
- 保证缺失资源时有默认 fallback
- 方便测试和迭代

---

## 📋 资源清单检查表

生成完成后，检查：

- [ ] 所有技能图标是否齐全 (70个)
- [ ] 元素图标是否完整 (8个)
- [ ] 状态图标是否完整 (15个)
- [ ] 爆炸效果序列帧是否完整 (每套8帧)
- [ ] 所有 PNG 是否透明背景
- [ ] 尺寸是否符合规格
- [ ] 风格是否统一一致
- [ ] 文件命名是否规范

---

## 🚀 快速开始

### 第一步：生成第一批资源

```
1. 技能图标 - 70个（核心）
2. 元素图标 - 8个（UI基础）
3. 状态图标 - 15个（效果显示）
```

### 第二步：整合到项目

```
1. 放入对应目录
2. 运行编译检查
3. 查看游戏效果
```

### 第三步：扩展更多资源

```
4. 技能特效
5. UI组件
6. 背景
```