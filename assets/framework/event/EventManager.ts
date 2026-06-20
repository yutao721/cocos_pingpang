import EventDispatcher from "./EventDispatcher";

/**
 * 事件管理器
 * - 默认有一个全局广播器 global
 * - 允许外部自定义并注册多个 dispatcher
 */
export class EventManager {
    /** 
     * 所有 dispatcher 
    */
    private static dispatchers: Map<string, EventDispatcher> = new Map<string, EventDispatcher>([
        ["global", new EventDispatcher()] // 初始化全局 dispatcher
    ]);

    /**
     * 获取全局 dispatcher
     */
    public static get global(): EventDispatcher {
        return this.dispatchers.get("global")!;
    }

    /**
     * 按名称获取 dispatcher，不存在则返回 null
     * @param name 
     * @returns 
     */
    public static getDispatcher(name: string): EventDispatcher | null {
        return this.dispatchers.get(name) || null;
    }

    /**
     * 注册一个新的 dispatcher，如果已存在返回已有的
     * @param name 
     * @returns 
     */
    public static register(name: string): EventDispatcher {
        if (!this.dispatchers.has(name)) {
            this.dispatchers.set(name, new EventDispatcher());
        }
        return this.dispatchers.get(name)!;
    }

    /**
     * 移除某个 dispatcher（global 不可删除）
     * @param name 
     * @returns 
     */
    public static remove(name: string) {
        if (name === "global") {
            console.warn("global dispatcher cannot be removed");
            return;
        }
        const d = this.dispatchers.get(name);
        if (d) {
            d.clear();
            this.dispatchers.delete(name);
        }
    }

    /**
     * 清空所有 dispatcher（慎用，会保留 global）
     */
    public static clearAll() {
        this.dispatchers.forEach((d, key) => {
            if (key !== "global") d.clear();
        });
    }
}
