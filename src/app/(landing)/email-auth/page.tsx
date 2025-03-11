"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/providers/AuthProvider"
import { useTurnkey } from "@turnkey/sdk-react"
import { Loader } from "lucide-react"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Icons } from "@/components/Icons"

function EmailAuthContent() {
  const searchParams = useSearchParams()
  const { completeEmailAuth } = useAuth()
  const { authIframeClient } = useTurnkey()
  const userEmail = searchParams.get("userEmail")
  const continueWith = searchParams.get("continueWith")
  const credentialBundle = searchParams.get("credentialBundle")

  useEffect(() => {
    // Ensure that the authIframeClient is available before attempting to complete the email auth
    if (authIframeClient && userEmail && continueWith && credentialBundle) {
      completeEmailAuth({ userEmail, continueWith, credentialBundle })
    }
  }, [authIframeClient])

  return (
    <main className="flex w-full flex-col items-center justify-center">
      <Card className="mx-auto h-full w-full sm:w-1/2">
        <CardHeader className="space-y-4">
          <p className="text-center text-2xl font-bold">Butter-Fi</p>
          <CardTitle className="flex  items-center justify-center text-center">
            {credentialBundle ? (
              <div className="flex items-center gap-2">
                <Loader className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-base">Authenticating...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-lg font-medium">
                Confirm your email
              </div>
            )}
          </CardTitle>
          {!credentialBundle && (
            <CardDescription className="text-center">
              Click the link sent to{" "}
              <span className="font-bold">{userEmail}</span> to sign in.
            </CardDescription>
          )}
          <div className="text-center flex gap-1 text-sm text-white/40 items-center mx-auto mt-4">
            Powered by{" "}
            <Icons.turnkeyBlack className="py-2 text-white/40 w-18" />
          </div>
        </CardHeader>
      </Card>
    </main>
  )
}

export default function EmailAuth() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmailAuthContent />
    </Suspense>
  )
}
