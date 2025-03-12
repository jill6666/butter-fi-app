import { aggregatorAbi } from "@/lib/abis";
import { TurnkeySigner } from "@turnkey/ethers";
import { ethers } from "ethers";

export const investInStrategy = async ({
  aggregatorAddress,
  params,
  connectedSigner,
}: {
  aggregatorAddress: `0x${string}`;
  params: {
    user: `0x${string}`;
    strategyId: number;
    token: `0x${string}`;
    amount: bigint;
  };
  connectedSigner: TurnkeySigner
}): Promise<`0x${string}`> => {
  const provider = connectedSigner.provider!;
  const address = await connectedSigner.getAddress();

  if (!address || !provider) {
    throw new Error("Cannot execute a trade without a connected wallet");
  }
  console.log("investInStrategy === ", {
    user: params.user,
    strategyId: params.strategyId,
    token: params.token,
    amount: params.amount
  })

  // Encode the function call data
  const iface = new ethers.Interface(aggregatorAbi);
  const data = iface.encodeFunctionData("investInStrategy", [
    params.user,
    params.strategyId,
    params.token,
    params.amount
  ]);

  // TODO: implement the transaction and setup policies
  const tx = {
    data,
    to: aggregatorAddress,
    value: 0,
    from: address,
    maxFeePerGas: ethers.parseUnits("50", "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
  };

  const investTx = await connectedSigner.sendTransaction(tx);
  
  console.log("Awaiting confirmation for invest tx...\n");

  const result = await connectedSigner.provider!.waitForTransaction(
    investTx.hash,
    1,
  );
  console.log("Swap tx confirmed: ", result);
  return result?.hash! as `0x${string}`;
};