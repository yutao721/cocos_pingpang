import { _decorator, Label, Node, Prefab, instantiate, Sprite, SpriteFrame, Vec3, tween } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';
import { pingPangControl } from '../control/PingPangControl';
import { PingPangEvent } from '../const/EventDefine';
import { eDifficultyPhase } from '../const/GameConst';
import { IPingPangResult, IShoeFlower } from '../const/Interface';
import { UILayer } from '../../framework/ui/PageManager';
import { UI_PATH } from '../const/UiConfig';
import { PingPangResultPopup } from './PingPangResultPopup';
const { ccclass, property } = _decorator;

/**
 * 颠球游戏 View 层
 *
 * 节点结构（在 Prefab 中搭建）：
 *   PingPangPage
 *   ├─ BallNode               球（Sprite，由代码移动位置）
 *   ├─ PaddleNode             球拍（Sprite，由代码移动位置）
 *   ├─ ShoeFlowerLayer        鞋花容器节点
 *   ├─ shoeFlowerPfb          鞋花 Prefab（@property 拖入）
 *   ├─ ScoreLabel             分数
 *   ├─ ComboLabel             连颠次数（不颠时隐藏）
 *   ├─ TimerLabel             倒计时（无限时模式可隐藏）
 *   ├─ DifficultyHintLabel    难度提示文字（相位切换时播放动画）
 *   └─ ComboBuffHintLabel     连颠 Buff 飘字（触发时播放动画）
 *
 * 输入说明：
 *   长按屏幕左半区  → dir = -1（球拍向左）
 *   长按屏幕右半区  → dir = +1（球拍向右）
 *   松开           → dir =  0（停止）
 *   球拍移动边界 clamp 根据实际场景宽度在 start() 里初始化
 */
@ccclass('PingPangPage')
export class PingPangPage extends UiBase {

    // ----------------------------------------------------------------
    // 节点绑定（在 Cocos 编辑器中拖入）
    // ----------------------------------------------------------------

    @property(Node)
    ballNode: Node = null;

    @property(Node)
    paddleNode: Node = null;

    @property(Node)
    shoeFlowerLayer: Node = null;

    /** 鞋花 Prefab，节点上需挂 Sprite 组件，普通/限量款通过 spriteFrame 区分 */
    @property(Prefab)
    shoeFlowerPfb: Prefab = null;

    @property(Label)
    scoreLabel: Label = null;

    @property(Label)
    comboLabel: Label = null;

    @property(Label)
    timerLabel: Label = null;

    /** 难度提示（"球速加快了！" / "鞋花加速了！"） */
    @property(Label)
    difficultyHintLabel: Label = null;

    /** 连颠 Buff 飘字（"+30" 之类） */
    @property(Label)
    comboBuffHintLabel: Label = null;

    /** 普通鞋花 SpriteFrame，在编辑器中拖入 */
    @property(SpriteFrame)
    normalShoeFlowerSF: SpriteFrame = null;

    /** 限量款鞋花 SpriteFrame，在编辑器中拖入 */
    @property(SpriteFrame)
    limitedShoeFlowerSF: SpriteFrame = null;

    // ----------------------------------------------------------------
    // 内部状态
    // ----------------------------------------------------------------

    /** uid → Node 的映射，用于按 uid 更新/销毁鞋花节点 */
    private shoeFlowerNodes: Map<number, Node> = new Map();

    /** 当前长按方向：-1 左 / 0 停止 / 1 右 */
    private touchDir: number = 0;

    /** 球拍可移动的 X 边界，根据场景宽度在 start() 里设置 */
    private paddleClamp: [number, number] = [-280, 280];

    // ----------------------------------------------------------------
    // 生命周期
    // ----------------------------------------------------------------

