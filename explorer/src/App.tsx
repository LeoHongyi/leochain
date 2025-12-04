import { useState } from 'react';
import { Header } from './components/Header';
import { BlockExplorer } from './components/BlockExplorer';
import { AccountManager } from './components/AccountManager';
import { Transfer } from './components/Transfer';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('explorer');

  const renderContent = () => {
    switch (activeTab) {
      case 'explorer':
        return <BlockExplorer />;
      case 'accounts':
        return <AccountManager />;
      case 'transfer':
        return <Transfer />;
      default:
        return <BlockExplorer />;
    }
  };

  return (
    <div className="app">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="main-content">
        {renderContent()}
      </main>
      <footer className="footer">
        <p>LeoChain - 基于 Cosmos SDK 构建</p>
        <p>
          <small>
            REST API: <a href="http://localhost:1317" target="_blank">localhost:1317</a> |
            RPC: <a href="http://localhost:26657" target="_blank">localhost:26657</a>
          </small>
        </p>
      </footer>
    </div>
  );
}

export default App;
