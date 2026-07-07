import { _decorator, Component, Label, Node, ProgressBar, resources } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';
import { HttpClient } from '../../framework/http/HttpClient';
import { UI_PATH } from '../const/UiConfig';
import { userControl, UserControl } from '../control/UserControl';
import { gameControl } from '../control/GameControl';
import { BundleManager } from '../../framework/bundle/BundleManager';
import { loadWxScript } from '../../framework/utils/CommonFun';
const { ccclass, property } = _decorator;

@ccclass('LoadingPage')
export class LoadingPage extends UiBase {

  @property(ProgressBar)
  progressBar: ProgressBar = null;

  @property(Node)
  tagNode: Node = null;

  @property(Label)
  tipLab: Label = null;

  protected onLoad(): void {
    loadWxScript();
    this.loadResources();
  }

  private setProgress(progress: number): void {
    this.progressBar.progress = progress;
    this.tagNode.x = -325 + progress * (223 - (-325));
  }

  private loadResources(): void {
    this.progressBar.progress = 0;
    this.tagNode.active = true;

    // 假进度：慢慢爬到 0.3，等真实进度超过它再切换
    let fakeProgress = 0;
    this.schedule(() => {
      if (fakeProgress < 0.3 && this.progressBar.progress <= fakeProgress) {
        fakeProgress += 0.002;
        this.setProgress(fakeProgress);
      }
    }, 0.05);

    // 加载 resources 文件夹资源
    BundleManager.getBundle().loadDir("/", (finished: number, total: number, _item: any) => {
      // 更新进度条
      if (total > 0) {
        const progress = finished / total;
        if (progress > this.progressBar.progress) {
          this.setProgress(progress);
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

  // 资源加载完成后的处理
  private onLoadComplete(): void {
    // 可以在这里切换到下一个场景或执行其他操作
    // 例如：this.loadScene('MainScene');

    this.pageManager.showUI(UI_PATH.HOME);
    this.pageManager.removeUI(this.node);

    // 用户数据配置初始化
    userControl.initConfigData();
  }

}


