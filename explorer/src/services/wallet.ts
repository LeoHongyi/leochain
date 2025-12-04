import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { SigningStargateClient, StargateClient } from '@cosmjs/stargate';
import type { Account } from '../types';

// 支持环境变量配置
const RPC_ENDPOINT = import.meta.env.VITE_RPC_URL || 'http://localhost:26657';
const ADDRESS_PREFIX = 'leo';

// 存储账户的本地存储键
const ACCOUNTS_STORAGE_KEY = 'leochain_accounts';

// 账户信息（包含助记词）
interface StoredAccount {
  name: string;
  address: string;
  mnemonic: string;
}

// 获取所有本地账户
export function getLocalAccounts(): Account[] {
  const stored = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
  if (!stored) return [];
  const accounts: StoredAccount[] = JSON.parse(stored);
  return accounts.map(a => ({ name: a.name, address: a.address }));
}

// 保存账户到本地
function saveAccount(account: StoredAccount): void {
  const stored = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
  const accounts: StoredAccount[] = stored ? JSON.parse(stored) : [];
  accounts.push(account);
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
}

// 获取账户助记词
function getAccountMnemonic(address: string): string | null {
  const stored = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
  if (!stored) return null;
  const accounts: StoredAccount[] = JSON.parse(stored);
  const account = accounts.find(a => a.address === address);
  return account?.mnemonic || null;
}

// 删除账户
export function deleteAccount(address: string): void {
  const stored = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
  if (!stored) return;
  const accounts: StoredAccount[] = JSON.parse(stored);
  const filtered = accounts.filter(a => a.address !== address);
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(filtered));
}

// 创建新账户
export async function createAccount(name: string): Promise<Account> {
  // 生成新的助记词钱包
  const wallet = await DirectSecp256k1HdWallet.generate(24, {
    prefix: ADDRESS_PREFIX,
  });

  const [account] = await wallet.getAccounts();
  const mnemonic = wallet.mnemonic;

  // 保存到本地存储
  saveAccount({
    name,
    address: account.address,
    mnemonic,
  });

  return {
    name,
    address: account.address,
  };
}

// 导入账户（通过助记词）
export async function importAccount(name: string, mnemonic: string): Promise<Account> {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: ADDRESS_PREFIX,
  });

  const [account] = await wallet.getAccounts();

  // 保存到本地存储
  saveAccount({
    name,
    address: account.address,
    mnemonic,
  });

  return {
    name,
    address: account.address,
  };
}

// 获取钱包签名客户端
async function getSigningClient(address: string): Promise<SigningStargateClient | null> {
  const mnemonic = getAccountMnemonic(address);
  if (!mnemonic) {
    console.error('Account mnemonic not found');
    return null;
  }

  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: ADDRESS_PREFIX,
  });

  const client = await SigningStargateClient.connectWithSigner(RPC_ENDPOINT, wallet);
  return client;
}

// 转账代币
export async function transferTokens(
  fromAddress: string,
  toAddress: string,
  amount: string,
  denom: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const client = await getSigningClient(fromAddress);
    if (!client) {
      return { success: false, error: '无法获取签名客户端' };
    }

    const result = await client.sendTokens(
      fromAddress,
      toAddress,
      [{ denom, amount }],
      {
        amount: [{ denom: 'stake', amount: '500' }],
        gas: '200000',
      }
    );

    return {
      success: result.code === 0,
      txHash: result.transactionHash,
      error: result.code !== 0 ? `交易失败: code ${result.code}` : undefined,
    };
  } catch (e: any) {
    return { success: false, error: e.message || '转账失败' };
  }
}

// 获取只读客户端
export async function getReadOnlyClient(): Promise<StargateClient | null> {
  try {
    return await StargateClient.connect(RPC_ENDPOINT);
  } catch (e) {
    console.error('Failed to connect to RPC', e);
    return null;
  }
}

// 导出助记词（用于备份）
export function exportMnemonic(address: string): string | null {
  return getAccountMnemonic(address);
}
