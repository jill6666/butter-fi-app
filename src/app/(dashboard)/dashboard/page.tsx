import { TransactionsProvider } from "@/providers/transactions-provider"

import Activity from "@/components/activity"
import Assets from "@/components/assets"
import WalletCard from "@/components/wallet-card"
import UserTagCard from "@/components/user-tag-card"
import BubbleComponent from "@/components/bubble"

export default function Dashboard() {
  return (
    <main className="container mx-auto space-y-4 p-2 sm:p-8 lg:space-y-8 xl:px-12 2xl:px-24">
      <TransactionsProvider>
        <BubbleComponent />
        I'm home
      </TransactionsProvider>
    </main>
  )
}
