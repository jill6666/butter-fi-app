"use server";

import { DEFAULT_ETHEREUM_ACCOUNTS } from "@turnkey/sdk-browser";

import { getTurnkeyClient } from "./turnkeyClient";

type TAttestation = {
    credentialId: string;
    clientDataJson: string;
    attestationObject: string;
    transports: (
      | "AUTHENTICATOR_TRANSPORT_BLE"
      | "AUTHENTICATOR_TRANSPORT_INTERNAL"
      | "AUTHENTICATOR_TRANSPORT_NFC"
      | "AUTHENTICATOR_TRANSPORT_USB"
      | "AUTHENTICATOR_TRANSPORT_HYBRID"
    )[];
  };
  
  export const createSubOrganization = async (
    email: string,
    challenge: string,
    attestation: TAttestation
  ) => {
    const client = await getTurnkeyClient();
    const createSubOrgResponse = await client.createSubOrganization({
      subOrganizationName: "My New Suborg",
      rootUsers: [
        {
          userName: "Default User Name",
          userEmail: email,
          apiKeys: [],
          authenticators: [
            {
              authenticatorName: "Default Passkey",
              challenge: challenge,
              attestation: attestation,
            },
          ],
          oauthProviders: [],
        },
      ],
      rootQuorumThreshold: 1,
      wallet: {
        walletName: "Default Wallet",
        accounts: DEFAULT_ETHEREUM_ACCOUNTS,
      },
    });
  
    return createSubOrgResponse;
  };
  export default createSubOrganization;