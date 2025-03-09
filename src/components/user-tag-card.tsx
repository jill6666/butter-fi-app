"use client"

import { CopyIcon, Download, HandCoins, Upload, PlusIcon, Trash } from "lucide-react"
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
import { updateUserTag, setupUserTag, removeSubOrg, setupUserWithEmailLogin } from "@/actions/turnkey";
import { useTurnkey } from "@turnkey/sdk-react";
import { setupAdminAndTrader } from "@/lib/turnkey/setupTrader"

const queryClient = new QueryClient();

function UserTagCard() {
  const { client, walletClient } = useTurnkey()
  const { user } = useUser()

  const handleDeleteAccount = async () => {
    const organizationId = user?.organization?.organizationId || "";
    await client?.deleteSubOrganization({
      organizationId,
      deleteWithoutExport: true
    })
  }
  const handleSetupTrader = async () => {
    if (!user || !user.organization?.organizationId) return
    if (!client) throw new Error("Failed to get client")

    const publicKey = await walletClient?.getPublicKey()
    if (!publicKey) throw new Error("Failed to get public key")

    await setupAdminAndTrader({
      organizationId: user.organization.organizationId,
      userId: user.userId,
      publicKey,
      subOrgClient: client!
    })
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className=" font-medium">
          User
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-sm flex gap-2 w-full">
          <Button variant="ghost" size="default" className="cursor-pointer border" onClick={handleDeleteAccount}>
            Delete Account
          </Button>
          <Button variant="default" size="default" className="cursor-pointer border" onClick={handleSetupTrader}>
            Setup Trader
          </Button>
        </div>
      </CardContent>
      <CardFooter className="sm:hidden">
        <div className="mx-auto flex w-full flex-col items-center gap-2">
          <Button className="w-full">
            <HandCoins className="mr-2 h-4 w-4" />
            Add funds
          </Button>
          <div className="flex w-full items-center gap-2">
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