import hre from "hardhat";
/**
 * deploys a RevenuePath library & a ReveelMain factory
 */
async function main() {

  // 1. set your wallet
  let platformWallet = "";
  switch (process.env.HARDHAT_NETWORK) {
    case "mainnet":
      platformWallet = "0xCB3B18f69da0f12d25EC85AACed53911e61ad386";
      break;
    case "goerli":
      platformWallet = "0x9a66DC388ac88815B964E6829041F3997FA0b76D";
      break
    default:
      // enter your platform wallet here:
      platformWallet = "0x9a66DC388ac88815B964E6829041F3997FA0b76D";
      if (platformWallet === "") throw new Error(`you need to set a platform wallet on network: ${process.env.HARDHAT_NETWORK}`);
  }

  // 2. deploy library
  const RevenuePath = await hre.ethers.getContractFactory("RevenuePathV2");
  const library = await RevenuePath.deploy();

  await library.deployed();

  console.log(
    `RevenuePath Library deployed to: ${library.address}`
  );

  const platformFeePercentage = 100000; //1%

  // 3. deploy Main with library
  const ReveelMain = await hre.ethers.getContractFactory("ReveelMainV2");
  const reveelMain = await ReveelMain.deploy(library.address, platformFeePercentage, platformWallet, platformWallet);

  await reveelMain.deployed();

  console.log(
    `Reveel main deployed to: ${reveelMain.address}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
