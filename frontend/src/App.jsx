import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import './App.css';

// --- CẤU HÌNH CONTRACT ---
const CONTRACT_ADDRESS = "0x95C23FFD28612884bd47468f776849B427D77D57";
const contractABI = [
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
  "function burn(uint256 tokenId)"
];

function App() {
  // --- Managing State---
  const [account, setAccount] = useState(null);
  const [myNFTs, setMyNFTs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  
  // UI State
  const [activeTab, setActiveTab] = useState('mint'); // 'mint' | 'portfolio' | 'verify'
  const [darkMode, setDarkMode] = useState(false);

  // Mint Form State
  const [formData, setFormData] = useState({ name: '', course: '' });
  const [selectedFile, setSelectedFile] = useState(null);

  // Verify Form State
  const [verifyFile, setVerifyFile] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);

  // --- EFFECT: THEME ---
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

  // --- LOGIC 1: KẾT NỐI VÍ ---
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
        fetchUserNFTs(address, signer);
      } catch (error) {
        console.error(error);
      }
    } else {
      alert("Vui lòng cài đặt Metamask!");
    }
  };

  // --- LOGIC 2: LẤY DANH SÁCH NFT ---
  const fetchUserNFTs = async (address, signer) => {
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
      const balanceBigInt = await contract.balanceOf(address);
      const balance = Number(balanceBigInt); // Chuyển BigInt sang Number để loop

      const loadedNFTs = [];
      for (let i = 0; i < balance; i++) {
        try {
          const tokenId = await contract.tokenOfOwnerByIndex(address, i);
          const tokenURI = await contract.tokenURI(tokenId);
          const httpURI = tokenURI.replace("ipfs://", "https://cloudflare-ipfs.com/ipfs/");
          
          const metaRes = await axios.get(httpURI);
          const meta = metaRes.data;
          
          loadedNFTs.push({
            tokenId: tokenId.toString(),
            name: meta.name,
            image: meta.image.replace("ipfs://", "https://cloudflare-ipfs.com/ipfs/")
          });
        } catch (e) {
          console.error("Lỗi load 1 NFT:", e);
        }
      }
      setMyNFTs(loadedNFTs);
    } catch (e) {
      console.error("Lỗi fetch list:", e);
    }
  };
  // --- LOGIC 3: MINT NFT ---
  const handleMintRequest = async () => {
    if (!account) return alert("Chưa kết nối ví!");
    if (!selectedFile) return alert("Vui lòng chọn file!");
    
    setStatus("Đang xử lý...");
    
    const form = new FormData();
    form.append('userAddress', account);
    form.append('name', formData.name);
    form.append('course', formData.course);
    form.append('certificateFile', selectedFile);

    try {
      const response = await axios.post('http://localhost:3001/api/mint', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setStatus(`Thành công! Tx: ${response.data.txHash.slice(0, 10)}...`);
        // Reset form
        setFormData({ name: '', course: '' });
        setSelectedFile(null);
        fetchUserNFTs(account, new ethers.BrowserProvider(window.ethereum).getSigner());
      }
    } catch (error) {
      console.error(error);
      setStatus("Thất bại!");
    }
  };

  // --- Module 4: TRANSFER NFT ---
  const handleTransfer = async (tokenId) => {
    const toAddress = prompt("Nhập địa chỉ ví người nhận:");
    if (!toAddress || !ethers.isAddress(toAddress)) return alert("Địa chỉ không hợp lệ");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
      const from = await signer.getAddress();

      // Gọi hàm overload của Ethers v6
      const tx = await contract["safeTransferFrom(address,address,uint256)"](from, toAddress, tokenId);
      alert(`Đang chuyển NFT... Hash: ${tx.hash}`);
      await tx.wait();
      
      alert("Chuyển thành công!");
      fetchUserNFTs(account, signer);
    } catch (error) {
      console.error(error);
      alert("Chuyển nhượng thất bại!");
    }
  };

  // --- LOGIC 5: REVOKE (BURN) NFT ---
  const handleRevoke = async (tokenId) => {
    if (!confirm("Bạn có chắc chắn muốn hủy vĩnh viễn chứng chỉ này không?")) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

      const tx = await contract.burn(tokenId);
      alert(`Đang hủy NFT...`);
      await tx.wait();

      alert("Đã hủy thành công!");
      fetchUserNFTs(account, signer);
    } catch (error) {
      console.error(error);
      alert("Hủy thất bại!");
    }
  };

  // --- LOGIC 6: VERIFY NFT ---
  const handleVerifyRequest = async () => {
    if (!verifyFile) return alert("Vui lòng chọn file gốc để kiểm tra!");
    setStatus("🔍 Đang xác thực trên Blockchain...");
    setVerifyResult(null);

    const form = new FormData();
    form.append('verifyFile', verifyFile);
    form.append('claimerAddress', account || "");

    try {
      const response = await axios.post('http://localhost:3001/api/verify', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setVerifyResult(response.data);
      setStatus("Đã có kết quả!");
    } catch (error) {
      console.error(error);
      setStatus("Lỗi khi xác thực.");
    }
  };

  // --- RENDER GIAO DIỆN ---
  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      
      {/* HEADER */}
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

      <main className="main-content">
        <div className="container">

          {/* TAB 1: MINT SECTION */}
          {activeTab === 'mint' && (
            <section className="create-section">
              <div className="section-header">
                <h1 className="page-title">Create Certificate</h1>
                <p className="page-subtitle">Issue verifiable NFTs on Sepolia Network</p>
              </div>
              
              <div className="create-container">
                {/* Upload Zone */}
                <div className="upload-area">
                  <div className="upload-zone">
                  <input type="file" id="file-upload" className="file-input-hidden" accept="image/*,.pdf"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                    />
                    <label htmlFor="file-upload" className="upload-label">
                      {selectedFile ? (
                        <div className="file-preview">
                          <div className="file-icon-large">📄</div>
                          <div className="file-info">
                            <div className="file-name">{selectedFile.name}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="upload-placeholder">
                          <div className="upload-icon">📁</div>
                          <div className="upload-text">Click to upload Image/PDF</div>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Form Input */}
                <div className="form-panel">
                  <div className="form-content">
                    <div className="input-group">
                      <label className="input-label">Recipient Name</label>
                      <input type="text" className="input-field" placeholder="Full Name"
                        value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    
                    <div className="input-group">
                      <label className="input-label">Course / Program</label>
                      <input type="text" className="input-field" placeholder="Course Name"
                        value={formData.course} onChange={(e) => setFormData({...formData, course: e.target.value})}
                      />
                    </div>
                    
                    <button className="create-btn" onClick={handleMintRequest} 
                      disabled={!account || !formData.name || !formData.course || !selectedFile}>
                      Mint Certificate
                    </button>
                    
                    {status && <div className="status-alert">{status}</div>}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* TAB 2: PORTFOLIO SECTION */}
          {activeTab === 'portfolio' && (
            <section className="portfolio-section">
              <div className="section-header">
                <h1 className="page-title">My Assets</h1>
                <p className="page-subtitle">Manage your blockchain assets</p>
              </div>
              {loading ? (
                <div className="loading-state">
                  <div className="spinner-ring"></div>
                  <p>Loading from Blockchain...</p>
                </div>
              ) : myNFTs.length === 0 ? (
                <div className="empty-portfolio">
                  <div className="upload-icon" style={{fontSize: '3rem', opacity: 0.5}}>📭</div>
                  <h3>No certificates found</h3>
                  <p>You haven't earned any certificates yet.</p>
                  <button className="create-btn" style={{maxWidth: '200px', margin: '20px auto'}} onClick={() => setActiveTab('mint')}>
                    Create First NFT
                  </button>
                </div>
              ) : (
                <div className="certificates-grid">
                  {myNFTs.map((nft, index) => (
                    // Sử dụng index làm fallback key nếu tokenId bị lỗi
                    <div key={nft.tokenId || index} className="certificate-card">
                      <div className="card-media">
                        {nft.image ? (
                           <img 
                             src={nft.image} 
                             alt={nft.name} 
                             className="certificate-image"
                             // Thêm xử lý khi ảnh lỗi -> Hiện ảnh mặc định
                             onError={(e) => {
                               e.target.onerror = null; 
                               e.target.src = "https://via.placeholder.com/400x300?text=No+Image";
                             }}
                           />
                        ) : (
                           // Placeholder nếu không có link ảnh
                           <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e2e8f0', color: '#64748b'}}>
                              No Image
                           </div>
                        )}
                        <div className="card-overlay">
                          <span className="token-id">#{nft.tokenId}</span>
                        </div>
                      </div>
                      
                      <div className="card-body">
                        <h3 className="certificate-name">{nft.name || "Unnamed Certificate"}</h3>
                        <p className="certificate-description">
                           {nft.description ? (nft.description.length > 50 ? nft.description.substring(0,50)+"..." : nft.description) : "No description provided."}
                        </p>
                        
                        <div className="card-actions">
                          <button 
                            className="action-button secondary" 
                            onClick={() => handleTransfer(nft.tokenId)}
                            title="Transfer ownership"
                          >
                            Transfer
                          </button>
                          <button 
                            className="action-button danger" 
                            onClick={() => handleRevoke(nft.tokenId)}
                            title="Burn/Delete NFT"
                          >
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

          {/* TAB 3: VERIFY SECTION */}
          {activeTab === 'verify' && (
            <section className="create-section">
              <div className="section-header">
                <h1 className="page-title">Verify Document</h1>
                <p className="page-subtitle">Check authenticity on Blockchain</p>
              </div>

              <div className="create-container">
                 <div className="upload-area">
                  <div className="upload-zone">
                    <input type="file" id="verify-upload" className="file-input-hidden"
                      onChange={(e) => setVerifyFile(e.target.files[0])}
                    />
                    <label htmlFor="verify-upload" className="upload-label">
                      {verifyFile ? (
                        <div className="file-preview">
                          <div className="file-icon-large">🔍</div>
                          <div className="file-name">{verifyFile.name}</div>
                        </div>
                      ) : (
                         <div className="upload-placeholder">
                          <div className="upload-icon">🛡️</div>
                          <div className="upload-text">Upload original file to check</div>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="form-panel">
                   <button className="create-btn" onClick={handleVerifyRequest} disabled={!verifyFile}>
                      Verify Integrity
                   </button>
                   {status && <div className="status-alert" style={{marginTop: 10}}>{status}</div>}
                   
                   {verifyResult && (
                      <div className={`verify-result ${verifyResult.verified ? 'valid' : 'invalid'}`}>
                        <h3>{verifyResult.verified ? "✅ VALID DOCUMENT" : "❌ INVALID DOCUMENT"}</h3>
                        {verifyResult.verified && (
                          <div className="verify-details">
                            <p><strong>Token ID:</strong> #{verifyResult.tokenId}</p>
                            <p><strong>Owner:</strong> {verifyResult.currentOwner}</p>
                            <p className="ownership-tag">
                              {verifyResult.isYourCert ? "🎉 You own this!" : "⚠️ You do NOT own this."}
                            </p>
                          </div>
                        )}
                        {!verifyResult.verified && <p>This document does not exist on our system.</p>}
                      </div>
                   )}
                </div>
              </div>
            </section>
          )}

        </div>
      </main>
    </div>
  );
}
export default App;