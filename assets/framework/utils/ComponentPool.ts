import { Component } from "cc";

export class ComponentPool<T extends Component> {
    // 对象池
    private pool: T[] = [];
    // 创建对象的方法
    private createFunc: () => T;
    // 初始化对象的方法
    private initFunc?: (obj: T) => void;
    // 回收对象的方法
    private unuseFunc?: (obj: T) => void;

    constructor(
        createFunc: () => T,
        initFunc?: (obj: T) => void,
        unuseFunc?: (obj: T) => void
    ) {
        this.createFunc = createFunc;
        this.initFunc = initFunc;
        this.unuseFunc = unuseFunc;
    }

    public get(): T {
        let obj: T;
        if (this.pool.length > 0) {
            obj = this.pool.pop()!;
        } else {
            obj = this.createFunc();
        }
        this.initFunc?.(obj);
        return obj;
    }

    public put(obj: T) {
        this.unuseFunc?.(obj);
        obj.node.removeFromParent();
        this.pool.push(obj);
    }

    public clear() {
        while (this.pool.length) {
            const obj = this.pool.pop();
            if (obj?.node) obj.node.destroy();
        }
    }
}
