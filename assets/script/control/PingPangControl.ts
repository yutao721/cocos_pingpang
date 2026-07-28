import { Api } from '../api/api';
import { UiBase } from '../../framework/ui/UiBase';
import { StorageManager } from '../../framework/storage/StorageManager';
import { PingPangEvent } from '../const/EventDefine';
import {
  BallInitSpeed,
  BallRadius,
  BallVYRatio,
  BallVXRatio,
  BallGravity,
  AutoPaddle,
  DebugForceSpawnPenalty,
  DebugPenaltyStartHitCount,
  eDifficultyPhase,
  EnablePaddleCheck,
  eShoeFlowerType,
  GameDuration,
  GroundY,
  MaxShoeFlowerOnStage,
  PaddleHeight,
  PaddleMoveSpeed,
  PaddleWidth,
  PenaltyShoeFlowerLifetime,
  PenaltyShoeFlowerSpawnChance,
  PenaltyShoeFlowerStartHitCount,
  Phase1BallSpeedMul,
  Phase1HintText,
  Phase1ScoreThreshold,
  Phase2DurationThreshold,
  Phase2HintText,
  Phase2SpawnIntervalMul,
  ShoeFlowerLifetime,
  ShoeFlowerLifetimeMulPhase2,
  ShoeFlowerRadius,
  ShoeFlowerRespawnDelayAfterDisappear,
  ShoeFlowerSpawnInterval,
  ShoeFlowerSpawnRangeX,
  ShoeFlowerSpawnRangeY,
  ShoeFlowerSpawnYSpread,
  ShoeFlowerStartHitCount,
} from '../const/GameConst';
import { IPingPangResult, IShoeFlower, IShoeFlowerHitEffectData } from '../const/Interface';
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
  private constructor() { }

  private static readonly PENDING_SCORE_KEY = 'pp_pending_score';

  private model: PingPangModel = new PingPangModel();

  // ----------------------------------------------------------------
  // 内部定时器状态（不依赖 Cocos scheduler，由外部 update 驱动）
  // ----------------------------------------------------------------

  /** 下一次鞋花生成的倒计时（秒） */
  private spawnTimer: number = 0;
  /** 上一次秒级时间更新的整秒值，用于 timeUpdate 事件节流 */
  private lastSecond: number = -1;
  /** 上一次存本地 pending 分数的整秒值，每 30 秒存一次 */
  private _lastSavedSecond: number = -1;
  /** AutoPaddle 模式下球拍相对球的固定偏移，每次接球后重新随机 */
  private _autoPaddleOffset: number = 0;
  private _isPaused = false;
  /** 球已漏拍，等待落出屏幕后再判定失败 */
  private _ballMissed = false;

  // 调试统计
  private _debugNormalCount: number = 0;
  private _debugLimitedCount: number = 0;
  private _debugPenaltyCount: number = 0;

  // 屏幕水平边界（设计分辨率 750，留球半径边距）
  private readonly WALL_LEFT = -375 + BallRadius;
  private readonly WALL_RIGHT = 375 - BallRadius;

  // ----------------------------------------------------------------
  // 游戏流程
  // ----------------------------------------------------------------

  /**
   * 开始一局游戏
   * 初始化 Model，重置内部定时器，发出 gameStart 事件
   */
  public startGame(): void {
    this.model.init();
    this._isPaused = false;
    this.spawnTimer = this._randomSpawnInterval();
    this.lastSecond = 0;
    this._lastSavedSecond = -1;
    this._debugNormalCount  = 0;
    this._debugLimitedCount = 0;
    this._debugPenaltyCount = 0;
    this._ballMissed = false;
    // 初始直线下落，速度放缓让玩家有准备时间；接到第一球后才有横向速度
    this.model.setBall(this.model.ballX, this.model.ballY, 0, -600);
    this.model.setPlaying(true);
    UiBase.emitUiEvent(PingPangEvent.gameStart);
    UiBase.emitUiEvent(PingPangEvent.timeUpdate, 0);
  }

  /**
   * 每帧驱动入口，由 View 的 update(dt) 调用
   * @param dt 帧时间（秒）
   */
  public update(dt: number): void {
    if (!this.model.isPlaying || this._isPaused) return;

    if (AutoPaddle) {
      const autoX = this.model.ballX + this._autoPaddleOffset;
      this.model.setPaddleX(autoX);
      UiBase.emitUiEvent(PingPangEvent.paddleMove, autoX);
    }

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
    if (!this.model.isPlaying || this._isPaused) return;
    const dx = dir * PaddleMoveSpeed * dt;
    const newX = Math.min(clamp[1], Math.max(clamp[0], this.model.paddleX + dx));
    this.model.setPaddleX(newX);
    UiBase.emitUiEvent(PingPangEvent.paddleMove, newX);
  }

  public dragPaddleTo(x: number, y: number, clampX: [number, number], clampY: [number, number]): void {
    if (!this.model.isPlaying || this._isPaused) return;
    const newX = Math.min(clampX[1], Math.max(clampX[0], x));
    const newY = Math.min(clampY[1], Math.max(clampY[0], y));
    this.model.setPaddleX(newX);
    this.model.setPaddleY(newY);
    UiBase.emitUiEvent(PingPangEvent.paddleMove, newX, newY);
  }

  // ----------------------------------------------------------------
  // 数据读取（供 View 使用）
  // ----------------------------------------------------------------

  public getScore(): number { return this.model.score; }
  public get isPaused(): boolean { return this._isPaused; }
  public syncPaddleY(y: number, halfH?: number): void {
    this.model.setPaddleY(y);
    if (halfH !== undefined) this.model.setPaddleHalfHeight(halfH);
  }
  public getCombo(): number { return this.model.combo; }
  public getRemainTime(): number { return this.model.remainTime; }
  public getElapsedTime(): number { return this.model.elapsedTime; }
  public getPaddleX(): number { return this.model.paddleX; }
  public getDifficultyPhase(): eDifficultyPhase { return this.model.difficultyPhase; }
  public getShoeFlowers(): ReadonlyArray<IShoeFlower> { return this.model.shoeFlowers; }

  public pauseGame(): void {
    if (!this.model.isPlaying || this.model.isGameOver) return;
    this._isPaused = true;
  }

  public resumeGame(): void {
    if (!this.model.isPlaying || this.model.isGameOver) return;
    this._isPaused = false;
  }

  // ----------------------------------------------------------------
  // 私有：球运动（手动模拟，方案B）
  // 详细公式见 BALL_PHYSICS.md
  // ----------------------------------------------------------------

  /**
   * 每帧更新球的位置，处理墙壁反弹、球拍碰撞、落地判定
   *
   * 运动模型（有重力，抛物线）：
   *   vy   -= BallGravity * dt   （重力加速：上升减速、下落加速）
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

    // 移动（重力每帧对 vy 施加向下加速度）
    vy -= BallGravity * dt;
    x += vx * dt;
    y += vy * dt;

    // 碰左/右墙反弹：vx 取反，并修正位置防止穿墙
    if (x < this.WALL_LEFT) {
      x = this.WALL_LEFT;
      vx = Math.abs(vx);
      // 效果图贴墙面（球心 - 球半径 = 墙面 X）
      UiBase.emitUiEvent(PingPangEvent.ballHitWallLeft, x - BallRadius, y);
    } else if (x > this.WALL_RIGHT) {
      x = this.WALL_RIGHT;
      vx = -Math.abs(vx);
      UiBase.emitUiEvent(PingPangEvent.ballHitWallRight, x + BallRadius, y);
    }


    if (!EnablePaddleCheck) {
      // 调试模式：球到屏幕底部直接反弹，全程运动不触发落地
      if (vy < 0 && y - BallRadius <= GroundY) {
        vy = Math.abs(vy);
        y = GroundY + BallRadius;
      }
    } else {
      // 正式模式：到达球拍顶面高度时判断命中/落地
      const PADDLE_TOP = this.model.paddleY + PaddleHeight + (PaddleHeight / 2);
      if (!this._ballMissed && vy < 0 && y - BallRadius <= PADDLE_TOP) {
        const halfW = PaddleWidth / 2;
        if (Math.abs(x - this.model.paddleX) <= halfW + BallRadius) {
          // 命中球拍，重新计算反弹速度，先修正视觉位置再通知 View
          const { newVX, newVY } = this._calcPaddleBounce(x);
          vx = newVX;
          vy = newVY;
          y = PADDLE_TOP + BallRadius;
          this.model.setBall(x, y, vx, vy);
          UiBase.emitUiEvent(PingPangEvent.ballUpdate, x, y, vx, vy);
          this._onBallHitPaddle();
          return;
        } else {
          // 漏拍：标记已漏拍，让球继续下落到屏幕外再判定失败
          this._ballMissed = true;
        }
      }
      // 球落出屏幕下边界，正式判定失败
      if (this._ballMissed && y + BallRadius <= GroundY) {
        this.model.setBall(x, y, vx, vy);
        this._onBallFall();
        return;
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
    const halfW = PaddleWidth / 2;
    const offset = ballX - this.model.paddleX;
    const ratio = Math.max(-1, Math.min(1, offset / halfW));

    // Phase1 只加快水平速度，垂直速度不变（避免只是弹更高）
    const vxMul = this.model.difficultyPhase >= eDifficultyPhase.phase1 ? Phase1BallSpeedMul : 1;

    return {
      newVX: ratio * BallInitSpeed * BallVXRatio * vxMul,
      newVY: BallInitSpeed * BallVYRatio,
    };
  }

  /**
   * 球命中球拍后的得分/连颠处理
   */
  private _onBallHitPaddle(): void {
    const { delta, buffBonus, buffTitle, buffDesc } = this.model.onHitPaddle();

    UiBase.emitUiEvent(PingPangEvent.scoreUpdate, this.model.score, delta);
    UiBase.emitUiEvent(PingPangEvent.comboUpdate, this.model.combo);
    if (buffTitle) {
      UiBase.emitUiEvent(PingPangEvent.comboBuff, buffBonus, buffTitle, buffDesc);
    }
    UiBase.emitUiEvent(PingPangEvent.ballHitPaddle, this.model.ballX, this.model.ballY);
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

    const curSecond = Math.floor(this.model.elapsedTime);
    if (curSecond !== this.lastSecond) {
      this.lastSecond = curSecond;
      UiBase.emitUiEvent(PingPangEvent.timeUpdate, curSecond);
      // 每 2 秒把当前分数存一次本地，防止卡死时分数丢失
      if (curSecond - this._lastSavedSecond >= 2) {
        this._lastSavedSecond = curSecond;
        this._savePendingScore();
      }
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
    if (this.spawnTimer <= 0 && this.model.shoeFlowers.length < MaxShoeFlowerOnStage && this.model.hitCount >= ShoeFlowerStartHitCount) {
      this._spawnShoeFlower();
      this.spawnTimer = this._randomSpawnInterval();
    }

    const toRemove: number[] = [];
    const toHit: IShoeFlowerHitEffectData[] = [];
    const hitUidSet: Set<number> = new Set();

    for (const flower of this.model.shoeFlowers) {
      // 球与鞋花的距离碰撞检测
      const dx = this.model.ballX - flower.x;
      const dy = this.model.ballY - flower.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= BallRadius + ShoeFlowerRadius) {
        if (!hitUidSet.has(flower.uid)) {
          hitUidSet.add(flower.uid);
          toHit.push({
            uid: flower.uid,
            type: flower.type,
            x: flower.x,
            y: flower.y,
            score: 0,
          });
        }
        continue;
      }

      // 存活时间倒计时
      const remaining = this.model.tickShoeFlowerLifetime(flower.uid, dt);
      if (remaining <= 0) {
        toRemove.push(flower.uid);
      }
    }

    for (const hitData of toHit) {
      const delta = this.model.onHitShoeFlower(hitData.uid);
      if (delta === 0) continue; // uid 已不存在（双帧保护）
      hitData.score = delta;
      this._resetShoeFlowerRespawnTimer();
      UiBase.emitUiEvent(PingPangEvent.scoreUpdate, this.model.score, delta);
      UiBase.emitUiEvent(PingPangEvent.shoeFlowerHit, hitData);
    }
    for (const uid of toRemove) {
      this.model.removeShoeFlower(uid);
      this._resetShoeFlowerRespawnTimer();
      UiBase.emitUiEvent(PingPangEvent.shoeFlowerMiss, uid);
    }
  }

  private _spawnShoeFlower(): void {
    // ---- 决定类型 ----
    // 优先判定减分鞋花（需达到颠球次数门槛，且概率比限量款更低）
    let type: eShoeFlowerType;
    const penaltyThreshold = DebugPenaltyStartHitCount >= 0
      ? DebugPenaltyStartHitCount
      : PenaltyShoeFlowerStartHitCount;
    if (
      DebugForceSpawnPenalty ||
      (this.model.hitCount >= penaltyThreshold && Math.random() < PenaltyShoeFlowerSpawnChance)
    ) {
      type = eShoeFlowerType.penalty;
    } else if (Math.random() < 0.2) {
      type = eShoeFlowerType.limited;
    } else {
      type = eShoeFlowerType.normal;
    }

    // ---- 位置 ----
    const [xMin, xMax] = ShoeFlowerSpawnRangeX;
    const [yMin, yMax] = ShoeFlowerSpawnRangeY;
    const x = xMin + Math.random() * (xMax - xMin);
    const center = Math.max(yMin, Math.min(yMax, this.model.ballY));
    const y = Math.max(yMin, Math.min(yMax, center + (Math.random() * 2 - 1) * ShoeFlowerSpawnYSpread));

    // ---- 存活时间 ----
    let ltMin: number, ltMax: number;
    if (type === eShoeFlowerType.penalty) {
      [ltMin, ltMax] = PenaltyShoeFlowerLifetime;
    } else {
      [ltMin, ltMax] = ShoeFlowerLifetime;
    }
    const lifetimeMul = (type !== eShoeFlowerType.penalty && this.model.difficultyPhase >= eDifficultyPhase.phase2)
      ? ShoeFlowerLifetimeMulPhase2 : 1;
    const lifetime = (ltMin + Math.random() * (ltMax - ltMin)) * lifetimeMul;

    const flower = this.model.spawnShoeFlower(type, x, y, lifetime);
    UiBase.emitUiEvent(PingPangEvent.shoeFlowerSpawn, flower);

    // 调试统计
    if (type === eShoeFlowerType.penalty) {
      this._debugPenaltyCount++;
    } else if (type === eShoeFlowerType.limited) {
      this._debugLimitedCount++;
    } else {
      this._debugNormalCount++;
    }
    console.log(`[ShoeFlower] 生成: ${type === eShoeFlowerType.penalty ? '减分款' : type === eShoeFlowerType.limited ? '限量款' : '普通款'}  普通=${this._debugNormalCount}  限量=${this._debugLimitedCount}  减分=${this._debugPenaltyCount}  合计=${this._debugNormalCount + this._debugLimitedCount + this._debugPenaltyCount}`);
  }

  // ----------------------------------------------------------------
  // 私有：游戏结束
  // ----------------------------------------------------------------

  private _endGame(): void {
    if (this.model.isGameOver) return;
    this._isPaused = false;
    this.model.setGameOver();
    const result = this.model.buildResult();
    this._savePendingScore();
    void this._submitResult(result);
    UiBase.emitUiEvent(PingPangEvent.gameOver, result);
  }

  private async _submitResult(result: IPingPangResult): Promise<void> {
    try {
      await Api.gameEnd({
        score: result.score,
        second: result.duration,
      });
      this._clearPendingScore();
    } catch (error) {
      console.warn('[PingPangControl] submit result failed', error);
    }
  }

  // ----------------------------------------------------------------
  // 私有：pending 分数本地存储（防卡死丢分）
  // ----------------------------------------------------------------

  /** 将当前分数写入本地，标记为待上报 */
  private _savePendingScore(): void {
    if (this.model.score <= 0) return;
    StorageManager.set(PingPangControl.PENDING_SCORE_KEY, {
      score: this.model.score,
      second: Math.floor(this.model.elapsedTime),
    });
  }

  /** 上报成功后清除 pending 标记 */
  private _clearPendingScore(): void {
    StorageManager.remove(PingPangControl.PENDING_SCORE_KEY);
  }

  /**
   * 游戏启动时检查上局是否有未上报的分数（卡死残留），有则补报
   * 补报成功后清除，失败则保留等下次再试
   */
  public async checkAndSubmitPendingScore(): Promise<void> {
    const pending = StorageManager.get(PingPangControl.PENDING_SCORE_KEY, null);
    if (!pending || pending.score <= 0) return;
    console.log('[PingPangControl] found pending score, submitting:', pending);
    try {
      await Api.gameEnd({ score: pending.score, second: pending.second });
      this._clearPendingScore();
      console.log('[PingPangControl] pending score submitted and cleared');
    } catch (error) {
      console.warn('[PingPangControl] pending score submit failed, will retry next time', error);
    }
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

  private _resetShoeFlowerRespawnTimer(): void {
    this.spawnTimer = Math.max(this.spawnTimer, ShoeFlowerRespawnDelayAfterDisappear);
  }
}

export const pingPangControl = PingPangControl.Instance;
