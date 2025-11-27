function Header({ account, activeTab, setActiveTab, darkMode, toggleTheme, connectWallet }) {
  return (
    <header className="navbar">
      <div className="nav-container">
        <div className="nav-left">
          <div className="logo">
            <span className="logo-icon">🎓</span>
            <span className="logo-text">CertiFi</span>
          </div>
        </div>
        
        <nav className="nav-center">
          <button className={`nav-link ${activeTab === 'mint' ? 'active' : ''}`} onClick={() => setActiveTab('mint')}>
            Create
          </button>
          <button className={`nav-link ${activeTab === 'portfolio' ? 'active' : ''}`} onClick={() => setActiveTab('portfolio')}>
            Portfolio
          </button>
          <button className={`nav-link ${activeTab === 'verify' ? 'active' : ''}`} onClick={() => setActiveTab('verify')}>
            Verify
          </button>
        </nav>

        <div className="nav-right">
          <button className="theme-toggle" onClick={toggleTheme}>
            {darkMode ? '☀️' : '🌙'}
          </button>
          
          {!account ? (
            <button className="connect-wallet-btn" onClick={connectWallet}>Connect Wallet</button>
          ) : (
            <div className="wallet-connected">
              <span className="wallet-address">{account.slice(0,6)}...{account.slice(-4)}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;