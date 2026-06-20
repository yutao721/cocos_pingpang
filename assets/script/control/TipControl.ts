import { error, instantiate, Prefab, resources } from "cc";
import { PageManager, UILayer } from "../../framework/ui/PageManager";
import { UI_PATH } from "../const/UiConfig";
import { TipTemp } from "../../framework/ui/TipTemp";


export class TipControl {
  private static instance: TipControl;
  public static get Instance(): TipControl {
    if (!this.instance) {
      this.instance = new TipControl();
    }
    return this.instance;
  }

  private constructor() {

  }

  private isInit: boolean = false;
  private tip: TipTemp = null;

  public init() {
    if (this.isInit) {
      return;
    }
    this.isInit = true;
    PageManager.Instance.showUI(UI_PATH.TIP, UILayer.SYSTEM, (node) => {
      this.tip = node.getComponent(TipTemp);
    });
  }

  public showTip(msg: string) {
    this.tip.showTip(msg);
  }
}

export const tipControl = TipControl.Instance;