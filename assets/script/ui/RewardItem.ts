import { _decorator, Node, resources, RichText, Sprite, SpriteFrame, UITransform } from 'cc';
declare const wx: any;
import { UiBase } from '../../framework/ui/UiBase';
import { UILayer } from '../../framework/ui/PageManager';
import { RewardState } from '../const/RewardConst';
import { userControl } from '../control/UserControl';
import { tipControl } from '../control/TipControl';
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
    this.receiveBtn?.on(Node.EventType.TOUCH_END, this.onReceive, this);
    this.receivedBtn?.on(Node.EventType.TOUCH_END, this.onReceived, this);
  }

  private onReceive(): void {
    this.handleRewardClick();
  }

  private onReceived(): void {
    this.handleRewardClick();
  }

  private handleRewardClick(): void {
    switch (this.source) {
      case 1:
        this.pageManager.showUI(UI_PATH.VIDEO, UILayer.TOP);
        break;
      case 2:
        // 跳转到小程序首页
        wx.miniProgram.reLaunch({
          url: '/pages/index/index',
        })
        break;
      default:
        console.warn(`[RewardItem] unknown reward source: ${this.source}`);
        break;
    }
  }

  public initRewardItem(text: string, types: number[], source: number, key: string) {
    this.text.string = text;
    this.source = source;
    this.rewardKey = key;
    this.applySourceStyle();

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

  private applySourceStyle(): void {
    if (this.source !== 1) {
      return;
    }

    this.setNodeSpriteFrame(this.unfinished, 'image/reward/check_disabled');
    this.setNodeSpriteFrame(this.receivedBtn, 'image/reward/check');
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

  private setNodeSpriteFrame(node: Node | null, path: string): void {
    const sprite = node?.getComponent(Sprite);
    if (!sprite) {
      return;
    }

    resources.load(`${path}/spriteFrame`, SpriteFrame, (err, spriteFrame) => {
      if (err || !spriteFrame || !sprite.isValid) {
        return;
      }
      sprite.spriteFrame = spriteFrame;
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

