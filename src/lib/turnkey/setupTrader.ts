"use client"

import createUserTag from "./createUserTag"
import createPolicy from "./createPolicy"
import createPrivateKeyTag from "./createPrivateKeyTag"
import getPrivateKeysForTag from "./getPrivateKeysForTag"
import createPrivateKey from "./createPrivateKey"
import {
  WETH_TOKEN_GOERLI,
  USDC_TOKEN_GOERLI,
  APPROVE_SELECTOR,
  DEPOSIT_SELECTOR,
  TRANSFER_SELECTOR,
  SWAP_ROUTER_ADDRESS,
  TRADE_SELECTOR,
  WITHDRAW_SELECTOR,
} from "@/uniswap/constants"
import { TurnkeyBrowserClient } from "@turnkey/sdk-browser"

export const setupAdminAndTrader = async ({
  organizationId,
  userId,
  publicKey,
  subOrgClient,
}: {
  organizationId: string,
  userId: string,
  publicKey: string,
  subOrgClient: TurnkeyBrowserClient
}) => {
    // setup user tags
    const { adminTagId, traderTagId } = await setupUserTags(subOrgClient)

    // setup root user
    await setRootUser(
      subOrgClient,
      organizationId,
      userId,
      [adminTagId],
    )
    // create trader user and setup
    await setupTraderUser(
      subOrgClient,
      organizationId,
      [traderTagId],
      publicKey,
    )
    // setup private key tags
    const { tradingTagId } = await setupPrivateKeys(subOrgClient)

    // create policies
    const policies = await createPolicies(
      subOrgClient,
      adminTagId,
      traderTagId,
      tradingTagId,
      organizationId,
    )
    if (!policies) {
      throw new Error("Failed to create policies")
    }

    // final check
    const { user } = await subOrgClient.getUser({
      organizationId,
      userId,
    })
    if (!user) {
      throw new Error("Failed to get user")
    }

    return { user, policies }
}
async function setupUserTags(
  subOrgClient: TurnkeyBrowserClient,
) {
  if (!subOrgClient) throw new Error("Failed to get subOrgClient")
  // setup user tags
  const adminTagId = await createUserTag(
    subOrgClient,
    "Admin",
    [],
  );
  const traderTagId = await createUserTag(
    subOrgClient,
    "Trader",
    [],
  );
  if (!adminTagId || !traderTagId) {
    throw new Error("Failed to create user tags")
  }
  return { adminTagId, traderTagId }
}
async function setRootUser(
  subOrgClient: TurnkeyBrowserClient,
  organizationId: string,
  userId: string,
  userTagIds: string[],
) {
  // setup root user tag
  const updateUserRes = await subOrgClient.updateUser({
    organizationId,
    userId,
    userTagIds,
  })
  if (!updateUserRes?.userId) {
    throw new Error("Failed to update user tags")
  }
  return updateUserRes.userId
}
async function setupTraderUser(
  subOrgClient: TurnkeyBrowserClient,
  organizationId: string,
  userTags: string[],
  publicKey: string
) {
  // create trader user and setup
  const createTraderRes = await subOrgClient.createApiOnlyUsers({
    organizationId,
    apiOnlyUsers: [
      {
        userName: "AI Trader",
        userTags,
        apiKeys: [{
          apiKeyName: "trading",
          publicKey,
        }]
      }
    ]
  })
  if (!createTraderRes.userIds?.length) {
    throw new Error("Failed to create trader user")
  }
  return createTraderRes?.userIds?.[0]
}
async function setupPrivateKeys(
  subOrgClient: TurnkeyBrowserClient,
) {
  // setup private key tags
  const tradingTagId = await createPrivateKeyTag(
    subOrgClient,
    "trading",
    [],
  );
  const personalTagId = await createPrivateKeyTag(
    subOrgClient,
    "personal",
    [],
  );
  const longTermStorageTagId = await createPrivateKeyTag(
    subOrgClient,
    "long_term_storage",
    [],
  );
  // setup private keys
  const tradingPrivateKey = await createPrivateKey(subOrgClient, "Trading Wallet", [
    tradingTagId,
  ]);
  const personalPrivateKey = await createPrivateKey(subOrgClient, "Personal Wallet", [
    personalTagId,
  ]);
  const longTermStoragePrivateKey = await createPrivateKey(subOrgClient, "Long Term Storage", [
    longTermStorageTagId,
  ]);
  return {
    tradingTagId,
    personalTagId,
    longTermStorageTagId,
    tradingPrivateKey,
    personalPrivateKey,
    longTermStoragePrivateKey
  }
}
async function createPolicies(
  subOrgClient: TurnkeyBrowserClient,
  adminTagId: string,
  traderTagId: string,
  tradingTagId: string,
  organizationId: string,
) {
  // setup policies: grant specific users permissions to use specific private keys
  // ADMIN
  const adminPolicyId = await createPolicy(
    subOrgClient,
    "Admin users can do everything",
    "EFFECT_ALLOW",
    `approvers.any(user, user.tags.contains('${adminTagId}'))`,
    "true",
  );

  const paddedRouterAddress = SWAP_ROUTER_ADDRESS.toLowerCase()
    .substring(2)
    .padStart(64, "0");
  
  
  // TRADING
  const depositPolicyId = await createPolicy(
    subOrgClient,
    "Traders can use trading keys to deposit, aka wrap, ETH",
    "EFFECT_ALLOW",
    `approvers.any(user, user.tags.contains('${traderTagId}'))`,
    `private_key.tags.contains('${tradingTagId}') && eth.tx.to == '${WETH_TOKEN_GOERLI.address}' && eth.tx.data[0..10] == '${DEPOSIT_SELECTOR}'`,
  );
  const withdrawPolicyId = await createPolicy(
    subOrgClient,
    "Traders can use trading keys to withdraw, aka unwrap, WETH",
    "EFFECT_ALLOW",
    `approvers.any(user, user.tags.contains('${traderTagId}'))`,
    `private_key.tags.contains('${tradingTagId}') && eth.tx.to == '${WETH_TOKEN_GOERLI.address}' && eth.tx.data[0..10] == '${WITHDRAW_SELECTOR}'`,
  );
  const approveWethPolicyId = await createPolicy(
    subOrgClient,
    "Traders can use trading keys to make ERC20 token approvals for WETH for usage with Uniswap",
    "EFFECT_ALLOW",
    `approvers.any(user, user.tags.contains('${traderTagId}'))`,
    `private_key.tags.contains('${tradingTagId}') && eth.tx.to == '${WETH_TOKEN_GOERLI.address}' && eth.tx.data[0..10] == '${APPROVE_SELECTOR}' && eth.tx.data[10..74] == '${paddedRouterAddress}'`,
  );
  const approveUsdcPolicyId = await createPolicy(
    subOrgClient,
    "Traders can use trading keys to make ERC20 token approvals for USDC for usage with Uniswap",
    "EFFECT_ALLOW",
    `approvers.any(user, user.tags.contains('${traderTagId}'))`,
    `private_key.tags.contains('${tradingTagId}') && eth.tx.to == '${USDC_TOKEN_GOERLI.address}' && eth.tx.data[0..10] == '${APPROVE_SELECTOR}' && eth.tx.data[10..74] == '${paddedRouterAddress}'`,
  );
  const tradePolicyId = await createPolicy(
    subOrgClient,
    "Traders can use trading keys to make trades using Uniswap",
    "EFFECT_ALLOW",
    `approvers.any(user, user.tags.contains('${traderTagId}'))`,
    `private_key.tags.contains('${tradingTagId}') && eth.tx.to == '${SWAP_ROUTER_ADDRESS}' && eth.tx.data[0..10] == '${TRADE_SELECTOR}'`, // in theory, you can get more granular here with specific trade parameters
  );

  // SENDING
  // first, get long term storage address(es)
  const longTermStoragePrivateKey = (
    await getPrivateKeysForTag(subOrgClient, "long_term_storage", organizationId)
  )[0];
  const longTermStorageAddress = longTermStoragePrivateKey?.addresses.find(
    (address: any) => {
      return address.format == "ADDRESS_FORMAT_ETHEREUM";
    },
  );
  if (!longTermStorageAddress || !longTermStorageAddress.address) {
    throw new Error(
      `couldn't lookup ETH address for private key: ${longTermStoragePrivateKey?.privateKeyId}`,
    );
  }

  const paddedLongTermStorageAddress = longTermStorageAddress.address
    .toLowerCase()
    .substring(2)
    .padStart(64, "0");

  const sendEthPolicyId = await createPolicy(
    subOrgClient,
    "Traders can use trading keys to send ETH to long term storage addresses",
    "EFFECT_ALLOW",
    `approvers.any(user, user.tags.contains('${traderTagId}'))`,
    `private_key.tags.contains('${tradingTagId}') && eth.tx.to == '${longTermStorageAddress.address!}'`,
  );
  const sendWethPolicyId = await createPolicy(
    subOrgClient,
    "Traders can use trading keys to send WETH to long term storage addresses",
    "EFFECT_ALLOW",
    `approvers.any(user, user.tags.contains('${traderTagId}'))`,
    `private_key.tags.contains('${tradingTagId}') && eth.tx.to == '${WETH_TOKEN_GOERLI.address}' && eth.tx.data[0..10] == '${TRANSFER_SELECTOR}' && eth.tx.data[10..74] == '${paddedLongTermStorageAddress}'`,
  );
  const sendUsdcPolicyId = await createPolicy(
    subOrgClient,
    "Traders can use trading keys to send USDC to long term storage addresses",
    "EFFECT_ALLOW",
    `approvers.any(user, user.tags.contains('${traderTagId}'))`,
    `private_key.tags.contains('${tradingTagId}') && eth.tx.to == '${USDC_TOKEN_GOERLI.address}' && eth.tx.data[0..10] == '${TRANSFER_SELECTOR}' && eth.tx.data[10..74] == '${paddedLongTermStorageAddress}'`,
  );

  return {
    adminPolicyId,
    depositPolicyId,
    withdrawPolicyId,
    approveWethPolicyId,
    approveUsdcPolicyId,
    tradePolicyId,
    sendEthPolicyId,
    sendWethPolicyId,
    sendUsdcPolicyId,
  }
}