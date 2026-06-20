 
interface IQueue<E> {
    getSize(): number;
    isEmpty(): boolean;
    enqueue(e: E): void;
    dequeue(): E;
    getFront(): E;
    clear(): void;
}

/**
 * 队列
 */
export class Queue<E> implements IQueue<E> {
    private array: Array<E>;
    constructor() {
        this.array = new Array<E>();
    }

    /**
     * 获取元素个数
     * @returns 
     */
    getSize(): number {
        return this.array.length;
    }

    /**
     * 判断队列是否为空
     * @returns 
     */
    isEmpty(): boolean {
        return this.array.length == 0;
    }

    /**
     * 添加元素
     * @param e 
     */
    enqueue(e: E): void {
        this.array.push(e);
    }

    /**
     * 出队一个元素
     * @returns 
     */
    dequeue(): E {
        return this.array.splice(0, 1)[0];
    }

    /**
     * 获取当前队首的元素
     * @returns 
     */
    getFront(): E {
        return this.array[0];
    }

    /**
     * 清空队列
     */
    clear(): void {
        this.array.length = 0;
    }
    
}
