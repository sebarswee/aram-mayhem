# AI 美术资源生成提示词模板

> 本文档包含用于生成游戏美术资源的 AI 提示词模板
> 适用工具：Midjourney, DALL-E 3, Stable Diffusion, Leonardo.ai

---

## 📋 目录

1. [技能图标](#一技能图标)
2. [元素图标](#二元素图标)
3. [状态效果图标](#三状态效果图标)
4. [技能特效](#四技能特效)
5. [UI 组件](#五ui-组件)
6. [背景与环境](#六背景与环境)

---

## 一、技能图标

### 通用格式

```
[技能名称] skill icon, [风格], [颜色], game asset, transparent background, [尺寸], [额外细节]
```

### 基础技能图标

#### 🔥 火系技能

| 技能 | 提示词 |
|------|--------|
| **fireball** (火球术) | `fireball skill icon, pixel art style, orange and red flames, circular composition, game UI icon, transparent background, 64x64, simple design, fantasy magic` |
| **flame_wave** (火焰喷射) | `flame wave skill icon, pixel art, sweeping fire arc, orange flames, game skill icon, transparent background, 64x64, dynamic action` |
| **ignite** (聚焦灼烧) | `ignite skill icon, pixel art, focused flame beam, bright orange fire, single target magic, game icon, transparent background, 64x64` |
| **meteor** (陨石坠落) | `meteor skill icon, pixel art, flaming rock falling from sky, orange and red, ultimate ability icon, transparent background, 64x64, dramatic effect` |
| **dragon_breath** (炎龙吐息) | `dragon breath skill icon, pixel art, dragon head breathing fire, orange flames, ultimate skill, transparent background, 64x64, mythical creature` |
| **inferno** (烈焰风暴) | `inferno skill icon, pixel art, swirling fire vortex, intense orange flames, area effect, game icon, transparent background, 64x64` |

#### 💧 水系技能

| 技能 | 提示词 |
|------|--------|
| **water_bullet** (水弹) | `water bullet skill icon, pixel art, blue water droplet projectile, game skill icon, transparent background, 64x64, clean design` |
| **tidal_wave** (水波推进) | `tidal wave skill icon, pixel art, large water wave, blue and cyan, game skill icon, transparent background, 64x64, dynamic motion` |
| **water_dash** (水流冲刺) | `water dash skill icon, pixel art, water trail behind character, blue motion lines, mobility skill, transparent background, 64x64` |
| **purify** (净化) | `purify skill icon, pixel art, glowing blue water drop with sparkles, healing magic, game icon, transparent background, 64x64` |
| **tsunami** (海啸) | `tsunami skill icon, pixel art, massive wave, dark blue water, ultimate ability, transparent background, 64x64, powerful effect` |
| **abyss_vortex** (深渊漩涡) | `abyss vortex skill icon, pixel art, dark blue swirling water, black center, ultimate skill, transparent background, 64x64` |

#### ❄️ 冰系技能

| 技能 | 提示词 |
|------|--------|
| **ice_shard** (冰刺) | `ice shard skill icon, pixel art, sharp blue ice crystal, frozen projectile, game skill icon, transparent background, 64x64, cold effect` |
| **frost_nova** (冰晶爆发) | `frost nova skill icon, pixel art, ice crystals radiating outward, blue and white, area effect, transparent background, 64x64` |
| **ice_barrage** (冰弹连射) | `ice barrage skill icon, pixel art, multiple ice pellets, blue frozen bullets, rapid fire, transparent background, 64x64` |
| **glacial_spike** (冰川尖刺) | `glacial spike skill icon, pixel art, giant ice spike from ground, blue crystal, high damage, transparent background, 64x64` |
| **blizzard** (暴风雪) | `blizzard skill icon, pixel art, swirling snowstorm, blue and white, ultimate ability, transparent background, 64x64, cold wind` |
| **absolute_zero** (绝对零度) | `absolute zero skill icon, pixel art, deep blue frozen sphere, extreme cold, ultimate skill, transparent background, 64x64, legendary effect` |
| **ice_wall** (冰墙) | `ice wall skill icon, pixel art, blue ice barrier, defensive skill, game icon, transparent background, 64x64` |
| **frost_armor** (冰霜屏障) | `frost armor skill icon, pixel art, blue ice shield around character, defensive buff, transparent background, 64x64` |

#### ⚡ 雷系技能

| 技能 | 提示词 |
|------|--------|
| **lightning_bolt** (闪电箭) | `lightning bolt skill icon, pixel art, yellow electric bolt, sharp angle, game skill icon, transparent background, 64x64, electric energy` |
| **thunder_storm** (雷击阵) | `thunder storm skill icon, pixel art, multiple lightning strikes, yellow electric, area effect, transparent background, 64x64` |
| **lightning_focus** (雷电聚焦) | `lightning focus skill icon, pixel art, concentrated electric beam, yellow and white, single target, transparent background, 64x64` |
| **electric_field** (电场) | `electric field skill icon, pixel art, circular electric zone, yellow sparks, area control, transparent background, 64x64` |
| **arc_lightning** (电磁脉冲) | `arc lightning skill icon, pixel art, electric arcs spreading, yellow energy waves, game icon, transparent background, 64x64` |
| **thunder_strike** (雷神之怒) | `thunder strike skill icon, pixel art, massive lightning from sky, yellow and white, ultimate ability, transparent background, 64x64` |
| **thunder_apocalypse** (雷霆万钧) | `thunder apocalypse skill icon, pixel art, multiple lightning bolts everywhere, yellow storm, ultimate, transparent background, 64x64` |

#### ✨ 光系技能

| 技能 | 提示词 |
|------|--------|
| **holy_light** (圣光) | `holy light skill icon, pixel art, golden light rays, divine magic, game skill icon, transparent background, 64x64, heavenly glow` |
| **divine_shield** (神圣护盾) | `divine shield skill icon, pixel art, golden barrier, protective magic, defensive skill, transparent background, 64x64` |
| **halo** (光环) | `halo skill icon, pixel art, golden circular aura, healing buff, game icon, transparent background, 64x64, angelic effect` |
| **blessing** (祝福) | `blessing skill icon, pixel art, golden sparkles descending, stat boost buff, transparent background, 64x64` |
| **judgment_light** (审判之光) | `judgment light skill icon, pixel art, golden beam from heaven, holy damage, ultimate, transparent background, 64x64` |
| **sanctuary** (圣域) | `sanctuary skill icon, pixel art, large golden dome, protective field, ultimate skill, transparent background, 64x64` |

#### 🌑 暗系技能

| 技能 | 提示词 |
|------|--------|
| **shadow_bolt** (暗影箭) | `shadow bolt skill icon, pixel art, dark purple projectile, shadow magic, game skill icon, transparent background, 64x64` |
| **curse_aura** (诅咒链) | `curse aura skill icon, pixel art, dark purple chains spreading, curse magic, area effect, transparent background, 64x64` |
| **shadow_step** (暗影分身) | `shadow step skill icon, pixel art, dark silhouette duplicates, purple shadow, game icon, transparent background, 64x64` |
| **hex** (诅咒) | `hex skill icon, pixel art, purple curse symbol, debuff magic, game icon, transparent background, 64x64` |
| **void_rift** (虚空裂隙) | `void rift skill icon, pixel art, dark purple portal, void magic, ultimate ability, transparent background, 64x64` |
| **shadow_descent** (暗影降临) | `shadow descent skill icon, pixel art, dark purple rain from sky, shadow damage, ultimate, transparent background, 64x64` |
| **death_decay** (死亡凋零) | `death decay skill icon, pixel art, dark purple skull aura, lifesteal magic, ultimate, transparent background, 64x64` |

#### 🌿 草系技能

| 技能 | 提示词 |
|------|--------|
| **vine_whip** (藤蔓鞭) | `vine whip skill icon, pixel art, green thorny vine, nature magic, game skill icon, transparent background, 64x64` |
| **poison_cloud** (毒雾) | `poison cloud skill icon, pixel art, green toxic gas cloud, poison magic, area effect, transparent background, 64x64` |
| **seed_bomb** (种子炸弹) | `seed bomb skill icon, pixel art, green explosive seed, nature projectile, game icon, transparent background, 64x64` |
| **thorns** (荆棘) | `thorns skill icon, pixel art, green sharp thorns, defensive counter, game icon, transparent background, 64x64` |
| **overgrowth** (过度生长) | `overgrowth skill icon, pixel art, green vines covering area, nature ultimate, transparent background, 64x64` |
| **force_of_nature** (自然之力) | `force of nature skill icon, pixel art, green nature spirits, summon magic, ultimate, transparent background, 64x64` |
| **forest_rage** (森之怒) | `forest rage skill icon, pixel art, giant green vines erupting, nature ultimate, transparent background, 64x64` |

#### 🪨 土系技能

| 技能 | 提示词 |
|------|--------|
| **rock_spike** (地刺陷阱) | `rock spike skill icon, pixel art, brown stone spikes, earth magic, trap skill, transparent background, 64x64` |
| **sandstorm** (流沙陷阱) | `sandstorm skill icon, pixel art, brown swirling sand, earth magic, area effect, transparent background, 64x64` |
| **seismic_wave** (地裂线) | `seismic wave skill icon, pixel art, brown ground crack, earth magic, linear damage, transparent background, 64x64` |
| **stone_skin** (岩石壁垒) | `stone skin skill icon, pixel art, brown rock barrier, earth defense, game icon, transparent background, 64x64` |
| **earthquake** (大地震击) | `earthquake skill icon, pixel art, brown ground shaking, earth ultimate, area stun, transparent background, 64x64` |
| **mountain_collapse** (山崩地裂) | `mountain collapse skill icon, pixel art, brown rocks falling, earth ultimate, transparent background, 64x64` |
| **earth_guardian** (大地守护) | `earth guardian skill icon, pixel art, brown stone shield, earth defense, ultimate, transparent background, 64x64` |

---

## 二、元素图标

### 通用格式

```
[element] element icon, pixel art style, [colors], simple symbol, game UI, transparent background, 64x64
```

| 元素 | 提示词 |
|------|--------|
| **Fire** | `fire element icon, pixel art style, orange and red flame symbol, simple design, game UI element, transparent background, 64x64` |
| **Water** | `water element icon, pixel art style, blue water drop, simple design, game UI element, transparent background, 64x64` |
| **Ice** | `ice element icon, pixel art style, blue snowflake or crystal, simple design, game UI element, transparent background, 64x64` |
| **Lightning** | `lightning element icon, pixel art style, yellow thunderbolt, simple design, game UI element, transparent background, 64x64` |
| **Holy** | `holy element icon, pixel art style, golden sun or cross, simple design, game UI element, transparent background, 64x64` |
| **Shadow** | `shadow element icon, pixel art style, dark purple moon or eye, simple design, game UI element, transparent background, 64x64` |
| **Grass** | `grass element icon, pixel art style, green leaf, simple design, game UI element, transparent background, 64x64` |
| **Earth** | `earth element icon, pixel art style, brown mountain or rock, simple design, game UI element, transparent background, 64x64` |

---

## 三、状态效果图标

### Buff 图标

| 状态 | 提示词 |
|------|--------|
| **shield** (护盾) | `shield buff icon, pixel art style, blue protective barrier, positive status effect, game UI, transparent background, 32x32` |
| **heal** (治疗) | `healing buff icon, pixel art style, green cross or heart, positive status effect, game UI, transparent background, 32x32` |
| **attack_boost** (攻击提升) | `attack boost icon, pixel art style, red upward arrow with sword, buff status, game UI, transparent background, 32x32` |
| **speed_boost** (速度提升) | `speed boost icon, pixel art style, yellow running feet or wind, buff status, game UI, transparent background, 32x32` |
| **damage_reflect** (伤害反弹) | `damage reflect icon, pixel art style, orange mirrored shield, buff status, game UI, transparent background, 32x32` |

### Debuff 图标

| 状态 | 提示词 |
|------|--------|
| **burn** (燃烧) | `burn debuff icon, pixel art style, orange flames, negative status effect, game UI, transparent background, 32x32` |
| **freeze** (冻结) | `freeze debuff icon, pixel art style, blue ice block, negative status effect, game UI, transparent background, 32x32` |
| **poison** (中毒) | `poison debuff icon, pixel art style, green skull or droplet, negative status effect, game UI, transparent background, 32x32` |
| **stun** (眩晕) | `stun debuff icon, pixel art style, yellow stars spinning, negative status effect, game UI, transparent background, 32x32` |
| **slow** (减速) | `slow debuff icon, pixel art style, blue snail or clock, negative status effect, game UI, transparent background, 32x32` |
| **knockback** (击退) | `knockback icon, pixel art style, gray push arrow, status effect, game UI, transparent background, 32x32` |
| **defense_break** (降防) | `defense break debuff icon, pixel art style, purple broken shield, negative status, game UI, transparent background, 32x32` |
| **root** (定身) | `root debuff icon, pixel art style, brown chains or vines, negative status, game UI, transparent background, 32x32` |

---

## 四、技能特效

### 爆炸效果（单帧）

#### 通用格式

```
[element] explosion effect, pixel art style, [colors], game visual effect, transparent background, 256x256, dynamic energy burst
```

| 效果 | 提示词 |
|------|--------|
| **Fire Explosion** | `fire explosion effect, pixel art style, orange and red flames burst, game visual effect, transparent background, 256x256, dynamic energy, 8-bit style` |
| **Water Splash** | `water splash explosion, pixel art style, blue water burst, game visual effect, transparent background, 256x256, liquid impact` |
| **Ice Shatter** | `ice shatter explosion, pixel art style, blue and white ice crystals breaking, game visual effect, transparent background, 256x256, frozen burst` |
| **Lightning Burst** | `lightning burst explosion, pixel art style, yellow electric sparks, game visual effect, transparent background, 256x256, electric discharge` |
| **Holy Burst** | `holy light burst, pixel art style, golden white light rays, game visual effect, transparent background, 256x256, divine explosion` |
| **Shadow Burst** | `shadow explosion effect, pixel art style, dark purple energy burst, game visual effect, transparent background, 256x256, void explosion` |
| **Nature Burst** | `nature explosion effect, pixel art style, green leaves and vines, game visual effect, transparent background, 256x256, plant burst` |
| **Earth Burst** | `earth explosion effect, pixel art style, brown rocks and dust, game visual effect, transparent background, 256x256, ground burst` |

### 爆炸效果（序列帧）

#### 通用格式

```
[element] explosion sprite sheet, pixel art style, [colors], 8 frames horizontal, game asset, transparent background, 512x64
```

| 效果 | 提示词 |
|------|--------|
| **Fire Explosion Sheet** | `fire explosion sprite sheet, pixel art style, orange red flames, 8 frames animation, horizontal layout, game asset, transparent background, 512x64, pixel animation` |
| **Ice Explosion Sheet** | `ice explosion sprite sheet, pixel art style, blue white crystals, 8 frames animation, horizontal layout, game asset, transparent background, 512x64` |
| **Lightning Strike Sheet** | `lightning strike sprite sheet, pixel art style, yellow electric bolt, 8 frames animation, horizontal layout, game asset, transparent background, 512x64` |

### 持续效果

| 效果 | 提示词 |
|------|--------|
| **Poison Cloud** | `poison cloud effect, pixel art style, green toxic fog, game visual effect, transparent background, 256x256, swirling gas, game asset` |
| **Blizzard Zone** | `blizzard zone effect, pixel art style, blue white snowstorm, game visual effect, transparent background, 256x256, swirling snow and ice` |
| **Fire Pillar** | `fire pillar effect, pixel art style, orange red flame column, game visual effect, transparent background, 128x256, vertical flames` |
| **Electric Field** | `electric field effect, pixel art style, yellow electric circle, game visual effect, transparent background, 256x256, charged zone` |
| **Healing Circle** | `healing circle effect, pixel art style, green golden light on ground, game visual effect, transparent background, 256x256, restoration magic` |

### 大招特效

| 效果 | 提示词 |
|------|--------|
| **Meteor Fall** | `meteor fall effect, pixel art style, flaming rock falling with fire trail, game ultimate effect, transparent background, 256x256, dramatic impact` |
| **Tsunami Wave** | `tsunami wave effect, pixel art style, massive blue water wave, game ultimate effect, transparent background, 512x256, overwhelming force` |
| **Thunder Storm** | `thunder storm effect, pixel art style, multiple yellow lightning bolts, game ultimate effect, transparent background, 256x256, chaotic energy` |
| **Black Hole** | `black hole effect, pixel art style, dark purple gravitational vortex, game ultimate effect, transparent background, 256x256, space distortion` |
| **Forest Awakening** | `forest awakening effect, pixel art style, giant green vines erupting from ground, game ultimate, transparent background, 256x256, nature power` |
| **Earthquake** | `earthquake effect, pixel art style, brown ground cracking with debris, game ultimate effect, transparent background, 256x256, seismic destruction` |

### Buff/护盾效果

| 效果 | 提示词 |
|------|--------|
| **Magic Shield** | `magic shield effect, pixel art style, blue translucent barrier, game buff effect, transparent background, 256x256, protective dome` |
| **Fire Shield** | `fire shield effect, pixel art style, orange flame barrier around character, game buff, transparent background, 256x256` |
| **Ice Armor** | `ice armor effect, pixel art style, blue frozen barrier, game buff effect, transparent background, 256x256, crystalline protection` |
| **Divine Shield** | `divine shield effect, pixel art style, golden holy barrier, game buff effect, transparent background, 256x256, angelic protection` |
| **Healing Aura** | `healing aura effect, pixel art style, green golden light particles, game buff, transparent background, 256x256, regeneration field` |

---

## 五、UI 组件

### 按钮样式

| 组件 | 提示词 |
|------|--------|
| **Primary Button** | `game UI button, pixel art style, blue gradient button, hover and normal states, game interface, transparent background, 200x60, 9-slice scalable` |
| **Danger Button** | `game UI button, pixel art style, red gradient button, game interface, transparent background, 200x60, pixel art UI` |
| **Skill Button** | `skill slot button, pixel art style, dark frame with glow border, game UI, transparent background, 80x80, empty skill slot` |
| **Upgrade Button** | `upgrade button, pixel art style, golden border with arrow, game UI, transparent background, 100x100, progression icon` |

### 面板样式

| 组件 | 提示词 |
|------|--------|
| **Panel Frame** | `game UI panel frame, pixel art style, dark blue gradient with golden border, game interface, transparent background, 400x300, 9-slice scalable` |
| **Tooltip Box** | `game tooltip box, pixel art style, dark background with light border, game UI, transparent background, 300x150, info panel` |
| **Skill Panel** | `skill selection panel, pixel art style, dark frame with slots, game UI, transparent background, 500x400, upgrade screen` |
| **Inventory Grid** | `inventory grid panel, pixel art style, multiple item slots, game UI, transparent background, 400x400, equipment screen` |

### 进度条

| 组件 | 提示词 |
|------|--------|
| **Health Bar** | `health bar, pixel art style, red gradient bar with frame, game UI, transparent background, 200x20, HP indicator` |
| **Mana Bar** | `mana bar, pixel art style, blue gradient bar with frame, game UI, transparent background, 200x20, MP indicator` |
| **Experience Bar** | `experience bar, pixel art style, golden gradient bar with frame, game UI, transparent background, 300x15, XP indicator` |
| **Cooldown Overlay** | `cooldown overlay, pixel art style, dark semi-transparent clock sweep, game UI, transparent background, 64x64, skill cooldown` |

---

## 六、背景与环境

### 游戏背景

| 场景 | 提示词 |
|------|--------|
| **Battle Arena** | `game battle arena background, pixel art style, dark fantasy arena, top-down view, game background, 1920x1080, atmospheric lighting` |
| **Main Menu** | `game main menu background, pixel art style, fantasy landscape, game art, 1920x1080, epic scenery` |
| **Upgrade Screen** | `upgrade screen background, pixel art style, mystical library or workshop, game UI background, 1280x720, magical atmosphere` |

### 地图元素

| 元素 | 提示词 |
|------|--------|
| **Ground Tile** | `ground tile, pixel art style, stone floor pattern, seamless tile, game asset, transparent background, 64x64, top-down view` |
| **Wall Tile** | `wall tile, pixel art style, stone brick wall, seamless tile, game asset, transparent background, 64x64, top-down view` |
| **Decoration** | `game decoration props, pixel art style, fantasy objects like barrels crates torches, game assets, transparent background, various sizes` |

---

## 🎨 风格变体提示词

### 像素风格变体

| 风格 | 后缀提示词 |
|------|--------|
| **经典像素** | `classic pixel art style, 8-bit, limited color palette, retro game aesthetic` |
| **高清像素** | `high resolution pixel art, 16-bit style, detailed sprites, SNES era aesthetic` |
| **现代像素** | `modern pixel art, smooth gradients, detailed shading, contemporary indie game style` |
| **可爱像素** | `cute pixel art, chibi style, rounded shapes, bright colors, kawaii aesthetic` |
| **暗黑像素** | `dark pixel art, gothic style, muted colors, horror game aesthetic` |

### 颜色方案变体

在提示词中添加颜色指定：

```
[base prompt], [color scheme]

示例：
fireball skill icon, pixel art style, vibrant orange and red, warm colors
ice shard skill icon, pixel art style, cool blue and cyan, cold colors
poison cloud effect, pixel art style, toxic green and yellow, sickly colors
```

---

## 📐 尺寸规格

### 推荐尺寸

| 资源类型 | 推荐尺寸 | 说明 |
|----------|----------|------|
| 技能图标 | 64x64 或 128x128 | 2的幂次方，便于缩放 |
| 状态图标 | 32x32 或 64x64 | 小尺寸，清晰可见 |
| 特效序列帧 | 每帧 128x128 或 256x256 | 取决于效果复杂度 |
| UI 组件 | 根据需要 | 使用 9-slice 可拉伸 |
| 背景 | 1920x1080 或 1280x720 | 标准分辨率 |

---

## 🔧 批量生成技巧

### Midjourney 批量提示词

```
方法1: 使用 --repeat 参数
fireball skill icon, pixel art style, orange flames --repeat 4

方法2: 使用排列语法
{fire, ice, lightning} skill icon, pixel art style, game asset, transparent background

方法3: 使用变体
fireball skill icon, pixel art style, orange flames --v 6 --s 250 --q 1
```

### Stable Diffusion 批量脚本

```
# 使用 x/y/z plot 扩展批量生成
Prompt:
fireball skill icon, pixel art style, [fire|ice|lightning|earth], game asset

或者使用 wildcards:
fireball skill icon, pixel art style, __element__, game asset
```

---

## 💾 输出格式建议

### 文件格式

| 资源类型 | 推荐格式 | 说明 |
|----------|----------|------|
| 图标/精灵 | PNG (透明背景) | 必须 |
| 特效 | PNG 或 GIF | 动画用序列帧PNG |
| 背景 | PNG 或 JPG | 背景可用JPG节省空间 |
| UI | PNG (9-slice) | 需要可拉伸边缘 |

### 文件命名规范

```
图标: icon_[skill_id].png
      例: icon_fireball.png

特效: effect_[name]_[frame].png
      例: effect_fire_explosion_01.png

UI: ui_[component]_[state].png
    例: button_primary_normal.png
        button_primary_hover.png
```

---

## ✅ 生成检查清单

每次生成后检查：

- [ ] 透明背景是否正确
- [ ] 尺寸是否符合需求
- [ ] 风格是否统一（像素大小一致）
- [ ] 颜色是否符合元素主题
- [ ] 是否需要后期调整（去杂点、调整边缘）

---

## 🚀 快速开始示例

### 生成一整套火系技能图标

```
1. Midjourney 输入:
   fireball skill icon, pixel art style, orange flames, game UI, transparent background, 64x64 --v 6

2. 保存结果，选择最佳

3. 使用 Photopea 去背景（如果需要）

4. 调整尺寸至精确 64x64

5. 重命名为 icon_fireball.png

6. 重复步骤 1-5 生成其他火系技能
```

---

**提示**：生成后建议使用 Aseprite 或 Photopea 进行微调，确保所有图标风格完全一致。
