import { _decorator, Color, Graphics, Label, Node, Prefab, Sprite, SpriteFrame, Tween, UIOpacity, UITransform, Vec3, instantiate, tween } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';
import { AnimationPlayer } from '../../framework/ui/AnimationPlayer';
import { pingPangControl } from '../control/PingPangControl';
import { PingPangEvent } from '../const/EventDefine';
import { RewardInfoUpdateEvent } from '../const/RewardConst';
import {
  BallInitX,
  BallInitY,
  eDifficultyPhase,
  eShoeFlowerType,
  PaddleHeight,
  PaddleInitY,
  PaddleMoveMinY,
  PaddleMoveMaxY,
  PaddleWidth,
  RandomHintHitInterval,
  RandomHintTexts,
  ShoeFlowerExpireBlinkInterval,
  ShoeFlowerExpireWarnMinOpacity,
  ShoeFlowerExpireWarnScale,
  ShoeFlowerExpireWarnTime,
  ShoeFlowerHitHint,
  ShoeFlowerHitSwingAngle,
  ShoeFlowerHitSwingDuration,
  ShoeFlowerRadius,
  ShowPaddleHitBox,
  ShowShoeFlowerHitBox,
} from '../const/GameConst';
import { IPingPangResult, IShoeFlower, IShoeFlowerHitEffectData } from '../const/Interface';
import { UILayer } from '../../framework/ui/PageManager';
import { UI_PATH } from '../const/UiConfig';
import { ResultPopup } from './ResultPopup';
import { ScoreMilestoneBar } from './ScoreMilestoneBar';
import { VideoPopup } from './VideoPopup';
import { userControl } from '../control/UserControl';
import { getShoeFlowerSpritePool, getSpriteFramesByDir } from '../utils/utils';
import { PingPangProgressMaxScore } from '../const/PingPangProgressConfig';
const { ccclass, property } = _decorator;

