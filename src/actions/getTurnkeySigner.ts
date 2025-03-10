import * as path from "path";
import * as dotenv from "dotenv";
import { ethers } from "ethers";
import { TurnkeySigner } from "@turnkey/ethers";

import { Turnkey as TurnkeySDKServer } from "@turnkey/sdk-server";

const MONAD_ENV = {
  chainId: 10143,
  name: "monad testnet",
}

// Load environment variables from `.env.local`
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

export const provider = new ethers.JsonRpcProvider("https://monad-testnet.drpc.org", MONAD_ENV);

// getTurnkeySigner returns a TurnkeySigner connected to the passed-in Provider
// (https://docs.ethers.org/v6/api/providers/)
export function getTurnkeySigner(
  signWith: string,
): TurnkeySigner {
  const turnkeyClient = new TurnkeySDKServer({
    apiBaseUrl: "https://api.turnkey.com",
    apiPublicKey: process.env.API_PUBLIC_KEY!,
    apiPrivateKey: process.env.API_PRIVATE_KEY!,
    defaultOrganizationId: process.env.ORGANIZATION_ID!,
  });

  // Initialize a Turnkey Signer
  const turnkeySigner = new TurnkeySigner({
    client: turnkeyClient.apiClient(),
    organizationId: process.env.ORGANIZATION_ID!,
    signWith,
  });

  return turnkeySigner.connect(provider);
}
