"use server";

import { TurnkeyActivityError } from "@turnkey/sdk-server";
import { getTurnkeyClient } from "./turnkeyClient";

export default async function createPolicy(
  policyName: string,
  effect: "EFFECT_ALLOW" | "EFFECT_DENY",
  consensus: string,
  condition: string,
): Promise<string> {
  try {
    const client = await getTurnkeyClient();
    const { policyId } = await client.createPolicy({
      policyName,
      condition,
      consensus,
      effect,
      notes: "",
    });

    const newPolicyId = refineNonNull(policyId);

    // Success!
    console.log(
      [
        `New policy created!`,
        `- Name: ${policyName}`,
        `- Policy ID: ${newPolicyId}`,
        `- Effect: ${effect}`,
        `- Consensus: ${consensus}`,
        `- Condition: ${condition}`,
        ``,
      ].join("\n"),
    );

    return newPolicyId;
  } catch (error) {
    // If needed, you can read from `TurnkeyActivityError` to find out why the activity didn't succeed
    if (error instanceof TurnkeyActivityError) {
      throw error;
    }

    throw new TurnkeyActivityError({
      message: "Failed to create a new policy",
      cause: error as Error,
    });
  }
}
function refineNonNull<T>(
  input: T | null | undefined,
  errorMessage?: string,
): T {
  if (input == null) {
    throw new Error(errorMessage ?? `Unexpected ${JSON.stringify(input)}`);
  }

  return input;
}