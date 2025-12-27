import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    rules: {
      // Add your custom rules here
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];

export default eslintConfig;
