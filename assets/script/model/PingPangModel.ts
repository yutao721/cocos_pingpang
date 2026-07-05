import { IShoeFlower, IPingPangResult } from '../const/Interface';
import {
    BaseHitScore,
    BallInitSpeed,
    BallInitY,
    ComboBuffConfig,
    ComboBuffStep,
    ComboBuffStepBonus,
    eDifficultyPhase,
    eShoeFlowerType,
    GameDuration,
    PaddleHeight,
    PaddleInitY,
    ShoeFlowerScoreConfig,
} from '../const/GameConst';

/**
 * 颠球游戏数据层
 * 只负责存储和修改数据，不涉及任何 Cocos 节点/渲染/事件
 */
export class PingPangModel {

    // ----------------------------------------------------------------
    // 游戏状态
    // ----------------------------------------------------------------

    private _isGameOver: boolean = false;
    public get isGameOver(): boolean { return this._isGameOver; }

    private _isPlaying: boolean = false;
    public get isPlaying(): boolean { return this._isPlaying; }

    // ----------------------------------------------------------------
    // 计时
    // ----------------------------------------------------------------

    /** 剩余时间（秒）。GameDuration=0 时为无限时模式，此字段始终为 0 */
    private _remainTime: number = 0;
    public get remainTime(): number { return this._remainTime; }

    /** 本局已用时（秒，累计，精确到毫秒） */
    private _elapsedTime: number = 0;
    public get elapsedTime(): number { return this._elapsedTime; }

    // ----------------------------------------------------------------
    // 得分
    // ----------------------------------------------------------------

    private _score: number = 0;
    public get score(): number { return this._score; }

    // ----------------------------------------------------------------
    // 连颠
    // ----------------------------------------------------------------

    private _combo: number = 0;
    /** 当前连颠次数 */
    public get combo(): number { return this._combo; }

    private _maxCombo: number = 0;
    /** 本局最高连颠次数 */
    public get maxCombo(): number { return this._maxCombo; }

    /** 上一次触发连颠Buff时的 combo 值，用于判断是否达到下一档 */
    private _lastBuffCombo: number = 0;

    // ----------------------------------------------------------------
    // 颠球统计
    // ----------------------------------------------------------------

    private _hitCount: number = 0;
    /** 总颠球次数（球命中球拍） */
    public get hitCount(): number { return this._hitCount; }

    private _shoeFlowerHitCount: number = 0;
    /** 总撞击鞋花次数 */
    public get shoeFlowerHitCount(): number { return this._shoeFlowerHitCount; }

    // ----------------------------------------------------------------
    // 球拍
    // ----------------------------------------------------------------

    private _paddleX: number = 0;
    /** 球拍当前 X 坐标 */
    public get paddleX(): number { return this._paddleX; }

    private _paddleY: number = PaddleInitY;
    /** 球拍 Y 坐标（固定值，由 GameConst.PaddleInitY 决定） */
    public get paddleY(): number { return this._paddleY; }

    /** 球拍半高，用于碰撞检测上边界，由 View 层同步 Sprite 真实高度 */
    private _paddleHalfHeight: number = PaddleHeight / 2;
    public get paddleHalfHeight(): number { return this._paddleHalfHeight; }
    public setPaddleHalfHeight(h: number): void { this._paddleHalfHeight = h; }

    // ----------------------------------------------------------------
    // 球
    // ----------------------------------------------------------------

    private _ballX: number = 0;
    private _ballY: number = 0;
    private _ballVX: number = 0;
    private _ballVY: number = 0;

    public get ballX(): number { return this._ballX; }
    public get ballY(): number { return this._ballY; }
    public get ballVX(): number { return this._ballVX; }
    public get ballVY(): number { return this._ballVY; }

    // ----------------------------------------------------------------
    // 鞋花
    // ----------------------------------------------------------------

    private _shoeFlowers: IShoeFlower[] = [];
    /** 场上所有鞋花（只读引用，外部不要直接修改） */
    public get shoeFlowers(): ReadonlyArray<IShoeFlower> { return this._shoeFlowers; }

