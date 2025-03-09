import {
  type TurnkeyBrowserClient,
  TurnkeyActivityError,
} from "@turnkey/sdk-browser";

export default async function createUserTag(
  turnkeyClient: TurnkeyBrowserClient,
  userTagName: string,
  userIds: string[],
): Promise<string> {
  try {
    const { userTagId } = await turnkeyClient.createUserTag({
      userTagName,
      userIds,
    });

    const newUserTagId = refineNonNull(userTagId);

    // Success!
    console.log(
      [
        `New user tag created!`,
        `- Name: ${userTagName}`,
        `- User tag ID: ${newUserTagId}`,
        ``,
      ].join("\n"),
    );

    return newUserTagId;
  } catch (error) {
    // If needed, you can read from `TurnkeyActivityError` to find out why the activity didn't succeed
    if (error instanceof TurnkeyActivityError) {
      throw error;
    }

    throw new TurnkeyActivityError({
      message: "Failed to create a new user tag",
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
