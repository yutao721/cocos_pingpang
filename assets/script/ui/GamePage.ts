import { _decorator, Component, error, instantiate, Label, Node, Prefab, tween, v3, Vec3 } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';
import { gameControl } from '../control/GameControl';
import { UiEvent } from '../const/EventDefine';
import { ePropType, MaxLayer, MaxTaskNum, MaxUsePropCount } from '../const/GameConst';
import { GameItem } from './GameItem';
import { ItemCard } from './ItemCard';
import { GameModel } from '../model/GameModel';
import { TaskCart } from './TaskCart';
import { IResult, ITask } from '../const/Interface';
import { Queue } from '../../framework/utils/Queue';
import { UI_PATH } from '../const/UiConfig';
import { UILayer } from '../../framework/ui/PageManager';
import { ResultPopup } from './ResultPopup';
import { GeneralItem } from './GeneralItem';
import { userControl } from '../control/UserControl';
import { PropGetPopup } from './PropGetPopup';
import { tipControl } from '../control/TipControl';
const { ccclass, property } = _decorator;

@ccclass('GamePage')
export class GamePage extends UiBase {

    // 地图道具
    @property(Prefab)
    itemPfb: Prefab = null;

    // 道具卡片
    @property(Prefab)
    itemCardPfb: Prefab = null;

    // 任务车
    @property(Prefab)
    taskCartPfb: Prefab = null;

    @property(Node)
    mapNode: Node = null;

    @property(Node)
    selectedPanel: Node = null;

    @property(Node)
    taskPanel: Node = null;

    //武将
    @property(GeneralItem)
    generalItem: GeneralItem = null;

    @property(Node)
    generalLayer: Node = null;

    // 铁索连环
    @property(Node)
    chainBtn: Node = null;

    // 无懈可击
    @property(Node)
    flawlessBtn: Node = null;

    // 重置
    @property(Node)
    resetBtn: Node = null;

    private layers: Node[] = [];

    // 顶部已选择的道具
    private selectCards: ItemCard[] = [];
    private mapItems: GameItem[][][] = [];
    // 任务车列表
    private taskList: TaskCart[] = [];

    protected onLoad(): void {
        this.taskList = new Array(MaxTaskNum).fill(null);

        this.onUiEvent(UiEvent.initGame, this.initGame);
        this.onUiEvent(UiEvent.selectItem, this.selectItem);
        this.onUiEvent(UiEvent.taskComplete, this.taskComplete);
        this.onUiEvent(UiEvent.updateMap, this.updateMap);
        this.onUiEvent(UiEvent.updateSelect, this.updateSelectItem);
        this.onUiEvent(UiEvent.resetMap, this.resetMap);
        this.onUiEvent(UiEvent.gameResult, this.onGameResult);
        this.onUiEvent(UiEvent.collectGeneral, this.onCollectGeneral);
        this.onUiEvent(UiEvent.openShareProp, this.openPropShare);
        this.onUiEvent(UiEvent.updatePropCount, this.updatePropCount);
        for (let i = 0; i < MaxLayer; i++) {
            this.layers.push(this.mapNode.getChildByName('Layer_'+i));
        }

        this.chainBtn.on(Node.EventType.TOUCH_END, this.onChain, this);
        this.flawlessBtn.on(Node.EventType.TOUCH_END, this.onFlawless, this);
        this.resetBtn.on(Node.EventType.TOUCH_END, this.onReset, this);
    }

    protected start(): void {
        gameControl.initGameMap();
        this.updatePropCount();
    }

    private initGame(gameModel: GameModel) {
        const mapData = gameModel.mapDataArr;
        this.cleanMap();
        this.mapItems = [];
        // 初始化地图
        for (let l = 0; l < mapData.length; l++) {
            const layerArr = [];
            let layerNode = this.layers[l];
            for (let r = 0; r < mapData[l].length; r++) {
                const rowArr = [];
                for (let c = 0; c < mapData[l][r].length; c++) {
                    const id = mapData[l][r][c];
                    if (id === 0) {
                        rowArr.push(null);
                        continue;
                    }
                    const node = instantiate(this.itemPfb);
                    node.parent = layerNode;
                    const item = node.getComponent(GameItem);
                    item.init(l, r, c, id);
                    item.updateState(mapData);
                    rowArr.push(item);
                }
                layerArr.push(rowArr);
            }
            this.mapItems.push(layerArr);
        }
        // 初始化任务
        const curTaskList = gameModel.currentTaskList;
        curTaskList.forEach((task) => {
            this.addTask(task);
        });
        // 初始化武将
        const general = gameModel.generalVal;
        general && this.generalItem.init(general.r, general.c, general.id);

    }

