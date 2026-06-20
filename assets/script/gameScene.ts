import { _decorator, Component, Node } from 'cc';
import { UiBase } from '../framework/ui/UiBase';
import { ToastMgr } from './control/toastMgr';
const { ccclass, property } = _decorator;

@ccclass('gameScene')
export class gameScene extends UiBase {

    protected onInit(): void {
        // 页面管理初始化
        this.pageManager.init(this.node);
        ToastMgr.Instance.init();
        this.pageManager.showUI('prefabs/loading');
    }
}


