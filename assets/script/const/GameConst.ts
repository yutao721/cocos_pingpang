
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
    {key: 'once_a_day', desc: '完成一局游戏', count: 1, type: [1], source: 1},
    {key: 'three_times_a_day', desc: '完成3局游戏', count: 3, type: [1], source: 2},
    {key: 'accumulate_5_digits', desc: '累计获得5位武将', count: 5, type: [2,3], source: 3},
    {key: 'accumulate_10_digits', desc: '累计获得10位武将', count: 10, type: [2,3], source: 4},
    {key: 'accumulate_15_digits', desc: '累计获得15位武将', count: 15, type: [2,4], source: 5},
    {key: 'accumulate_all_digits', desc: '收集全部武将', count: 15, type: [1,4], source: 6},
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