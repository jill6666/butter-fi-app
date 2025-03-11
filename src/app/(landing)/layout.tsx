import { Toaster } from "sonner"

interface LandingLayoutProps {
  children: React.ReactNode
}

export default function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <main className="grid h-screen lg:grid-cols-[2fr,3fr]">
      <div className="flex items-center justify-center px-6">
        {children}
        <Toaster />
      </div>
    </main>
  )
}
