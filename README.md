# Cocos Creator 模版工程说明文档

## 模版概述

基于 **Cocos Creator 3.8.6** 开发，使用 **TypeScript** 编写

## 🌱 快速开始
1. 克隆模板工程：
   ```bash
   git clone git@ggzcgitlab.dobest.com:fe/cocos_demo.git my_project
   ```
2. 工程仓库初始化：
    ```bash
   cd my_project
   ```
   ```bash
   node init-project.js
   ```
3. 打开 Cocos Dashboard，选择 `项目`，选择 `导入项目`

## 📁 目录结构

```
assets/                # 工程资源
├─ framework/          # 框架（通用逻辑、基础模块）
├─ scenes/             # 场景文件
├─ scripts/            # 业务逻辑脚本
└─ resources/          # 动态加载资源
    ├─ prefabs/        # 预制体文件
    ├─ textures/       # 图片资源
    ├─ audio/          # 音频资源
    └─ ...
build/                 # 默认构建输出
build-templates/       # 构建模板
settings/              # 构建配置
preview-template/      # 本地调试预览模板
package.json           # 工程配置
...
```

其他目录结构请参考 [Cocos Creator 官方文档](https://docs.cocos.com/creator/3.8/manual/zh/getting-started/project-structure)，gitignore文件已默认忽略引擎本地编译生成的不必要文件，如有其他需求请自行修改