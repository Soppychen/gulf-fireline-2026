# AGENTS.md

本文件约定《海湾火线 2026》项目的开发共识、目录结构、命名规范、题材边界和验收要求。所有后续开发代理和协作者在改动本仓库前应先阅读本文。

## 1. 项目目标

本项目是一款 Web 首发、后续可扩展 Android 的纵向卷轴空战射击游戏。玩法致敬《1942/1943/1944》系列，Demo 阶段以美国空军视角展开第一关“闪电攻击”，后续支持美国、以色列、伊朗等不同阵营视角。

核心目标：

- 先完成可玩的 Web Demo。
- 竖屏优先，兼顾桌面键盘和手机触摸。
- 以街机手感、弹幕可读性、关卡节奏为第一优先级。
- 现实题材只作为视觉和世界观灵感，具体内容必须架空化。

## 2. 题材与内容边界

本项目涉及现实冲突灵感，所有实现必须遵守以下边界：

- 不使用真实人物作为攻击、暗杀或“斩首”目标。
- 不使用真实行动路线、基地坐标、目标坐标或现实可操作战术信息。
- 不使用真实国家旗帜、军徽、部队番号作为可攻击对象。
- 不制作现实仇恨、民族仇恨、宗教仇恨表达。
- 不描绘平民伤亡。
- 民用建筑和宗教建筑只能作为远景或背景氛围，不作为可攻击目标。
- 对外文案使用“高价值指挥节点突袭”“防空链路压制”等架空军事表达。
- “斩首任务”只可作为内部设计代号，不作为玩家可见文案。

## 3. 推荐技术栈

Demo 默认技术栈：

- TypeScript
- Phaser 3
- Vite
- WebAudio
- localStorage

如需替换技术栈，必须先更新本文和 `docs/概要设计文档.md` 中的技术概要。

## 4. 目录结构约定

项目正式进入开发后，使用以下目录：

```text
.
├── AGENTS.md
├── README.md
├── docs/
│   ├── 概要设计文档.md
│   └── 开发任务清单.md
├── public/
│   └── favicon.png
├── src/
│   ├── main.ts
│   ├── scenes/
│   │   ├── BootScene.ts
│   │   ├── MenuScene.ts
│   │   ├── GameScene.ts
│   │   └── ResultScene.ts
│   ├── entities/
│   │   ├── Player.ts
│   │   ├── Enemy.ts
│   │   ├── Bullet.ts
│   │   ├── Missile.ts
│   │   ├── Pickup.ts
│   │   └── Boss.ts
│   ├── systems/
│   │   ├── CollisionSystem.ts
│   │   ├── InputSystem.ts
│   │   ├── ScoreSystem.ts
│   │   ├── SpawnSystem.ts
│   │   └── WeaponSystem.ts
│   ├── data/
│   │   ├── aircraft.ts
│   │   ├── enemies.ts
│   │   ├── factions.ts
│   │   ├── levels.ts
│   │   └── weapons.ts
│   ├── ui/
│   ├── utils/
│   └── types/
├── assets/
│   ├── sprites/
│   ├── backgrounds/
│   ├── fx/
│   ├── ui/
│   ├── audio/
│   └── music/
└── tests/
```

目录职责：

- `docs/`：产品、设计、任务、制作规范。
- `src/scenes/`：Phaser 场景。
- `src/entities/`：玩家、敌人、子弹、拾取物、Boss 等游戏对象。
- `src/systems/`：输入、碰撞、刷怪、武器、评分等独立系统。
- `src/data/`：数值和关卡配置，策划可读、可调整。
- `assets/`：游戏资源，只放运行所需素材。
- `tests/`：自动化测试或关键逻辑测试。

## 5. 文件命名规范

代码文件：

- TypeScript 类文件使用 `PascalCase.ts`，例如 `Player.ts`、`GameScene.ts`。
- 配置和工具文件使用 `camelCase.ts`，例如 `levelLoader.ts`、`mathUtils.ts`。
- 数据配置文件使用复数或领域名小写，例如 `aircraft.ts`、`weapons.ts`。
- 测试文件使用 `.test.ts` 后缀，例如 `scoreSystem.test.ts`。

资源文件：

- 统一使用英文小写、数字和下划线。
- 不使用空格。
- 不使用中文文件名。
- 不使用真实装备型号作为唯一资源名，可用原创代号。

示例：

```text
aircraft_player_afx35.png
enemy_drone_patrol.png
enemy_fighter_light.png
ground_aa_cannon.png
ground_missile_truck.png
boss_command_convoy.png
bullet_player_cannon.png
bullet_enemy_red.png
missile_enemy_tracking.png
fx_explosion_small.png
ui_icon_shield.png
sfx_player_cannon.wav
music_stage01_loop.ogg
```

## 6. 编码约定

