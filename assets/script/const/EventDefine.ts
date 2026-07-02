

// UI事件
export enum UiEvent {
    initGame = 'initGame',    // 初始化地图
    selectItem = 'selectItem', // 选中物品
    taskComplete = 'taskComplete', // 任务完成
    updateMap = 'updateMap', // 更新地图
    updateSelect = 'updateSelect', // 更新选中
    resetMap = 'resetMap', // 重置地图
    gameResult = 'gameResult', // 游戏结果
    collectGeneral = 'collectGeneral', // 收集武将
    openShareProp = 'openShareProp', // 打开分享道具弹窗
    updatePropCount = 'updatePropCount', // 更新道具数量
}

// ============================================================
// 颠球游戏事件
// ============================================================
export enum PingPangEvent {
    // --- 游戏流程 ---
    gameStart       = 'pp_gameStart',       // 游戏开始（倒计时结束后触发）
    gameOver        = 'pp_gameOver',        // 游戏结束（球落地/超时）：参数 IPingPangResult

    // --- 计时 ---
    timeUpdate      = 'pp_timeUpdate',      // 每秒更新本局已用时：参数 elapsedSeconds:number
    timeUp          = 'pp_timeUp',          // 倒计时归零（时间模式专用）

    // --- 球拍 ---
    paddleMove      = 'pp_paddleMove',      // 球拍位置变化：参数 x:number

    // --- 球 ---
    ballUpdate      = 'pp_ballUpdate',      // 球位置/速度更新（每帧，由物理层发出）：参数 x,y,vx,vy
    ballHitPaddle   = 'pp_ballHitPaddle',   // 球命中球拍：无额外参数（控制层内部处理）
    ballFall        = 'pp_ballFall',        // 球落地：触发 gameOver

    // --- 得分 ---
    scoreUpdate     = 'pp_scoreUpdate',     // 分数变化：参数 score:number, delta:number
    comboUpdate     = 'pp_comboUpdate',     // 连颠次数变化：参数 combo:number
    comboBuff       = 'pp_comboBuff',       // 触发连颠阶梯奖励：参数 bonus:number, desc:string

    // --- 鞋花 ---
    shoeFlowerSpawn = 'pp_shoeFlowerSpawn', // 鞋花出现：参数 IShoeFlower
    shoeFlowerUpdate= 'pp_shoeFlowerUpdate',// 鞋花位置帧更新：参数 uid:number, y:number
    shoeFlowerHit   = 'pp_shoeFlowerHit',   // 鞋花被球撞击消除：参数 uid:number, score:number
    shoeFlowerMiss  = 'pp_shoeFlowerMiss',  // 鞋花落出屏幕（未被撞）：参数 uid:number

    // --- 难度提升 ---
    difficultyPhaseChange = 'pp_difficultyPhaseChange', // 难度阶段变化：参数 phase:eDifficultyPhase, hintText:string
}
