import "@nomicfoundation/hardhat-chai-matchers";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-gas-reporter";
import "hardhat-docgen";

import { resolve } from "path";

import "./tasks/accounts";

import { config as dotenvConfig } from "dotenv";
import { HardhatUserConfig, NetworkUserConfig } from "hardhat/types";

dotenvConfig({ path: resolve(__dirname, "./.env") });

const chainIds = {
  goerli: 5,
  hardhat: 31337,
  kovan: 42,
  mainnet: 1,
  rinkeby: 4,
  ropsten: 3,
  optimisticEthereum: 10,
  optimisticGoerli: 420,
  arbitrumOne: 42161,
  arbitrumGoerli: 421613,
  polygon: 137,
  polygonMumbai: 80001,
  auroraMainnet: 1313161554,
  auroraTestnet: 1313161555,
};

// Ensure that we have all the environment variables we need.
const mnemonic: string | undefined = process.env.MNEMONIC;
const privateKey: string | undefined = process.env.PRIVATE_KEY
if (!mnemonic && !privateKey) {
  throw new Error("Please set your MNEMONIC or PrivateKey in a .env file");
}

const infuraApiKey: string | undefined = process.env.INFURA_API_KEY;
if (!infuraApiKey) {
  throw new Error("Please set your INFURA_API_KEY in a .env file");
}

/** you may need to customize the RPC URLs, many public urls are included by default below */
function getChainConfig(network: keyof typeof chainIds): NetworkUserConfig {
  let url: string;
  switch (network) {
    case 'polygon':
      url = "https://rpc.ankr.com/polygon";
      break;
    case 'polygonMumbai':
      url = "https://rpc-mumbai.maticvigil.com";
      break;
    case 'auroraMainnet':
      url = "https://mainnet.aurora.dev";
      break;
    case 'auroraTestnet':
      url = "https://testnet.aurora.dev";
      break;
    case 'optimisticEthereum':
      url = "https://rpc.ankr.com/optimism";
      break;
    case 'optimisticGoerli':
      url = "https://rpc.ankr.com/optimism_testnet";
      break;
    case 'arbitrumOne':
      url = process.env.ARBITRUM_RPC_URL as string;
      break;
    case 'arbitrumGoerli':
      url = "https://goerli-rollup.arbitrum.io/rpc";
      break;
    default:
      url = "https://" + network + ".infura.io/v3/" + process.env.INFURA_API_KEY;
  }
  let accounts;
  if (mnemonic) {
    accounts = {
      count: 10,
      mnemonic,
      path: "m/44'/60'/0'/0",
    }
  } else {
    accounts = [`${privateKey}`];
  }
  return {
    accounts,
    chainId: chainIds[network],
    url,
  };
}

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  gasReporter: {
    currency: "USD",
    gasPrice: 8,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    excludeContracts: [],
    src: "./contracts",
  },
  etherscan: {
    apiKey: {
      // find networks with npx hardhat verify --list-networks
      mainnet: process.env.ETHERSCAN_API_KEY as string,
      goerli: process.env.ETHERSCAN_API_KEY as string,
      optimisticEthereum: process.env.OPTIMISTIC_API_KEY as string,
      optimisticGoerli: process.env.OPTIMISTIC_API_KEY as string,
      arbitrumOne: process.env.ARBISCAN_API_KEY as string,
      arbitrumGoerli: process.env.ARBISCAN_API_KEY as string,
      polygon: process.env.POLYGONSCAN_API_KEY as string,
      polygonMumbai: process.env.POLYGONSCAN_API_KEY as string,
      auroraMainnet: process.env.AURORASCAN_API_KEY as string,
      auroraTestnet: process.env.AURORASCAN_API_KEY as string,
    },
    customChains: [
      {
        network: "optimisticGoerli",
        chainId: 420,
        urls: {
          apiURL: "https://api-goerli-optimism.etherscan.io/api",
          browserURL: "https://goerli-optimism.etherscan.io"
        }
      },
      {
        network: "arbitrumGoerli",
        chainId: 421613,
        urls: {
          apiURL: "https://api-goerli.arbiscan.io/api",
          browserURL: "https://goerli.arbiscan.io"
        }
      },
      {
        network: "auroraMainnet",
        chainId: 1313161554,
        urls: {
          apiURL: "https://api.aurorascan.dev/api",
          browserURL: "https://aurorascan.dev"
        }
      },
    ]
  },
  docgen: {
    path: "./docs",
    clear: true,
    runOnCompile: false,
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic: mnemonic || "test test test test test test test test test test test junk",
      },
      chainId: chainIds.hardhat,
    },
    goerli: getChainConfig("goerli"),
    kovan: getChainConfig("kovan"),
    rinkeby: getChainConfig("rinkeby"),
    ropsten: getChainConfig("ropsten"),
    mainnet: getChainConfig("mainnet"),
    polygon: getChainConfig("polygon"),
    polygonMumbai: getChainConfig("polygonMumbai"),
    optimisticEthereum: getChainConfig("optimisticEthereum"),
    optimisticGoerli: getChainConfig("optimisticGoerli"),
    arbitrumOne: getChainConfig("arbitrumOne"),
    arbitrumGoerli: getChainConfig("arbitrumGoerli"),
    auroraMainnet: getChainConfig("auroraMainnet"),
    auroraTestnet: getChainConfig("auroraTestnet"),
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  solidity: {
    version: "0.8.15",
    settings: {
      metadata: {
        // Not including the metadata hash
        bytecodeHash: "none",
      },
      // Disable the optimizer when debugging
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 800,
      },
    },
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
};

export default config;
