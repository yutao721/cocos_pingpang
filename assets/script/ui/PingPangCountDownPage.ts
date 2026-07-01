import { _decorator, Label, Tween, Vec3, tween } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';
import { UILayer } from '../../framework/ui/PageManager';
import { UI_PATH } from '../const/UiConfig';
const { ccclass, property } = _decorator;

@ccclass('PingPangCountDownPage')
export class PingPangCountDownPage extends UiBase {

  @property(Label)
  countLabel: Label = null;

  private countNum: number = 3;

  protected onEnable(): void {
    this.startCountDown();
  }

  protected onDestroy(): void {
    this.unscheduleAllCallbacks();
    this.countLabel?.node && Tween.stopAllByTarget(this.countLabel.node);
    super.onDestroy();
  }

  private startCountDown(): void {
    this.countNum = 3;
    this.unscheduleAllCallbacks();
    this.updateCountLabel();
    this.scheduleOnce(() => {
      this.countNum--;
      this.runNextCount();
    }, 1);
  }

  private runNextCount(): void {
    if (this.countNum <= 0) {
      this.onCountDownFinish();
      return;
    }

    this.updateCountLabel();
    this.scheduleOnce(() => {
      this.countNum--;
      this.runNextCount();
    }, 1);
  }

  private updateCountLabel(): void {
    if (!this.countLabel) {
      return;
    }

    this.countLabel.string = `${this.countNum}`;
    this.playCountAnim();
  }

  private playCountAnim(): void {
    if (!this.countLabel) {
      return;
    }

    Tween.stopAllByTarget(this.countLabel.node);

    this.countLabel.node.setScale(0.5, 0.5, 1);

    tween(this.countLabel.node)
      .to(0.18, { scale: new Vec3(1.15, 1.15, 1) })
      .to(0.2, { scale: new Vec3(1, 1, 1) })
      .start();
  }

  private onCountDownFinish(): void {
    // this.pageManager.showUI(UI_PATH.GAME, UILayer.MIDDLE, () => {
    //   this.pageManager.removeUI(this.node);
    // });
  }
}
