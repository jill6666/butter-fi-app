"use server"

import {
  ApiKeyStamper,
  DEFAULT_ETHEREUM_ACCOUNTS,
  TurnkeyServerClient,
  TurnkeyActivityError,
} from "@turnkey/sdk-server"
import { WalletType } from "@turnkey/wallet-stamper"
import { decode, JwtPayload } from "jsonwebtoken"
import { Address, getAddress, parseEther } from "viem"

import {
  Attestation,
  Email,
  OauthProviderParams,
  Wallet,
} from "@/types/turnkey"
import { siteConfig } from "@/config/site"
import { turnkeyConfig } from "@/config/turnkey"
import { getTurnkeyWalletClient } from "@/lib/web3"
import createUserTag from "./createUserTag"
import createPolicy from "./createPolicy"
import createUser from "./createUser"
import createPrivateKeyTag from "./createPrivateKeyTag"
import createPrivateKey from "./createPrivateKey"

import { getTransactions } from "./web3"

const stamper = new ApiKeyStamper({
  apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY || "",
  apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY || "",
})

const client = new TurnkeyServerClient({
  apiBaseUrl: turnkeyConfig.apiBaseUrl,
  organizationId: turnkeyConfig.organizationId,
  stamper,
})

function decodeJwt(credential: string): JwtPayload | null {
  const decoded = decode(credential)

  if (decoded && typeof decoded === "object" && "email" in decoded) {
    return decoded as JwtPayload
  }

  return null
}

export const createUserSubOrg = async ({
  email,
  passkey,
  oauth,
  wallet,
}: {
  email?: Email
  passkey?: {
    challenge: string
    attestation: Attestation
  }
  oauth?: OauthProviderParams
  wallet?: {
    publicKey: string
    type: WalletType
  }
}) => {
  const authenticators = passkey
    ? [
        {
          authenticatorName: "Passkey",
          challenge: passkey.challenge,
          attestation: passkey.attestation,
        },
      ]
    : []

  const oauthProviders = oauth
    ? [
        {
          providerName: oauth.providerName,
          oidcToken: oauth.oidcToken,
        },
      ]
    : []

  const apiKeys = wallet
    ? [
        {
          apiKeyName: "Wallet Auth - Embedded Wallet",
          publicKey: wallet.publicKey,
          curveType:
            wallet.type === WalletType.Ethereum
              ? ("API_KEY_CURVE_SECP256K1" as const)
              : ("API_KEY_CURVE_ED25519" as const),
        },
      ]
    : []

  let userEmail = email
  // If the user is logging in with a Google Auth credential, use the email from the decoded OIDC token (credential
  // Otherwise, use the email from the email parameter
  if (oauth) {
    const decoded = decodeJwt(oauth.oidcToken)
    if (decoded?.email) {
      userEmail = decoded.email
    }
  }
  const subOrganizationName = `Sub Org - ${email}`
  const userName = email ? email.split("@")?.[0] || email : ""

  const subOrg = await client.createSubOrganization({
    organizationId: turnkeyConfig.organizationId,
    subOrganizationName,
    rootUsers: [
      {
        userName,
        userEmail,
        oauthProviders,
        authenticators,
        apiKeys,
      },
    ],
    rootQuorumThreshold: 1,
    wallet: {
      walletName: "Default Wallet",
      accounts: DEFAULT_ETHEREUM_ACCOUNTS,
    },
  })
  const userId = subOrg.rootUserIds?.[0]
  if (!userId) {
    throw new Error("No root user ID found")
  }
  const { user } = await client.getUser({
    organizationId: subOrg.subOrganizationId,
    userId,
  })

  return { subOrg, user }
}

export const oauth = async ({
  credential,
  targetPublicKey,
  targetSubOrgId,
}: {
  credential: string
  targetPublicKey: string
  targetSubOrgId: string
}) => {
  const oauthResponse = await client.oauth({
    oidcToken: credential,
    targetPublicKey,
    organizationId: targetSubOrgId,
  })

  return oauthResponse
}

const devUrl = "http://localhost:3000"; // siteConfig.url.base
const getMagicLinkTemplate = (action: string, email: string, method: string) =>
  `${devUrl}/email-${action}?userEmail=${email}&continueWith=${method}&credentialBundle=%s`

