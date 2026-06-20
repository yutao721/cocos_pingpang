import { _decorator, instantiate, Label, Node, ProgressBar } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';
import { Api } from '../api/api';
import { MaxGeneralNum } from '../const/GameConst';
const { ccclass, property } = _decorator;

@ccclass('RankPopup')
export class RankPopup extends UiBase {

    @property(Node)
    itemNode: Node = null;

    protected onLoad(): void {
        this.itemNode.active = false;
        Api.getRankList().then((res) => {
            res.data.list.forEach((data) => {
                const node = instantiate(this.itemNode);
                node.parent = this.itemNode.parent;
                node.active = true
                const nickname = node.getChildByName('nickName').getComponent(Label);
                nickname.string = data.nickname;
                const scroll = node.getChildByName('progressBar').getComponent(ProgressBar);
                const progress = Math.floor(data.general / MaxGeneralNum * 100) / 100;
                scroll.progress = progress;
                const progressText = node.getChildByName('progressText').getComponent(Label);
                if (data.general >= MaxGeneralNum) {
                    progressText.string = '已集齐所有武将！';
                } 
                else {
                    progressText.string = (progress * 100).toString() + '%';
                }
            })
        });
    }

}


