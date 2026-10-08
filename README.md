# Higgsfield rebuild - 8x assignment

This 8x assignment rebuild explores an intent-first, Higgsfield-inspired creation studio. Milestone 2 includes Explore templates, consistent Image and Video Studio controls, explicitly applied local recommendations, sample generation, downloads, saved Assets, and reusable recipes.

## Run locally

```powershell
npm install
npm run dev
```

Open http://127.0.0.1:3000. Choose an Explore template, edit the shared controls or apply Guided recommendations, and select Generate samples. Download a result, save it to Assets, or save a named recipe. Reopen Assets to restore the original settings. Guided and Advanced modes share the same draft.

```powershell
npm test
npx playwright test
npm run build
```

Browser tests use installed Microsoft Edge and start the development server automatically. The production build exports static files to `out/`, suitable for Cloudflare Pages. No deployment is performed by these commands.

## Current limits

Generation is a local mock provider, with explicit sample labels throughout. Image downloads are PNG exports of original procedural SVG illustrations; video downloads are SVG storyboards, not playable videos or AI inference. Model and setting choices affect samples and metadata, but do not invoke real models. Guided suggestions use deterministic rules, not an LLM.

Drafts are stored on this browser. Results must be explicitly saved to Assets to survive refresh; named recipes are saved separately. The library supports up to 40 assets and 40 recipes within a conservative localStorage size limit, with visible storage errors. References are resized thumbnails stored locally, never uploaded. Clearing browser data removes this device's drafts and library. There is no account sync, real provider integration, or recipe comparison.

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
