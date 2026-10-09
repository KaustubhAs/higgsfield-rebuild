# Milestone 4: Pages deployment readiness

## Release decision

The public demo supports real FLUX Schnell and SDXL generation when `ENABLE_REAL_GENERATION=true`, both server credentials are configured, and Cloudflare accepts the request. Missing or disabled configuration keeps Sample Mode available. Video remains mock-only. There is no hostname restriction and no new authentication, database, rate-limiting infrastructure or browser-session limit.

## Protections and limits

- Missing or non-`true` enable flags disable inference. Credentials remain server bindings, never browser variables.
- Requests require JSON, no compression, at most 10,000 body bytes (stream counted), valid bounded prompts, exact model/parameter allowlists, and supported steps/dimensions. Unexpected batch fields and arrays are rejected. Each accepted request invokes inference once; real client batches are also restricted to one.
- Cross-origin browser requests are rejected. Origin headers are not authentication; scripts can forge them.
- Provider errors are sanitized; quota errors return 429 and `Retry-After: 60` (a retry suggestion, not a guaranteed quota reset). Tokens, account identifiers, prompts, upstream bodies and URLs are not logged by application code.
- Static security headers and `/api/*`-only Function routing are included in the export. No application-level shared quota, distributed limiter, authentication or guaranteed cost cap exists.

Public inference uses the owner's Cloudflare Workers AI free-tier allowance. Cloudflare currently documents [10,000 free Neurons per day](https://developers.cloudflare.com/workers-ai/platform/pricing/), with a daily reset at 00:00 UTC. This is not a fixed image count: usage depends on the model and request settings. The application imposes no per-user, per-session or global generation quota. Anyone with access to the public endpoint can consume the account's available inference allowance, including through repeated one-image requests. Other applications using the account share that allowance too.

When the free allowance is exhausted, real requests may fail until reset; users can explicitly switch to Sample Mode. Keep the account on the free plan. **Do not enable paid-plan upgrades, billing, AI Gateway credits or paid overage for this assignment.** Validation and the kill switch do not guarantee zero cost or prevent abuse.

## Emergency disable

Set `ENABLE_REAL_GENERATION=false` in Pages production variables to disable real generation, without changing code. Save and redeploy production to apply the new binding, then confirm GET `/api/generate` returns `available:false` and a valid generation POST returns 503. Treat it as disabled only after verification; existing deployments and already-running requests are not guaranteed to stop immediately when the dashboard value is saved. Sample Mode remains available. See [Pages environment variables and secrets](https://developers.cloudflare.com/pages/functions/bindings/#environment-variables).

## Dashboard steps (manual; no project or deployment created by this work)

1. In Cloudflare Workers & Pages, check whether `frame-studio` already exists. Use the existing Pages project if appropriate; do not overwrite or duplicate it. Repository configuration alone does not prove dashboard existence.
2. Connect the GitHub repository `KaustubhAs/higgsfield-rebuild` through Pages Git integration. If no matching project exists, create a Pages project only after reviewing these settings. Do not choose a paid plan.
3. Production branch: `main`. Root directory: repository root. Build command: `npm run build`. Output directory: `out`. Set `NODE_VERSION=22`. Choose no framework preset if a preset would change those explicit settings.
4. Keep root `functions/` in the repository. Git-integrated Pages builds deploy it alongside `out`; uploading only the static directory is not this deployment method. `public/_routes.json` exports to `out/_routes.json` and invokes Functions only for `/api/*`.
5. Existing `wrangler.toml` declares `name=frame-studio`, `pages_build_output_dir=./out`, and the compatibility date. Confirm the project name matches before deployment. Wrangler-managed settings are the source of truth; do not create competing dashboard overrides. No account ID, token or enable flag is committed in Wrangler configuration.
6. Under **Settings > Variables and Secrets**, choose **Production** and add `CLOUDFLARE_ACCOUNT_ID` (server-only; encryption recommended), `CLOUDFLARE_API_TOKEN` (**Encrypt**, with minimum Workers AI access to the intended account), and `ENABLE_REAL_GENERATION=true` (text). Set `NODE_VERSION=22` for builds. No Workers AI binding is needed: this integration uses the REST API. Never use `NEXT_PUBLIC_*`, put credentials in Wrangler configuration, or add them to GitHub Actions. Keep **Preview** inference disabled unless deliberately enabling it, since it would consume the same account allowance.
7. After reviewing and committing/pushing the changes yourself, check CI and trigger/retry the production deployment with these variables. Pages Git integration builds from `main`; GitHub Actions only tests and never deploys. Variable/secret changes should be followed by a new deployment before testing them. Do not assume an existing deployment has received updated bindings.
8. Open the production URL and check GET `/api/generate` reports `available:true` without account details. In Image Studio > Advanced, select FLUX Schnell, enter a prompt, and generate one image. Confirm real provenance, actual dimensions, valid PNG download, save to Assets, refresh and recipe reuse. Repeat with SDXL and a supported ratio. Check Guided Review/Apply and mode switching, all four pages, favicon and mobile controls. Video must remain labeled sample-only. These two manual real requests consume allowance; automated tests do not.
9. If configuration or quota errors appear, check server-side settings privately and use the explicit Sample Mode switch. Do not upgrade a plan to resolve the error. Preview should report unavailable when its flag is false. Test the emergency disable procedure before handing over the demo, then re-enable and redeploy for reviewers.

Official setup references: [Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/), [build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/).

## Local real generation and verification

Use the existing private `.dev.vars`; do not overwrite it. For a fresh checkout, copy `.env.example` to `.dev.vars` and fill its empty values in a local editor. Set the local enable flag to true. Run `npm run build` then `npm run dev:pages`; open `http://127.0.0.1:8788`. Never print the file. `next dev` is sample-only. `.env.local` is not the Pages secret file.

Automated tests use only placeholder credentials and mocked inference. `npm run test:browser` starts an isolated Wrangler project, exercises Functions in workerd, then runs Playwright against the static export. No real credential files are copied or read. Unit tests also verify enabled public success, disabled public requests, missing credentials and flags, malformed/oversized inputs, batch rejection, capabilities and sanitized errors. The security scan checks tracked text and historical text versions without printing matches; it does not modify capture evidence or prove the absence of every possible secret.

No rate-limit enforcement test is claimed because no supported limiter was installed. Linux runner execution and failure-artifact publishing require the first GitHub Actions run. Live account tests remain manual; the owner previously verified both models locally. No production account settings were accessed during this work.
