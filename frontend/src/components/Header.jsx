import ThemeToggle from './ThemeToggle';

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
            <span className="nav-link-text">Create</span>
          </button>
          <button className={`nav-link ${activeTab === 'portfolio' ? 'active' : ''}`} onClick={() => setActiveTab('portfolio')}>
            <span className="nav-link-text">Portfolio</span>
          </button>
          <button className={`nav-link ${activeTab === 'verify' ? 'active' : ''}`} onClick={() => setActiveTab('verify')}>
            <span className="nav-link-text">Verify</span>
          </button>
        </nav>

        <div className="nav-right">
          <ThemeToggle darkMode={darkMode} toggleTheme={toggleTheme} />
          
          {!account ? (
            <button className="connect-wallet-btn" onClick={connectWallet}>
              <span className="btn-text">Connect Wallet</span>
            </button>
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