# LeoChain 区块链

**LeoChain** 是一个使用 Cosmos SDK 和 CometBFT (Tendermint) 构建的区块链，通过 [Ignite CLI](https://ignite.com/cli) 创建。

## 功能特性

1. **代币生产 (Mint)** - 铸造新的代币
2. **代币转账 (Transfer)** - 在用户之间转移代币
3. **用户账户管理** - 支持创建和管理多个账户
4. **验证者/矿工节点** - 配置了多个验证者节点
5. **区块链浏览器** - React 前端界面查看区块和交易信息

---

## 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    用户界面层                                │
│  ┌─────────────────┐  ┌─────────────────────────────────┐   │
│  │  CLI (leochaind) │  │  React 前端 (explorer/)         │   │
│  └────────┬────────┘  └────────────────┬────────────────┘   │
└───────────┼────────────────────────────┼────────────────────┘
            │                            │
            ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API 层                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ gRPC (:9090) │  │ REST (:1317) │  │ RPC (:26657) │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  应用层 (app/)                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  BaseApp - 交易路由、签名验证、Gas 计算              │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  模块层 (x/)                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐   │
│  │  Token 模块    │  │  LeoChain 模块  │  │ Cosmos 标准  │   │
│  │  (代币操作)    │  │  (基础模块)     │  │ 模块 (bank,  │   │
│  │               │  │                │  │ auth, stake) │   │
│  └───────┬───────┘  └───────┬────────┘  └──────┬───────┘   │
└──────────┼──────────────────┼──────────────────┼────────────┘
           │                  │                  │
           └──────────────────┼──────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  存储层 (KVStore)                            │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                CometBFT 共识层                               │
│         (区块生成、验证者共识、P2P 网络)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 快速开始

### 1. 启动区块链

```bash
cd /Users/leo/leochain
./start.sh
```

或者直接使用 Ignite:

```bash
ignite chain serve
```

### 2. 查看账户

```bash
leochaind keys list
```

### 3. 铸造代币

```bash
# 铸造 1000 个 leotoken 代币给 alice
leochaind tx token mint 1000 leotoken --from alice
```

### 4. 转账代币

```bash
# 从 alice 转账 100 个 leotoken 给 bob
leochaind tx bank send alice <bob地址> 100leotoken --chain-id leochain --yes
```

### 5. 查询余额

```bash
# 查询指定地址的余额
leochaind q bank balances <address>
```

---

## API 端点

启动后可用的 API 端点:

| 服务 | 端口 | 用途 |
|------|------|------|
| REST API | http://localhost:1317 | RESTful 查询接口 |
| RPC | http://localhost:26657 | CometBFT RPC 接口 |
| gRPC | localhost:9090 | gRPC 服务接口 |

---

## 区块链浏览器 (React 前端)

区块链浏览器使用 **React + TypeScript + Vite** 构建，提供完整的前端界面。

### 启动前端

```bash
cd explorer
npm install
npm run dev
```

前端将运行在 http://localhost:3000

### 前端功能

- **区块浏览器** - 查看最新区块和验证者信息
- **账户管理** - 创建新账户、导入账户、导出助记词
- **代币转账** - 在账户之间转移代币
- **搜索功能** - 搜索区块、交易和账户

### 前端与后端交互

```
┌─────────────────────────────────────────────────────────┐
│                  React 前端 (explorer/)                 │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐    │
│  │BlockExplorer│  │AccountManager│  │  Transfer   │    │
│  │  区块浏览器  │  │  账户管理    │  │   转账     │    │
│  └──────┬──────┘  └──────┬───────┘  └──────┬──────┘    │
└─────────┼────────────────┼─────────────────┼────────────┘
          │                │                 │
          ▼                ▼                 ▼
┌─────────────────────────────────────────────────────────┐
│                  services/ 服务层                        │
├─────────────────────────────────────────────────────────┤
│  api.ts                    wallet.ts                    │
│  ├─ getNodeStatus()        ├─ createAccount()          │
│  ├─ getBlocks()            ├─ importAccount()          │
│  ├─ getValidators()        ├─ transferTokens()         │
│  ├─ getBalances()          └─ exportMnemonic()         │
│  └─ getTransaction()                                    │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│               区块链 API 端点                            │
├─────────────────────────────────────────────────────────┤
│  RPC (26657)           REST (1317)                      │
│  ├─ /status            ├─ /cosmos/bank/v1beta1/        │
│  ├─ /block             │   balances/{address}          │
│  ├─ /validators        ├─ /leochain/token/v1/          │
│  └─ /tx_search         │   balance/{addr}/{denom}      │
└─────────────────────────────────────────────────────────┘
```

---

## 初始配置

### 预设账户

| 账户名 | 地址 | leotoken 余额 | stake 余额 |
|--------|------|--------------|------------|
| alice  | leo144sgl4m8nazh57ywn3yx8rx827hgsu0e4fa8k5 | 1,000,000 | 200,000,000 |
| bob    | leo19xs8jhdgzhu3u7lnf58ur8qx86um48sxdes380 | 500,000 | 100,000,000 |
| carol  | leo1jhqlezryh7wgcsm2j5usmgjqmeskvz4vthcum8 | 250,000 | 50,000,000 |

### 验证者

| 验证者 | 抵押量 |
|--------|--------|
| alice | 100,000,000 stake |
| validator1 | 200,000,000 stake |
| validator2 | 100,000,000 stake |

---

## 项目结构

```
leochain/
├── app/                     # 应用程序配置
│   ├── app.go              # App 主入口
│   └── app_config.go       # 模块配置和依赖注入
├── cmd/                     # CLI 命令
│   └── leochaind/          # 区块链守护进程
├── explorer/                # React 前端应用
│   ├── src/
│   │   ├── components/     # React 组件
│   │   │   ├── Header.tsx
│   │   │   ├── BlockExplorer.tsx
│   │   │   ├── AccountManager.tsx
│   │   │   └── Transfer.tsx
│   │   ├── services/       # API 和钱包服务
│   │   │   ├── api.ts      # 区块链 API 调用
│   │   │   └── wallet.ts   # 钱包管理
│   │   └── types/          # TypeScript 类型定义
│   ├── package.json
│   └── vite.config.ts
├── proto/                   # Protobuf 定义
│   └── leochain/
│       ├── token/v1/       # Token 模块 Proto
│       └── leochain/v1/    # LeoChain 模块 Proto
├── x/                       # 自定义模块
│   ├── leochain/           # 基础模块
│   └── token/              # 代币模块 (核心)
│       ├── keeper/         # 状态管理
│       │   ├── keeper.go
│       │   ├── msg_server_mint.go
│       │   ├── msg_server_transfer.go
│       │   └── query_balance.go
│       ├── module/         # 模块定义
│       └── types/          # 类型定义
│           └── expected_keepers.go
├── config.yml               # Ignite 配置
├── go.mod                   # Go 模块
├── start.sh                 # 启动脚本
└── README_CN.md             # 本文档
```

---

## Token 模块详解

### 模块结构

```
x/token/
├── keeper/                    # 状态管理层
│   ├── keeper.go             # Keeper 初始化
│   ├── msg_server_mint.go    # 铸造逻辑
│   ├── msg_server_transfer.go # 转账逻辑
│   └── query_balance.go      # 余额查询
├── module/                    # 模块注册
│   └── module.go
├── types/                     # 类型定义
│   ├── expected_keepers.go   # 依赖接口
│   └── keys.go               # 存储键
└── proto/                     # Protobuf 定义
```

### 消息类型

#### MsgMint (铸造代币)

```protobuf
message MsgMint {
  string creator = 1;  // 铸造者地址
  uint64 amount = 2;   // 铸造数量
  string denom = 3;    // 代币名称
}
```

**处理流程:**
```
1. 验证 creator 地址有效性
2. 创建 Coins: [amount denom]
3. bankKeeper.MintCoins() - 在模块账户铸造
4. bankKeeper.SendCoinsFromModuleToAccount() - 转给 creator
```

#### MsgTransfer (转账代币)

```protobuf
message MsgTransfer {
  string sender = 1;    // 发送者地址
  uint64 amount = 2;    // 转账数量
  string denom = 3;     // 代币名称
  string receiver = 4;  // 接收者地址
}
```

**处理流程:**
```
1. 验证 sender 地址有效性
2. 验证 receiver 地址有效性
3. 创建 Coins: [amount denom]
4. bankKeeper.SendCoins() - 从 sender 转给 receiver
```

### Keeper 依赖关系

```go
// x/token/types/expected_keepers.go
type BankKeeper interface {
    MintCoins(ctx, moduleName, amt)           // 铸造代币
    SendCoinsFromModuleToAccount(ctx, ...)    // 模块→账户
    SendCoins(ctx, from, to, amt)             // 账户→账户
    GetBalance(ctx, addr, denom)              // 查询余额
}
```

### 模块依赖关系

```
┌─────────────────────────────────────────────────────────┐
│                    Token 模块                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  MsgMint    MsgTransfer    QueryBalance         │   │
│  └────────────────────┬────────────────────────────┘   │
└───────────────────────┼─────────────────────────────────┘
                        │ 调用
                        ▼
┌─────────────────────────────────────────────────────────┐
│                    Bank 模块                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │  管理所有账户余额                                │   │
│  │  MintCoins / SendCoins / GetBalance             │   │
│  └────────────────────┬────────────────────────────┘   │
└───────────────────────┼─────────────────────────────────┘
                        │ 调用
                        ▼
┌─────────────────────────────────────────────────────────┐
│                    Auth 模块                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │  账户管理、地址编码、签名验证                     │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 完整交易流程

以 **"Alice 转 100 leotoken 给 Bob"** 为例：

```
步骤 1: 用户发起
┌────────────────────────────────────────────────────────┐
│  CLI: leochaind tx bank send alice bob 100leotoken    │
│  或 前端: Transfer 组件提交表单                        │
└────────────────────────────┬───────────────────────────┘
                             │
步骤 2: 交易构建             ▼
┌────────────────────────────────────────────────────────┐
│  构建 MsgSend {                                        │
│    FromAddress: "leo144sgl4m8nazh57ywn3yx8rx827..."   │
│    ToAddress: "leo19xs8jhdgzhu3u7lnf58ur8qx86um..."   │
│    Amount: [{denom: "leotoken", amount: "100"}]       │
│  }                                                    │
└────────────────────────────┬───────────────────────────┘
                             │
步骤 3: 签名                 ▼
┌────────────────────────────────────────────────────────┐
│  使用 Alice 私钥签名交易                               │
│  附加: account_number, sequence, chain_id, gas        │
└────────────────────────────┬───────────────────────────┘
                             │
步骤 4: 广播                 ▼
┌────────────────────────────────────────────────────────┐
│  提交到节点 RPC (localhost:26657)                      │
│  → 进入 Mempool (内存交易池)                           │
└────────────────────────────┬───────────────────────────┘
                             │
步骤 5: 验证                 ▼
┌────────────────────────────────────────────────────────┐
│  BaseApp.CheckTx():                                    │
│  ├─ 验证签名正确性                                     │
│  ├─ 验证 nonce (sequence) 递增                        │
│  ├─ 检查 Gas 费用 (需要 stake)                        │
│  └─ 检查 Alice 余额 ≥ 100 leotoken                    │
└────────────────────────────┬───────────────────────────┘
                             │
步骤 6: 打包入块             ▼
┌────────────────────────────────────────────────────────┐
│  验证者将交易打包进新区块                              │
│  CometBFT 共识确认区块                                 │
└────────────────────────────┬───────────────────────────┘
                             │
步骤 7: 执行                 ▼
┌────────────────────────────────────────────────────────┐
│  Bank 模块 SendCoins():                                │
│  ├─ Alice 账户: 余额减少 100 leotoken                 │
│  ├─ Bob 账户: 余额增加 100 leotoken                   │
│  └─ 扣除 Gas 费用 (约 500 stake)                       │
└────────────────────────────┬───────────────────────────┘
                             │
步骤 8: 状态提交             ▼
┌────────────────────────────────────────────────────────┐
│  KVStore 持久化新状态                                  │
│  返回 TxHash: 7BDC04039A00677BA1050...                 │
└────────────────────────────────────────────────────────┘
```

---

## 关键文件位置

| 功能 | 文件路径 |
|------|---------|
| 应用配置 | `app/app.go`, `app/app_config.go` |
| Token 铸造逻辑 | `x/token/keeper/msg_server_mint.go` |
| Token 转账逻辑 | `x/token/keeper/msg_server_transfer.go` |
| 余额查询逻辑 | `x/token/keeper/query_balance.go` |
| 依赖接口定义 | `x/token/types/expected_keepers.go` |
| Proto 消息定义 | `proto/leochain/token/v1/tx.proto` |
| 链配置 | `config.yml` |
| React 前端入口 | `explorer/src/App.tsx` |
| API 服务 | `explorer/src/services/api.ts` |
| 钱包服务 | `explorer/src/services/wallet.ts` |

---

## 常用命令

### 账户管理

```bash
# 查看所有账户
leochaind keys list

# 创建新账户
leochaind keys add <账户名>

# 查看账户地址
leochaind keys show <账户名> -a

# 删除账户
leochaind keys delete <账户名>
```

### 代币操作

```bash
# 铸造代币
leochaind tx token mint <数量> <代币名> --from <账户名>

# 转账代币
leochaind tx bank send <发送账户> <接收地址> <数量><代币名> --chain-id leochain --yes

# 查询余额
leochaind q bank balances <地址>
```

### 区块链查询

```bash
# 查看节点状态
curl http://localhost:26657/status

# 查看最新区块
curl http://localhost:26657/block

# 查看验证者
curl http://localhost:26657/validators
```

---

## 注意事项

1. **手续费**: 每笔交易需要支付约 500 stake 作为手续费
2. **新账户**: 在前端创建的新账户没有 stake，需要先转入 stake 才能发起交易
3. **助记词**: 创建账户时务必备份助记词，丢失后无法恢复

---

## 技术栈

- **区块链框架**: Cosmos SDK v0.53.4
- **共识引擎**: CometBFT v0.38.17
- **开发工具**: Ignite CLI v29.6.0
- **后端语言**: Go 1.24+
- **前端框架**: React 19 + TypeScript + Vite
- **钱包库**: CosmJS

---

## 了解更多

- [Ignite CLI](https://ignite.com/cli)
- [Cosmos SDK 文档](https://docs.cosmos.network)
- [CometBFT 文档](https://docs.cometbft.com)
- [CosmJS 文档](https://cosmos.github.io/cosmjs/)
