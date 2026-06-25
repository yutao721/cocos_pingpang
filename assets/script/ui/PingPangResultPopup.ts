import { _decorator, Label, Node } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';
import { UILayer } from '../../framework/ui/PageManager';
import { UI_PATH } from '../const/UiConfig';
import { IPingPangResult } from '../const/Interface';
import { pingPangControl } from '../control/PingPangControl';
const { ccclass, property } = _decorator;

/**
 * 颠球游戏结算弹窗
 *
 * 节点结构（在 Prefab 中搭建）：
 *   PingPangResultPopup
 *   └─ Panel
 *      ├─ TitleLabel         "游戏结束"
 *      ├─ ScoreLabel         "xxxxx分"
 *      ├─ BtnGroup
 *      │   ├─ AgainBtn       "再来一局"
 *      │   ├─ ShareBtn       "分享战绩"
 *      │   └─ RankBtn        "排行榜"
 *      └─ (可选) MaxComboLabel / HitCountLabel 详情行
 */
@ccclass('PingPangResultPopup')
export class PingPangResultPopup extends UiBase {

    // ----------------------------------------------------------------
    // 节点绑定（在 Cocos 编辑器中拖入）
    // ----------------------------------------------------------------

    @property(Label)
    scoreLabel: Label = null;

    /** 可选：最高连颠 */
    @property(Label)
    maxComboLabel: Label = null;

    /** 可选：总颠球次数 */
    @property(Label)
    hitCountLabel: Label = null;

    @property(Node)
    againBtn: Node = null;

    @property(Node)
    shareBtn: Node = null;

    @property(Node)
    rankBtn: Node = null;

    // ----------------------------------------------------------------
    // 生命周期
    // ----------------------------------------------------------------

    protected onLoad(): void {
        this.againBtn.on(Node.EventType.TOUCH_END, this.onAgain, this);
        this.shareBtn.on(Node.EventType.TOUCH_END, this.onShare, this);
        this.rankBtn.on(Node.EventType.TOUCH_END, this.onRank, this);
    }

    // ----------------------------------------------------------------
    // 公开方法：由 PingPangPage 调用
    // ----------------------------------------------------------------

    public show(result: IPingPangResult): void {
        this.scoreLabel.string = `${result.score}分`;

        if (this.maxComboLabel) {
            this.maxComboLabel.string = `最高连颠 ${result.maxCombo} 次`;
        }
        if (this.hitCountLabel) {
            this.hitCountLabel.string = `颠球 ${result.hitCount} 次`;
        }
    }

    // ----------------------------------------------------------------
    // 按钮事件
    // ----------------------------------------------------------------

    private onAgain(): void {
        this.pageManager.removeUI(this.node);
        // 重新开始：通知 PingPangPage 重启游戏
        pingPangControl.startGame();
    }

    private onShare(): void {
        // TODO: 接入分享逻辑
    }

    private onRank(): void {
        this.pageManager.showUI(UI_PATH.RANK, UILayer.TOP);
    }
}
