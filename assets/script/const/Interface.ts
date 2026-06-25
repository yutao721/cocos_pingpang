
// 任务
export interface ITask {
    id: number;
    item_id: number;
}

// 武将配置
export interface IGeneralConfig {
    id: number;
    general_name: string;
    general_type: number;
    item_id: number;
    item_num: number;
    item_name: string;
    probability: number;
}

// 游戏结束返回值
export interface IResult {
    general_id: number; // 武将id
    general_name: string;  // 武将名
    status: number; // 状态:0-未获取 1-获取成功 3-特殊
    num: number; // 数量
}

// ============================================================
// 颠球游戏接口
// ============================================================

// 场上鞋花运行时数据
export interface IShoeFlower {
    uid: number;              // 唯一标识（自增）
    type: number;             // eShoeFlowerType
    x: number;                // 当前 X 坐标（设计分辨率）
    y: number;                // 当前 Y 坐标
    speedY: number;           // 下落速度（像素/秒，正值向下）
}

// 颠球游戏结算数据（上报后端 & 弹窗展示）
export interface IPingPangResult {
    score: number;            // 最终分数
    maxCombo: number;         // 最高连颠次数
    hitCount: number;         // 总颠球次数
    shoeFlowerHit: number;    // 总撞击鞋花次数
    duration: number;         // 本局实际用时（秒）
}