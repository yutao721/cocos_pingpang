# Cocos Creator 框架说明文档

## 框架概述

本框架基于 Cocos Creator 3.8 开发，提供了一系列基础功能和工具。框架采用模块化设计，各个功能模块相对独立，可以根据项目需求选择性使用。

## 📁 目录结构

framework/              # 框架根目录
├─ appLifecycle/        # 应用生命周期
├─ audio/               # 音频管理
├─ bundle/              # 资源包管理
├─ config/              # 配置管理
├─ event/               # 事件管理
├─ http/                # HTTP相关
├─ log/                 # 日志系统
├─ socket/              # WebSocket
├─ storage/             # 本地存储
├─ timer/               # 定时器
├─ ui/                  # UI相关
├─ utils/               # 工具类、函数
└─ README.md            # 模块说明

## 核心模块

### 1. UI 系统

#### UiBase

`UiBase` 是所有 UI 组件的基类，提供了以下功能：

- 生命周期管理（onInit, onEnable, onDisable, onDestroy）
- 事件处理（全局事件、UI 事件）
- 节点查找

**注意事项：**
- 使用 `UiBase` 的事件系统时，无需手动清理事件监听，框架会在组件销毁时自动清理
- 外部触发UI事件时，可通过 `UiBase.emitUiEvent(eventName, ...args)` 静态方法触发，也可以通过 `EventManager` 获取UI事件
- 外部调用 `UiBase` 的事件系统时，需要注意事件名称的唯一性，避免与其他组件冲突

#### PageManager

页面管理器，用于管理 UI 界面的显示、隐藏和层级关系：

- 支持自定义多层级管理（默认为：底层、中层、顶层、系统层）
- UI预制体加载和实例化
- 节点缓存和复用

**注意事项：**
- 默认加载路径为'resources'下(与BundleManager一致)，如需修改默认路径，可修改BundleManager的默认资源包
- showUi方法支持传入Bundle包名，用于加载非默认资源包中的UI预制体
- 单例模式，在使用前需要先初始化，需要传入uiRoot根节点

#### Popup

弹窗基类，继承自 `UiBase`，提供了弹窗特有的功能：

- 遮罩点击关闭
- 自动销毁功能

#### AnimationPlayer

动画播放器组件，支持：

- 帧动画播放
- Spine 动画播放
- 循环/非循环播放控制
- 播放完成回调

#### Toast

toast提示基类，继承自 `UiBase`，提供了toast提示功能：

- 弹出提示文本
- 支持显示时间和淡出时间自定义
- 多条提示自动上移，避免覆盖
- 自动销毁，不需手动管理节点

### 2. 事件系统

#### EventManager

事件管理器，提供全局事件管理：

- 默认全局事件派发器
- 支持注册多个命名事件派发器

**注意事项：**
- 事件如果不是通过 `UiBase` 注册，在生命周期结束时需要手动移除监听，避免内存泄漏
- 默认会创建一个global全局事件派发器
- 事件名称需保持唯一性

#### EventDispatcher

事件派发器，负责事件的注册、派发和移除：

- 支持 on/off/once/emit 事件操作
- 支持按目标对象批量移除事件


### 3. HTTP 网络

#### HttpRequester

基础 HTTP 请求封装：

- 支持 GET/POST/PUT/DELETE 请求
- 请求头设置
- 超时控制
- 进度回调
- 请求中止

#### HttpCore

HTTP 管理器，提供拦截器和请求管理：

- 请求/响应拦截器
- 基础 URL 设置
- 错误处理

#### HttpClient

HTTP 工具类，提供静态方法和多端点管理：

- 多API端点管理
- 端点配置（基础URL、请求头、超时）
- 静态请求方法（GET/POST/PUT/DELETE）
- 全局拦截器设置

### 4. WebSocket

#### WebSocketManager

WebSocket 管理器，用于长连接通信：

- 纯净的 WebSocket 封装，剥离业务逻辑
- 支持自动断线重连（可配置重试次数和间隔）
- 采用代理模式 (Delegate) 处理事件，解耦事件系统

### 5. 资源管理

#### BundleManager

资源包管理器，用于加载资源包中的资源：

- 支持默认资源包设置（默认：'resources'）
- 提供回调和 Promise 两种加载方式
- 资源类型安全加载

**注意事项：**
- 资源加载时注意错误处理，避免因资源加载失败导致应用崩溃

### 6. 音频管理

#### AudioManager

音频管理器，用于管理背景音乐和音效：

- 背景音乐播放/暂停/恢复/停止
- 音效播放
- 音量控制
- 支持从不同资源包加载

**注意事项：**
- 使用前需要先初始化

### 7. 应用生命周期

