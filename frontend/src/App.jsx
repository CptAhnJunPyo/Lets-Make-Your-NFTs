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
  
  // State Mint
  const [formData, setFormData] = useState({ name: '', course: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
  const handleAnalyzeImage = async (file) => {
    if (!file) return;
    setIsAnalyzing(true);
    
    const form = new FormData();
    form.append('analyzeFile', file);

    try {
      // Gọi Backend
      const res = await axios.post('http://localhost:3001/api/analyze', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        const data = res.data.data;
        // Tự động điền vào Form
        setFormData({
            ...formData,
            name: data.recipient_name || "",
            course: data.program || "",
            // Bạn có thể lưu thêm các trường khác vào state nếu muốn hiển thị
            description: data.description,
            issuer_name: data.issuer_name,
            issued_at: data.issued_at
        });
        alert("🤖 AI đã điền thông tin! Vui lòng kiểm tra lại.");
      }
    } catch (error) {
      console.error(error);
      alert("Không thể phân tích ảnh. Vui lòng nhập tay.");
    }
    setIsAnalyzing(false);
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
    <div style={{ padding: 20 }}>
      <h1>Web3 Certificate System</h1>
      {!account ? <button onClick={connectWallet}>Kết nối Ví</button> : <p>Ví: {account}</p>}
      
      <div style={{ display: 'flex', gap: 50 }}>
        {/* FORM MINT */}
        <div>
            <h3>🛠️ 1. Cấp chứng chỉ (Mint)</h3>
            <input placeholder="Tên" onChange={e => setFormData({...formData, name: e.target.value})} /> <br/>
            <input placeholder="Khóa học" onChange={e => setFormData({...formData, course: e.target.value})} /> <br/>
            <input type="file" onChange={e => setMintFile(e.target.files[0])} /> <br/><br/>
            <button onClick={handleMint}>Mint NFT</button>
        </div>

        {/* FORM VERIFY */}
        <div>
            <h3>🔍 2. Xác thực tài liệu (Verify)</h3>
            <p>Upload file gốc (.jpg, .pdf) để kiểm tra trên Blockchain</p>
            <input type="file" onChange={e => setVerifyFile(e.target.files[0])} /> <br/><br/>
            <button onClick={handleVerify}>Kiểm tra ngay</button>
            
            {verifyResult && (
                <div style={{ marginTop: 10, padding: 10, background: '#242424' }}>
                    <b>Kết quả:</b> {verifyResult.verified ? "HỢP LỆ " : "KHÔNG TÌM THẤY "} <br/>
                    {verifyResult.verified && (
                        <>
                            ID: #{verifyResult.tokenId} <br/>
                            Hash: {verifyResult.Hash} <br/>
                            Chủ sở hữu: {verifyResult.currentOwner.slice(0,64)} <br/>
                            {verifyResult.isYourCert ? " ĐÂY LÀ CỦA BẠN!" : " KHÔNG PHẢI CỦA BẠN"}
                        </>
                    )}
                </div>
            )}
        </div>
      </div>

      <p style={{color: 'white'}}>{status}</p>

      <hr/>
      <h3>📂 3. Danh sách chứng chỉ của tôi</h3>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {myNFTs.map(nft => (
            <div key={nft.tokenId} style={{ border: '1px solid #ccc', padding: 10, width: 200 }}>
                <img src={nft.image} width="100%" alt="cert" />
                <p><b>{nft.name}</b></p>
                <button onClick={() => handleTransfer(nft.tokenId)}>Transfer</button>
            </div>
        ))}
      </div>
    </div>
  );
}
export default App;