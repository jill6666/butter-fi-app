import { useQuery } from "@tanstack/react-query";
import { getBalance } from "@/actions/web3"

export const useBalance = (
  address: `0x${string}` | undefined,
) => {
  const {
    data,
    isLoading,
    refetch: refetchBalance,
  } = useQuery({
    queryKey: ["balance", address],
    queryFn: () => getBalance(address!),
    enabled: !!address,
  });

  return { data, isLoading, refetchBalance };
};