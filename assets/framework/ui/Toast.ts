import { _decorator, Component, Node, Label, UITransform, Vec3, Widget, EventTouch, instantiate, tween, v3, UIOpacity } from 'cc';
import { UiBase } from './UiBase';

const { ccclass, property } = _decorator;

/**
 * toast提示
 * 挂载在提示节点上，模板节点结构如下：
 * toast -- tempNode(文字背景，如无则空节点) -- label
 */
@ccclass('Toast')
export class Toast extends UiBase {

    @property({ type: Node, displayName: '模板节点' })
    public templateNode: Node = null;

    @property({
        displayName: '显示文本的子节点路径',
        tooltip: '默认为label，若层级结构不同，请修改'
    })
    public labelPath: string = 'label';

    @property({
        displayName: '显示时间(秒)',
        tooltip: '默认1秒，不包括淡出动画时间'
    })
    public showTime: number = 1.0;

    @property({
        displayName: '淡出时间(秒)',
        tooltip: '默认0.8秒'
    })
    public fadeOutTime: number = 0.8;

    @property({
        displayName: '上移距离'
    })
    public diffY: number = 40;

    protected onLoad(): void {
        this.templateNode.active = false;
    }

    private showNodeArray: Node[] = [];

    public show(msg: string, delay: number = this.showTime) {
        // 实例化模板
        const node = instantiate(this.templateNode);
        node.active = true;
        node.parent = this.templateNode.parent;

        // 文本
        const labelNode = node.getChildByPath(this.labelPath);
        if (labelNode) {
            const lbl = labelNode.getComponent(Label);
            if (lbl) lbl.string = msg;
        }

        // 确保有 UIOpacity（对整个子树生效），若没有就添加一个
        let opacityComp = node.getComponent(UIOpacity);
        if (!opacityComp) {
            opacityComp = node.addComponent(UIOpacity);
        }
        opacityComp.opacity = 255;

        // 已有的tips上移
        this.showNodeArray.forEach((n) => {
            const targetPos = new Vec3(n.position.x, n.position.y + this.diffY, n.position.z);
            tween(n).to(0.16, { position: targetPos }).start();
        });

        this.showNodeArray.push(node);

        // 对 UIOpacity 做淡出（先 delay，然后 to opacity=0）
        tween(opacityComp)
            .delay(delay)
            .to(this.fadeOutTime, { opacity: 0 }, { easing: 'sineIn' })
            .call(() => {
                const idx = this.showNodeArray.indexOf(node);
                if (idx !== -1) this.showNodeArray.splice(idx, 1);
                node.destroy();
            })
            .start();
    }
}
