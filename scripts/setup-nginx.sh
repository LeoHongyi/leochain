#!/bin/bash
# Nginx 反向代理配置脚本

set -e

# 检查参数
if [ -z "$1" ]; then
    echo "用法: ./setup-nginx.sh <你的域名>"
    echo "示例: ./setup-nginx.sh leochain.example.com"
    exit 1
fi

DOMAIN=$1

echo "========================================="
echo "  配置 Nginx 反向代理"
echo "  域名: $DOMAIN"
echo "========================================="

# 安装 Nginx
echo ">>> 安装 Nginx..."
apt install -y nginx

# 创建配置文件
echo ">>> 创建 Nginx 配置..."
cat > /etc/nginx/sites-available/leochain << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # RPC 端点 (CometBFT)
    location / {
        proxy_pass http://127.0.0.1:26657;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;

        # CORS 配置
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;

        if (\$request_method = OPTIONS) {
            return 204;
        }
    }

    # REST API 端点
    location /rest/ {
        rewrite ^/rest/(.*) /\$1 break;
        proxy_pass http://127.0.0.1:1317;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;

        # CORS 配置
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;

        if (\$request_method = OPTIONS) {
            return 204;
        }
    }

    # 直接访问 REST API (不带 /rest 前缀)
    location /cosmos/ {
        proxy_pass http://127.0.0.1:1317;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;

        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
    }

    location /leochain/ {
        proxy_pass http://127.0.0.1:1317;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;

        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
    }
}
EOF

# 启用配置
echo ">>> 启用配置..."
ln -sf /etc/nginx/sites-available/leochain /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试配置
echo ">>> 测试 Nginx 配置..."
nginx -t

# 重启 Nginx
echo ">>> 重启 Nginx..."
systemctl restart nginx
systemctl enable nginx

echo "========================================="
echo "  Nginx 配置完成!"
echo ""
echo "  RPC 端点: http://$DOMAIN"
echo "  REST API: http://$DOMAIN/cosmos/..."
echo ""
echo "  配置 HTTPS 请运行:"
echo "  apt install certbot python3-certbot-nginx -y"
echo "  certbot --nginx -d $DOMAIN"
echo "========================================="
