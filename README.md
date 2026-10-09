# Higgsfield rebuild - 8x assignment

[![CI](https://github.com/KaustubhAs/higgsfield-rebuild/actions/workflows/ci.yml/badge.svg)](https://github.com/KaustubhAs/higgsfield-rebuild/actions/workflows/ci.yml)

This 8x assignment rebuild explores an intent-first, Higgsfield-inspired creation studio. Milestone 3 adds optional Cloudflare FLUX and SDXL image generation while preserving Explore templates, local recommendations, sample generation, downloads, Assets, and reusable recipes. Video stays sample-only.

## Run locally

```powershell
npm ci
npm run dev
```

Open http://127.0.0.1:3000. Choose an Explore template, edit the shared controls or apply Guided recommendations, and select Generate samples. Download a result, save it to Assets, or save a named recipe. Reopen Assets to restore the original settings. Guided and Advanced modes share the same draft.

```powershell
npm test
npm run build
npm run test:browser
```

Browser tests use Playwright Chromium on Linux/CI (installed Microsoft Edge by default on Windows) and an isolated Wrangler Pages runtime with mocked Cloudflare responses. The production build exports static files to `out/`, suitable for Cloudflare Pages. No deployment or live inference is performed by these commands. For real generation, configure `.dev.vars`, run `npm run build` followed by `npm run dev:pages`, and open port 8788. See [Cloudflare setup and manual testing](docs/CLOUDFLARE.md). `next dev` remains sample-only and makes no real-provider endpoint requests.

## Current limits

Image Studio offers a local sample provider and optional server-side Cloudflare inference. Real and sample outputs are labeled separately. Image downloads are PNG files; video downloads are sample SVG storyboards, not playable videos or AI inference. Guided suggestions use deterministic rules, not an LLM. Real generation is limited to one image per request and references are not sent to real models.

Drafts use localStorage; Assets and recipes use IndexedDB with migration from the previous localStorage library. Results must be explicitly saved to survive refresh. The library supports up to 40 assets and 40 recipes subject to browser quota, with visible storage errors. References are resized thumbnails stored locally, never uploaded. Clearing browser data removes this origin's drafts and library. There is no account sync or recipe comparison. The owner manually verified both real models locally; automated tests use fixtures. Public real inference is available when explicitly enabled with valid server-side credentials.

## Automatic agent capture

Codex records submitted user prompts and final assistant responses automatically through the project `UserPromptSubmit` and `Stop` hooks. Logs in `.agent-logs/` contain UTC timestamps and per-entry model names and are included in the submission. Reasoning, tool calls, and intermediate output are excluded.

Capture has passed canary verification in two distinct Codex sessions and a Unicode check. [CAPTURE-TEST.md](CAPTURE-TEST.md) contains the evidence and failure history. [CAPTURE-SETUP-STATUS.md](CAPTURE-SETUP-STATUS.md) preserves the original Windows encoding failure and its fix. Historical log entries must remain unchanged.

See [the setup guide](docs/SETUP-CAPTURE.md) for installation and verification. Helpers live in `scripts/capture/`; hook configuration and implementation remain in `.codex/`. Hook commands contain machine-specific paths, and hooks require Codex trust on each installation.

```powershell
python -B scripts/capture/verify-capture.py --name "Kaustubh Sonawane"
python -B scripts/capture/test-capture-encoding.py
python -B scripts/capture/test-capture-lifecycle.py
python -B scripts/capture/check-capture-hooks.py
```

Verification is read-only by default and preserves the existing report.

## Cost constraint

The assignment must incur zero additional cost. Future implementation must stay within existing access and free resources; do not introduce paid APIs, subscriptions, infrastructure, or usage charges. Capture helpers use the Python standard library and the existing Codex installation, with no additional paid dependencies.

## Deployment and product direction

Guided Mode starts from creative intent and offers explicit Review / Apply recommendations using local rules. Advanced Mode exposes exact model capabilities without losing the draft. Reusable recipes preserve settings alongside saved outputs. Video remains clearly labeled sample storyboards.

See [deployment instructions and security limitations](docs/DEPLOYMENT.md). GitHub-integrated Pages uses `npm run build`, output `out`, production branch `main`, and Node 22. Root `functions/` deploys with the export; GitHub Actions does not deploy. The existing Wrangler project name is `frame-studio`; check the dashboard before connecting or creating anything.

Public real generation uses the owner's Cloudflare Workers AI free-tier allowance. Cloudflare currently documents **10,000 Neurons per day**, not a fixed number of images: consumption varies by model and request settings. The application imposes **no per-user, per-session or global generation quota**. Anyone with access to the public endpoint can consume the account's available allowance. When it is exhausted, real requests may fail until reset; Sample Mode remains available through an explicit switch. See [Cloudflare pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/).

The emergency kill switch is `ENABLE_REAL_GENERATION=false` in Cloudflare production variables. Save it, redeploy production so the changed binding is active, and verify `/api/generate` reports `available:false`; do not assume saving changes instantly updates an existing deployment. The flag defaults to disabled when unset. **Do not enable paid plans, billing, or paid overage for this assignment.** Request validation is not abuse prevention or a guaranteed cost cap.

## CI

The CI workflow runs on every push, pull requests targeting main, and manual dispatch. It uses the standard Ubuntu runner, Node 22, `npm ci`, unit tests, static export verification, repository credential-pattern/evidence checks, whitespace checks, and Chromium browser tests against isolated Wrangler with mocked Cloudflare responses. It needs no Cloudflare or GitHub Actions secrets. Superseded branch runs are cancelled; failed browser reports, screenshots and traces are retained for three days.

View results in this repository's **Actions > CI** tab (badge above). The first GitHub run must confirm Linux runner behavior and artifact upload. Pages deployment is independent of CI; a successful Pages build does not imply tests passed. Review CI before publishing or merging.

Run the same checks locally:

```powershell
npm ci
npm run check:security
npm test
npm run build
npm run check:export
npx playwright install chromium
$env:PLAYWRIGHT_BROWSER = 'chromium'
npm run test:browser
git diff --check
```

On Linux use `npx playwright install --with-deps chromium` and `PLAYWRIGHT_BROWSER=chromium npm run test:browser`. Public repositories can use standard free GitHub-hosted runners; for private repositories check included minutes/storage and keep paid overage disabled. No paid runner is configured. Security scans are heuristic, report paths rather than matching values, and cannot certify that all secrets are absent. Historical capture files are never rewritten.
