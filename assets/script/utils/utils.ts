import { SpriteFrame } from "cc";
import { copyToClipboard } from "../../framework/utils/CommonFun";
import { tipControl } from "../control/TipControl";
import { BundleManager } from "../../framework/bundle/BundleManager";

type ShoeFlowerSpriteType = 'normal' | 'limited';

const shoeFlowerDefaultDirs: Record<ShoeFlowerSpriteType, string> = {
  normal: 'image/game/normal',
  limited: 'image/game/limited',
};

const spriteFrameDirCache: Map<string, Promise<SpriteFrame[]>> = new Map();

const sortSpriteFrames = (frames: SpriteFrame[]): SpriteFrame[] => {
  return [...frames].sort((a, b) => {
    const an = Number(a.name);
    const bn = Number(b.name);
    const aIsNum = Number.isFinite(an);
    const bIsNum = Number.isFinite(bn);
    if (aIsNum && bIsNum) return an - bn;
    if (aIsNum) return -1;
    if (bIsNum) return 1;
    return a.name.localeCompare(b.name);
  });
};

/**
 * 按目录加载 SpriteFrame 列表（含缓存）
 * @param dir resources 下目录路径
 */
export const getSpriteFramesByDir = (dir: string): Promise<SpriteFrame[]> => {
  const cached = spriteFrameDirCache.get(dir);
  if (cached) return cached;

  const task = BundleManager.loadDirAsync(dir, SpriteFrame)
    .then((frames) => sortSpriteFrames((frames ?? []).filter(Boolean)))
    .catch((err) => {
      console.warn(`[SpritePool] load dir failed: ${dir}`, err);
      spriteFrameDirCache.delete(dir);
      return [];
    });

  spriteFrameDirCache.set(dir, task);
  return task;
};

/**
 * 获取鞋花图池（普通/限量）
 * @param type normal | limited
 * @param customDir 自定义目录（可选）
 */
export const getShoeFlowerSpritePool = (type: ShoeFlowerSpriteType, customDir?: string): Promise<SpriteFrame[]> => {
  const dir = customDir || shoeFlowerDefaultDirs[type];
  return getSpriteFramesByDir(dir);
};

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
