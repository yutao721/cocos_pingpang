import { UiBase } from '../../framework/ui/UiBase';
import { PingPangEvent } from '../const/EventDefine';
import {
    BallInitSpeed,
    BallRadius,
    BallVYRatio,
    eDifficultyPhase,
    EnablePaddleCheck,
    eShoeFlowerType,
    GameDuration,
    GroundY,
    MaxShoeFlowerOnStage,
    PaddleMoveSpeed,
    PaddleWidth,
    Phase1BallSpeedMul,
    Phase1HintText,
    Phase1ScoreThreshold,
    Phase2DurationThreshold,
    Phase2HintText,
    Phase2ShoeFlowerSpeedMul,
    Phase2SpawnIntervalMul,
    ShoeFlowerFallSpeed,
    ShoeFlowerSpawnInterval,
} from '../const/GameConst';
import { IShoeFlower } from '../const/Interface';
import { PingPangModel } from '../model/PingPangModel';

/**
 * 颠球游戏控制层
 * 持有 PingPangModel，驱动游戏逻辑，通过 UiBase.emitUiEvent 通知 View
 *
 * 使用方式：
 *   PingPangPage 在 start() 里调用 pingPangControl.startGame()
 *   每帧（update）调用 pingPangControl.update(dt)
 *   长按/滑动输入调用 pingPangControl.movePaddle(dir, dt, clamp)
 *
 * 球运动由 Control 内部每帧计算（方案B手动模拟），View 只负责：
 *   监听 ballUpdate 事件更新球节点位置
 *   监听 ballHitPaddle / ballFall 播放特效音效
 *
 * 球拍反弹公式详见 BALL_PHYSICS.md
 *
 * 难度提升事件（View 监听 PingPangEvent.difficultyPhaseChange）：
 *   phase=1  球速加快，球运动已由 Control 内部处理，View 无需额外操作
 *   phase=2  鞋花加速，生成速度/间隔已由 Control 内部处理，View 无需额外操作
 */
export class PingPangControl {

    private static _instance: PingPangControl;
    public static get Instance(): PingPangControl {
        if (!this._instance) this._instance = new PingPangControl();
        return this._instance;
    }
    private constructor() {}

    private model: PingPangModel = new PingPangModel();

    // ----------------------------------------------------------------
    // 内部定时器状态（不依赖 Cocos scheduler，由外部 update 驱动）
    // ----------------------------------------------------------------

    /** 下一次鞋花生成的倒计时（秒） */
    private spawnTimer: number = 0;
    /** 上一次秒级时间更新的整秒值，用于 timeUpdate 事件节流 */
    private lastSecond: number = -1;

    // 屏幕水平边界（设计分辨率 750，留球半径边距）
    private readonly WALL_LEFT  = -375 + BallRadius;
    private readonly WALL_RIGHT =  375 - BallRadius;
    private readonly WALL_TOP   =  667 - BallRadius;

    // ----------------------------------------------------------------
    // 游戏流程
    // ----------------------------------------------------------------

    /**
     * 开始一局游戏
     * 初始化 Model，重置内部定时器，发出 gameStart 事件
     */
    public startGame(): void {
        this.model.init();
        this.spawnTimer = this._randomSpawnInterval();
        this.lastSecond = -1;
        // 初始 vx 随机方向，避免球每次都垂直掉落
        const initSpeed = BallInitSpeed;
        const initVX    = (Math.random() < 0.5 ? 1 : -1) * initSpeed * 0.6;
        const initVY    = -initSpeed * BallVYRatio;
        this.model.setBall(0, this.model.ballY, initVX, initVY);
        this.model.setPlaying(true);
        UiBase.emitUiEvent(PingPangEvent.gameStart);
    }

    /**
     * 每帧驱动入口，由 View 的 update(dt) 调用
     * @param dt 帧时间（秒）
     */
    public update(dt: number): void {
        if (!this.model.isPlaying) return;

        this._tickTime(dt);
        this._checkDifficulty();
        this._tickBall(dt);
        this._tickShoeFlowers(dt);
    }

    // ----------------------------------------------------------------
    // 球拍输入
    // ----------------------------------------------------------------

    /**
     * 长按移动球拍，由 View 每帧传入水平输入值（-1 ~ 1）
     * @param dir   方向（-1 向左，+1 向右，0 静止）
     * @param dt    帧时间（秒）
     * @param clamp 球拍可移动的 X 边界 [minX, maxX]
     */
    public movePaddle(dir: number, dt: number, clamp: [number, number]): void {
        if (!this.model.isPlaying) return;
        const dx   = dir * PaddleMoveSpeed * dt;
        const newX = Math.min(clamp[1], Math.max(clamp[0], this.model.paddleX + dx));
        this.model.setPaddleX(newX);
        UiBase.emitUiEvent(PingPangEvent.paddleMove, newX);
    }

    // ----------------------------------------------------------------
    // 数据读取（供 View 使用）
    // ----------------------------------------------------------------

