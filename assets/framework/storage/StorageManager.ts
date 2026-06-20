import { sys } from 'cc';
import { Logger } from '../log/Logger';

/**
 * 本地存储管理器
 * 1. 支持KV数据存储
 * 2. 支持对象自动序列化
 * 3. 支持简易加密（XOR）
 * 4. 支持命名空间（UserID隔离）
 */
export class StorageManager {
    private static keyPrefix: string = "";
    private static readonly TAG = 'StorageManager';
    private static encryptionKey: string = 'cocos-framework-key'; // 默认加密解密Key
    private static enableEncryption: boolean = false; // 默认不开启加密

    /**
     * 初始化配置
     * @param prefix Key前缀，通常使用 UserID
     * @param enableEncryption 是否开启加密
     * @param encryptionKey 加密密钥 (可选)，若不传则使用默认密钥
     */
    public static init(prefix: string = "", enableEncryption: boolean = false, encryptionKey: string = "") {
        this.keyPrefix = prefix ? `${prefix}_` : "";
        this.enableEncryption = enableEncryption;
        if (encryptionKey) {
            this.encryptionKey = encryptionKey;
        }
        Logger.info(this.TAG, `Init storage with prefix: ${this.keyPrefix}, encryption: ${this.enableEncryption}`);
    }

    /**
     * 设置存储值
     * @param key 键
     * @param value 值 (支持对象、数字、布尔值、字符串)
     */
    public static set(key: string, value: any) {
        let saveKey = this.keyPrefix + key;
        let saveValue = value;

        try {
            if (typeof value === 'object') {
                saveValue = JSON.stringify(value);
            } else {
                saveValue = String(value);
            }

            if (this.enableEncryption) {
                saveValue = this.encrypt(saveValue);
            }

            sys.localStorage.setItem(saveKey, saveValue);
        } catch (e) {
            Logger.error(this.TAG, `Set item failed: ${key}`, e);
        }
    }

    /**
     * 获取存储值
     * @param key 键
     * @param defaultValue 默认值
     */
    public static get(key: string, defaultValue: any = null): any {
        let saveKey = this.keyPrefix + key;
        let value = sys.localStorage.getItem(saveKey);

        if (value === null || value === undefined || value === "") {
            return defaultValue;
        }

        try {
            if (this.enableEncryption) {
                value = this.decrypt(value);
                if (value === null) return defaultValue; // 解密失败
            }

            // 尝试解析JSON
            try {
                return JSON.parse(value);
            } catch (e) {
                // 如果不是JSON，尝试转换数字或布尔
                if (value === "true") return true;
                if (value === "false") return false;
                if (!isNaN(Number(value)) && value.trim() !== "") return Number(value);
                return value;
            }
        } catch (e) {
            Logger.error(this.TAG, `Get item failed: ${key}`, e);
            return defaultValue;
        }
    }

    /**
     * 移除存储值
     * @param key 键
     */
    public static remove(key: string) {
        let saveKey = this.keyPrefix + key;
        sys.localStorage.removeItem(saveKey);
    }

    /**
     * 清空当前命名空间下的所有数据（慎用/暂未实现完全过滤，sys.localStorage.clear()会清空所有）
     * 建议仅在clear所有数据时使用
     */
    public static clear() {
        sys.localStorage.clear();
        Logger.info(this.TAG, 'Clear all localStorage data');
    }

    // ---------------- 加密部分 (XOR加密) ----------------

    private static encrypt(str: string): string {
        try {
            let result = '';
            for (let i = 0; i < str.length; i++) {
                result += String.fromCharCode(str.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length));
            }
            // 转为Base64避免乱码问题
            return btoa(result);
        } catch (e) {
            Logger.error(this.TAG, 'Encrypt failed', e);
            return str;
        }
    }

    private static decrypt(str: string): string {
        try {
            // Base64解码
            let decoded = atob(str);
            let result = '';
            for (let i = 0; i < decoded.length; i++) {
                result += String.fromCharCode(decoded.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length));
            }
            return result;
        } catch (e) {
            Logger.error(this.TAG, 'Decrypt failed', e);
            return null;
        }
    }
}
