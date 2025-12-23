# XueqiuResourceLinks

**XueqiuResourceLinks**（雪球 · 第三方资源扩展）是一个 Tampermonkey/Greasemonkey 用户脚本：实现在雪球股票详情页侧边栏，添加相应“个股”的“第三方资源”，例如上证 e 互动、深交所互动易、SEC: EDGAR、港交所披露易、Stocktwits等，点击即可跳转到对应个股的第三方资源站点，以此便利研究，提升生产力...当下“已经”和“正在”扩展出比示例图片“更多”的资源，使用有惊喜，enjoy···

![历史效果图--美股](https://github.com/user-attachments/assets/1971611e-8364-4b28-90d3-6159d6b1b557)
![历史效果图--A股](https://github.com/user-attachments/assets/a83c45fc-f5e4-45aa-b252-1e268142c493)

---

## 功能特性

- 自动解析股票交易所和代码
- 支持：
  - 上证 e 互动  
  - 深交所互动易  
  - SEC: EDGAR  
  - 港交所披露易
  - 等等等.... 使用有惊喜

- 第三方资源可扩展，通过数组轻松添加更多链接
- 使用 localStorage 缓存请求结果，减少网络请求
- 样式统一，展示美观

---

## 安装方法

1. 安装 **Tampermonkey** 或 **Greasemonkey** 浏览器扩展
2. 点击 [安装脚本](https://raw.githubusercontent.com/garinasset/XueqiuResourceLinks/main/XueqiuResourceLinks.user.js) 按钮，自动添加到扩展中
3. 打开雪球股票详情页，即可在侧边栏看到“第三方资源扩展”组件

---

## 更新与反馈

- GitHub 仓库：[https://github.com/garinasset/XueqiuResourceLinks](https://github.com/garinasset/XueqiuResourceLinks)  
- Issues & Bug 报告：[https://github.com/garinasset/XueqiuResourceLinks/issues](https://github.com/garinasset/XueqiuResourceLinks/issues)  
- 自动更新：脚本内配置了 `@updateURL` 指向 GitHub Raw 文件，Tampermonkey 会自动检查更新

---

## 许可证

MIT License
