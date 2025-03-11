import { WalletsProvider } from "@/providers/WalletProvider"

import { Toaster } from "@/components/ui/sonner"
import NavMenu from "@/components/NavMenu"
import { SessionExpiryWarning } from "@/components/SessionExpiryWarning"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className=" h-screen bg-muted/40 dark:bg-neutral-950/80">
      <WalletsProvider>
        <NavMenu />

        <div className="">{children}</div>
      </WalletsProvider>
      <SessionExpiryWarning />
      <Toaster />
    </main>
  )
}
