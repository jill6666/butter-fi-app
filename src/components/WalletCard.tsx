"use client"

import { useEffect, useState, useMemo } from "react"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import ExportWalletDialog from "./ExportWallet"
import { useBalance } from "@/hooks/useBalance"
import { useBalanceOf } from "@/hooks/useBalanceOf"
import { CONFIG } from "@/config/protocol";

import { Icons } from "./Icons"

const queryClient = new QueryClient();

// import ImportWalletDialog from "./import-wallet"
// import TransferDialog from "./transfer-dialog"

import { Skeleton } from "./ui/skeleton"

// default wallet
function WalletCard() {
  const { ethPrice } = useTokenPrice()
  const { state } = useWallets()
  const { selectedWallet, selectedAccount } = state
  const [usdAmount, setUsdAmount] = useState<number | undefined>(undefined)
  const { data: trader, isLoading } = useTradingSigner()

  const {
    balance: wmodBalance,
    isLoadingBalance: isLoadingBalanceWMOD,
  } = useBalanceOf(CONFIG.CONTRACT_ADDRESSES.WMOD, selectedAccount?.address)
  const {
    balance: sWMODBalance,
    isLoadingBalance: isLoadingBalancesWMOD,
  } = useBalanceOf(CONFIG.CONTRACT_ADDRESSES.sWMOD, selectedAccount?.address)
  const {
    data: nativeTokenBalance,
    isLoading: isLoadingBalanceNative,
  } = useBalance(selectedAccount?.address)

  const {
    balance: t_wmodBalance,
    isLoadingBalance: t_isLoadingBalanceWMOD,
  } = useBalanceOf(CONFIG.CONTRACT_ADDRESSES.WMOD, trader?.signerAddress)
  const {
    balance: t_sWMODBalance,
    isLoadingBalance: t_isLoadingBalancesWMOD,
  } = useBalanceOf(CONFIG.CONTRACT_ADDRESSES.sWMOD, trader?.signerAddress)
  const {
    data: t_nativeTokenBalance,
    isLoading: t_isLoadingBalanceNative,
  } = useBalance(trader?.signerAddress)

  const amount = useMemo(() => {
    return nativeTokenBalance
      ? parseFloat(
          Number(formatEther(nativeTokenBalance ?? BigInt(0))).toFixed(8)
        ).toString()
      : "0"
  }, [nativeTokenBalance])

  const t_amount = useMemo(() => {
    return t_nativeTokenBalance
      ? parseFloat(
          Number(formatEther(t_nativeTokenBalance ?? BigInt(0))).toFixed(8)
        ).toString()
      : "0"
  }, [t_nativeTokenBalance])

  const handleCopyAddress = (address: `0x${string}`) => {
    if (address) {
      navigator.clipboard.writeText(address)
      toast.success("Address copied to clipboard")
    }
  }

  const handleExportWallet = () => {}

  return (
    <Card className="w-full flex flex-col gap-4">
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
      <div className="mx-6 text-sm w-full flex gap-4 items-center font-medium">
        My Trading Wallet
        <div
          onClick={() => trader?.signerAddress && handleCopyAddress(trader?.signerAddress)}
          className="flex w-min cursor-pointer items-center gap-2"
        >
          {trader?.signerAddress ? truncateAddress(trader?.signerAddress) : "-"}
          <CopyIcon className="h-3 w-3" />
            </div>
        </div>
      <CardContent className="mt-4">
        <Table>
          <TableHeader>
            <TableRow className="">
              <TableHead>Asset</TableHead>
              <TableHead className="hidden sm:table-cell">Asset Address</TableHead>
              <TableHead>Default Wallet Amount</TableHead>
              <TableHead>Trader Wallet Amount</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <TableRow>
              <TableCell className="p-2 font-medium sm:p-4">
                <div className="flex items-center space-x-2 text-xs sm:text-sm">
                  <Icons.monad className="h-6 w-6" />
                  <span>MON</span>
                </div>
              </TableCell>
              <TableCell className="hidden font-mono text-xs sm:table-cell">
                -
              </TableCell>
              <TableCell className="hidden sm:table-cell">{amount}</TableCell>
              <TableCell className="hidden sm:table-cell">{t_amount}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 font-medium sm:p-4">
                <div className="flex items-center space-x-2 text-xs sm:text-sm">
                  <div className="h-6 w-6 bg-white/60 rounded-full" />
                  <span>WMOD</span>
                </div>
              </TableCell>
              <TableCell className="hidden font-mono text-xs sm:table-cell cursor-pointer" onClick={() => {
                handleCopyAddress(CONFIG.CONTRACT_ADDRESSES.WMOD)
              }}>
                {truncateAddress(CONFIG.CONTRACT_ADDRESSES.WMOD)}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {isLoadingBalanceWMOD ? "Loading..." : formatEther(wmodBalance || BigInt(0))}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {t_isLoadingBalanceWMOD ? "Loading..." : formatEther(t_wmodBalance || BigInt(0))}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 font-medium sm:p-4">
                <div className="flex items-center space-x-2 text-xs sm:text-sm">
                  <div className="h-6 w-6 bg-white/60 rounded-full" />
                  <span>sWMOD</span>
                </div>
              </TableCell>
              <TableCell className="hidden font-mono text-xs sm:table-cell cursor-pointer" onClick={() => {
                handleCopyAddress(CONFIG.CONTRACT_ADDRESSES.sWMOD)
              }}>
                {truncateAddress(CONFIG.CONTRACT_ADDRESSES.sWMOD)}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {isLoadingBalancesWMOD ? "Loading..." : formatEther(sWMODBalance || BigInt(0))}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {t_isLoadingBalancesWMOD ? "Loading..." : formatEther(t_sWMODBalance || BigInt(0))}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
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