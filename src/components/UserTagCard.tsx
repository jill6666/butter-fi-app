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
import { useUser } from "@/hooks/useUser";
import { useTurnkey } from "@turnkey/sdk-react";
import { setupAdminAndTrader } from "@/lib/turnkey/setupTrader"
import { useState, useEffect, useMemo } from "react";
import { OrgUsers } from "@/types/turnkey";
import { useGetUserTags } from "@/hooks/useGetUserTags";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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
          Users
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Tags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subOrgUserList && subOrgUserList.length > 0 ? (
              subOrgUserList.map((user) => (
                <TableRow key={user.userId}>
                  <TableCell className="p-2 font-medium sm:p-4">{user.userName}</TableCell>
                  <TableCell className="p-2 text-xs sm:p-4">{user.userTags.join(", ")}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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