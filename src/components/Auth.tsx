"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/providers/AuthProvider"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTurnkey } from "@turnkey/sdk-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Loader } from "lucide-react"
import * as z from "zod"

import { Email } from "@/types/turnkey"
import { useUser } from "@/hooks/useUser"
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
import OrSeparator from "@/components/OrSeparator"
import { Icons } from "./Icons"

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
})

function AuthContent() {
  const { user } = useUser()
  const { passkeyClient, client } = useTurnkey()
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
      <Card className="m-auto w-full max-w-[450px] bg-[#2B2431] border-none">
        <CardHeader className="space-y-4">
          <p className="text-center text-2xl font-bold">Butter-Fi</p>
          <CardTitle className="text-center text-xl font-medium">
            Log in or sign up
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 flex flex-col">
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
              {/* TODO: passkey login */}
              {/* <LoadingButton
                type="submit"
                variant="outline"
                className="w-full font-semibold"
                disabled={!form.formState.isValid}
                loading={state.loading && loadingAction === "passkey"}
                onClick={() =>
                  handlePasskeyLogin(form.getValues().email as Email)
                }
              >
                Continue with passkey
              </LoadingButton> */}

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
              {/* TODO: wallet login */}
              {/* <OrSeparator />
              <LoadingButton
                type="button"
                variant="outline"
                className="w-full font-semibold"
                onClick={() => handleWalletLogin()}
                loading={state.loading && loadingAction === "wallet"}
              >
                Continue with wallet
              </LoadingButton> */}
            </form>
          </Form>
          <div className="text-center flex gap-1 text-sm text-white/40 items-center mx-auto mt-4">
            Powered by{" "}
            <Icons.turnkeyBlack className="py-2 text-white/40 w-18" />
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export default function Auth() {
  return (
    <Suspense fallback={
      <div className="flex w-full h-full">
        <Loader className="h-4 w-4 animate-spin m-auto" />
      </div>
    }>
      <AuthContent />
    </Suspense>
  )
}
