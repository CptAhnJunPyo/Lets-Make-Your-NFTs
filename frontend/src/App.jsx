import { useState } from 'react';
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
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="container">
          <h1 className="logo">🎓 Certificate NFT</h1>
          {!account ? (
            <button className="connect-btn" onClick={connectWallet}>
              <span className="btn-icon">🔗</span>
              Connect Wallet
            </button>
          ) : (
            <div className="wallet-info">
              <span className="wallet-address">{account.slice(0,6)}...{account.slice(-4)}</span>
              <div className="status-dot"></div>
            </div>
          )}
        </div>
      </header>

      <main className="main">
        <div className="container">
          {/* Navigation Tabs */}
          <nav className="tabs">
            <button 
              className={`tab ${activeTab === 'mint' ? 'active' : ''}`}
              onClick={() => setActiveTab('mint')}
            >
              <span className="tab-icon">🛠️</span>
              Mint Certificate
            </button>
            <button 
              className={`tab ${activeTab === 'portfolio' ? 'active' : ''}`}
              onClick={() => setActiveTab('portfolio')}
            >
              <span className="tab-icon">📂</span>
              My Certificates
            </button>
          </nav>

          {/* Mint Section */}
          {activeTab === 'mint' && (
            <section className="mint-section">
              <div className="form-card">
                <h2 className="section-title">Issue New Certificate</h2>
                <form className="mint-form" onSubmit={(e) => e.preventDefault()}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input 
                      type="text" 
                      className="form-input"
                      placeholder="Enter recipient's full name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Course / Program</label>
                    <input 
                      type="text" 
                      className="form-input"
                      placeholder="Enter course or program name"
                      value={formData.course}
                      onChange={(e) => setFormData({...formData, course: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Certificate File</label>
                    <div className="file-upload">
                      <input 
                        type="file" 
                        id="file-input"
                        className="file-input"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                      />
                      <label htmlFor="file-input" className="file-label">
                        <span className="file-icon">📎</span>
                        {selectedFile ? selectedFile.name : 'Choose file (Image/PDF)'}
                      </label>
                    </div>
                  </div>
                  
                  <button 
                    type="button"
                    className="mint-btn"
                    onClick={handleMintRequest} 
                    disabled={!account || !formData.name || !formData.course || !selectedFile}
                  >
                    <span className="btn-icon">🚀</span>
                    Mint Certificate NFT
                  </button>
                </form>
                
                {status && (
                  <div className="status-message">
                    <div className="status-content">
                      <span className="status-icon">ℹ️</span>
                      {status}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Portfolio Section */}
          {activeTab === 'portfolio' && (
            <section className="portfolio-section">
              <h2 className="section-title">My Certificate Collection</h2>
              
              {loading ? (
                <div className="loading">
                  <div className="spinner"></div>
                  <p>Loading certificates...</p>
                </div>
              ) : myNFTs.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📜</div>
                  <h3>No Certificates Yet</h3>
                  <p>Start by minting your first certificate!</p>
                </div>
              ) : (
                <div className="nft-grid">
                  {myNFTs.map((nft) => (
                    <div key={nft.tokenId} className="nft-card">
                      <div className="nft-image">
                        <img src={nft.image} alt={nft.name} />
                      </div>
                      <div className="nft-content">
                        <h3 className="nft-title">{nft.name}</h3>
                        <p className="nft-description">{nft.description}</p>
                        <div className="nft-id">Token ID: #{nft.tokenId}</div>
                      </div>
                      <div className="nft-actions">
                        <button 
                          className="action-btn transfer-btn"
                          onClick={() => handleTransfer(nft.tokenId)}
                        >
                          <span className="btn-icon">↗️</span>
                          Transfer
                        </button>
                        <button 
                          className="action-btn revoke-btn"
                          onClick={() => handleRevoke(nft.tokenId)}
                        >
                          <span className="btn-icon">🗑️</span>
                          Revoke
                        </button>
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