"use client"

import createUserTag from "./createUserTag"
import createPrivateKeyTag from "./createPrivateKeyTag"
import createPrivateKey from "./createPrivateKey"
import { TurnkeyBrowserClient } from "@turnkey/sdk-browser"
import createStrategyPolicies from "./createStrategyPolicies"

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
    const policies = await createStrategyPolicies(
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