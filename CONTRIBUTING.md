# Contributing to Sites.Reviews MCP server

Thanks for your interest in improving the Sites.Reviews MCP server! This is a
small, focused project — a [Model Context Protocol](https://modelcontextprotocol.io)
server that lets AI assistants check a website's trust score and reviews from
[Sites.Reviews](https://sites.reviews). Contributions of all sizes are welcome.

By participating you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Ways to contribute

- 🐛 **Report a bug** — open a [bug report](https://github.com/SitesReviewsTrust/sites-reviews-mcp/issues/new?template=bug_report.yml).
- 💡 **Suggest a feature** — open a [feature request](https://github.com/SitesReviewsTrust/sites-reviews-mcp/issues/new?template=feature_request.yml).
- 📝 **Improve the docs** — README, examples, install snippets for more clients.
- 🔧 **Send a pull request** — see the workflow below.

## Development setup

You need **Node.js ≥ 18** and npm.

```bash
git clone https://github.com/SitesReviewsTrust/sites-reviews-mcp.git
cd sites-reviews-mcp
npm install
npm run build      # compile TypeScript -> dist/
npm test           # live smoke test against sites.reviews
npm start          # run the server over stdio
```

### Project layout

| Path | What it is |
| --- | --- |
| `src/sites-reviews.ts` | Public-API client + input normalisation. Pure and unit-testable. |
| `src/index.ts` | MCP server wiring (`McpServer`, `registerTool`, stdio transport). |
| `test/sites-reviews.test.ts` | Live smoke test that hits the real public API. |
| `examples/` | Copy-paste client configs and usage walkthroughs. |

### Testing your changes against a real client

The fastest loop is the [MCP Inspector](https://github.com/modelcontextprotocol/inspector):

```bash
npm run build
npx @modelcontextprotocol/inspector node dist/index.js
```

Or wire `node /absolute/path/to/dist/index.js` into Claude Desktop / Cursor as a
local server and exercise the tools by chatting.

## Pull request workflow

1. **Fork** and create a branch: `git checkout -b feat/short-description`.
2. Keep changes **focused** — one logical change per PR.
3. Make sure the project stays green:
   ```bash
   npm run build && npm test
   ```
4. Use clear, [Conventional Commit](https://www.conventionalcommits.org/) style
   messages where you can (`feat:`, `fix:`, `docs:`, `chore:`…).
5. Update `CHANGELOG.md` under an `## [Unreleased]` heading when behaviour changes.
6. Open the PR and fill in the template. Link any related issue.

## Coding guidelines

- **TypeScript, strict mode.** The build must pass `tsc` with no errors.
- **No new runtime dependencies** unless there's a strong reason — this server is
  intentionally tiny (`@modelcontextprotocol/sdk` + `zod`).
- **Read-only & anonymous.** The server only makes polite, unauthenticated HTTP
  GETs to the public API. Do not add writes, auth, telemetry, or secret handling.
- **stdout is sacred** — it carries the MCP protocol. Log to `stderr` only.
- Keep tool descriptions and input schemas clear; they're what the model reads.

## Reporting security issues

Please **do not** open public issues for security vulnerabilities. See
[SECURITY.md](./SECURITY.md) for private reporting.

## Releasing (maintainers)

Publishing is automated. On a published GitHub Release, CI runs
[`.github/workflows/publish.yml`](./.github/workflows/publish.yml) and pushes the
package to npm with [provenance](https://docs.npmjs.com/generating-provenance-statements).

1. Bump the version and tag:
   ```bash
   npm version patch   # or minor / major
   git push --follow-tags
   ```
2. Create a GitHub Release for the new `vX.Y.Z` tag (Releases → Draft a new release).
3. CI verifies the tag matches `package.json`, builds, and publishes `@sitesreviews/mcp`.

Requires an `NPM_TOKEN` repository secret (a granular npm token with read/write on the
`@sitesreviews` scope). The token lives only as a GitHub Actions secret — never commit it.

## License

By contributing, you agree that your contributions are licensed under the
project's [MIT License](./LICENSE).
