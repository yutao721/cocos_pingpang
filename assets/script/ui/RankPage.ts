import { _decorator, instantiate, Label, Node, Sprite, SpriteFrame } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';
import { loadRemoteSpriteFrame } from '../../framework/utils/CommonFun';
import { UI_PATH } from '../const/UiConfig';
import { UILayer } from '../../framework/ui/PageManager';
import { Api } from '../api/api';

const { ccclass, property } = _decorator;

interface IRankItem {
  rank: number;
  openid: string;
  nickname: string;
  headimgurl: string;
  score: number;
}

interface IRankData {
  myrank: IRankItem;
  datas: IRankItem[];
}

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

  public async getRank() {
    try {
      const res = await Api.getRankList();
      console.log('[RankPage] getRank success', res);
      const list: IRankItem[] = res?.data?.list ?? [];
      const myrank: IRankItem = res?.data?.myrank ?? list[0];
      this.handleRank({ myrank, datas: list });
    } catch (err) {
      console.warn('[RankPage] getRank failed', err);
    }
  }

  public handleRank(data: IRankData) {
    const datas = data?.datas ?? [];
    const myrank = data?.myrank;

    // 处理我的排行榜数据
    if (myrank) {
      this.handleMyRank(myrank);
    }

    // 处理前3名
    this.handleTop3(datas.slice(0, 3));

    // 处理剩余排行榜数据
    this.handleRestRank(datas.slice(3));
  }

  public handleTop3(datas: IRankItem[]) {
    const rankNode = this.node.getChildByName('rank');
    const children = rankNode.children;
    for (let i = 0; i < children.length; i++) {
      const item = children[i];
      const itemData = datas[i];

      // 数据不足时隐藏该名次节点
      if (!itemData) {
        item.active = false;
        continue;
      }

      item.active = true;
      const rankLabel = item.getChildByPath('rank/num')?.getComponent(Label);
      const headNode = item.getChildByPath('avatarBg/Mask/avatar');
      const nameLabel = item.getChildByPath('nickname')?.getComponent(Label);
      const scoreLabel = item.getChildByPath('scoreRow/score')?.getComponent(Label);

      if (rankLabel) {
        rankLabel.string = String(itemData.rank ?? '');
      }

      if (nameLabel) {
        nameLabel.string = String(itemData.nickname ?? '');
      }

      if (scoreLabel) {
        scoreLabel.string = String(itemData.score ?? '');
      }

      if (headNode) {
        void this.loadHeadImg(headNode, String(itemData.headimgurl ?? ''));
      }
    }
  }

  public handleRestRank(datas: IRankItem[]) {
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
  public handleMyRank(data: IRankItem) {
    const item = this.node.getChildByName('mine');
    const rankLabel = item.getChildByPath('rank/num')?.getComponent(Label);
    const headNode = item.getChildByPath('head/Mask/avatar');
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
