import { TransactionsProvider } from "@/providers/TransactionsProvider"

import Strategy from "@/components/Strategy"

export default function Dashboard() { 
  return (
    <main className="container mx-auto space-y-4 p-2 sm:p-8 lg:space-y-8 xl:px-12 2xl:px-24">
      <TransactionsProvider>
        <Strategy />
      </TransactionsProvider>
    </main>
  )
}
