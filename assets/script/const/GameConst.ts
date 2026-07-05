
// 地图最大层数
export const MaxLayer = 5;

// 最大选择数量
export const MaxSelectedItem = 7;

// 最大任务数
export const MaxTaskNum = 3;

// 最大武将数
export const MaxGeneralNum = 15;

// 每日最大使用道具次数
export const MaxUsePropCount = 3;

// 奖励配置
export const RewardConfig: {
  key: string,
  desc: string,
  count: number,
  type: number[],
  source: number
}[] = [
    { key: 'video', desc: '明星视频', count: 1, type: [11], source: 1 },
    { key: '100_hole', desc: '100洞力值', count: 3, type: [12], source: 2 },
    { key: '500_hole', desc: '500洞力值', count: 5, type: [13], source: 2 },
  ];

export enum eItemType {
  fodder = 1, // 粮草
  greenDragonBlade = 8, // 青龙刀
}

// 武将类型
export enum eGeneralType {
  liubei = 1, // 刘备
  zhangfei = 2, // 张飞
  guanyu = 3, // 关羽
  zhaoyun = 4, // 赵云
  jiangwei = 5, // 姜维
  xusheng = 6, // 徐盛
  wanglang = 7, // 王朗
  simayi = 8, //司马懿
  menghuo = 9, // 孟获
  masu = 10, // 马谡
  zhouyu = 11, // 周瑜
  huangyueying = 12, // 黄月英
  liaohua = 13, // 廖化
  liushan = 14, // 刘禅
  huangzhong = 15 // 黄忠
}

// 关注配置
export const FollowConfig: {
  key: string,
  url: string
}[] = [
    {
      key: 'weixin',
      url: 'https://mp.weixin.qq.com/s/SFOgjRlIT95jgj4r0n8v2Q'
    },
    {
      key: 'bili',
      url: 'https://space.bilibili.com/1672821212'
    },
    {
      key: 'douyin',
      url: 'https://v.douyin.com/iPWPhSVH'
    },
    {
      key: 'xiaohongshu',
      url: 'https://www.xiaohongshu.com/user/profile/66024026000000000b00d628'
    },
    {
      key: 'kuaishou',
      url: 'https://www.kuaishou.com/profile/3xmkm3wptzn6b8m'
    }
  ];

// 道具类型
export enum ePropType {
  // 无懈可击
  flawless = 1,
  // 铁索连环
  chain = 2,
  // 重置
  reset = 3
}

// ============================================================
// 开发调试开关
// ============================================================

/**
 * 是否开启接球校验
 * true  → 正式逻辑：球落到球拍高度未接住则游戏结束
 * false → 调试模式：球碰底部边界直接反弹，永不落地，方便测试鞋花生成/掉落
 */
export const EnablePaddleCheck = true;

/**
 * 调试：球拍自动跟随球（自动接球）
 * true  → 球拍每帧自动移动到球正下方，方便测试得分/连颠/难度逻辑
 * false → 正常玩家手动控制
 */
export const AutoPaddle = false;

// ============================================================
// 颠球游戏（PingPang）新玩法配置
// ============================================================

// 鞋花类型
export enum eShoeFlowerType {
  normal = 1, // 普通鞋花  +5分
  limited = 2, // 限量款鞋花 +10分
}

// 鞋花得分配置
export const ShoeFlowerScoreConfig: Record<eShoeFlowerType, number> = {
  [eShoeFlowerType.normal]: 5,
  [eShoeFlowerType.limited]: 10,
};

// 连颠 Buff 阶段配置（达到 count 次连颠时额外加 bonus 分）
export interface IComboBuffConfig {
  count: number; // 触发所需连颠次数（累计，非增量）
  bonus: number; // 触发时额外得分
  title: string; // 连击标题
  desc: string; // 提示文案，用于现有 UI 提示
}

export const ComboBuffConfig: IComboBuffConfig[] = [
  { count: 5, bonus: 10, title: '5连击！', desc: '洞门buff拉满！' },
  { count: 10, bonus: 20, title: '10连击！', desc: '稳住节奏，继续努力！' },
  { count: 20, bonus: 40, title: '20连击！', desc: '洞门高手，尽显实力！' },
  { count: 30, bonus: 60, title: '30连击封神！', desc: '无人能挡，持续领跑！' },
  { count: 40, bonus: 80, title: '40连击！', desc: '洞感全开，持续领跑！' },
  { count: 50, bonus: 100, title: '50连击！', desc: '节奏拉满，自在发力！' },
  { count: 60, bonus: 120, title: '60连击！', desc: '稳控全场，洞感狂飙！' },
  { count: 70, bonus: 140, title: '70连击！', desc: '实力爆表，锁定洞门高分！' },
  { count: 80, bonus: 160, title: '80连击！', desc: '巅峰状态，自在拿捏！' },
  { count: 90, bonus: 180, title: '90连击！', desc: '步步进阶，冲刺洞门榜首！' },
  { count: 100, bonus: 200, title: '100连击！', desc: '满级操作，洞门封神' },
];

// 连颠步长（每隔多少次触发一次，超出上表后按此步长递增）
export const ComboBuffStep = 10;
// 超出表格最大次数后，每步额外加分的基础值（最后一档 bonus + (超出段数 * ComboBuffStepBonus)）
export const ComboBuffStepBonus = 10;

