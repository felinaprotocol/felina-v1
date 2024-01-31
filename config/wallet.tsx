import { getDefaultWallets, connectorsForWallets } from "@rainbow-me/rainbowkit";
import { argentWallet, trustWallet } from "@rainbow-me/rainbowkit/wallets";
import { createConfig, configureChains } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { goerli, mainnet } from "./networks";

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || "defaultProjectId";

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [goerli, mainnet],
  [publicProvider()]
);

const { wallets } = getDefaultWallets({
  appName: "Felina Protocol",
  projectId,
  chains,
});

const connectors = connectorsForWallets([
  ...wallets,
  {
    groupName: "Other",
    wallets: [
      argentWallet({ projectId, chains }),
      trustWallet({ projectId, chains }),
    ],
  },
]);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

export { chains, wagmiConfig };
