import { useQuery } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import { erc20Abi } from "viem";
import { wagmiConfig } from "@/config/wagmi";

export const useAllowance = (
  tokenAddr: `0x${string}` | undefined,
  owner: `0x${string}` | undefined,
  spender: `0x${string}` | undefined,
  chainId?: number | undefined,
) => {
  const {
    data: allowance,
    isLoading: isLoadingAllowance,
    refetch: refetchAllowance,
  } = useQuery({
    queryKey: ["allowance", tokenAddr, owner, spender],
    queryFn: () => getAllowance(tokenAddr, owner, spender, chainId),
    enabled: !!tokenAddr && !!owner && !!spender,
  });
  return { allowance, isLoadingAllowance, refetchAllowance };
};

const getAllowance = async (
  tokenAddr: `0x${string}` | undefined,
  owner: `0x${string}` | undefined,
  spender: `0x${string}` | undefined,
  chainId?: number | undefined,
) => {
  if (!tokenAddr) return BigInt(0);
  if (!owner) return BigInt(0);
  if (!spender) return BigInt(0);

  if (!chainId) {
    const allowance = (await readContract(wagmiConfig, {
      address: tokenAddr,
      abi: erc20Abi,
      functionName: "allowance",
      args: [owner, spender],
    })) as bigint;
    return allowance;
  } else {
    const validChain = wagmiConfig.chains.find((chain) => chain.id === chainId);
    if (!validChain) return BigInt(0);
    const allowance = (await readContract(wagmiConfig, {
      address: tokenAddr,
      abi: erc20Abi,
      functionName: "allowance",
      args: [owner, spender],
      chainId: validChain.id,
    })) as bigint;
    return allowance;
  }
};
