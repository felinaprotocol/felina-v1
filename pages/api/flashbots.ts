import type { NextApiRequest, NextApiResponse } from "next";
import { providers, Wallet } from "ethers";
import {
  FlashbotsBundleProvider,
  FlashbotsBundleResolution,
} from "@flashbots/ethers-provider-bundle";
import corsMiddleware, { runMiddleware } from "@lib/cors";
import { currentConfig } from "@config/config";

function getStatus(resolution: FlashbotsBundleResolution, blockNumber: number): { code: number, success: boolean,blocknumber: number, message: string } {
  switch (resolution) {
    case FlashbotsBundleResolution.BundleIncluded:
      return { code: 200, success: true, blocknumber: blockNumber, message: `Bundle included in block ${blockNumber + 1}` };
    case FlashbotsBundleResolution.BlockPassedWithoutInclusion:
      return { code: 200, success: false, blocknumber: blockNumber, message: "Bundle was not included in the block" };
    case FlashbotsBundleResolution.AccountNonceTooHigh:
      return { code: 400, success: false, blocknumber: blockNumber, message: "Account nonce too high" };
    default:
      return { code: 400, success: false, blocknumber: blockNumber, message: "Unknown resolution" };
  }
}

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
    if ("error" in simulation) {
      console.log(`Simulation Error: ${simulation.error.message}`);
    } else {
      console.log(
        `Simulation Success: ${blockNumber} ${JSON.stringify(
          simulation,
          null,
          2
        )}`
      );
    }

    const flashbotsTransactionResponse = await flashbotsProvider.sendRawBundle(reverseRawData, blockNumber + 1);
    if ('error' in flashbotsTransactionResponse) {
      console.error("Error submitting bundle:", flashbotsTransactionResponse.error);
      return res.status(500).json({ error: "Error submitting bundle: " + flashbotsTransactionResponse.error.message });
    }
    
    const resolution = await flashbotsTransactionResponse.wait();
    const status = getStatus(resolution, blockNumber);
    console.log(status);
    return res.status(status.code).json({ success: status.success, blocknumber: blockNumber, message: status.message });
  } catch (error) {
    console.error("Error submitting bundle:", error);
    res.status(500).json({ error: "Error submitting bundle" });
  }
}
