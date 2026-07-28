import { _decorator, Component, Node, Prefab, resources, Sprite, SpriteAtlas, SpriteFrame } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';
import { playFrameAnimation } from '../../framework/utils/CommonFun';
import { UI_PATH } from '../const/UiConfig';
import { UILayer } from '../../framework/ui/PageManager';
import { userControl } from '../control/UserControl';
import { UiEvent } from '../const/EventDefine';
import { tipControl } from '../control/TipControl';
import { shareGame } from '../utils/utils';
import { AudioManager } from '../../framework/audio/AudioManager';
import { Api } from '../api/api';
import { pingPangControl } from '../control/PingPangControl';
const { ccclass, property } = _decorator;
declare const wx: any;

@ccclass('HomePage')
export class HomePage extends UiBase {

  private static guideShown = false;

  @property(Sprite)
  bgSprite: Sprite = null;

  @property(Node)
  campBtn: Node = null;

  @property(Node)
  rewardBtn: Node = null;

  @property(Node)
  startGameBtn: Node = null;

  // @property(Node)
  // shareBtn: Node = null;

  // @property(Node)
  // soundBtn: Node = null;

  @property(Node)
  ruleBtn: Node = null;

  @property(SpriteFrame)
  soundSprites: SpriteFrame[] = [];

  @property(Node)
  GuidePopup: Node = null;

  @property(Node)
  closeGuideBtn: Node = null;

  @property(Node)
  backNode: Node = null;

  protected onLoad(): void {
    this.GuidePopup.active = false;
    this.campBtn.on(Node.EventType.TOUCH_END, this.goCamp, this);
    this.startGameBtn.on(Node.EventType.TOUCH_END, this.onStartGame, this);
    this.closeGuideBtn.on(Node.EventType.TOUCH_END, this.oncloseGuide, this);

    this.rewardBtn.on(Node.EventType.TOUCH_END, () => {
      this.pageManager.showUI(UI_PATH.REWARD);
    });


    this.backNode.on(Node.EventType.TOUCH_END, ()=> {
      wx.miniProgram.reLaunch({
        url: '/pages/index/index',
      })
    }, this);

    // this.shareBtn.on(Node.EventType.TOUCH_END, shareGame);
    // this.soundBtn.on(Node.EventType.TOUCH_END, this.onClickSound, this);

    this.ruleBtn.on(Node.EventType.TOUCH_END, () => {
      this.pageManager.showUI(UI_PATH.RULE, UILayer.TOP);
    })

    // 暂时不显示引导图了
    // this.scheduleOnce(() => {
    //   this.showGuide();
    // })

    this.updateSoundState();
  }

  protected onEnable(): void {
    // userControl.initConfigData();
    if (userControl.isLoginVal) {
      void userControl.initUserData();
    }
    void pingPangControl.checkAndSubmitPendingScore();
  }

  protected start(): void {

  }

  private onStartGame() {
    this.pageManager.showUI(UI_PATH.PINGPANG_COUNTDOWN, UILayer.MIDDLE, () => {
      this.pageManager.removeUI(this.node);
    });
  }

  private onClickSound() {
    const isSoundEnabled = userControl.getSoundEnabled();
    userControl.setSoundEnabled(!isSoundEnabled);
    this.updateSoundState();
  }

  private updateSoundState() {
    const isSoundEnabled = userControl.getSoundEnabled();
    // const soundBtn = this.soundBtn.getComponent(Sprite);
    // soundBtn && (soundBtn.spriteFrame = this.soundSprites[isSoundEnabled ? 0 : 1]);
    userControl.updatePlayBgmState();
  }

  private goCamp() {
    this.pageManager.showUI(UI_PATH.RANK, UILayer.MIDDLE, () => {
      this.pageManager.removeUI(this.node);
    });
  }

  private showGuide() {
    if (HomePage.guideShown) return;
    this.GuidePopup.active = true;
  }

  private oncloseGuide() {
    HomePage.guideShown = true;
    this.GuidePopup.active = false;
  }

}