    private taskComplete(completeTask: ITask, newTask: ITask | null) {
        const completeId = completeTask.id;
        const taskIndex = this.taskList.findIndex(item => item && item.taskId === completeId);
        if (taskIndex !== -1) {
            const taskCart = this.taskList[taskIndex];
            tween(taskCart.node)
                .to(0.6, { position: v3(500, 0, 0) }, { easing: 'quadOut' })
                .call(() => {
                    taskCart.node.removeFromParent();
                })
                .start();
            this.taskList[taskIndex] = null;
        }
        newTask && this.addTask(newTask);
        this.scheduleOnce(() => {
            this.updateSelectItem();
        }, 0.3);
    }

    private addTask(task: ITask) {
        const index = this.taskList.findIndex(item => item === null);
        if (index === -1) {
            error('任务列表已满');
            return;
        }
        const node = instantiate(this.taskCartPfb);
        node.parent = this.taskPanel;
        node.setPosition(v3(-500, 0, 0));
        tween(node)
            .to(0.5, { position: v3((index - 1) * 200, 0, 0) }, { easing: 'quadOut' })
            .start();
        const item = node.getComponent(TaskCart);
        item.setTask(task.item_id, task.id);
        this.taskList[index] = item;
    }

    private selectItem(l: number, r: number, c: number, selectIndex: number) {
        const item = this.mapItems[l][r][c];
        if (!item) {
            return;
        }
        const mapData = gameControl.getMapData();
        const x = (selectIndex - 3) * 90;
        this.updateSelectItem();
        tween(item.node)
            .to(0.3, { position: v3(x, 390, 0) }, { easing: 'quadOut' })
            .call(() => {
                item.node.removeFromParent();
            })
            .start();

        for (let layer = 0; layer < this.mapItems.length; layer++) {
            const item = this.mapItems[layer][r][c];
            if (item) {
                item.updateState(mapData);
            }
        }
        // 更新武将状态
        this.generalItem.updateState(mapData);
    }
    
    private updateSelectItem() {
        const selectItems = gameControl.getSelectItems();

        // 移除多余节点
        const desiredCounts = new Map<number, number>();
        for (const id of selectItems) {
            desiredCounts.set(id, (desiredCounts.get(id) ?? 0) + 1);
        }

        const kept: ItemCard[] = [];

        // 从右往左遍历，优先保留后面的
        for (let i = this.selectCards.length - 1; i >= 0; i--) {
            const item = this.selectCards[i];
            const id = item.itemIdVal;
            const want = desiredCounts.get(id) ?? 0;
            if (want > 0) {
                kept.push(item);
                desiredCounts.set(id, want - 1);
            } else {
                tween(item.node)
                    .to(0.2, { scale: new Vec3(0, 0, 0) })
                    .call(() => item.node.destroy())
                    .start();
            }
        }

        // 因为是倒着遍历的，所以要翻转回来保持原来的顺序
        this.selectCards = kept.reverse();

        // 同步数据源顺序
        const newList: ItemCard[] = [];
        selectItems.forEach((id, index) => {
            // 先找有没有现成的
            let item = this.selectCards.find(it => it.itemIdVal === id && newList.indexOf(it) === -1);

            if (!item) {
                // 没有的话新建
                const node = instantiate(this.itemCardPfb);
                node.parent = this.selectedPanel;
                item = node.getComponent(ItemCard)!;
                item.setItemSprite(id);
                node.active = false;
                this.scheduleOnce(() => (node.active = true), 0.3);
            }

            newList.push(item);
        });

        // 用新顺序覆盖
        this.selectCards = newList;

        // 更新所有节点的位置
        const spacing = 87;
        this.selectCards.forEach((item, index) => {
            const targetPos = new Vec3(index * spacing - 262, 0, 0);
            tween(item.node)
                .to(0.3, { position: targetPos })
                .start();
        });
    }

    private updateMap () {
        const mapDate = gameControl.getMapData();
        for (let l = 0; l < this.mapItems.length; l++) {
            for (let r = 0; r < this.mapItems[l].length; r++) {
                for (let c = 0; c < this.mapItems[l][r].length; c++) {
                    const item = this.mapItems[l][r][c];
                    if (mapDate[l][r][c] === 0 && item) {
                        item.node.removeFromParent();
                        this.mapItems[l][r][c] = null;
                    }
                    else if (item) {
                        item.updateState(mapDate);
                    }
                }
            }
        }
        this.generalItem.updateState(mapDate);
    }

