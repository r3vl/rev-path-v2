import { ethers } from "ethers";

export const reveelMainLookup = () => {
  let reveelMainAddress: string;
  switch (process.env.HARDHAT_NETWORK) {
    case "mainnet":
      reveelMainAddress = "0xEF44D8e4eAb1ACB4922B983253B5B50386E8668E";
      break;
    case "goerli":
      reveelMainAddress = "0xc8EfFCc17fC0EFc631111931Ab7413C668Fc6A4f";
      break;
    case undefined:
      throw new Error(`this script needs a HARDHAT_NETWORK env var`);
    default:
      // enter your platform wallet here:
      reveelMainAddress = "";
      if (reveelMainAddress === "") throw new Error(`you need to set a reveelMain address on: ${process.env.HARDHAT_NETWORK}`);
  }
  return reveelMainAddress;
};

export const platformWalletLookup = () => {
  let platformWallet: string;
  switch (process.env.HARDHAT_NETWORK) {
    case "mainnet":
      platformWallet = "0xCB3B18f69da0f12d25EC85AACed53911e61ad386";
      break;
    case "goerli":
      platformWallet = "0x9a66DC388ac88815B964E6829041F3997FA0b76D";
      break
    case undefined:
      throw new Error(`this script needs a HARDHAT_NETWORK env var`);
    default:
      // enter your platform wallet here:
      platformWallet = "";
      if (platformWallet === "") throw new Error(`you need to set a platform wallet on network: ${process.env.HARDHAT_NETWORK}`);
  }
  return platformWallet;
};

export const ERC20TokenLookup = () => {
  let ETH: string;
  let WETH: string;
  let DAI: string;
  let USDC: string;
  switch (process.env.HARDHAT_NETWORK) {
    case "mainnet":
      ETH = ethers.constants.AddressZero;
      WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
      DAI = "0x6b175474e89094c44da98b954eedeac495271d0f";
      USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
      break;
    case "goerli":
      ETH = ethers.constants.AddressZero;
      WETH = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";
      DAI = "0x41e38e70a36150D08A8c97aEC194321b5eB545A5";
      USDC = "0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C";
      break;
    case undefined:
      throw new Error(`this script needs a HARDHAT_NETWORK env var`);
    default:
      // enter your token addresses here:
      ETH = ethers.constants.AddressZero;
      WETH = "";
      DAI = "";
      USDC = "";
      // ETH = ethers.constants.AddressZero;
      // WETH = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";
      // DAI = "0x41e38e70a36150D08A8c97aEC194321b5eB545A5";
      // USDC = "0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C";
      throw new Error(`you need to set token addresses on: ${process.env.HARDHAT_NETWORK}`);
  }
  return {ETH, WETH, DAI, USDC};
};