#!/bin/bash
# LeoChain 节点部署脚本

set -e

echo "========================================="
echo "  LeoChain 节点部署脚本"
echo "========================================="

# 设置变量
CHAIN_ID="leochain"
MONIKER="leochain-node"
HOME_DIR="$HOME/.leochain"

# 编译区块链
echo ">>> 编译区块链..."
cd ~/leochain
ignite chain build

# 初始化节点
echo ">>> 初始化节点..."
leochaind init $MONIKER --chain-id $CHAIN_ID --home $HOME_DIR

# 配置 config.toml - 允许外部访问 RPC
echo ">>> 配置 RPC..."
sed -i 's/laddr = "tcp:\/\/127.0.0.1:26657"/laddr = "tcp:\/\/0.0.0.0:26657"/' $HOME_DIR/config/config.toml
sed -i 's/cors_allowed_origins = \[\]/cors_allowed_origins = ["*"]/' $HOME_DIR/config/config.toml

# 配置 app.toml - 允许外部访问 REST API
echo ">>> 配置 REST API..."
sed -i 's/enable = false/enable = true/' $HOME_DIR/config/app.toml
sed -i 's/swagger = false/swagger = true/' $HOME_DIR/config/app.toml
sed -i 's/address = "tcp:\/\/localhost:1317"/address = "tcp:\/\/0.0.0.0:1317"/' $HOME_DIR/config/app.toml
sed -i 's/enabled-unsafe-cors = false/enabled-unsafe-cors = true/' $HOME_DIR/config/app.toml

# 配置 gRPC
sed -i 's/address = "localhost:9090"/address = "0.0.0.0:9090"/' $HOME_DIR/config/app.toml

echo "========================================="
echo "  节点配置完成!"
echo ""
echo "  启动节点: leochaind start --home $HOME_DIR"
echo "  或使用 systemd 服务"
echo "========================================="
