import { TransactionsProvider } from "@/providers/TransactionsProvider"

import Assets from "@/components/Assets"
import WalletCard from "@/components/WalletCard"
import UserTagCard from "@/components/UserTagCard"

export default function Dashboard() {
  return (
    <main className="container mx-auto space-y-4 p-2 sm:p-8 lg:space-y-8 xl:px-12 2xl:px-24">
      <TransactionsProvider>
        <WalletCard />
        <div className="flex flex-col gap-4">
          <UserTagCard />
          <Assets />
        </div>
      </TransactionsProvider>
    </main>
  )
}
