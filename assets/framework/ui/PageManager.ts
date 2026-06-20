import { _decorator, Node, Widget, instantiate, Prefab, assetManager, error } from 'cc';
import { BundleManager } from '../bundle/BundleManager';

/**
 * UI 层级默认定义
 */
export enum UILayer {
  BOTTOM = "bottom",
  MIDDLE = "middle",
  TOP = "top",
  SYSTEM = "system",
}

/**
 * 页面管理器
 */
export class PageManager {
  private static instance: PageManager;

  public static get Instance() {
    if (!this.instance) this.instance = new PageManager();
    return this.instance;
  }

  private uiRoot: Node = null;
  private layerMap: Map<string, Node> = new Map();
  private uiMap: Map<string, Node> = new Map();
  private defaultLayer: string = UILayer.MIDDLE;

  private constructor() {

  }

  /**
   * 初始化 UI 管理器
   * @param uiRoot 主画布节点
   * @param layers 自定义层级数组（默认使用 UILayer 枚举值）
   * @param defaultLayer 默认层级
   * @param bundleName 使用的 bundle 名称（默认 resources）
   */
  public init(
    uiRoot: Node,
    layers?: string[],
    defaultLayer: string = UILayer.MIDDLE
  ) {
    this.uiRoot = uiRoot;
    this.defaultLayer = defaultLayer;

    // 默认层级列表
    const layerList = layers || [UILayer.BOTTOM, UILayer.MIDDLE, UILayer.TOP, UILayer.SYSTEM];

    for (let i = 0; i < layerList.length; i++) {
      const layerName = layerList[i];
      const layerNode = new Node(layerName);
      layerNode.parent = this.uiRoot;

      const widget = layerNode.addComponent(Widget);
      widget.isAlignTop = true;
      widget.isAlignBottom = true;
      widget.isAlignLeft = true;
      widget.isAlignRight = true;
      widget.top = 0;
      widget.bottom = 0;
      widget.left = 0;
      widget.right = 0;

      this.layerMap.set(layerName, layerNode);
    }
  }

  /**
   * 设置默认层级
   */
  public setDefaultLayer(layer: string) {
    this.defaultLayer = layer;
  }

  /**
   * 显示 UI
   * @param prefabPath 预制体路径
   * @param layer UI 层级
   * @param callback 加载完成回调
   * @param params 初始化参数
   * @param bundleName bundle名称
   */
  public showUI(
    prefabPath: string,
    layer?: string,
    callback?: (uiNode: Node, params?: any) => void,
    params?: any,
    bundleName?: string
  ) {
    const targetLayer = layer || this.defaultLayer;

    if (this.uiMap.has(prefabPath)) {
      const uiNode = this.uiMap.get(prefabPath);
      uiNode.active = true;
      callback && callback(uiNode, params);
      return;
    }

    BundleManager.load(prefabPath, Prefab, (err: Error, prefab: Prefab) => {
      if (err) {
        error(`[PageManager] 加载失败: ${prefabPath}`, err);
        return;
      }

      const uiNode = instantiate(prefab);
      const layerNode = this.layerMap.get(targetLayer);

      if (!layerNode) {
        error(`[PageManager] 层级不存在: ${targetLayer}`);
        return;
      }

      uiNode.parent = layerNode;
      uiNode.active = true;
      this.uiMap.set(prefabPath, uiNode);

      // 调用 initialize 方法（需要prefab和类名一样）
      const compName = prefabPath.split('/').pop();
      const uiComponent: any = uiNode.getComponent(compName);
      if (uiComponent && uiComponent.initialize) {
        uiComponent.initialize(params);
      }

      callback && callback(uiNode, params);
    }, bundleName);
  }

  /**
   * 隐藏 UI
   */
  public hideUI(param: string | Node) {
    if (typeof param === "string") {
      const node = this.uiMap.get(param);
      if (node) node.active = false;
    } else {
      param.active = false;
    }
  }

  /**
   * 移除 UI
   */
  public removeUI(param: string | Node) {
    if (typeof param === "string") {
      const node = this.uiMap.get(param);
      if (node) {
        node.destroy();
        this.uiMap.delete(param);
      }
    } else {
      this.uiMap.forEach((node, key) => {
        if (node === param) {
          param.destroy();
          this.uiMap.delete(key);
        }
      });
    }
  }

  /**
   * 获取 UI 节点
   */
  public getUI(prefabPath: string) {
    return this.uiMap.get(prefabPath);
  }

  /**
   * 获取 UI 层级节点
   */
  public getLayer(layer: string) {
    return this.layerMap.get(layer);
  }
}
