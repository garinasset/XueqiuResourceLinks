# XueqiuResourceLinks

**XueqiuResourceLinks**（雪球 · 第三方资源扩展）是一个 Tampermonkey/Greasemonkey 用户脚本，用于在雪球股票详情页侧边栏批量添加第三方资源链接，支持上交所e互动、深交所互动易、SEC EDGAR、港交所披露易，老虎证券，未来战略是扩展更多资源。

https://github.com/user-attachments/assets/f42a0cf6-aade-4f9e-9cf0-a504292e00e3

---

## 功能特性

- 自动解析股票交易所和代码（SH、SZ、NASDAQ、NYSE、HK）
- 支持：
  - 上交所：上证 e 互动  
  - 深交所：深交所互动易  
  - 美股：SEC EDGAR  
  - 港股：披露易
  - 美港股（NASDAQ/NYSE）：老虎证券  
- 第三方资源可扩展，通过数组轻松添加更多链接
- 使用 sessionStorage 缓存请求结果，减少网络请求
- 样式统一，展示美观

---

## 安装方法

1. 安装 **Tampermonkey** 或 **Greasemonkey** 浏览器扩展
2. 点击 [安装脚本](https://raw.githubusercontent.com/garinasset/XueqiuResourceLinks/main/XueqiuResourceLinks.user.js) 按钮，自动添加到扩展中
3. 打开雪球股票详情页，即可在侧边栏看到“第三方资源扩展”链接

---

## 使用示例

- 上海证券交易所：上证 e 互动  
- 深圳证券交易所：深交所互动易  
- 美股（NASDAQ/NYSE）：SEC EDGAR  
- 香港交易所：披露易
- 美港股（NASDAQ/NYSE）：老虎证券

> 未来可通过 `thirdPartyResources` 数组添加更多自定义资源

---

## 更新与反馈

- GitHub 仓库：[https://github.com/garinasset/XueqiuResourceLinks](https://github.com/garinasset/XueqiuResourceLinks)  
- Issues & Bug 报告：[https://github.com/garinasset/XueqiuResourceLinks/issues](https://github.com/garinasset/XueqiuResourceLinks/issues)  
- 自动更新：脚本内配置了 `@updateURL` 指向 GitHub Raw 文件，Tampermonkey 会自动检查更新

---
