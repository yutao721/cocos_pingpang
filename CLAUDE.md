# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Cocos Creator 3.8.6** game project (TypeScript) structured as a reusable game framework template. Design resolution: 750x1334.

## Build & Development

There are no npm build scripts. All building and running is done through the **Cocos Creator 3.8.6 IDE**:
- Open the project in Cocos Dashboard → import from this directory
- Use the editor's built-in preview (Ctrl+P) to run in browser
- Build via **Project > Build** in the editor UI

TypeScript is compiled by the Cocos engine toolchain; `tsconfig.json` extends `./temp/tsconfig.cocos.json` with `strict: false`.

## Architecture

### Directory Layout

```
assets/
├── framework/   # Reusable core framework (singleton managers)
├── script/      # Game-specific business logic
├── scenes/      # Cocos scene files
└── resources/   # Runtime-loadable assets (prefabs, etc.)
```

### Framework Modules (`assets/framework/`)

All managers follow the **Singleton pattern** via a static `Instance` getter.

| Module | Class | Purpose |
|--------|-------|---------|
| `event/` | `EventManager` | Global event bus; supports named dispatchers, message locking/queuing |
| `ui/` | `PageManager` | UI lifecycle with layered rendering (BOTTOM/MIDDLE/TOP/SYSTEM) |
| `ui/` | `UiBase` | Base class for all UI components; lifecycle: `onInit()`, `onEnable()`, `onDisable()` |
| `http/` | `HttpClient` | Multi-endpoint HTTP with request/response interceptors |
| `webSocket/` | `WebSocketManager` | WebSocket with delegate pattern and auto-reconnect (5 attempts default) |
| `timer/` | `TimerManager` | Global timers, server time sync, pause/resume |
| `storage/` | `StorageManager` | KV storage with namespace, XOR+Base64 encryption, JSON serialization |
| `audio/` | `AudioManager` | BGM/SFX playback via bundle resources |
| `config/` | `ConfigManager` | JSON config table loading and caching |
| `log/` | `Logger` | Structured logging with levels (DEBUG/INFO/WARN/ERROR/NONE) |
| `bundle/` | `BundleManager` | Asset bundle loading (default bundle: "resources") |
| `appLifecycle/` | `AppLifecycle` | App foreground/background events |

### Key Patterns

- **All UI components** extend `UiBase` and are managed by `PageManager` (loaded from prefabs)
- **Events** flow through `EventManager.global` (or named dispatchers); use `on/off/once/emit`
- **Message locking**: `EventManager` supports queuing messages during critical sections for synchronization
- **WebSocket delegate**: Implement `ISocketDelegate` interface for WebSocket callbacks
- **HTTP interceptors**: Set up in `assets/script/api/api.ts` for auth token injection

### Game Entry Point

`assets/script/gameScene.ts` (extends `UiBase`) initializes `PageManager` and `ToastMgr`, then shows the loading prefab. The scene file at `assets/scenes/` bootstraps this component.

### Adding New UI

1. Create a prefab in `assets/resources/prefabs/`
2. Create a TypeScript class extending `UiBase`
3. Load via `PageManager.Instance.show(prefabPath, layer)`