    public getScore(): number       { return this.model.score; }
    public getCombo(): number       { return this.model.combo; }
    public getRemainTime(): number  { return this.model.remainTime; }
    public getPaddleX(): number     { return this.model.paddleX; }
    public getDifficultyPhase(): eDifficultyPhase { return this.model.difficultyPhase; }
    public getShoeFlowers(): ReadonlyArray<IShoeFlower> { return this.model.shoeFlowers; }

    /**
     * 同步球拍实际 Y 坐标（由 View 在 start() 里调用一次）
     * 用于球落地判定，避免与编辑器节点位置不一致
     */
    public setPaddleY(y: number): void {
        this.model.setPaddleY(y);
    }

    // ----------------------------------------------------------------
    // 私有：球运动（手动模拟，方案B）
    // 详细公式见 BALL_PHYSICS.md
    // ----------------------------------------------------------------

    /**
     * 每帧更新球的位置，处理墙壁反弹、球拍碰撞、落地判定
     *
     * 运动模型（无重力，匀速）：
     *   ballX += vx * dt
     *   ballY += vy * dt
     *
     * 反弹规则：
     *   碰左/右墙 → vx 取反
     *   碰顶部   → vy 取反
     *   到球拍高度：
     *     命中球拍范围内 → 按偏移比例计算新 vx/vy（见 _calcPaddleBounce）
     *     超出球拍范围  → 球落地，游戏结束
     */
    private _tickBall(dt: number): void {
        let { ballX: x, ballY: y, ballVX: vx, ballVY: vy } = this.model;

        // 移动
        x += vx * dt;
        y += vy * dt;

        // 碰左/右墙反弹：vx 取反，并修正位置防止穿墙
        if (x < this.WALL_LEFT) {
            x  = this.WALL_LEFT;
            vx = Math.abs(vx);
        } else if (x > this.WALL_RIGHT) {
            x  = this.WALL_RIGHT;
            vx = -Math.abs(vx);
        }

        // 碰顶部反弹：vy 取反
        if (y > this.WALL_TOP) {
            y  = this.WALL_TOP;
            vy = -Math.abs(vy);
        }

        // 到达球拍高度时判断命中/落地
        // paddleY 由 View 层通过 setPaddleY 传入，此处用 Model 存储的值
        const paddleY = this.model.paddleY;
        if (vy < 0 && y - BallRadius <= paddleY + this.model.paddleHalfHeight) {
            if (!EnablePaddleCheck) {
                // 调试模式：跳过落地判定，直接在底部反弹
                vy = Math.abs(vy);
                y  = paddleY + this.model.paddleHalfHeight + BallRadius;
            } else {
                const halfW = PaddleWidth / 2;
                if (Math.abs(x - this.model.paddleX) <= halfW) {
                    // 命中球拍，重新计算反弹速度
                    const { newVX, newVY } = this._calcPaddleBounce(x);
                    vx = newVX;
                    vy = newVY;
                    y  = paddleY + this.model.paddleHalfHeight + BallRadius; // 修正位置避免穿透
                    this.model.setBall(x, y, vx, vy);
                    this._onBallHitPaddle();
                    return;
                } else {
                    // 未命中球拍，落地
                    this.model.setBall(x, y, vx, vy);
                    this._onBallFall();
                    return;
                }
            }
        }

        this.model.setBall(x, y, vx, vy);
        UiBase.emitUiEvent(PingPangEvent.ballUpdate, x, y, vx, vy);
    }

    /**
     * 球拍反弹速度计算
     *
     * 核心公式（详见 BALL_PHYSICS.md 四、4.2）：
     *   offset = ballX - paddleX                    // 球相对球拍中心的偏移
     *   ratio  = clamp(offset / halfPaddleWidth, -1, 1)
     *   speed  = BallInitSpeed * Phase1BallSpeedMul（Phase1后）
     *   vx     = ratio * speed                      // 偏左→往左，偏右→往右
     *   vy     = +speed * BallVYRatio               // 固定向上
     *
     * 图示：
     *   撞左侧(ratio≈-0.8) → 向左上飞  ↖
     *   撞中心(ratio≈0)    → 垂直弹起  ↑
     *   撞右侧(ratio≈+0.8) → 向右上飞  ↗
     */
    private _calcPaddleBounce(ballX: number): { newVX: number; newVY: number } {
        const halfW  = PaddleWidth / 2;
        const offset = ballX - this.model.paddleX;
        const ratio  = Math.max(-1, Math.min(1, offset / halfW));

        // Phase1 触发后速度加快
        const speed  = BallInitSpeed * (
            this.model.difficultyPhase >= eDifficultyPhase.phase1 ? Phase1BallSpeedMul : 1
        );

        return {
            newVX: ratio * speed,
            newVY: speed * BallVYRatio,   // 固定向上
        };
    }

