"use client";

import { useTurnkey } from "@turnkey/sdk-react";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { createSubOrganization } from "@/actions/createSubOrganization";

type TSubOrgFormData = {
  email: string;
};

export default function CreateSubOrganization() {
  // Maintain state
  const [createSubOrganizationResponse, setCreateSubOrganizationResponse] = useState<any>(null);
  const { passkeyClient } = useTurnkey();

  // Use form handler for suborg creation
  const {
    register: subOrgFormRegister,
    handleSubmit: subOrgFormSubmit
  } = useForm<TSubOrgFormData>();

  const createNewPasskey = async () => {
    const credential = await passkeyClient?.createUserPasskey({
      publicKey: {
        // This is the name of the passkey that will be displayed to the user
        rp: {
          name: "Wallet Passkey",
        },
        user: {
          // We can use the username as the name and display name
          name: "Default User Name",
          displayName: "Default User Name",
        },
      },
    });

    // we'll use this credential in the next step to create a new sub-organization
    return {
        attestation: credential?.attestation,
        encodedChallenge: credential?.encodedChallenge,
    }
  };

  const createSubOrg = async (data: TSubOrgFormData) => {
    try {
      const { encodedChallenge: challenge, attestation } =
        await createNewPasskey();

      if (!challenge || !attestation) {
        throw new Error("Failed to create passkey");
      }

      const createSubOrganizationResponse = await createSubOrganization(
        data.email,
        challenge,
        attestation
      );

      setCreateSubOrganizationResponse(createSubOrganizationResponse);
    } catch (error) {
      console.error('Error creating sub-organization:', error);
      // You might want to set an error state here or show a notification to the user
      throw error; // Re-throw to be handled by the form submission handler if needed
    }
  };

  return (
    <div className="text-white border p-2">
      <h1 className="text-2xl">Create a new sub-organization</h1>
        {createSubOrganizationResponse ? (
        <h2>{`You've created a sub-organization!`}</h2>
      ) : (
        <form className="flex flex-col gap-4 p-2" onSubmit={subOrgFormSubmit(createSubOrg)}>
          <label className="flex gap-2">
            Email
            <input {...subOrgFormRegister("email")} placeholder="User Email" />
          </label>
          <button type="submit" className="rounded-md bg-white text-black">
            Create new sub-organization
          </button>
        </form>
      )}
    </div>
  );
}