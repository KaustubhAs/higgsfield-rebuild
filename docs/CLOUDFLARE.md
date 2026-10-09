# Cloudflare image generation — Milestone 3

Next.js remains a static export. `functions/api/generate.js` is a Cloudflare Pages Function, not a Next route. Only Image Studio offers real inference. Video remains sample-only. No real request ever silently substitutes sample artwork.

## Local configuration and one manual inference

1. Copy `.env.example` to `.dev.vars` if that file does not already exist. Keep existing values if you already configured it. Do not commit, print, screenshot, or paste the file into chat.
2. In a local editor, set `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` (Workers AI permission), and `ENABLE_REAL_GENERATION=true`. These are server-only values. Never add `NEXT_PUBLIC_` prefixes. `.env.local` is not the Pages Functions secret file; use `.dev.vars` for Wrangler.
3. Run:

```powershell
npm ci
npm run build
npm run dev:pages
```

4. Open http://127.0.0.1:8788/image/. Select FLUX.1 Schnell, use Standard (4 steps), batch 1, enter “A cinematic product photograph of a coffee cup”, and click **Generate 1 real image**. The output must say **Real AI image - Cloudflare**, with actual dimensions and the selected model. Download the PNG, save to Assets, refresh, and reopen its recipe. To test SDXL separately, select Stable Diffusion XL, 3:4 (768 × 1024), Standard (10 steps), batch 1.

Use the existing free Cloudflare account and remain on its free allowance. No billing or paid resources are provisioned by this repository. Quota errors stop generation; there is no paid-provider fallback. Missing credentials or an unset enable flag disable real generation and expose an explicit Sample Mode option.

`npm run dev` on port 3000 supports sample development only. In development builds the client does **not** call `/api/generate`; it explains that Wrangler is required. Rebuild after application changes when using `dev:pages`. Restart Wrangler after changing `.dev.vars`.

## Capabilities and request mapping

- **FLUX Schnell:** prompt (1–2048 characters), steps 4/8 for Standard/High. No ratio is sent; the UI explicitly selects model-default dimensions. Response is REST JSON `result.image` base64, decoded server-side and signature checked.
- **SDXL:** prompt, width, height, num_steps 10/20. Bounded size menu: 1:1 = 1024×1024; 4:5 = 768×960; 3:4 = 768×1024; 16:9 = 1024×576; 9:16 = 576×1024. The documented range is 256–2048 on each dimension; these presets fit it. They are schema-valid presets, not a claim that every preset has been live-tested in this repository. The REST binary image is signature checked.
- SDXL documents image inputs, but image conditioning is deliberately not implemented here. References, elements, and creative direction remain recipe data and are clearly marked as not sent for real inference. Express direction in the prompt; Guided recommendations can help compose it.
- Real generation allows one image per request. A later failure preserves previously completed results. Outputs are kept in the active tab until explicitly saved. Cancellation aborts the client request and attempts upstream cancellation; work already running may still consume quota.
- The server accepts only the allowlisted models, parameter names, preset steps and sizes. No native batch field or arbitrary model/URL is accepted. It returns sanitized errors, never Cloudflare response bodies, account identifiers, tokens, or request logs.

Official references consulted during implementation: [FLUX schema](https://developers.cloudflare.com/workers-ai/models/flux-1-schnell/), [SDXL schema](https://developers.cloudflare.com/workers-ai/models/stable-diffusion-xl-base-1.0/), [Pages local development](https://developers.cloudflare.com/pages/functions/local-development/). The FLUX usage example mentions seed, but its parameter schema and the user-validated contract restrict this integration to prompt and steps.

## Persistence and provenance

Drafts stay in localStorage. Assets and recipes use IndexedDB, storing image data with immutable recipe and actual inference settings. Existing Milestone 2 localStorage libraries are imported on the first write; the original copy is preserved. Up to 40 assets and 40 recipes are supported, subject to browser quota. Storage errors never report success. PNG downloads use `cloudflare-image-...` for real images and `sample-image-...` for samples. Video downloads remain labeled SVG storyboards.

Libraries are local to the browser **and origin**. Ports 3000 and 8788 have separate libraries. Clearing browser data removes saved work. No cloud sync or background job service exists.

## Automated verification

```powershell
npm test
npm run build
npm run test:browser
npx playwright test -g "next dev never requests"
```

`test:browser` creates an isolated temporary Wrangler project, copies only code, supplies no real credentials, and never reads the repository's `.dev.vars` or `.env.local`. It checks the actual missing-env and validation paths, then uses a test-only copied route to run the same handler with mocked Cloudflare JSON/binary responses inside workerd. Playwright tests the production export, intercepting inference responses with explicit fixtures. These tests prove transport and UI behavior, **not live model inference**. Test-only routes are never written to the application's functions directory. The separate development test proves no real endpoint is requested under `next dev`.

Initial verification found that Pages rejects custom `--config` paths. The harness now uses a standard `wrangler.toml` in its isolated working directory. No deployment or live inference is performed by automated checks.

## Deployment and remaining limits

See [Milestone 4 deployment and security instructions](DEPLOYMENT.md). Real inference works locally and on public Pages when ENABLE_REAL_GENERATION=true and server credentials are configured. Public use consumes the owner's free allowance; no per-user, per-session or global application quota is imposed. When Cloudflare rejects requests, users can explicitly switch to Sample Mode. The deployment guide covers enabling inference and the emergency kill switch. The server uses a 90-second timeout; image responses above 12 MB are rejected. Real video, image conditioning, recipe comparison, and cross-device sync remain outside this milestone.
