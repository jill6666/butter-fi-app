import { aggregatorAbi } from "@/lib/abis";
import { TurnkeySigner } from "@turnkey/ethers";
  
// withdraw from strategy and sweep to long-term-wallet
export const withdrawFromStrategy = async ({
  aggregatorAddress,
  params,
  connectedSigner, // trading signer
  destinationAddress, // long-term-wallet
}: {
  aggregatorAddress: `0x${string}`;
  params: {
    user: `0x${string}`;
    strategyId: number;
    amount: bigint;
  };
  connectedSigner: TurnkeySigner;
  destinationAddress: `0x${string}`;
}): Promise<`0x${string}`> => {
  const provider = connectedSigner.provider!;
  const address = await connectedSigner.getAddress();

  if (!address || !provider) {
    throw new Error("Cannot execute a trade without a connected wallet");
  }

  // TODO: implement the tx and setup policies
  const withdrawTx = {
    data: "0x0000000",
    to: aggregatorAddress,
    value: "1000",
    from: address,
    maxFeePerGas: BigInt(21000),
    maxPriorityFeePerGas: BigInt(21000),
  };

  const withdrawTxResult = await connectedSigner.sendTransaction(withdrawTx);
  
  console.log("Awaiting confirmation for withdraw tx...\n");

  const withdrawResult = await connectedSigner.provider!.waitForTransaction(
    withdrawTxResult.hash,
    1,
  );
  if (!withdrawResult?.hash) throw new Error("Failed to withdraw from strategy");
  
  // sweep to long-term-wallet
  // TODO: implement the tx and setup policies
  const sweepTx = {
    data: "0x0000000",
    to: destinationAddress,
    value: "1000",
    from: address,
    maxFeePerGas: BigInt(21000),
    maxPriorityFeePerGas: BigInt(21000),
  };
  
  const sendSweepTx = await connectedSigner.sendTransaction(sweepTx);
  console.log("Awaiting confirmation for sweep tx...\n");
  const sweepResult = await connectedSigner.provider!.waitForTransaction(
    sendSweepTx.hash,
    1,
  );
  if (!sweepResult?.hash) throw new Error("Failed to sweep to long-term-wallet");
  return sweepResult?.hash! as `0x${string}`;
};