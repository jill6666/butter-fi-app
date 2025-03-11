"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { investInStrategy } from "@/actions/investInStrategy"
import { withdrawFromStrategy } from "@/actions/withdrawFromStrategy"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BotIcon } from "lucide-react"
import CONFIG from "@/config/protocol";
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
import { App, ConfigProvider, theme, Space, Spin } from "antd";
import { useRef } from "react";
import { useSendMessage, Role } from "@/hooks/useSendMessage"
import { Bubble, Prompts } from '@ant-design/x';
import type { GetProp, GetRef } from 'antd';

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
        👽 Wait, I'm thinking...
        <Spin size="small" />
      </Space>
    ),
  },
  [Role.USER]: {
    placement: 'end',
    avatar: { icon: <UserOutlined />, style: { background: '#87d068' } },
  },
}

const provider = new ethers.JsonRpcProvider("https://monad-testnet.drpc.org", MONAD_ENV);
const queryClient = new QueryClient();

export function Strategy() {
  const { client, walletClient } = useTurnkey()
  const { user } = useUser()
  const { onRequest, messages, isPending, isError } = useSendMessage()
  const listRef = useRef<GetRef<typeof Bubble.List>>(null);

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
                      label: `Strategy ${strategy?.strategyID.toString()}`,
                      description: strategy?.stakeToken
                    })) || []
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
                          <Prompts
                            style={{ paddingTop: "16px" }}
                            title="✨ Choose a Strategy"
                            items={items}
                            onItemClick={(info) => {
                              handleInvestInStrategy()
                            }}
                          />
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