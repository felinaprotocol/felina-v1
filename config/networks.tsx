import { Chain } from "wagmi/chains";

export const mainnet: Chain = {
    id: 1,
    name: "Mainnet",
    network: "mainnet",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: {
      default: { http: ["https://eth.llamarpc.com"] },
      public: { http: ["https://eth.llamarpc.com"] },
    },
    blockExplorers: {
      etherscan: { name: "Etherscan", url: "https://etherscan.io/" },
      default: { name: "Etherscan", url: "https://etherscan.io/" },
    },
    testnet: false,
};

export const goerli: Chain = {
    id: 5,
    name: "Goerli",
    network: "goerli",
    nativeCurrency: { name: "Goerli Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: {
      default: { http: ["https://ethereum-goerli.publicnode.com"] },
      public: { http: ["https://ethereum-goerli.publicnode.com"] },
    },
    blockExplorers: {
      etherscan: { name: "Etherscan", url: "https://goerli.etherscan.io/" },
      default: { name: "Etherscan", url: "https://goerli.etherscan.io/" },
    },
    testnet: true,
};

