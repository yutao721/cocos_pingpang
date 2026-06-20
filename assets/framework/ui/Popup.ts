import { _decorator, Color, Component, Node, Sprite, UITransform, Widget, builtinResMgr, SpriteFrame, Texture2D } from 'cc';
import { UiBase } from './UiBase';
const { ccclass, property } = _decorator;

@ccclass('Popup')
export class Popup extends UiBase {
    
    // @property({ serializable: true })
    // public autoCreateMask: boolean = true;

    // @property({ type: Color })
    // public maskColor: Color = new Color(0, 0, 0, 180);

    @property({ serializable: true, displayName: '点击遮罩关闭' })
    public maskClosable: boolean = true;

    // maskClosable为true才显示
    @property({
        type: Node,
        displayName: '遮罩节点',
        visible(this: Popup) {
            return this.maskClosable;
        }
    })
    public maskNode: Node | null = null;

    @property({
        displayName: '关闭自动移除',
        visible(this: Popup) {
            return this.maskClosable;
        }
    })
    public closeAutoRemove: boolean = true;

    protected onLoad(): void {
        // if (this.autoCreateMask) {
        //     this._ensureMask();
        // }
        if (this.maskClosable) {
            this.maskNode.on(Node.EventType.TOUCH_END, this.closePopup, this);
        }
    }

    public closePopup() {
        if (this.closeAutoRemove) {
            this.pageManager.removeUI(this.node);
        } 
        else {
            this.pageManager.hideUI(this.node);
        }
    }
}
