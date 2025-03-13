"use client"

import { useEffect, useState } from "react"
import { useWallets } from "@/providers/WalletProvider"
import { CopyIcon, Download, HandCoins, Upload } from "lucide-react"
import { toast } from "sonner"
import { formatEther } from "viem"

import { truncateAddress } from "@/lib/utils"
import { fundWallet } from "@/lib/web3"
import { useTokenPrice } from "@/hooks/useTokenPrice"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useTradingSigner } from "@/hooks/useTradingSigner"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import ExportWalletDialog from "./ExportWallet"

const queryClient = new QueryClient();

// import ImportWalletDialog from "./import-wallet"
// import TransferDialog from "./transfer-dialog"

import { Skeleton } from "./ui/skeleton"

function WalletCard() {
  const { ethPrice } = useTokenPrice()
  const { state } = useWallets()
  const { selectedWallet, selectedAccount } = state
  const { data, isLoading} = useTradingSigner()
  const [usdAmount, setUsdAmount] = useState<number | undefined>(undefined)

  const handleFundWallet = async () => {
    if (!selectedAccount?.address) return
    await fundWallet(selectedAccount?.address)
  }

  const handleCopyAddress = (address: `0x${string}`) => {
    if (address) {
      navigator.clipboard.writeText(address)
      toast.success("Address copied to clipboard")
    }
  }

  const handleExportWallet = () => {}

  const handleImportWallet = () => {}

  useEffect(() => {
    if (ethPrice && selectedAccount?.balance !== undefined) {
      const balanceInEther = formatEther(selectedAccount?.balance)
      setUsdAmount(Number(balanceInEther) * ethPrice)
    }
  }, [ethPrice, selectedAccount?.balance])

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
        <CardTitle className="w-full flex justify-between items-center">
          <div className="flex justify-between items-center gap-4">
            <span className="font-medium">
              {selectedWallet?.walletName || (
              <Skeleton className="h-4 w-20 bg-muted-foreground/50" />
            )}
            </span>
            {selectedAccount?.address ? (
              <div
                onClick={() => selectedAccount?.address && handleCopyAddress(selectedAccount?.address)}
                className="flex w-min cursor-pointer items-center gap-2 mr-2 text-sm"
              >
                {truncateAddress(selectedAccount?.address)}
                <CopyIcon className="h-3 w-3" />
              </div>
            ) : (
              <Skeleton className="h-3 w-32  rounded-sm bg-muted-foreground/50" />
            )}
          </div>
        </CardTitle>
        <ExportWalletDialog>
          <Button variant="outline" onClick={handleExportWallet}>
            <Upload className="mr-2 h-4 w-4" /> Export
          </Button>
        </ExportWalletDialog>
      </CardHeader>
      <CardContent className="mt-4">
        <div className="text-sm w-full flex gap-4 items-center font-medium">
          My Trading Wallet
          <div
            onClick={() => data?.signerAddress && handleCopyAddress(data?.signerAddress)}
            className="flex w-min cursor-pointer items-center gap-2"
          >
            {data?.signerAddress ? truncateAddress(data?.signerAddress) : "-"}
            <CopyIcon className="h-3 w-3" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function WalletCardWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletCard />
    </QueryClientProvider>
  )
}