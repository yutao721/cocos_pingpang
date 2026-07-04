import { _decorator, Component, instantiate, Node } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';
import { RewardConfig } from '../const/GameConst';
import { RewardItem } from './RewardItem';
import { userControl } from '../control/UserControl';
import { UI_PATH } from '../const/UiConfig';
import { UILayer } from '../../framework/ui/PageManager';
const { ccclass, property } = _decorator;

@ccclass('RewardPage')
export class RewardPage extends UiBase {

  @property(Node)
  public rewardItem: Node = null;

  @property(Node)
  public backNode: Node = null;

  @property(Node)
  public startGameBtn: Node = null;

  protected onLoad(): void {

    this.startGameBtn.on(Node.EventType.TOUCH_END, this.onStartGame, this);

    this.rewardItem.active = false;
    const config = RewardConfig;
    console.log(config);
    config.forEach((config, index) => {
      let node = instantiate(this.rewardItem);
      node.parent = this.rewardItem.parent;
      node.active = true;
      const item: RewardItem = node.getComponent(RewardItem);
      const text = `<b><color=#FFFFFF>${config.desc}</color>`
      item.initRewardItem(text, config.type, config.source, config.key);
    });

    this.backNode.on(Node.EventType.TOUCH_END, () => {
      this.pageManager.removeUI(this.node);
    });
  }

  private onStartGame() {
    this.pageManager.showUI(UI_PATH.GAME, UILayer.MIDDLE, () => {
      this.pageManager.removeUI(this.node);
    });
  }

}


