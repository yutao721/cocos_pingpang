import { _decorator, Component, instantiate, Node, Prefab, resources, Widget } from 'cc';
import { PageManager } from '../framework/ui/PageManager';
import { UI_PATH } from './const/UiConfig';
import { UiBase } from '../framework/ui/UiBase';
import { UserControl } from './control/UserControl';
import { TipControl } from './control/TipControl';
import { AudioManager } from '../framework/audio/AudioManager';
import { pingPangControl } from './control/PingPangControl';
const { ccclass, property } = _decorator;

@ccclass('GameCanvas')
export class GameCanvas extends UiBase {

  protected onLoad(): void {
    setTimeout(() => {
      const splash = document.getElementById('CustomSplash');
      if (splash) {
        splash.style.display = 'none';
      }
    }, 100);
    document.title = '乒乓控场挑战';
    // 页面管理初始化
    this.pageManager.init(this.node);
    // this.pageManager.showUI(UI_PATH.LOADING);
    // 提示管理初始化
    TipControl.Instance.init();
    // 音频管理初始化
    AudioManager.Instance;
    // 补报上局卡死时未能上报的分数
    void pingPangControl.checkAndSubmitPendingScore();
  }
}


