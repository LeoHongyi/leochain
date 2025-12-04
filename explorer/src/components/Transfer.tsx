import { useState, useEffect } from 'react';
import { getLocalAccounts, transferTokens } from '../services/wallet';
import { getBalances } from '../services/api';
import type { Account, Balance } from '../types';

export function Transfer() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [denom, setDenom] = useState('leotoken');
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    const localAccounts = getLocalAccounts();
    setAccounts(localAccounts);
    if (localAccounts.length > 0) {
      setFromAddress(localAccounts[0].address);
    }
  }, []);

  useEffect(() => {
    if (fromAddress) {
      loadBalances(fromAddress);
    }
  }, [fromAddress]);

  const loadBalances = async (address: string) => {
    try {
      const data = await getBalances(address);
      setBalances(data);
      // 设置默认代币
      if (data.length > 0 && !denom) {
        setDenom(data[0].denom);
      }
    } catch (e) {
      console.error('Failed to load balances', e);
      setBalances([]);
    }
  };

  const handleTransfer = async () => {
    // 验证
    if (!fromAddress) {
      setMessage({ type: 'error', text: '请选择发送账户' });
      return;
    }
    if (!toAddress) {
      setMessage({ type: 'error', text: '请输入接收地址' });
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setMessage({ type: 'error', text: '请输入有效金额' });
      return;
    }
    if (!denom) {
      setMessage({ type: 'error', text: '请选择代币' });
      return;
    }

    setLoading(true);
    setMessage(null);
    setTxHash(null);

    try {
      const result = await transferTokens(fromAddress, toAddress, amount, denom);

      if (result.success) {
        setMessage({ type: 'success', text: '转账成功！' });
        setTxHash(result.txHash || null);
        setAmount('');
        // 刷新余额
        loadBalances(fromAddress);
      } else {
        setMessage({ type: 'error', text: result.error || '转账失败' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || '转账失败' });
    } finally {
      setLoading(false);
    }
  };

  const getBalance = (denom: string): string => {
    const balance = balances.find(b => b.denom === denom);
    return balance?.amount || '0';
  };

  const selectAllBalance = () => {
    const balance = getBalance(denom);
    setAmount(balance);
  };

  return (
    <div className="transfer">
      {/* 消息提示 */}
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      {/* 交易成功显示哈希 */}
      {txHash && (
        <div className="tx-success">
          <p>交易哈希:</p>
          <code>{txHash}</code>
        </div>
      )}

      <div className="transfer-card card">
        <h2>代币转账</h2>

        {accounts.length === 0 ? (
          <div className="empty-state">
            <p>暂无可用账户</p>
            <p>请先在"账户管理"中创建或导入账户</p>
          </div>
        ) : (
          <div className="transfer-form">
            {/* 发送账户 */}
            <div className="form-group">
              <label>发送账户</label>
              <select
                value={fromAddress}
                onChange={(e) => setFromAddress(e.target.value)}
              >
                {accounts.map((account) => (
                  <option key={account.address} value={account.address}>
                    {account.name} ({account.address.slice(0, 10)}...{account.address.slice(-6)})
                  </option>
                ))}
              </select>
            </div>

            {/* 当前余额 */}
            {balances.length > 0 && (
              <div className="balance-info">
                <span>可用余额:</span>
                <div className="balance-tags">
                  {balances.map((b) => (
                    <span key={b.denom} className="balance-tag">
                      {b.amount} {b.denom}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 接收地址 */}
            <div className="form-group">
              <label>接收地址</label>
              <input
                type="text"
                placeholder="输入接收地址 (leo1...)"
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
              />
              {/* 快捷选择其他账户 */}
              {accounts.length > 1 && (
                <div className="quick-select">
                  <small>快捷选择:</small>
                  {accounts
                    .filter((a) => a.address !== fromAddress)
                    .map((account) => (
                      <button
                        key={account.address}
                        type="button"
                        className="quick-btn"
                        onClick={() => setToAddress(account.address)}
                      >
                        {account.name}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* 代币选择 */}
            <div className="form-group">
              <label>代币</label>
              <select value={denom} onChange={(e) => setDenom(e.target.value)}>
                <option value="leotoken">leotoken</option>
                <option value="stake">stake</option>
                {balances
                  .filter((b) => b.denom !== 'leotoken' && b.denom !== 'stake')
                  .map((b) => (
                    <option key={b.denom} value={b.denom}>
                      {b.denom}
                    </option>
                  ))}
              </select>
            </div>

            {/* 金额 */}
            <div className="form-group">
              <label>
                金额
                <span className="available">
                  可用: {getBalance(denom)} {denom}
                </span>
              </label>
              <div className="amount-input">
                <input
                  type="number"
                  placeholder="输入金额"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                />
                <button type="button" onClick={selectAllBalance}>
                  全部
                </button>
              </div>
            </div>

            {/* 手续费提示 */}
            <div className="fee-info">
              <small>预估手续费: 500 stake</small>
            </div>

            {/* 转账按钮 */}
            <button
              className="btn-primary btn-transfer"
              onClick={handleTransfer}
              disabled={loading}
            >
              {loading ? '转账中...' : '确认转账'}
            </button>
          </div>
        )}
      </div>

      {/* 最近交易记录 (可选) */}
      <div className="card recent-transfers">
        <h3>转账说明</h3>
        <ul>
          <li>转账需要支付少量 stake 作为手续费</li>
          <li>请确保接收地址正确，转账不可撤销</li>
          <li>交易确认通常需要几秒钟</li>
          <li>如果余额不足，转账将失败</li>
        </ul>
      </div>
    </div>
  );
}
