"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { investInStrategy } from "@/actions/investInStrategy"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BotIcon } from "lucide-react"
import CONFIG from "@/config/protocol";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"
import getPrivateKeysForTag from "@/lib/turnkey/getPrivateKeysForTag"
import { useTurnkey } from "@turnkey/sdk-react"
import { TurnkeySigner } from "@turnkey/ethers";
import { useUser } from "@/hooks/useUser";
import { ethers } from "ethers";
import WelcomeComponent from "@/components/chat/Welcome"
import WelcomePrompt from "@/components/chat/Prompt"
import SenderComponent from "@/components/chat/Sender"
import { UserOutlined } from "@ant-design/icons";
import { App, ConfigProvider, theme, Space, Spin, Input } from "antd";
import { useEffect, useRef, useState } from "react";
import { useSendMessage, Role } from "@/hooks/useSendMessage"
import { Bubble, Prompts } from '@ant-design/x';
import type { GetProp, GetRef } from 'antd';
import { ArrowLeftIcon } from "lucide-react";
import { useWallets } from "@/providers/WalletProvider"
import { formatEther } from "viem"
import { Loader } from "lucide-react"

const MONAD_ENV = {
  chainId: 10143,
  name: "monad testnet",
}
const roles: GetProp<typeof Bubble.List, 'roles'> = {
  [Role.ASSISTANT]: {
    placement: 'start',
    avatar: { icon: <UserOutlined />, style: { background: '#fde3cf' } },
    typing: { step: 5, interval: 20 },
    style: {
      maxWidth: 600,
      marginInlineEnd: 44,
    },
    styles: {
      footer: {
        width: '100%',
      },
    },
    loadingRender: () => (
      <Space>
        <Loader className="h-4 w-4 animate-spin" />
        👽 Wait, I'm thinking...
      </Space>
    ),
  },
  [Role.USER]: {
    placement: 'end',
    avatar: { icon: <UserOutlined />, style: { background: '#6E54FF' } },
  },
}

const provider = new ethers.JsonRpcProvider("https://monad-testnet.drpc.org", MONAD_ENV);
const queryClient = new QueryClient();

