"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/auth-provider"
import { useWallets } from "@/providers/wallet-provider"
import {
  ChevronDownIcon,
  ChevronUpIcon,
  LogOutIcon,
  SettingsIcon,
  BoxIcon,
} from "lucide-react"
import Jazzicon, { jsNumberForAddress } from "react-jazzicon"

import { truncateAddress } from "@/lib/utils"
import { useUser } from "@/hooks/use-user"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Skeleton } from "./ui/skeleton"

function AccountAvatar({ address }: { address: string | undefined }) {
  return (
    <Avatar className="h-1/2 w-auto">
      {address ? (
        <Jazzicon
          svgStyles={{
            filter: "blur(4px)",
          }}
          diameter={32}
          seed={jsNumberForAddress(
            address ?? "0x1111111111111111111111111111111111111111"
          )}
        />
      ) : (
        <AvatarFallback className="bg-transparent text-base font-semibold">-</AvatarFallback>
      )}
    </Avatar>
  )
}

export default function Account() {
  const router = useRouter()
  const { logout } = useAuth()
  const { user } = useUser()
  const { state } = useWallets()
  const { selectedWallet, selectedAccount } = state

  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = () => {
    logout()
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger className="dark" asChild>
        <Button
          className="h-full w-min justify-between gap-3 bg-none text-white bg-[#202020]"
        >
          <div className="flex items-center gap-3">
            <AccountAvatar address={selectedAccount?.address} />
            {selectedWallet?.walletName && selectedAccount?.address ? (
              <div className="text-left">
                <div className="text-sm font-semibold text-white ">
                  {selectedWallet?.walletName}
                </div>
                <div className="text-xs font-semibold text-white">
                  {selectedAccount?.address
                    ? truncateAddress(selectedAccount?.address)
                    : ""}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <Skeleton className="h-3 w-12 rounded-[3px]" />
                <Skeleton className="h-3 w-[120px] rounded-[3px]" />
              </div>
            )}
          </div>
          {isOpen ? (
            <ChevronUpIcon className="hidden h-4 w-4 text-white sm:block" />
          ) : (
            <ChevronDownIcon className="hidden h-4 w-4 text-white sm:block" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 bg-[#202020] text-foreground border-none py-4"
      >
        <DropdownMenuLabel className="dark flex w-full items-center gap-2">
          <AccountAvatar address={selectedAccount?.address} />
          <div className="flex flex-col">
            <span className=" font-semibold">{user?.username}</span>
            <span className="text-xs text-white">
              {user?.email || ""}
            </span>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => router.push("/account")}>
          <BoxIcon className="mr-2 h-4 w-4" />
          <span>Account</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <SettingsIcon className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleLogout}>
          <LogOutIcon className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