export const initEmailAuth = async ({
  email,
  targetPublicKey,
}: {
  email: Email
  targetPublicKey: string
}) => {
  let organizationId = await getSubOrgIdByEmail(email as Email)

  if (!organizationId) {
    const { subOrg } = await createUserSubOrg({
      email: email as Email,
    })
    organizationId = subOrg.subOrganizationId
  }

  const magicLinkTemplate = getMagicLinkTemplate("auth", email, "email")

  if (organizationId?.length) {
    const authResponse = await client.emailAuth({
      email,
      targetPublicKey,
      organizationId,
      emailCustomization: {
        magicLinkTemplate,
      },
    })

    return authResponse
  }
}

type EmailParam = { email: Email }
type PublicKeyParam = { publicKey: string }
type UsernameParam = { username: string }
type OidcTokenParam = { oidcToken: string }

export function getSubOrgId(param: EmailParam): Promise<string>
export function getSubOrgId(param: PublicKeyParam): Promise<string>
export function getSubOrgId(param: UsernameParam): Promise<string>
export function getSubOrgId(param: OidcTokenParam): Promise<string>

export async function getSubOrgId(
  param: EmailParam | PublicKeyParam | UsernameParam | OidcTokenParam
): Promise<string> {
  let filterType: string
  let filterValue: string

  if ("email" in param) {
    filterType = "EMAIL"
    filterValue = param.email
  } else if ("publicKey" in param) {
    filterType = "PUBLIC_KEY"
    filterValue = param.publicKey
  } else if ("username" in param) {
    filterType = "USERNAME"
    filterValue = param.username
  } else if ("oidcToken" in param) {
    filterType = "OIDC_TOKEN"
    filterValue = param.oidcToken
  } else {
    throw new Error("Invalid parameter")
  }

  const { organizationIds } = await client.getSubOrgIds({
    organizationId: turnkeyConfig.organizationId,
    filterType,
    filterValue,
  })

  return organizationIds[0]
}

export const getSubOrgIdByEmail = async (email: Email) => {
  return getSubOrgId({ email })
}

export const getSubOrgIdByPublicKey = async (publicKey: string) => {
  return getSubOrgId({ publicKey })
}

export const getSubOrgIdByUsername = async (username: string) => {
  return getSubOrgId({ username })
}

export const getUser = async (userId: string, subOrgId: string) => {
  return client.getUser({
    organizationId: subOrgId,
    userId,
  })
}

export async function getWalletsWithAccounts(
  organizationId: string
): Promise<Wallet[]> {
  const { wallets } = await client.getWallets({
    organizationId,
  })

  return await Promise.all(
    wallets.map(async (wallet) => {
      const { accounts } = await client.getWalletAccounts({
        organizationId,
        walletId: wallet.walletId,
      })

      const accountsWithBalance = await Promise.all(
        accounts.map(async ({ address, ...account }) => {
          return {
            ...account,
            address: getAddress(address),
            balance: undefined,
          }
        })
      )
      return { ...wallet, accounts: accountsWithBalance }
    })
  )
}

export const getWallet = async (
  walletId: string,
  organizationId: string
): Promise<Wallet> => {
  const [{ wallet }, accounts] = await Promise.all([
    client.getWallet({ walletId, organizationId }),
    client
      .getWalletAccounts({ walletId, organizationId })
      .then(({ accounts }) =>
        accounts.map(({ address, ...account }) => {
          return {
            ...account,
            address: getAddress(address),
            balance: undefined,
          }
        })
      ),
  ])

  return { ...wallet, accounts }
}

export const getAuthenticators = async (userId: string, subOrgId: string) => {
  const { authenticators } = await client.getAuthenticators({
    organizationId: subOrgId,
    userId,
  })
  return authenticators
}

export const getAuthenticator = async (
  authenticatorId: string,
  subOrgId: string
) => {
  const { authenticator } = await client.getAuthenticator({
    organizationId: subOrgId,
    authenticatorId,
  })
  return authenticator
}

const warchestStamper = new ApiKeyStamper({
  apiPublicKey: process.env.TURNKEY_WARCHEST_API_PUBLIC_KEY || "",
  apiPrivateKey: process.env.TURNKEY_WARCHEST_API_PRIVATE_KEY || "",
})

const warchestClient = new TurnkeyServerClient({
  apiBaseUrl: turnkeyConfig.apiBaseUrl,
  organizationId: process.env.TURNKEY_WARCHEST_ORGANIZATION_ID || "",
  stamper: warchestStamper,
})