export function Strategy() {
  const { client, walletClient } = useTurnkey()
  const { user } = useUser()
  const { state } = useWallets()
  const { selectedAccount } = state
  const { onRequest, messages, isPending, isError } = useSendMessage()
  const listRef = useRef<GetRef<typeof Bubble.List>>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<{
    strategyId: string
    token: `0x${string}`
    label: string
    description: string
  } | null>(null)
  const [amount, setAmount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (!lastMessage?.strategies?.length) {
      setSelectedStrategy(null)
    }
  }, [messages])

  const handleInvestInStrategy = async (strategyId: string, token: `0x${string}`) => {
    // FIXME: cannot get client from useTurnkey QQ
    if (!client) return toast.error("Failed to get client, please try again.")
    if (!walletClient || !user?.organization?.organizationId || !strategyId || !token) return
    const organizationId = user?.organization?.organizationId;
    
    try {
      setIsLoading(true)
      const privateKeys = await getPrivateKeysForTag(client, "trading", organizationId)
      if (!privateKeys.length) throw new Error("Failed to get private key, please try again.")
        
      const privateKeyId = privateKeys[0].privateKeyId
      const turnkeySigner = (new TurnkeySigner({
        client,
        organizationId,
        signWith: privateKeyId
      })).connect(provider)
      const userAddress = selectedAccount?.address; // TODO: should I send userAddress or signerAddress?
      const signerAddress = (await turnkeySigner.getAddress()) as `0x${string}`
      const amount = BigInt(10**18)

      const hash = await investInStrategy({
        aggregatorAddress: CONFIG.CONTRACT_ADDRESSES.Aggregator,
        params: {
          user: signerAddress,
          strategyId: Number(strategyId),
          token,
          amount
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
      toast.error("Failed to invest in strategy, please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (prompt: string) => {
    await onRequest(prompt)
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
      <CardContent className="space-y-1 h-[calc(100%-4rem)]">
        <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
          <App className="h-full w-full flex flex-col gap-4">
            <div className="w-full h-[calc(100%-4rem)] overflow-scroll flex flex-col pb-4">
              {!!(messages.length) ? (
                <Bubble.List
                  ref={listRef}
                  roles={roles}
                  items={messages.map((message, index) => {
                    const hasStrategies = !!message?.strategies?.length
                    const items = message?.strategies?.map(strategy => ({
                      key: `${strategy?.strategyID}`,
                      label: `${strategy?.label}`,
                      description: `${strategy?.description}`,
                    })) || []
                    const isTheLastMessage = index === messages.length - 1
                    return {
                      ...message,
                      content: hasStrategies ? (
                        <>
                          <Bubble
                            variant="shadow"
                            role={Role.ASSISTANT}
                            content={message?.content}
                            typing={{ step: 5, interval: 20 }}
                          />
                          {isTheLastMessage && selectedStrategy ? (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="default"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedStrategy(null)
                                    setAmount(0)
                                  }}
                                >
                                  <ArrowLeftIcon className="w-4 h-4" />
                                </Button>
                                <p className="font-bold">{selectedStrategy.label}</p>
                              </div>
                              <div className="p-2 border border-white/10 rounded">
                              <p>{selectedStrategy.description}</p>
                              <div className="flex flex-col gap-4">
                                <div className="w-full flex flex-col gap-1">
                                <div className="text-sm w-full flex items-center gap-2 justify-between text-white/60">
                                  Balance: {selectedAccount?.balance ? formatEther(selectedAccount?.balance) : "0"} MON
                                  <Button
                                    variant="default"
                                    size="icon"
                                    onClick={() => setAmount(Number(selectedAccount?.balance ? formatEther(selectedAccount?.balance) : "0"))}
                                  >
                                    Max
                                  </Button>
                                </div>
                                <Input
                                  type="number"
                                  value={amount}
                                  style={{ background: "transparent", height: "40px" }}
                                  onChange={(e) => setAmount(Number(e.target.value))}
                                />
                                </div>
                                <Button
                                  variant="default"
                                  onClick={() => handleInvestInStrategy(selectedStrategy.strategyId, selectedStrategy.token)}
                                  disabled={isPending || isError || amount <= 0 || amount > (selectedAccount?.balance ? Number(formatEther(selectedAccount?.balance)) : 0)}
                                  className="bg-[#6E54FF]"
                                >
                                  {isLoading ? (
                                    <>
                                      <Loader className="h-4 w-4 animate-spin" />
                                      <span className="ml-2">Loading...</span>
                                    </>
                                  ) : "Confirm"}
                                </Button>
                              </div>
                              </div>
                            </div>
                          ) : (  
                            <Prompts
                              style={{ paddingTop: "16px" }}
                              title="✨ Choose a Strategy"
                              items={items}
                              onItemClick={(info) => {
                                const strategy = message?.strategies?.find(strategy => strategy?.strategyID === Number(info.data.key))
                                if (!isTheLastMessage) return toast.warning("Oops! This message is outdated, please select a new strategy.")
                                if (!strategy) return
                                setSelectedStrategy({
                                  strategyId: info.data.key,
                                  token: strategy?.stakeToken as `0x${string}`,
                                  label: `${strategy?.label}`,
                                  description: `${strategy?.description}`
                              })
                            }}
                          />
                          )}
                        </>
                      ) : message?.content
                    }
                  })}
                  autoScroll={true}
                  style={{ maxHeight: "100%", paddingRight: "16px" }}
                />
              ) : (
                <>
                  <WelcomeComponent />
                  <div className="mt-auto">
                    <WelcomePrompt onPromptClick={handleSendMessage} />
                  </div>
                </>
              )}
            </div>
            <SenderComponent disabled={isPending || isError} onSubmit={handleSendMessage} />
          </App>
        </ConfigProvider>
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