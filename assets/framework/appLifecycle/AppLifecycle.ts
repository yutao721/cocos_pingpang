import { _decorator, Game, game } from 'cc';
import EventDispatcher from '../event/EventDispatcher';

export enum AppLifecycleEvent {
    SHOW = "app_show", // 应用进入前台
    HIDE = "app_hide" // 应用进入后台
}

export enum AppState {
    FOREGROUND = "foreground",
    BACKGROUND = "background"
}

// 应用生命周期管理
export class AppLifecycleManager {
    private static inited = false;
    private static state: AppState = AppState.FOREGROUND;

    private static dispatcher: EventDispatcher = new EventDispatcher();

    public static init() {
        if (this.inited) return;
        this.inited = true;

        // Cocos 内置
        game.on(Game.EVENT_SHOW, this.handleShow, this);
        game.on(Game.EVENT_HIDE, this.handleHide, this);

        // Web 兼容补充（防止 EVENT_HIDE/SHOW 不触发）
        if (typeof document !== 'undefined' && document.addEventListener) {
            document.addEventListener("visibilitychange", () => {
                if (document.hidden && this.state !== AppState.BACKGROUND) {
                    this.handleHide();
                } else if (!document.hidden && this.state !== AppState.FOREGROUND) {
                    this.handleShow();
                }
            });
        }
    }

    private static handleShow() {
        if (this.state === AppState.FOREGROUND) return;
        this.state = AppState.FOREGROUND;
        this.dispatcher.emit(AppLifecycleEvent.SHOW);
    }

    private static handleHide() {
        if (this.state === AppState.BACKGROUND) return;
        this.state = AppState.BACKGROUND;
        this.dispatcher.emit(AppLifecycleEvent.HIDE);
    }

    public static on(name: AppLifecycleEvent, listener: Function, target: any) {
        this.dispatcher.on(name, listener, target);
    }

    public static once(name: AppLifecycleEvent, listener: Function, target: any) {
        this.dispatcher.once(name, listener, target);
    }

    public static off(name: AppLifecycleEvent, listener: Function, target: any) {
        this.dispatcher.off(name, listener, target);
    }

    public static getState(): AppState {
        return this.state;
    }
}
