import {
  type TurnkeyBrowserClient,
  TurnkeyActivityError,
} from "@turnkey/sdk-browser";

export default async function createPrivateKeyTag(
  turnkeyClient: TurnkeyBrowserClient,
  privateKeyTagName: string,
  privateKeyIds: string[],
): Promise<string> {
  try {
    const { privateKeyTagId } = await turnkeyClient.createPrivateKeyTag({
      privateKeyTagName,
      privateKeyIds,
    });

    const newPrivateKeyTagId = refineNonNull(privateKeyTagId);

    // Success!
    console.log(
      [
        `New private key tag created!`,
        `- Name: ${privateKeyTagName}`,
        `- Private key tag ID: ${newPrivateKeyTagId}`,
        ``,
      ].join("\n"),
    );

    return newPrivateKeyTagId;
  } catch (error) {
    // If needed, you can read from `TurnkeyActivityError` to find out why the activity didn't succeed
    if (error instanceof TurnkeyActivityError) {
      throw error;
    }

    throw new TurnkeyActivityError({
      message: "Failed to create a new private key tag",
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