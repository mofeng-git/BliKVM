<div align="center">
  <h1>BliKVM</h1>
  <p><strong>BliKVM - 开源 KVM 软件解决方案</strong></p>
  
  <p><a href="README.md">简体中文</a></p>
  
  [![GitHub stars](https://img.shields.io/github/stars/mofeng-git/BliKVM?style=social)](https://github.com/mofeng-git/One-KVM/stargazers)
  [![GitHub forks](https://img.shields.io/github/forks/mofeng-git/BliKVM?style=social)](https://github.com/mofeng-git/One-KVM/network/members)
  [![GitHub issues](https://img.shields.io/github/issues/mofeng-git/BliKVM)](https://github.com/mofeng-git/One-KVM/issues)
  [![GitHub license](https://img.shields.io/github/license/mofeng-git/BliKVM)](https://github.com/mofeng-git/One-KVM/blob/master/LICENSE)
  <a href="https://qm.qq.com/q/V0qWcbNoIi">
    <img alt="QQ Group" src="https://img.shields.io/badge/QQ%E7%BE%A4-join-12B7F5?logo=tencentqq">
  </a>
  
  <p>
    <a href="#快速开始">⚡ 快速开始</a> •
    <a href="#功能介绍">📊 功能介绍</a>
  </p>
</div>

## 📖 项目概述

BliKVM 在于帮助用户通过得到控制设备的 HDMI 画面和鼠标键盘，去远程管理服务器、工作站或个人PC等。 无论目标设备的操作系统是否能正常运行，可以通过 BLIKVM 解决目标设备的一切问题。如：配置 BIOS 系统，通过使用远程 CD-RO 或者闪存驱动器给目标设备重新安装操作系统。和基于软件的远程管理方式不同，你无需在被控电脑安装任何软件，做到无侵入式控制。

本项目为 BliKVM 社区版，区别于 BliKVM 官方推出的硬件套装。社区版在功能特性和使用方式上与官方硬件存在若干差异，旨在通过与 BliKVM 官方的合作，拓展 BliKVM 系统在非官方硬件平台上的兼容性与运行能力。

如您对系统稳定性、高可用性或商业级技术支持有较高要求，建议优先考虑购买 [BliKVM官方硬件套装](https://www.blicube.com/) 以获得完整保障。

### 应用场景

- **家庭实验室主机管理** - 远程管理服务器和开发设备
- **服务器远程维护** - 无需物理接触即可进行系统维护
- **系统故障处理** - 远程解决系统启动和 BIOS 相关问题

| __中文界面__ | __英文界面__ |
|--------------------------------------------|-------------------------------------------|
| ![chinese](/images/web/web-chinese.png) | ![PCB - Back](/images/web/web-english.png) |


## 📊 功能介绍

### 核心特性

- **视频捕获**（HDMI/DVI/VGA）
- **键盘转发**
- **鼠标转发**
- **虚拟U盘（重装系统）**
- **串口** 控制台端口

### 项目限制

BliKVM 社区版本项目目前资源有限，有以下限制。

- 不提供内置免费内网穿透服务，相关问题请自行解决
- 不提供24×7小时技术支持服务
- 不承诺系统稳定性和合规性，使用风险需自行承担
- 尽力优化用户体验，但仍需要一定的技术基础

如您对系统稳定性、高可用性或商业级技术支持有较高要求，建议优先考虑购买 [BliKVM官方硬件套装](https://www.blicube.com/) 以获得完整保障。

## ⚡ 快速开始

### 方式一：Docker 镜像部署（推荐）

Docker 版本支持 OTG 作为虚拟 HID，兼容 arm64 架构的 Linux 系统。

推荐使用 --net=host 网络模式以获得更好的 wol 功能和 webrtc 通信支持。

docker host 网络模式：

    端口 8080：HTTP Web 服务
    端口 4430：HTTPS Web 服务
    端口 20000-40000：WebRTC 通信端口范围，用于低延迟视频传输
    端口 9（UDP）：Wake-on-LAN（WOL）唤醒功能

docker host 模式：

```bash
sudo docker run --name kvmd -itd --privileged=true \
    -v /lib/modules:/lib/modules:ro -v /dev:/dev \
    -v /sys/kernel/config:/sys/kernel/config \
    --net=host \
    silentwind0/blikvm
```

docker bridge 模式：

```bash
sudo docker run --name kvmd -itd --privileged=true \
    -v /lib/modules:/lib/modules:ro -v /dev:/dev \
    -v /sys/kernel/config:/sys/kernel/config \
    -p 8080:8080 -p 4430:4430 \
    silentwind0/blikvm
```


### 报告问题

如果您发现了问题，请：
1. 使用 [GitHub Issues](https://github.com/mofeng-git/BliKVM/issues) 报告
2. 提供详细的错误信息和复现步骤
3. 包含您的硬件配置和系统信息