#### AppLifecycleManager

应用生命周期管理，处理应用前台/后台切换：

- 前台/后台状态监听
- 状态变化事件派发
- 兼容 Web 平台

**注意事项：**
- 使用前需要先初始化

### 8. 工具函数/类

#### CommonFun

常用工具函数集合：

- 帧动画播放
- JSON 加载
- 其他实用工具函数

#### ComponentPool<T>

组件对象池，用于管理和复用组件实例：

- 支持泛型，可用于任何继承自Component的组件
- 提供获取(get)、回收(put)和清空(clear)方法
- 支持自定义初始化和回收逻辑

#### Queue<E>

队列数据结构，提供先进先出(FIFO)操作：

- 支持泛型，可存储任意类型数据
- 提供入队(enqueue)、出队(dequeue)、获取队首元素(getFront)等方法
- 包含队列状态查询和清空操作

#### MD5

MD5 工具类，提供静态方法计算字符串的 MD5 值

### 9. 日志系统

#### Logger

增强型日志管理器，替代原生 console：

- 支持分级控制 (DEBUG/INFO/WARN/ERROR/NONE)
- 支持全局开关
- 支持 Tag 标签
- 自动添加时间戳
- 支持对象 Dump

### 10. 数据存储

#### StorageManager

本地数据存储管理器，对 `sys.localStorage` 的封装：

- 支持 Key 前缀 (如 UserID 隔离)
- 自动对象序列化/反序列化 (JSON)
- 支持基础 XOR 加密/防篡改
- 统一的异常处理

### 11. 配置管理

#### ConfigManager

配置表管理器，用于管理 JSON 格式的静态数据：

- 支持从资源包加载 JSON 配置
- 提供便捷的单条/全部数据查询
- 缓存管理

### 12. 定时器

#### TimerManager

全局定时器管理器，独立于 Node 组件：

- 替代 `component.schedule`，更灵活的管理
- 支持全局暂停/恢复（仅影响游戏逻辑，不卡死 UI 渲染）
- 支持全局时间缩放（实现倍速功能）
- 提供基于服务器时间的倒计时校准功能


## 使用示例

### UI 组件创建

```typescript
import { _decorator, Node, Label } from 'cc';
import { UiBase } from '../framework/ui/UiBase';
const { ccclass, property } = _decorator;

@ccclass('MyUI')
export class MyUI extends UiBase {
    @property(Label)
    private titleLabel: Label = null;

    // 初始化UI组件
    protected onInit() {
        // 添加UI事件监听
        this.onUiEvent('ui_event', this.onUIEvent);
        // 添加全局事件监听
        this.onGlobalEvent('game_start', this.onGameStart, this);
    }

    private onUIEvent() {
        console.log('ui event');
    }

    private onGameStart() {
        console.log('Game started');
    }

    protected onDestroy() {
        super.onDestroy();
        // 框架会自动清理事件，无需手动清理
    }
}
```

### 页面管理

```typescript
import { _decorator, Component, Node } from 'cc';
import { PageManager, UILayer } from '../framework/ui/PageManager';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    // 根节点，用于挂载所有 UI 节点
    @property(Node)
    private uiRoot: Node = null;

    protected onLoad() {
        // 初始化页面管理器
        PageManager.Instance.init(this.uiRoot);
        
        // 显示主界面
        PageManager.Instance.showUI('prefabs/MainUI', UILayer.MIDDLE);
        
        // 显示弹窗
        PageManager.Instance.showUI('prefabs/SettingsPopup', UILayer.TOP, (node: Node) => {
            // 弹窗初始化
            const settingsPopup = node.getComponent('SettingsPopup');
            if (settingsPopup) {
                settingsPopup.initialize();
            }
        });
    }
}
```


### 事件管理

```typescript
// 全局事件监听
EventManager.global.on("game_start", this.onGameStart, this);

// 全局事件触发
EventManager.global.emit("game_start", { level: 1 });

// 移除特定全局事件监听
EventManager.global.off("game_start", this.onGameStart, this);

// 单次全局事件监听（触发一次后自动移除）
EventManager.global.once("game_over", this.onGameOver, this);

// 创建自定义事件分发器
const uiEvents = EventManager.register("ui_events");
uiEvents.emit("button_click", { id: "start_btn" });

// 通过名称获取事件分发器
const uiDispatcher = EventManager.getDispatcher("ui_events");

// 移除事件分发器（global不可移除）
EventManager.remove("ui_events");

// 通过UiBase触发自定义UI事件（假设UiBase已经注册）
UiBase.emitUiEvent("ui_event");

```


### HTTP 请求

