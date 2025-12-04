# LeoChain 部署指南

本文档介绍如何部署 LeoChain 区块链和前端应用。

---

## 架构概述

```
┌─────────────────────────────────────────────────────────────┐
│                    用户浏览器                                │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare Pages (前端)                         │
│              https://leochain-explorer.pages.dev            │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              云服务器 (区块链节点)                            │
│              ├── RPC: :26657                                │
│              ├── REST: :1317                                │
│              └── gRPC: :9090                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 一、前端部署 (Cloudflare Pages)

### 方法 1: 通过 Git 自动部署

1. **将代码推送到 GitHub**

```bash
cd /Users/leo/leochain
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用户名/leochain.git
git push -u origin main
```

2. **在 Cloudflare Dashboard 创建项目**

- 登录 https://dash.cloudflare.com
- 进入 **Workers & Pages**
- 点击 **Create application** → **Pages** → **Connect to Git**
- 选择你的 GitHub 仓库 `leochain`
- 配置构建设置:

| 设置 | 值 |
|------|-----|
| Framework preset | Vite |
| Build command | `cd explorer && npm install && npm run build` |
| Build output directory | `explorer/dist` |
| Root directory | `/` |

3. **配置环境变量**

在 Cloudflare Pages 项目设置中添加:

| 变量名 | 值 |
|--------|-----|
| `VITE_RPC_URL` | `https://your-rpc-endpoint.com` |
| `VITE_REST_URL` | `https://your-rest-endpoint.com` |

4. **部署**

点击 **Save and Deploy**，Cloudflare 将自动构建和部署。

### 方法 2: 手动部署 (Wrangler CLI)

1. **安装 Wrangler**

```bash
npm install -g wrangler
```

2. **登录 Cloudflare**

```bash
wrangler login
```

3. **构建前端**

```bash
cd /Users/leo/leochain/explorer

# 设置环境变量
export VITE_RPC_URL="https://your-rpc-endpoint.com"
export VITE_REST_URL="https://your-rest-endpoint.com"

# 构建
npm run build
```

4. **部署到 Cloudflare Pages**

```bash
wrangler pages deploy dist --project-name=leochain-explorer
```

5. **访问**

部署完成后，访问: `https://leochain-explorer.pages.dev`

---

## 二、区块链节点部署

### 注意事项

- Cloudflare **不支持**直接运行区块链节点
- 区块链节点需要部署在支持长时间运行进程的服务器上
- 推荐使用: AWS EC2, Google Cloud, DigitalOcean, Vultr 等

### 方法 1: 使用 VPS 服务器

#### 1. 准备服务器

推荐配置:
- **CPU**: 4 核+
- **内存**: 8GB+
- **存储**: 100GB+ SSD
- **系统**: Ubuntu 22.04 LTS

#### 2. 安装依赖

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Go
wget https://go.dev/dl/go1.24.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.24.0.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin' >> ~/.bashrc
source ~/.bashrc

# 安装 Ignite CLI
curl https://get.ignite.com/cli! | bash
```

#### 3. 上传项目代码

```bash
# 在本地
scp -r /Users/leo/leochain user@your-server-ip:~/

# 或者使用 Git
git clone https://github.com/你的用户名/leochain.git
```

#### 4. 编译和初始化

```bash
cd ~/leochain
ignite chain build

# 初始化节点
leochaind init mynode --chain-id leochain

# 复制 genesis 文件 (如果有)
# cp genesis.json ~/.leochain/config/genesis.json
```

#### 5. 配置节点

编辑 `~/.leochain/config/config.toml`:

```toml
# 允许外部访问 RPC
[rpc]
laddr = "tcp://0.0.0.0:26657"
cors_allowed_origins = ["*"]
```

编辑 `~/.leochain/config/app.toml`:

```toml
# 允许外部访问 REST API
[api]
enable = true
swagger = true
address = "tcp://0.0.0.0:1317"
enabled-unsafe-cors = true

# gRPC
[grpc]
enable = true
address = "0.0.0.0:9090"
```

#### 6. 使用 systemd 运行

创建服务文件 `/etc/systemd/system/leochaind.service`:

```ini
[Unit]
Description=LeoChain Node
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu
ExecStart=/home/ubuntu/go/bin/leochaind start
Restart=on-failure
RestartSec=10
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
```

启动服务:

```bash
sudo systemctl daemon-reload
sudo systemctl enable leochaind
sudo systemctl start leochaind

