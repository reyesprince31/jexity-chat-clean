import type { auth } from "@repo/auth";
import { adminClient, inferAdditionalFields, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	plugins: [
		adminClient(),
		organizationClient(),
		inferAdditionalFields<typeof auth>()
	],
});
