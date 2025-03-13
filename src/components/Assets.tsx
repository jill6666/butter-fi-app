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

import { Icons } from "./Icons"

const queryClient = new QueryClient();

function Assets() {
  const { state } = useWallets()
  const { ethPrice } = useTokenPrice()
  const { selectedAccount } = state
  const { data: trader } = useTradingSigner()

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
    return selectedAccount?.balance
      ? parseFloat(
          Number(formatEther(selectedAccount?.balance ?? BigInt(0))).toFixed(8)
        ).toString()
      : "0"
  }, [selectedAccount?.balance])

  // Memoize the value calculation
  const valueInUSD = useMemo(() => {
    return (
      Number(formatEther(selectedAccount?.balance ?? BigInt(0))) *
      (ethPrice || 0)
    ).toFixed(2)
  }, [selectedAccount?.balance, ethPrice])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-2xl">Assets</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="">
              <TableHead>Asset</TableHead>
              <TableHead className="hidden sm:table-cell">Address</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="hidden sm:table-cell">
                Value (USD)
              </TableHead>
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
                {selectedAccount?.address &&
                  truncateAddress(selectedAccount?.address)}
              </TableCell>
              <TableCell className="hidden sm:table-cell">{amount}</TableCell>
              <TableCell className="hidden sm:table-cell">
                ${valueInUSD}
              </TableCell>
              <TableCell className="p-2 sm:hidden">
                <div className="font-medium">
                  {amount}
                  <span className="ml-1 text-xs text-muted-foreground">
                    MON
                  </span>
                </div>
                <div className=" text-sm text-muted-foreground">
                  ${valueInUSD}
                </div>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 font-medium sm:p-4">
                <div className="flex items-center space-x-2 text-xs sm:text-sm">
                  <Icons.monad className="h-6 w-6" />
                  <span>MON</span>
                </div>
              </TableCell>
              <TableCell className="hidden font-mono text-xs sm:table-cell">
                {trader?.signerAddress &&
                  truncateAddress(trader?.signerAddress)}
              </TableCell>
              <TableCell className="hidden sm:table-cell">{formatEther(nativeTokenBalance || BigInt(0))}</TableCell>
              <TableCell className="hidden sm:table-cell">
                ${valueInUSD}
              </TableCell>
              <TableCell className="p-2 sm:hidden">
                <div className="font-medium">
                  {formatEther(nativeTokenBalance || BigInt(0))}
                  <span className="ml-1 text-xs text-muted-foreground">
                    MON
                  </span>
                </div>
                <div className=" text-sm text-muted-foreground">
                  ${valueInUSD}
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
              <TableCell className="hidden font-mono text-xs sm:table-cell">
                {trader?.signerAddress &&
                  truncateAddress(trader?.signerAddress)}
              </TableCell>
              <TableCell className="hidden sm:table-cell">{formatEther(wmodBalance || BigInt(0))}</TableCell>
              <TableCell className="hidden sm:table-cell">
                ${valueInUSD}
              </TableCell>
              <TableCell className="p-2 sm:hidden">
                <div className="font-medium">
                  {formatEther(wmodBalance || BigInt(0))}
                  <span className="ml-1 text-xs text-muted-foreground">
                    WMOD
                  </span>
                </div>
                <div className=" text-sm text-muted-foreground">
                  ${valueInUSD}
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
              <TableCell className="hidden font-mono text-xs sm:table-cell">
                {trader?.signerAddress &&
                  truncateAddress(trader?.signerAddress)}
              </TableCell>
              <TableCell className="hidden sm:table-cell">{formatEther(sWMODBalance || BigInt(0))}</TableCell>
              <TableCell className="hidden sm:table-cell">
                ${valueInUSD}
              </TableCell>
              <TableCell className="p-2 sm:hidden">
                <div className="font-medium">
                  {formatEther(sWMODBalance || BigInt(0))}
                  <span className="ml-1 text-xs text-muted-foreground">
                    sWMOD
                  </span>
                </div>
                <div className=" text-sm text-muted-foreground">
                  ${valueInUSD}
                </div>
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