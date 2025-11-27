import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import './App.css';
import './styles/mobile.css';
import './styles/tutorial.css';
import Header from './components/Header';
import MintSection from './components/MintSection';
import PortfolioSection from './components/PortfolioSection';
import VerifySection from './components/VerifySection';
import TutorialOverlay from './components/TutorialOverlay';

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

  // Tutorial State
  const [showTutorial, setShowTutorial] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

  // --- EFFECT: THEME ---
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    } else {
      setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  // --- EFFECT: TUTORIAL ---
  useEffect(() => {
    const hasSeenTutorialBefore = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorialBefore) {
      // Show tutorial after a short delay for first-time users
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setHasSeenTutorial(true);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    setHasSeenTutorial(true);
    localStorage.setItem('hasSeenTutorial', 'true');
  };

  const startTutorial = () => {
    setShowTutorial(true);
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
          const httpURI = tokenURI.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
          
          const metaRes = await axios.get(httpURI);
          const meta = metaRes.data;
          
          loadedNFTs.push({
            tokenId: tokenId.toString(),
            name: meta.name,
            image: meta.image.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")
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
    
    setStatus("⏳ Đang tạo Metadata chuẩn...");
    
    const form = new FormData();
    form.append('userAddress', account);
    
    // Append tất cả các trường dữ liệu mới
    form.append('studentName', formData.studentName);
    form.append('certName', formData.certName);
    form.append('issuerName', formData.issuerName);
    form.append('programName', formData.programName);
    form.append('description', formData.description);
    form.append('issuedAt', formData.issuedAt);
    form.append('externalUrl', formData.externalUrl);
    
    form.append('certificateFile', selectedFile); // File ảnh

    try {
      const response = await axios.post('http://localhost:3001/api/mint', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setStatus(`Thành công! Metadata đã đúng chuẩn.`);
        fetchUserNFTs(account, new ethers.BrowserProvider(window.ethereum).getSigner());
    }
  } catch (error) {
    console.error(error);
    setStatus("Thất bại! Xem console.");
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
      <Header 
        account={account}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        toggleTheme={toggleTheme}
        connectWallet={connectWallet}
      />

      <main className="main-content">
        <div className="container">
          {activeTab === 'mint' && (
            <MintSection 
              account={account}
              formData={formData}
              setFormData={setFormData}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              status={status}
              handleMintRequest={handleMintRequest}
            />
          )}

          {activeTab === 'portfolio' && (
            <PortfolioSection 
              loading={loading}
              myNFTs={myNFTs}
              setActiveTab={setActiveTab}
              handleTransfer={handleTransfer}
              handleRevoke={handleRevoke}
            />
          )}

          {activeTab === 'verify' && (
            <VerifySection 
              verifyFile={verifyFile}
              setVerifyFile={setVerifyFile}
              status={status}
              verifyResult={verifyResult}
              handleVerifyRequest={handleVerifyRequest}
            />
          )}
        </div>
      </main>

      {/* Tutorial Overlay */}
      <TutorialOverlay 
        isVisible={showTutorial}
        onComplete={handleTutorialComplete}
      />

      {/* Tutorial Help Button */}
      {hasSeenTutorial && !showTutorial && (
        <button className="welcome-tutorial-btn" onClick={startTutorial}>
          <span>🎯</span>
          Need Help?
        </button>
      )}
    </div>
  );
}

export default App;