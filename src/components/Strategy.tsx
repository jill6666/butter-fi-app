"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { investInStrategy } from "@/actions/investInStrategy"
import { withdrawFromStrategy } from "@/actions/withdrawFromStrategy"
import { claimReward } from "@/actions/claimReward"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BotIcon } from "lucide-react"
import CONFIG from "@/config/protocol";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"
import { useTurnkey } from "@turnkey/sdk-react"
import WelcomeComponent from "@/components/chat/Welcome"
import WelcomePrompt from "@/components/chat/Prompt"
import SenderComponent from "@/components/chat/Sender"
import { UserOutlined } from "@ant-design/icons";
import { App, ConfigProvider, theme, Space, Input } from "antd";
import { useEffect, useRef, useState, useMemo } from "react";
import { useSendMessage, Role } from "@/hooks/useSendMessage"
import { Bubble, Prompts } from '@ant-design/x';
import type { GetProp, GetRef } from 'antd';
import { ArrowLeftIcon } from "lucide-react";
import { formatEther, parseUnits } from "viem"
import { Loader } from "lucide-react"
import { useBalanceOf } from "@/hooks/useBalanceOf";
import { useTradingSigner } from "@/hooks/useTradingSigner";
import { useAllowance } from "@/hooks/useAllowance";
import { approveToken } from "@/actions/investInStrategy";
import { useWallets } from "@/providers/WalletProvider"

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

const queryClient = new QueryClient();

