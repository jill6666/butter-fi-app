"use client"

import createPolicy from "./createPolicy"
import getPrivateKeysForTag from "./getPrivateKeysForTag"
import { TurnkeyBrowserClient } from "@turnkey/sdk-browser"
import { CONFIG } from "@/config/protocol"
import { paddedAddress } from "@/lib/utils"

export async function createPolicies(
  subOrgClient: TurnkeyBrowserClient,
  adminTagId: string,
  traderTagId: string,
  tradingTagId: string,
  organizationId: string,
) {

  // ADMIN

  const adminPolicyId = "123" // skip

  // console.log("create admin policy...")
  // const adminPolicyId = await createPolicy(
  //   subOrgClient,
  //   "Admin users can do everything",
  //   "EFFECT_ALLOW",
  //   `approvers.any(user, user.tags.contains('${adminTagId}'))`,
  //   "true",
  // );
  // console.log("✅ admin policy created, id === ", adminPolicyId)

  
  // TRADING
  
  const SELECTORS = CONFIG.SELECTORS;
  
  console.log("create deposit policy...")
  const depositPolicyId = await createPolicy(
    subOrgClient,
    "Traders can use trading keys to deposit WMOD into strategy aggregator",
    "EFFECT_ALLOW",
    `approvers.any(user, user.tags.contains('${traderTagId}'))`,
    `private_key.tags.contains('${tradingTagId}') && eth.tx.to == '${CONFIG.CONTRACT_ADDRESSES.Aggregator}' && eth.tx.data[0..10] == '${SELECTORS.INVEST_SELECTOR}'`,
  );
  console.log("✅ deposit policy created, id === ", depositPolicyId)
  
  console.log("create withdraw policy...")
  const withdrawPolicyId = await createPolicy(
    subOrgClient,
    "Traders can use trading keys to withdraw WMOD from strategy aggregator",
    "EFFECT_ALLOW",
    `approvers.any(user, user.tags.contains('${traderTagId}'))`,
    `private_key.tags.contains('${tradingTagId}') && eth.tx.to == '${CONFIG.CONTRACT_ADDRESSES.Aggregator}' && eth.tx.data[0..10] == '${SELECTORS.WITHDRAW_SELECTOR}'`,
  );
  console.log("✅ withdraw policy created, id === ", withdrawPolicyId)

  console.log("create approve wmod policy...")
  const paddedAggregatorAddress = paddedAddress(CONFIG.CONTRACT_ADDRESSES.Aggregator);
  const approveWmodPolicyId = await createPolicy(
    subOrgClient,
    "Traders can use trading keys to make ERC20 token approvals for WMOD for usage with strategy aggregator",
    "EFFECT_ALLOW",
    `approvers.any(user, user.tags.contains('${traderTagId}'))`,
    `private_key.tags.contains('${tradingTagId}') && eth.tx.to == '${CONFIG.CONTRACT_ADDRESSES.WMOD}' && eth.tx.data[0..10] == '${SELECTORS.APPROVE_SELECTOR}' && eth.tx.data[10..74] == '${paddedAggregatorAddress}'`,
  );
  console.log("✅ approve wmod policy created, id === ", approveWmodPolicyId)

  console.log("create claim rewards policy...")
  const claimRewardsPolicyId = await createPolicy(
    subOrgClient,
    "Traders can use trading keys to claim rewards from strategy aggregator",
    "EFFECT_ALLOW",
    `approvers.any(user, user.tags.contains('${traderTagId}'))`,
    `private_key.tags.contains('${tradingTagId}') && eth.tx.to == '${CONFIG.CONTRACT_ADDRESSES.Aggregator}' && eth.tx.data[0..10] == '${SELECTORS.CLAIM_REWARDS_SELECTOR}'`,
  );
  console.log("✅ claim rewards policy created, id === ", claimRewardsPolicyId)

  // SENDING

  console.log("finding long term storage private key...")
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

  const paddedLongTermStorageAddress = paddedAddress(longTermStorageAddress.address!);

  console.log("create send wmod policy...")
  const sendWmodPolicyId = await createPolicy(
    subOrgClient,
    "Traders can use trading keys to send WMOD to long term storage addresses",
    "EFFECT_ALLOW",
    `approvers.any(user, user.tags.contains('${traderTagId}'))`,
    `private_key.tags.contains('${tradingTagId}') && eth.tx.to == '${CONFIG.CONTRACT_ADDRESSES.WMOD}' && eth.tx.data[0..10] == '${SELECTORS.TRANSFER_SELECTOR}' && eth.tx.data[10..74] == '${paddedLongTermStorageAddress}'`,
  );
  console.log("✅ send wmod policy created, id === ", sendWmodPolicyId)

  console.log("create send swmod policy...")
  const sendSwmodPolicyId = await createPolicy(
    subOrgClient,
    "Traders can use trading keys to send sWMOD to long term storage addresses",
    "EFFECT_ALLOW",
    `approvers.any(user, user.tags.contains('${traderTagId}'))`,
    `private_key.tags.contains('${tradingTagId}') && eth.tx.to == '${CONFIG.CONTRACT_ADDRESSES.sWMOD}' && eth.tx.data[0..10] == '${SELECTORS.TRANSFER_SELECTOR}' && eth.tx.data[10..74] == '${paddedLongTermStorageAddress}'`,
  );
  console.log("✅ send swmod policy created, id === ", sendSwmodPolicyId)

  return {
    adminPolicyId,
    depositPolicyId,
    withdrawPolicyId,
    approveWmodPolicyId,
    claimRewardsPolicyId,
    sendWmodPolicyId,
    sendSwmodPolicyId,
  }
}

export default createPolicies