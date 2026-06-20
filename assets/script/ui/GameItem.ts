import { _decorator, Color, Component, Node, Sprite, Vec2, Vec3 } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';
import { getItemSprite, getPropTopItem } from '../utils/utils';
import { UiEvent } from '../const/EventDefine';
import { gameControl } from '../control/GameControl';
const { ccclass, property } = _decorator;

@ccclass('GameItem')
export class GameItem extends UiBase {
    
    @property(Sprite)
    public itemSprite: Sprite = null;

    // 在容器中的位置
    private layerIndex: number = -1;
    private row: number = -1;
    private col: number = -1;

    protected onLoad(): void {
        //this.onUiEvent(UiEvent.updateMap, this.updateState, this);
        //this.init(0, 3, 3, 10);
        this.itemSprite.node.on(Node.EventType.TOUCH_END, this.clickProp, this);
    }

    public init(layerIndex: number, row: number, col: number, id: number) {
        this.node.active = true;
        this.layerIndex = layerIndex;
        this.row = row;
        this.col = col;
        this.node.setPosition(new Vec3((col - 3) * 90, (3 - row) * 90, 0));
        //随机一个角度
        this.node.angle = Math.random() * 360;
        this.setPropSprite(id);
    }

    public updateState(mapData: number[][][]) {
        const topItem = getPropTopItem(this.layerIndex, this.row, this.col, mapData);
        this.setVisibilityState(topItem.length);
    }

    public clickProp() {
        gameControl.clickItem(this.row, this.col);
    }

    public cleanUp() {
        this.layerIndex = -1;
        this.row = -1;
        this.col = -1;
        this.node.active = false;
    }

    public setPropSprite(id: number) {
        getItemSprite(id, 'game').then(spriteFrame => {
            this.itemSprite.spriteFrame = spriteFrame;
        });
    }

    public setVisibilityState(topCount: number) {
        if (topCount == 0) {
            this.itemSprite.color = new Color(255, 255, 255, 255);
        }
        else if (topCount == 1) {
            this.itemSprite.color = new Color(120, 120, 120, 255);
        }
        else if (topCount == 2) {
            this.itemSprite.color = new Color(60, 60, 60, 255);
        }
        else {
            this.itemSprite.color = new Color(0, 0, 0, 255);
        }
    }

}


