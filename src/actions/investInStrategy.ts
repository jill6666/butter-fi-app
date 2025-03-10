import { aggregatorAbi } from "@/lib/abis";
import { TurnkeySigner } from "@turnkey/ethers";

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

  // TODO: implement the transaction and setup policies
  const tx = {
    data: "0x0000000",
    to: aggregatorAddress,
    value: "1000",
    from: address,
    maxFeePerGas: BigInt(21000),
    maxPriorityFeePerGas: BigInt(21000),
  };

  const swapTx = await connectedSigner.sendTransaction(tx);
  
  console.log("Awaiting confirmation for swap tx...\n");

  const result = await connectedSigner.provider!.waitForTransaction(
    swapTx.hash,
    1,
  );
  console.log("Swap tx confirmed: ", result);
  return result?.hash! as `0x${string}`;
};