import { JsonAsset } from 'cc';
import { BundleManager } from '../bundle/BundleManager';
import { Logger } from '../log/Logger';

/**
 * 配置表管理器
 * 1. 负责加载 JSON 配置表
 * 2. 提供配置数据查询接口
 * 3. 缓存已加载的配置
 */
export class ConfigManager {
    private static instance: ConfigManager;
    private static readonly TAG = 'ConfigManager';
    
    /** 存储配置数据 map<tableName, data> */
    private configs: Map<string, any> = new Map();

    public static get Instance(): ConfigManager {
        if (!this.instance) {
            this.instance = new ConfigManager();
        }
        return this.instance;
    }

    /**
     * 加载配置表
     * @param path 配置表路径 (相对于 bundle 根目录)
     * @param customKey 自定义Key (可选)。若不传则默认取文件名。解决多级目录下同名文件覆盖问题。
     * @param bundleName bundle名称
     * @returns Promise
     */
    public loadConfig(path: string, customKey?: string, bundleName?: string): Promise<void> {
        return new Promise((resolve, reject) => {
            BundleManager.load(path, JsonAsset, (err, asset: JsonAsset) => {
                if (err) {
                    Logger.error(ConfigManager.TAG, `Load config failed: ${path}`, err);
                    reject(err);
                    return;
                }
                
                // 优先使用customKey，否则取文件名作为key
                const tableName = customKey || path.substring(path.lastIndexOf('/') + 1);
                this.configs.set(tableName, asset.json);
                Logger.info(ConfigManager.TAG, `Load config success: ${tableName}`);
                resolve();
            }, bundleName);
        });
    }

    /**
     * 批量加载配置表
     * @param paths 路径数组
     * @param bundleName 资源包名称
     */
    public async loadConfigs(paths: string[], bundleName?: string) {
        const promises = paths.map(path => this.loadConfig(path, undefined, bundleName));
        await Promise.all(promises);
    }

    /**
     * 获取某张表的全部数据
     * @param tableName 表名
     */
    public getAll(tableName: string): any {
        return this.configs.get(tableName);
    }

    /**
     * 获取某张表中指定ID的数据
     * @param tableName 表名
     * @param id 数据ID (配置表是 Array 或 ObjectMap)
     */
    public get(tableName: string, id: string | number): any {
        const config = this.configs.get(tableName);
        if (!config) {
            Logger.warn(ConfigManager.TAG, `Config table not found: ${tableName}`);
            return null;
        }

        // 如果配置是数组，尝试查找 (假设有 id 字段)
        if (Array.isArray(config)) {
            return config.find(item => item.id == id);
        }
        
        // 如果配置是对象 map
        return config[id];
    }

    /**
     * 获取配置表行数
     * @param tableName 
     */
    public getCount(tableName: string): number {
        const config = this.configs.get(tableName);
        if (!config) return 0;
        if (Array.isArray(config)) return config.length;
        return Object.keys(config).length;
    }

    /**
     * 清理所有配置缓存
     */
    public clear() {
        this.configs.clear();
        Logger.info(ConfigManager.TAG, 'Clear all configs');
    }
}
