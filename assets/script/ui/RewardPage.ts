import { _decorator, Component, instantiate, Node } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';
import { RewardConfig } from '../const/GameConst';
import { RewardItem } from './RewardItem';
import { userControl } from '../control/UserControl';
const { ccclass, property } = _decorator;

@ccclass('RewardPage')
export class RewardPage extends UiBase {
    
    @property(Node)
    public rewardItem: Node = null;

    @property(Node)
    public backNode: Node = null;

    protected onLoad(): void {
        this.rewardItem.active = false;
        const config = RewardConfig;
        config.forEach((config, index) => {
            let node = instantiate(this.rewardItem);
            node.parent = this.rewardItem.parent;
            node.active = true;
            const item: RewardItem = node.getComponent(RewardItem);
            let count = 0;
            if (config.key == 'once_a_day' || config.key == 'once_a_week') {
                count = userControl.getDayGameNum();
            }
            else {
                count = userControl.getMyGeneral().length;
            }
            //const 
            const text = `<b><color=#5D402E>${config.desc}<color=#81B143>(${count}/${config.count})</color>`
            item.initRewardItem(text, config.type, config.source, config.key);
        });

        this.backNode.on(Node.EventType.TOUCH_END, () => {
            this.pageManager.removeUI(this.node);
        });
    }

}


