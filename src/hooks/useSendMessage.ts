import { useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import getMessage from "@/actions/getMessage"

export enum Role {
  USER = "user",
  ASSISTANT = "assistant",
}

type TMessage = {
  role: Role.USER | Role.ASSISTANT
  content: string
  type: string
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
    mutationFn: ({
      userInput,
      userAddress,
    }: {
      userInput: string;
      userAddress: `0x${string}`;
    }) => {
      setMessages(prev => [...prev, {
        role: Role.USER,
        content: userInput
      }, {
        role: Role.ASSISTANT,
        content: "Loading...",
        loading: true,
        strategies: []
      }]);
      return getMessage({ userInput, userAddress })
    },
    mutationKey: ["message"],
  });

  const addSystemMessage = (content: string) => {
    setMessages(prev => [...prev, {
      role: Role.ASSISTANT,
      content,
      type: "PURE_STRING_RESPONSE"
    }]);
  };

  useEffect(() => {
    if (data) {
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        lastMessage.loading = false;
        lastMessage.content = data?.LLM_response;
        lastMessage.type = data?.type;
        lastMessage.strategies = data?.strategies;
        return [...prev];
      });
    }
  }, [data]);

  useEffect(() => {
    if (isError) {
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        lastMessage.loading = false;
        lastMessage.content = "(Oops! Something went wrong, please try again.)";
        return [...prev];
      });
    }
  }, [isError])

  return {
    ...res,
    data,
    isPending,
    isError,
    onRequest,
    messages,
    addSystemMessage
  };
};