```typescript
export class Api {
    // 基础 URL
    private static readonly BASE_URL = 'https://api.example.com';

    // 初始化HTTP客户端
    public static init() {
        HttpClient.init(Api.BASE_URL);
        // 添加请求拦截器，用于在每个请求中添加认证token
        HttpClient.addRequestInterceptor((request) => {       
             const token = localStorage.getItem('token');
             if (token) {
                request.headers = {
                     ...request.headers,
                     'Authorization': `${token}`
                 };
             }
             return request;
        });
        // 添加响应拦截器，用于处理服务端返回的业务状态码
        HttpClient.addResponseInterceptor((response) => {
            // 假设服务端返回格式为 { code: number, data: any, msg: string }
            const responseData = response.data as any;
            // 检查业务状态码
            if (responseData.code !== 0 && responseData.code !== -600) {
                const error = new Error(responseData.msg || '请求失败');
                (error as any).code = responseData.code;
                throw error;
            }
            // 提取实际数据
            response.data = responseData.data;
            return response;
        });
    }

    // 用户登录
    public static async login(param: { username: string, password: string }) {
        return HttpClient.post<{ token: string }>('api/login', param);
    }
}
// 初始化API
Api.init();
```

### 音频播放

```typescript
import { _decorator } from 'cc';
import { UiBase } from '../framework/ui/UiBase';
import { AudioManager } from '../framework/audio/AudioManager';
const { ccclass } = _decorator;

@ccclass('AudioExample')
export class AudioExample extends UiBase {
    protected onLoad() {
        // 播放背景音乐
        AudioManager.Instance.playBGM('audio/background_music', true, 0.8);
        
        // 播放音效
        this.addClickEvent(this.node, () => {
            AudioManager.Instance.playSFX('audio/click_sound', 1.0);
        }, this);
    }
    
    private onGamePause() {
        // 暂停背景音乐
        AudioManager.Instance.pauseBGM();
    }
    
    private onGameResume() {
        // 恢复背景音乐
        AudioManager.Instance.resumeBGM();
    }
}
```
### 资源管理

```typescript
import { _decorator, Component, SpriteFrame, Prefab, AudioClip, instantiate } from 'cc';
import { BundleManager } from '../framework/bundle/BundleManager';
const { ccclass } = _decorator;

@ccclass('ResourceExample')
export class ResourceExample extends Component {
    protected onLoad() {
        // 设置默认资源包（默认为'resources'）
        BundleManager.setDefaultBundle('game_resources');
        
        // 使用回调方式加载资源
        BundleManager.load('textures/player', SpriteFrame, (err, spriteFrame) => {
            if (err) {
                console.error('加载精灵图失败:', err);
                return;
            }
            // 使用加载的精灵图
            this.node.getComponent(Sprite).spriteFrame = spriteFrame;
        });
        
        // 使用Promise方式加载资源
        this.loadPlayerPrefab();
        
        // 从指定资源包加载
        BundleManager.load('sounds/bgm', AudioClip, (err, clip) => {
            if (!err && clip) {
                // 播放音频
            }
        }, 'audio_bundle'); // 指定资源包名称
    }
    
    private async loadPlayerPrefab() {
        try {
            // 使用Promise方式加载
            const prefab = await BundleManager.loadAsync('prefabs/player', Prefab);
            // 实例化预制体
            const playerNode = instantiate(prefab);
            playerNode.parent = this.node;
        } catch (err) {
            console.error('加载预制体失败:', err);
        }
    }
}
```

### 对象池

```typescript
import { _decorator, Component, Node, Prefab, instantiate } from 'cc';
import { ComponentPool } from '../framework/utils/ComponentPool';

// 假设有一个子弹组件
class Bullet extends Component {
    public damage: number = 10;
    public speed: number = 500;
    
    // 初始化子弹属性
    public init(damage: number, speed: number): void {
        this.damage = damage;
        this.speed = speed;
        // 激活节点
        this.node.active = true;
    }
    
    // 回收时重置
    public reset(): void {
        // 隐藏节点但不销毁
        this.node.active = false;
    }
}

@ccclass('BulletManager')
export class BulletManager extends Component {
    @property(Prefab)
    private bulletPrefab: Prefab = null;
    
    // 子弹对象池
    private bulletPool: ComponentPool<Bullet> = null;
    
    protected onLoad() {
        // 初始化对象池
        this.bulletPool = new ComponentPool<Bullet>(
            // 创建函数 - 当池中没有可用对象时调用
            () => {
                const bulletNode = instantiate(this.bulletPrefab);
                return bulletNode.getComponent(Bullet);
            },
            // 初始化函数 - 从池中获取对象时调用
            (bullet: Bullet) => {
                // 可以在这里设置默认属性
                bullet.init(10, 500);
            },
            // 回收函数 - 对象放回池中时调用
            (bullet: Bullet) => {
                bullet.reset();
            }
        );
    }
    
    // 发射子弹
    public shootBullet(startPos: Vec3, direction: Vec3, damage: number = 10, speed: number = 500) {
        // 从对象池获取子弹
        const bullet = this.bulletPool.get();
        
        // 设置子弹属性
        bullet.node.position = startPos;
        bullet.init(damage, speed);
        
        // 添加到场景
        bullet.node.parent = this.node;
        
        // 设置移动方向等逻辑...
        
        // 3秒后回收子弹
        this.scheduleOnce(() => {
            // 回收子弹到对象池
            this.bulletPool.put(bullet);
        }, 3);
    }
    
    protected onDestroy() {
        // 清空对象池，销毁所有子弹节点
        this.bulletPool.clear();
    }
}
```

