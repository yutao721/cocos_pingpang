# 颠球游戏 — 球运动物理设计文档

## 一、坐标系说明

采用 Cocos Creator 默认坐标系：
- X 轴：向右为正
- Y 轴：向上为正
- 设计分辨率：750 × 1334
- 屏幕水平范围：[-375, +375]
- 屏幕垂直范围：[-667, +667]

```
        Y+
        ↑
        │   屏幕顶部 y = +667
        │
  X- ───┼─── X+
        │
        │   屏幕底部 y = -667
        ↓ Y-
```

---

## 二、球的运动模型

球每帧根据速度向量（vx, vy）更新位置，**无重力**，匀速直线运动 + 边界反弹。

```
ballX += vx * dt
ballY += vy * dt
```

初始状态：
- 位置：屏幕中央偏上 (0, 200)
- 速度：斜向下，vx 随机取正负，vy < 0（向下）

---

## 三、边界反弹规则

### 3.1 碰左/右墙

```
条件：ballX - BallRadius < -375  或  ballX + BallRadius > 375
处理：vx = -vx   （X 方向速度取反）
```

```
  左墙          右墙
  │  ↗             ↘  │
  │ /               \ │
  │/                 \│
  ↗                   ↘
（反弹后往右飞）   （反弹后往左飞）
```

### 3.2 碰顶部

```
条件：ballY + BallRadius > 667
处理：vy = -vy   （Y 方向速度取反，变为向下）
```

### 3.3 到达球拍高度（关键判断）

当球 Y 坐标下降到球拍 Y 高度时，判断是否命中球拍：

```
条件：ballY - BallRadius <= paddleY + PaddleHeight/2
分支：
  ├─ |ballX - paddleX| <= PaddleWidth/2  → 命中球拍 → onBallHitPaddle()
  └─ 超出球拍范围                          → 球落地   → onBallFall()
```

---

## 四、球拍反弹公式（核心）

反弹方向由 **球心相对球拍中心的偏移** 决定，而不是简单地 vy 取反。

### 4.1 计算偏移比例

```
offset = ballX - paddleX
ratio  = offset / (PaddleWidth / 2)    // 归一化到 [-1.0, +1.0]
ratio  = clamp(ratio, -1.0, 1.0)       // 防止超出边缘时越界
```

### 4.2 计算反弹速度

```
speed = BallInitSpeed * getBallSpeedMul()   // Phase1 后速度 × 1.4

vx = ratio * speed                          // 偏移越大，横向速度越大
vy = +speed * VY_RATIO                      // 固定向上，保证弹起高度
```

其中 `VY_RATIO = 0.75`（可调），表示垂直速度占总速度的比例。

> 💡 注意：`vx² + vy²` 不一定等于 `speed²`，VY_RATIO 是经验值，
> 目的是保证球弹起足够高，玩家有时间移动球拍。

### 4.3 图示

```
         撞左侧              撞中间              撞右侧
           ↖                   ↑                   ↗
    ┌───────●───────┐  ┌───────●───────┐  ┌───────●───────┐
    │  球拍(左1/3)  │  │   球拍(中心)  │  │  球拍(右1/3)  │
    └───────────────┘  └───────────────┘  └───────────────┘

  ratio ≈ -0.8          ratio ≈ 0           ratio ≈ +0.8
  vx 大幅向左           vx ≈ 0（垂直弹起）   vx 大幅向右
  vy 向上固定           vy 向上固定          vy 向上固定
```

### 4.4 完整示例

```
PaddleWidth = 160，BallInitSpeed = 400，VY_RATIO = 0.75

球撞在球拍左侧 40px 处：
  offset = -40
  ratio  = -40 / 80 = -0.5
  vx     = -0.5 * 400 = -200   （向左）
  vy     = +400 * 0.75 = +300  （向上）

球撞在球拍中心：
  offset = 0
  ratio  = 0
  vx     = 0                   （垂直弹起）
  vy     = +300

球撞在球拍右端：
  offset = +80
  ratio  = +1.0
  vx     = +400                （向右最大）
  vy     = +300
```

---

## 五、Phase1 球速加快

当分数达到 `Phase1ScoreThreshold(100)` 时触发：

```
speed = BallInitSpeed * Phase1BallSpeedMul(1.4)
     = 400 * 1.4 = 560
```

**效果**：vx 和 vy 同步变大，球横向移动更快，玩家来不及追，难度明显提升。
触发时机：下一次球命中球拍弹起时生效（不立刻改变飞行中的球速）。

---

## 六、游戏流程图

