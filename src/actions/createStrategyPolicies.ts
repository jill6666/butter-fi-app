"use server"

import { TurnkeyServerClient } from "@turnkey/sdk-server"
import createPolicy from "./createPolicy"
import getPrivateKeysForTag from "./getPrivateKeysForTag"
import { CONFIG } from "@/config/protocol"

export async function createPolicies(
  subOrgClient: TurnkeyServerClient,
  adminTagId: string,
  traderTagId: string,
  tradingTagId: string,
) {
  // ADMIN

  const adminPolicyId = await createPolicy(
    subOrgClient,
    "Admin users can do everything",
    "EFFECT_ALLOW",
    `approvers.any(user, user.tags.contains('${adminTagId}'))`,
    "true",
  );

  
  
  // TRADING

  const SELECTORS = CONFIG.SELECTORS;

  const depositPolicyId = await createPolicy(
    subOrgClient,
    "Traders can use trading keys to deposit WMOD into strategy aggregator",
    "EFFECT_ALLOW",
    `approvers.any(user, user.tags.contains('${traderTagId}'))`,
    `private_key.tags.contains('${tradingTagId}') && eth.tx.to == '${CONFIG.CONTRACT_ADDRESSES.Aggregator}' && eth.tx.data[0..10] == '${SELECTORS.INVEST_SELECTOR}'`,
  );
  const withdrawPolicyId = await createPolicy(
    subOrgClient,
    "Traders can use trading keys to withdraw WMOD from strategy aggregator",
    "EFFECT_ALLOW",
    `approvers.any(user, user.tags.contains('${traderTagId}'))`,
    `private_key.tags.contains('${tradingTagId}') && eth.tx.to == '${CONFIG.CONTRACT_ADDRESSES.Aggregator}' && eth.tx.data[0..10] == '${SELECTORS.WITHDRAW_SELECTOR}'`,
  );
  const paddedAggregatorAddress = CONFIG.CONTRACT_ADDRESSES.Aggregator.toLowerCase()
    .substring(2)
    .padStart(64, "0");
  const approveWmodPolicyId = await createPolicy(
    subOrgClient,
    "Traders can use trading keys to make ERC20 token approvals for WMOD for usage with strategy aggregator",
    "EFFECT_ALLOW",
    `approvers.any(user, user.tags.contains('${traderTagId}'))`,
    `private_key.tags.contains('${tradingTagId}') && eth.tx.to == '${CONFIG.CONTRACT_ADDRESSES.WMOD}' && eth.tx.data[0..10] == '${SELECTORS.APPROVE_SELECTOR}' && eth.tx.data[10..74] == '${paddedAggregatorAddress}'`,
  );
  const claimRewardsPolicyId = await createPolicy(
    subOrgClient,
    "Traders can use trading keys to claim rewards from strategy aggregator",
    "EFFECT_ALLOW",
    `approvers.any(user, user.tags.contains('${traderTagId}'))`,
    `private_key.tags.contains('${tradingTagId}') && eth.tx.to == '${CONFIG.CONTRACT_ADDRESSES.Aggregator}' && eth.tx.data[0..10] == '${SELECTORS.CLAIM_REWARDS_SELECTOR}'`,
  );

  // SENDING

  const longTermStoragePrivateKey = (
    await getPrivateKeysForTag(subOrgClient, "long_term_storage")
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

  const sendWmodPolicyId = await createPolicy(
    subOrgClient,
    "Traders can use trading keys to send WMOD to long term storage addresses",
    "EFFECT_ALLOW",
    `approvers.any(user, user.tags.contains('${traderTagId}'))`,
    `private_key.tags.contains('${tradingTagId}') && eth.tx.to == '${CONFIG.CONTRACT_ADDRESSES.WMOD}' && eth.tx.data[0..10] == '${SELECTORS.TRANSFER_SELECTOR}' && eth.tx.data[10..74] == '${paddedLongTermStorageAddress}'`,
  );
  const sendSwmodPolicyId = await createPolicy(
    subOrgClient,
    "Traders can use trading keys to send sWMOD to long term storage addresses",
    "EFFECT_ALLOW",
    `approvers.any(user, user.tags.contains('${traderTagId}'))`,
    `private_key.tags.contains('${tradingTagId}') && eth.tx.to == '${CONFIG.CONTRACT_ADDRESSES.sWMOD}' && eth.tx.data[0..10] == '${SELECTORS.TRANSFER_SELECTOR}' && eth.tx.data[10..74] == '${paddedLongTermStorageAddress}'`,
  );

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