### 日志系统

```typescript
import { Logger, LogLevel } from '../framework/log/Logger';

// 初始化 (通常在游戏启动时)
Logger.init(LogLevel.DEBUG, true);

// 各种级别的日志
Logger.debug('Network', 'Connected to server', { port: 8080 });
Logger.info('Player', 'Level Up', 5);
Logger.warn('Resource', 'Memory usage high');
Logger.error('System', 'Initialization failed');

// Dump 对象
Logger.dump('UserData', { name: 'Player1', items: [1, 2, 3] });
```

### 数据存储

```typescript
import { StorageManager } from '../framework/storage/StorageManager';

// 初始化 (设置前缀和开启加密)
StorageManager.init('user_1001', true);

// 存储简单值
StorageManager.set('isFirstLogin', false);
StorageManager.set('volume', 0.8);

// 存储对象
StorageManager.set('playerInfo', { name: 'Hero', level: 10 });

// 获取数据
const isFirst = StorageManager.get('isFirstLogin', true); // 默认值为 true
const info = StorageManager.get('playerInfo');

// 移除数据
StorageManager.remove('isFirstLogin');
```

### 配置管理

```typescript
import { ConfigManager } from '../framework/config/ConfigManager';

// 假设 resources/configs/item.json 存在
// [
//   { "id": 1001, "name": "Sword", "type": 1 },
//   { "id": 1002, "name": "Shield", "type": 2 }
// ]

async function initConfigs() {
    // 加载配置
    await ConfigManager.Instance.loadConfig('configs/item', 'resources');
    
    // 获取单条数据
    const sword = ConfigManager.Instance.get('item', 1001);
    console.log(sword.name); // output: Sword
    
    // 获取全部数据
    const allItems = ConfigManager.Instance.getAll('item');
}
```

### 全局定时器

```typescript
import { TimerManager } from '../framework/timer/TimerManager';

// 开启一个每秒执行一次的定时器，重复5次
// 1.0 = 间隔, 5 = 重复次数, 2.0 = 延迟2秒开始
const timerId = TimerManager.Instance.schedule((timer) => {
    console.log(`Tick: ${timer.passedTime}`);
}, this, 1.0, 5, 2.0);

// 取消定时器
TimerManager.Instance.unschedule(timerId);

// 全局暂停 (例如打开弹窗时)
TimerManager.Instance.pause();

// 全局恢复
TimerManager.Instance.resume();

// 2倍速运行 (例如战斗加速)
TimerManager.Instance.setTimeScale(2.0);

// 倒计时校准
// 1. 登录时同步服务器时间戳
TimerManager.Instance.syncServerTime(Date.now() + 1000); 

// 2. 获取某个活动结束前的剩余秒数
const leftTime = TimerManager.Instance.getCountdown(targetTimestamp);
```

### WebSocket 通信

```typescript
import { WebSocketManager, ISocketDelegate } from '../framework/socket/WebSocketManager';

class NetworkService implements ISocketDelegate {
    
    constructor() {
        // 设置代理，接管所有 Socket 事件
        WebSocketManager.Instance.setDelegate(this);
    }

    public connect() {
        WebSocketManager.Instance.connect('ws://localhost:8080');
    }

    // --- ISocketDelegate 实现 ---

    onSocketOpen() {
        console.log('Socket connected!');
        // 可以在这里开启心跳等
    }

    onSocketMessage(data: any) {
        // 业务层自己解析数据 (例如 JSON 或 Protobuf)
        // const msg = JSON.parse(data);
        console.log('Recv:', data);
    }

    onSocketError(err: Event) {
        console.error('Socket error:', err);
    }

    onSocketClose(reason: string) {
        console.log('Socket closed:', reason);
    }
    
    onSocketReconnectFailed() {
        console.log('重连失败');
    }
}
```

