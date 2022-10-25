import hre from "hardhat";
import { platformWalletLookup } from "./Address_Constants";
/**
 * deploys a RevenuePath library & a ReveelMain factory
 */
async function main() {

  // 1. set your wallet
  const platformWallet = platformWalletLookup();

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
