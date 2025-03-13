"use server";

import axios from "axios";

const endpoint = process.env.NEXT_PUBLIC_API_URL;

enum MessageType {
  EXECUTE_TRANSACTION = "EXECUTE_TRANSACTION",
  PURE_STRING_RESPONSE = "PURE_STRING_RESPONSE",
  WITHDRAW_POSITION = "WITHDRAW_POSITION",
}

export const axiosInstance = axios.create({
  baseURL: endpoint,
});

export async function getMessage({
  userInput,
  userAddress
}: {
  userInput: string,
  userAddress: `0x${string}`
}) {
  const response = await axiosInstance.post("/userQuery", { userInput, userAddress });
  return response.data as {
    LLM_response: string;
    type: MessageType; // EXECUTE_TRANSACTION | PURE_STRING_RESPONSE
    strategies: {
    strategyID: number; // Protocol id registered in aggregator contract.
    stakeToken: `0x${string}`; // The token contract address user wants to stake.
    label: string;
    description: string;
    }[];
  }
}

export default getMessage
