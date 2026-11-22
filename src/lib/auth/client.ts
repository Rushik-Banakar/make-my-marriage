"use client";

import { createAuthClient } from "better-auth/react";
import { emailOTPClient, inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [emailOTPClient(), inferAdditionalFields({
    user: { contactPhone: { type: "string", required: false, returned: false } },
  })],
});
