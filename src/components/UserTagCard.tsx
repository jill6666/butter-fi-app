"use client"

import { HandCoins, Loader } from "lucide-react"
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
import { useState, useEffect } from "react";
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
import { toast } from "sonner"
import { generateP256KeyPair } from "@turnkey/crypto"

const queryClient = new QueryClient();

const tagMap = new Map<string, string>()

function UserTagCard() {
  const { client } = useTurnkey()
  const { user } = useUser()
  const [subOrgUserList, setSubOrgUserList] = useState<OrgUsers>([])
  const { userTags, isLoadingUserTags } = useGetUserTags({
    organizationId: user?.organization?.organizationId || ""
  })
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSetupTrader = async () => {
    setIsProcessing(true)

    try {
      if (!user || !user.organization?.organizationId) return
      if (!client) throw new Error("Failed to get client")

      // The key pair is an ephemeral key, it is used just once and then can be thrown away
      const publicKey = generateP256KeyPair().publicKey
      console.log("generateP256KeyPair... ",  {...generateP256KeyPair()})

      await setupAdminAndTrader({
        organizationId: user.organization.organizationId,
        userId: user.userId,
        publicKey,
        subOrgClient: client!
      })
      toast.success("You're all set!")
    } catch (error) {
      console.error("set up error, ", error)
      toast.error("Failed to setup trader and policies")
    } finally {
      setIsProcessing(false)
    }
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
          <Button onClick={handleSetupTrader}>
          {isProcessing ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              <span className="ml-2">Loading...</span>
            </>
          ) : "Setup Trader and Policies"}
          </Button>
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