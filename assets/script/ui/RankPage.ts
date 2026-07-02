import { _decorator, instantiate, Label, Node, Sprite, SpriteFrame } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';
import { loadRemoteSpriteFrame } from '../../framework/utils/CommonFun';
import { UI_PATH } from '../const/UiConfig';
import { UILayer } from '../../framework/ui/PageManager';

const { ccclass, property } = _decorator;

const RANK_DATA = {
  myrank: {
    rank: 1,
    nickname: 'NuMen',
    headimgurl: 'https://usersstatic.solomochina.com/crocs/dm/avatar/202512/24/1766565681651113.png',
    score: 100,
  },
  datas: [
    {
      rank: 1,
      openid: 'oQol45ehzK1YandpPERyoCYBUB8Q',
      nickname: 'NuMen',
      headimgurl: 'https://usersstatic.solomochina.com/crocs/dm/avatar/202512/24/1766565681651113.png',
      score: 1000,
    },
    {
      rank: 2,
      openid: 'oQol45R6YStDp-i3R9YVlbotZsiQ',
      nickname: 'User2',
      headimgurl: 'https://usersstatic.solomochina.com/crocs/dm/avatar/202403/171159961960775.png',
      score: 999,
    },
    {
      rank: 3,
      openid: 'oQol45fv2odvF-YLEDdEgkjifKOQ',
      nickname: 'User3',
      headimgurl: 'https://usersstatic.solomochina.com/crocs/dm/avatar/202504/6/174391468672043.png',
      score: 566,
    },
    {
      rank: 4,
      openid: 'oQol45ehzK1YandpPERyoCYBUB8Q',
      nickname: 'NuMen1',
      headimgurl: 'https://usersstatic.solomochina.com/crocs/dm/avatar/202512/24/1766565681651113.png',
      score: 324,
    },
    {
      rank: 5,
      openid: 'oQol45R6YStDp-i3R9YVlbotZsiQ',
      nickname: 'User5',
      headimgurl: 'https://usersstatic.solomochina.com/crocs/dm/avatar/202403/171159961960775.png',
      score: 231,
    },
    {
      rank: 6,
      openid: 'oQol45fv2odvF-YLEDdEgkjifKOQ',
      nickname: 'User6',
      headimgurl: 'https://usersstatic.solomochina.com/crocs/dm/avatar/202504/6/174391468672043.png',
      score: 199,
    },
  ],
};

@ccclass('RankPage')
export class RankPage extends UiBase {
  private readonly headImgRequestMap = new WeakMap<Node, string>();
  private readonly headImgDefaultFrameMap = new WeakMap<Node, SpriteFrame | null>();

  @property(Node)
  item: Node = null;

  @property(Node)
  backNode: Node = null;

  protected onLoad(): void {
    this.item.active = false;
    this.backNode.on(Node.EventType.TOUCH_END, this.goHome, this);
  }

  protected onEnable(): void {
    this.getRank();
  }

  public getRank() {
    const data = RANK_DATA;
    this.handleRank(data);
  }

  public handleRank(data: typeof RANK_DATA) {
    const datas = data?.datas ?? [];
    const myrank = data?.myrank ?? {};

    // 处理我的排行榜数据
    this.handleMyRank(myrank as typeof RANK_DATA['myrank']);

    for (let i = 0; i < datas.length; i++) {
      const item = instantiate(this.item);
      item.parent = this.item.parent;
      item.active = true

      const rankLabel = item.getChildByPath('rank/num')?.getComponent(Label);
      const headNode = item.getChildByPath('head/Mask/avatar');
      const nameLabel = item.getChildByPath('info/nickname')?.getComponent(Label);
      const scoreLabel = item.getChildByPath('info/scoreRow/score')?.getComponent(Label);

      if (rankLabel) {
        rankLabel.string = String(datas[i].rank ?? '');
      }

      if (nameLabel) {
        nameLabel.string = String(datas[i].nickname ?? '');
      }

      if (scoreLabel) {
        scoreLabel.string = String(datas[i].score ?? '');
      }

      if (headNode) {
        void this.loadHeadImg(headNode, String(datas[i].headimgurl ?? ''));
      }
    }
  }

  // 处理我的排名
  public handleMyRank(data: typeof RANK_DATA['myrank']) {
    const item = this.node.getChildByName('mine');
    const rankLabel = item.getChildByPath('rank/num')?.getComponent(Label);
    const headNode = item.getChildByName('avatar');
    const nameLabel = item.getChildByPath('info/nickname')?.getComponent(Label);
    const scoreLabel = item.getChildByPath('info/scoreRow/score')?.getComponent(Label);


    if (rankLabel) {
      rankLabel.string = String(data.rank ?? '');
    }

    if (nameLabel) {
      nameLabel.string = String(data.nickname ?? '');
    }

    if (scoreLabel) {
      scoreLabel.string = String(data.score ?? '');
    }

    if (headNode) {
      void this.loadHeadImg(headNode, String(data.headimgurl ?? ''));
    }
  }

  public async loadHeadImg(node: Node, url: string) {
    if (!node || !node.isValid) {
      return;
    }

    const sprite = node.getComponent(Sprite);
    if (!sprite) {
      return;
    }

    if (!this.headImgDefaultFrameMap.has(node)) {
      this.headImgDefaultFrameMap.set(node, sprite.spriteFrame ?? null);
    }

    const defaultFrame = this.headImgDefaultFrameMap.get(node) ?? null;
    const requestUrl = url?.trim() ?? '';

    sprite.spriteFrame = defaultFrame;
    this.headImgRequestMap.set(node, requestUrl);

    if (!requestUrl) {
      return;
    }

    try {
      const spriteFrame = await loadRemoteSpriteFrame(requestUrl);
      if (!node.isValid || this.headImgRequestMap.get(node) !== requestUrl) {
        return;
      }

      sprite.spriteFrame = spriteFrame;
    } catch (err) {
      if (!node.isValid || this.headImgRequestMap.get(node) !== requestUrl) {
        return;
      }

      sprite.spriteFrame = defaultFrame;
      console.warn(`[RankPage] load head image failed: ${requestUrl}`, err);
    }
  }

  public goHome() {
    this.pageManager.showUI(UI_PATH.HOME, UILayer.MIDDLE, () => {
      this.pageManager.removeUI(this.node);
    });
  }
}
