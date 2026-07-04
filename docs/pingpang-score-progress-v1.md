# PingPang 分数进度条 V1 设计稿

## 目标

- 这一版只做 UI 结构和视觉方案，不改 `PingPangControl`、`PingPangModel`、`PingPangPage` 现有分数流转逻辑。
- 保留当前左上角大分数字样和右上角时间，不替换、不挪动已有核心信息。
- 先把“根据分数展示奖励进度”的视觉骨架定下来，后续只需要在 `onScoreUpdate()` 里接一行更新入口。
- 当前实现已经调整为“编辑器拖属性”方案：进度条、marker、奖励节点和素材都在 Cocos 编辑器中绑定，脚本不再运行时创建 UI。

## 设计结论

- 进度条放在页面顶部中间区域，位于现有分数区下方、球活动区上方。
- 轨道使用“白底 + 蓝色已达进度”的双层表现，和参考图一致。
- 当前进度用鞋子图标表示，鞋子沿轨道移动。
- 奖励节点先做 3 档，使用现有奖励页图标做占位，先把结构跑通，后面再替换正式美术也不会影响代码结构。

## 首版资源映射

- 当前进度鞋子：`assets/resources/image/game/xiezi.png`
- 奖励节点 1：`assets/resources/image/reward/reward_11.png`
- 奖励节点 2：`assets/resources/image/reward/reward_12.png`
- 奖励节点 3：`assets/resources/image/reward/reward_13.png`
- 轨道底图：`assets/resources/image/rank/progressBg.png`
- 轨道填充：`assets/resources/image/rank/progressBar.png`

## 推荐档位

这版先做固定 3 档，先服务视觉和结构，不和奖励页现有配置强绑定。

```ts
export const PingPangProgressMilestones = [
  { key: 'video',    score: 100, icon: 'image/reward/reward_11/spriteFrame' },
  { key: '100_hole', score: 300, icon: 'image/reward/reward_12/spriteFrame' },
  { key: '500_hole', score: 500, icon: 'image/reward/reward_13/spriteFrame' },
];
```

说明：

- `100 / 300 / 500` 只是 V1 的展示档位，后面可以再按运营需要调整。
- `key` 可以沿用奖励语义，但不要直接复用 `RewardConfig` 作为 UI 位置数据源。
- 后续如果奖励档位变化，只改这里，不动 UI 组件主体。

## 布局建议

以 `PingPangPage` 设计分辨率 `750 x 1624` 为基准：

- `ScoreProgressRoot`
  - `width: 620`
  - `height: 150`
  - `horizontalCenter: 0`
  - `top: 250`

这样能避开当前左上角分数和右上角时间，同时不会压到中部玩法区。

## Prefab 节点结构

```text
PingPangPage
└─ ScoreProgressRoot
   ├─ TrackBg
   ├─ TrackFill
   │  ├─ Bar
   │  └─ ProgressBar
   ├─ MilestoneLayer
   │  ├─ Milestone_1
   │  │  ├─ Icon
   │  │  └─ ScoreLabel
   │  ├─ Milestone_2
   │  │  ├─ Icon
   │  │  └─ ScoreLabel
   │  └─ Milestone_3
   │     ├─ Icon
   │     └─ ScoreLabel
   ├─ CurrentMarker
   │  ├─ ShoeIcon
   │  └─ TargetBadge
   └─ ReachFx
```

## 视觉细节

### 1. 轨道

- `TrackBg`
  - 使用 `progressBg.png`
  - 建议宽 `580`，高 `24`
  - `Sprite.Type = SLICED`
- `TrackFill`
  - 使用 `ProgressBar`
  - `Bar` 使用 `progressBar.png`
  - 填充方向从左到右
  - 默认进度 `0`

### 2. 奖励节点

- 3 个节点固定摆放，不跟分数移动。
- 推荐位置：
  - `Milestone_1.x = -180`
  - `Milestone_2.x = 30`
  - `Milestone_3.x = 240`
- 节点默认位于轨道中心线上。
- 未到达状态：
  - 缩放 `0.9`
  - 颜色略灰
- 可达或已达状态：
  - 缩放 `1`
  - 正常颜色
  - 到达瞬间做一次 `pop` 动画

### 3. 当前进度标记

- `CurrentMarker` 用 `xiezi.png`
- 默认在轨道起点左侧偏上 8~12 像素，和参考图接近
- 建议：
  - `width: 90`
  - `height: 54`
  - `scale: 1`
- 该节点不参与档位布局，只按当前分数在整条轨道上移动

### 4. 当前目标提示

- `TargetBadge` 先复用 `reward_11.png`
- 位置在鞋子上方 `60~70` 像素
- 用来表达“当前正在冲的奖励点”
- 第一版先不做领取状态切换，只做视觉提示

## 组件拆分建议

第一版先准备一个独立组件，后面方便直接接入：

```ts
class ScoreMilestoneBar extends Component {
  public reset(): void;
  public setScore(score: number): void;
  public setMilestones(list: IMilestone[]): void;
}
```

组件职责：

- 管理轨道填充
- 管理鞋子位置
- 管理节点已达/未达状态
- 管理到达节点时的轻动画

组件不负责：

- 不计算实际得分
- 不请求奖励
- 不弹奖励弹窗
- 不决定奖励是否可领取

## 分数到位置的映射

第一版建议使用“固定最大值 + 线性移动”：

- 起点分数：`0`
- 终点分数：`500`
- 当前位置：`clamp(score / 500, 0, 1)`

原因：

- 先把视觉和体验跑通，结构最简单。
- 和参考图匹配，鞋子会顺滑移动。
- 后面如果改成“分段插值”也只需要替换组件内部算法，不影响 prefab 结构。

## 状态定义

### 节点状态

- `locked`
  - 还没达到该节点分数
  - 图标偏灰，缩小一点
- `active`
  - 当前正在冲的下一个目标
  - 图标正常显示，`TargetBadge` 指向当前鞋子区域
- `reached`
  - 已达到该节点
  - 图标正常显示
  - 播放一次放大回弹

### 轨道状态

- 鞋子左侧：蓝色已达进度
- 鞋子右侧：白色未达进度
- 分数超过最后一档后，鞋子停在终点

## 推荐接线点

这版先不接逻辑，但后面正式接入时只需要 2 个入口：

- `PingPangPage.onGameStart()` 里调用 `progressBar.reset()`
- `PingPangPage.onScoreUpdate(score)` 里调用 `progressBar.setScore(score)`

这样不会改动现有得分来源，所有球拍得分、鞋花得分、连击奖励得分都会自然同步。

## V1 范围边界

这版包含：

- 顶部进度条 UI
- 奖励节点展示
- 鞋子移动标记
- 已达/未达状态
- 轻量到达动画

这版不包含：

- 奖励领取按钮
- 点击节点交互
- 奖励弹窗联动
- 真实奖励发放逻辑
- 不同分档的特殊特效

## 下一步实现顺序

1. 在 `PingPangPage.prefab` 中加入 `ScoreProgressRoot`
2. 新建 `ScoreMilestoneBar.ts`
3. 先写死 3 档配置，跑通静态显示
4. 再在 `PingPangPage` 里只接 UI 更新，不改分数逻辑
