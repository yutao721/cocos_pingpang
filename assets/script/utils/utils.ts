import { resources, SpriteFrame } from "cc";
import { copyToClipboard } from "../../framework/utils/CommonFun";
import { tipControl } from "../control/TipControl";
import { BundleManager } from "../../framework/bundle/BundleManager";

/**
 * 获取道具sprite frame
 * @param id 道具id
 * @param type 类型, icon:选中, game:游戏内
 * @returns 
 */
export const getItemSprite = (id: number, type: 'icon' | 'game' = 'icon'): Promise<SpriteFrame> => {
    return new Promise((resolve, reject) => {
        BundleManager.load(`image/propItem/${type}/${id}/spriteFrame`, SpriteFrame, (err, spriteFrame) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(spriteFrame);
        });
    });
}

/**
 * 获取武将sprite frame
 * @param id 武将id
 * @returns 
 */
export const getGeneralSprite = (id: number, type: 'common' | 'card' = 'common'): Promise<SpriteFrame> => {
    return new Promise((resolve, reject) => {
        BundleManager.load(`image/general/${type}/${id}/spriteFrame`, SpriteFrame, (err, spriteFrame) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(spriteFrame);
        });
    });
}

/**
 * 获取武将文案
 * @param id 
 * @param type 
 * @returns 
 */
export const getGeneralText = (id: number, type: 'obtain' | 'strategy' | 'desc' | 'name'): Promise<SpriteFrame> => {
    return new Promise((resolve, reject) => {
        BundleManager.load(`image/generalText/${type}/${id}/spriteFrame`, SpriteFrame, (err, spriteFrame) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(spriteFrame);
        });
    });
}

/**
 * 获取某位置盖在上层的item
 * @param layer 
 * @param x 
 * @param y 
 * @param mapData 
 * @returns 
 */
export const getPropTopItem = (layer: number, x: number, y: number, mapData: number[][][]) => {
    const topItemArr = [];
    for (let layerIndex = layer + 1; layerIndex < mapData.length; ++layerIndex) {
        if (mapData[layerIndex][x][y] !== 0) {
            topItemArr.push(mapData[layerIndex][x][y]);
        }
    }
    return topItemArr;
}

/**
 * 分享游戏
 */
export const shareGame = () => {
    return new Promise((resolve, reject) => {
        let shareText = '我在三国杀小游戏《木牛流马》帮助谋诸葛亮收集粮草，助力北伐！你也来试试吧！';
        shareText += window.location.href;
        copyToClipboard(shareText).then(() => {
            tipControl.showTip('链接已复制到剪切板~');
            resolve(null);
        });
    });
}