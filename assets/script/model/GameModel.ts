import { error } from "cc";
import { Queue } from "../../framework/utils/Queue";
import { IGeneralConfig, ITask } from "../const/Interface";
import { loadJson, shuffleInPlace } from "../../framework/utils/CommonFun";

// 游戏数据
export class GameModel {
    
    // 游戏id
    private gameId: number;
    public get gameIdVal(): number {
        return this.gameId;
    }

    // 地图初始化形状
    private baseMap: number[][][];

    // 当前地图数据
    private mapData: number[][][];
    public get mapDataArr(): number[][][] {
        return this.mapData;
    }

    // 当前选中的物品
    private selectedItem: number[];
    public get selectedItemList(): number[] {
        return this.selectedItem;
    }

    // 任务队列
    private taskQueue: ITask[];
    public get taskQueueList(): ITask[] {
        return this.taskQueue;
    }

    // 当前任务
    private currentTask: ITask[] = [];
    public get currentTaskList(): ITask[] {
        return this.currentTask;
    }

    // 关卡可获取的武将
    private general: {id: number, r: number, c: number} = null;
    public get generalVal(): {id: number, r: number, c: number} | null {
        return this.general;
    }

    // 关卡收集武将的状态
    private generalStatus: number = -1; // -1:未获取, 0:获取失败，1:已获取
    public getGeneralStatus(): number {
        return this.generalStatus;
    }
    public setGeneralStatus(status: number) {
        this.generalStatus = status;
    }

    // 是否已复活
    private isRevival: boolean = false;
    public getIsRevival(): boolean {
        return this.isRevival;
    }
    public setRevival(val: boolean) {
        this.isRevival = val;
    }

    constructor() {
        this.selectedItem = [];
        this.taskQueue = [];
    }

    public updateBaseMap (mapArray: number[][][]) {
        this.baseMap = mapArray;
    }

    public initGameData(gameData: any): void {
        this.gameId = gameData.game_id;
        // 初始化是否已复活
        this.isRevival = false;
        // 初始化选中道具
        this.selectedItem = [];
        // 初始化任务队列
        this.taskQueue = [];
        this.currentTask = [];
        // 初始化卡池
        const cardItems = {};
        const taskList: any[] = gameData.task_orders;
        taskList.forEach((task: any) => {
            this.taskQueue.push(task);
            cardItems[task.item_id] = (cardItems[task.item_id] || 0) + 3;
        });
        let curTaskCount = 3;
        while (curTaskCount > 0 && this.taskQueue.length > 0) {
            this.currentTask.push(this.taskQueue.splice(0, 1)[0]);
            curTaskCount--;
        }
        // 生成卡池
        const pool: number[] = [];
        for (var k in cardItems) {
            if (!cardItems.hasOwnProperty(k)) continue;
            var count = parseInt(cardItems[k], 10) || 0;
            var cardId = parseInt(k, 10);
            if (count <= 0) continue;
            for (var i = 0; i < count; i++) {
                pool.push(cardId);
            }
        }
        // 洗牌
        shuffleInPlace(pool);
        // 初始化地图数据
        this.mapData = [];
        let index = 0;
        const posArr: {r: number, c: number}[] = []; // 可生成武将的位置
        for (let l = 0; l < this.baseMap.length; l++) {
            let layer = [];
            for (let r = 0; r < this.baseMap[l].length; r++) {
                let row = [];
                for (let c = 0; c < this.baseMap[l][r].length; c++) {
                    if (this.baseMap[l][r][c] === 1) {
                        // 如果卡池够，就取一张，否则填0
                        row.push(index < pool.length ? pool[index++] : 0);
                        // 记录可放置武将的位置
                        l === 0 && posArr.push({r, c});
                    } 
                    else {
                        row.push(0); // 不可放置格子，用 0 表示
                    }
                }
                layer.push(row);
            }
            this.mapData.push(layer);
        }

        // 初始化武将
        this.general = null;
        this.generalStatus = -1;
        if (gameData.general_id) {
            const pos = posArr.splice(Math.floor(Math.random() * posArr.length), 1)[0];
            this.general = {id: gameData.general_id, r: pos.r, c: pos.c};
        }
        else {
            this.generalStatus = 0;
        }
    }

    // 移除选中的物品，最多3个
    public removeSelectedItem(id: number): void {
        let count = 0;
        this.selectedItem = this.selectedItem.filter((v) => {
            if (v === id && count < 3) {
                count++;
                return false;
            }
            return true;
        });
    }

    public completeTask(taskId: number): ITask | null {
        const index = this.currentTask.findIndex((task) => task.id === taskId);
        index >= 0 && this.currentTask.splice(index, 1);
        if (this.taskQueue.length > 0) {
            const task = this.taskQueue.splice(0, 1)[0];
            this.currentTask.push(task);
            return task;
        }
        return null;
    }

    // 移除队列中的任务
    public removeQueueTask(taskId: number): ITask {
        const index = this.taskQueue.findIndex(task => task.id === taskId);
        if (index >= 0) {
            const task = this.taskQueue.splice(index, 1)[0];
            return task;
        }
        error('对应道具的任务不存在');
        return null;
    }

    public resetMapData(): void {
        if (!this.mapData || this.mapData.length === 0) return;
    
        //收集所有非0的卡片id
        const ids: number[] = [];
        for (let l = 0; l < this.mapData.length; l++) {
            for (let r = 0; r < this.mapData[l].length; r++) {
                for (let c = 0; c < this.mapData[l][r].length; c++) {
                    if (this.mapData[l][r][c] !== 0) {
                        ids.push(this.mapData[l][r][c]);
                    }
                }
            }
        }
    
        //打乱
        shuffleInPlace(ids);

        //按原来非0的位置依次放回
        let index = 0;
        for (let l = 0; l < this.mapData.length; l++) {
            for (let r = 0; r < this.mapData[l].length; r++) {
                for (let c = 0; c < this.mapData[l][r].length; c++) {
                    if (this.mapData[l][r][c] !== 0) {
                        this.mapData[l][r][c] = ids[index++];
                    }
                }
            }
        }

        // 武将位置重置
        if (!this.general) {
            return;
        }
        const posArr: {r: number, c: number}[] = []; // 可生成武将的位置
        for (let r = 0; r < this.baseMap[0].length; r++) {
            for (let c = 0; c < this.baseMap[0][r].length; c++) {
                if (this.baseMap[0][r][c] === 1) {
                    posArr.push({r, c});
                }
            }
        }
        const pos = posArr.splice(Math.floor(Math.random() * posArr.length), 1)[0];
        this.general.r = pos.r;
        this.general.c = pos.c;
    }
    
}