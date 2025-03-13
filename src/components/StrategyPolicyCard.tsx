"use client"

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
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import createStrategyPolicies from "@/lib/turnkey/createStrategyPolicies"
import { toast } from "sonner";
import { Loader } from "lucide-react"

const queryClient = new QueryClient();

function StrategyPolicyCard() {
  const { user } = useUser()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleCreateStrategyPolicies = async () => {
    setIsProcessing(true)
    try {
      // await createStrategyPolicies()
      toast.success("Created!")
    } catch (error) {
      console.error("createStrategyPolicies error", error)
      toast.error("Oops! Something went wrong, please try again later.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className=" font-medium">
          Strategy Policies
          <Button onClick={handleCreateStrategyPolicies}>
            {isProcessing ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              "Create Strategy Policies"
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Policy Name</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default function StrategyPolicyCardWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <StrategyPolicyCard />
    </QueryClientProvider>
  )
}