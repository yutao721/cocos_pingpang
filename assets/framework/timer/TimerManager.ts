import { Component, Director, director, game, Game, _decorator, Node } from 'cc';
import { Logger } from '../log/Logger';

/**
 * 定时器数据结构
 */
interface TimerData {
    id: number;
    callback: Function;
    thisArg: any;
    interval: number;       // 间隔时间(秒)
    repeat: number;         // 重复次数 (Infinity 为无限)
    delay: number;          // 延迟时间(秒)
    passedTime: number;     // 已过去的时间
    isFinished: boolean;    // 是否已结束
}

/**
 * 全局定时器管理器
 * 1. 独立于节点，依赖 Director.scheduler
 * 2. 支持全局暂停/恢复 (游戏逻辑暂停)
 * 3. 支持全局时间缩放 (倍速)
 * 4. 更加精准的倒计时封装 (校准)
 */
export class TimerManager {
    private static instance: TimerManager = null;
    private static readonly TAG = 'TimerManager';

    // 内部驱动组件，挂载在常驻节点
    private schedulerComponent: TimerScheduler = null;

    // 定时器列表
    private timers: Map<number, TimerData> = new Map();
    private timerIdCounter: number = 0;

    // 全局控制
    private timeScale: number = 1.0;
    private isPaused: boolean = false;

    // 倒计时校准相关
    private serverTimeDiff: number = 0; // 服务器与本地时间差 (ms)

    public static get Instance(): TimerManager {
        if (!this.instance) {
            this.instance = new TimerManager();
            this.instance.init();
        }
        return this.instance;
    }

    /**
     * 创建一个隐形节点来驱动 update
     * 注意：这里不直接使用 director.getScheduler().schedule，因为需要自己控制 timeScale 和 pause
     * 原生 scheduler 对 timeScale 支持有限，且容易受引擎整体时间缩放影响
     */
    private init() {
        const node = new Node('TimerManager');
        if (director.getScene()) {
            director.getScene().addChild(node);
        } else {
            Logger.warn(TimerManager.TAG, 'Scene not found, TimerManager node might not work correctly until added to scene');
        }
        director.addPersistRootNode(node);
        this.schedulerComponent = node.addComponent(TimerScheduler);
        this.schedulerComponent.init(this);
        Logger.info(TimerManager.TAG, 'TimerManager initialized');
    }

    /**
     * 每一帧的更新逻辑 (由 TimerScheduler 调用)
     * @param dt 原始 delta time
     */
    public update(dt: number) {
        if (this.isPaused) return;

        // 应用时间缩放
        const realDt = dt * this.timeScale;

        // 收集需要清理的定时器ID
        const idsToRemove: number[] = [];

        // 遍历所有定时器
        this.timers.forEach(timer => {
            // 如果已经被标记结束（可能在上一轮或者外部被取消），跳过
            if (timer.isFinished) {
                idsToRemove.push(timer.id);
                return;
            }

            timer.passedTime += realDt;

            // 处理延迟
            if (timer.delay > 0) {
                if (timer.passedTime >= timer.delay) {
                    timer.passedTime -= timer.delay; // 扣除延迟，剩下的加到 interval 累积中
                    timer.delay = 0;
                    this.triggerTimer(timer, idsToRemove);
                }
            } else {
                // 处理间隔
                if (timer.passedTime >= timer.interval) {
                    // 如果 interval 为 0，则只执行一次，且 passedTime 清零，避免死循环或堆积
                    if (timer.interval <= 0) {
                        timer.passedTime = 0;
                        this.triggerTimer(timer, idsToRemove);
                    } else {
                        // 正常间隔，保留余数，处理掉帧追赶逻辑（此处选择不while追赶，而是平滑触发）
                        // 注意：这里只触发一次。如果掉帧严重，passedTime 会持续堆积，导致连续多帧每一帧都触发。
                        timer.passedTime -= timer.interval;
                        this.triggerTimer(timer, idsToRemove);
                    }
                }
            }
        });

        // 统一清理已结束的定时器
        if (idsToRemove.length > 0) {
            idsToRemove.forEach(id => this.unschedule(id));
        }
    }

