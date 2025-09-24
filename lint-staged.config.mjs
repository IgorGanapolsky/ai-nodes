export default {
  "*.{ts,tsx,js,jsx}": [
    "eslint --fix --max-warnings=0"
  ],
  "*.{ts,tsx,js,jsx,md,json,yml,yaml}": [
    "prettier --write"
  ]
};

