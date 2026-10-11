<div align="center">
  <img src="assets/banner.svg" width="100%" alt="小鱼" />
  <br/>
  <img src="assets/typing.svg" width="700" alt="status" />
</div>

<div align="center">
  <a href="https://yy.ytw.asia"><img src="https://img.shields.io/badge/官网-yy.ytw.asia-ff6a3d?style=flat-square&logo=googlechrome&logoColor=white" alt="官网" /></a>
  <a href="https://github.com/1191533749/youyou-music/releases/latest"><img src="https://img.shields.io/github/v/release/1191533749/youyou-music?style=flat-square&label=%E6%82%A0%E6%82%A0%E9%9F%B3%E4%B9%90&color=ff6a3d" alt="最新版本" /></a>
  <a href="https://github.com/1191533749/youyou-music"><img src="https://img.shields.io/github/stars/1191533749/youyou-music?style=flat-square&label=Stars&color=ffb347" alt="stars" /></a>
  <img src="https://komarev.com/ghpvc/?username=1191533749&style=flat-square&color=3b82f6&label=%E8%AE%BF%E9%97%AE" alt="访问量" />
</div>

## 关于我

独立开发，**全栈**。做 Windows 桌面客户端、Web 前端与 Node 服务端，喜欢把接口、音视频和系统层的东西一直做到能用、好用。
不写演示项目——写的是装上就会天天用的软件。

- 现在在做：**[悠悠音乐](https://github.com/1191533749/youyou-music)** —— 一个 Electron + mpv 的 Windows 桌面音乐客户端，扫码登录、每日推荐、桌面歌词、全屏播放页、一起听，带内置更新，已经迭代到 **v0.4.2**
- 顺手在写：自建公网中继服务（零依赖 Node）、静态官网、各种自动化脚本
- 常驻地：甘肃 · [剑指网络](https://ytw.asia)

## 技术栈

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-47848F?style=for-the-badge&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![PHP](https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Linux](https://img.shields.io/badge/Linux-FCC624?style=for-the-badge&logo=linux&logoColor=black)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![Windows](https://img.shields.io/badge/Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white)

## 数据

<div align="center">
  <img height="205" src="assets/stats.svg" alt="GitHub 数据" />
  <img height="205" src="assets/langs.svg" alt="主要语言" />
</div>

<div align="center">
  <img width="100%" src="assets/contrib.svg" alt="近一年贡献热力图" />
</div>

<div align="center">
  <sub>上面三张图是仓库里自己画的 SVG，由 GitHub Actions 每天刷新（<a href="scripts/render-cards.mjs">scripts/render-cards.mjs</a>），不依赖任何第三方图床，所以在哪都能打开。</sub>
</div>

## 精选作品

### 悠悠音乐 · Windows 桌面音乐客户端

<img align="right" width="420" src="https://github.com/user-attachments/assets/82ffdf0d-0ae7-4402-b62c-ffa9dca49e4e" alt="悠悠音乐" />

Electron + React + TypeScript 写的 Windows 客户端，音频后端用 **mpv**，账号体系对接网易云（扫码登录）。
在线播放、歌单/专辑/歌手、每日推荐、私人漫游、云盘、桌面歌词、全屏播放页、一起听，一套都在。

几处我认为值得看的地方：

- **weapi / eapi 双通道**：报文格式与线上一致，有限流自动降级（weapi 返回空体时自动改走 eapi）
- **完整音源自动补齐**：拿不到完整音频时按「时长 ±5 秒 / 歌名归一化相同 / 版本标记一致 / 歌手命中」四条全中才换源，宁可跳过也不播半截、不播翻唱
- **音质不虚报**：达不到所选档位就降档，并按 mpv 报出的**真实码率**显示实际档位
- **播放失败绝不跳歌**：原地换音源 / 换档位 / 换 CDN 主机重试
- **内置更新**：启动检测 Release，便携版自替换、安装版静默安装；更新失败兜底打开官网

[![源码](https://img.shields.io/badge/源码-youyou--music-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/1191533749/youyou-music)
[![下载](https://img.shields.io/badge/下载-最新版%20Release-ff6a3d?style=flat-square&logo=github&logoColor=white)](https://github.com/1191533749/youyou-music/releases/latest)
[![官网](https://img.shields.io/badge/官网-yy.ytw.asia-3b82f6?style=flat-square&logo=googlechrome&logoColor=white)](https://yy.ytw.asia)
![License](https://img.shields.io/badge/License-LGPL--3.0-blue?style=flat-square)

<br clear="right" />

### 微信黑名单管理系统

移动端优先的管理后台：模块分类、图片与视频上传、多用户与权限控制，PHP 实现，跑在自己的服务器上。

![PHP](https://img.shields.io/badge/PHP-777BB4?style=flat-square&logo=php&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white)

### 一起听 · 公网中继

悠悠音乐「一起听」的自建服务端：零依赖 Node（只用标准库），TLS + 连接口令、播放同步、聊天与礼物、支付宝当面付充值。
用 systemd 常驻，源码在 [youyou-music/server](https://github.com/1191533749/youyou-music/tree/master/server)。

## 联系

- 官网：<https://ytw.asia> · 悠悠音乐：<https://yy.ytw.asia>
- 微信公众号（悠悠音乐更新与下载）：

<img width="200" src="https://github.com/user-attachments/assets/a4dc29e5-69a5-4ab8-9f9a-cd88e053c154" alt="微信公众号" />

<div align="center">
  <sub>Think it · Build it · Ship it</sub>
</div>
