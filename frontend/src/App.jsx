import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import './App.css';

// CẬP NHẬT ĐỊA CHỈ CONTRACT MỚI CỦA BẠN VÀO ĐÂY
const CONTRACT_ADDRESS = "0x95C23FFD28612884bd47468f776849B427D77D57";

const contractABI = [
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
  "function burn(uint256 tokenId)"
];

function App() {
  const [account, setAccount] = useState(null);
  const [myNFTs, setMyNFTs] = useState([]);
  
  // State Mint
  const [formData, setFormData] = useState({ name: '', course: '' });
  const [mintFile, setMintFile] = useState(null);
  
  // State Verify
  const [verifyFile, setVerifyFile] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  
  const [status, setStatus] = useState('');

  // --- 1. KẾT NỐI VÍ ---
  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
      fetchUserNFTs(address, signer); // Load danh sách ngay
    } else {
      alert("Chưa cài Metamask!");
    }
  };

  // --- 2. LẤY DANH SÁCH NFT ---
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

  // --- 3. MINT (GỌI BACKEND) ---
  const handleMint = async () => {
    if (!mintFile || !account) return alert("Thiếu thông tin!");
    setStatus("Đang Mint...");
    
    const form = new FormData();
    form.append('userAddress', account);
    form.append('name', formData.name);
    form.append('course', formData.course);
    form.append('certificateFile', mintFile);

    try {
      const res = await axios.post('http://localhost:3001/api/mint', form);
      if (res.data.success) {
        setStatus("Mint thành công!");
        fetchUserNFTs(account, new ethers.BrowserProvider(window.ethereum).getSigner());
      }
    } catch (e) {
      console.error(e);
      setStatus("Lỗi Mint");
    }
  };

  // --- 4. TRANSFER (FIX LỖI ETHERS V6) ---
  const handleTransfer = async (tokenId) => {
    const to = prompt("Nhập địa chỉ ví nhận:");
    if (!ethers.isAddress(to)) return alert("Địa chỉ sai!");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
      const from = await signer.getAddress();

      // Cú pháp đặc biệt cho Ethers v6 để gọi hàm overload
      const tx = await contract["safeTransferFrom(address,address,uint256)"](from, to, tokenId);
      
      setStatus("⏳ Đang chuyển...");
      await tx.wait();
      setStatus("Chuyển thành công!");
      fetchUserNFTs(from, signer);
    } catch (e) {
      console.error(e);
      alert("Lỗi Transfer (Xem console)");
    }
  };

  // --- 5. VERIFY (GỌI BACKEND) ---
  const handleVerify = async () => {
    if (!verifyFile) return alert("Chọn file cần check!");
    setStatus("⏳ Đang kiểm tra...");
    
    const form = new FormData();
    form.append('verifyFile', verifyFile);
    form.append('claimerAddress', account || ""); 

    try {
      const res = await axios.post('http://localhost:3001/api/verify', form);
      setVerifyResult(res.data);
      setStatus("Đã có kết quả!");
    } catch (e) {
      setStatus("Lỗi Verify");
    }
  };

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
t
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