# 查看日志
sudo journalctl -u leochaind -f
```

#### 7. 配置 Nginx 反向代理 (推荐)

安装 Nginx:

```bash
sudo apt install nginx -y
```

配置 `/etc/nginx/sites-available/leochain`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # RPC 端点
    location /rpc/ {
        proxy_pass http://127.0.0.1:26657/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # CORS
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type";
    }

    # REST API 端点
    location /rest/ {
        proxy_pass http://127.0.0.1:1317/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # CORS
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type";
    }
}
```

启用配置:

```bash
sudo ln -s /etc/nginx/sites-available/leochain /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 8. 配置 HTTPS (使用 Certbot)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

### 方法 2: 使用 Docker

#### 1. 创建 Dockerfile

```dockerfile
# Dockerfile
FROM golang:1.24-alpine AS builder

RUN apk add --no-cache git make

WORKDIR /app
COPY . .

RUN go mod download
RUN go build -o /leochaind ./cmd/leochaind

FROM alpine:latest
RUN apk add --no-cache ca-certificates

COPY --from=builder /leochaind /usr/local/bin/

EXPOSE 26656 26657 1317 9090

CMD ["leochaind", "start"]
```

#### 2. 构建和运行

```bash
docker build -t leochain .
docker run -d -p 26657:26657 -p 1317:1317 -p 9090:9090 --name leochain-node leochain
```

### 方法 3: 使用云托管服务

- **Akash Network**: 去中心化云计算
- **Railway**: 简单的容器部署
- **Render**: 支持 Docker 部署
- **Fly.io**: 全球边缘部署

---

## 三、完整部署流程

### 步骤 1: 部署区块链节点

1. 选择一个 VPS 提供商 (推荐 DigitalOcean 或 Vultr)
2. 创建服务器并安装依赖
3. 上传代码并编译
4. 配置并启动节点
5. 设置 Nginx + HTTPS
6. 记录 API 端点:
   - RPC: `https://your-domain.com/rpc`
   - REST: `https://your-domain.com/rest`

### 步骤 2: 部署前端

1. 在 Cloudflare Pages 创建项目
2. 连接 GitHub 仓库
3. 配置环境变量:
   - `VITE_RPC_URL`: `https://your-domain.com/rpc`
   - `VITE_REST_URL`: `https://your-domain.com/rest`
4. 部署

### 步骤 3: 验证

1. 访问前端: `https://leochain-explorer.pages.dev`
2. 确认能够连接到区块链节点
3. 测试账户创建和转账功能

---

## 四、环境变量配置

### 前端 (Cloudflare Pages)

| 变量 | 说明 | 示例 |
|------|------|------|
| `VITE_RPC_URL` | CometBFT RPC 端点 | `https://rpc.leochain.io` |
| `VITE_REST_URL` | Cosmos REST API 端点 | `https://api.leochain.io` |

### 后端 (区块链节点)

配置文件位置: `~/.leochain/config/`

| 文件 | 说明 |
|------|------|
| `config.toml` | CometBFT 配置 |
| `app.toml` | Cosmos SDK 应用配置 |
| `genesis.json` | 创世区块配置 |

---

## 五、安全建议

1. **防火墙配置**
   ```bash
   sudo ufw allow 22/tcp    # SSH
   sudo ufw allow 80/tcp    # HTTP
   sudo ufw allow 443/tcp   # HTTPS
   sudo ufw allow 26656/tcp # P2P (仅对其他节点开放)
   sudo ufw enable
   ```

2. **不要暴露敏感端口**
   - gRPC (9090) 不建议直接暴露
   - 使用 Nginx 反向代理

3. **定期备份**
   ```bash
   # 备份数据
   tar -czvf leochain-backup.tar.gz ~/.leochain/data
   ```

4. **监控**
   - 使用 Prometheus + Grafana 监控节点状态
   - 设置告警通知

---

## 六、常见问题

### Q: 前端显示"无法连接到区块链节点"

**A**: 检查以下几点:
1. 区块链节点是否正在运行
2. 环境变量是否正确配置
3. CORS 是否已启用
4. 防火墙是否允许访问

### Q: 交易失败

**A**: 可能原因:
1. 账户没有足够的 stake 支付手续费
2. 网络连接问题
3. 节点未同步完成

### Q: 如何添加更多验证者节点?

**A**:
1. 在新服务器上部署节点
2. 配置 `persistent_peers` 连接到现有节点
3. 使用 `leochaind tx staking create-validator` 注册为验证者

---

## 七、参考链接

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Cosmos SDK 部署指南](https://docs.cosmos.network/main/user/run-node/run-production)
- [CometBFT 配置文档](https://docs.cometbft.com/v0.38/core/configuration)
