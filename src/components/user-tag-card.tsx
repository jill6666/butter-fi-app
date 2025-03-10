"use client"

import { HandCoins } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { useTurnkey } from "@turnkey/sdk-react";
import { setupAdminAndTrader } from "@/lib/turnkey/setupTrader"
import { useState, useEffect, useMemo } from "react";
import { OrgUsers } from "@/types/turnkey";
import { useGetUserTags } from "@/hooks/use-get-user-tags";

const queryClient = new QueryClient();

const tagMap = new Map<string, string>()

function UserTagCard() {
  const { client, walletClient } = useTurnkey()
  const { user } = useUser()
  const [subOrgUserList, setSubOrgUserList] = useState<OrgUsers>([])
  const { userTags, isLoadingUserTags } = useGetUserTags({
    organizationId: user?.organization?.organizationId || ""
  })

  const handleSetupTrader = async () => {
    if (!user || !user.organization?.organizationId) return
    if (!client) throw new Error("Failed to get client")

    const publicKey = await walletClient?.getPublicKey()
    if (!publicKey) throw new Error("Failed to get public key")

    await setupAdminAndTrader({
      organizationId: user.organization.organizationId,
      userId: user.userId,
      publicKey,
      subOrgClient: client!
    })
  }
  const handleGetSubOrgUserList = async () => {
    if (!user || !user.organization?.organizationId) return
    if (!client) throw new Error("Failed to get client")
    const response = await client.getOrganization({
      organizationId: user.organization.organizationId
    })
    const subOrgUserList = response.organizationData.users
    if (!subOrgUserList) return
    const users = subOrgUserList.map((user) => ({
      ...user,
      userTags: user.userTags.map((tagId) => getUserTagName(tagId))
    }))
    setSubOrgUserList(users)
  }

  useEffect(() => {
    handleGetSubOrgUserList()
  }, [client, userTags, user?.organization?.organizationId])

  const getUserTagName = (tagId: string) => {
    if (isLoadingUserTags) return "Loading..."
    if (!tagMap.has(tagId)) {
      tagMap.set(tagId, userTags?.find((tag) => tag.tagId === tagId)?.tagName || "Unknown")
    }
    return tagMap.get(tagId) || "Unknown"
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className=" font-medium">
          User
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-sm flex gap-2 w-full">
          {subOrgUserList && subOrgUserList.length > 0 ? (
            <div className="w-full flex flex-col gap-2">
              {subOrgUserList.map((user) => (
                <div key={user.userId} className="w-full flex items-center gap-2 justify-between">
                  <span className="text-muted-foreground">{user.userName}</span>
                  <span className="text-muted-foreground">{user.userTags.join(", ")}</span>
                </div>
              ))}
            </div>
          ) : (
            <Button variant="default" size="default" className="cursor-pointer border" onClick={handleSetupTrader}>
              Setup Trader
            </Button>
          )}
        </div>
      </CardContent>
      <CardFooter className="sm:hidden">
        <div className="mx-auto flex w-full flex-col items-center gap-2">
          <Button className="w-full">
            <HandCoins className="mr-2 h-4 w-4" />
            Add funds
          </Button>
          <div className="flex w-full items-center gap-2">
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

export default function UserTagCardWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserTagCard />
    </QueryClientProvider>
  )
}