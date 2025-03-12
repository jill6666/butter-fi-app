import { useQuery } from "@tanstack/react-query";
import { useTurnkey } from "@turnkey/sdk-react"
import { TurnkeySigner } from "@turnkey/ethers";
import getPrivateKeysForTag from "@/lib/turnkey/getPrivateKeysForTag"
import { ethers } from "ethers";
import { useUser } from "@/hooks/useUser";
import { TurnkeyBrowserClient, TurnkeyWalletClient } from "@turnkey/sdk-browser";

const MONAD_ENV = {
  chainId: 10143,
  name: "monad testnet",
}

const provider = new ethers.JsonRpcProvider("https://monad-testnet.drpc.org", MONAD_ENV);

export const useTradingSigner = () => {
  const { client, walletClient } = useTurnkey()
  const { user } = useUser()

  const {
    data,
    isLoading,
    refetch,
    error,
    isError
  } = useQuery({
    queryKey: ["signer", user?.organization?.organizationId],
    queryFn: () => getSigner(client, walletClient, user?.organization?.organizationId),
    enabled: !!client && !!walletClient && !!user?.organization?.organizationId,
    retry: 3
  });

  return { data, isLoading, refetch };
};
const getSigner = async (
  client?: TurnkeyBrowserClient, walletClient?: TurnkeyWalletClient, organizationId?: string
) => {
  if (!client || !walletClient || !organizationId) throw new Error()
  
  const privateKeys = await getPrivateKeysForTag(client, "trading", organizationId)
  if (!privateKeys.length) throw new Error("Failed to get private key, please try again.")
    
  const privateKeyId = privateKeys[0].privateKeyId
  const turnkeySigner = (new TurnkeySigner({
    client,
    organizationId,
    signWith: privateKeyId
  })).connect(provider)
  const signerAddress = (await turnkeySigner.getAddress()) as `0x${string}`

  return {
    turnkeySigner,
    signerAddress
  }
};
