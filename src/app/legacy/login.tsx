"use client";

import { TurnkeyBrowserClient } from "@turnkey/sdk-browser";

// Create a client instance
const browserClient = new TurnkeyBrowserClient({
  apiBaseUrl: "https://api.turnkey.com",
  organizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID || "",
  readOnlySession: "",
});

export default function Login() {
  const login = async () => {
    const readWriteSession = await browserClient.login({
      organizationId: "621ed175-3b3f-4773-bddd-57c865b5faa2",
    });

    console.log("Read write session:", readWriteSession);
    return readWriteSession;
  };

  return (
    <div className="text-white border p-2">
      <h1 className="text-2xl">Login with Passkey</h1>
        <button
          type="button"
          className="rounded-md bg-white text-black w-full"
          onClick={login}
        >
          Login
        </button>
    </div>
  );
}