"use client"

import { useMemo } from "react"
import { useWallets } from "@/providers/WalletProvider"
import { formatEther } from "viem"

import { truncateAddress } from "@/lib/utils"
import { useTokenPrice } from "@/hooks/useTokenPrice"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useBalance } from "@/hooks/useBalance"
import { useTradingSigner } from "@/hooks/useTradingSigner"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useBalanceOf } from "@/hooks/useBalanceOf"
import { CONFIG } from "@/config/protocol";
import { toast } from "sonner"
import { CopyIcon, Download, HandCoins, Upload } from "lucide-react"

import { Skeleton } from "./ui/skeleton"
import { Icons } from "./Icons"

const queryClient = new QueryClient();

function Assets() {
  const { data: trader, isLoading } = useTradingSigner()

  const {
    balance: wmodBalance,
    isLoadingBalance: isLoadingBalanceWMOD,
  } = useBalanceOf(CONFIG.CONTRACT_ADDRESSES.WMOD, trader?.signerAddress)
  const {
    balance: sWMODBalance,
    isLoadingBalance: isLoadingBalancesWMOD,
  } = useBalanceOf(CONFIG.CONTRACT_ADDRESSES.sWMOD, trader?.signerAddress)
  const {
    data: nativeTokenBalance,
    isLoading: isLoadingBalanceNative,
  } = useBalance(trader?.signerAddress)

  // Memoize the balance calculation
  const amount = useMemo(() => {
    return nativeTokenBalance
      ? parseFloat(
          Number(formatEther(nativeTokenBalance ?? BigInt(0))).toFixed(8)
        ).toString()
      : "0"
  }, [nativeTokenBalance])

  const handleCopyAddress = (address: `0x${string}`) => {
    if (address) {
      navigator.clipboard.writeText(address)
      toast.success("Address copied to clipboard")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="w-full flex justify-between items-center">
          <div className="flex justify-between items-center gap-4">
            <span className="font-medium">
              Trader Wallet
            </span>
            {isLoading ? "Loading..." : trader?.signerAddress ? (
              <div
                onClick={() => trader?.signerAddress && handleCopyAddress(trader?.signerAddress)}
                className="flex w-min cursor-pointer items-center gap-2 mr-2 text-sm"
              >
                {truncateAddress(trader?.signerAddress)}
                <CopyIcon className="h-3 w-3" />
              </div>
            ) : (
              <Skeleton className="h-3 w-32  rounded-sm bg-muted-foreground/50" />
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="">
              <TableHead>Asset</TableHead>
              <TableHead className="hidden sm:table-cell">Asset Address</TableHead>
              <TableHead>Amount</TableHead>
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
              <TableCell className="hidden sm:table-cell">
                {isLoadingBalanceNative ? "Loading..." : amount}
              </TableCell>
              <TableCell className="p-2 sm:hidden">
                <div className="font-medium">
                  {isLoadingBalanceNative ? "Loading..." : amount}
                  <span className="ml-1 text-xs text-muted-foreground">
                    MON
                  </span>
                </div>
              </TableCell>
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
              <TableCell className="hidden sm:table-cell">{formatEther(wmodBalance || BigInt(0))}</TableCell>

              <TableCell className="p-2 sm:hidden">
                <div className="font-medium">
                  {isLoadingBalanceWMOD ? "Loading..." : formatEther(wmodBalance || BigInt(0))}
                  <span className="ml-1 text-xs text-muted-foreground">
                    WMOD
                  </span>
                </div>
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
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default function AssetWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <Assets />
    </QueryClientProvider>
  )
}