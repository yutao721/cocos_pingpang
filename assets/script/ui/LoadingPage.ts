import { _decorator, Component, Label, Node, ProgressBar, resources } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';
import { HttpClient } from '../../framework/http/HttpClient';
import { UI_PATH } from '../const/UiConfig';
import { userControl, UserControl } from '../control/UserControl';
import { gameControl } from '../control/GameControl';
import { BundleManager } from '../../framework/bundle/BundleManager';
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
    this.loadResources();
  }

  private loadResources(): void {

    this.progressBar.progress = 0;
    this.tagNode.active = true;
    // this.onLoadComplete();
    // return;
    // 加载 resources 文件夹资源
    BundleManager.getBundle().loadDir("/", (finished: number, total: number, item: any) => {
      // 更新进度条
      if (total > 0) {
        const progress = finished / total;
        this.progressBar.progress = progress;
        // 根据进度计算 x 坐标：从-105到105的线性映射
        const x = -325 + progress * (223 - (-325));
        this.tagNode.x = x;
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


