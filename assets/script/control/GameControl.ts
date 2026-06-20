import { error, log } from "cc";
import { UiBase } from "../../framework/ui/UiBase";
import { getRandomElement, loadJson } from "../../framework/utils/CommonFun";
import { Api } from "../api/api";
import { UiEvent } from "../const/EventDefine";
import { eGeneralType, eItemType, ePropType, MaxSelectedItem } from "../const/GameConst";
import { ITask } from "../const/Interface";
import { GameModel } from "../model/GameModel";
import { userControl } from "./UserControl";
import { tipControl } from "./TipControl";


export class GameControl {

    public static getInstance(): GameControl {
        if (!GameControl.instance) {
            GameControl.instance = new GameControl();
        }
        return GameControl.instance;
    }

    private static instance: GameControl;

    private gameModel: GameModel = new GameModel();

    private constructor() {
        
    }

    public initConfigData() {
        //this.gameModel.initConfig();
    }

    public async initGameMap() {
        //初始化地图配置
        const mapConfig = await loadJson('json/gameMap');
        this.gameModel.updateBaseMap(mapConfig);
        //初始化游戏数据
        const gameData = (await Api.gameStart()).data;
        this.gameModel.initGameData(gameData);
        UiBase.emitUiEvent(UiEvent.initGame, this.gameModel);
    }

    public getSelectItems() {
        return this.gameModel.selectedItemList;
    }

    public getMapData() {
        return this.gameModel.mapDataArr;
    }

    public getGeneralData() {
        return this.gameModel.generalVal;
    }

    // 点击地图上的道具
    public clickItem(r: number, c: number) {
        const mapData = this.gameModel.mapDataArr;
        for (let l = mapData.length - 1; l >= 0; l--) {
            const id = mapData[l][r][c];
            if (id > 0) {
                const selectedItems = this.gameModel.selectedItemList;
                const lastIndex = selectedItems.lastIndexOf(id);
                let index = selectedItems.length;
                if (lastIndex === -1) {
                    selectedItems.push(id);
                }
                else {
                    index = lastIndex + 1;
                    selectedItems.splice(lastIndex + 1, 0, id);
                }
                mapData[l][r][c] = 0;
                UiBase.emitUiEvent(UiEvent.selectItem, l, r, c, index);
                this.checkSelectItem();
                // 未获得关羽的情况下，上报已获取青龙刀
                if (id === eItemType.greenDragonBlade && !userControl.hasGeneral(eGeneralType.guanyu)) {
                    Api.qldReport({game_id: this.gameModel.gameIdVal});
                }
                break;
            }
        }
    }

    // 点击收集武将
    public async clickGeneralItem() {
        if (this.gameModel.getGeneralStatus() >= 0) {
            return;
        }
        const generalCfg = userControl.getAllGeneralConfig();
        const cfg = generalCfg.find(item => item.id === this.gameModel.generalVal.id);
        if (!cfg) {
            return;
        }
        let isCollect = false;
        if (cfg.item_id && cfg.item_num <= 3) {
            const selectItems = this.gameModel.selectedItemList;
            const count = selectItems.filter(id => id === cfg.item_id).length;
            // 获取武将成功
            if (count >= cfg.item_num) {
                isCollect = true;
            }
        }
        // 关羽/青龙刀数判断
        else if (cfg.id == eGeneralType.guanyu) {
            const count = (await Api.getQldCount()).data.num;
            if (count >= 50) {
                isCollect = true;
            }
        }
        // 赵云，需要先获取刘禅判断
        else if (cfg.id == 4 && userControl.hasGeneral(eGeneralType.liushan)) {
            isCollect = true;
        }
        // 姜维直接获取
        else if (cfg.id == eGeneralType.jiangwei) {
            isCollect = true;
        }
        // 司马懿空背包判断
        else if (cfg.id == eGeneralType.simayi && this.gameModel.selectedItemList.length == 0) {
            isCollect = true;
        }
        // 廖化，需要最后获取
        else if (cfg.id == eGeneralType.liaohua && this.gameModel.currentTaskList.length == 0) {
            isCollect = true;
        }

        this.gameModel.setGeneralStatus(isCollect ? 1 : 0);
        UiBase.emitUiEvent(UiEvent.collectGeneral, isCollect);
        // 判断游戏是否结束
        this.checkGameWin();
    }
    
