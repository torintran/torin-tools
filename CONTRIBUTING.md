# Contributing to Torin Tools

Use GitHub Issues for bugs and feature requests. Search for an existing issue first. Include the tool name, app version or commit, browser or operating system, expected behavior, and a minimal example with synthetic data. Report security concerns privately via [SECURITY.md](SECURITY.md). Follow the [Code of Conduct](CODE_OF_CONDUCT.md) in project spaces.

## Set up and verify

Use Node.js (version in `.nvmrc`) and npm.

```sh
npm ci
npm run dev
```

For code changes, run the checks that cover the affected behavior.

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

Browser checks use the production build and fixtures. To use an existing Chrome installation, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` before running them. See [Deployment](docs/deployment.md) for the Windows build workflow.

## Open a pull request

1. Fork the repository and make your change on a branch.
2. For a new tool or a change to an algorithm, data format, API contract, or data flow, include the current specification and a dated source archive. Follow the [tool development rules](docs/tool-development.md).
3. Reuse the Mantine theme, Lucide icons, and English/Vietnamese message catalogs. For UI changes, include a screenshot or describe what you checked at desktop and mobile widths.
4. Describe the change, link related issues, and list the checks you ran. Keep real tokens, keys, personal data, and build artifacts out of the pull request.

Contributions are submitted under the repository's [Apache-2.0 license](LICENSE). Identify third-party sources and their licenses where applicable.
