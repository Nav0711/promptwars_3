import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Fix 8: eslint-plugin-jsx-a11y — WCAG-aligned automated accessibility linting.
 *
 * eslint-config-next already includes jsx-a11y as a plugin. We extend it here
 * with additional rule overrides. Rules are at "warn" level so they appear in
 * CI output without blocking builds; upgrade to "error" after full remediation.
 *
 * Key rules enforced:
 *  - aria-props/proptypes/role:  Invalid ARIA attributes caught at build time
 *  - label-has-associated-control: <label> must be linked to its input
 *  - alt-text:                   Images must have non-empty alt
 *  - click-events-have-key-events: Non-interactive onClick needs keyboard handler
 *  - interactive-supports-focus: Focusable elements reachable by Tab
 *  - heading-has-content:        Headings cannot be empty
 *  - html-has-lang:              <html> must declare language
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // jsx-a11y plugin is already registered by eslint-config-next;
    // we only override rule severity here.
    rules: {
      // Core labeling — upgraded from Next.js default
      "jsx-a11y/label-has-associated-control": ["warn", {
        assert: "htmlFor",
      }],
      "jsx-a11y/alt-text": "warn",
      "jsx-a11y/anchor-has-content": "warn",
      "jsx-a11y/anchor-is-valid": "warn",

      // ARIA correctness — error level (no valid reason to violate these)
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-proptypes": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/role-has-required-aria-props": "warn",
      "jsx-a11y/role-supports-aria-props": "warn",

      // Keyboard / focus accessibility
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-noninteractive-element-interactions": "warn",
      "jsx-a11y/interactive-supports-focus": "warn",
      "jsx-a11y/no-autofocus": "warn",
      "jsx-a11y/tabindex-no-positive": "warn",

      // Structural requirements
      "jsx-a11y/heading-has-content": "error",
      "jsx-a11y/html-has-lang": "error",
      "jsx-a11y/img-redundant-alt": "warn",
      "jsx-a11y/no-distracting-elements": "error",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
