import { config } from "@repo/eslint-config/react-internal";

// Force eslint-plugin-react to lint against React 18 since this package does not declare its own React dependency.
const patchedConfig = config.map((entry) => {
  if (entry && typeof entry === "object" && "settings" in entry) {
    return {
      ...entry,
      settings: {
        ...(entry.settings ?? {}),
        react: {
          ...((entry.settings ?? {}).react ?? {}),
          version: "18.0",
        },
      },
    };
  }
  return entry;
});

/** @type {import("eslint").Linter.Config[]} */
export default patchedConfig;
