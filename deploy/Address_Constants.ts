export const reveelMainLookup = ({ networkName }: { networkName: "mainnet" | "goerli" | "localhost" | string | undefined }) => {
  let reveelMainAddress: string;
  switch (process.env.HARDHAT_NETWORK) {
    case "mainnet":
      reveelMainAddress = "0xEF44D8e4eAb1ACB4922B983253B5B50386E8668E";
      break;
    case "goerli":
      reveelMainAddress = "0xCD442e1b4a1187e598607a72Edd3267c827DB3de";
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
