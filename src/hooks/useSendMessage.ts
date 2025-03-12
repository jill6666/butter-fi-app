import { useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";

enum MessageType {
  EXECUTE_TRANSACTION = "EXECUTE_TRANSACTION",
  PURE_STRING_RESPONSE = "PURE_STRING_RESPONSE",
}
export enum Role {
  USER = "user",
  ASSISTANT = "assistant",
}

type TMessage = {
  role: Role.USER | Role.ASSISTANT
  content: string
  strategies?: {
    strategyID: number
    stakeToken: `0x${string}`
    label: string
    description: string
  }[],
  loading?: boolean
}

export const useSendMessage = () => {
  const [messages, setMessages] = useState<TMessage[]>([]);
  const {
    data,
    isPending,
    mutateAsync: onRequest,
    isError,
    ...res
  } = useMutation({
    mutationFn: (userInput: string) => {
      setMessages(prev => [...prev, {
        role: Role.USER,
        content: userInput
      }, {
        role: Role.ASSISTANT,
        content: "Loading...",
        loading: true,
        strategies: []
      }]);
      return getMessage({ userInput })
    },
    mutationKey: ["message"],
  });

  useEffect(() => {
    if (data) {
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        lastMessage.loading = false;
        lastMessage.content = data?.LLM_response;
        lastMessage.strategies = data?.strategies;
        return [...prev];
      });
    }
  }, [data]);

  return {
    ...res,
    data,
    isPending,
    isError,
    onRequest,
    messages,
  };
};

// Why use Turnkey?
const prompt1Response = {
  LLM_response: "Turnkey is private key management made simple. Create wallets, sign transactions, and automate onchain actions — all with one elegant API.",
  type: MessageType.PURE_STRING_RESPONSE,
  strategies: []
}
// What is Butter Finance and how it works?
const prompt2Response = {
  LLM_response: "Butter Finance is a DeFi platform that allows users to stake their assets and earn rewards. It provides a user-friendly interface for interacting with the protocol and managing their staking positions.",
  type: MessageType.PURE_STRING_RESPONSE,
  strategies: []
}
// default mock data
const defaultMockData = {
  LLM_response: "Thanks! You are the best. 💅",
  type: MessageType.PURE_STRING_RESPONSE,
  strategies: []
}

const executeTypeMockData = {
  LLM_response: `Here are some staking protocols with at least 5% APR for you to consider: 
1. Earn 6% APR by staking in ether.fi, a non-custodial staking service.
2. Earn 5% APR with Ethena, a stable LSD protocol for Ethereum collateral.
3. Earn 5% APR by staking with Lido, a leading liquid staking platform.  `,
  type: MessageType.EXECUTE_TRANSACTION,
  strategies: [
    {
      strategyID: 1,
      stakeToken: "0x026BA669dA22b19A0332a735CD924D5ec4D3a99E" as `0x${string}`,
      label: "ether.fi",
      description: "A non-custodial staking service."
    },
    {
      strategyID: 2,
      stakeToken: "0x026BA669dA22b19A0332a735CD924D5ec4D3a99E" as `0x${string}`,
      label: "Ethena",
      description: "A stable LSD protocol for Ethereum collateral."
    },
  ]
}

async function getMessage({
  userInput
}: { userInput: string }) {
  // const response = await axiosInstance.post("/our", { userInput });
  // return response.data as {
  //   LLM_response: string;
  //   type: MessageType; // EXECUTE_TRANSACTION | PURE_STRING_RESPONSE
  //   strategies: {
  //     strategyID: string; // Protocol id registered in aggregator contract.
  //     stakeToken: `0x${string}`; // The token contract address user wants to stake.
  //   }[];
  // }
  
  // mock response and loading
  await new Promise(resolve => setTimeout(resolve, 1500));

  // mock response
  return userInput.includes("strategies") ? executeTypeMockData : userInput.toLocaleLowerCase().includes("why") ? prompt1Response : userInput.toLocaleLowerCase().includes("what") ? prompt2Response : defaultMockData
}