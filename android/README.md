# 旅伴 (Travel Buddy) App

## 项目结构

```
travel-planner/
├── src/               # React 前端源码
├── android/           # Android 原生壳项目
├── public/            # 静态资源
├── .github/workflows/ # GitHub Actions 自动构建
├── dist/              # 构建产物
└── ...
```

## Web 版

已部署到 GitHub Pages：
- https://bibo050808-maker.github.io/travel-planner/

## Android App

Android 项目位于 `android/` 目录，使用 WebView 包装 Web 版。

### 构建要求
- Android Studio Hedgehog (2023.1.1) 或更新版本
- JDK 17
- Android SDK 34

### 快速开始
1. 用 Android Studio 打开 `android/` 目录
2. 等待 Gradle 同步完成
3. 点击 Run 或 Build APK

### 自动构建
推送到 master 分支或手动触发 Actions 工作流 `Build Android APK`。

## 应用商店上架

详见 [STORE_SUBMISSION_GUIDE.md](STORE_SUBMISSION_GUIDE.md)
