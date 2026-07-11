import { _decorator, Node } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';
import { UI_PATH } from '../const/UiConfig';
import { UILayer } from '../../framework/ui/PageManager';

const { ccclass, property } = _decorator;

@ccclass('rule')
export class rule extends UiBase {

  @property(Node)
  backNode: Node = null;


  onLoad() {
    this.backNode.on(Node.EventType.TOUCH_END, this.goHome, this);
  }


  public goHome() {
    this.pageManager.showUI(UI_PATH.HOME, UILayer.MIDDLE, () => {
      this.pageManager.removeUI(this.node);
    });
  }
}


