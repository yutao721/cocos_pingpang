import { _decorator, Component, Label, Node, Sprite } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';
import { getGeneralText, getGeneralSprite } from '../utils/utils';
import { userControl } from '../control/UserControl';
import { UiEvent } from '../const/EventDefine';
import { eGeneralType } from '../const/GameConst';
import { UI_PATH } from '../const/UiConfig';
import { UILayer } from '../../framework/ui/PageManager';
const { ccclass, property } = _decorator;

@ccclass('GeneralPopup')
export class GeneralPopup extends UiBase {

    @property(Node)
    maskBg: Node = null;
    
    @property(Node)
    newGeneralNode: Node = null;

    @property(Sprite)
    newGeneralSprite: Sprite = null;

    @property(Sprite)
    newGeneralName: Sprite = null;

    @property(Sprite)
    newGeneralDesc: Sprite = null;

    @property(Node)
    generalNode: Node = null;

    @property(Sprite)
    generalSprite: Sprite = null;

    @property(Sprite)
    generalName: Sprite = null;

    @property(Sprite)
    generalDesc: Sprite = null;

    //获取攻略
    @property(Sprite)
    strategy: Sprite = null;

    @property(Label)
    countLab: Label = null;

    @property(Node)
    addCampBtn: Node = null;

    @property(Node)
    goGameBtn: Node = null;

    @property(Node)
    closeBtn: Node = null;

    protected onLoad(): void {
        this.addCampBtn.on(Node.EventType.TOUCH_END, this.hide, this);
        this.goGameBtn.on(Node.EventType.TOUCH_END, this.goGame, this);
        this.maskBg.on(Node.EventType.TOUCH_END, this.hide, this);
        this.closeBtn.on(Node.EventType.TOUCH_END, this.hide, this);
    }

    public showNewGeneral(generalId: number) {
        this.node.active = true;
        this.newGeneralNode.active = true;
        this.generalNode.active = false;
        getGeneralSprite(generalId).then((sp) => {
            this.newGeneralSprite.spriteFrame = sp;
        });
        getGeneralText(generalId, 'desc').then((sp) => {
            this.newGeneralDesc.spriteFrame = sp;
        });
        getGeneralText(generalId, 'name').then((sp) => {
            this.newGeneralName.spriteFrame = sp;
        });
    }

    public showGeneral(generalId: number, has: boolean) {
        this.node.active = true;
        this.newGeneralNode.active = false;
        this.generalNode.active = true;

        this.generalDesc.node.active = false;
        this.strategy.node.active = false;
        this.countLab.node.active = false;
        this.goGameBtn.active = false;

        getGeneralSprite(generalId).then((sp) => {
            this.generalSprite.spriteFrame = sp;
        });
        getGeneralText(generalId, 'name').then((sp) => {
            this.generalName.spriteFrame = sp;
        });
        if (has) {
            this.generalDesc.node.active = true;
            getGeneralText(generalId, 'desc').then((sp) => {
                this.generalDesc.spriteFrame = sp;
            });
        }
        else {
            this.strategy.node.active = true;
            this.goGameBtn.active = true;
            getGeneralText(generalId, 'strategy').then((sp) => {
                this.strategy.spriteFrame = sp;
            });
            if (generalId === eGeneralType.guanyu) {
                userControl.getGreenDragonBladeNum().then((num) => {
                    this.countLab.string = num.toString();
                    this.countLab.node.active = true;
                });
            }
        }

    }

    public hide() {
        this.node.active = false;
    }

    public goGame() {
        this.pageManager.showUI(UI_PATH.GAME, UILayer.MIDDLE, () => {
            this.pageManager.removeUI(UI_PATH.CAMP);
        })
    }

}


