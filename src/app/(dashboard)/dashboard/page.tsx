import { TransactionsProvider } from "@/providers/transactions-provider"

import BubbleComponent from "@/components/bubble"
import Strategy from "@/components/strategy"

export default function Dashboard() { 
  return (
    <main className="container mx-auto space-y-4 p-2 sm:p-8 lg:space-y-8 xl:px-12 2xl:px-24">
      <TransactionsProvider>
        <BubbleComponent />
        I'm home
        <Strategy />
      </TransactionsProvider>
    </main>
  )
}