    // 检查已选中道具栏，是否有可完成的任务，如果有则完成对应任务
    public checkSelectItem() {
        const selectItems = this.gameModel.selectedItemList;
        if (selectItems.length < 3) {
            return;
        }
        var counts = {};
        for (var i = 0; i < selectItems.length; i++) {
            var id = selectItems[i];
            counts[id] = (counts[id] || 0) + 1;
        }
        for (var k in counts) {
            if (counts.hasOwnProperty(k) && counts[k] >= 3) {
                const id = parseInt(k);
                if (this.gameModel.currentTaskList.some(task => task.item_id == id)) {
                    this.gameModel.removeSelectedItem(id);
                    const task = this.gameModel.currentTaskList.find(task => task.item_id == id);
                    this.completeTask(task);
                }
            }
        }
        this.checkGameLose();
    }

    // 完成任务上报
    private completeTask(task: ITask) {
        const newTask = this.gameModel.completeTask(task.id);
        UiBase.emitUiEvent(UiEvent.taskComplete, task, newTask);
        // 如果有新任务，则重新检查任务是否有已完成的情况
        if (newTask) {
            this.checkSelectItem();
        }
        Api.taskReport({
            game_id: this.gameModel.gameIdVal, 
            task_id: task.id,
            status: 1
        }).then(() => {
            this.checkGameWin();
        });
    }

    // 检查游戏失败
    private checkGameLose() {
        if (this.gameModel.selectedItemList.length >= MaxSelectedItem) {
            if (this.gameModel.getIsRevival()) {
                // 已经复活过一次直接失败
                this.gameLoseReport().then(() => {
                    UiBase.emitUiEvent(UiEvent.gameResult, 'lose');
                });
            }
            else {
                UiBase.emitUiEvent(UiEvent.gameResult, 'revival');
            }
        }
    }

    // 游戏失败上报
    public gameLoseReport() {
        return Api.gameEnd({
            game_id: this.gameModel.gameIdVal,
            status: 0,
            general_status: 0
        });
    }

    // 检查游戏胜利
    private checkGameWin() {
        const mapData = this.gameModel.mapDataArr;
        let isEmpty = true;
        for (let l = mapData.length - 1; l >= 0 && isEmpty; l--) {
            const row = mapData[l];
            for (let i = 0; i < row.length && isEmpty; i++) {
                const col = row[i];
                for (let j = 0; j < col.length; j++) {
                    if (col[j] !== 0) {
                        isEmpty = false;
                        break;
                    }
                }
            }
        }
        // 关卡武将获取情况
        const generalStatus = this.gameModel.getGeneralStatus();
        if (isEmpty && generalStatus >= 0) {
            Api.gameEnd({
                game_id: this.gameModel.gameIdVal,
                status: 1,
                general_status: generalStatus
            }).then((res) => {
                UiBase.emitUiEvent(UiEvent.gameResult, 'win', res.data);
            });
            return true;
        }
        return false;
    }

