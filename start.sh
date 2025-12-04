#!/bin/bash

# LeoChain 启动脚本

echo "======================================"
echo "       LeoChain 区块链启动器         "
echo "======================================"
echo ""

# 检查是否已编译
if [ ! -f "./build/leochaind" ] && ! command -v leochaind &> /dev/null; then
    echo "正在编译区块链..."
    ignite chain build
fi

echo "启动区块链节点..."
echo ""
echo "可用的命令:"
echo ""
echo "  [账户管理]"
echo "  - 创建新账户: leochaind keys add <账户名>"
echo "  - 查看所有账户: leochaind keys list"
echo "  - 查看账户地址: leochaind keys show <账户名> -a"
echo "  - 删除账户: leochaind keys delete <账户名>"
echo ""
echo "  [代币操作]"
echo "  - 铸造代币: leochaind tx token mint <数量> <代币名> --from <账户名>"
echo "  - 转账代币: leochaind tx token transfer <数量> <代币名> <接收地址> --from <发送账户>"
echo "  - 查询余额: leochaind q token balance <地址> <代币名>"
echo "  - 查询银行余额: leochaind q bank balances <地址>"
echo ""
echo "区块链浏览器: 打开 explorer/index.html"
echo ""
echo "API 端点:"
echo "  - REST API: http://localhost:1317"
echo "  - RPC: http://localhost:26657"
echo "  - gRPC: localhost:9090"
echo ""

# 使用 ignite chain serve 启动区块链
ignite chain serve --verbose
