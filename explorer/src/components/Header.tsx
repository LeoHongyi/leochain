import { useEffect, useState } from 'react';
import { getNodeStatus } from '../services/api';
import type { NodeStatus } from '../types';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const [status, setStatus] = useState<NodeStatus | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await getNodeStatus();
        setStatus(data);
        setError('');
      } catch (e) {
        setError('无法连接到区块链节点');
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: 'explorer', label: '区块浏览器' },
    { id: 'accounts', label: '账户管理' },
    { id: 'transfer', label: '转账' },
  ];

  return (
    <header className="header">
      <div className="header-top">
        <h1 className="logo">LeoChain</h1>
        {status && (
          <div className="node-status">
            <span className="status-dot"></span>
            <span>区块高度: {status.syncInfo.latestBlockHeight}</span>
            <span className="network-name">{status.nodeInfo.network}</span>
          </div>
        )}
        {error && <div className="error-badge">{error}</div>}
      </div>
      <nav className="nav-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
