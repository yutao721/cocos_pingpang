

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