    protected onLoad(): void {
        // 注册所有 PingPang 事件
        this.onUiEvent(PingPangEvent.gameStart,              this.onGameStart);
        this.onUiEvent(PingPangEvent.gameOver,               this.onGameOver);
        this.onUiEvent(PingPangEvent.ballUpdate,             this.onBallUpdate);
        this.onUiEvent(PingPangEvent.ballHitPaddle,          this.onBallHitPaddle);
        this.onUiEvent(PingPangEvent.ballFall,               this.onBallFall);
        this.onUiEvent(PingPangEvent.paddleMove,             this.onPaddleMove);
        this.onUiEvent(PingPangEvent.scoreUpdate,            this.onScoreUpdate);
        this.onUiEvent(PingPangEvent.comboUpdate,            this.onComboUpdate);
        this.onUiEvent(PingPangEvent.comboBuff,              this.onComboBuff);
        this.onUiEvent(PingPangEvent.timeUpdate,             this.onTimeUpdate);
        this.onUiEvent(PingPangEvent.shoeFlowerSpawn,        this.onShoeFlowerSpawn);
        this.onUiEvent(PingPangEvent.shoeFlowerUpdate,       this.onShoeFlowerUpdate);
        this.onUiEvent(PingPangEvent.shoeFlowerHit,          this.onShoeFlowerHit);
        this.onUiEvent(PingPangEvent.shoeFlowerMiss,         this.onShoeFlowerMiss);
        this.onUiEvent(PingPangEvent.difficultyPhaseChange,  this.onDifficultyPhaseChange);

        // 长按输入：触摸落点在屏幕左/右半区决定方向
        this.node.on(Node.EventType.TOUCH_START,  this.onTouchStart,  this);
        this.node.on(Node.EventType.TOUCH_END,    this.onTouchEnd,    this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd,    this);

        // 初始隐藏提示文字
        if (this.difficultyHintLabel)  this.difficultyHintLabel.node.active  = false;
        if (this.comboBuffHintLabel)   this.comboBuffHintLabel.node.active   = false;
        if (this.comboLabel)           this.comboLabel.node.active           = false;
    }

    protected start(): void {
        pingPangControl.startGame();
    }

    protected update(dt: number): void {
        pingPangControl.update(dt);

        // 每帧传入长按方向驱动球拍移动
        if (this.touchDir !== 0) {
            pingPangControl.movePaddle(this.touchDir, dt, this.paddleClamp);
        }
    }

    // ----------------------------------------------------------------
    // 触摸输入
    // ----------------------------------------------------------------

    private onTouchStart(e: any): void {
        // 触摸点 X > 0 向右，< 0 向左（Cocos 坐标系）
        const localX = e.getUILocation().x - this.node.getComponent('UITransform')?.width / 2 ?? 0;
        this.touchDir = localX >= 0 ? 1 : -1;
    }

    private onTouchEnd(): void {
        this.touchDir = 0;
    }

    // ----------------------------------------------------------------
    // 游戏流程事件
    // ----------------------------------------------------------------

    private onGameStart(): void {
        // 重置分数/连颠/时间显示
        if (this.scoreLabel)  this.scoreLabel.string = '0分';
        if (this.comboLabel)  this.comboLabel.node.active = false;
        if (this.timerLabel)  this.timerLabel.string = '';

        // 清空残留鞋花节点
        this.shoeFlowerNodes.forEach(node => node.destroy());
        this.shoeFlowerNodes.clear();

        // 将球/球拍初始化到对应位置
        if (this.ballNode)   this.ballNode.setPosition(0, 200, 0);
        if (this.paddleNode) this.paddleNode.setPosition(pingPangControl.getPaddleX(), this.paddleNode.position.y, 0);
    }

    private onGameOver(result: IPingPangResult): void {
        this.pageManager.showUI(UI_PATH.PINGPANG_RESULT, UILayer.TOP, (node: Node) => {
            node.getComponent(PingPangResultPopup)?.show(result);
        });
    }

    // ----------------------------------------------------------------
    // 球事件
    // ----------------------------------------------------------------

    private onBallUpdate(x: number, y: number, _vx: number, _vy: number): void {
        this.ballNode?.setPosition(x, y, 0);
    }

    private onBallHitPaddle(): void {
        // TODO: 播放击球音效 / 球拍抖动特效
    }

