import { _decorator, Button, Node, resources, RichText, Sprite, SpriteFrame, UITransform } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';
import { UILayer } from '../../framework/ui/PageManager';
import { RewardState } from '../const/RewardConst';
import { userControl } from '../control/UserControl';
import { UI_PATH } from '../const/UiConfig';

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
  private rewardKey = '';

  protected onLoad(): void {
    this.receiveBtn.on(Button.EventType.CLICK, this.onReceive, this);
  }

  private onReceive() {
    console.log(this.source);
    this.pageManager.showUI(UI_PATH.VIDEO, UILayer.TOP);
  }

  public initRewardItem(text: string, types: number[], source: number, key: string) {
    this.text.string = text;
    this.source = source;
    this.rewardKey = key;

    this.getRewardIcon(types[0]).then(spriteFrame => {
      this.icon[0].getComponent(Sprite).spriteFrame = spriteFrame;
      this.icon[0].active = true;
    });

    const node = this.icon[0];
    node.getComponent(UITransform).setContentSize(60, 60);
    node.x = 0;

    this.refreshState();
  }

  public refreshState(): void {
    const state = userControl.getRewardState(this.rewardKey);
    this.setBtnState(state);
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

  public setBtnState(state: RewardState = RewardState.unfinished) {
    this.unfinished.active = false;
    this.receiveBtn.active = false;
    this.receivedBtn.active = false;

    switch (state) {
      case RewardState.unfinished:
        this.unfinished.active = true;
        break;
      case RewardState.received:
        this.receivedBtn.active = true;
        break;
      case RewardState.claimable:
        this.receiveBtn.active = true;
        break;
      default:
        this.receiveBtn.active = true;
        break;
    }
  }
}

