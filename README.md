# Higgsfield rebuild - 8x assignment

This 8x assignment rebuild explores an intent-first, Higgsfield-inspired creation studio. Milestone 3 adds optional Cloudflare FLUX and SDXL image generation while preserving Explore templates, local recommendations, sample generation, downloads, Assets, and reusable recipes. Video stays sample-only.

## Run locally

```powershell
npm install
npm run dev
```

Open http://127.0.0.1:3000. Choose an Explore template, edit the shared controls or apply Guided recommendations, and select Generate samples. Download a result, save it to Assets, or save a named recipe. Reopen Assets to restore the original settings. Guided and Advanced modes share the same draft.

```powershell
npm test
npm run build
npm run test:browser
```

Browser tests use installed Microsoft Edge and an isolated Wrangler Pages runtime with mocked Cloudflare responses. The production build exports static files to `out/`, suitable for Cloudflare Pages. No deployment or live inference is performed by these commands. For real generation, configure `.dev.vars`, run `npm run build` followed by `npm run dev:pages`, and open port 8788. See [Cloudflare setup and manual testing](docs/CLOUDFLARE.md). `next dev` remains sample-only and makes no real-provider endpoint requests.

## Current limits

Image Studio offers a local sample provider and optional server-side Cloudflare inference. Real and sample outputs are labeled separately. Image downloads are PNG files; video downloads are sample SVG storyboards, not playable videos or AI inference. Guided suggestions use deterministic rules, not an LLM. Real batches are bounded to two requests and references are not sent to real models.

Drafts use localStorage; Assets and recipes use IndexedDB with migration from the previous localStorage library. Results must be explicitly saved to survive refresh. The library supports up to 40 assets and 40 recipes subject to browser quota, with visible storage errors. References are resized thumbnails stored locally, never uploaded. Clearing browser data removes this origin's drafts and library. There is no account sync or recipe comparison. Live Cloudflare inference through this app still needs the documented manual account test; automated tests use fixtures.

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
