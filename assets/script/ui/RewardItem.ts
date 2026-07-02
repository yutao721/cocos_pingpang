import { _decorator, Button, Component, Node, resources, RichText, Sprite, SpriteFrame, UITransform } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';
import { userControl } from '../control/UserControl';
import { Api } from '../api/api';
import { UI_PATH } from '../const/UiConfig';
import { UILayer } from '../../framework/ui/PageManager';
const { ccclass, property } = _decorator;

@ccclass('RewardItem')
export class RewardItem extends UiBase {

  @property(Node)
  receiveBtn: Node = null;

  @property(Node)
  receivedBtn: Node = null;

  @property(Node)
  unfinished: Node = null;

  @property(RichText)
  text: RichText = null;

  @property(Node)
  icon: Node[] = [];

  private source: number;

  protected onLoad(): void {
    this.receiveBtn.on(Button.EventType.CLICK, this.onReceive, this);
  }

  private onReceive() {
    console.log(this.source);
    // this.setBtnState(1);
    this.pageManager.showUI(UI_PATH.VIDEO, UILayer.TOP);
  }

  public initRewardItem(text: string, types: number[], source: number, key: string) {
    this.text.string = text;
    console.log(types, source, key, text)
    this.source = source;
    this.getRewardIcon(types[0]).then(spriteFrame => {
      this.icon[0].getComponent(Sprite).spriteFrame = spriteFrame;
      this.icon[0].active = true;
    });
    const node = this.icon[0];
    node.getComponent(UITransform).setContentSize(70, 70);
    node.x = 0;
    const state = userControl.getRewardList()[key];
    this.setBtnState(2);
  }

  public getRewardIcon(type: number): Promise<SpriteFrame> {
    return new Promise((resolve, reject) => {
      resources.load(`image/reward/reward_${type}/spriteFrame`, SpriteFrame, (err, spriteFrame) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(spriteFrame);
      });
    });
  }

  public setBtnState(state: number = 0) {
    this.unfinished.active = false;
    this.receiveBtn.active = false;
    this.receivedBtn.active = false;
    switch (state) {
      case 0: //未完成
        this.unfinished.active = true;
        break;
      case 1: //已领取
        this.receivedBtn.active = true;
        break;
      case 2: //可领取
        this.receiveBtn.active = true;
        break;
      default:
        this.receiveBtn.active = true;
        break;
    }
  }

}