export function Strategy() {
  const { client, walletClient } = useTurnkey()
  const { onRequest, messages, isPending, addSystemMessage } = useSendMessage()
  const listRef = useRef<GetRef<typeof Bubble.List>>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<{
    strategyId: string
    token: `0x${string}`
    label: string
    description: string
  } | null>(null)
  const [amount, setAmount] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const { data: signer, isLoading: isLoadingSigner } = useTradingSigner()
  const [transactionType, setTransactionType] = useState<"EXECUTE_TRANSACTION" | "WITHDRAW_POSITION" | "CLAIM_REWARD" | null>(null);

  const { allowance, isLoadingAllowance } = useAllowance(
    selectedStrategy?.token,
    signer?.signerAddress,
    CONFIG.CONTRACT_ADDRESSES.Aggregator
  )
  const { state } = useWallets()
  const { selectedAccount } = state

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    console.log("****lastMessage type: ", lastMessage?.type)
    if (lastMessage?.type === "PURE_STRING_RESPONSE") {
      setSelectedStrategy(null);
      setTransactionType(null);
    } else if (lastMessage?.type === "EXECUTE_TRANSACTION") {
      setTransactionType("EXECUTE_TRANSACTION");
    } else if (lastMessage?.type === "WITHDRAW_POSITION") {
      setTransactionType("WITHDRAW_POSITION");
    } else if (lastMessage?.type === "CLAIM_REWARD") {
      setTransactionType("CLAIM_REWARD");
    }
  }, [messages])

  const isValidAllowance = useMemo(() => {
    return allowance && allowance > parseUnits(amount.toString(), 18)
  }, [allowance, amount])

  const { balance, isLoadingBalance, refetchBalance } = useBalanceOf(
    selectedStrategy?.token,
    signer?.signerAddress
  )

  const isSomethingLoading = useMemo(() => {
    return isLoadingSigner || isLoadingBalance || isLoadingAllowance
  }, [
    isLoadingSigner,
    isLoadingBalance,
    isLoadingAllowance
  ])

  const handleInvestInStrategy = async (strategyId: string, token: `0x${string}`) => {
    if (!client) return toast.error("Failed to get client, please try again.")
    if (!walletClient || !signer || !strategyId || !token || !selectedAccount?.address) return

    try {
      setIsProcessing(true)
      console.log("get signer and user", {
        signerAddress: signer?.signerAddress,
        user: selectedAccount?.address
      })
      const turnkeySigner = signer?.turnkeySigner
      const signerAddress = signer?.signerAddress
      const _amount = parseUnits(amount.toString(), 18)

      if (!isValidAllowance) {
        await approveToken({
          aggregatorAddress: CONFIG.CONTRACT_ADDRESSES.Aggregator,
          params: {
            user: signerAddress,
            strategyId: Number(strategyId),
            token,
            amount: _amount
          },
          connectedSigner: turnkeySigner,
        })
      }

      const hash = await investInStrategy({
        aggregatorAddress: CONFIG.CONTRACT_ADDRESSES.Aggregator,
        params: {
          user: selectedAccount?.address,
          strategyId: Number(strategyId),
          token,
          amount: _amount
        },
        connectedSigner: turnkeySigner,
      })

      const txnUrl = `${CONFIG.EXPLORER_URL}/tx/${hash}`
      toast.success(
        <>
          Transaction successful: <a href={txnUrl} target="_blank" rel="noopener noreferrer">{txnUrl}</a>
        </>
      )
      addSystemMessage(`✅ Transaction successful! View transaction: ${txnUrl}`)

      refetchBalance()
      setAmount(0)
      setSelectedStrategy(null)
    } catch (error) {
      console.error("investInStrategy", error)
      toast.error("Oops! Failed to invest in strategy, please try again.")
      addSystemMessage("❌ Oops! Failed to invest in strategy, please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleWithdrawPosition = async (strategyId: string) => {
    if (!client) return toast.error("Failed to get client, please try again.");
    if (!walletClient || !signer || !selectedAccount?.address) return;

    try {
      setIsProcessing(true);
      console.log("get signer and user", {
        signerAddress: signer?.signerAddress,
        user: selectedAccount?.address,
      });

      const turnkeySigner = signer?.turnkeySigner;
      const _amount = parseUnits(amount.toString(), 18)

      const hash = await withdrawFromStrategy({
        aggregatorAddress: CONFIG.CONTRACT_ADDRESSES.Aggregator,
        params: {
          user: selectedAccount?.address,
          strategyId: Number(strategyId),
          amount: _amount
        },
        connectedSigner: turnkeySigner,
      });

      const txnUrl = `${CONFIG.EXPLORER_URL}/tx/${hash}`;
      toast.success(
        <>
          Withdrawal successful:{" "}
          <a href={txnUrl} target="_blank" rel="noopener noreferrer">
            {txnUrl}
          </a>
        </>
      );
      addSystemMessage(`✅ Withdrawal successful! View transaction: ${txnUrl}`)

      refetchBalance();
      setAmount(0);
      setSelectedStrategy(null);
    } catch (error) {
      console.error("withdrawFromStrategy", error);
      toast.error("Oops! Failed to withdraw, please try again.");
      addSystemMessage("❌ Oops! Failed to withdraw, please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClaimReward = async (strategyId: string) => {
    if (!client) return toast.error("Failed to get client, please try again.");
    if (!walletClient || !signer || !selectedAccount?.address) return;

    try {
      setIsProcessing(true);
      console.log("get signer and user", {
        signerAddress: signer?.signerAddress,
        user: selectedAccount?.address,
      });

      const turnkeySigner = signer?.turnkeySigner;

      console.log("claimReward === ", {
        user: selectedAccount?.address,
        strategyId: Number(strategyId),
      });
      const hash = await claimReward({
        aggregatorAddress: CONFIG.CONTRACT_ADDRESSES.Aggregator,
        params: {
          user: selectedAccount?.address,
          strategyId: Number(strategyId),
        },
        connectedSigner: turnkeySigner,
      });

      const txnUrl = `${CONFIG.EXPLORER_URL}/tx/${hash}`;
      toast.success(
        <>
          Reward claimed successful:{" "}
          <a href={txnUrl} target="_blank" rel="noopener noreferrer">
            {txnUrl}
          </a>
        </>
      );
      addSystemMessage(`✅ Reward claimed successful! View transaction: ${txnUrl}`)

      refetchBalance();
      setAmount(0);
      setSelectedStrategy(null);
    } catch (error) {
      console.error("claimReward", error);
      toast.error("Oops! Failed to claim reward, please try again.");
      addSystemMessage("❌ Oops! Failed to claim reward, please try again.");
    } finally {
      setIsProcessing(false);
    }
  };


  const handleSendMessage = async (prompt: string) => {
    const address = selectedAccount?.address as `0x${string}`
    if (!address) return toast.error("Failed to get user address, please try again.")
    console.log("current user address === ", address)
    await onRequest({ userInput: prompt, userAddress: address })
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
                              {isSomethingLoading ? (
                                <div className="flex items-center justify-center pb-4">
                                  <Loader className="h-4 w-4 animate-spin" />
                                </div>
                              ) : (
                                <>
                                  <div className="py-2 px-4 border border-white/10 rounded">
                                    <p>{selectedStrategy.description}</p>
                                    <div className="flex flex-col gap-4">
                                      {transactionType !== "CLAIM_REWARD" && (
                                        <div className="w-full flex flex-col gap-1">
                                          <div className="text-sm w-full flex items-center gap-2 justify-between text-white/60">
                                            Balance: {isLoadingBalance ? "loading..." : balance ? formatEther(balance) : "-"} WMOD
                                            <Button
                                              variant="default"
                                              size="icon"
                                              onClick={() => setAmount(Number(balance ? formatEther(balance) : "0"))}
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
                                      )}
                                      <Button
                                        variant="default"
                                        onClick={() => {
                                          if (transactionType === "EXECUTE_TRANSACTION") {
                                            console.log("***EXECUTE_TRANSACTION")
                                            handleInvestInStrategy(selectedStrategy.strategyId, selectedStrategy.token);
                                          } else if (transactionType === "WITHDRAW_POSITION") {
                                            console.log("***WITHDRAW_POSITION")
                                            handleWithdrawPosition(selectedStrategy.strategyId);
                                          } else if (transactionType === "CLAIM_REWARD") {
                                            console.log("***CLAIM_REWARD")
                                            handleClaimReward(selectedStrategy.strategyId);

                                          } else {
                                            console.log("***elseeeeeee")
                                            console.log("transactionType === ", transactionType)
                                            toast.error("Oops! Something went wrong, please try again.");
                                          }
                                        }}
                                        disabled={
                                          isPending ||
                                          isSomethingLoading ||
                                          (transactionType !== "CLAIM_REWARD" && amount <= 0) ||
                                          (transactionType === "EXECUTE_TRANSACTION" && amount > (balance ? Number(formatEther(balance)) : 0))
                                        }
                                        className="bg-[#6E54FF]"
                                      >
                                        {isProcessing ? (
                                          <>
                                            <Loader className="h-4 w-4 animate-spin" />
                                            <span className="ml-2">Loading...</span>
                                          </>
                                        ) : "Confirm"}
                                      </Button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            <Prompts
                              style={{ paddingTop: "16px" }}
                              title="✨ Choose a Strategy"
                              items={items}
                              styles={{
                                itemContent: {
                                  maxWidth: "180px"
                                }
                              }}
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
            <SenderComponent disabled={isPending} onSubmit={handleSendMessage} />
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