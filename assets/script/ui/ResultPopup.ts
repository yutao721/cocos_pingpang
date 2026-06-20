import { _decorator, Component, Label, Node, Sprite, SpriteFrame } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';
import { UI_PATH } from '../const/UiConfig';
import { UILayer } from '../../framework/ui/PageManager';
import { gameControl } from '../control/GameControl';
import { IResult } from '../const/Interface';
import { getGeneralText, getGeneralSprite, shareGame } from '../utils/utils';
import { CampPage } from './CampPage';
import { FollowConfig as GameFollowConfig } from '../const/GameConst';
import { BundleManager } from '../../framework/bundle/BundleManager';
const { ccclass, property } = _decorator;

@ccclass('ResultPopup')
export class ResultPopup extends UiBase {

    @property(Node)
    winContent: Node = null;

    @property(Node)
    loseContent: Node = null;

    @property(Node)
    goHomeBtn: Node = null;

    @property(Node)
    continueBtn: Node = null;

    @property(Node)
    againBtn: Node = null;

    @property(Node)
    goCampBtn: Node = null;

    @property(Node)
    generalNode: Node = null;

    @property(Sprite)
    generalSprite: Sprite = null;

    @property(Sprite)
    generalLines: Sprite = null;

    @property(Node)
    winLines: Node = null;

    @property(Node)
    revivalContent: Node = null;

    @property(Node)
    shareBtn: Node = null;

    private resultData: IResult = null;
    
    protected onLoad(): void {
        this.goHomeBtn.on(Node.EventType.TOUCH_END, this.goHome, this);
        this.continueBtn.on(Node.EventType.TOUCH_END, this.restart, this);
        this.againBtn.on(Node.EventType.TOUCH_END, this.restart, this);
        this.goCampBtn.on(Node.EventType.TOUCH_END, this.goCamp, this);
        this.shareBtn.on(Node.EventType.TOUCH_END, this.share, this);
    }

    public showWin(resultData: IResult): void {
        this.winContent.active = true;
        this.loseContent.active = false;
        this.revivalContent.active = false;
        this.resultData = resultData;
        if (resultData.general_id) {
            this.generalNode.active = true;
            this.winLines.active = false;
            this.generalSprite.grayscale = resultData.status !== 1;
            getGeneralSprite(resultData.general_id).then(sp => {
                this.generalSprite.spriteFrame = sp;
            });
            getGeneralText(resultData.general_id, 'obtain').then(sp => {
                this.generalLines.spriteFrame = sp;
            });
        }
        else {
            this.generalNode.active = false;
            this.winLines.active = true;
        }
        
    }

    public showLose(): void {
        this.winContent.active = false;
        this.loseContent.active = true;
        this.revivalContent.active = false;
    }

    public showRevival(): void {
        this.winContent.active = false;
        this.loseContent.active = false;
        this.revivalContent.active = true;
        
        const index = this.getShareIndex();
        if (index < GameFollowConfig.length) {
            const follow = GameFollowConfig[index];
            BundleManager.loadAsync(`image/result/follow_${follow.key}/spriteFrame`, SpriteFrame).then(sp => {
                this.shareBtn.getComponent(Sprite).spriteFrame = sp;
            });
        }
    }

    public goHome(): void {
        this.pageManager.removeUI(this.node);
        this.pageManager.showUI(UI_PATH.HOME, UILayer.MIDDLE, () => {
            this.pageManager.removeUI(UI_PATH.GAME);
        });
    }

    public restart(): void {
        this.pageManager.removeUI(this.node);
        gameControl.initGameMap();
    }

    public goCamp(): void {
        this.pageManager.showUI(UI_PATH.CAMP, UILayer.MIDDLE, (node: Node) => {
            const camp = node.getComponent(CampPage);
            if (camp && this.resultData.status === 1) {
                camp.onShowNewGeneral(this.resultData.general_id);
            }
            this.pageManager.removeUI(this.node);
            this.pageManager.removeUI(UI_PATH.GAME);
        });
    }

    public share(): void {
        // TODO: 分享
        const index = this.getShareIndex();
        localStorage.setItem('revivalIndex'+new Date().toLocaleDateString(), (index+1).toString());
        if (index < GameFollowConfig.length) {
            const follow = GameFollowConfig[index];
            location.href = follow.url;
            this.revivalGame();
        }
        else {
            shareGame().then(() => {
                this.revivalGame();
            });
        }
    }

    private revivalGame(): void {
        this.pageManager.removeUI(this.node);
        gameControl.revival();
    }

    private getShareIndex(): number {
        const dateString = new Date().toLocaleDateString();
        return parseInt(localStorage.getItem('revivalIndex'+dateString)) || 0;
    }

}


