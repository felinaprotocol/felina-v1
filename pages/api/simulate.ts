import type { NextApiRequest, NextApiResponse } from "next";
import { providers, Wallet } from "ethers";
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";
import corsMiddleware, { runMiddleware } from "@lib/cors";
import { currentConfig } from "@config/config";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runMiddleware(req, res, corsMiddleware);

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const chainId = process.env.NEXT_PUBLIC_ACTIVE_NETWORK === "mainnet" ? 1 : 5;
    const provider = new providers.JsonRpcProvider(currentConfig.alchemyUrl, chainId);
    const authSigner = Wallet.createRandom();
    const flashbotsProvider: FlashbotsBundleProvider = await FlashbotsBundleProvider.create(
      provider,
      authSigner,
      process.env.NEXT_PUBLIC_ACTIVE_NETWORK === "mainnet" ? undefined : "https://relay-goerli.flashbots.net",
      process.env.NEXT_PUBLIC_ACTIVE_NETWORK === "mainnet" ? undefined : "goerli"
    );

    const { rawData, numberOfBlocks } = req.body;
    const reverseRawData = rawData.reverse();
    const blockNumber = await provider.getBlockNumber();

    const simulation = await flashbotsProvider.simulate(reverseRawData, blockNumber + 1);
    const simulationJSON = JSON.stringify(
      simulation,
      null,
      2
    );
    if ("error" in simulation) {
      console.log(`Simulation Error: ${simulation.error.message}`);
    } else {
      console.log(
        `Simulation Success: ${blockNumber} ${simulationJSON}`
      );
    }

    return res.status(200).json({ success: true, message: simulationJSON });
  } catch (error) {
    console.error("Error submitting bundle:", error);
    res.status(500).json({ error: "Error submitting bundle" });
  }
}
