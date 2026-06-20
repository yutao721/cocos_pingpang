import { PageManager, UILayer } from "../../framework/ui/PageManager";
import { Toast } from "../../framework/ui/Toast";


export class ToastMgr {
    private static instance: ToastMgr;
    public static get Instance(): ToastMgr {
        if (!this.instance) {
            this.instance = new ToastMgr();
        }
        return this.instance;
    }

    private constructor() {
        
    }

    private isInit: boolean = false;
    private tip: Toast = null;

    public init() {
        if (this.isInit) {
            return;
        }
        this.isInit = true;
        PageManager.Instance.showUI('prefabs/toast', UILayer.SYSTEM, (node) => {
            this.tip = node.getComponent(Toast);
        });
    }

    public showToast(msg: string, delay?: number) {
        this.tip.show(msg, delay);
    }
}

export const tipControl = ToastMgr.Instance;