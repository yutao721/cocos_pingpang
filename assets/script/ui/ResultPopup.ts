import { _decorator, Label, Node } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';
import { UI_PATH } from '../const/UiConfig';
import { UILayer } from '../../framework/ui/PageManager';
import { IPingPangResult } from '../const/Interface';
import { userControl } from '../control/UserControl';
import { SharePopup } from './SharePopup';

const { ccclass, property } = _decorator;

@ccclass('ResultPopup')
export class ResultPopup extends UiBase {
  @property(Node)
  loseContent: Node = null;

  @property(Label)
  scoreLabel: Label = null;

  @property(Node)
  againBtn: Node = null;

  @property(Node)
  goRankBtn: Node = null;

  @property(Node)
  shareBtn: Node = null;

  private resultData: IPingPangResult = null;

  protected onLoad(): void {
    this.againBtn.on(Node.EventType.TOUCH_END, this.restart, this);
    this.goRankBtn.on(Node.EventType.TOUCH_END, this.goRank, this);
    this.shareBtn.on(Node.EventType.TOUCH_END, this.share, this);
  }

  public show(result: IPingPangResult): void {
    console.log('ResultPopup show', result);
    this.resultData = result;
    this.scoreLabel.string = result.score.toString();
  }

  public showLose(): void {
    this.loseContent.active = true;
  }

  public goHome(): void {
    this.pageManager.removeUI(this.node);
    this.pageManager.showUI(UI_PATH.HOME, UILayer.MIDDLE, () => {
    });
  }

  public restart(): void {
    this.pageManager.removeUI(this.node);
    this.pageManager.removeUI(UI_PATH.GAME);
    this.pageManager.showUI(UI_PATH.PINGPANG_COUNTDOWN, UILayer.MIDDLE);
  }

  public goRank(): void {
    this.pageManager.showUI(UI_PATH.RANK, UILayer.MIDDLE, () => {
      this.pageManager.removeUI(this.node);
      this.pageManager.removeUI(UI_PATH.GAME);
    });
  }

  public share(): void {
    const result = this.resultData ?? {
      score: 0,
      maxCombo: 0,
      hitCount: 12,
      shoeFlowerHit: 1,
      duration: 12,
    }
    if (!result) return;

    const userInfo = userControl.getUserInfo() ?? {
      nickname: '齐天大圣',
      openid: '12344',
      headimgurl: 'https://usersstatic.solomochina.com/crocs/dm/avatar/202512/24/1766565681651113.png',
    };

    this.pageManager.showUI(UI_PATH.SHARE, UILayer.MIDDLE, (node: Node) => {
      console.log('share ui show');

      const sharePopup = node.getComponent(SharePopup);
      if (!sharePopup) {
        console.warn('[ResultPopup] SharePopup component not found');
        return;
      }

      sharePopup.show({ result, userInfo });
    });
  }
}
