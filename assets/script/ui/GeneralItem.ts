import { _decorator, Color, Component, Node, Sprite, tween, Vec2, Vec3 } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';
import { getGeneralSprite, getItemSprite, getPropTopItem } from '../utils/utils';
import { UiEvent } from '../const/EventDefine';
import { gameControl } from '../control/GameControl';
const { ccclass, property } = _decorator;

@ccclass('GeneralItem')
export class GeneralItem extends UiBase {
    
    @property(Sprite)
    public generalSprite: Sprite = null;

    // 在容器中的位置
    private row: number = -1;
    private col: number = -1;

    protected onLoad(): void {
        //this.onUiEvent(UiEvent.updateMap, this.updateState, this);
        //this.init(0, 3, 3, 10);
        this.generalSprite.node.on(Node.EventType.TOUCH_END, this.clickGeneral, this);
    }

    public init(row: number, col: number, id: number) {
        this.node.active = true;
        this.row = row;
        this.col = col;
        this.node.setPosition(new Vec3((col - 3) * 90, (3 - row) * 90, 0));
        //随机一个角度
        //this.node.angle = Math.random() * 360;
        this.setPropSprite(id);
    }

    public collect(isCollect: boolean) {
        if (isCollect) {
            tween(this.node)
                .to(0.2, { scale: new Vec3(0, 0, 0) })
                .call(() => {
                    this.cleanUp();
                })
                .start();
        }
        else {
            tween(this.node)
                .to(0.2, { scale: new Vec3(1.5, 1.5, 1) })
                .repeat(2,
                    tween()
                        .to(0.1, { angle: 15 })
                        .to(0.2, { angle: -15 })
                        .to(0.1, { angle: 0 })
                )
                .call(() => {
                    this.generalSprite.grayscale = true;
                })
                .to(0.2, { scale: new Vec3(1, 1, 1) })
                .start();
        }
    }

    public resetPos(row: number, col: number) {
        this.row = row;
        this.col = col;
        this.node.setPosition(new Vec3((col - 3) * 90, (3 - row) * 90, 0));
    }

    public updateState(mapData: number[][][]) {
        if (this.node.active === false) {
            return;
        }
        const topItem = getPropTopItem(-1, this.row, this.col, mapData);
        this.setVisibilityState(topItem.length);
    }

    public clickGeneral() {
        gameControl.clickGeneralItem();
    }

    public cleanUp() {
        this.row = -1;
        this.col = -1;
        this.node.scale = new Vec3(1, 1, 1);
        this.node.active = false;
        this.generalSprite.grayscale = false;
    }

    public setPropSprite(id: number) {
        getGeneralSprite(id).then(spriteFrame => {
            this.generalSprite.spriteFrame = spriteFrame;
        });
    }

    public setVisibilityState(topCount: number) {
        if (topCount == 0) {
            this.generalSprite.color = new Color(255, 255, 255, 255);
        }
        else if (topCount == 1) {
            this.generalSprite.color = new Color(120, 120, 120, 255);
        }
        else if (topCount == 2) {
            this.generalSprite.color = new Color(60, 60, 60, 255);
        }
        else {
            this.generalSprite.color = new Color(0, 0, 0, 255);
        }
    }

}


