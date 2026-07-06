import { _decorator, Component, Node, ProgressBar, Sprite, Vec3 } from 'cc';
import {
  IPingPangProgressMilestone,
  PingPangProgressMaxScore,
  PingPangProgressMilestones,
} from '../const/PingPangProgressConfig';

const { ccclass, property } = _decorator;

@ccclass('ScoreMilestoneBar')
export class ScoreMilestoneBar extends Component {
  @property(ProgressBar)
  progressBar: ProgressBar = null;

  @property(Node)
  markerNode: Node = null;

  @property(Node)
  markerStart: Node = null;

  @property(Node)
  markerEnd: Node = null;

  /** 到第一个节点时短暂出现的视频按钮。 */
  @property(Node)
  videoBtn: Node = null;

  /**
   * 里程碑节点，顺序需要和配置一致：
   * 100 / 300 / 500
   */
  @property([Node])
  milestoneNodes: Node[] = [];

  private readonly _milestones: ReadonlyArray<IPingPangProgressMilestone> = PingPangProgressMilestones;
  private _lastScore = 0;
  private _videoTriggerHandler: (() => void) | null = null;
  private _firstMilestoneClickNode: Node | null = null;

  protected onLoad(): void {
    this._bindVideoClickTargets();
    this.reset();
  }

  protected onDestroy(): void {

  }

  /** 由页面层注入“打开视频弹窗”的动作。 */
  public setVideoTriggerHandler(handler: (() => void) | null): void {
    this._videoTriggerHandler = handler;
  }

  public reset(): void {
    this._lastScore = 0;
    this.setScore(0);
  }

  public setScore(score: number): void {
    const previousScore = this._lastScore;
    const safeScore = Math.max(0, score);
    this._lastScore = safeScore;

    const progress = this._getProgress(safeScore);
    if (this.progressBar) {
      this.progressBar.progress = progress;
    }

    this._updateMarker(progress);
    this._updateMilestones(previousScore, safeScore);
    this._updateVideoBtn(previousScore, safeScore);
  }

  private _bindVideoClickTargets(): void {
    if (this.videoBtn) {
      this.videoBtn.on(Node.EventType.TOUCH_END, this._onVideoBtnClick, this);
    }

    this._firstMilestoneClickNode = this._getFirstMilestoneClickNode();
    if (this._firstMilestoneClickNode) {
      this._firstMilestoneClickNode.on(
        Node.EventType.TOUCH_END,
        this._onFirstMilestoneClick,
        this,
      );
    }
  }

  private _onVideoBtnClick(): void {
    if (!this.videoBtn || !this.videoBtn.activeInHierarchy) {
      return;
    }

    this._videoTriggerHandler?.();
  }

  private _onFirstMilestoneClick(): void {
    const firstSprite = this._findSprite(this.milestoneNodes[0]);
    if (
      !firstSprite ||
      !firstSprite.enabled ||
      firstSprite.grayscale ||
      !firstSprite.node.activeInHierarchy
    ) {
      return;
    }

    this._videoTriggerHandler?.();
  }

  private _getFirstMilestoneClickNode(): Node | null {
    const firstMilestoneNode = this.milestoneNodes[0];
    if (!firstMilestoneNode) {
      return null;
    }

    return this._findSprite(firstMilestoneNode)?.node ?? firstMilestoneNode;
  }

  private _getProgress(score: number): number {
    const maxScore = this._getMaxScore();
    if (maxScore <= 0) {
      return 0;
    }

    return this._clamp01(score / maxScore);
  }

  private _getMaxScore(): number {
    if (PingPangProgressMaxScore > 0) {
      return PingPangProgressMaxScore;
    }

    const lastMilestone = this._milestones[this._milestones.length - 1];
    return lastMilestone?.score ?? 0;
  }

  private _updateMarker(progress: number): void {
    if (!this.markerNode || !this.markerStart || !this.markerEnd) {
      return;
    }

    this.markerNode.setPosition(this._getMarkerPosition(progress));
  }

  private _getMarkerPosition(progress: number): Vec3 {
    const startWorld = this.markerStart.worldPosition.clone();
    const endWorld = this.markerEnd.worldPosition.clone();
    const worldPosition = new Vec3();
    Vec3.lerp(worldPosition, startWorld, endWorld, this._clamp01(progress));

    const parent = this.markerNode.parent;
    if (!parent) {
      return worldPosition;
    }

    const localPosition = new Vec3();
    parent.inverseTransformPoint(localPosition, worldPosition);
    localPosition.z = this.markerNode.position.z;
    return localPosition;
  }

  /**
   * 未达到：显示并置灰
   * 刚跨过：隐藏一次对应 sprite
   * 继续往后得分：sprite 再显示出来
   */
  private _updateMilestones(previousScore: number, score: number): void {
    const count = Math.min(this._milestones.length, this.milestoneNodes.length);
    for (let index = 0; index < count; index++) {
      const sprite = this._findSprite(this.milestoneNodes[index]);
      if (!sprite) {
        continue;
      }

      const milestoneScore = this._milestones[index].score;
      const justReached = previousScore < milestoneScore && score >= milestoneScore;
      sprite.enabled = !justReached;
      sprite.grayscale = score < milestoneScore;
    }
  }

  /**
   * videoBtn 只在第一次跨过第一个节点时显示，
   * 分数继续往后走就隐藏。
   */
  private _updateVideoBtn(previousScore: number, score: number): void {
    if (!this.videoBtn) {
      return;
    }

    const firstMilestoneScore = this._milestones[0]?.score ?? Number.POSITIVE_INFINITY;
    this.videoBtn.active =
      previousScore < firstMilestoneScore && score >= firstMilestoneScore;
  }

  private _findSprite(node: Node | null): Sprite | null {
    if (!node) {
      return null;
    }

    const sprite = node.getComponent(Sprite);
    if (sprite) {
      return sprite;
    }

    for (const child of node.children) {
      const childSprite = this._findSprite(child);
      if (childSprite) {
        return childSprite;
      }
    }

    return null;
  }

  private _clamp01(value: number): number {
    return Math.max(0, Math.min(1, value));
  }
}
