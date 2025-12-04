// 区块信息
export interface Block {
  height: string;
  hash: string;
  time: string;
  proposer: string;
  txCount: number;
}

// 验证者信息
export interface Validator {
  address: string;
  votingPower: string;
  proposerPriority: string;
}

// 账户信息
export interface Account {
  name: string;
  address: string;
  pubkey?: string;
}

// 余额信息
export interface Balance {
  denom: string;
  amount: string;
}

// 交易信息
export interface Transaction {
  hash: string;
  height: string;
  code: number;
  gasUsed: string;
  gasWanted: string;
  events?: any[];
}

// 节点状态
export interface NodeStatus {
  nodeInfo: {
    network: string;
    version: string;
    moniker: string;
  };
  syncInfo: {
    latestBlockHeight: string;
    latestBlockTime: string;
    catchingUp: boolean;
  };
}
