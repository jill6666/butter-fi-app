"use client"

import { useEffect, useState } from "react"
import { useWallets } from "@/providers/wallet-provider"
import { CopyIcon, Download, HandCoins, Upload } from "lucide-react"
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

// import ExportWalletDialog from "./export-wallet"
// import ImportWalletDialog from "./import-wallet"
// import TransferDialog from "./transfer-dialog"
import { Skeleton } from "./ui/skeleton"

export default function WalletCard() {
  const { ethPrice } = useTokenPrice()
  const { state } = useWallets()
  const { selectedWallet, selectedAccount } = state
  const [usdAmount, setUsdAmount] = useState<number | undefined>(undefined)

  const handleFundWallet = async () => {
    if (!selectedAccount?.address) return
    await fundWallet(selectedAccount?.address)
  }

  const handleCopyAddress = () => {
    if (selectedAccount?.address) {
      navigator.clipboard.writeText(selectedAccount.address)
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
        <CardTitle className="w-full flex justify-between items-center font-medium">
          {selectedWallet?.walletName || (
            <Skeleton className="h-4 w-20 bg-muted-foreground/50" />
          )}
        <div className="text-sm">
          {selectedAccount?.address ? (
            <div
              onClick={handleCopyAddress}
              className="flex w-min cursor-pointer items-center gap-2"
            >
              {truncateAddress(selectedAccount?.address)}
              <CopyIcon className="h-3 w-3" />
            </div>
          ) : (
            <Skeleton className="h-3 w-32  rounded-sm bg-muted-foreground/50" />
          )}
        </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="">
      </CardContent>
    </Card>
  )
}