```
         游戏开始
            │
            ▼
     球从初始位置出发
      (vx随机, vy向下)
            │
            ▼
    ┌─── 每帧 update(dt) ───┐
    │                       │
    │  ballX += vx*dt       │
    │  ballY += vy*dt       │
    │                       │
    │  碰左/右墙？ → vx取反  │
    │  碰顶部？   → vy取反  │
    │                       │
    │  到达球拍高度？        │
    │    ├─ 命中 → 弹起     │
    │    └─ 未命中 → 落地   │
    └───────────────────────┘
            │
     ┌──────┴──────┐
     │             │
   弹起           落地
 连颠+1         游戏结束
 分数更新       结算弹窗
 检查难度
```

---

## 七、可调参数汇总（均在 GameConst.ts）

| 参数 | 默认值 | 说明 |
|---|---|---|
| `BallInitSpeed` | 400 | 球初始速度（px/s） |
| `BallRadius` | 20 | 球半径，用于碰撞检测 |
| `PaddleWidth` | 160 | 球拍宽度 |
| `Phase1BallSpeedMul` | 1.4 | Phase1 球速倍率 |
| `VY_RATIO` | 0.75 | 垂直速度比例（写在 Control 常量里） |
| `Phase1ScoreThreshold` | 100 | 触发球速加快的分数 |

---

## 八、当前代码中的球拍判定补充说明（以代码为准）

下面这部分是对“现在实际怎么判球碰到球拍”的补充说明，后续如果要调手感，优先以这里和 `PingPangControl.ts` 当前实现为准。

### 8.1 当前命中判定条件

当前正式接球判定开启时（`EnablePaddleCheck = true`），球命中球拍需要同时满足：

```ts
vy < 0
&& y - BallRadius <= PADDLE_TOP
&& Math.abs(x - paddleX) <= PaddleWidth / 2 + BallRadius
```

含义：
- `vy < 0`：球必须处于下落状态。
- `y - BallRadius <= PADDLE_TOP`：用“球底部”去碰一条隐形的接球判定线。
- `Math.abs(x - paddleX) <= PaddleWidth / 2 + BallRadius`：球心的横向位置必须进入球拍有效范围。

如果球已经下落到接球判定线，但横向没有进入范围，就会直接判定为没接住，进入落地结束流程。

### 8.2 当前球拍有效区域

当前代码里的“有效区域”并不是按球拍图片外形逐像素判定，而是：

- 一条固定高度的接球判定线
- 加上一段横向有效范围

当前公式：

```ts
PADDLE_TOP = paddleY + PaddleHeight + (PaddleHeight / 2)
halfW = PaddleWidth / 2
hitXRange = [paddleX - (halfW + BallRadius), paddleX + (halfW + BallRadius)]
```

按当前配置值：

- `PaddleWidth = 190`
- `PaddleHeight = 214`
- `BallRadius = 53`

可得：

- 横向有效半宽 = `190 / 2 + 53 = 148`
- 横向总有效宽度 = `296`
- 也就是说，当前是以 `paddleX` 为中心，左右各 `148` 像素都算可接住

### 8.3 当前判定线高度的理解

当前判定线高度使用的是：

```ts
PADDLE_TOP = paddleY + PaddleHeight + (PaddleHeight / 2)
```

注意：

- 这里用的是固定常量 `PaddleHeight`
- 虽然 `PingPangModel` 里有 `paddleHalfHeight`，但当前接球判定并没有使用它
- 所以现在更接近“代码里写死的一条接球带”，而不是严格跟随球拍图片真实可视边缘

### 8.4 命中后球的反弹逻辑

命中后，球的反弹方向由球心相对球拍中心的横向偏移决定：

```ts
offset = ballX - paddleX
ratio = clamp(offset / (PaddleWidth / 2), -1, 1)

newVX = ratio * BallInitSpeed * BallVXRatio * vxMul
newVY = BallInitSpeed * BallVYRatio
```

含义：

- 打中间：`ratio` 接近 `0`，球基本垂直向上
- 打左边：`ratio < 0`，球向左上
- 打右边：`ratio > 0`，球向右上
- 越靠边，横向速度越大

其中：

- `BallInitSpeed = 3200`
- `BallVXRatio = 0.22`
- `BallVYRatio = 0.66`
- `vxMul` 在 `Phase1` 之后会乘上 `Phase1BallSpeedMul`

### 8.5 当前手感层面的结论

从实现上看，当前球拍接球区域应理解为：

- 不是“球拍图片本身的形状”
- 而是“球拍中心点 + 固定横向接球宽度 + 固定高度接球线”

因此，如果后面觉得“明明看着碰到了却没接住”或“看着擦边也接住了”，优先检查的不是球拍图片，而是以下几项：

- `PaddleWidth`
- `PaddleHeight`
- `BallRadius`
- `paddleY`
- `PADDLE_TOP` 的计算方式是否需要改成更贴近真实球拍上边缘
