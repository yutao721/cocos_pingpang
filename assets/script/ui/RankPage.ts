import { _decorator, Component, instantiate, Label, Layout, Node, Sprite, SpriteFrame } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';
import { loadJson } from '../../framework/utils/CommonFun';
import { Api } from '../api/api';
import { userControl, UserControl } from '../control/UserControl';
import { UiEvent } from '../const/EventDefine';
import { UI_PATH } from '../const/UiConfig';
import { UILayer } from '../../framework/ui/PageManager';
const { ccclass, property } = _decorator;

@ccclass('RankPage')
export class RankPage extends UiBase {


  @property(Node)
  item: Node = null;

  @property(Node)
  backNode: Node = null;


  protected onLoad(): void {
    this.item.active = false;


    this.backNode.on(Node.EventType.TOUCH_END, this.goHome, this);
  }

  protected start(): void {

  }

  public goHome() {
    this.pageManager.showUI(UI_PATH.HOME, UILayer.MIDDLE, () => {
      this.pageManager.removeUI(this.node);
    });
  }

}


