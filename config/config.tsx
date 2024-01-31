interface NetworkConfig {
  alchemyUrl: string;
  flashbotsRpcUrl: string;
  etherscanApiUrl: string;
  etherscanApiKey: string;
}

const networks: Record<string, NetworkConfig> = {
  mainnet: {
    alchemyUrl: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    flashbotsRpcUrl: "https://rpc.flashbots.net",
    etherscanApiUrl: "https://api.etherscan.io/api",
    etherscanApiKey: process.env.ETHERSCAN_API_KEY || "",
  },
  goerli: {
    alchemyUrl: `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    flashbotsRpcUrl: "https://rpc-goerli.flashbots.net",
    etherscanApiUrl: "https://api-goerli.etherscan.io/api",
    etherscanApiKey: process.env.ETHERSCAN_API_KEY || "",
  },
};

const activeNetwork = process.env.NEXT_PUBLIC_ACTIVE_NETWORK || "goerli";

export const currentConfig = networks[activeNetwork];
