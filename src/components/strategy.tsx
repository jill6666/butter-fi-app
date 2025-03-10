"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { investInStrategy } from "@/actions/investInStrategy"
import { withdrawFromStrategy } from "@/actions/withdrawFromStrategy"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Button } from "@/components/ui/button"
import { LogInIcon, PiggyBankIcon, LogOutIcon, BotIcon } from "lucide-react"
import CONFIG from "@/config/protocol";
import { toast } from "sonner"
import getPrivateKeysForTag from "@/lib/turnkey/getPrivateKeysForTag"
import { useTurnkey } from "@turnkey/sdk-react"
import { TurnkeySigner } from "@turnkey/ethers";
import { useUser } from "@/hooks/use-user";
import { ethers } from "ethers";
import BubbleComponent from "@/components/chat/bubble"
import WelcomeComponent from "@/components/chat/welcome"
import PromptComponent from "@/components/chat/prompt"

const MONAD_ENV = {
  chainId: 10143,
  name: "monad testnet",
}

const provider = new ethers.JsonRpcProvider("https://monad-testnet.drpc.org", MONAD_ENV);
const queryClient = new QueryClient();

export function Strategy() {
  const { client, walletClient } = useTurnkey()
  const { user } = useUser()

  const handleInvestInStrategy = async () => {
    if (!client || !walletClient || !user?.organization?.organizationId) return
    const organizationId = user?.organization?.organizationId;

    try {
      const privateKeys = await getPrivateKeysForTag(client, "trading", organizationId)
      if (!privateKeys.length) throw new Error("Failed to get private key")

      const privateKeyId = privateKeys[0].privateKeyId
      const turnkeySigner = (new TurnkeySigner({
        client,
        organizationId,
        signWith: privateKeyId
      })).connect(provider)

      const hash = await investInStrategy({
        aggregatorAddress: "0x1234567890123456789012345678901234567890",
        params: {
          user: "0x1234567890123456789012345678901234567890",
          strategyId: 1,
          token: "0x1234567890123456789012345678901234567890",
          amount: BigInt(1000000000000000000)
        },
        connectedSigner: turnkeySigner,
      })
      const txnUrl = `${CONFIG.EXPLORER_URL}/tx/${hash}`
      toast.success(
        <>
          Transaction successful: <a href={txnUrl} target="_blank" rel="noopener noreferrer">{txnUrl}</a>
        </>
      )
    } catch (error) {
      console.log("error", error)
      toast.error("Failed to invest in strategy")
    }
  }

  const handleWithdrawFromStrategy = async () => {
    if (!client || !walletClient || !user?.organization?.organizationId) return
    const organizationId = user?.organization?.organizationId;
    try {
      const tradingPrivateKeys = await getPrivateKeysForTag(client, "trading", organizationId)
      const longTermPrivateKeys = await getPrivateKeysForTag(client, "long_term_storage", organizationId)
      if (!tradingPrivateKeys.length || !longTermPrivateKeys.length) throw new Error("Failed to get private key")

      const privateKeyId = tradingPrivateKeys[0].privateKeyId
      const turnkeySigner = (new TurnkeySigner({
        client,
        organizationId,
        signWith: privateKeyId
      })).connect(provider)
      const destinationAddress = (longTermPrivateKeys?.[0]?.addresses?.[0]?.address) as `0x${string}`
      if (!destinationAddress) throw new Error("Failed to get destination address")

      // withdraw and send to long term storage
      const hash = await withdrawFromStrategy({
        aggregatorAddress: "0x1234567890123456789012345678901234567890",
        params: {
          user: "0x1234567890123456789012345678901234567890",
          strategyId: 1,
          amount: BigInt(1000000000000000000)
        },
        connectedSigner: turnkeySigner,
        destinationAddress,
      })
      const txnUrl = `${CONFIG.EXPLORER_URL}/tx/${hash}`
      toast.success(
        <>
          Transaction successful: <a href={txnUrl} target="_blank" rel="noopener noreferrer">{txnUrl}</a>
        </>
      )
    } catch (error) {
      toast.error("Failed to withdraw from strategy")
    }
  }

  const handleWithdrawFromLongTermStorage = async () => {
    // TODO: implement this function
  }

  return (
    <Card className="w-full h-[calc(100vh-10rem)]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="font-medium flex gap-4 w-full items-center">
          Strategy Booster
          <span className="text-sm text-white/60 flex items-center">
            <BotIcon className="mr-2 h-4 w-4" />
            Ask AI for finding the best strategy
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <WelcomeComponent />
        <BubbleComponent />
        <PromptComponent />
        {/* <Button className="w-full" onClick={handleInvestInStrategy}>
          <LogInIcon className="mr-2 h-4 w-4" />
          Invest
        </Button>
        <Button className="w-full" onClick={handleWithdrawFromStrategy}>
          <LogOutIcon className="mr-2 h-4 w-4" />
          Leave Strategy
        </Button>
        <Button className="w-full" onClick={handleWithdrawFromLongTermStorage}>
          <PiggyBankIcon className="mr-2 h-4 w-4" />
          Withdraw
        </Button> */}
      </CardContent>
    </Card>
  )
}

export default function StrategyWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <Strategy />
    </QueryClientProvider>
  )
}