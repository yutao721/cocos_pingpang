// AnimationPlayer.ts
import { _decorator, Sprite, SpriteFrame, sp, Enum } from 'cc';
import { UiBase } from './UiBase';
const { ccclass, property } = _decorator;

export enum AnimationType {
    frame, // 帧动画
    spine // Spine动画
};
const eAnimation = Enum(AnimationType);

@ccclass('AnimationPlayer')
export class AnimationPlayer extends UiBase {

    // 动画类型
    @property({type: eAnimation})
    public type = AnimationType.frame;

    // 播放设置参数
    private playing: boolean = false;
    private loop: boolean = true;
    private onComplete?: () => void;

    // Frame 动画相关
    private frames: SpriteFrame[] = [];
    private fps: number = 12;
    private frameIndex: number = 0;
    private frameAcc: number = 0;
    private sprite: Sprite | null = null;

    // Spine 动画相关
    private skeleton: sp.Skeleton | null = null;
    private spineAnimName: string = '';

    /**
     * 初始化为帧动画
     */
    public initFrame(sprite: Sprite, frames: SpriteFrame[], fps: number = 12, onComplete?: () => void) {
        this.type = AnimationType.frame;
        this.sprite = sprite;
        this.frames = frames;
        this.fps = fps;
        this.onComplete = onComplete;
    }

    /**
     * 初始化为 Spine 动画
     */
    public initSpine(skeleton: sp.Skeleton, animName: string, onComplete?: () => void) {
        this.type = AnimationType.spine;
        this.skeleton = skeleton;
        this.spineAnimName = animName;
        this.onComplete = onComplete;
    }

    /**
     * 播放动画
     */
    public play(loop: boolean = true) {
        this.loop = loop;
        this.playing = true;

        if (this.type === AnimationType.frame) {
            if (!this.sprite || this.frames.length === 0) {
                console.warn('AnimationPlayer: frame data missing');
                return;
            }
            this.frameIndex = 0;
            this.frameAcc = 0;
            this.sprite.spriteFrame = this.frames[0];
            this.schedule(this.updateFrame, 0); // 每帧更新
        }
        else if (this.type === AnimationType.spine) {
            if (!this.skeleton || !this.spineAnimName) {
                console.warn('AnimationPlayer: spine data missing');
                return;
            }
            this.skeleton.setAnimation(0, this.spineAnimName, loop);
            if (!loop && this.onComplete) {
                this.skeleton.setCompleteListener(() => {
                    this.onComplete && this.onComplete();
                });
            }
        }
    }

    /**
     * 帧动画的更新逻辑
     */
    private updateFrame(dt: number) {
        if (!this.playing || this.type !== AnimationType.frame) return;

        this.frameAcc += dt;
        const interval = 1 / Math.max(this.fps, 1);

        while (this.frameAcc >= interval) {
            this.frameAcc -= interval;
            this.frameIndex++;
            if (this.frameIndex >= this.frames.length) {
                if (this.loop) {
                    this.frameIndex = 0;
                } 
                else {
                    this.stop();
                    this.onComplete && this.onComplete();
                    return;
                }
            }
            if (this.sprite) {
                this.sprite.spriteFrame = this.frames[this.frameIndex];
            }
        }
    }

    /**
     * 停止动画
     */
    public stop() {
        this.playing = false;

        if (this.type === AnimationType.frame) {
            this.unschedule(this.updateFrame);
        }
        else if (this.type === AnimationType.spine && this.skeleton) {
            this.skeleton.clearTrack(0);
        }
    }

    public pause() {
        this.playing = false;
        if (this.type === AnimationType.spine && this.skeleton) {
            this.skeleton.paused = true;
        }
    }

    public resume() {
        this.playing = true;
        if (this.type === AnimationType.spine && this.skeleton) {
            this.skeleton.paused = false;
        }
    }

    onDestroy() {
        this.stop();
    }
}
