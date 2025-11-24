import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import './App.css';

const contractABI = [
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
  "function burn(uint256 tokenId)"
];
const CONTRACT_ADDRESS = "0xc175142dD7a8a888f328a5D44d0499260Ba8c186";

function App() {
  const [account, setAccount] = useState(null);
  const [myNFTs, setMyNFTs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', course: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState('');
  const [activeTab, setActiveTab] = useState('mint');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    } else {
      setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  //connectWallet
  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
      
      // Gọi hàm fetch ngay khi kết nối
      fetchUserNFTs(address, signer);
    }
  };
  const fetchUserNFTs = async (userAddress, signer) => {
    setLoading(true);
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
      // Lấy số lượng NFT user đang sở hữu
      const balance = await contract.balanceOf(userAddress);
      
      const items = [];
      // Duyệt qua từng NFT để lấy Token ID và Metadata
      for (let i = 0; i < balance; i++) {
        const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i);
        const tokenURI = await contract.tokenURI(tokenId);
         
        // Fetch dữ liệu từ IPFS
        // Chuyển ipfs:// thành https://ipfs.io/ipfs/
        const httpURI = tokenURI.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
        const meta = await axios.get(httpURI);

        items.push({
          tokenId: tokenId.toString(),
          name: meta.data.name,
          description: meta.data.description,
          image: meta.data.image.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")
        });
      }
      setMyNFTs(items);
    } catch (error) {
      console.error("Lỗi fetch NFT:", error);
    }
    setLoading(false);
  };
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const resetForm = () => {
    setFormData({ name: '', course: '' });
    setSelectedFile(null);
    setStatus('');
  };

  // 3. Hàm gửi yêu cầu Mint
  const handleMintRequest = async () => {
    if (!account) return alert("Chưa kết nối ví!");
    if (!selectedFile) return alert("Vui lòng chọn file chứng chỉ!");
    
    setStatus("Đang chuẩn bị dữ liệu...");

    // 4. Tạo FormData để gửi
    const formDataObj = new FormData();
    formDataObj.append('userAddress', account);
    formDataObj.append('name', formData.name);
    formDataObj.append('course', formData.course);
    formDataObj.append('certificateFile', selectedFile);

    try {
      setStatus("Đang upload file và mint...");
      
      // 5. Gửi request POST với FormData
      const response = await axios.post('http://localhost:3001/api/mint', formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setStatus(`Thành công! Tx Hash: ${response.data.txHash}`);
      } else {
        setStatus("Thất bại!");
      }
    } catch (error) {
      console.error(error);
      setStatus("Có lỗi xảy ra khi gọi Server.");
    }
  };
  const handleTransfer = async (tokenId) => {
    const toAddress = prompt("Nhập địa chỉ ví người nhận:");
    if (!toAddress || !ethers.isAddress(toAddress)) return alert("Địa chỉ không hợp lệ");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

      // Gọi hàm safeTransferFrom
      const tx = await contract.safeTransferFrom(account, toAddress, tokenId);
      alert(`Đang chuyển NFT... Hash: ${tx.hash}`);
      await tx.wait();
      
      alert("Chuyển thành công!");
      fetchUserNFTs(account, signer); // Load lại danh sách
    } catch (error) {
      console.error(error);
      alert("Chuyển nhượng thất bại!");
    }
  };
  const handleRevoke = async (tokenId) => {
    if (!confirm("Bạn có chắc chắn muốn hủy (xóa vĩnh viễn) chứng chỉ này không?")) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

      const tx = await contract.burn(tokenId);
      alert(`Đang hủy NFT... Hash: ${tx.hash}`);
      await tx.wait();

      alert("Đã hủy chứng chỉ thành công!");
      fetchUserNFTs(account, signer); // Load lại danh sách
    } catch (error) {
      console.error(error);
      alert("Hủy thất bại!");
    }
  };
  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      {/* Header */}
      <header className="navbar">
        <div className="nav-container">
          <div className="nav-left">
            <div className="logo">
              <svg width="32" height="32" viewBox="0 0 32 32" className="logo-icon">
                <rect width="32" height="32" rx="8" fill="url(#gradient)"/>
                <path d="M8 12h16v8H8z" fill="white" opacity="0.9"/>
                <circle cx="16" cy="16" r="3" fill="url(#gradient)"/>
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#667eea"/>
                    <stop offset="100%" stopColor="#764ba2"/>
                  </linearGradient>
                </defs>
              </svg>
              <span className="logo-text">CertiFi</span>
            </div>
          </div>
          
          <nav className="nav-center">
            <button 
              className={`nav-link ${activeTab === 'mint' ? 'active' : ''}`}
              onClick={() => setActiveTab('mint')}
            >
              Create
            </button>
            <button 
              className={`nav-link ${activeTab === 'portfolio' ? 'active' : ''}`}
              onClick={() => setActiveTab('portfolio')}
            >
              Portfolio
            </button>
          </nav>

          <div className="nav-right">
            <button className="theme-toggle" onClick={toggleTheme}>
              {darkMode ? '☀️' : '🌙'}
            </button>
            
            {!account ? (
              <button className="connect-wallet-btn" onClick={connectWallet}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                </svg>
                Connect Wallet
              </button>
            ) : (
              <div className="wallet-connected">
                <div className="wallet-avatar">
                  <div className="avatar-gradient"></div>
                  <span className="avatar-text">{account.slice(2,4).toUpperCase()}</span>
                </div>
                <span className="wallet-address">{account.slice(0,6)}...{account.slice(-4)}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="container">

          {/* Mint Section */}
          {activeTab === 'mint' && (
            <section className="create-section">
              <div className="section-header">
                <h1 className="page-title">Create Certificate NFT</h1>
                <p className="page-subtitle">Issue verifiable certificates on the blockchain</p>
              </div>
              
              <div className="create-container">
                <div className="upload-area">
                  <div className="upload-zone">
                    <input 
                      type="file" 
                      id="file-upload"
                      className="file-input-hidden"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                    />
                    <label htmlFor="file-upload" className="upload-label">
                      {selectedFile ? (
                        <div className="file-preview">
                          <div className="file-icon-large">📄</div>
                          <div className="file-info">
                            <div className="file-name">{selectedFile.name}</div>
                            <div className="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                          </div>
                        </div>
                      ) : (
                        <div className="upload-placeholder">
                          <div className="upload-icon">📁</div>
                          <div className="upload-text">
                            <div className="upload-title">Drop your certificate here</div>
                            <div className="upload-subtitle">PNG, JPG, PDF up to 10MB</div>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="form-panel">
                  <div className="panel-header">
                    <h3 className="panel-title">Certificate Details</h3>
                  </div>
                  
                  <div className="form-content">
                    <div className="input-group">
                      <label className="input-label">Recipient Name</label>
                      <input 
                        type="text" 
                        className="input-field"
                        placeholder="Enter full name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    
                    <div className="input-group">
                      <label className="input-label">Course / Program</label>
                      <input 
                        type="text" 
                        className="input-field"
                        placeholder="Enter course name"
                        value={formData.course}
                        onChange={(e) => setFormData({...formData, course: e.target.value})}
                      />
                    </div>
                    
                    <button 
                      type="button"
                      className="create-btn"
                      onClick={handleMintRequest} 
                      disabled={!account || !formData.name || !formData.course || !selectedFile}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      Create Certificate
                    </button>
                    
                    {status && (
                      <div className="status-alert">
                        <div className="alert-content">
                          <div className="alert-icon">ℹ️</div>
                          <div className="alert-text">{status}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Portfolio Section */}
          {activeTab === 'portfolio' && (
            <section className="portfolio-section">
              <div className="section-header">
                <h1 className="page-title">My Certificates</h1>
                <p className="page-subtitle">{myNFTs.length} certificate{myNFTs.length !== 1 ? 's' : ''} owned</p>
              </div>
              
              {loading ? (
                <div className="loading-state">
                  <div className="loading-spinner">
                    <div className="spinner-ring"></div>
                  </div>
                  <p className="loading-text">Loading your certificates...</p>
                </div>
              ) : myNFTs.length === 0 ? (
                <div className="empty-portfolio">
                  <div className="empty-illustration">
                    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                      <rect x="20" y="30" width="80" height="60" rx="8" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
                      <rect x="30" y="40" width="60" height="40" rx="4" fill="currentColor" opacity="0.1"/>
                      <circle cx="60" cy="60" r="8" fill="currentColor" opacity="0.3"/>
                    </svg>
                  </div>
                  <h3 className="empty-title">No certificates yet</h3>
                  <p className="empty-description">Create your first certificate to get started</p>
                  <button className="empty-cta" onClick={() => setActiveTab('mint')}>
                    Create Certificate
                  </button>
                </div>
              ) : (
                <div className="certificates-grid">
                  {myNFTs.map((nft) => (
                    <div key={nft.tokenId} className="certificate-card">
                      <div className="card-media">
                        <img src={nft.image} alt={nft.name} className="certificate-image" />
                        <div className="card-overlay">
                          <div className="token-id">#{nft.tokenId}</div>
                        </div>
                      </div>
                      
                      <div className="card-body">
                        <h3 className="certificate-name">{nft.name}</h3>
                        <p className="certificate-description">{nft.description}</p>
                        
                        <div className="card-actions">
                          <button 
                            className="action-button secondary"
                            onClick={() => handleTransfer(nft.tokenId)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M16.01 11H4v2h12.01v3L20 12l-3.99-4z"/>
                            </svg>
                            Transfer
                          </button>
                          <button 
                            className="action-button danger"
                            onClick={() => handleRevoke(nft.tokenId)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                            Revoke
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
export default App;