import { ethers } from "ethers";

export const reveelMainLookup = () => {
  let reveelMainAddress: string;
  switch (process.env.HARDHAT_NETWORK) {
    case "mainnet":
      reveelMainAddress = "0xae4EfaEB758f149f9C780268986537E45Bd57d7C";
      break;
    case "polygon":
      reveelMainAddress = "0xEF44D8e4eAb1ACB4922B983253B5B50386E8668E";
      break;
    case "arbitrumOne":
      reveelMainAddress = "0xEF44D8e4eAb1ACB4922B983253B5B50386E8668E";
      break;
    case "optimisticEthereum":
      reveelMainAddress = "0xEF44D8e4eAb1ACB4922B983253B5B50386E8668E";
      break;
    case "auroraMainnet":
      reveelMainAddress = "0x25A7516406FEe7394d40ece9f3EbFaB2a592b4ec";
      break;
    case "goerli":
      reveelMainAddress = "0xc8EfFCc17fC0EFc631111931Ab7413C668Fc6A4f";
      break;
    case "polygonMumbai":
      reveelMainAddress = "0x5559a2d54906F8a288cD99282E1458c585866e02";
      break;
    case "arbitrumGoerli":
      reveelMainAddress = "0xf0e3FB69B3F2c62476c882CEB9E084E37252663c";
      break;
    case "optimisticGoerli":
      reveelMainAddress = "0xf0e3FB69B3F2c62476c882CEB9E084E37252663c";
      break;
    case "auroraTestnet":
      reveelMainAddress = "0xEF44D8e4eAb1ACB4922B983253B5B50386E8668E";
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
    case "polygon":
      platformWallet = "0xD6d0c9fC8F1f6cbCa3472052df3678E5b29b2DcA";
      break;
    case "arbitrumOne":
      platformWallet = "0xD6d0c9fC8F1f6cbCa3472052df3678E5b29b2DcA";
      break;
    case "optimisticEthereum":
      platformWallet = "0xD6d0c9fC8F1f6cbCa3472052df3678E5b29b2DcA";
      break;
    case "auroraMainnet":
      platformWallet = "0xD6d0c9fC8F1f6cbCa3472052df3678E5b29b2DcA";
      break;
    case "goerli":
      platformWallet = "0x9a66DC388ac88815B964E6829041F3997FA0b76D";
      break
    case "polygonMumbai":
      platformWallet = "0xfd5D88F326f4F8C497E1AD1E218fCA38F12A3F0D";
      break
    case "arbitrumGoerli":
      platformWallet = "0xfd5D88F326f4F8C497E1AD1E218fCA38F12A3F0D";
      break
    case "auroraTestnet":
      platformWallet = "0xfd5D88F326f4F8C497E1AD1E218fCA38F12A3F0D";
      break
    case "optimisticGoerli":
      platformWallet = "0xfd5D88F326f4F8C497E1AD1E218fCA38F12A3F0D";
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

/**
 * Gelato's trusted forwarder
 * - per: https://docs.gelato.network/developer-services/relay/quick-start/relaywithsponsoreduserauthcall#example-code
 * - per: https://blockscan.com/address/0xaBcC9b596420A9E9172FD5938620E265a0f9Df92
 */
export const trustedForwarderLookup = () => {
  let trustedForwarderAddress: string;
  switch (process.env.HARDHAT_NETWORK) {
    case "mainnet":
      trustedForwarderAddress = "0xaBcC9b596420A9E9172FD5938620E265a0f9Df92";
      break;
    case "polygon":
      trustedForwarderAddress = "0xaBcC9b596420A9E9172FD5938620E265a0f9Df92";
      break;
    case "arbitrumOne":
      trustedForwarderAddress = "0xaBcC9b596420A9E9172FD5938620E265a0f9Df92";
      break;
    case "optimisticEthereum":
      trustedForwarderAddress = "0xaBcC9b596420A9E9172FD5938620E265a0f9Df92";
      break;
    case "auroraMainnet":
      trustedForwarderAddress = ethers.constants.AddressZero;
      break;
    case "goerli":
      trustedForwarderAddress = "0xaBcC9b596420A9E9172FD5938620E265a0f9Df92";
      break
    case "mumbai":
      trustedForwarderAddress = ethers.constants.AddressZero;
      break
    case "arbitrumGoerli":
      trustedForwarderAddress = ethers.constants.AddressZero;
      break
    case "auroraTestnet":
      trustedForwarderAddress = ethers.constants.AddressZero;
      break
    case "optimisticGoerli":
      trustedForwarderAddress = ethers.constants.AddressZero;
      break
    case undefined:
      throw new Error(`this script needs a HARDHAT_NETWORK env var`);
    default:
      // enter your platform wallet here:
      trustedForwarderAddress = "";
      if (trustedForwarderAddress === "") throw new Error(`you need to set a trustedForwarderAddress on network: ${process.env.HARDHAT_NETWORK}`);
  }
  return trustedForwarderAddress;
};

/** for create_a_path script */
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
      throw new Error(`you need to set token addresses on: ${process.env.HARDHAT_NETWORK}`);
  }
  return {ETH, WETH, DAI, USDC};
};