interface IShoeFlowerViewState {
  node: Node;
  opacity: UIOpacity;
  remainingLifetime: number;
  totalLifetime: number;
  baseScale: Vec3;
  baseAngle: number;
  animPlayer?: AnimationPlayer;
}

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
 *   ├─ TimerLabel             本局用时（正向计时）
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
  backNode: Node = null;

  @property(Node)
  ballNode: Node = null;

  @property(Node)
  paddleNode: Node = null;

  @property(SpriteFrame)
  paddleNormalSF: SpriteFrame = null;

  @property(SpriteFrame)
  paddleHitSF: SpriteFrame = null;

  @property
  paddleHitFrameDuration: number = 0.07;

  @property(Node)
  shoeFlowerLayer: Node = null;

  /** 鞋花 Prefab，节点上需挂 Sprite 组件，普通/限量款通过 spriteFrame 区分 */
  @property(Prefab)
  shoeFlowerPfb: Prefab = null;

  /** 鞋花得分飘字 Prefab（可选，用于自定义字体/样式） */
  @property(Prefab)
  shoeFlowerScorePfb: Prefab = null;

  @property
  shoeFlowerScoreFloatDuration: number = 1.5;

  @property
  shoeFlowerScoreFloatEndOffsetY: number = 110;

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

  @property(Label)
  comboBuffTitleLabel: Label = null;

  @property(ScoreMilestoneBar)
  scoreMilestoneBar: ScoreMilestoneBar = null;

  /** 普通鞋花 SpriteFrame，在编辑器中拖入 */
  @property(SpriteFrame)
  normalShoeFlowerSF: SpriteFrame = null;

  /** 限量款鞋花 SpriteFrame，在编辑器中拖入 */
  @property(SpriteFrame)
  limitedShoeFlowerSF: SpriteFrame = null;

  /** 普通鞋花资源目录（resources 内路径） */
  @property
  normalShoeFlowerDir: string = 'image/game/normal';

  /** 限量鞋花资源目录（resources 内路径） */
  @property
  limitedShoeFlowerDir: string = 'image/game/limited';

  /** 限量鞋花序列帧 fps */
  @property
  limitedShoeFlowerFps: number = 24;

  /** 爆炸特效 SpriteFrame（拖入 boom.png/spriteFrame） */
  @property(SpriteFrame)
  boomSF: SpriteFrame = null;

  /** 球碰左墙动效图（hitLeft.png） */
  @property(SpriteFrame)
  hitLeftSF: SpriteFrame = null;

  /** 球碰右墙动效图（hitRight.png） */
  @property(SpriteFrame)
  hitRightSF: SpriteFrame = null;

  /** 球碰球拍动效图（hitPaddle.png） */
  @property(SpriteFrame)
  hitPaddleSF: SpriteFrame = null;

  /** 暂停/继续 按钮节点（编辑器拖入） */
  @property(Node)
  pauseBtn: Node = null;

  /** 暂停状态下显示的图标（"▶" 继续图标），游戏运行时隐藏 */
  @property(Node)
  resumeIcon: Node = null;

  /** 游戏运行时显示的图标（"II" 暂停图标），暂停时隐藏 */
  @property(Node)
  pauseIcon: Node = null;

  // ----------------------------------------------------------------
  // 内部状态
  // ----------------------------------------------------------------

  /** uid → Node 的映射，用于按 uid 更新/销毁鞋花节点 */
  private shoeFlowerNodes: Map<number, IShoeFlowerViewState> = new Map();

  /** 当前场上正在播放的鞋花得分飘字 */
  private shoeFlowerScoreNodes: Set<Node> = new Set();

  /** 当前仍在播放命中消失动画的鞋花节点 */
  private shoeFlowerFxNodes: Set<Node> = new Set();

  /** 当前正在播放的提示优先级：0=无 1=随机 2=连击 3=鞋花 */
  private _hintPriority: number = 0;

  /** 随机提示计数器，每 3 次颠球触发一次 */
  private _randomHintCounter: number = 0;

  /** 球拍基础 Y 坐标（由 prefab 决定，不随动画变化） */
  private _paddleBaseY: number = 0;

  /** 触摸开始时手指的世界 Y 坐标（用于计算相对位移） */
  private _touchStartWorldY: number = 0;
  /** 触摸开始时球拍的 Y 坐标 */
  private _touchStartPaddleY: number = 0;

  /** 颠球动画当前 Y 偏移（正弦曲线，0→峰值→0） */
  private _paddleSprite: Sprite = null;

  /** 颠球动画计时器，-1 表示未播放 */
  private _paddleHitFrameTimer: number = -1;

  /** 颠球动画总时长（秒） */

  /** 普通鞋花候选图集（运行时从目录加载） */
  private _normalShoeFlowerPool: SpriteFrame[] = [];

  /** 限量鞋花候选帧序列池（每个子目录一组帧，运行时从子目录加载） */
  private _limitedFramePools: SpriteFrame[][] = [];

  private bestScoreLabel: Label | null = null;
  /** 调试：球拍碰撞盒绘制组件（ShowPaddleHitBox=true 时创建） */
  private _hitBoxGraphics: Graphics | null = null;
  /** 调试：鞋花碰撞圆绘制组件（ShowShoeFlowerHitBox=true 时创建） */
  private _shoeFlowerHitBoxGraphics: Graphics | null = null;


  // ----------------------------------------------------------------
  // 生命周期
  // ----------------------------------------------------------------

  protected onLoad(): void {
    // 注册所有 PingPang 事件
    this.onUiEvent(PingPangEvent.gameStart, this.onGameStart);
    this.onUiEvent(PingPangEvent.gameOver, this.onGameOver);
    this.onUiEvent(PingPangEvent.ballUpdate, this.onBallUpdate);
    this.onUiEvent(PingPangEvent.ballHitPaddle, this.onBallHitPaddle);
    this.onUiEvent(PingPangEvent.ballHitWallLeft, this.onBallHitWallLeft);
    this.onUiEvent(PingPangEvent.ballHitWallRight, this.onBallHitWallRight);
    this.onUiEvent(PingPangEvent.ballFall, this.onBallFall);
    this.onUiEvent(PingPangEvent.paddleMove, this.onPaddleMove);
    this.onUiEvent(PingPangEvent.scoreUpdate, this.onScoreUpdate);
    this.onUiEvent(PingPangEvent.comboUpdate, this.onComboUpdate);
    this.onUiEvent(PingPangEvent.comboBuff, this.onComboBuff);
    this.onUiEvent(PingPangEvent.timeUpdate, this.onTimeUpdate);
    this.onUiEvent(PingPangEvent.shoeFlowerSpawn, this.onShoeFlowerSpawn);
    this.onUiEvent(PingPangEvent.shoeFlowerUpdate, this.onShoeFlowerUpdate);
    this.onUiEvent(PingPangEvent.shoeFlowerHit, this.onShoeFlowerHit);
    this.onUiEvent(PingPangEvent.shoeFlowerMiss, this.onShoeFlowerMiss);
    this.onUiEvent(PingPangEvent.difficultyPhaseChange, this.onDifficultyPhaseChange);
    this.onUiEvent(RewardInfoUpdateEvent, this._refreshBestScoreLabel);

    // 拖拽输入：触摸跟随手指 X 位置
    this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    this.backNode.on(Node.EventType.TOUCH_END, this.goHome, this);

    // 暂停按钮：阻止事件冒泡到游戏区域
    if (this.pauseBtn) {
      this.pauseBtn.on(Node.EventType.TOUCH_END, this._onPauseBtnClick, this);
      this.pauseBtn.on(Node.EventType.TOUCH_START, (e: any) => e.propagationStopped = true, this);
      this.pauseBtn.on(Node.EventType.TOUCH_MOVE, (e: any) => e.propagationStopped = true, this);
    }

    // 初始隐藏提示文字
    if (this.difficultyHintLabel) this.difficultyHintLabel.node.active = false;
    if (this.comboBuffHintLabel) {
      Tween.stopAllByTarget(this.comboBuffHintLabel.node);
      this.comboBuffHintLabel.node.active = false;
    }
    if (this.comboBuffTitleLabel) this.comboBuffTitleLabel.node.active = false;
    if (this.comboLabel) this.comboLabel.node.active = false;

    this._paddleSprite = this._findSprite(this.paddleNode);
    if (!this.paddleNormalSF) {
      this.paddleNormalSF = this._paddleSprite?.spriteFrame ?? null;
    }
    this._restorePaddleSprite();
    this.bestScoreLabel = this.node.getChildByPath('best/score/num')?.getComponent(Label) ?? null;
    this._refreshBestScoreLabel();

    this._loadShoeFlowerSpritePools();
    this.scoreMilestoneBar?.setVideoTriggerHandler(() => this._openMilestoneVideoPopup());

    // 调试：初始化碰撞盒绘制节点
    if (ShowPaddleHitBox) {
      const dbgNode = new Node('_PaddleHitBox');
      dbgNode.parent = this.node;
      this._hitBoxGraphics = dbgNode.addComponent(Graphics);
    }
    if (ShowShoeFlowerHitBox) {
      const dbgNode = new Node('_ShoeFlowerHitBox');
      dbgNode.parent = this.node;
      this._shoeFlowerHitBoxGraphics = dbgNode.addComponent(Graphics);
    }
  }

  protected start(): void {
    pingPangControl.startGame();
  }

  protected update(dt: number): void {
    pingPangControl.update(dt);
    if (pingPangControl.isPaused) return;

    // 颠球动画：拍面沿 Y 轴向上弹起再落回
    this._tickPaddleHitFrame(dt);
    this._tickShoeFlowerEffects(dt);
    this._drawPaddleHitBox();
    this._drawShoeFlowerHitBoxes();
  }

  // ----------------------------------------------------------------
  // 触摸输入
  // ----------------------------------------------------------------

  private onTouchStart(e: any): void {
    if (pingPangControl.isPaused) return;
    this._touchStartWorldY = e.getUILocation().y - 667;
    this._touchStartPaddleY = this._paddleBaseY;
    const worldX = e.getUILocation().x - 375;
    pingPangControl.dragPaddleTo(worldX, this._paddleBaseY, [-280, 280], [PaddleMoveMinY, PaddleMoveMaxY]);
  }

  private onTouchMove(e: any): void {
    const loc = e.getUILocation();
    const worldX = loc.x - 375;
    const deltaY = (loc.y - 667) - this._touchStartWorldY;
    const newPaddleY = this._touchStartPaddleY + deltaY;
    pingPangControl.dragPaddleTo(worldX, newPaddleY, [-280, 280], [PaddleMoveMinY, PaddleMoveMaxY]);
  }

  private onTouchEnd(): void { }

  private _onPauseBtnClick(e: any): void {
    e.propagationStopped = true;
    if (!pingPangControl.isPaused) {
      pingPangControl.pauseGame();
    } else {
      pingPangControl.resumeGame();
    }
    this._updatePauseBtn();
  }

  private _updatePauseBtn(): void {
    const paused = pingPangControl.isPaused;
    if (this.pauseIcon) this.pauseIcon.active = !paused;
    if (this.resumeIcon) this.resumeIcon.active = paused;
  }

  // ----------------------------------------------------------------
  // 游戏流程事件
  // ----------------------------------------------------------------

  private onGameStart(): void {
    // 重置分数/连颠/时间显示
    if (this.scoreLabel) this.scoreLabel.string = '0';
    this._refreshBestScoreLabel();
    if (this.comboBuffHintLabel) {
      Tween.stopAllByTarget(this.comboBuffHintLabel.node);
      this.comboBuffHintLabel.node.active = false;
    }
    this._hideComboBuffTitle();
    if (this.comboLabel) this.comboLabel.node.active = false;
    if (this.timerLabel) this.timerLabel.string = this._formatElapsedTime(0);

    // 清空残留鞋花节点
    this.shoeFlowerNodes.forEach(state => this._disposeShoeFlowerNode(state.node));
    this.shoeFlowerNodes.clear();
    Array.from(this.shoeFlowerFxNodes).forEach(node => this._disposeShoeFlowerNode(node));
    this.shoeFlowerFxNodes.clear();
    Array.from(this.shoeFlowerScoreNodes).forEach(node => this._disposeShoeFlowerScoreNode(node));
    this.shoeFlowerScoreNodes.clear();

    // 重置提示状态
    this._hintPriority = 0;
    this._randomHintCounter = 0;
    const initialScore = Math.min(userControl.getRecordMaxScore(), PingPangProgressMaxScore);
    this.scoreMilestoneBar?.reset(initialScore);

    // 将球/球拍初始化到对应位置
    if (this.ballNode) this.ballNode.setPosition(BallInitX, BallInitY, 0);
    if (this.paddleNode) {
      this.paddleNode.setPosition(pingPangControl.getPaddleX(), PaddleInitY, 0);
      this._paddleBaseY = PaddleInitY;
      this._paddleHitFrameTimer = -1;
      this._restorePaddleSprite();
      pingPangControl.syncPaddleY(this._paddleBaseY);
    }
    this._updatePauseBtn();
  }

  private onGameOver(result: IPingPangResult): void {
    userControl.updateRecordMaxScore(result.score);
    this._refreshBestScoreLabel(result.score);
    this.pageManager.showUI(UI_PATH.RESULT, UILayer.MIDDLE, (node: Node) => {
      node.getComponent(ResultPopup)?.show(result);
    });
  }

  // ----------------------------------------------------------------
  // 球事件
  // ----------------------------------------------------------------

  private onBallUpdate(x: number, y: number, _vx: number, _vy: number): void {
    this.ballNode?.setPosition(x, y, 0);
  }

  private onBallHitPaddle(x: number, y: number): void {
    // 按配置间隔显示随机激励提示（最低优先级）
    if (RandomHintHitInterval > 0) {
      this._randomHintCounter++;
      if (this._randomHintCounter >= RandomHintHitInterval) {
        this._randomHintCounter = 0;
        const text = RandomHintTexts[Math.floor(Math.random() * RandomHintTexts.length)];
        this._showHint(text, 1);
      }
    }

    // 播放颠球音效
    userControl.playSFX('audio/hit')

    // 震屏反馈
    this._playScreenShake(3, 0.16);

    // 颠球动作：拍面向上抬起，手柄位置不动
    this._playPaddleHitFrame();

    // 碰拍动效
    this._playHitEffect(this.hitPaddleSF, x, y);
  }

  private onBallHitWallLeft(x: number, y: number): void {
    this._playHitEffect(this.hitLeftSF, x, y);
  }

  private onBallHitWallRight(x: number, y: number): void {
    this._playHitEffect(this.hitRightSF, x, y);
  }

  /**
   * 在碰撞点播放一次性动效图：弹出 → 淡出消失
   */
  private _playHitEffect(sf: SpriteFrame, x: number, y: number): void {
    if (!sf) return;
    const node = new Node('HitFx');
    node.parent = this.node;
    node.setPosition(x, y, 0);
    node.addComponent(UITransform);
    const sprite = node.addComponent(Sprite);
    sprite.spriteFrame = sf;
    sprite.sizeMode = Sprite.SizeMode.TRIMMED;
    const opacity = node.addComponent(UIOpacity);
    opacity.opacity = 255;
    node.setScale(0.5, 0.5, 1);

    tween(node)
      .to(0.08, { scale: new Vec3(0.9, 0.9, 1) })
      .to(0.18, { scale: new Vec3(0.8, 0.8, 1) })
      .call(() => { if (node.isValid) node.destroy(); })
      .start();
    tween(opacity)
      .delay(0.06)
      .to(0.2, { opacity: 0 })
      .start();
  }

  private onBallFall(): void {
    // TODO: 播放落地音效
  }

  // ----------------------------------------------------------------
  // 球拍事件
  // ----------------------------------------------------------------

  private onPaddleMove(x: number, y?: number): void {
    if (!this.paddleNode) return;
    const newY = y !== undefined ? y : this._paddleBaseY;
    this._paddleBaseY = newY;
    this.paddleNode.setPosition(x, newY, 0);
  }

  private _tickPaddleHitFrame(dt: number): void {
    if (this._paddleHitFrameTimer < 0) return;

    this._paddleHitFrameTimer += dt;
    if (this._paddleHitFrameTimer >= Math.max(0.02, this.paddleHitFrameDuration)) {
      this._paddleHitFrameTimer = -1;
      this._restorePaddleSprite();
    }
  }

  private _playPaddleHitFrame(): void {
    if (!this.paddleHitSF && !this.paddleNormalSF) return;

    this._paddleHitFrameTimer = 0;
    this._setPaddleSprite(this.paddleHitSF ?? this.paddleNormalSF);
  }

  private _restorePaddleSprite(): void {
    this._setPaddleSprite(this.paddleNormalSF);
  }

  private _setPaddleSprite(spriteFrame: SpriteFrame | null): void {
    if (!this._paddleSprite) {
      this._paddleSprite = this._findSprite(this.paddleNode);
    }
    if (!this._paddleSprite || !spriteFrame) return;
    this._paddleSprite.spriteFrame = spriteFrame;
  }

  // ----------------------------------------------------------------
  // 得分 / 连颠事件
  // ----------------------------------------------------------------

  private onScoreUpdate(score: number, _delta: number): void {
    if (this.scoreLabel) this.scoreLabel.string = `${score}`;
    this._refreshBestScoreLabel(score);
    this.scoreMilestoneBar?.setScore(score);
  }

  private _openMilestoneVideoPopup(): void {
    pingPangControl.pauseGame();
    this.pageManager.showUI(UI_PATH.VIDEO, UILayer.TOP, (node: Node) => {
      node.getComponent(VideoPopup)?.setCloseCallback(() => {
        pingPangControl.resumeGame();
      });
    });
  }

  private onComboUpdate(combo: number): void {
    if (!this.comboLabel) return;
    // if (combo <= 1) {
    //   this.comboLabel.node.active = false;
    // } else {
    //   this.comboLabel.node.active = true;
    //   this.comboLabel.string = `x${combo}`;
    // }
  }

  /**
   * 统一提示显示，priority: 1=随机 2=连击 3=鞋花
   * 低优先级不打断高优先级正在播放的提示
   */
  private _showHint(text: string, priority: number): void {
    if (priority < this._hintPriority) return;

    if (priority !== 2) {
      this._hideComboBuffTitle();
    }

    if (!this.comboBuffHintLabel) return;

    const label = this.comboBuffHintLabel;
    Tween.stopAllByTarget(label.node);
    this._hintPriority = priority;

    label.string = text;
    // label.color = new Color(30, 144, 255, 255); // 蓝色
    label.node.active = true;
    // label.node.setPosition(0, 0, 0);
    // label.node.setScale(1, 1, 1);

    tween(label.node)
      .to(1.5, { scale: new Vec3(1.1, 1.1, 1) })
      .call(() => {
        label.node.active = false;
        this._hintPriority = 0;
      })
      .start();
  }

  /** 显示连击标题，例如“10连击！” */
  private _showComboBuffTitle(text: string): void {
    if (!this.comboBuffTitleLabel) return;

    const label = this.comboBuffTitleLabel;
    Tween.stopAllByTarget(label.node);
    label.string = text;
    label.node.active = !!text;
    if (!text) return;

    tween(label.node)
      .to(1.5, { scale: new Vec3(1.1, 1.1, 1) })
      .call(() => {
        label.node.active = false;
      })
      .start();
  }

  private _hideComboBuffTitle(): void {
    if (!this.comboBuffTitleLabel) return;

    Tween.stopAllByTarget(this.comboBuffTitleLabel.node);
    this.comboBuffTitleLabel.node.active = false;
  }

  /** 连颠 Buff 触发时，同时显示标题和提示文案 */
  private onComboBuff(_bonus: number, title: string, desc: string): void {
    this._showComboBuffTitle(title);
    this._showHint(desc, 2);
  }

  // ----------------------------------------------------------------
  // 计时事件
  // ----------------------------------------------------------------

  private onTimeUpdate(elapsedSeconds: number): void {
    if (this.timerLabel) {
      this.timerLabel.string = this._formatElapsedTime(elapsedSeconds);
    }
  }

  // ----------------------------------------------------------------
  // 鞋花事件
  // ----------------------------------------------------------------

  private onShoeFlowerSpawn(flower: IShoeFlower): void {
    if (!this.shoeFlowerPfb || !this.shoeFlowerLayer) return;

    const node = instantiate(this.shoeFlowerPfb);
    node.parent = this.shoeFlowerLayer;
    // flower.x/y 是游戏逻辑坐标（与 ballNode 同一空间：this.node 本地坐标系）
    // shoeFlowerLayer 运行时可能因 Widget/父节点产生偏移，需转换到其本地空间
    const worldPos = new Vec3(flower.x, flower.y, 0);
    Vec3.transformMat4(worldPos, worldPos, this.node.worldMatrix);
    this.shoeFlowerLayer.inverseTransformPoint(worldPos, worldPos);
    node.setPosition(worldPos);
    node.angle = 0;

    // 根据类型切换 SpriteFrame（在编辑器拖入资源后生效）
    const sprite = node.getComponent(Sprite);
    if (sprite) {
      sprite.sizeMode = Sprite.SizeMode.TRIMMED;
      sprite.trim = true;
    }

    let animPlayer: AnimationPlayer | undefined;
    if (flower.type === eShoeFlowerType.limited && this._limitedFramePools.length > 0 && sprite) {
      const poolIndex = Math.floor(Math.random() * this._limitedFramePools.length);
      const frames = this._limitedFramePools[poolIndex];
      animPlayer = node.addComponent(AnimationPlayer);
      animPlayer.initFrame(sprite, frames, this.limitedShoeFlowerFps);
      animPlayer.play(true);
    } else if (sprite) {
      sprite.spriteFrame = this._pickShoeFlowerSpriteFrame();
    }

    const opacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
    opacity.opacity = 255;

    this.shoeFlowerNodes.set(flower.uid, {
      node,
      opacity,
      remainingLifetime: flower.lifetime,
      totalLifetime: flower.lifetime,
      baseScale: new Vec3(node.scale.x, node.scale.y, node.scale.z),
      baseAngle: node.angle,
      animPlayer,
    });
  }

  private onShoeFlowerUpdate(uid: number, y: number): void {
    const node = this.shoeFlowerNodes.get(uid)?.node;
    if (node) node.setPosition(node.position.x, y, 0);
  }

  private onShoeFlowerHit(hitData: IShoeFlowerHitEffectData): void {
    const type = (hitData.type as eShoeFlowerType) ?? eShoeFlowerType.normal;
    this._showHint(ShoeFlowerHitHint[type], 3);
    this._playScreenShake(6, 0.22);
    this._playShoeFlowerHitEffect(hitData.uid);
    this._showShoeFlowerScore(hitData);
    if (type === eShoeFlowerType.limited) {
      this._playBoomEffect(hitData.x, hitData.y);
    }
    // TODO: 播放消除特效/音效
    if (type === eShoeFlowerType.limited) {
      userControl.playSFX('audio/hitLimt');
    } else {
      userControl.playSFX('audio/hitFlower');
    }
  }

  private onShoeFlowerMiss(uid: number): void {
    this._removeShoeFlowerNode(uid);
  }

  private _removeShoeFlowerNode(uid: number): void {
    const node = this.shoeFlowerNodes.get(uid)?.node;
    if (node) this._disposeShoeFlowerNode(node);
    this.shoeFlowerNodes.delete(uid);
  }

  private _tickShoeFlowerEffects(dt: number): void {
    this.shoeFlowerNodes.forEach(state => {
      if (!state.node || !state.node.isValid) return;

      state.remainingLifetime = Math.max(0, state.remainingLifetime - dt);
      const warnWindow = Math.min(ShoeFlowerExpireWarnTime, state.totalLifetime);
      if (warnWindow <= 0 || state.remainingLifetime > warnWindow) {
        this._resetShoeFlowerVisual(state);
        return;
      }

      const warnElapsed = warnWindow - state.remainingLifetime;
      const progress = Math.max(0, Math.min(1, warnElapsed / warnWindow));
      const cycle = Math.max(0.05, ShoeFlowerExpireBlinkInterval);
      const pulse = 0.5 - 0.5 * Math.cos((warnElapsed / cycle) * Math.PI * 2);
      const strength = 0.35 + 0.65 * progress;
      const amount = pulse * strength;
      const opacity = Math.round(255 - (255 - ShoeFlowerExpireWarnMinOpacity) * amount);
      const scaleMul = 1 + (ShoeFlowerExpireWarnScale - 1) * amount;
      this._applyShoeFlowerVisual(state, scaleMul, opacity, state.baseAngle);
    });
  }

  private _playShoeFlowerHitEffect(uid: number): void {
    const state = this.shoeFlowerNodes.get(uid);
    if (!state) return;

    this.shoeFlowerNodes.delete(uid);
    if (!state.node || !state.node.isValid) return;

    this._resetShoeFlowerVisual(state);
    this.shoeFlowerFxNodes.add(state.node);

    const baseScale = state.baseScale;
    const duration = Math.max(0.12, ShoeFlowerHitSwingDuration);
    const step = duration / 4;
    const smallScale = new Vec3(baseScale.x * 0.97, baseScale.y * 0.97, baseScale.z);
    const mediumScale = new Vec3(baseScale.x * 0.95, baseScale.y * 0.95, baseScale.z);
    const finishScale = new Vec3(baseScale.x * 0.88, baseScale.y * 0.88, baseScale.z);

    Tween.stopAllByTarget(state.node);
    Tween.stopAllByTarget(state.opacity);

    const popScale = new Vec3(baseScale.x * 1.35, baseScale.y * 1.35, baseScale.z);
    tween(state.node)
      .to(0.08, { scale: popScale, angle: state.baseAngle })
      .to(step, {
        angle: state.baseAngle - ShoeFlowerHitSwingAngle,
        scale: smallScale,
      })
      .to(step, {
        angle: state.baseAngle + ShoeFlowerHitSwingAngle,
        scale: new Vec3(baseScale.x, baseScale.y, baseScale.z),
      })
      .to(step, {
        angle: state.baseAngle - ShoeFlowerHitSwingAngle * 0.65,
        scale: mediumScale,
      })
      .to(step, {
        angle: state.baseAngle,
        scale: finishScale,
      })
      .call(() => this._disposeAnimatedShoeFlowerNode(state.node))
      .start();

    tween(state.opacity)
      .delay(0.08)
      .to(duration, { opacity: 0 })
      .start();
  }

  private _applyShoeFlowerVisual(
    state: IShoeFlowerViewState,
    scaleMul: number,
    opacity: number,
    angle: number,
  ): void {
    state.node.setScale(
      state.baseScale.x * scaleMul,
      state.baseScale.y * scaleMul,
      state.baseScale.z,
    );
    state.node.angle = angle;
    state.opacity.opacity = opacity;
  }

  private _resetShoeFlowerVisual(state: IShoeFlowerViewState): void {
    this._applyShoeFlowerVisual(state, 1, 255, state.baseAngle);
  }

  private _disposeAnimatedShoeFlowerNode(node: Node): void {
    this.shoeFlowerFxNodes.delete(node);
    this._disposeShoeFlowerNode(node);
  }

  private _disposeShoeFlowerNode(node: Node): void {
    if (!node || !node.isValid) return;
    Tween.stopAllByTarget(node);
    const opacity = node.getComponent(UIOpacity);
    if (opacity) Tween.stopAllByTarget(opacity);
    const animPlayer = node.getComponent(AnimationPlayer);
    if (animPlayer) animPlayer.stop();
    node.active = false;
    node.destroy();
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

  private async _loadShoeFlowerSpritePools(): Promise<void> {
    const limitedFolderCount = 12;
    const tasks: Promise<SpriteFrame[]>[] = [
      getShoeFlowerSpritePool('normal', this.normalShoeFlowerDir),
      ...Array.from({ length: limitedFolderCount }, (_, i) =>
        getSpriteFramesByDir(`${this.limitedShoeFlowerDir}/${i + 1}`)
      ),
    ];
    const [normalPool, ...limitedPools] = await Promise.all(tasks);

    this._normalShoeFlowerPool = normalPool;
    this._limitedFramePools = limitedPools.filter(p => p.length > 0);

    console.log(`[ShoeFlower] sprite pool loaded: normal=${this._normalShoeFlowerPool.length}, limited folders=${this._limitedFramePools.length}`);
  }

  private _pickShoeFlowerSpriteFrame(): SpriteFrame {
    const pool = this._normalShoeFlowerPool;
    if (pool.length > 0) {
      return pool[Math.floor(Math.random() * pool.length)];
    }
    return this.normalShoeFlowerSF;
  }

  private _showShoeFlowerScore(hitData: IShoeFlowerHitEffectData): void {
    const parent = this.node;
    if (!parent) return;
    const totalDuration = Math.max(0.6, this.shoeFlowerScoreFloatDuration);
    const popDuration = Math.min(0.16, totalDuration * 0.12);
    const floatDuration = Math.max(0.3, totalDuration - popDuration);
    const fadeDelay = Math.min(0.2, totalDuration * 0.14);
    const fadeDuration = Math.max(0.3, totalDuration - fadeDelay);
    const endOffsetY = this.shoeFlowerScoreFloatEndOffsetY;

    const usingCustomPrefab = !!this.shoeFlowerScorePfb;
    const node = usingCustomPrefab
      ? instantiate(this.shoeFlowerScorePfb)
      : this._createDefaultShoeFlowerScoreNode();
    const label = this._findLabel(node) ?? node.addComponent(Label);
    const opacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
    node.getComponent(UITransform) ?? node.addComponent(UITransform);

    node.parent = parent;
    node.active = true;
    node.setPosition(hitData.x, hitData.y + 12, 0);
    node.setScale(0.92, 0.92, 1);
    label.string = `+${hitData.score}`;
    if (!usingCustomPrefab) {
      label.color = this._getShoeFlowerScoreColor(hitData.type);
    }
    opacity.opacity = 255;

    this.shoeFlowerScoreNodes.add(node);

    tween(node)
      .to(popDuration, { scale: new Vec3(1.06, 1.06, 1) })
      .to(floatDuration, { position: new Vec3(hitData.x, hitData.y + endOffsetY, 0), scale: new Vec3(1, 1, 1) })
      .call(() => this._disposeShoeFlowerScoreNode(node))
      .start();

    tween(opacity)
      .delay(fadeDelay)
      .to(fadeDuration, { opacity: 0 })
      .start();
  }

  private _createDefaultShoeFlowerScoreNode(): Node {
    const node = new Node('ShoeFlowerScore');
    node.addComponent(UITransform);
    const label = node.addComponent(Label);
    label.fontSize = 34;
    label.lineHeight = 36;
    return node;
  }

  private _playBoomEffect(x: number, y: number): void {
    if (!this.boomSF) return;
    const parent = this.node;
    const node = new Node('BoomFx');
    node.parent = parent;
    node.setPosition(x, y, 0);
    node.setScale(0.5, 0.5, 1);
    node.addComponent(UITransform);
    const sprite = node.addComponent(Sprite);
    sprite.spriteFrame = this.boomSF;
    sprite.sizeMode = Sprite.SizeMode.TRIMMED;
    const opacity = node.addComponent(UIOpacity);
    opacity.opacity = 255;

    tween(node)
      .to(0.35, { scale: new Vec3(1.5, 1.5, 1) })
      .call(() => { if (node.isValid) node.destroy(); })
      .start();
    tween(opacity)
      .to(0.35, { opacity: 0 })
      .start();
  }

  private _disposeShoeFlowerScoreNode(node: Node): void {
    Tween.stopAllByTarget(node);
    const opacity = node.getComponent(UIOpacity);
    if (opacity) Tween.stopAllByTarget(opacity);
    this.shoeFlowerScoreNodes.delete(node);
    node.destroy();
  }

  /**
   * 屏幕震动（垂直抖动）
   * @param amplitude 震幅（像素），默认 4
   * @param duration  总时长（秒），默认 0.16
   */
  /** 调试：每帧重绘球拍碰撞盒（红色半透明矩形 + 顶边线） */
  private _drawPaddleHitBox(): void {
    if (!this._hitBoxGraphics || !this.paddleNode) return;
    const g = this._hitBoxGraphics;
    const px = this.paddleNode.position.x;
    const py = this._paddleBaseY;
    const hw = PaddleWidth / 2;
    const hh = PaddleHeight / 2;
    g.clear();
    // 填充半透明红
    g.fillColor = new Color(255, 0, 0, 60);
    g.rect(px - hw, py - hh, PaddleWidth, PaddleHeight);
    g.fill();
    // 描边
    g.strokeColor = new Color(255, 0, 0, 200);
    g.lineWidth = 2;
    g.rect(px - hw, py - hh, PaddleWidth, PaddleHeight);
    g.stroke();
    // 顶边加粗显示命中判定线
    g.strokeColor = new Color(255, 220, 0, 255);
    g.lineWidth = 3;
    g.moveTo(px - hw, py + hh);
    g.lineTo(px + hw, py + hh);
    g.stroke();
  }

  private _drawShoeFlowerHitBoxes(): void {
    if (!this._shoeFlowerHitBoxGraphics) return;
    const g = this._shoeFlowerHitBoxGraphics;
    g.clear();
    for (const flower of pingPangControl.getShoeFlowers()) {
      g.fillColor = new Color(0, 220, 255, 50);
      g.circle(flower.x, flower.y, ShoeFlowerRadius);
      g.fill();
      g.strokeColor = new Color(0, 220, 255, 210);
      g.lineWidth = 2;
      g.circle(flower.x, flower.y, ShoeFlowerRadius);
      g.stroke();
    }
  }

  private _playScreenShake(amplitude: number = 3, duration: number = 0.16): void {
    Tween.stopAllByTarget(this.node);
    this.node.setPosition(0, 0, 0);
    const s = duration / 5;
    tween(this.node)
      .to(s, { position: new Vec3(0, amplitude, 0) })
      .to(s, { position: new Vec3(0, -amplitude, 0) })
      .to(s, { position: new Vec3(0, amplitude * 0.5, 0) })
      .to(s, { position: new Vec3(0, -amplitude * 0.5, 0) })
      .to(s, { position: new Vec3(0, 0, 0) })
      .start();
  }

  private _findSprite(node: Node | null): Sprite | null {
    if (!node) return null;

    const sprite = node.getComponent(Sprite);
    if (sprite) return sprite;

    for (const child of node.children) {
      const found = this._findSprite(child);
      if (found) return found;
    }
    return null;
  }

  private _findLabel(node: Node): Label | null {
    const label = node.getComponent(Label);
    if (label) return label;

    for (const child of node.children) {
      const found = this._findLabel(child);
      if (found) return found;
    }
    return null;
  }

  private _getShoeFlowerScoreColor(type: number): Color {
    if (type === eShoeFlowerType.limited) {
      return new Color(255, 214, 88, 255);
    }
    return new Color(255, 245, 170, 255);
  }

  private _formatElapsedTime(totalSeconds: number): string {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    const minuteText = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const secondText = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `${minuteText}:${secondText}`;
  }

  private _refreshBestScoreLabel(currentScore?: number): void {
    if (!this.bestScoreLabel) return;
    const bestScore = Math.max(userControl.getRecordMaxScore(), currentScore ?? 0);
    this.bestScoreLabel.string = `${bestScore}`;
  }

  public goHome() {
    this.pageManager.showUI(UI_PATH.HOME, UILayer.MIDDLE, () => {
      this.pageManager.removeUI(this.node);
    });
  }
}
