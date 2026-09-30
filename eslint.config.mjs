import next from "eslint-config-next";

const config = [
  ...next,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "docs/**",
      "scripts/handbook/template.html",
      "playwright-report/**",
      "test-results/**",
    ],
  },
];

export default config;