export const fundWallet = async (address: Address) => {
  const value = parseEther("0.01")
  const { receivedTransactions } = await getTransactions(address)

  if (receivedTransactions.length >= 1) {
    return ""
  }

  const walletClient = await getTurnkeyWalletClient(
    warchestClient as TurnkeyServerClient,
    process.env.WARCHEST_PRIVATE_KEY_ID || ""
  )

  const txHash = await walletClient.sendTransaction({
    to: address,
    value,
  })

  return txHash
}

// export async function setup(_options: any) {
//   // setup user tags
//   const adminTagId = await createUserTag(
//     client.apiClient(),
//     "Admin",
//     [],
//   );
//   const traderTagId = await createUserTag(
//     client.apiClient(),
//     "Trader",
//     [],
//   );

//   // setup users
//   await createUser(
//     client.apiClient(),
//     "Alice",
//     [adminTagId],
//     "Alice key",
//     keys!.alice!.publicKey!,
//   );
//   await createUser(
//     client.apiClient(),
//     "Bob",
//     [traderTagId],
//     "Bob key",
//     keys!.bob!.publicKey!,
//   );

//   // setup private key tags
//   const tradingTagId = await createPrivateKeyTag(
//     client.apiClient(),
//     "trading",
//     [],
//   );
//   const personal = await createPrivateKeyTag(
//     client.apiClient(),
//     "personal",
//     [],
//   );
//   const longTermStorageTagId = await createPrivateKeyTag(
//     client.apiClient(),
//     "long-term-storage",
//     [],
//   );

//   // setup private keys
//   await createPrivateKey(client.apiClient(), "Trading Wallet", [
//     tradingTagId,
//   ]);
//   await createPrivateKey(client.apiClient(), "Long Term Storage", [
//     longTermStorageTagId,
//   ]);
//   await createPrivateKey(client.apiClient(), "Personal", [personal]);

//   // setup policies: grant specific users permissions to use specific private keys
//   // ADMIN
//   await createPolicy(
//     client.apiClient(),
//     "Admin users can do everything",
//     "EFFECT_ALLOW",
//     `approvers.any(user, user.tags.contains('${adminTagId}'))`,
//     "true",
//   );

//   const paddedRouterAddress = SWAP_ROUTER_ADDRESS.toLowerCase()
//     .substring(2)
//     .padStart(64, "0");

//   // TRADING
//   await createPolicy(
//     client.apiClient(),
//     "Traders can use trading keys to deposit, aka wrap, ETH",
//     "EFFECT_ALLOW",
//     `approvers.any(user, user.tags.contains('${traderTagId}'))`,
//     `private_key.tags.contains('${tradingTagId}') && eth.tx.to == '${WETH_TOKEN_GOERLI.address}' && eth.tx.data[0..10] == '${DEPOSIT_SELECTOR}'`,
//   );
//   await createPolicy(
//     client.apiClient(),
//     "Traders can use trading keys to withdraw, aka unwrap, WETH",
//     "EFFECT_ALLOW",
//     `approvers.any(user, user.tags.contains('${traderTagId}'))`,
//     `private_key.tags.contains('${tradingTagId}') && eth.tx.to == '${WETH_TOKEN_GOERLI.address}' && eth.tx.data[0..10] == '${WITHDRAW_SELECTOR}'`,
//   );
//   await createPolicy(
//     client.apiClient(),
//     "Traders can use trading keys to make ERC20 token approvals for WETH for usage with Uniswap",
//     "EFFECT_ALLOW",
//     `approvers.any(user, user.tags.contains('${traderTagId}'))`,
//     `private_key.tags.contains('${tradingTagId}') && eth.tx.to == '${WETH_TOKEN_GOERLI.address}' && eth.tx.data[0..10] == '${APPROVE_SELECTOR}' && eth.tx.data[10..74] == '${paddedRouterAddress}'`,
//   );
//   await createPolicy(
//     client.apiClient(),
//     "Traders can use trading keys to make ERC20 token approvals for USDC for usage with Uniswap",
//     "EFFECT_ALLOW",
//     `approvers.any(user, user.tags.contains('${traderTagId}'))`,
//     `private_key.tags.contains('${tradingTagId}') && eth.tx.to == '${USDC_TOKEN_GOERLI.address}' && eth.tx.data[0..10] == '${APPROVE_SELECTOR}' && eth.tx.data[10..74] == '${paddedRouterAddress}'`,
//   );
//   // TODO: conver strategies to policy patterns
//   await createPolicy(
//     client.apiClient(),
//     "Traders can use trading keys to make trades using Uniswap",
//     "EFFECT_ALLOW",
//     `approvers.any(user, user.tags.contains('${traderTagId}'))`,
//     `private_key.tags.contains('${tradingTagId}') && eth.tx.to == '${SWAP_ROUTER_ADDRESS}' && eth.tx.data[0..10] == '${TRADE_SELECTOR}'`, // in theory, you can get more granular here with specific trade parameters
//   );

