import { useEffect, useState } from 'react';
import { getBlocks, getValidators, getBlock, getTransaction, getBalances } from '../services/api';
import type { Block, Validator, Balance } from '../types';

export function BlockExplorer() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [validators, setValidators] = useState<Validator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchType, setSearchType] = useState<'block' | 'tx' | 'account' | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [blocksData, validatorsData] = await Promise.all([
          getBlocks(10),
          getValidators(),
        ]);
        setBlocks(blocksData);
        setValidators(validatorsData);
      } catch (e) {
        console.error('Failed to fetch data', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchResult(null);
    setSearchType(null);

    const query = searchQuery.trim();

    try {
      // 尝试作为区块高度搜索
      if (/^\d+$/.test(query)) {
        const block = await getBlock(query);
        if (block) {
          setSearchResult(block);
          setSearchType('block');
          setSearching(false);
          return;
        }
      }

      // 尝试作为地址搜索
      if (query.startsWith('leo')) {
        const balances = await getBalances(query);
        setSearchResult({ address: query, balances });
        setSearchType('account');
        setSearching(false);
        return;
      }

      // 尝试作为交易哈希搜索
      if (query.length === 64) {
        const tx = await getTransaction(query);
        if (tx) {
          setSearchResult(tx);
          setSearchType('tx');
          setSearching(false);
          return;
        }
      }

      setSearchResult({ error: '未找到结果' });
    } catch (e) {
      setSearchResult({ error: '搜索失败' });
    } finally {
      setSearching(false);
    }
  };

  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleString('zh-CN');
  };

  const truncateHash = (hash: string) => {
    if (!hash) return '';
    return hash.slice(0, 8) + '...' + hash.slice(-8);
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="explorer">
      {/* 搜索框 */}
      <div className="search-box">
        <input
          type="text"
          placeholder="搜索区块高度、交易哈希或地址..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} disabled={searching}>
          {searching ? '搜索中...' : '搜索'}
        </button>
      </div>

      {/* 搜索结果 */}
      {searchResult && (
        <div className="search-result">
          <div className="result-header">
            <h3>搜索结果</h3>
            <button onClick={() => setSearchResult(null)}>关闭</button>
          </div>
          {searchResult.error ? (
            <p className="error">{searchResult.error}</p>
          ) : searchType === 'block' ? (
            <div className="result-content">
              <h4>区块 #{searchResult.height}</h4>
              <p><strong>哈希:</strong> {searchResult.hash}</p>
              <p><strong>时间:</strong> {formatTime(searchResult.time)}</p>
              <p><strong>交易数:</strong> {searchResult.txCount}</p>
            </div>
          ) : searchType === 'account' ? (
            <div className="result-content">
              <h4>账户</h4>
              <p><strong>地址:</strong> {searchResult.address}</p>
              <h5>余额:</h5>
              {searchResult.balances?.length > 0 ? (
                <ul>
                  {searchResult.balances.map((b: Balance) => (
                    <li key={b.denom}>{b.amount} {b.denom}</li>
                  ))}
                </ul>
              ) : (
                <p>无余额</p>
              )}
            </div>
          ) : searchType === 'tx' ? (
            <div className="result-content">
              <h4>交易</h4>
              <p><strong>哈希:</strong> {searchResult.hash}</p>
              <p><strong>区块高度:</strong> {searchResult.height}</p>
              <p><strong>状态:</strong> {searchResult.code === 0 ? '成功' : '失败'}</p>
              <p><strong>Gas 使用:</strong> {searchResult.gasUsed} / {searchResult.gasWanted}</p>
            </div>
          ) : null}
        </div>
      )}

      <div className="explorer-grid">
        {/* 区块列表 */}
        <div className="card">
          <h2>最新区块</h2>
          <div className="blocks-list">
            {blocks.map((block) => (
              <div key={block.height} className="block-item">
                <div className="block-height">#{block.height}</div>
                <div className="block-info">
                  <span className="block-hash">{truncateHash(block.hash)}</span>
                  <span className="block-time">{formatTime(block.time)}</span>
                </div>
                <div className="block-txs">{block.txCount} 笔交易</div>
              </div>
            ))}
          </div>
        </div>

        {/* 验证者列表 */}
        <div className="card">
          <h2>验证者</h2>
          <div className="validators-list">
            {validators.map((validator, index) => (
              <div key={validator.address} className="validator-item">
                <div className="validator-rank">#{index + 1}</div>
                <div className="validator-info">
                  <span className="validator-address">{truncateHash(validator.address)}</span>
                  <span className="validator-power">投票权: {validator.votingPower}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