// 随机激励提示触发间隔（每颠多少次出现 1 条，<= 0 表示关闭）
export const RandomHintHitInterval = 8;

// 随机提示文案（每次颠球低概率触发，优先级最低）
export const RandomHintTexts: string[] = [
  '洞门自在，这一拍超稳！',
  '手感在线，自在拿捏！',
  '洞感全开，稳稳拿捏每一球！',
  '自在节奏，高分正在路上！',
  '洞感buff加持，分数稳步暴涨！',
];

// 击中鞋花提示文案（优先级最高）
export const ShoeFlowerHitHint: Record<number, string> = {
  [eShoeFlowerType.normal]: '颠得漂亮鞋花接住',
  [eShoeFlowerType.limited]: '接住限量鞋花分数飙升',
};

// 基础颠球得分（每颠一次 +1）
export const BaseHitScore = 1;

// 每局游戏时间（秒），0 表示无限时
export const GameDuration = 0;

// 鞋花在屏幕上同时最多存在的数量
export const MaxShoeFlowerOnStage = 1;

// 鞋花生成间隔范围（秒）[min, max]
export const ShoeFlowerSpawnInterval: [number, number] = [2.0, 5.0];

// 鞋花消失后再次生成的最小间隔（秒），避免上一朵刚消失下一朵立刻出现
export const ShoeFlowerRespawnDelayAfterDisappear: number = 2.0;

// 鞋花随机出现的位置范围（设计分辨率 750x1334，Cocos 坐标系）
export const ShoeFlowerSpawnRangeX: [number, number] = [-180, 40];
export const ShoeFlowerSpawnRangeY: [number, number] = [-220, 20];

// 鞋花存活时间范围（秒）[min, max]，倒计时到 0 后消失
export const ShoeFlowerLifetime: [number, number] = [5, 8];

// Phase2 时鞋花存活时间倍率（< 1 使鞋花消失更快）
export const ShoeFlowerLifetimeMulPhase2: number = 0.6;

// 鞋花临近超时时的原地预警效果配置
export const ShoeFlowerExpireWarnTime: number = 1.2;
export const ShoeFlowerExpireWarnMinOpacity: number = 160;
export const ShoeFlowerExpireBlinkInterval: number = 0.2;
export const ShoeFlowerExpireWarnScale: number = 1.05;

// 鞋花被命中后的左右摇摆消失效果配置
export const ShoeFlowerHitSwingOffsetX: number = 14;
export const ShoeFlowerHitSwingAngle: number = 10;
export const ShoeFlowerHitSwingDuration: number = 0.22;

// 鞋花碰撞半径（像素），球与鞋花中心距离 ≤ BallRadius + ShoeFlowerRadius 时触发击中
export const ShoeFlowerRadius: number = 50;

// 球初始速度（像素/秒），决定碰拍后弹起的初速度
export const BallInitSpeed = 3200;

// 球反弹时垂直速度占总速度的比例（0~1），值越大弹起越高
export const BallVYRatio = 0.66;

// 球反弹时水平速度占总速度的比例（0~1），控制横向速度上限
export const BallVXRatio = 0.22;

// 重力加速度（像素/秒²），每帧对 vy 施加向下加速，模拟真实乒乓球弧线
export const BallGravity = 4700;

// 球初始生成位置 Y 坐标
export const BallInitY = 200;

// 球拍移动速度（像素/秒），长按后的最大移动速度
export const PaddleMoveSpeed = 600;

// 球拍宽度（像素），用于碰撞检测
export const PaddleWidth = 210;

// 球拍高度（像素），用于碰撞检测
export const PaddleHeight = 214;

// 球拍默认 Y 坐标（距屏幕底部的位置）
export const PaddleInitY = -580;

// 球半径（像素），用于碰撞检测
export const BallRadius = 57;

// 每日最高上榜分数（超过才上报排行榜）
export const DailyRankMinScore = 0;

// 游戏结束判定：球落地（低于此 Y 坐标，设计分辨率 750x1334 底部）
export const GroundY = -667;

// ============================================================
// 难度提升配置
// ============================================================

/**
 * 难度阶段枚举
 * normal   → 初始状态
 * phase1   → 球速提升阶段（达到分数阈值后触发）
 * phase2   → 鞋花加速阶段（球速提升后再持续一段时间触发）
 */
export enum eDifficultyPhase {
  normal = 0,
  phase1 = 1, // 球速提升
  phase2 = 2, // 鞋花加速
}

// ---------- Phase 1：球速提升 ----------

// 触发球速提升所需分数（建议测试期间根据游戏时长调整）
export const Phase1ScoreThreshold = 100;

// 球速提升倍率（当前速度 × 此系数）
export const Phase1BallSpeedMul = 1.15;

// Phase 1 触发时的 UI 提示文案
export const Phase1HintText = '⚡ 球速加快了！';

// ---------- Phase 2：鞋花加速 ----------

// 触发鞋花加速所需：进入 Phase1 后持续的游戏时长（秒）
export const Phase2DurationThreshold = 20;

// Phase2 鞋花生成间隔缩短倍率（间隔 × 此系数，值越小生成越频繁）
export const Phase2SpawnIntervalMul = 0.6;

// Phase 2 触发时的 UI 提示文案
export const Phase2HintText = '🌪 鞋花消失加快了！';
