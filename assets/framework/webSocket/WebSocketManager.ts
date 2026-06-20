import { Logger } from '../log/Logger';

/**
 * Socket 状态
 */
export enum SocketState {
    CLOSED = 0,
    CONNECTING = 1,
    CONNECTED = 2,
    CLOSING = 3
}

/**
 * Socket 委托接口
 * 业务层实现此接口来监听 Socket 事件
 */
export interface ISocketDelegate {
    onSocketOpen(): void;
    onSocketMessage(data: any): void;
    onSocketError(err: Event): void;
    onSocketClose(reason: string): void;
    onSocketConnecting?(): void;
    onSocketReconnectFailed?(): void;
}

/**
 * WebSocket 管理器
 * 1. 纯粹的 WebSocket 封装
 * 2. 支持断线重连
 * 3. 移除内置事件系统，通过代理(Delegate)将事件转交业务层处理
 */
export class WebSocketManager {
    private static instance: WebSocketManager;
    private static readonly TAG = 'WebSocketManager';

    private ws: WebSocket | null = null;
    private url: string = '';
    private state: SocketState = SocketState.CLOSED;

    // 代理
    private delegate: ISocketDelegate | null = null;

    // 配置
    public reconnectInterval: number = 3000; // 重连间隔
    public maxReconnectAttempts: number = 5; // 最大重连次数
    public binaryType: BinaryType = 'arraybuffer'; // "blob" | "arraybuffer"
    
    // 状态变数
    private reconnectAttempts: number = 0;
    private manualClose: boolean = false; // 是否手动关闭

    public static get Instance(): WebSocketManager {
        if (!this.instance) {
            this.instance = new WebSocketManager();
        }
        return this.instance;
    }

    /**
     * 设置代理
     * @param delegate 实现 ISocketDelegate 的实例
     */
    public setDelegate(delegate: ISocketDelegate) {
        this.delegate = delegate;
    }

    /**
     * 连接服务器
     * @param url WebSocket 地址
     */
    public connect(url: string) {
        if (this.state === SocketState.CONNECTED || this.state === SocketState.CONNECTING) {
            Logger.warn(WebSocketManager.TAG, 'Socket is already connecting or connected.');
            return;
        }

        this.url = url;
        this.manualClose = false;
        this.connectInternal();
    }

    private connectInternal() {
        this.state = SocketState.CONNECTING;
        this.delegate?.onSocketConnecting?.();

        try {
            Logger.info(WebSocketManager.TAG, `Connecting to: ${this.url}, attempt: ${this.reconnectAttempts}`);
            this.ws = new WebSocket(this.url);
            this.ws.binaryType = this.binaryType;
            this.ws.onopen = this.onOpen.bind(this);
            this.ws.onmessage = this.onMessage.bind(this);
            this.ws.onerror = this.onError.bind(this);
            this.ws.onclose = this.onClose.bind(this);
        } catch (e) {
            Logger.error(WebSocketManager.TAG, 'Create WebSocket failed', e);
            // 构造一个模拟的关闭事件
            this.onClose(new CloseEvent('error', { code: 1006, reason: 'Create WebSocket failed' }));
        }
    }

    /**
     * 发送数据
     * @param data 数据对象 (string | ArrayBuffer | Blob | ArrayBufferView)
     */
    public send(data: string | ArrayBuffer | Blob | ArrayBufferView) {
        if (this.state !== SocketState.CONNECTED || !this.ws) {
            Logger.error(WebSocketManager.TAG, 'Socket not connected, send failed');
            return;
        }

        try {
            this.ws.send(data);
        } catch (e) {
            Logger.error(WebSocketManager.TAG, 'Send error', e);
        }
    }

    /**
     * 关闭连接
     */
    public close() {
        this.manualClose = true;
        this.resetReconnect();
        
        if (this.ws) {
            this.ws.onopen = null;
            this.ws.onmessage = null;
            this.ws.onerror = null;
            this.ws.onclose = null;
            this.ws.close();
            this.ws = null;
        }
        
        if (this.state !== SocketState.CLOSED) {
            this.state = SocketState.CLOSED;
            this.delegate?.onSocketClose('Manual Close');
        }
    }

    // ================= WebSocket 回调 =================

    private onOpen(ev: Event) {
        Logger.info(WebSocketManager.TAG, 'Socket connected');
        this.state = SocketState.CONNECTED;
        this.reconnectAttempts = 0;
        
        this.delegate?.onSocketOpen();
    }

    private onMessage(ev: MessageEvent) {
        this.delegate?.onSocketMessage(ev.data);
    }

    private onError(ev: Event) {
        Logger.error(WebSocketManager.TAG, 'Socket error', ev);
        this.delegate?.onSocketError(ev);
    }

    private onClose(ev: CloseEvent) {
        // ev可能是null
        const code = ev ? ev.code : 0;
        const reason = ev ? ev.reason : 'Unknown';
        Logger.warn(WebSocketManager.TAG, `Socket closed. Code: ${code}, Reason: ${reason}`);
        
        this.state = SocketState.CLOSED;
        this.ws = null;
        this.delegate?.onSocketClose(reason);

        if (!this.manualClose) {
            this.tryReconnect();
        }
    }

    // ================= 重连逻辑 =================

    private tryReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            Logger.error(WebSocketManager.TAG, 'Max reconnect attempts reached. Give up.');
            this.delegate?.onSocketReconnectFailed?.();
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectInterval;

        Logger.info(WebSocketManager.TAG, `Will reconnect in ${delay}ms...`);
        setTimeout(() => {
            if (!this.manualClose) {
                this.connectInternal();
            }
        }, delay);
    }

    private resetReconnect() {
        this.reconnectAttempts = 0;
    }
    
    /**
     * 获取当前连接状态
     */
    public getState(): SocketState {
        return this.state;
    }
}
