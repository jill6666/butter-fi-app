"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/providers/auth-provider"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTurnkey } from "@turnkey/sdk-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { Email } from "@/types/turnkey"
import { useUser } from "@/hooks/use-user"
import { LoadingButton } from "@/components/ui/button.loader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import OrSeparator from "@/components/or-separator"
import { Icons } from "./icons"

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
})

function AuthContent() {
  const { user } = useUser()
  const { passkeyClient } = useTurnkey()
  const { initEmailLogin, state, loginWithPasskey, loginWithWallet } = useAuth()
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })

  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  useEffect(() => {
    const qsError = searchParams.get("error")
    if (qsError) {
      toast.error(qsError)
    }
  }, [searchParams])

  const handlePasskeyLogin = async (email: Email) => {
    setLoadingAction("passkey")
    if (!passkeyClient) {
      setLoadingAction(null)
      return
    }

    await loginWithPasskey(email)
    setLoadingAction(null)
  }

  const handleEmailLogin = async (email: Email) => {
    setLoadingAction("email")
    await initEmailLogin(email)
    setLoadingAction(null)
  }

  const handleWalletLogin = async () => {
    setLoadingAction("wallet")
    await loginWithWallet()
    setLoadingAction(null)
  }

  return (
    <>
      <Card className="mx-auto w-full max-w-[450px]">
        <CardHeader className="space-y-4">
          <Icons.turnkey className="h-16 w-full stroke-0 py-2 dark:stroke-white" />
          <CardTitle className="text-center text-xl font-medium">
            Log in or sign up
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(() => {})} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <LoadingButton
                type="submit"
                className="w-full font-semibold"
                disabled={!form.formState.isValid}
                loading={state.loading && loadingAction === "passkey"}
                onClick={() =>
                  handlePasskeyLogin(form.getValues().email as Email)
                }
              >
                Continue with passkey
              </LoadingButton>

              <LoadingButton
                type="button"
                variant="outline"
                className="w-full font-semibold"
                disabled={!form.formState.isValid}
                onClick={() =>
                  handleEmailLogin(form.getValues().email as Email)
                }
                loading={state.loading && loadingAction === "email"}
              >
                Continue with email
              </LoadingButton>
              <OrSeparator />
              <LoadingButton
                type="button"
                variant="outline"
                className="w-full font-semibold"
                onClick={() => handleWalletLogin()}
                loading={state.loading && loadingAction === "wallet"}
              >
                Continue with wallet
              </LoadingButton>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  )
}

export default function Auth() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthContent />
    </Suspense>
  )
}
