"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Mail } from "lucide-react"

import { useUser } from "@/hooks/useUser"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Passkeys } from "@/components/Passkeys"
import { useTurnkey } from "@turnkey/sdk-react"
import { toast } from "sonner"

export default function Settings() {
  const router = useRouter()
  const { user } = useUser()
  const { client } = useTurnkey()

  const handleDeleteAccount = async () => {
    try {
      if (!user?.organization?.organizationId) return
      const organizationId = user?.organization?.organizationId || "";
      await client?.deleteSubOrganization({
        organizationId,
        deleteWithoutExport: true
      })
      toast("Account deleted successfully")
    } catch (error) {
      console.error("Error deleting sub organization", error)
      toast("Failed to delete account")
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
            onClick={() => router.back()}
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
                  {user?.email || "-"}
                </span>
              </Card>
            </div>
            <Passkeys />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold sm:text-2xl">
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="w-full flex items-center justify-between">
              <h3 className="font-semibold sm:text-lg">Delete Account</h3>
              <Button className="text-xs sm:text-sm" variant="outline" size="sm" onClick={handleDeleteAccount}>
                <span className="hidden sm:block">Delete Account without Export</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
