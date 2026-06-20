import { _decorator, Component, Label, Node } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';
import { EventManager } from '../../framework/event/EventManager';
import { ToastMgr } from '../control/toastMgr';
const { ccclass, property } = _decorator;

@ccclass('main')
export class main extends UiBase {

    @property(Label)
    scoreLabel: Label = null;

    @property(Node)
    btnNode: Node = null;

    private score = 0;
    
    protected onInit(): void {
        this.updateScore();
        // 监听全局事件
        EventManager.global.on('updateScore', this.updateScore, this);
        this.btnNode.on(Node.EventType.TOUCH_END, this.onClickBtn, this);
    }

    protected onDestroy(): void {
        // 取消全局事件监听
        EventManager.global.off('updateScore', this.updateScore, this);
    }

    private onClickBtn() {
        this.score++;
        ToastMgr.Instance.showToast('分数+1');
        EventManager.global.emit('updateScore', this.score);
    }

    private updateScore() {
        this.scoreLabel.string = '分数：' + this.score;
    }

}


