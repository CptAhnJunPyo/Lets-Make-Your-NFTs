// migrations/
const MyNFT = artifacts.require("CertificateNFT");

module.exports = function (deployer, network, accounts) {
  // Lấy địa chỉ ví đầu tiên (mặc định) từ Truffle
  // Ví này sẽ được dùng để triển khai và sẽ là "Owner"
  const initialOwner = accounts[0]; 

  const nftName = "NFT-Minting-Certificate";
  const nftSymbol = "NMC";

  // Triển khai hợp đồng, truyền 3 tham số vào constructor
  deployer.deploy(
    MyNFT, 
    nftName, 
    nftSymbol, 
    initialOwner // Truyền địa chỉ Owner vào
  );
};