- 默认使用 TypeScript 严格类型。
- 游戏数值不要散落在逻辑代码中，放入 `src/data/`。
- 关卡刷怪不要硬编码在 `GameScene.ts`，放入 `levels.ts` 或 `SpawnSystem.ts`。
- 动态对象优先使用对象池，包括子弹、导弹、敌人、爆炸特效和拾取物。
- 玩家飞机视觉尺寸与受击判定分离。
- 导弹系统必须区分敌方地对空导弹和玩家机载导弹，不要共用完全相同的行为、颜色和音效。
- 所有输入通过 `InputSystem` 汇总，避免场景和实体各自读取输入。
- UI 状态应由游戏状态驱动，避免在多个地方重复维护暂停、胜利、失败状态。
- 桌面和移动端必须共享核心逻辑，只在输入映射和 UI 布局上分支。

## 7. 数据配置约定

阵营、机体、敌人、武器、关卡均应数据驱动。

建议基础类型：

```ts
export type FactionId = 'usaf' | 'israel' | 'iran';

export interface AircraftConfig {
  id: string;
  factionId: FactionId;
  displayName: string;
  maxHp: number;
  speed: number;
  hitboxRadius: number;
  weaponId: string;
  skillId?: string;
}
```

注意：

- `displayName` 可以本地化，`id` 必须稳定。
- `FactionId` 可以扩展，但不要在代码中写死具体阵营逻辑。
- Demo 默认使用 `usaf` 阵营。

## 8. 美术资产约定

- 所有美术资产必须原创或明确可商用授权。
- 现实机体和建筑只可作为轮廓、氛围和比例参考。
- 不直接描摹新闻照片、军工厂商图片、真实军徽和真实旗帜。
- 玩家、敌人、拾取物、敌弹必须色彩区分明确。
- 资源导出优先使用 PNG 或 WebP。
- 动画资源优先整理成 spritesheet 或 texture atlas。
- 背景图应分段或循环，避免单张超大图。

## 9. 音频资产约定

- 音效放在 `assets/audio/`。
- 音乐放在 `assets/music/`。
- 自动射击音效必须短促、低疲劳。
- 导弹锁定音必须清晰，但要避免频繁尖锐重复。
- 音乐和循环音效需在玩家交互后播放，以符合浏览器自动播放限制。
- 同类爆炸音效可以准备多个变体，播放时随机选择。

## 10. UI 与输入约定

桌面输入：

- 方向键或 WASD：移动。
- Shift：低速精密移动。
- Space：主动技能。
- Esc 或 P：暂停。

移动输入：

- 默认使用手指拖拽飞机跟随。
- 主动技能按钮放在右下或右侧安全区。
- 暂停按钮放在右上安全区。
- HUD 不遮挡玩家主要移动区域。

UI 注意：

- 竖屏基准设计。
- 关键文字必须在手机上可读。
- 不在游戏内写长篇说明。
- 任务简报文案保持架空，不使用现实宣传口吻。

## 11. 关卡设计约定

Demo 第一关：

- 关卡名：闪电攻击。
- 对外任务类型：高价值指挥节点突袭。
- 玩家阵营：美国空军。
- 推荐时长：3-4 分钟。
- Boss：移动指挥车队。

关卡节奏：

- 前 30 秒低压教学。
- 每 20-30 秒引入一种变化。
- 新敌人首次出现时数量要少。
- 导弹必须有预警和躲避窗口。
- 敌方地对空导弹发射前至少保留 0.6-1.0 秒锁定预警。
- 玩家机载导弹通过补给获得，Demo 优先采用有限弹药而非永久解锁。
- Boss 前短暂降低杂兵压力。
- 玩家死亡原因必须可理解。

## 12. 性能约定

目标：

- 桌面浏览器稳定 60 FPS。
- 中端手机浏览器稳定 45-60 FPS。
- Demo 同屏弹体建议不超过 120 个。

实现要求：

- 对象池复用动态对象。
- 避免每帧创建临时对象。
- 避免大量透明大图叠加。
- 大量碰撞检测使用分组或空间划分，不要做无脑全量两两检测。
- 背景滚动使用循环贴图或少量分段图。

## 13. 测试与验收

每次完成可运行改动后，至少检查：

- `npm run build` 是否通过。
- 桌面键盘移动是否正常。
- 触摸移动是否正常。
- 暂停、失败、胜利、重开是否正常。
- 第一关能否从开始玩到结算。
- 浏览器控制台是否有明显错误。

如项目加入自动化测试，新增或修改核心逻辑时应补充测试。

## 14. 文档维护

- 改变玩法范围时，同步更新 `docs/概要设计文档.md`。
- 改变任务拆分或里程碑时，同步更新 `docs/开发任务清单.md`。
- 改变目录结构、技术栈、命名规范时，同步更新本文件。
- 新增真实题材相关表达时，必须先检查“题材与内容边界”。

## 15. 开发优先级

单人或小团队开发时，按以下顺序推进：

1. 用几何图形完成完整玩法闭环。
2. 完成第一关时间轴和 Boss。
3. 接入键盘和触摸双输入。
4. 完成结算、分数、最高分。
5. 替换玩家、敌人、背景、特效资源。
6. 接入音效和音乐。
7. 做移动端性能和布局优化。

不要在核心手感完成前投入过多时间制作复杂美术和长篇剧情。
