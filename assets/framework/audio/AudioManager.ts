import { _decorator, Node, AudioSource, AudioClip, resources, director, assetManager, error } from 'cc';
import { BundleManager } from '../bundle/BundleManager';
const { ccclass } = _decorator;

export class AudioManager {
    private static instance: AudioManager | null = null;
    private audioSource: AudioSource | null = null;

    public static get Instance(): AudioManager {
        if (!this.instance) {
            this.instance = new AudioManager();
            this.instance.init();
        }
        return this.instance;
    }

    private init() {
        // 创建全局节点
        const node = new Node('globalAudioManager');
        director.getScene().addChild(node);
        // 添加 AudioSource 组件
        this.audioSource = node.addComponent(AudioSource);
        // 常驻，不随场景切换销毁
        director.addPersistRootNode(node);
    }
    
    /**
     * 播放背景音乐
     * @param path 音频路径
     * @param loop 是否循环播放
     * @param volume 音量
     * @param bundleName bundle名称
     * @returns 
     */
    public playBGM(path: string, loop: boolean = true, volume: number = 1, bundleName?: string) {
        if (!this.audioSource) return;
        BundleManager.load(path, AudioClip, (err, clip) => {
            if (err) {
                console.error('加载背景音乐失败:', err);
                return;
            }
            this.audioSource!.clip = clip;
            this.audioSource!.loop = loop;
            this.audioSource!.volume = volume;
            this.audioSource!.play();
        }, bundleName);
    }
    
    /**
     * 停止背景音乐
     */
    public stopBGM() {
        if (this.audioSource && this.audioSource.playing) {
            this.audioSource.stop();
        }
    }

    /**
     * 暂停背景音乐
     */
    public pauseBGM() {
        if (this.audioSource && this.audioSource.playing) {
            this.audioSource.pause();
        }
    }

    /**
     * 恢复背景音乐
     */
    public resumeBGM() {
        if (this.audioSource && !this.audioSource.playing && this.audioSource.clip) {
            this.audioSource.play();
        }
    }

    /**
     * 播放音效
     * @param path 
     * @param volume 
     * @param bundleName 
     * @returns 
     */
    public playSFX(path: string, volume: number = 1, bundleName?: string) {
        if (!this.audioSource) return;
        BundleManager.load(path, AudioClip, (err, clip) => {
            if (err) {
                console.error('加载音效失败:', err);
                return;
            }
            this.audioSource!.playOneShot(clip, volume);
        }, bundleName);
    }
}