    private onGameResult(type: string, resultData?: IResult) {
        this.pageManager.showUI(UI_PATH.RESULT, UILayer.TOP, (resultNode: Node) => {
            const result = resultNode.getComponent(ResultPopup);
            switch (type) {
                case 'win':
                    result && result.showWin(resultData);
                    break;
                case 'lose':
                    result && result.showLose();
                    break;
                case 'revival':
                    result && result.showRevival();
                    break;
                default:
                    break;
            }
        });
    }

    private onCollectGeneral(isCollect: boolean) {
        if (!this.generalItem) {
            return;
        }
        userControl.playSFX('audio/' + isCollect ? 'collect' : 'uncollect');
        this.generalItem.collect(isCollect);
    }

    private cleanMap() {
        // 任务清空
        this.taskList.forEach((item, index) => {
            if (item) {
                item.node.removeFromParent();
                this.taskList[index] = null;
            }
        });
        // 选中项清空
        this.selectCards.forEach(item => {
            item.node.removeFromParent();
        });
        this.selectCards = [];
        if (this.mapItems.length == 0) {
            return;
        }
        // 地图清空
        for (let l = 0; l < this.mapItems.length; l++) {
            for (let r = 0; r < this.mapItems[l].length; r++) {
                for (let c = 0; c < this.mapItems[l][r].length; c++) {
                    if (this.mapItems[l][r][c]) {
                        this.mapItems[l][r][c].node.removeFromParent();
                        this.mapItems[l][r][c] = null;
                    }
                }
            }
        }
        // 武将清空
        this.generalItem.cleanUp();
    }

    private checkUseProp(type: ePropType) {
        if (userControl.getPropUseCount(type) >= MaxUsePropCount) {
            tipControl.showTip('今天次数已用尽~');
            return false;
        }
        return true;
    }

    private onChain() {
        this.checkUseProp(ePropType.chain) && gameControl.checkUseChain();
    }

    private onFlawless() {
        this.checkUseProp(ePropType.flawless) && gameControl.checkUseFlawless();
    }

    private onReset() {
        this.checkUseProp(ePropType.reset) && gameControl.checkUseReset();
    }

    private resetMap() {
        let clockwise = [];
        let counterClockwise = [this.generalLayer];
        this.layers.forEach((node, index) => {
            if (index % 2 === 0) {
                clockwise.push(node);
            } else {
                counterClockwise.push(node);
            }
        });
        clockwise.forEach(node => {
            tween(node)
                .to(1.5, { angle: 720 })
                .call(() => {
                    node.angle = 0;
                })
                .start();
        });
        counterClockwise.forEach(node => {
            tween(node)
                .to(1.5, { angle: -720 })
                .call(() => {
                    node.angle = 0;
                })
                .start();
        });
        this.scheduleOnce(() => {
            // 道具位置重置
            const mapDate = gameControl.getMapData();
            for (let l = 0; l < this.mapItems.length; l++) {
                for (let r = 0; r < this.mapItems[l].length; r++) {
                    for (let c = 0; c < this.mapItems[l][r].length; c++) {
                        const item = this.mapItems[l][r][c];
                        const id = mapDate[l][r][c];
                        if (item && id) {
                            item.init(l, r, c, id);
                        }
                    }
                }
            }
            // 武将位置重置
            const generalData = gameControl.getGeneralData();
            generalData && this.generalItem.resetPos(generalData.r, generalData.c);
        }, 0.75);

    }

    private openPropShare(type: ePropType) {
        this.pageManager.showUI(UI_PATH.PROPGET, UILayer.TOP, (node: Node) => {
            const share = node.getComponent(PropGetPopup);
            share && share.show(type);
        });
    }

    private updatePropCount() {
        const updateArr = [
            { node: this.flawlessBtn, count: userControl.getPropUseCount(ePropType.flawless) },
            { node: this.chainBtn, count: userControl.getPropUseCount(ePropType.chain) },
            { node: this.resetBtn, count: userControl.getPropUseCount(ePropType.reset) }
        ];
        updateArr.forEach(item => {
            const count = item.count;
            const bgNode = item.node.getChildByName('RedBg');
            if (count >= MaxUsePropCount) {
                bgNode.active = false;
            } 
            else {
                const label = bgNode.getChildByName('Count').getComponent(Label);
                label.string = (MaxUsePropCount - Math.max(0, count)).toString();
            }
        })
    }

}
