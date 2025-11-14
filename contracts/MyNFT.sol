// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20; // Yêu cầu phiên bản 0.8.20 trở lên

// Import các hợp đồng OpenZeppelin v5
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// ERC721URIStorage đã bao gồm ERC721 và các chức năng quản lý metadata
contract MyNFT is ERC721URIStorage, Ownable {

    // Thay thế cho Counters.sol:
    // Chúng ta tự theo dõi token ID tiếp theo.
    // Thường bắt đầu từ 0 hoặc 1 tùy theo sở thích.
    uint256 private _nextTokenId;

    /**
     * @dev Constructor
     * @param name Tên của bộ sưu tập NFT
     * @param symbol Ký hiệu của bộ sưu tập NFT
     * @param initialOwner Địa chỉ ví sẽ là chủ sở hữu (Owner) của hợp đồng
     */
    constructor(
        string memory name, 
        string memory symbol, 
        address initialOwner // Bắt buộc trong OZ v5
    ) 
        ERC721(name, symbol)
        Ownable(initialOwner) // Phải truyền initialOwner vào đây
    {}

    /**
     * @dev Hàm Mint (chỉ chủ sở hữu được gọi)
     * @param to Địa chỉ ví nhận NFT
     * @param uri Đường dẫn (IPFS) đến file metadata (JSON)
     */
    function safeMint(address to, string memory uri) public onlyOwner {
        // Lấy ID tiếp theo từ biến _nextTokenId
        uint256 newItemId = _nextTokenId;
        
        // Tăng biến đếm lên 1 cho lần mint tiếp theo
        _nextTokenId++;

        // Mint NFT
        _safeMint(to, newItemId);
        
        // Đặt URI cho NFT vừa mint
        _setTokenURI(newItemId, uri);
    }

    // Hàm này cho phép Owner (hoặc logic khác) cập nhật URI sau khi mint
    function updateTokenURI(uint256 tokenId, string memory uri) public onlyOwner {
        _setTokenURI(tokenId, uri);
    }
}