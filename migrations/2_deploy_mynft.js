// migrations/2_deploy_mynft.js
const MyNFT = artifacts.require("MyNFT");

module.exports = function (deployer, network, accounts) {
  // Lấy địa chỉ ví đầu tiên (mặc định) từ Truffle
  // Ví này sẽ được dùng để triển khai và sẽ là "Owner"
  const initialOwner = accounts[0]; 

  const nftName = "My Awesome NFT Collection";
  const nftSymbol = "MANC";

  // Triển khai hợp đồng, truyền 3 tham số vào constructor
  deployer.deploy(
    MyNFT, 
    nftName, 
    nftSymbol, 
    initialOwner // Truyền địa chỉ Owner vào
  );
};