//   // SENDING
//   // first, get long term storage address(es)
//   const longTermStoragePrivateKey = (
//     await getPrivateKeysForTag(client.apiClient(), "long-term-storage")
//   )[0];
//   const longTermStorageAddress = longTermStoragePrivateKey?.addresses.find(
//     (address: any) => {
//       return address.format == "ADDRESS_FORMAT_ETHEREUM";
//     },
//   );
//   if (!longTermStorageAddress || !longTermStorageAddress.address) {
//     throw new Error(
//       `couldn't lookup ETH address for private key: ${longTermStoragePrivateKey?.privateKeyId}`,
//     );
//   }

//   const paddedLongTermStorageAddress = longTermStorageAddress.address
//     .toLowerCase()
//     .substring(2)
//     .padStart(64, "0");

//   await createPolicy(
//     client.apiClient(),
//     "Traders can use trading keys to send ETH to long term storage addresses",
//     "EFFECT_ALLOW",
//     `approvers.any(user, user.tags.contains('${traderTagId}'))`,
//     `private_key.tags.contains('${tradingTagId}') && eth.tx.to == '${longTermStorageAddress.address!}'`,
//   );
//   await createPolicy(
//     client.apiClient(),
//     "Traders can use trading keys to send WETH to long term storage addresses",
//     "EFFECT_ALLOW",
//     `approvers.any(user, user.tags.contains('${traderTagId}'))`,
//     `private_key.tags.contains('${tradingTagId}') && eth.tx.to == '${WETH_TOKEN_GOERLI.address}' && eth.tx.data[0..10] == '${TRANSFER_SELECTOR}' && eth.tx.data[10..74] == '${paddedLongTermStorageAddress}'`,
//   );
//   await createPolicy(
//     client.apiClient(),
//     "Traders can use trading keys to send USDC to long term storage addresses",
//     "EFFECT_ALLOW",
//     `approvers.any(user, user.tags.contains('${traderTagId}'))`,
//     `private_key.tags.contains('${tradingTagId}') && eth.tx.to == '${USDC_TOKEN_GOERLI.address}' && eth.tx.data[0..10] == '${TRANSFER_SELECTOR}' && eth.tx.data[10..74] == '${paddedLongTermStorageAddress}'`,
//   );
// }

export async function setupTrader() {
  const traderTagId = await createUserTag(
    client.apiClient(),
    "Trader",
    [],
  );

}

export async function setupUserTag() {
  const adminTagId =  await client.createUserTag({
    userTagName: "Admin",
    userIds: [],
  })
  const traderTagId = await client.createUserTag({
    userTagName: "Trader",
    userIds: [],
  })
  return { adminTagId, traderTagId }
}

export async function setupUser({
  userId,
}: {
  userId: string;
}) {
  // setup user tags
  const adminTagId = await createUserTag(
    client.apiClient(),
    "Admin",
    [],
  );

  // update user
  await client.updateUser({
    userId,
    userTagIds: [adminTagId],
  })
}

export async function updateUserTag(
  userTagIds: string[],
  userId: string,
  organizationId: string,
): Promise<string> {
  try {
    const response = await client.updateUser({
      organizationId,
      userId,
      userTagIds,
    });
    // Success!
    console.log(
      [
        `User tag updated!`,
        `- User ID: ${response.userId}`,
        ``,
      ].join("\n"),
    );

    return response.userId;
  } catch (error) {
    // If needed, you can read from `TurnkeyActivityError` to find out why the activity didn't succeed
    if (error instanceof TurnkeyActivityError) {
      throw error;
    }

    throw new TurnkeyActivityError({
      message: "Failed to update user tag",
      cause: error as Error,
    });
  }
}

export async function getUserTagList({ organizationId }: { organizationId: string } ) {
  const { userTags } = await client.listUserTags({
    organizationId,
  })
  return userTags
}
