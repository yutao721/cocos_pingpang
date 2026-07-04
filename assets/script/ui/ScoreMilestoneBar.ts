import { _decorator, Component, Node, ProgressBar, Sprite, Vec3 } from 'cc';
import {
  IPingPangProgressMilestone,
  PingPangProgressMaxScore,
  PingPangProgressMilestones,
} from '../const/PingPangProgressConfig';

const { ccclass, property } = _decorator;

/**
 * 极简版分数进度条。
 *
 * 编辑器里只需要拖这些引用：
 * 1. progressBar：进度条本体
 * 2. markerNode：鞋子节点
 * 3. markerStart / markerEnd：鞋子移动轨道的起点和终点
 * 4. milestoneNodes：3 个里程碑节点，顺序和配置里的分数一致
 * 5. videoBtn：第一个档位达到后显示的按钮，默认隐藏
 *
 * 这份脚本只做四件事：
 * 1. 根据分数更新进度条
 * 2. 根据进度条移动鞋子
 * 3. 未达到的里程碑 sprite 显示且置灰
 * 4. 达到里程碑后隐藏对应 sprite；达到第一个里程碑后显示 videoBtn
 *
 * 里程碑的位置完全由编辑器摆放，这里不参与布局。
 */
@ccclass('ScoreMilestoneBar')
export class ScoreMilestoneBar extends Component {
  /** 进度条组件，脚本只会改它的 progress。 */
  @property(ProgressBar)
  progressBar: ProgressBar = null;

  /** 跟随进度移动的鞋子节点。 */
  @property(Node)
  markerNode: Node = null;

  /** 鞋子移动轨道的起点。 */
  @property(Node)
  markerStart: Node = null;

  /** 鞋子移动轨道的终点。 */
  @property(Node)
  markerEnd: Node = null;

  /** 第一个里程碑达成后显示的按钮，默认隐藏。 */
  @property(Node)
  videoBtn: Node = null;

  /**
   * 3 个里程碑节点。
   * 顺序需要和 PingPangProgressMilestones 一致，比如 100 / 300 / 500。
   * 节点位置你在编辑器里手动摆，这里只负责控制 sprite 显隐和灰度。
   */
  @property([Node])
  milestoneNodes: Node[] = [];

  private readonly _milestones: ReadonlyArray<IPingPangProgressMilestone> = PingPangProgressMilestones;
  private _lastScore = 0;

  protected onLoad(): void {
    this.reset();
  }

  /** 开局重置到 0 分。 */
  public reset(): void {
    this.setScore(0);
  }

  /** 外部只要传当前分数进来就行。 */
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

  /** 用分数换算出 0~1 的进度值。 */
  private _getProgress(score: number): number {
    const maxScore = this._getMaxScore();
    if (maxScore <= 0) {
      return 0;
    }

    return this._clamp01(score / maxScore);
  }

  /** 优先用固定最大分值，没有的话退回最后一个里程碑分值。 */
  private _getMaxScore(): number {
    if (PingPangProgressMaxScore > 0) {
      return PingPangProgressMaxScore;
    }

    const lastMilestone = this._milestones[this._milestones.length - 1];
    return lastMilestone?.score ?? 0;
  }

  /** 按当前进度把鞋子移动到起点和终点之间。 */
  private _updateMarker(progress: number): void {
    if (!this.markerNode || !this.markerStart || !this.markerEnd) {
      return;
    }

    this.markerNode.setPosition(this._getMarkerPosition(progress));
  }

  /**
   * 用起点/终点做线性插值。
   * 这里用世界坐标算，再转回鞋子父节点的本地坐标，
   * 这样起点、终点、鞋子不一定非要挂在同一层级。
   */
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
   * 未达到时：
   * - sprite 显示
   * - grayscale = true
   *
   * 达到后：
   * - 隐藏对应 sprite 渲染
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

  /** 第一个里程碑达到后，显示 videoBtn；默认隐藏。 */
  private _updateVideoBtn(previousScore: number, score: number): void {
    if (!this.videoBtn) {
      return;
    }

    const firstMilestoneScore = this._milestones[0]?.score ?? Number.POSITIVE_INFINITY;
    this.videoBtn.active =
      previousScore < firstMilestoneScore && score >= firstMilestoneScore;
  }

  /**
   * 如果你拖进来的不是 Sprite 自己，而是外层节点，
   * 这里会往下找第一个 Sprite 来控制显隐和灰度。
   */
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
