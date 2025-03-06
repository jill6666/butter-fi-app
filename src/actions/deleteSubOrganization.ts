"use server";

import { getTurnkeyClient } from "./turnkeyClient";

export const deleteSubOrganization = async (
) => {
  const client = await getTurnkeyClient();
  const deleteSubOrgResponse = await client.deleteSubOrganization({
  });

  return deleteSubOrgResponse;
};
export default deleteSubOrganization;