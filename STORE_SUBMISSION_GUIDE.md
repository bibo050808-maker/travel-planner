# 旅伴 · 应用商店上架材料

## 一、应用基本信息

**应用名称：** 旅伴
**英文名称：** Travel Buddy
**包名：** com.travelplanner.app
**版本号：** 1.0.0
**最低支持：** Android 7.0 (API 24)
**目标支持：** Android 14+ (API 34)
**应用大小：** 约 5-10MB（首次加载需下载数据）

---

## 二、应用描述

### 简短描述（50字以内）
智能旅游攻略工具，查人流、找食宿、规划路线、一键生成攻略。

### 详细描述（200-500字）
旅伴是一款基于大数据的智能旅游攻略App，帮你轻松规划每一次旅行。

**核心功能：**
- 🔍 探索城市：覆盖全国300+城市，实时人流热度、特色标签
- 🗺️ 路线规划：智能推荐交通方案和行程安排
- 🍜 食宿推荐：当地美食、特色住宿一网打尽
- 👫 旅伴搭子：找到志同道合的旅行伙伴
- 📝 攻略生成：一键生成完整旅游攻略，自由编辑
- 💾 离线可用：支持PWA离线访问

无论是周末短途游还是长假远行，旅伴都能帮你快速做好攻略，让旅行更轻松。

### 关键词标签
旅伴,旅游,攻略,旅行,路线规划,美食,住宿,城市探索,自由行,智能攻略

---

## 三、应用截图要求

各应用商店截图尺寸要求不同，建议准备以下尺寸：

| 尺寸 | 用途 | 内容建议 |
|------|------|----------|
| 1080×1920 (竖屏) | 华为、小米、OPPO、VIVO、应用宝 | 城市列表、城市详情、路线规划、攻略生成 |
| 1242×2688 (竖屏) | 部分商店适配 | 同1080×1920推荐截图 |
| 1280×720 (横屏) | 部分商店可选 | 路线总览、攻略预览 |

**截图内容建议（6张）：**
1. 首页城市探索 - 展示搜索、热门城市
2. 城市详情页 - 展示热度、标签、评价
3. 路线规划页 - 展示起点终点选择
4. 食宿推荐页 - 展示推荐列表
5. 攻略生成页 - 展示完整攻略
6. 我的页面 - 展示收藏、评价记录

---

## 四、隐私政策

见 `android/app/src/main/assets/privacy_policy.html`

上架时需将隐私政策粘贴或上传至各商店后台。
建议托管到 GitHub Pages 获取公开访问链接：
https://bibo050808-maker.github.io/travel-planner/privacy.html

---

## 五、开发者账号注册指南

| 应用商店 | 注册地址 | 费用 | 审核周期 |
|----------|----------|------|----------|
| 华为 AppGallery | https://developer.huawei.com/consumer/cn/ | 免费 | 1-3天 |
| 小米应用商店 | https://dev.mi.com/ | 个人免费 | 1-3天 |
| OPPO软件商店 | https://open.oppomobile.com/ | 免费 | 1-5天 |
| VIVO应用商店 | https://dev.vivo.com.cn/ | 免费 | 1-5天 |
| 腾讯应用宝 | https://open.tencent.com/ | 免费 | 1-7天 |
| 360手机助手 | https://dev.360.cn/ | 免费 | 1-3天 |
| 百度手机助手 | https://developer.baidu.com/ | 免费 | 1-5天 |
| 魅族应用商店 | https://open.flyme.cn/ | 免费 | 1-3天 |

**所需材料：**
- 个人身份证（正反面）
- 手机号
- 邮箱
- 部分商店需ICP备案（个人可不提供）

---

## 六、构建与签名

### 本地构建（需安装 Android Studio）
1. 用 Android Studio 打开 `android/` 目录
2. 等待 Gradle 同步完成
3. 生成签名密钥：
   ```bash
   keytool -genkey -v -keystore travel-planner.keystore -alias travel-planner -keyalg RSA -keysize 2048 -validity 10000
   ```
4. 在 `app/build.gradle` 中配置签名信息
5. 运行 `Build → Generate Signed Bundle / APK`
6. 选择 Android App Bundle (.aab) 格式

### GitHub Actions 自动构建
1. 将 keystore 文件 base64 编码添加到仓库 Secrets（`ANDROID_KEYSTORE`）
2. 添加 `ANDROID_KEYSTORE_PASSWORD`、`ANDROID_KEY_ALIAS`、`ANDROID_KEY_PASSWORD`
3. 手动触发 `Build Android APK` 工作流
4. 从 Actions 产物中下载 .aab 文件

---

## 七、上架流程

1. **注册开发者账号**（各商店分别注册）
2. **准备材料**（截图、应用描述、隐私政策）
3. **构建签名AAB**（见第六步）
4. **提交审核**（在各商店开发者后台上传）
5. **等待审核**（1-7天不等）
6. **正式发布**（审核通过后上架）
