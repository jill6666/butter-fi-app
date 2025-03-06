import { Turnkey } from "@turnkey/sdk-server";

export async function getTurnkeyClient() {
  return new Turnkey({
    apiBaseUrl: "https://api.turnkey.com",
    apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY || "",
    apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY || "",
    defaultOrganizationId: process.env.TURNKEY_ORGANIZATION_ID || "",
  }).apiClient();
}
