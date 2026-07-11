import { _decorator, Label, ProgressBar } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';
import { BundleManager } from '../../framework/bundle/BundleManager';
import { UILayer } from '../../framework/ui/PageManager';
import { ToastMgr } from '../control/toastMgr';
const { ccclass, property } = _decorator;

@ccclass('loading')
export class loading extends UiBase {

  @property(Label)
  rateLabel: Label = null;

  @property(ProgressBar)
  progressBar: ProgressBar = null;

  protected onInit(): void {
    this.rateLabel.string = "0%";
    BundleManager.getBundle().loadDir('/image/common', (finished: number, total: number, item: any) => {
      // 更新进度条
      if (total > 0) {
        const progress = finished / total;
        const nowProgress = this.progressBar.progress;
        if (nowProgress < progress) {
          this.progressBar.progress = progress;
          this.rateLabel.string = `${Math.floor(progress * 100)}%`;
        }
      }
    }, (err: Error, assets: any[]) => {
      if (err) {
        console.error('资源加载失败:', err);
        return;
      }
      console.log('资源加载完成，共加载资源数:', assets.length);
      // 加载完成后的处理
      this.onLoadComplete();
    });
  }

  private onLoadComplete() {
    // 加载完成后的处理
    ToastMgr.Instance.showToast('加载完成，即将进入主界面');
    // 延迟2秒后显示主界面
    // this.scheduleOnce(() => {
    //   this.pageManager.showUI('prefabs/main');
    //   this.pageManager.removeUI(this.node);
    //   ToastMgr.Instance.showToast('跳转到主界面');
    // }, 2);
  }

}


