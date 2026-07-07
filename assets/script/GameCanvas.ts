import { _decorator, Component, instantiate, Node, Prefab, resources, Widget } from 'cc';
import { PageManager } from '../framework/ui/PageManager';
import { UI_PATH } from './const/UiConfig';
import { UiBase } from '../framework/ui/UiBase';
import { UserControl } from './control/UserControl';
import { TipControl } from './control/TipControl';
import { AudioManager } from '../framework/audio/AudioManager';
const { ccclass, property } = _decorator;

@ccclass('GameCanvas')
export class GameCanvas extends UiBase {

  protected onLoad(): void {
    document.title = '乒乓接球大挑战';
    // 页面管理初始化
    this.pageManager.init(this.node);
    this.pageManager.showUI(UI_PATH.LOADING);
    // 提示管理初始化
    TipControl.Instance.init();
    // 音频管理初始化
    AudioManager.Instance;
  }
}


