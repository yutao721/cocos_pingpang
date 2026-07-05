import { _decorator, instantiate, Label, Node } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';
import { UILayer } from '../../framework/ui/PageManager';
import { RewardInfoUpdateEvent } from '../const/RewardConst';
import { RewardConfig } from '../const/GameConst';
import { userControl } from '../control/UserControl';
import { UI_PATH } from '../const/UiConfig';
import { RewardItem } from './RewardItem';

const { ccclass, property } = _decorator;

@ccclass('RewardPage')
export class RewardPage extends UiBase {
  @property(Node)
  public rewardItem: Node = null;

  @property(Node)
  public backNode: Node = null;

  @property(Label)
  public titlelabel: Label = null;

  @property(Label)
  public countlabel: Label = null;

  @property(Label)
  public tipslabel: Label = null;

  @property(Node)
  public startGameBtn: Node = null;

  private rewardItemList: RewardItem[] = [];

  protected onLoad(): void {
    this.onUiEvent(RewardInfoUpdateEvent, this.refreshRewardItems);

    this.startGameBtn.on(Node.EventType.TOUCH_END, this.onStartGame, this);
    this.backNode.on(Node.EventType.TOUCH_END, this.onBack, this);

    this.buildRewardItems();
    this.refreshRewardItems();
  }

  protected onEnable(): void {
    this.refreshRewardItems();
    void userControl.refreshRewardData();
    this.updateRewardView();
  }

  // 更新奖励信息
  private updateRewardView(): void {
    const count = userControl.getRewardCompletedCount();
    if (!count || count <= 0) {
      this.titlelabel.string = '很遗憾，您尚未完成解锁成就';
      this.tipslabel.string = '继续努力';
      this.countlabel.string = '';
    } else {
      this.titlelabel.string = '太棒了，您已解锁';
      if (count >= 3) {
        this.tipslabel.string = '全部成就';
        this.countlabel.string = '';
      } else {
        this.countlabel.string = `${count}`;
        this.tipslabel.string = '项成就';
      }
    }
  }

  private buildRewardItems(): void {
    this.rewardItem.active = false;
    this.rewardItemList.length = 0;

    RewardConfig.forEach((config) => {
      const node = instantiate(this.rewardItem);
      node.parent = this.rewardItem.parent;
      node.active = true;

      const item = node.getComponent(RewardItem);
      if (!item) {
        return;
      }

      const text = `<b><color=#FFFFFF>${config.desc}</color></b>`;
      item.initRewardItem(text, config.type, config.source, config.key);
      this.rewardItemList.push(item);
    });
  }

  private refreshRewardItems(): void {
    this.rewardItemList.forEach((item) => item.refreshState());
  }

  private onBack(): void {
    this.pageManager.showUI(UI_PATH.HOME, UILayer.MIDDLE, () => {
      this.pageManager.removeUI(this.node);
    });
  }

  private onStartGame() {
    this.pageManager.showUI(UI_PATH.GAME, UILayer.MIDDLE, () => {
      this.pageManager.removeUI(this.node);
    });
  }
}
