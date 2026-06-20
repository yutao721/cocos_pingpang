import { _decorator, Component, Node, error } from 'cc';
import EventDispatcher from '../event/EventDispatcher';
import { EventManager } from '../event/EventManager';
import { PageManager } from './PageManager';
const { ccclass, property } = _decorator;

/**
 * UI基础类
 * 所有UI组件都应该继承此类
 */
@ccclass('UiBase')
export class UiBase extends Component {

    /** 是否已初始化 */
    private initialized: boolean = false;

    /** UI组件默认事件监听器 */
    private static uiEvent: EventDispatcher = null;

    /** 页面管理 */
    protected get pageManager(): PageManager {
        return PageManager.Instance;
    }

    constructor() {
        super();
    }

    protected onLoad(): void {
        this.initialize();
    }

    /**
     * 组件启用时调用
     */
    protected onEnable(): void {
        
    }

    /**
     * 组件禁用时调用
     */
    protected onDisable(): void {
        
    }

    /**
     * 组件销毁时调用, 子类重写时需要调用super.onDestroy()
     */
    protected onDestroy(): void {
        // 清理所有事件监听
        this.removeGlobalEvents();
        UiBase.uiEvent && this.removeUiEvents();
    }

    /**
     * 初始化组件，如果需要在onLoad之前提前注入数据，可直接调用此方法
     */
    public initialize(): void {
        if (this.initialized) return;
        this.initialized = true;
        this.onInit();
    } 

    /**
     * 子类重写此函数用于初始化逻辑
     */
    protected onInit(): void {
        
    }

    /**
     * 添加全局事件监听
     * @param name 事件名称
     * @param callback 回调函数
     * @param target 回调目标
     */
    protected onGlobalEvent(name: string, callback: Function, target: any = this): void {
        EventManager.global.on(name, callback, target);
    }

    /**
     * 移除全局事件监听
     * @param name 事件名称
     * @param callback 回调函数
     * @param target 回调目标
     */
    protected offGlobalEvent(name: string, callback: Function, target: any = this): void {
        EventManager.global.off(name, callback, target);
    }

    /**
     * 移除节点监听的全局事件
     */
    protected removeGlobalEvents(): void {
        EventManager.global.removeByTarget(this);
    }

    /**
     * 设置UI组件默认事件监听器
     * @param name 
     */
    protected static initUiEvnet(name: string = 'ui') {
        UiBase.uiEvent = EventManager.register(name);
    }

    /**
     * UI事件派发
     * @param name 事件名称
     * @param args 
     */
    public static emitUiEvent(name: string, ...args: any[]) {
        if (!UiBase.uiEvent) {
            this.initUiEvnet();
        }
        UiBase.uiEvent.emit(name, ...args);
    }
    
    /**
     * UI事件监听
     * @param name 
     * @param callback 
     * @param target 
     * @returns 
     */
    protected onUiEvent(name: string, callback: Function, target: any = this): void {
        if (!UiBase.uiEvent) {
            UiBase.initUiEvnet();
        }
        UiBase.uiEvent.on(name, callback, target);
    }

    /**
     * 移除UI事件监听
     * @param name 
     * @param callback 
     * @param target 
     * @returns 
     */
    protected offUiEvent(name: string, callback: Function, target: any = this): void {
        if (!UiBase.uiEvent) {
            error('UI组件默认事件监听器未设置');
            return;
        }
        UiBase.uiEvent.off(name, callback, target);
    }

    /**
     * 移除节点监听的Ui事件
     */
    protected removeUiEvents(): void {
        if (!UiBase.uiEvent) {
            error('UI组件默认事件监听器未设置');
            return;
        }
        UiBase.uiEvent.removeByTarget(this);
    }

    /**
     * 从页面管理器上移除，注意：需要是通过PageManager添加的UI
     */
    protected removeFromPageManager(): void {
        this.pageManager.removeUI(this.node);
    }

    /**
     * 根据UUID查找节点
     * @param uuid 节点UUID
     */
    public findNodeByUuid(uuid: string): Node {
        // 递归查找节点
        const findNode = (node: Node): Node => {
            if (node.uuid === uuid) return node;
            for (let i = 0; i < node.children.length; i++) {
                const found = findNode(node.children[i]);
                if (found) return found;
            }
            return null;
        };
        return findNode(this.node);
    }

}


