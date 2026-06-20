import { assetManager, JsonAsset, Node, Size, Sprite, SpriteFrame, screen, ResolutionPolicy, view } from 'cc';
import { AnimationPlayer } from '../ui/AnimationPlayer';

/**
 * 播放帧动画
 * @param sprite 要播放的 Sprite 节点
 * @param frames 帧数组（外部传入）
 * @param frameRate 帧率 (默认 12)
 * @param loop 是否循环 (默认 true)
 * @param onComplete 播放完成回调（仅非循环时生效）
 * @returns 控制器对象 { play, pause, stop }
 */
export function playFrameAnimation(
    sprite: Sprite,
    frames: SpriteFrame[],
    frameRate: number = 12,
    loop: boolean = true,
    onComplete?: () => void
) {
    const anim = sprite.node.addComponent(AnimationPlayer);
    anim.initFrame(sprite, frames, frameRate, onComplete);
    anim.play(loop);

    return {
        play: () => anim.play(loop),
        pause: () => anim.pause(),
        stop: () => anim.stop(),
    };
}

/**
 * 导入JSON
 * @param pathOrUrl 本地路径（对应的 bundle 下）
 * @param bundleName 资源包名（默认 resources）
 * @returns Promise<any> JSON 对象
 */
export function loadJson(pathOrUrl: string, bundleName?: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const bundleToLoad = bundleName || "resources";
        assetManager.loadBundle(bundleToLoad, (err, bundle) => {
            if (err) {
                reject(err);
                return;
            }
            bundle.load(pathOrUrl, JsonAsset, (err, asset) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(asset.json);
            });
        });
    });
}

/**
 * 从远端导入JSON
 * @param url 远端 URL
 * @returns 
 */
export function loadJsonRemote(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
        // 远端 JSON
        assetManager.loadRemote<JsonAsset>(url, { ext: ".json" }, (err, jsonAsset) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(jsonAsset.json);
        });
    });
}

/**
 * 从数组中随机返回一个元素，不修改原数组
 * @param arr 输入数组
 */
export function getRandomElement<T>(arr: T[]): T | undefined {
    if (arr.length === 0) return undefined; // 空数组处理
    const index = Math.floor(Math.random() * arr.length);
    return arr[index];
}

/**
 * 原地打乱数组（会修改原数组）
 * @param arr 要打乱的数组
 * @returns 打乱后的同一个数组引用
 */
export function shuffleInPlace<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * 递归节点树，查找指定名称的子节点（找到第一个则返回）
 * @param node 
 * @param name 
 * @returns 
 */
export function findChildRecursive(node: Node, name: string): Node | null {
    if (node.name === name) return node;

    for (const child of node.children) {
        const found = this.findChildRecursive(child, name);
        if (found) return found;
    }
    return null;
}

/**
 * 复制文本到剪贴板
 * @param text 文本
 */
export function copyToClipboard(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.select();
            
            document.execCommand('copy');
            document.body.removeChild(textArea);
            resolve();
        } catch (err) {
            console.error('复制失败:', err);
            reject(err);
        }
    });
}

/**
 * 获取URL参数
 * @param name 参数名
 * @returns 参数值，如果不存在则返回null
 */
export function getUrlParam(name: string): string | null {
    const url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * 获取所有URL参数
 * @returns 参数对象
 */
export function getAllUrlParams(): Record<string, string> {
    const params: Record<string, string> = {};
    const queryString = window.location.search.substring(1);
    const pairs = queryString.split('&');
    
    for (const pair of pairs) {
        if (pair === '') continue;
        const [key, value = ''] = pair.split('=');
        params[decodeURIComponent(key)] = decodeURIComponent(value);
    }
    
    return params;
}

/**
 * 是否在微信中打开 
 */
export function isWeiXin() {
    return navigator.userAgent.toLowerCase().indexOf('micromessenger') !== -1;
}

/**
 * 加载微信JS SDK
 * @returns 
 */
export function loadWxScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (window['wx']) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load WeChat JSSDK'));
        document.head.appendChild(script);
    });
}

/**
 * 设置web PC端游戏容器窗口大小
 * @param width 
 * @param height 
 * @param resolutionPolicy 可选的分辨率适配方案: 默认按宽度适配(竖屏)
 */
export function setPcWindowSize(width: number, height: number, resolutionPolicy?: ResolutionPolicy) {
    let isMobile = /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent);
    if (isMobile) {
        return;
    }
    const policy = resolutionPolicy || new ResolutionPolicy(ResolutionPolicy.ContainerStrategy.PROPORTION_TO_FRAME, ResolutionPolicy.ContentStrategy.FIXED_WIDTH);
    view.setResolutionPolicy(policy);
    screen.windowSize = new Size(width, height);
}