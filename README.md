# Torin Tools

Local-first developer utilities for the web and Windows, with an English and Vietnamese interface. Eleven tools process data on your device. Postman Backup connects to the Postman API.

[Downloads](https://github.com/torintran/torin-tools/releases) · [Roadmap](docs/roadmap.md) · [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md)

## Tools

| Tool | What it does |
| --- | --- |
| [Base64](docs/tools/base64/spec.md) | Encode and decode text or files up to 100 MiB in standard or URL-safe Base64. |
| [URL encoder](docs/tools/url-encoder/spec.md) | Encode and decode URL components, full URIs, and form values. |
| [Date-time converter](docs/tools/date-time-converter/spec.md) | Convert between Unix timestamps, ISO/RFC date strings, Excel serial dates, and ObjectId timestamps. |
| [JSON formatter](docs/tools/json-formatter/spec.md) | Format or minify JSON, with optional JSONC input. |
| [Whitespace remover](docs/tools/whitespace-remover/spec.md) | Strip whitespace and line breaks from text. |
| [JWT Decoder](docs/tools/jwt/spec.md) | Inspect claims, sign JWTs, and verify signatures with a supplied key. |
| [UUIDs generator](docs/tools/uuid/spec.md) | Generate Nil, Max, and UUID versions 1, 3, 4, 5, 6, and 7. |
| [CSR Generator](docs/tools/csr/spec.md) | Generate a PKCS #10 CSR and RSA private key locally. |
| [MAC address lookup](docs/tools/mac-address-lookup/spec.md) | Find the registered organization for a MAC address or OUI. |
| [Temperature converter](docs/tools/temperature-converter/spec.md) | Convert Celsius, Fahrenheit, and kelvin. |
| [Text diff](docs/tools/text-diff/spec.md) | Compare texts and highlight added and removed lines. |
| [Postman Backup](docs/tools/postman/spec.md) | Export workspace metadata, collections, environments, and globals to a ZIP. |

Use **Ctrl+K** or **⌘K** to find a tool. Local tools work offline once the web app has cached their assets. Postman Backup requires network access and an API key. [Data handling and privacy](docs/privacy.md).

## Run it

**Windows x64.** Get the installer or portable ZIP from [GitHub Releases](https://github.com/torintran/torin-tools/releases).

**Docker.** From the repository root:

```sh
docker compose up --build -d
```

Open [localhost:4289](http://localhost:4289/).

**Develop locally.** With Node.js (version in `.nvmrc`) and npm:

```sh
npm ci
npm run dev
```

Open [localhost:5173](http://localhost:5173/). For a production build, gateway setup, or Windows packaging, see [Deployment](docs/deployment.md).

## Project documentation

- [Tool specifications and archived references](docs/tools/README.md)
- [Architecture](docs/design.md) and [tool development rules](docs/tool-development.md)
- [Changelog](CHANGELOG.md) and [verification history](docs/verification.md)

## License

[Apache License 2.0](LICENSE) · [Copyright notice](NOTICE). Maintained by Torin Tran.
