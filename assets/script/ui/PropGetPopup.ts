import { _decorator, Component, Node } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';
import { ePropType } from '../const/GameConst';
import { gameControl } from '../control/GameControl';
import { shareGame } from '../utils/utils';
const { ccclass, property } = _decorator;

@ccclass('PropGetPopup')
export class PropGetPopup extends UiBase {
    
    @property(Node)
    shareBtn: Node = null;

    private type: ePropType = null;

    protected onLoad(): void {
        this.shareBtn.on(Node.EventType.TOUCH_END, this.onShareBtn, this);
    }

    public show(type: ePropType) {
        this.type = type;
    }

    private onShareBtn() {
        shareGame().then(() => {
            gameControl.useProp(this.type);
            this.pageManager.removeUI(this.node);
        });
    }

}