    private _shoeFlowerUid: number = 0;

    // ----------------------------------------------------------------
    // 难度阶段
    // ----------------------------------------------------------------

    private _difficultyPhase: eDifficultyPhase = eDifficultyPhase.normal;
    /** 当前难度阶段 */
    public get difficultyPhase(): eDifficultyPhase { return this._difficultyPhase; }

    /** 进入 Phase1 时记录的已用时（秒），用于 Phase2 计时 */
    private _phase1StartTime: number = -1;
    public get phase1StartTime(): number { return this._phase1StartTime; }

    // ================================================================
    // 方法
    // ================================================================

    /**
     * 初始化/重置全部数据，每局开始时调用
     */
    public init(): void {
        this._isGameOver    = false;
        this._isPlaying     = false;
        this._remainTime    = GameDuration;
        this._elapsedTime   = 0;
        this._score         = 0;
        this._combo         = 0;
        this._maxCombo      = 0;
        this._lastBuffCombo = 0;
        this._hitCount      = 0;
        this._shoeFlowerHitCount = 0;
        this._paddleX       = 0;
        // _paddleY 不在此重置，由 View 层在 start() 里同步节点真实坐标
        this._ballX         = 0;
        this._ballY         = BallInitY;
        this._ballVX        = 0;
        this._ballVY        = -BallInitSpeed; // 初始向下
        this._shoeFlowers   = [];
        this._shoeFlowerUid = 0;
        this._difficultyPhase  = eDifficultyPhase.normal;
        this._phase1StartTime  = -1;
    }

    // ----------------------------------------------------------------
    // 游戏状态
    // ----------------------------------------------------------------

    public setPlaying(val: boolean): void {
        this._isPlaying = val;
    }

    public setGameOver(): void {
        this._isGameOver = true;
        this._isPlaying  = false;
    }

    /**
     * 推进难度阶段
     * @returns 是否真正发生了阶段变化
     */
    public setDifficultyPhase(phase: eDifficultyPhase): boolean {
        if (this._difficultyPhase >= phase) return false;
        this._difficultyPhase = phase;
        if (phase === eDifficultyPhase.phase1) {
            this._phase1StartTime = this._elapsedTime;
        }
        return true;
    }

    // ----------------------------------------------------------------
    // 计时
    // ----------------------------------------------------------------

    /**
     * 更新时间，每帧由 Control 调用
     * @param dt 帧时间（秒）
     * @returns 是否时间耗尽（无限时模式始终返回 false）
     */
    public tickTime(dt: number): boolean {
        this._elapsedTime += dt;
        if (GameDuration <= 0) return false;
        this._remainTime = Math.max(0, this._remainTime - dt);
        return this._remainTime <= 0;
    }

    // ----------------------------------------------------------------
    // 球拍
    // ----------------------------------------------------------------

    public setPaddleX(x: number): void {
        this._paddleX = x;
    }

    public setPaddleY(y: number): void {
        this._paddleY = y;
    }

    // ----------------------------------------------------------------
    // 球
    // ----------------------------------------------------------------

    public setBall(x: number, y: number, vx: number, vy: number): void {
        this._ballX  = x;
        this._ballY  = y;
        this._ballVX = vx;
        this._ballVY = vy;
    }

    // ----------------------------------------------------------------
    // 颠球命中
    // ----------------------------------------------------------------

    /**
     * 球命中球拍，更新连颠/分数
     * @returns { delta: number, buffBonus: number, buffTitle: string, buffDesc: string }
     *          delta      = 本次得分增量（BaseHitScore）
     *          buffBonus  = 连颠阶梯奖励（0 表示未触发）
     *          buffTitle  = 连击标题
     *          buffDesc   = Buff 提示文案
     */
    public onHitPaddle(): { delta: number; buffBonus: number; buffTitle: string; buffDesc: string } {
        this._hitCount++;
        this._combo++;
        if (this._combo > this._maxCombo) {
            this._maxCombo = this._combo;
        }

        let delta = BaseHitScore;
        this._score += delta;

        // 检查连颠 Buff
        let buffBonus = 0;
        let buffTitle = '';
        let buffDesc  = '';
        const buffResult = this._checkComboBuff();
        if (buffResult) {
            buffBonus = buffResult.bonus;
            buffTitle = buffResult.title;
            buffDesc  = buffResult.desc;
            this._score += buffBonus;
            this._lastBuffCombo = this._combo;
        }

        return { delta, buffBonus, buffTitle, buffDesc };
    }

