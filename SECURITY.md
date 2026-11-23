# Security policy

Security fixes target the current development branch and the latest published version when a packaged fix is needed.

## Report a vulnerability privately

Open [Security Advisories](https://github.com/torintran/torin-tools/security/advisories/new) and submit a private report. Keep vulnerability details out of public issues, pull requests, and discussions while a fix is being coordinated.

Include the affected version or commit, platform, tool or component, security impact, and enough detail to reproduce with synthetic data. Remove credentials and real user data from any material you share.

Maintainers review reports and coordinate fixes and disclosure in the advisory. To report ordinary bugs or suggest features, use [CONTRIBUTING.md](CONTRIBUTING.md).

## Security scope

Reports can cover client-side tools, the PWA, the optional Postman gateway, desktop packaging, and update checks. When the gateway is enabled, include the deployment mode and any relevant reverse-proxy behavior. See [Privacy and data flow](docs/privacy.md) for the expected handling of inputs, credentials, and downloads.
