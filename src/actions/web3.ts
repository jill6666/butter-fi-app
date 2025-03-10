"use server"

import { Alchemy, AssetTransfersCategory, Network } from "alchemy-sdk"
import { Address, getAddress, parseEther, parseAbiItem } from "viem"
import { getBalance as wagmiGetBalance, getPublicClient, getBlock } from '@wagmi/core'
import { wagmiConfig } from "@/actions/wagmi"
import { getLogs } from 'viem/actions'

import type { Transaction } from "@/types/web3"

const settings = {
  apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "",
  network: Network.ETH_SEPOLIA,
  // https://github.com/alchemyplatform/alchemy-sdk-js/issues/400
  connectionInfoOverrides: {
    skipFetchSetup: true,
  },
}

const alchemy = new Alchemy(settings)

export const getBalance = async (address: Address) => {
  const response = await wagmiGetBalance(wagmiConfig, { address })
  const balanceBigInt = response.value
  return balanceBigInt
}
export const getTransactions = async (address: `0x${string}`) => {
  const publicClient = getPublicClient(wagmiConfig)
  const normalizedAddress = address.toLowerCase()

  // 取得最近的區塊號
  // const latestBlock = await publicClient.getBlockNumber()
  const latestBlock = BigInt(6980450)

  // 取得 logs（查詢最近 10000 個區塊）
  const receiveLogs = await getLogs(publicClient, {
    fromBlock: latestBlock - BigInt(100),
    toBlock: latestBlock,
    event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256)'),
    args: {
      to: address
    },
  })
  console.log("receiveLogs", receiveLogs)

  const sentLogs = await getLogs(publicClient, {
    fromBlock: latestBlock - BigInt(100),
    toBlock: latestBlock,
    event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256)'),
    args: {
      from: address
    },
  })

  const transactions = await Promise.all(
    [...receiveLogs, ...sentLogs].map(async (log) => {
      const block = await publicClient.getBlock({ blockNumber: log.blockNumber })
      return {
        blockNumber: Number(log.blockNumber),
        from: getAddress(log.topics[1] as `0x${string}`),
        to: log.topics[2] ? getAddress(log.topics[2] as `0x${string}`) : null,
        hash: log.transactionHash,
        value: log.data ? parseEther(log.data.toString()) : null,
        timestamp: block.timestamp.toString(),
        status: normalizedAddress === log.topics[1] ? "sent" : "received",
      }
    })
  )

  // 排序
  transactions.sort((a, b) => b.blockNumber - a.blockNumber)

  return {
    sentTransactions: transactions.filter((tx) => tx.status === "sent"),
    receivedTransactions: transactions.filter((tx) => tx.status === "received"),
  }
}
export const getTransactionsAlchemy = async (
  address: Address
): Promise<Record<string, Transaction[]>> => {
  // Fetch sent and received transactions concurrently
  const [sentResponse, receivedResponse] = await Promise.all([
    alchemy.core.getAssetTransfers({
      fromAddress: address,
      excludeZeroValue: false,
      category: [
        AssetTransfersCategory.ERC20,
        AssetTransfersCategory.EXTERNAL,
        AssetTransfersCategory.INTERNAL,
      ],
      withMetadata: true,
    }),
    alchemy.core.getAssetTransfers({
      toAddress: address,
      excludeZeroValue: false,
      category: [
        AssetTransfersCategory.ERC20,
        AssetTransfersCategory.EXTERNAL,
        AssetTransfersCategory.INTERNAL,
      ],
      withMetadata: true,
    }),
  ])

  // Map the responses
  const sentTransactions = [
    ...sentResponse.transfers.map(
      ({ blockNum, from, to, hash, value, metadata }) => ({
        blockNumber: Number(blockNum),
        from: getAddress(from),
        to: to ? getAddress(to) : null,
        hash,
        value: value ? parseEther(value.toString()) : null,
        status: "sent" as const,
        timestamp: metadata.blockTimestamp,
      })
    ),
  ]
  const receivedTransactions = [
    ...receivedResponse.transfers.map(
      ({ blockNum, from, to, hash, value, metadata }) => ({
        blockNumber: Number(blockNum),
        from: getAddress(from),
        to: to ? getAddress(to) : null,
        hash,
        value: value ? parseEther(value.toString()) : null,
        status: "received" as const,
        timestamp: metadata.blockTimestamp,
      })
    ),
  ]

  // Sort transactions by block number in descending order
  sentTransactions.sort((a, b) => b.blockNumber - a.blockNumber)
  receivedTransactions.sort((a, b) => b.blockNumber - a.blockNumber)

  return {
    sentTransactions,
    receivedTransactions,
  }
}

type TokenPriceResponse<T extends string> = {
  [key in T]: {
    usd: number
  }
}

export const getTokenPrice = async <T extends string>(
  token: T
): Promise<number> => {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${token}&vs_currencies=usd`
  const response = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-cg-demo-api-key": process.env.COINGECKO_API_KEY || "",
    },
  })
  const data: TokenPriceResponse<T> = await response.json()

  return data?.[token]?.usd
}
