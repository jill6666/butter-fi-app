import { aggregatorAbi } from "@/lib/abis";
import { TurnkeySigner } from "@turnkey/ethers";
import { ethers } from "ethers";

export const withdrawFromStrategy = async ({
  aggregatorAddress,
  params,
  connectedSigner,
}: {
  aggregatorAddress: `0x${string}`;
  params: {
    user: `0x${string}`;
    strategyId: number;
    amount: bigint;
  };
  connectedSigner: TurnkeySigner
}): Promise<`0x${string}`> => {
  const provider = connectedSigner.provider!;
  const address = await connectedSigner.getAddress();

  if (!address || !provider) {
    throw new Error("Cannot execute withdrawal without a connected wallet");
  }

  console.log("withdrawFromStrategy === ", {
    user: params.user,
    strategyId: params.strategyId,
    amount: params.amount
  });

  // Encode the function call data
  const iface = new ethers.Interface(aggregatorAbi);
  const data = iface.encodeFunctionData("withdrawFromStrategy", [
    params.user,
    params.strategyId,
    params.amount
  ]);

  const tx = {
    data,
    to: aggregatorAddress,
    value: 0,
    from: address,
    maxFeePerGas: ethers.parseUnits("50", "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
  };

  const withdrawTx = await connectedSigner.sendTransaction(tx);
  
  console.log("Awaiting confirmation for withdraw tx...\n");

  const result = await connectedSigner.provider!.waitForTransaction(
    withdrawTx.hash,
    1,
  );
  console.log("Withdraw tx confirmed: ", result);
  return result?.hash! as `0x${string}`;
};