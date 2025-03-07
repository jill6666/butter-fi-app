"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useWallets } from "@/providers/wallet-provider"
import { ArrowLeft, Mail, Trash } from "lucide-react"
import { useLocalStorage } from "usehooks-ts"

import { PreferredWallet, Wallet } from "@/types/turnkey"
import { PREFERRED_WALLET_KEY } from "@/lib/constants"
import { useUser } from "@/hooks/use-user"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Passkeys } from "@/components/passkeys"
import { useTurnkey } from "@turnkey/sdk-react"

export default function Settings() {
  const router = useRouter()
  const { user } = useUser()
  const { turnkey, client } = useTurnkey()
  const [preferredWalletSetting, setPreferredWalletSetting] =
    useLocalStorage<PreferredWallet>(PREFERRED_WALLET_KEY, {
      userId: "",
      walletId: "",
    })
  const { state } = useWallets()
  const [preferredWallet, setPreferredWallet] = useState<Wallet | undefined>()
  useEffect(() => {
    if (state.wallets.length > 0) {
      const wallet = state.wallets.find(
        (wallet) => wallet.walletId === preferredWalletSetting.walletId
      )
      if (wallet) {
        setPreferredWallet(wallet)
      }
    }
  }, [state.wallets, preferredWalletSetting])

  const handleDeleteAccount = async () => {
    try {
      const currentSession = await turnkey?.currentUserSession()
      console.log({client, currentSession})
      const response = await currentSession?.deleteSubOrganization({
        deleteWithoutExport: true,
        organizationId: (await currentSession.getOrganization()).organizationData.organizationId,
      })
      console.log("response", response)
    } catch (error) {
      console.error("Error deleting sub organization", error)
    }
  }

  return (
    <main className="flex items-center justify-center px-8 py-4 lg:px-36 lg:py-12">
      <div className="mx-auto w-full max-w-6xl space-y-2">
        <div className="flex items-center gap-2">
          <Button
            className="-mb-0.5 w-min sm:w-auto"
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft strokeWidth={2.5} className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold sm:text-3xl">Settings</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold sm:text-2xl">
              Login methods
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-2 font-semibold sm:text-lg">Email</h3>
              <Card className="flex items-center gap-2 rounded-md bg-card p-3 sm:justify-between sm:gap-0">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
                  <span className="hidden sm:block">Email</span>
                </div>
                <span className=" text-xs text-muted-foreground sm:text-base">
                  {user?.email}
                </span>
              </Card>
            </div>
            <Passkeys />
            <div>
              <h3 className="mb-2 font-semibold sm:text-lg">Delete Account</h3>
              <Card className="flex items-center gap-2 rounded-md bg-card p-3 sm:justify-between sm:gap-0">
                <button onClick={handleDeleteAccount} className="flex items-center space-x-3">
                  <Trash className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
                  <span className="hidden sm:block">Delete Account</span>
                </button>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
