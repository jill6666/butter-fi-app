"use client"

import { useEffect, useState, useContext, useMemo } from "react"
import { useWallets } from "@/providers/wallet-provider"
import { CopyIcon, Download, HandCoins, Upload, PlusIcon } from "lucide-react"
import { toast } from "sonner"
import { formatEther } from "viem"

import { truncateAddress } from "@/lib/utils"
import { fundWallet } from "@/lib/web3"
import { useTokenPrice } from "@/hooks/use-token-price"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useGetUserTags } from "@/hooks/use-get-user-tags";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { updateUserTag, setupUserTag } from "@/actions/turnkey";
import { useTurnkey } from "@turnkey/sdk-react";

const queryClient = new QueryClient();

// import ExportWalletDialog from "./export-wallet"
// import ImportWalletDialog from "./import-wallet"
// import TransferDialog from "./transfer-dialog"
import { Skeleton } from "./ui/skeleton"

function UserTagCard() {
  const { ethPrice } = useTokenPrice()
  const { state } = useWallets()
  // TODO: why client is undefined?
  const { turnkey, client, walletClient } = useTurnkey()
  const { selectedWallet, selectedAccount } = state
  const [usdAmount, setUsdAmount] = useState<number | undefined>(undefined)
  const { user } = useUser()
  // const [isLoadingUserTags, setIsLoadingUserTags] = useState(false)
  const {
    userTags,
    isLoadingUserTags,
    refetchUserTags,
  } = useGetUserTags({
    organizationId: user?.organization?.organizationId || ""
  });

  useEffect(() => {
    if (ethPrice && selectedAccount?.balance !== undefined) {
      const balanceInEther = formatEther(selectedAccount?.balance)
      setUsdAmount(Number(balanceInEther) * ethPrice)
    }
  }, [ethPrice, selectedAccount?.balance])

  const handleAddTag = async (tag: { tagName: string; tagId: string }) => {
    try {
      if (!user || !tag?.tagName) return
      const response = await client?.createUserTag({
        userTagName: tag?.tagName,
        userIds: [],
      })
      console.log({response})
    } catch (error) {
      console.log(error)
    }
  }

  const handleAddTrader = async () => {
    // create user and add trader tag
    try {
      const publicKey = await walletClient?.getPublicKey()
      if (!publicKey) throw new Error("Failed to get public key")

      const traderTagId = userTags?.find(tag => tag && tag.tagName === "Trader")?.tagId
      if (!traderTagId) throw new Error("Failed to find trader tag")
      if (!user?.organization?.organizationId) throw new Error("Failed to get organization ID")

      const response = await client?.createApiOnlyUsers({
        organizationId: user?.organization?.organizationId,
        apiOnlyUsers: [{
          userName: "AI Trader",
          userTags: [traderTagId],
          apiKeys: [{
            apiKeyName: "trading",
            publicKey: publicKey
          }]
        }]
      })
      console.log("Successfully added trader", { response })
    } catch (error) {
      console.error("Error adding trader", error)
    }
  }
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className=" font-medium">
          User Tags
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-sm flex flex-col">
          <Button variant="ghost" size="default" className="cursor-pointer" onClick={handleAddTrader}>
            Add AI Bot
            <PlusIcon className="h-4 w-4" />
          </Button>
          {isLoadingUserTags ? (
            "Loading..."
          ) : (
            <div className="flex flex-col gap-1">
              {(userTags || []).map((tag: { tagName: string; tagId: string } | undefined, idx: number) => {
                const tagName = tag?.tagName ?? "-";
                return (
                <div key={idx} className="flex items-center gap-2 w-full justify-between">
                  {tagName}
                  <Button variant="ghost" size="icon" className="cursor-pointer" onClick={() => handleAddTag(tag!)}>
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </div>
              )})}
            </div>
          )
          }
        </div>
      </CardContent>
      <CardFooter className="sm:hidden">
        <div className="mx-auto flex w-full flex-col items-center gap-2">
          <Button className="w-full">
            <HandCoins className="mr-2 h-4 w-4" />
            Add funds
          </Button>
          {/* <TransferDialog /> */}
          <div className="flex w-full items-center gap-2">
            {/* <ImportWalletDialog>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleImportWallet}
              >
                <Download className="mr-2 h-4 w-4" />
                Import
              </Button>
            </ImportWalletDialog> */}
            {/* <ExportWalletDialog>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleExportWallet}
              >
                <Upload className="mr-2 h-4 w-4" />
                Export
              </Button>
            </ExportWalletDialog> */}
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

export default function UserTagCardWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserTagCard />
    </QueryClientProvider>
  )
}