    /**
     * 球命中球拍后的得分/连颠处理
     */
    private _onBallHitPaddle(): void {
        const { delta, buffBonus, buffDesc } = this.model.onHitPaddle();

        UiBase.emitUiEvent(PingPangEvent.scoreUpdate, this.model.score, delta);
        UiBase.emitUiEvent(PingPangEvent.comboUpdate, this.model.combo);
        if (buffBonus > 0) {
            UiBase.emitUiEvent(PingPangEvent.comboBuff, buffBonus, buffDesc);
        }
        UiBase.emitUiEvent(PingPangEvent.ballHitPaddle);
        this._checkDifficulty();
    }

    /**
     * 球落地（未被接住）
     */
    private _onBallFall(): void {
        this.model.onBallFall();
        UiBase.emitUiEvent(PingPangEvent.comboUpdate, 0);
        UiBase.emitUiEvent(PingPangEvent.ballFall);
        this._endGame();
    }

    // ----------------------------------------------------------------
    // 私有：计时
    // ----------------------------------------------------------------

    private _tickTime(dt: number): void {
        const timeUp = this.model.tickTime(dt);

        const curSecond = Math.ceil(this.model.remainTime);
        if (curSecond !== this.lastSecond) {
            this.lastSecond = curSecond;
            UiBase.emitUiEvent(PingPangEvent.timeUpdate, this.model.remainTime);
        }

        if (timeUp && GameDuration > 0) {
            UiBase.emitUiEvent(PingPangEvent.timeUp);
            this._endGame();
        }
    }

    // ----------------------------------------------------------------
    // 私有：难度检测
    // ----------------------------------------------------------------

    private _checkDifficulty(): void {
        const phase = this.model.difficultyPhase;

        // Phase1：分数达到阈值
        if (phase < eDifficultyPhase.phase1 && this.model.score >= Phase1ScoreThreshold) {
            const changed = this.model.setDifficultyPhase(eDifficultyPhase.phase1);
            if (changed) {
                UiBase.emitUiEvent(
                    PingPangEvent.difficultyPhaseChange,
                    eDifficultyPhase.phase1,
                    Phase1HintText,
                );
            }
            return;
        }

        // Phase2：Phase1 触发后，已用时超过阈值
        if (phase === eDifficultyPhase.phase1 && this.model.phase1StartTime >= 0) {
            const phase1Elapsed = this.model.elapsedTime - this.model.phase1StartTime;
            if (phase1Elapsed >= Phase2DurationThreshold) {
                const changed = this.model.setDifficultyPhase(eDifficultyPhase.phase2);
                if (changed) {
                    UiBase.emitUiEvent(
                        PingPangEvent.difficultyPhaseChange,
                        eDifficultyPhase.phase2,
                        Phase2HintText,
                    );
                }
            }
        }
    }

    // ----------------------------------------------------------------
    // 私有：鞋花生成 & 下落
    // ----------------------------------------------------------------

    private _tickShoeFlowers(dt: number): void {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0 && this.model.shoeFlowers.length < MaxShoeFlowerOnStage) {
            this._spawnShoeFlower();
            this.spawnTimer = this._randomSpawnInterval();
        }

        const toRemove: number[] = [];
        for (const flower of this.model.shoeFlowers) {
            const newY = this.model.updateShoeFlowerY(flower.uid, dt);
            UiBase.emitUiEvent(PingPangEvent.shoeFlowerUpdate, flower.uid, newY);
            if (newY < GroundY) {
                toRemove.push(flower.uid);
            }
        }
        for (const uid of toRemove) {
            this.model.removeShoeFlower(uid);
            UiBase.emitUiEvent(PingPangEvent.shoeFlowerMiss, uid);
        }
    }

    private _spawnShoeFlower(): void {
        const type = Math.random() < 0.2 ? eShoeFlowerType.limited : eShoeFlowerType.normal;
        const x    = -315 + Math.random() * 630;
        const y    = 750;

        const speedMul = this.model.difficultyPhase >= eDifficultyPhase.phase2
            ? Phase2ShoeFlowerSpeedMul : 1;
        const speedY = (ShoeFlowerFallSpeed[0] + Math.random() * (ShoeFlowerFallSpeed[1] - ShoeFlowerFallSpeed[0]))
            * speedMul;

        const flower = this.model.spawnShoeFlower(type, x, y, speedY);
        UiBase.emitUiEvent(PingPangEvent.shoeFlowerSpawn, flower);
    }

    // ----------------------------------------------------------------
    // 私有：游戏结束
    // ----------------------------------------------------------------

    private _endGame(): void {
        if (this.model.isGameOver) return;
        this.model.setGameOver();
        const result = this.model.buildResult();
        UiBase.emitUiEvent(PingPangEvent.gameOver, result);
    }

    // ----------------------------------------------------------------
    // 私有：工具
    // ----------------------------------------------------------------

    private _randomSpawnInterval(): number {
        const [min, max] = ShoeFlowerSpawnInterval;
        const mul = this.model.difficultyPhase >= eDifficultyPhase.phase2
            ? Phase2SpawnIntervalMul : 1;
        return (min + Math.random() * (max - min)) * mul;
    }
}

export const pingPangControl = PingPangControl.Instance;
