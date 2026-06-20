
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