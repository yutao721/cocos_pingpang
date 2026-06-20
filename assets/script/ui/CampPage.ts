import { _decorator, Component, instantiate, Node, Sprite, SpriteFrame } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';
import { loadJson } from '../../framework/utils/CommonFun';
import { Api } from '../api/api';
import { userControl, UserControl } from '../control/UserControl';
import { getGeneralSprite } from '../utils/utils';
import { GeneralPopup } from './GeneralPopup';
import { UiEvent } from '../const/EventDefine';
import { UI_PATH } from '../const/UiConfig';
import { UILayer } from '../../framework/ui/PageManager';
const { ccclass, property } = _decorator;

@ccclass('CampPage')
export class CampPage extends UiBase {
    
    @property(Node)
    rankBtn: Node = null;

    @property(Node)
    item: Node = null;

    @property(Node)
    backNode: Node = null;

    @property(GeneralPopup)
    generalPopup: GeneralPopup = null;

    private generalSpArr: {sp: Sprite, id: number, has: boolean}[] = [];

    protected onLoad(): void {
        this.item.active = false;

        this.initGeneralView();

        this.rankBtn.on(Node.EventType.TOUCH_END, this.onRankBtnClick, this);
        this.backNode.on(Node.EventType.TOUCH_END, this.goHome, this);
    }

    protected start(): void {
        this.updateMyGeneral();
    }

    private async initGeneralView() {
        const generalConfig = userControl.getAllGeneralConfig();
        generalConfig.forEach((item: {id: number}, index: number) => {
            const node = instantiate(this.item);
            node.active = true;
            node.parent = this.item.parent;
            const sp = node.getComponent(Sprite);
            this.generalSpArr.push({
                sp: sp,
                id: item.id,
                has: false
            });
            getGeneralSprite(item.id, 'card').then((spriteFrame: SpriteFrame) => {
                sp.spriteFrame = spriteFrame;
                sp.grayscale = true;
            });
            node.on(Node.EventType.TOUCH_END, () => {
                this.onClickGeneral(index);
            }, this);
        });
    }

    private async updateMyGeneral() {
        const myGeneral = await userControl.updateMyGeneral();
        myGeneral.forEach(id => {
            const generalSp = this.generalSpArr.find(item => item.id === id);
            if (generalSp) {
                generalSp.sp.grayscale = false;
                generalSp.has = true;
            }
        });
    }

    private onClickGeneral(index: number) {
        const item = this.generalSpArr[index];
        this.generalPopup.showGeneral(item.id, item.has);
    }

    private onRankBtnClick() {
        this.pageManager.showUI(UI_PATH.RANK, UILayer.TOP);
    }

    public onShowNewGeneral(id: number) {
        this.generalPopup.node.active = true;
        this.generalPopup.showNewGeneral(id);
    }

    public goHome() {
        this.pageManager.showUI(UI_PATH.HOME, UILayer.MIDDLE, () => {
            this.pageManager.removeUI(this.node);
        });
    }

}


