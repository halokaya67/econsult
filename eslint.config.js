const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  // eslint-plugin-import comes with eslint-config-expo, which registers the plugin but leaves the
  // ordering rule off; the groups below are the order the reviews settled on.
  {
    settings: { "import/internal-regex": "^@/" },
    rules: {
      "import/order": [
        "error",
        {
          groups: [["builtin", "external"], "internal", ["parent", "sibling", "index"]],
          pathGroups: [{ pattern: "@/**", group: "internal" }],
          pathGroupsExcludedImportTypes: [],
          "newlines-between": "never",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  },
  { ignores: ["dist/*", ".expo/*", "coverage/*", "specs/*"] },
]);
