import type { TurnkeyBrowserClient, TurnkeyApiTypes } from "@turnkey/sdk-browser";

/**
 * Get a list of private keys for a given tag
 * @param turnkeyClient
 * @param tagName
 * @returns a list of private keys matching the passed in tag
 */
export default async function getPrivateKeysForTag(
  turnkeyClient: TurnkeyBrowserClient,
  tagName: string,
  organizationId: string,
): Promise<TurnkeyApiTypes["v1PrivateKey"][]> {
  const response = await turnkeyClient.listPrivateKeyTags({
    organizationId,
  });

  const tag = response.privateKeyTags.find(
    (tag: TurnkeyApiTypes["datav1Tag"]) => {
      const isPrivateKeyTag = tag.tagType === "TAG_TYPE_PRIVATE_KEY";
      const isMatchingTag = tag.tagName === tagName;
      return isPrivateKeyTag && isMatchingTag;
    },
  );

  if (!tag) {
    throw new Error(
      `unable to find tag ${tagName} in organization ${organizationId}`,
    );
  }

  const privateKeysResponse = await turnkeyClient.getPrivateKeys({
    organizationId,
  });

  const privateKeys = privateKeysResponse.privateKeys.filter(
    (privateKey: any) => {
      return privateKey.privateKeyTags.includes(tag!.tagId);
    },
  );

  if (!privateKeys || privateKeys.length == 0) {
    throw new Error(
      `unable to find tag ${tagName} in organization ${organizationId}`,
    );
  }

  return privateKeys;
}
