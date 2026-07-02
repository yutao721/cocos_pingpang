import { _decorator, Node, } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';
import { UI_PATH } from '../const/UiConfig';
import { UILayer } from '../../framework/ui/PageManager';
import { IPingPangResult } from '../const/Interface';
import { pingPangControl } from '../control/PingPangControl';
import { userControl } from '../control/UserControl';
import { PosterHelper } from '../utils/PosterHelper';
const { ccclass, property } = _decorator;

@ccclass('ResultPopup')
export class ResultPopup extends UiBase {


  @property(Node)
  loseContent: Node = null;

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
    this.resultData = result;
  }



  public showLose(): void {
    this.loseContent.active = true;
  }



  public goHome(): void {
    this.pageManager.removeUI(this.node);
    this.pageManager.showUI(UI_PATH.HOME, UILayer.MIDDLE, () => {
      this.pageManager.removeUI(UI_PATH.GAME);
    });
  }

  public restart(): void {
    this.pageManager.removeUI(this.node);
    // gameControl.initGameMap();
    // 重新开始：通知 PingPangPage 重启游戏
    pingPangControl.startGame();
  }

  public goRank(): void {
    this.pageManager.showUI(UI_PATH.RANK, UILayer.MIDDLE, (node: Node) => {
      this.pageManager.removeUI(this.node);
      this.pageManager.removeUI(UI_PATH.GAME);
    });
  }

  public share(): void {
    const userInfo = {
      rank: 1,
      nickname: 'NuMen',
      headimgurl: 'https://usersstatic.solomochina.com/crocs/dm/avatar/202504/6/174391468672043.png',
      score: 10000,
      openid: '112111'
    }
    const result = {
      score: 1000,
      maxCombo: 12,
      hitCount: 145,
      shoeFlowerHit: 123,
      duration: 1234,
    }
    // const userInfo = userControl.getUserInfo();
    // const result = this.resultData;
    if (!result) return;
    PosterHelper.generate(result, userInfo).catch(err => {
      console.warn('[ResultPopup] generate poster failed', err);
    });
  }



}
