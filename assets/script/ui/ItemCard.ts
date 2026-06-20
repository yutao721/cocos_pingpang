import { _decorator, Component, Node, Sprite } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';
import { getItemSprite } from '../utils/utils';
const { ccclass, property } = _decorator;

@ccclass('ItemCard')
export class ItemCard extends UiBase {
    
    @property(Sprite)
    public itemSprite: Sprite = null;

    private itemId: number = 0;

    public get itemIdVal() {
        return this.itemId;
    }

    public setItemSprite(id: number) {
        this.itemId = id;
        getItemSprite(id, 'icon').then(spriteFrame => {
            this.itemSprite.spriteFrame = spriteFrame;
        });
    }

}


