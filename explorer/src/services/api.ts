import axios from 'axios';
import type { Block, Validator, Balance, Transaction, NodeStatus } from '../types';

// API 端点配置 - 支持环境变量配置
const RPC_URL = import.meta.env.VITE_RPC_URL || 'http://localhost:26657';
const REST_URL = import.meta.env.VITE_REST_URL || 'http://localhost:1317';

// RPC API 客户端
const rpcClient = axios.create({
  baseURL: RPC_URL,
  timeout: 10000,
});

// REST API 客户端
const restClient = axios.create({
  baseURL: REST_URL,
  timeout: 10000,
});

// 获取节点状态
export async function getNodeStatus(): Promise<NodeStatus> {
  const response = await rpcClient.get('/status');
  const result = response.data.result;
  return {
    nodeInfo: {
      network: result.node_info.network,
      version: result.node_info.version,
      moniker: result.node_info.moniker,
    },
    syncInfo: {
      latestBlockHeight: result.sync_info.latest_block_height,
      latestBlockTime: result.sync_info.latest_block_time,
      catchingUp: result.sync_info.catching_up,
    },
  };
}

// 获取区块列表
export async function getBlocks(limit: number = 10): Promise<Block[]> {
  const status = await getNodeStatus();
  const latestHeight = parseInt(status.syncInfo.latestBlockHeight);
  const blocks: Block[] = [];

  for (let i = 0; i < limit && latestHeight - i > 0; i++) {
    const height = latestHeight - i;
    try {
      const block = await getBlock(height.toString());
      blocks.push(block);
    } catch (e) {
      console.error(`Failed to get block ${height}`, e);
    }
  }

  return blocks;
}

// 获取单个区块
export async function getBlock(height: string): Promise<Block> {
  const response = await rpcClient.get(`/block?height=${height}`);
  const result = response.data.result;
  return {
    height: result.block.header.height,
    hash: result.block_id.hash,
    time: result.block.header.time,
    proposer: result.block.header.proposer_address,
    txCount: result.block.data.txs?.length || 0,
  };
}

// 获取验证者列表
export async function getValidators(): Promise<Validator[]> {
  const response = await rpcClient.get('/validators');
  const result = response.data.result;
  return result.validators.map((v: any) => ({
    address: v.address,
    votingPower: v.voting_power,
    proposerPriority: v.proposer_priority,
  }));
}

// 获取账户余额 (使用 bank 模块)
export async function getBalances(address: string): Promise<Balance[]> {
  try {
    const response = await restClient.get(`/cosmos/bank/v1beta1/balances/${address}`);
    return response.data.balances || [];
  } catch (e) {
    console.error('Failed to get balances', e);
    return [];
  }
}

// 获取特定代币余额 (使用自定义 token 模块)
export async function getTokenBalance(address: string, denom: string): Promise<string> {
  try {
    const response = await restClient.get(`/leochain/token/balance/${address}/${denom}`);
    return response.data.balance || '0';
  } catch (e) {
    console.error('Failed to get token balance', e);
    return '0';
  }
}

// 获取交易详情
export async function getTransaction(hash: string): Promise<Transaction | null> {
  try {
    const response = await rpcClient.get(`/tx?hash=0x${hash}`);
    const result = response.data.result;
    return {
      hash: result.hash,
      height: result.height,
      code: result.tx_result.code,
      gasUsed: result.tx_result.gas_used,
      gasWanted: result.tx_result.gas_wanted,
      events: result.tx_result.events,
    };
  } catch (e) {
    console.error('Failed to get transaction', e);
    return null;
  }
}

// 获取最新交易
export async function getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
  try {
    const response = await rpcClient.get(`/tx_search?query="tx.height>0"&per_page=${limit}&order_by="desc"`);
    const result = response.data.result;
    return (result.txs || []).map((tx: any) => ({
      hash: tx.hash,
      height: tx.height,
      code: tx.tx_result.code,
      gasUsed: tx.tx_result.gas_used,
      gasWanted: tx.tx_result.gas_wanted,
    }));
  } catch (e) {
    console.error('Failed to get recent transactions', e);
    return [];
  }
}

// 获取账户信息
export async function getAccount(address: string): Promise<any> {
  try {
    const response = await restClient.get(`/cosmos/auth/v1beta1/accounts/${address}`);
    return response.data.account;
  } catch (e) {
    console.error('Failed to get account', e);
    return null;
  }
}
