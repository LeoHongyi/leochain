#!/bin/bash
# LeoChain 服务器安装脚本
# 在 Ubuntu 22.04 上运行

set -e

echo "========================================="
echo "  LeoChain 服务器安装脚本"
echo "========================================="

# 更新系统
echo ">>> 更新系统..."
apt update && apt upgrade -y

# 安装基础工具
echo ">>> 安装基础工具..."
apt install -y curl wget git build-essential jq

# 安装 Go 1.24
echo ">>> 安装 Go..."
cd /tmp
wget https://go.dev/dl/go1.24.0.linux-amd64.tar.gz
rm -rf /usr/local/go
tar -C /usr/local -xzf go1.24.0.linux-amd64.tar.gz

# 配置 Go 环境
echo 'export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin' >> ~/.bashrc
export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin

# 验证 Go 安装
go version

# 安装 Ignite CLI
echo ">>> 安装 Ignite CLI..."
curl https://get.ignite.com/cli! | bash

# 验证 Ignite 安装
ignite version

echo "========================================="
echo "  安装完成!"
echo "  请运行: source ~/.bashrc"
echo "========================================="
