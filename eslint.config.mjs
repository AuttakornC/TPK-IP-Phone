import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Project-wide rule overrides.
  // The demo's role/project lookup is localStorage-based, which forces a hydrate-from-localStorage
  // pattern in useEffect (set state once on mount, after SSR returns null). React 19's
  // react-hooks/set-state-in-effect flags this idiom, but it's necessary here for SSR safety —
  // disable the rule until the auth model moves entirely to next-auth session lookups.
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated Prisma client.
    "src/generated/**",
  ]),
]);

export default eslintConfig;
