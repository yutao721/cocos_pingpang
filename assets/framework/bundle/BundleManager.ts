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

}
