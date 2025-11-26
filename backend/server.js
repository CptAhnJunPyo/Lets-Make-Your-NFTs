require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const pinataSDK = require('@pinata/sdk');
const fs = require('fs');
const multer = require('multer');
const crypto = require('crypto');

// Cấu hình
const app = express();
app.use(cors());
app.use(express.json());

// Cấu hình Multer để lưu file tạm thời vào bộ nhớ
const upload = multer({ storage: multer.memoryStorage() });

// --- Cấu hình Blockchain và Pinata ---
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contractABI = [
    "function mintCertificate(address to, string memory uri, string memory dataHashBytes) public",
    "function hashToTokenId(bytes32 hash) view returns (uint256)",
    "function ownerOf(uint256 tokenId) view returns (address)"
];
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, wallet);
const readContract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, provider);
const pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_KEY);
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
// --- API ENDPOINT: MINT NFT ---
app.post('/api/mint', upload.single('certificateFile'), async (req, res) => {
    try {
        const { userAddress, name, course } = req.body;
        const file = req.file;

        if (!file) return res.status(400).json({ success: false, error: "Thiếu file" });

        console.log(`Minting cho: ${userAddress}`);

        // A. Upload Ảnh lên Pinata
        const fileStream = require('stream').Readable.from(file.buffer);
        const fileRes = await pinata.pinFileToIPFS(fileStream, { pinataMetadata: { name: `Cert-Img-${Date.now()}` } });
        const imageURI = `ipfs://${fileRes.IpfsHash}`;

        // B. Upload Metadata JSON
        const { 
            issuer_name = "Unknown Issuer", 
            issued_at = new Date().toISOString(), 
            description 
        } = req.body;

        // Hash file (để tạo certificate_hash)
        const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

        const metadata = {
            name: `${name}`, // Ví dụ: Bachelor of Science - Alice
            description: description || `Verifiable certificate for ${course}`,
            image: imageURI,
            //external_url: `https://your-website.com/verify/${fileHash}`, // URL xác thực (tùy chọn)
            
            // Attributes ERC-721
            attributes: [
                { trait_type: "issuer_name", value: issuer_name },
                { trait_type: "program", value: course },
                { trait_type: "issued_at", value: issued_at },
                { trait_type: "recipient_address", value: userAddress },
                { trait_type: "policy", value: "non-transferable" } // Nếu muốn SBT
            ],

            // Các trường Custom (không hiển thị trên OpenSea nhưng Backend dùng)
            certificate_hash: `0x${fileHash}`,
            file_cid: fileResult.IpfsHash,
            issuer: userAddress, // Người mint (Admin)
            schema_version: "1.0.0"
        };

        // D. Gọi Smart Contract
        const tx = await contract.mintCertificate(userAddress, tokenURI, fileHash);
        await tx.wait();

        res.json({ success: true, txHash: tx.hash, tokenURI });

    } catch (error) {
        console.error("Lỗi Mint:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
app.post('/api/verify', upload.single('verifyFile'), async (req, res) => {
    try {
        const file = req.file;
        const { claimerAddress } = req.body;

        if (!file) return res.status(400).json({ message: "Vui lòng upload file gốc để xác thực" });

        console.log("Đang verify file...");

        // A. Tính Hash của file vừa upload (Phải dùng đúng thuật toán SHA256 như lúc Mint)
        const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');
        console.log("Hash tính được từ file:", fileHash);

        // B. Chuyển sang format Hash của Solidity (Keccak256 của chuỗi hex)
        // Vì trong Contract: hash = keccak256(abi.encodePacked(dataHashBytes))
        const solidityHash = ethers.keccak256(ethers.toUtf8Bytes(fileHash));

        // C. Hỏi Contract
        const tokenIdBigInt = await readContract.hashToTokenId(solidityHash);
        const tokenId = tokenIdBigInt.toString();

        if (tokenId === "0") {
            return res.json({ verified: false, message: "Tài liệu này KHÔNG tồn tại trên hệ thống (hoặc đã bị hủy)." });
        }

        const currentOwner = await readContract.ownerOf(tokenId);
        const isOwner = claimerAddress && (currentOwner.toLowerCase() === claimerAddress.toLowerCase());

        res.json({
            verified: true,
            tokenId,
            currentOwner,
            isYourCert: isOwner,
            message: "Tài liệu HỢP LỆ trên Blockchain."
        });

    } catch (error) {
        console.error("Lỗi Verify:", error);
        res.status(500).json({ message: error.message });
    }
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(` Server Backend chạy tại http://localhost:${PORT}`);
});