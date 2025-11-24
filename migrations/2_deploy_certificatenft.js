// Import file contract đã được biên dịch
const CertificateNFT = artifacts.require("CertificateNFT");

// Lấy địa chỉ ví Minter từ file .env
const minterAddress = process.env.MINTER_ADDRESS;

module.exports = async function (deployer, network, accounts) {
  // 'accounts[0]' là địa chỉ ví đang thực hiện deploy
  // Chúng ta sẽ dùng nó làm Default Admin
  const defaultAdmin = accounts[0];

  // Kiểm tra xem địa chỉ minter đã được set trong .env chưa
  if (!minterAddress) {
    console.error("Vui lòng đặt MINTER_WALLET_ADDRESS trong file .env");
    throw new Error("MINTER_WALLET_ADDRESS not set");
  }

  console.log("Deploying CertificateNFT...");
  console.log(`  Default Admin: ${defaultAdmin}`);
  console.log(`  Minter Wallet: ${minterAddress}`);

  // Tiến hành deploy, truyền 2 tham số vào constructor
  await deployer.deploy(
    CertificateNFT,
    defaultAdmin, // Tham số 1: defaultAdmin
    minterAddress // Tham số 2: minter
  );

  // Lấy ra contract vừa deploy để log địa chỉ
  const deployedContract = await CertificateNFT.deployed();
  console.log(" CertificateNFT deployed to:", deployedContract.address);
};