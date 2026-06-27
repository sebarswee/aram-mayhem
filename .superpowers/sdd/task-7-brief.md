## Task 7: 代码审计和最终验证

**Files:**
- All project files

**Interfaces:**
- Consumes: All previous tasks
- Produces: Verified clean code with no remnants

- [ ] **Step 1: 搜索 statusEffects 残留引用**

```bash
grep -r "statusEffects" src/ --include="*.ts"
```

Expected: 无结果

- [ ] **Step 2: 搜索 updateStatusEffects 残留引用**

```bash
grep -r "updateStatusEffects" src/ --include="*.ts"
```

Expected: 无结果

- [ ] **Step 3: 搜索 PlayerStatusEffect 残留引用**

```bash
grep -r "PlayerStatusEffect" src/ --include="*.ts"
```

Expected: 无结果

- [ ] **Step 4: 搜索 StatusEffect 残留引用（排除新定义）**

```bash
grep -r "StatusEffect" src/ --include="*.ts" | grep -v "StatusEffectModifier" | grep -v "StatusEffectType" | grep -v "hasStatusEffect"
```

Expected: 无结果或仅在注释中

- [ ] **Step 5: 运行 TypeScript 编译器**

```bash
npm run build
```

Expected: 编译成功，无错误，无警告

- [ ] **Step 6: 运行完整测试套件**

```bash
npm test
```

Expected: 所有测试通过

- [ ] **Step 7: 统计测试覆盖率**

```bash
npm test -- --coverage
```

Expected: 覆盖率 > 80%

- [ ] **Step 8: 手动游戏功能测试**

测试清单：
- [ ] 燃烧效果正常（DoT 伤害，橙色着色）
- [ ] 中毒效果正常（DoT 伤害，绿色着色）
- [ ] 冻结效果正常（定身，蓝色着色）
- [ ] 眩晕效果正常（定身，黄色着色）
- [ ] 定身效果正常（无法移动）
- [ ] 减速效果正常（速度降低）
- [ ] 攻击加成效果正常（攻击力提升，红色着色）
- [ ] 速度加成效果正常（速度提升，粒子效果）
- [ ] 护盾效果正常（吸收伤害）
- [ ] 破甲效果正常（受到伤害增加）

- [ ] **Step 9: 性能测试**

在游戏中应用多个修饰符，检查：
- 帧率稳定
- 无内存泄漏
- 修饰符正确过期和清理

- [ ] **Step 10: 创建验证报告**

创建文件 `docs/superpowers/validation/2026-06-27-modifier-integration-validation.md`：

```markdown
# 修饰符系统集成验证报告

## 验证日期
2026-06-27

## 验证结果

### 代码审计
- [ ] 无 statusEffects 残留引用
- [ ] 无 updateStatusEffects 残留引用
- [ ] 无旧接口定义残留
- [ ] TypeScript 编译通过

### 测试结果
- [ ] 所有单元测试通过
- [ ] 测试覆盖率 > 80%
- [ ] 所有技能测试通过

### 功能验证
- [ ] 所有状态效果正常工作
- [ ] 视觉效果正确应用
- [ ] 性能稳定

## 问题记录
（如果有问题，在此记录）

## 结论
验证通过 / 需要修复
```

- [ ] **Step 11: 最终提交**

```bash
git add docs/superpowers/validation/
git commit -m "docs: 添加修饰符系统集成验证报告"
```

---

## 实现完成

所有任务完成后，项目将达到以下状态：

1. ✅ Player 和 Enemy 正确实现 IBuffable 接口
2. ✅ 所有状态效果通过 ModifierStack 统一管理
3. ✅ 视觉效果完全通过修饰符回调实现
4. ✅ 无旧代码残留
5. ✅ 所有测试通过
6. ✅ 游戏功能正常
7. ✅ TypeScript 编译无错误

## 注意事项

1. **每个任务必须按顺序执行**，后续任务依赖前面的基础设施
2. **严禁偷工减料**，每一步都要完整实现和测试
3. **测试先行**，在实现功能前先编写测试
4. **频繁提交**，每个子步骤完成后都应提交
5. **代码审计**，最后一个任务确保无残留代码