    /**
     * 球落地（未被接住），连颠清零
     */
    public onBallFall(): void {
        this._combo = 0;
        this._lastBuffCombo = 0;
    }

    // ----------------------------------------------------------------
    // 鞋花
    // ----------------------------------------------------------------

    /**
     * 生成一个鞋花并加入场上列表
     */
    public spawnShoeFlower(type: eShoeFlowerType, x: number, y: number, lifetime: number): IShoeFlower {
        const flower: IShoeFlower = {
            uid: ++this._shoeFlowerUid,
            type,
            x,
            y,
            lifetime,
        };
        this._shoeFlowers.push(flower);
        return flower;
    }

    /**
     * 鞋花存活时间倒计时，返回剩余时间（秒）
     */
    public tickShoeFlowerLifetime(uid: number, dt: number): number {
        const flower = this._shoeFlowers.find(f => f.uid === uid);
        if (!flower) return 0;
        flower.lifetime -= dt;
        return flower.lifetime;
    }

    /**
     * 球命中鞋花，移除并结算加分
     * @returns 本次得分增量，鞋花不存在时返回 0
     */
    public onHitShoeFlower(uid: number): number {
        const index = this._shoeFlowers.findIndex(f => f.uid === uid);
        if (index === -1) return 0;
        const flower = this._shoeFlowers[index];
        const delta  = ShoeFlowerScoreConfig[flower.type] ?? 0;
        this._score += delta;
        this._shoeFlowerHitCount++;
        this._shoeFlowers.splice(index, 1);
        return delta;
    }

    /**
     * 鞋花落出屏幕，直接移除（不加分）
     */
    public removeShoeFlower(uid: number): void {
        const index = this._shoeFlowers.findIndex(f => f.uid === uid);
        if (index !== -1) this._shoeFlowers.splice(index, 1);
    }

    // ----------------------------------------------------------------
    // 结算
    // ----------------------------------------------------------------

    /**
     * 生成结算快照
     */
    public buildResult(): IPingPangResult {
        return {
            score:          this._score,
            maxCombo:       this._maxCombo,
            hitCount:       this._hitCount,
            shoeFlowerHit:  this._shoeFlowerHitCount,
            duration:       Math.floor(this._elapsedTime),
        };
    }

    // ----------------------------------------------------------------
    // 私有
    // ----------------------------------------------------------------

    /**
     * 检查是否触发连颠 Buff 阶梯奖励
     * 规则：每次 combo 越过一个 "检查点" 触发一次
     */
    private _checkComboBuff(): { bonus: number; title: string; desc: string } | null {
        const combo = this._combo;
        const last  = this._lastBuffCombo;

        // 遍历配置表，找出第一个 "本次 combo 越过 且 上次未越过" 的档位
        for (const cfg of ComboBuffConfig) {
            if (combo >= cfg.count && last < cfg.count) {
                return { bonus: cfg.bonus, title: cfg.title, desc: cfg.desc };
            }
        }

        // 超出配置表最大档，按步长动态计算
        const maxCfg   = ComboBuffConfig[ComboBuffConfig.length - 1];
        if (combo > maxCfg.count) {
            // 计算当前 combo 处于哪个扩展段
            const extraSteps = Math.floor((combo - maxCfg.count) / ComboBuffStep);
            const threshold  = maxCfg.count + extraSteps * ComboBuffStep;
            if (combo >= threshold && last < threshold) {
                const bonus = maxCfg.bonus + extraSteps * ComboBuffStepBonus;
                return { bonus, title: `${threshold}连击！`, desc: `额外+${bonus}` };
            }
        }

        return null;
    }
}
