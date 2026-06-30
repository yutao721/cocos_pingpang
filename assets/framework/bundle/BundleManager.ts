import { assetManager, Asset, AudioClip, error } from 'cc';

/**
 * 资源包管理器：用于加载资源包中的资源
 * 默认资源包为 resources
 */
export class BundleManager {

    private static defaultBundle: string = 'resources';

    /**
     * 设置默认bundle
     * @param name 
     */
    public static setDefaultBundle(name: string) {
        this.defaultBundle = name;
    }

    /**
     * 获取bundle
     * @param name 
     * @returns 
     */
    public static getBundle(name?: string) {
        const bundleName = name || this.defaultBundle;
        const bundle = assetManager.getBundle(bundleName);
        if (!bundle) {
            error(`[BundleManager] 找不到 Bundle: ${bundleName}`);
            return null;
        }
        return bundle;
    }

    /**
     * 加载资源（回调版）
     * @param path 
     * @param type 
     * @param onComplete 
     * @param bundleName 
     * @returns 
     */
    public static load<T extends Asset>(
        path: string,
        type: new (...args: any[]) => T,
        onComplete: (err: Error | null, asset: T | null) => void,
        bundleName?: string
    ) {
        const bundle = this.getBundle(bundleName);
        if (!bundle) {
            onComplete(new Error(`Bundle not found: ${bundleName || this.defaultBundle}`), null);
            return;
        }
        bundle.load(path, type, onComplete);
    }

    /**
     * 加载资源（Promise 版）
     * @param path 
     * @param type 
     * @param bundleName 
     * @returns 
     */
    public static loadAsync<T extends Asset>(
        path: string,
        type: new (...args: any[]) => T,
        bundleName?: string
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            this.load(path, type, (err, asset) => {
                if (err || !asset) {
                    reject(err);
                } else {
                    resolve(asset);
                }
            }, bundleName);
        });
    }

    /**
     * 按目录加载同类型资源（回调版）
     * @param path 目录路径（相对 bundle 根目录）
     * @param type 资源类型
     * @param onComplete 完成回调
     * @param bundleName bundle 名称
     * @param onProgress 进度回调（可选）
     */
    public static loadDir<T extends Asset>(
        path: string,
        type: new (...args: any[]) => T,
        onComplete: (err: Error | null, assets: T[] | null) => void,
        bundleName?: string,
        onProgress?: (finished: number, total: number, item: any) => void,
    ) {
        const bundle = this.getBundle(bundleName);
        if (!bundle) {
            onComplete(new Error(`Bundle not found: ${bundleName || this.defaultBundle}`), null);
            return;
        }

        if (onProgress) {
            bundle.loadDir(path, type, onProgress, onComplete);
        } else {
            bundle.loadDir(path, type, onComplete);
        }
    }

    /**
     * 按目录加载同类型资源（Promise 版）
     * @param path 目录路径（相对 bundle 根目录）
     * @param type 资源类型
     * @param bundleName bundle 名称
     * @param onProgress 进度回调（可选）
     */
    public static loadDirAsync<T extends Asset>(
        path: string,
        type: new (...args: any[]) => T,
        bundleName?: string,
        onProgress?: (finished: number, total: number, item: any) => void,
    ): Promise<T[]> {
        return new Promise((resolve, reject) => {
            this.loadDir(path, type, (err, assets) => {
                if (err || !assets) {
                    reject(err);
                } else {
                    resolve(assets);
                }
            }, bundleName, onProgress);
        });
    }

}
