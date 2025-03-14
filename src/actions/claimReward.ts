import { aggregatorAbi } from "@/lib/abis";
import { TurnkeySigner } from "@turnkey/ethers";
import { ethers } from "ethers";

export const claimReward = async ({
  aggregatorAddress,
  params,
  connectedSigner,
}: {
  aggregatorAddress: `0x${string}`;
  params: {
    user: `0x${string}`;
    strategyId: number;
  };
  connectedSigner: TurnkeySigner
}): Promise<`0x${string}`> => {
  const provider = connectedSigner.provider!;
  const address = await connectedSigner.getAddress();

  if (!address || !provider) {
    throw new Error("Cannot claim reward without a connected wallet");
  }

  console.log("claimReward === ", {
    user: params.user,
    strategyId: params.strategyId,
  });

  // Encode the function call data
  const iface = new ethers.Interface(aggregatorAbi);
  const data = iface.encodeFunctionData("claimRewards", [
    params.strategyId,
    params.user
  ]);

  const tx = {
    data,
    to: aggregatorAddress,
    value: 0,
    from: address,
    maxFeePerGas: ethers.parseUnits("50", "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
  };

  const claimRewardTx = await connectedSigner.sendTransaction(tx);
  
  console.log("Awaiting confirmation for claim reward tx...\n");

  const result = await connectedSigner.provider!.waitForTransaction(
    claimRewardTx.hash,
    1,
  );
  console.log("Claim reward tx confirmed: ", result);
  return result?.hash! as `0x${string}`;
};