    /**
     * 移除一组指定的物品
     * @param itemId 
     * @returns 
     */
    private removeGroupItem(itemId: number) {
        const selectItems = this.gameModel.selectedItemList;
        let count = 0;
        // 优先从已选中的道具中消除
        for (var i = 0; i < selectItems.length; i++) {
            if (selectItems[i] == itemId) {
                count++;
            }
            if (count >= 3) {
                break;
            }
        }
        if (count > 0) {
            this.gameModel.removeSelectedItem(itemId);
            UiBase.emitUiEvent(UiEvent.updateSelect);
        }
        if (count === 3) {
            return;
        }
        // 如果已选中的道具不足3个，则从地图中消除
        const mapData = this.gameModel.mapDataArr;
        console.log(mapData);
        for (let l = mapData.length - 1; l >= 0 && count < 3; l--) {
            const rows = mapData[l];
            for (let r = 0; r < rows.length && count < 3; r++) {
                const cols = rows[r];
                for (let c = 0; c < cols.length && count < 3; c++) {
                    if (cols[c] === itemId) {
                        mapData[l][r][c] = 0;
                        count++;
                        if (count > 3) {
                            error('道具数量有误 cout==', count);
                        }
                    }
                }
            }
        }
        if (count !== 3) {
            error('道具数量有误 cout==', count);
            console.log('要移除的 ID===', itemId);
            console.log(mapData);
            return;
        }
        UiBase.emitUiEvent(UiEvent.updateMap, mapData);
    }

    // 随机消除一个已选中的道具
    public randomRemoveSelect() {
        const selectItems = this.gameModel.selectedItemList;
        if (selectItems.length == 0) {
            tipControl.showTip('收集栏没有道具~');
            return;
        }
        const itemId = getRandomElement(selectItems);
        this.removeGroupItem(itemId);
        // 移除对应的任务
        let task = this.gameModel.currentTaskList.find(task => task.item_id == itemId);
        // 优先从当前任务中移除
        if (task) {
            this.completeTask(task);
        }
        else {
            // 从队列中移除
            task = this.gameModel.taskQueueList.find(task => task.item_id == itemId);
            if (task) {
                this.gameModel.removeQueueTask(task.id);
                Api.taskReport({
                    game_id: this.gameModel.gameIdVal, 
                    task_id: task.id,
                    status: 1
                });
            }
        }
    }

    // 判断是否可使用铁索连环
    public checkUseChain() {
        if (this.gameModel.currentTaskList.length == 0) {
            tipControl.showTip('任务已全部完成~');
            return;
        }
        UiBase.emitUiEvent(UiEvent.openShareProp, ePropType.chain);
    }

    // 使用铁索连环
    public useChain() {
        if (this.gameModel.currentTaskList.length == 0) {
            
            return;
        }
        // 随机完成一个正在做的任务
        const task = getRandomElement(this.gameModel.currentTaskList);
        this.completeTask(task);
        const itemId = task.item_id;
        this.removeGroupItem(itemId);
    }

    // 判断是否可使用无懈可击
    public checkUseFlawless() {
        if (this.gameModel.selectedItemList.length == 0) {
            tipControl.showTip('收集栏没有物品可消除~');
            return;
        }
        UiBase.emitUiEvent(UiEvent.openShareProp, ePropType.flawless);
    }

    // 使用无懈可击
    public useFlawless() {
        if (this.gameModel.selectedItemList.length == 0) {
            return;
        }
        // 随机消除一个已选中的道具
        this.randomRemoveSelect();
    }

    // 判断是否可使用重置
    public checkUseReset() {
        UiBase.emitUiEvent(UiEvent.openShareProp, ePropType.reset);
    }

    // 使用重置
    public useReset() {
        this.gameModel.resetMapData();
        UiBase.emitUiEvent(UiEvent.resetMap);
    }

    // 复活
    public revival() {
        this.gameModel.setRevival(true);
        // 随机消除一个已选中
        this.randomRemoveSelect();
    }

    // 使用道具
    public useProp(propType: ePropType) {
        switch (propType) {
            case ePropType.chain:
                this.useChain();
                break;
            case ePropType.flawless:
                this.useFlawless();
                break;
            case ePropType.reset:
                this.useReset();
                break;
        }
        userControl.useProp(propType);
        UiBase.emitUiEvent(UiEvent.updatePropCount);
    }

}

export const gameControl = GameControl.getInstance();