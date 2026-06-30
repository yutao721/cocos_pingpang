import { _decorator, Component, Node, resources, Sprite, SpriteAtlas, SpriteFrame } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';
import { playFrameAnimation } from '../../framework/utils/CommonFun';
import { UI_PATH } from '../const/UiConfig';
import { UILayer } from '../../framework/ui/PageManager';
import { userControl } from '../control/UserControl';
import { UiEvent } from '../const/EventDefine';
import { tipControl } from '../control/TipControl';
import { shareGame } from '../utils/utils';
import { AudioManager } from '../../framework/audio/AudioManager';
const { ccclass, property } = _decorator;

@ccclass('HomePage')
export class HomePage extends UiBase {

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

  protected onLoad(): void {
    this.campBtn.on(Node.EventType.TOUCH_END, this.goCamp, this);
    this.startGameBtn.on(Node.EventType.TOUCH_END, this.onStartGame, this);

    this.rewardBtn.on(Node.EventType.TOUCH_END, () => {
      this.pageManager.showUI(UI_PATH.REWARD);
    });

    // this.shareBtn.on(Node.EventType.TOUCH_END, shareGame);
    // this.soundBtn.on(Node.EventType.TOUCH_END, this.onClickSound, this);

    this.ruleBtn.on(Node.EventType.TOUCH_END, () => {
      this.pageManager.showUI(UI_PATH.RULE, UILayer.TOP);
    })

    this.updateSoundState();
  }

  protected onEnable(): void {
    // userControl.initConfigData();
    if (userControl.isLoginVal) {
      userControl.initUserData();
    }
  }

  protected start(): void {

  }

  private onStartGame() {
    this.pageManager.showUI(UI_PATH.GAME, UILayer.MIDDLE, () => {
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
    this.pageManager.showUI(UI_PATH.CAMP, UILayer.MIDDLE, () => {
      this.pageManager.removeUI(this.node);
    });
  }
}