    private onBallFall(): void {
        // TODO: 播放落地音效
    }

    // ----------------------------------------------------------------
    // 球拍事件
    // ----------------------------------------------------------------

    private onPaddleMove(x: number): void {
        this.paddleNode?.setPosition(x, this.paddleNode.position.y, 0);
    }

    // ----------------------------------------------------------------
    // 得分 / 连颠事件
    // ----------------------------------------------------------------

    private onScoreUpdate(score: number, _delta: number): void {
        if (this.scoreLabel) this.scoreLabel.string = `${score}分`;
    }

    private onComboUpdate(combo: number): void {
        if (!this.comboLabel) return;
        if (combo <= 1) {
            this.comboLabel.node.active = false;
        } else {
            this.comboLabel.node.active = true;
            this.comboLabel.string = `x${combo}`;
        }
    }

    /**
     * 连颠 Buff 触发，播放飘字动画
     */
    private onComboBuff(bonus: number, desc: string): void {
        if (!this.comboBuffHintLabel) return;
        const label = this.comboBuffHintLabel;
        label.string = desc;
        label.node.active = true;
        label.node.setPosition(0, 0, 0);
        label.node.setScale(1, 1, 1);

        tween(label.node)
            .to(0.3, { scale: new Vec3(1.3, 1.3, 1) })
            .to(0.5, { position: new Vec3(0, 80, 0) })
            .call(() => { label.node.active = false; })
            .start();
    }

    // ----------------------------------------------------------------
    // 计时事件
    // ----------------------------------------------------------------

    private onTimeUpdate(remainTime: number): void {
        if (this.timerLabel) {
            this.timerLabel.string = `${Math.ceil(remainTime)}s`;
        }
    }

    // ----------------------------------------------------------------
    // 鞋花事件
    // ----------------------------------------------------------------

    private onShoeFlowerSpawn(flower: IShoeFlower): void {
        if (!this.shoeFlowerPfb || !this.shoeFlowerLayer) return;

        const node = instantiate(this.shoeFlowerPfb);
        node.parent = this.shoeFlowerLayer;
        node.setPosition(flower.x, flower.y, 0);

        // 根据类型切换 SpriteFrame（在编辑器拖入资源后生效）
        const sprite = node.getComponent(Sprite);
        if (sprite) {
            const sf = flower.type === 2 ? this.limitedShoeFlowerSF : this.normalShoeFlowerSF;
            sprite.spriteFrame = sf;
        }

        this.shoeFlowerNodes.set(flower.uid, node);
    }

    private onShoeFlowerUpdate(uid: number, y: number): void {
        const node = this.shoeFlowerNodes.get(uid);
        if (node) node.setPosition(node.position.x, y, 0);
    }

    private onShoeFlowerHit(uid: number, _score: number): void {
        this._removeShoeFlowerNode(uid);
        // TODO: 播放消除特效/音效
    }

    private onShoeFlowerMiss(uid: number): void {
        this._removeShoeFlowerNode(uid);
    }

    private _removeShoeFlowerNode(uid: number): void {
        const node = this.shoeFlowerNodes.get(uid);
        if (node) {
            node.destroy();
            this.shoeFlowerNodes.delete(uid);
        }
    }

    // ----------------------------------------------------------------
    // 难度提升事件
    // ----------------------------------------------------------------

    private onDifficultyPhaseChange(phase: eDifficultyPhase, hintText: string): void {
        if (!this.difficultyHintLabel) return;

        const label = this.difficultyHintLabel;
        label.string = hintText;
        label.node.active = true;
        label.node.setPosition(0, 0, 0);
        label.node.setScale(1, 1, 1);

        // 出现 → 放大 → 停留 → 上移淡出
        tween(label.node)
            .to(0.2, { scale: new Vec3(1.2, 1.2, 1) })
            .to(0.1, { scale: new Vec3(1.0, 1.0, 1) })
            .delay(1.2)
            .to(0.4, { position: new Vec3(0, 60, 0) })
            .call(() => { label.node.active = false; })
            .start();
    }
}
