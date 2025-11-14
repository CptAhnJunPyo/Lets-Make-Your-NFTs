// mint-nft.js
const { ethers } = require("ethers");
const fs = require('fs');

// Lấy ABI từ file build artifacts
const contractAbi = JSON.parse(fs.readFileSync("./build/contracts/MyNFT.json", "utf8")).abi;

// THAY THẾ CÁC GIÁ TRỊ SAU
const CONTRACT_ADDRESS = "0x..."; //Deployed CA
const WALLET_PRIVATE_KEY = ""; //DEV WALLET PKEY
const RPC_URL = "https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID";
const RECIPIENT_ADDRESS = "";// Địa chỉ người nhận NFT
const TOKEN_URI = "ipfs://Qmb.../metadata.json"; // Đường dẫn metadata trên IPFS

async function mintNFT() {
    // 1. Kết nối với mạng lưới
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    // 2. Tạo Signer (ví ký)
    const signer = new ethers.Wallet(WALLET_PRIVATE_KEY, provider);

    // 3. Tạo instance của Hợp đồng
    const nftContract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, signer);

    try {
        console.log(`Bắt đầu mint NFT cho ${RECIPIENT_ADDRESS} với URI: ${TOKEN_URI}`);
        
        // 4. Gọi hàm safeMint trên Smart Contract
        const tx = await nftContract.safeMint(RECIPIENT_ADDRESS, TOKEN_URI);
        
        console.log("Đang gửi giao dịch...", tx.hash);

        // Chờ giao dịch được xác nhận
        await tx.wait();

        console.log(`✅ NFT đã được mint thành công! Transaction Hash: ${tx.hash}`);

    } catch (error) {
        console.error("Lỗi khi mint NFT:", error);
    }
}

mintNFT();