import { _decorator, Component, Node, resources, Sprite, SpriteFrame } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';
import { getItemSprite } from '../utils/utils';
const { ccclass, property } = _decorator;

@ccclass('TaskCart')
export class TaskCart extends UiBase {
    
    @property(Sprite)
    public propSprite: Sprite = null;

    private _taskId: number = 0;

    public get taskId(): number {
        return this._taskId;
    }

    public setTask(itemId: number, taskId: number) {
        getItemSprite(itemId).then(spriteFrame => {
            this.propSprite.spriteFrame = spriteFrame;
        });
        this._taskId = taskId;
    }

}