    private triggerTimer(timer: TimerData, idsToRemove: number[]) {
        if (timer.isFinished) return;

        // 执行回调
        if (timer.callback) {
            try {
                timer.callback.call(timer.thisArg, timer);
            } catch (e) {
                Logger.error(TimerManager.TAG, `Timer callback error: id=${timer.id}`, e);
            }
        }

        // 减少重复次数
        if (timer.repeat !== Infinity) {
            timer.repeat--;
            if (timer.repeat <= 0) {
                timer.isFinished = true;
                idsToRemove.push(timer.id);
            }
        }
    }

    /**
     * 开启一个定时器
     * @param callback 回调函数
     * @param thisArg this指向
     * @param interval 间隔时间 (秒)
     * @param repeat 重复次数 (默认 Infinity, 0代表只执行 1 次)
     * @param delay 延迟时间 (秒)
     * @returns 定时器ID
     */
    public schedule(callback: Function, thisArg: any, interval: number, repeat: number = Infinity, delay: number = 0): number {
        this.timerIdCounter++;
        const id = this.timerIdCounter;
        
        const timer: TimerData = {
            id,
            callback,
            thisArg,
            interval,
            repeat,
            delay,
            passedTime: 0,
            isFinished: false
        };

        this.timers.set(id, timer);
        return id;
    }

    /**
     * 只执行一次的定时器
     * @param callback 
     * @param thisArg 
     * @param delay 延迟时间 (秒)
     */
    public scheduleOnce(callback: Function, thisArg: any, delay: number): number {
        return this.schedule(callback, thisArg, 0, 1, delay);
    }

    /**
     * 取消定时器
     * @param id 定时器ID
     */
    public unschedule(id: number) {
        if (this.timers.has(id)) {
            const timer = this.timers.get(id);
            timer.isFinished = true;
            this.timers.delete(id);
        }
    }

    /**
     * 取消指定对象的所有定时器 (通常在组件销毁时调用)
     * @param target 绑定的对象 (thisArg)
     */
    public unscheduleTarget(target: any) {
        // 由于需要反向查找，性能略低，但比起手动管理ID要方便
        // 如果数据量巨大，可以考虑维护一个 target -> timerId[] 的映射，但增加了内存开销
        this.timers.forEach((timer, id) => {
            if (timer.thisArg === target) {
                this.unschedule(id);
            }
        });
    }

    /**
     * 取消所有定时器
     */
    public unscheduleAll() {
        this.timers.clear();
    }

    // ================= 全局控制 =================

    /**
     * 设置全局时间缩放 (影响所有通过 TimerManager 创建的定时器)
     * @param scale 
     */
    public setTimeScale(scale: number) {
        this.timeScale = scale;
    }

    public getTimeScale() {
        return this.timeScale;
    }

    /**
     * 暂停所有定时器
     */
    public pause() {
        this.isPaused = true;
    }

    /**
     * 恢复所有定时器
     */
    public resume() {
        this.isPaused = false;
    }

    // ================= 倒计时校准 =================

    /**
     * 同步服务器时间
     * @param serverTimestamp 服务器当前时间戳 (ms)
     */
    public syncServerTime(serverTimestamp: number) {
        const localNow = Date.now();
        this.serverTimeDiff = serverTimestamp - localNow;
        Logger.info(TimerManager.TAG, `Time synced. Diff: ${this.serverTimeDiff}ms`);
    }

    /**
     * 获取当前的服务器时间 (ms)
     */
    public getServerTime(): number {
        return Date.now() + this.serverTimeDiff;
    }

    /**
     * 获取倒计时剩余时间 (秒)
     * @param targetTimestamp 目标结束时间戳 (ms)
     * @returns 剩余秒数
     */
    public getCountdown(targetTimestamp: number): number {
        const now = this.getServerTime();
        const diff = Math.max(0, targetTimestamp - now);
        return diff / 1000;
    }
}

/**
 * 驱动组件，接入 Cocos 的 update
 */
@_decorator.ccclass('TimerScheduler')
class TimerScheduler extends Component {
    private manager: TimerManager | null = null;

    init(timerManager: TimerManager) {
        this.manager = timerManager;
    }

    update(dt: number) {
        if (this.manager) {
            this.manager.update(dt);
        }
    }
}
