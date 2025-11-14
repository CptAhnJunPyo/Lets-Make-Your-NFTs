require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const pinataSDK = require('@pinata/sdk');
const fs = require('fs');

// Khởi tạo
const app = express();
app.use(cors()); // Cho phép Frontend gọi
app.use(express.json());

// Cấu hình Blockchain
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// ABI rút gọn (chỉ cần hàm mintCertificate)
const contractABI = [
    "function mintCertificate(address to, string memory uri, string memory dataHashBytes) public"
];
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, wallet);

// Cấu hình IPFS (Pinata)
const pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_KEY);

// --- API ENDPOINT: MINT NFT ---
app.post('/api/mint', async (req, res) => {
    try {
        const { userAddress, realWorldData } = req.body; // Dữ liệu từ Frontend gửi lên

        console.log(`🔄 Đang xử lý mint cho: ${userAddress}`);

        // Bước 1: Upload Metadata lên IPFS
        // Tạo metadata chuẩn ERC721
        const metadata = {
            name: `Certificate for ${realWorldData.name}`,
            description: "Real World Asset Certificate",
            attributes: [
                { trait_type: "Type", value: "Education" },
                { trait_type: "Date", value: new Date().toISOString() },
                // Thêm các dữ liệu khác vào đây
            ],
            // Trong thực tế, bạn nên upload ảnh chứng chỉ lên IPFS trước và gắn link vào đây
            image: "ipfs://QmExampleImageHash" 
        };

        const options = {
            pinataMetadata: { name: `Certificate-${realWorldData.name}` }
        };
        
        const result = await pinata.pinJSONToIPFS(metadata, options);
        const tokenURI = `ipfs://${result.IpfsHash}`;
        console.log("✅ Metadata uploaded:", tokenURI);

        // Bước 2: Tạo Hash dữ liệu (để đảm bảo tính toàn vẹn)
        const dataString = JSON.stringify(realWorldData);
        const dataHash = ethers.keccak256(ethers.toUtf8Bytes(dataString));

        // Bước 3: Gọi Smart Contract để Mint
        // Backend trả phí gas
        const tx = await contract.mintCertificate(userAddress, tokenURI, dataHash);
        
        console.log("⏳ Đang chờ giao dịch:", tx.hash);
        await tx.wait(); // Đợi xác nhận

        // Bước 4: Trả kết quả về Frontend
        res.json({
            success: true,
            txHash: tx.hash,
            tokenURI: tokenURI
        });

    } catch (error) {
        console.error("❌ Lỗi Minting:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Server Backend chạy tại http://localhost:${PORT}`);
});