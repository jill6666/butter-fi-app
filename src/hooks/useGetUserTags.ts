import { useQuery } from "@tanstack/react-query";
import { useTurnkey } from "@turnkey/sdk-react";
import { useUser } from "@/hooks/useUser";
import { getUserTagList } from "@/actions/turnkey";

export const useGetUserTags = ({ organizationId }: { organizationId: string }) => {
  const {
    data: userTags,
    isLoading: isLoadingUserTags,
    refetch: refetchUserTags,
    error: errorUserTags,
  } = useQuery({
    queryKey: ["user-tags", organizationId],
    queryFn: () => getUserTagList({ organizationId }),
    enabled: !!organizationId,
  });
  return {
    userTags: userTags,
    isLoadingUserTags,
    refetchUserTags,
  };
};

async function fetchUserTags() {
  console.log("fetchUserTags ======")
  const { client } = useTurnkey();
  const { user } = useUser();
  const organizationId = user?.organization?.organizationId
  return client?.listUserTags({
    organizationId
  })
}