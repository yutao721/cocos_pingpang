
interface listener {
    cb: Function,
    target: any,
    once?: boolean
}

type evName = number | string;

export default class EventDispatcher {

    private events: Record<evName, listener[]> = null;

    // 特定锁计数
    private locks: Record<evName, number> = {};
    // 特定锁消息队列
    private queues: Record<evName, any[][]> = {};
    // 全局锁计数
    private globalLockCount: number = 0;
    // 全局锁消息队列
    private globalQueue: { name: evName; args: any[] }[] = [];

    constructor() {
        this.events = {};
        this.queues = {};
        this.locks = {};
        this.globalQueue = [];
    }

    public register(name: evName) {
        if(!this.events[name]) {
            this.events[name] = [];
        }
    }

    public on(name: evName, listener: Function, target: any) {
        if(!this.events[name]) {
            this.events[name] = [];
        }
        this.events[name].push({cb: listener, target: target});
    }

    public off(name: evName, listener: Function, target: any) {
        if(!this.events[name]) {
            return;
        }
        for(let index = 0;index < this.events[name].length;++index) {
            if(this.events[name][index].cb == listener) {
                this.events[name].splice(index, 1);
                break;
            }
        }
    }

    /**
     * 单次触发
     * @param name 
     * @param listener 
     * @param target 
     */
    public once(name: evName, listener: Function, target: any) {
        if(!this.events[name]) {
            this.events[name] = [];
        }
        this.events[name].push({cb: listener, target: target, once: true});
    }

    /**
     * 通过事件名批量移除
     * @param name 
     */
    public removeByName(name: evName) {
        if(this.events[name]) {
            this.events[name].length = 0;
            delete this.events[name];
        }
        // 清理该事件相关的锁和队列，避免内存泄漏
        delete this.locks[name];
        delete this.queues[name];
    }

    /**
     * 通过target批量移除
     * @param target 
     */
    public removeByTarget(target: any) {
        for (let key in this.events) {
            if (typeof this.events[key] === 'object') {
                this.events[key] = this.events[key].filter(listener => {
                    return listener.target != target;
                });
            }
        }
    }

    public clear() {
        this.events = {};
        this.queues = {};
        this.locks = {};
        this.globalQueue = [];
        this.globalLockCount = 0;
    }

    /**
     * 锁定特定消息
     * @param name 事件名
     */
    public lock(name: evName) {
        this.locks[name] = (this.locks[name] || 0) + 1;
    }

    /**
     * 解锁特定消息
     * @param name 事件名
     */
    public unlock(name: evName) {
        if (!this.locks[name] || this.locks[name] <= 0) return;
        
        this.locks[name]--;
        if (this.locks[name] > 0) return;

        const queue = this.queues[name];
        if (queue && queue.length > 0) {
            while (queue.length > 0) {
                if (this.locks[name] > 0) break;

                const args = queue.shift();
                this.emit(name, ...args);
            }
            // 清空后删除队列，避免内存占用
            if (queue.length === 0) {
                delete this.queues[name];
            }
        }
    }

    /**
     * 锁定全局所有消息
     */
    public lockAll() {
        this.globalLockCount++;
    }

    /**
     * 解锁全局所有消息
     */
    public unlockAll() {
        if (this.globalLockCount <= 0) return;
        
        this.globalLockCount--;
        if (this.globalLockCount > 0) return;

        while (this.globalQueue.length > 0) {
            if (this.globalLockCount > 0) break;

            const info = this.globalQueue.shift();
            this.emit(info.name, ...info.args); 
        }
    }

    /**
     * 查询特定消息是否被锁定
     * (如果全局被锁定，或者该特定消息被锁定，都返回 true)
     * @param name 事件名
     * @returns 是否被锁定
     */
    public isLocked(name: evName): boolean {
        return this.globalLockCount > 0 || (this.locks[name] || 0) > 0;
    }

    /**
     * 查询全局是否被锁定
     * @returns 是否全局锁定
     */
    public isAllLocked(): boolean {
        return this.globalLockCount > 0;
    }

    /**
     * 触发事件
     * @param name 事件名
     * @param args 参数
     * @returns 
     */
    public emit(name: evName, ...args: any[]) {
        if (this.globalLockCount > 0) {
            this.globalQueue.push({ name: name, args: args });
            return;
        }

        if (this.locks[name] > 0) {
            if (!this.queues[name]) {
                this.queues[name] = [];
            }
            this.queues[name].push(args);
            return;
        }

        if(this.events[name]) {
            this.events[name] = this.events[name].filter(listener => {
                listener.cb && listener.target && listener.cb.call(listener.target, ...args);
                return listener.once != true;
            });
        }
    }
    
}