import { _decorator, sys, log, warn, error } from 'cc';

/**
 * 日志等级
 */
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    NONE = 4
}

/**
 * 日志管理器
 * 1. 支持分级日志
 * 2. 支持日志开关
 * 3. 支持带Tag的日志
 * 4. 支持时间戳
 */
export class Logger {
    /** 当前日志等级 */
    private static level: LogLevel = LogLevel.DEBUG;
    
    /** 是否开启日志 */
    private static isEnabled: boolean = true;

    /**
     * 初始化日志配置
     * @param level 日志等级
     * @param enabled 是否开启
     */
    public static init(level: LogLevel = LogLevel.DEBUG, enabled: boolean = true) {
        this.level = level;
        this.isEnabled = enabled;
    }

    public static get enabled() {
        return this.isEnabled;
    }

    /**
     * 打印调试日志
     * @param tag 标签
     * @param args 参数
     */
    public static debug(tag: string, ...args: any[]) {
        if (!this.isEnabled || this.level > LogLevel.DEBUG) return;
        log(this.getDateString(), `[DEBUG] [${tag}]`, ...args);
    }

    /**
     * 打印信息日志
     * @param tag 标签
     * @param args 参数
     */
    public static info(tag: string, ...args: any[]) {
        if (!this.isEnabled || this.level > LogLevel.INFO) return;
        log(this.getDateString(), `[INFO] [${tag}]`, ...args);
    }

    /**
     * 打印警告日志
     * @param tag 标签
     * @param args 参数
     */
    public static warn(tag: string, ...args: any[]) {
        if (!this.isEnabled || this.level > LogLevel.WARN) return;
        warn(this.getDateString(), `[WARN] [${tag}]`, ...args);
    }

    /**
     * 打印错误日志
     * @param tag 标签
     * @param args 参数
     */
    public static error(tag: string, ...args: any[]) {
        if (!this.isEnabled || this.level > LogLevel.ERROR) return;
        error(this.getDateString(), `[ERROR] [${tag}]`, ...args);
    }

    /**
     * 打印任意对象结构
     * @param tag 标签
     * @param object 对象
     */
    public static dump(tag: string, object: any) {
        if (!this.isEnabled || this.level > LogLevel.DEBUG) return;
        log(this.getDateString(), `[DUMP] [${tag}]`, JSON.stringify(object, null, 2));
    }

    private static getDateString(): string {
        const d = new Date();
        const pad = (n: number, len: number = 2) => {
            let str = n.toString();
            while (str.length < len) str = '0' + str;
            return str;
        };
        const str = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
        return `[${str}]`;
    }
}
