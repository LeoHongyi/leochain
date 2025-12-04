import { useState, useEffect } from 'react';
import {
  getLocalAccounts,
  createAccount,
  importAccount,
  deleteAccount,
  exportMnemonic
} from '../services/wallet';
import { getBalances } from '../services/api';
import type { Account, Balance } from '../types';

export function AccountManager() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState<string | null>(null);
  const [newAccountName, setNewAccountName] = useState('');
  const [importMnemonic, setImportMnemonic] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      loadBalances(selectedAccount);
    }
  }, [selectedAccount]);

  const loadAccounts = () => {
    const localAccounts = getLocalAccounts();
    setAccounts(localAccounts);
    if (localAccounts.length > 0 && !selectedAccount) {
      setSelectedAccount(localAccounts[0].address);
    }
  };

  const loadBalances = async (address: string) => {
    try {
      const data = await getBalances(address);
      setBalances(data);
    } catch (e) {
      console.error('Failed to load balances', e);
      setBalances([]);
    }
  };

  const handleCreateAccount = async () => {
    if (!newAccountName.trim()) {
      setMessage({ type: 'error', text: '请输入账户名称' });
      return;
    }

    setLoading(true);
    try {
      const account = await createAccount(newAccountName.trim());
      loadAccounts();
      setSelectedAccount(account.address);
      setShowCreateModal(false);
      setNewAccountName('');

      // 显示助记词
      const mnemonic = exportMnemonic(account.address);
      if (mnemonic) {
        setShowMnemonic(mnemonic);
      }

      setMessage({ type: 'success', text: '账户创建成功！请务必备份助记词！' });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || '创建账户失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleImportAccount = async () => {
    if (!newAccountName.trim()) {
      setMessage({ type: 'error', text: '请输入账户名称' });
      return;
    }
    if (!importMnemonic.trim()) {
      setMessage({ type: 'error', text: '请输入助记词' });
      return;
    }

    setLoading(true);
    try {
      const account = await importAccount(newAccountName.trim(), importMnemonic.trim());
      loadAccounts();
      setSelectedAccount(account.address);
      setShowImportModal(false);
      setNewAccountName('');
      setImportMnemonic('');
      setMessage({ type: 'success', text: '账户导入成功！' });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || '导入账户失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = (address: string) => {
    if (confirm('确定要删除此账户吗？请确保已备份助记词！')) {
      deleteAccount(address);
      loadAccounts();
      if (selectedAccount === address) {
        setSelectedAccount(null);
        setBalances([]);
      }
      setMessage({ type: 'success', text: '账户已删除' });
    }
  };

  const handleExportMnemonic = (address: string) => {
    const mnemonic = exportMnemonic(address);
    if (mnemonic) {
      setShowMnemonic(mnemonic);
    } else {
      setMessage({ type: 'error', text: '无法导出助记词' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: '已复制到剪贴板' });
  };

  return (
    <div className="account-manager">
      {/* 消息提示 */}
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="account-actions">
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          创建新账户
        </button>
        <button className="btn-secondary" onClick={() => setShowImportModal(true)}>
          导入账户
        </button>
      </div>

      <div className="account-grid">
        {/* 账户列表 */}
        <div className="card">
          <h2>我的账户</h2>
          {accounts.length === 0 ? (
            <p className="empty-state">暂无账户，请创建或导入账户</p>
          ) : (
            <div className="accounts-list">
              {accounts.map((account) => (
                <div
                  key={account.address}
                  className={`account-item ${selectedAccount === account.address ? 'selected' : ''}`}
                  onClick={() => setSelectedAccount(account.address)}
                >
                  <div className="account-name">{account.name}</div>
                  <div className="account-address">{account.address}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 账户详情 */}
        <div className="card">
          <h2>账户详情</h2>
          {selectedAccount ? (
            <div className="account-detail">
              <div className="detail-row">
                <label>地址:</label>
                <div className="address-row">
                  <code>{selectedAccount}</code>
                  <button onClick={() => copyToClipboard(selectedAccount)}>复制</button>
                </div>
              </div>

              <div className="detail-row">
                <label>余额:</label>
                {balances.length > 0 ? (
                  <ul className="balance-list">
                    {balances.map((b) => (
                      <li key={b.denom}>
                        <span className="amount">{b.amount}</span>
                        <span className="denom">{b.denom}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>无余额</p>
                )}
              </div>

              <div className="detail-actions">
                <button onClick={() => handleExportMnemonic(selectedAccount)}>
                  导出助记词
                </button>
                <button
                  className="btn-danger"
                  onClick={() => handleDeleteAccount(selectedAccount)}
                >
                  删除账户
                </button>
              </div>
            </div>
          ) : (
            <p className="empty-state">请选择一个账户</p>
          )}
        </div>
      </div>

      {/* 创建账户模态框 */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>创建新账户</h3>
            <div className="form-group">
              <label>账户名称</label>
              <input
                type="text"
                placeholder="输入账户名称"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowCreateModal(false)}>取消</button>
              <button
                className="btn-primary"
                onClick={handleCreateAccount}
                disabled={loading}
              >
                {loading ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 导入账户模态框 */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>导入账户</h3>
            <div className="form-group">
              <label>账户名称</label>
              <input
                type="text"
                placeholder="输入账户名称"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>助记词</label>
              <textarea
                placeholder="输入24个助记词，用空格分隔"
                value={importMnemonic}
                onChange={(e) => setImportMnemonic(e.target.value)}
                rows={4}
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowImportModal(false)}>取消</button>
              <button
                className="btn-primary"
                onClick={handleImportAccount}
                disabled={loading}
              >
                {loading ? '导入中...' : '导入'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 助记词显示模态框 */}
      {showMnemonic && (
        <div className="modal-overlay" onClick={() => setShowMnemonic(null)}>
          <div className="modal mnemonic-modal" onClick={(e) => e.stopPropagation()}>
            <h3>请备份您的助记词</h3>
            <div className="warning">
              请将以下助记词安全保存，丢失后将无法恢复账户！
            </div>
            <div className="mnemonic-box">
              {showMnemonic.split(' ').map((word, index) => (
                <span key={index} className="mnemonic-word">
                  <small>{index + 1}</small> {word}
                </span>
              ))}
            </div>
            <div className="modal-actions">
              <button onClick={() => copyToClipboard(showMnemonic)}>复制助记词</button>
              <button className="btn-primary" onClick={() => setShowMnemonic(null)}>
                我已备份
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
