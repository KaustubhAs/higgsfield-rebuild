# Implementation plan

Status: planning only, 2026-10-08. No dependencies installed, application files created, accounts provisioned or inference requests made during this phase. The capture setup remains outside application scope. Screenshot facts are in [recon/observations.md](recon/observations.md); product choices are in [PRODUCT-DECISIONS.md](PRODUCT-DECISIONS.md).

## 1. First end-to-end slice

Explore preset → Image Studio in Guided Mode → editable recommendation → one generation → result preview/download → saved recipe → reuse with a changed prompt → settings comparison → Assets → browser refresh restores saved output and recipe.

Use a mock provider first to establish that loop, explicitly as a sample preview. Real-image integration is required if a reliably free provider passes validation. Do not delay the loop to recreate Higgsfield's full navigation or build multiple providers.

Acceptance: a new user completes this sequence without choosing a model first; switching modes loses no work; a failed request never becomes a fake success; returning to Assets after refresh displays the media or an explicit storage failure, not a broken object URL.

## 2. Provider research and gates

Sources checked 2026-10-08. Documentation establishes candidates, not account-specific availability. Do not enter a card, buy credits, enable paid plans or bypass quotas. Run the account checks before application coding; run the minimal deployed integration spike first when implementation is authorized.

### Image: Cloudflare Workers AI — recommended candidate

[Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/) documents 10,000 free Neurons daily, reset at 00:00 UTC; further use on the Free plan fails rather than requiring us to consume paid overage. Some models require billing, so free allocation does not mean every model is free. Keep the account on Workers Free and do not enable prepaid AI Gateway credits. Account eligibility still needs confirmation.

[FLUX.1 Schnell's model page](https://developers.cloudflare.com/workers-ai/models/flux-1-schnell/) documents `@cf/black-forest-labs/flux-1-schnell`, prompt length 1–2048, steps default 4 and maximum 8, and a base64 image response. Its published inputs do not establish ratio, seed, image-reference or negative-prompt support. Start with prompt plus four steps, one image; expose steps in Advanced only. Inspect the returned image type/dimensions instead of inventing them.

**Gate I, budget 60 minutes once testing is authorized:** confirm a no-card Workers Free account, bind AI, run three small genuine requests with distinct prompts, record success/latency/dimensions/response size without secrets, and verify two outputs are prompt-relevant rather than a reused fixture. Exercise unavailable/quota errors via controlled mock responses rather than burning the quota. Target three successful requests within a 60-second application timeout; this is our demo acceptance target, not a provider SLA. Check model license/use restrictions and account quota in the dashboard. If binding access demands payment, stop that route.

### Video: Hugging Face Spaces — optional experiment

[ZeroGPU documentation](https://huggingface.co/docs/hub/spaces-zerogpu) distinguishes free use of existing Spaces from hosting them: personal ZeroGPU hosting requires PRO, so we will not duplicate/host one. Shared usage has quotas and priority differences. A free interactive demo is not a guaranteed backend for a public app.

Concrete candidates: [Wan2.2 14B Fast by zerogpu-aoti](https://huggingface.co/spaces/zerogpu-aoti/wan2-2-fp8da-aoti-faster) and [LTX Video ZeroGPU Optimized by DeepRat](https://huggingface.co/spaces/DeepRat/LTX-Video-ZeroGPU-Optimized). Both pages displayed Running on Zero when inspected. No inference, endpoint schema, reuse permission, file lifetime or queue performance was validated. One attempted API-documentation fetch returned 503; this is a research limitation, not evidence that either inference endpoint failed.

**Gate V, 45 minutes research plus at most 45 minutes spike:** inspect the selected Space's API/schema and source terms, confirm server-side free-token use without paid hosting/card, make two short image-to-video requests on the eventual runtime, inspect queue/event protocol, playable output, output-host allowlist and expiry. Accept only if it can complete inside a bounded 120-second wait without introducing durable jobs. If provider polling is needed, use its job/event ID through a small stateless server proxy; no custom queue. Shared owner-token quota must be disclosed. Do not proxy arbitrary URLs, automate third-party UIs, bypass login restrictions or rotate accounts.

**Decision:** real video is P1, not a dependency of the image loop. Stop at the timebox if access, API stability, upload size or queue duration is unreliable. Preserve the Video Studio sample workflow and disclose that live video is unavailable.

### Hosting decision

Recommend **Next.js static export on Cloudflare Pages plus Pages Functions** in one project. Cloudflare documents [static Next exports](https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/) and [Workers AI bindings in Pages Functions](https://developers.cloudflare.com/pages/functions/bindings/). This keeps UI and generation API on one origin without deploying Next SSR. Workers advertises [free signup without a credit card](https://www.cloudflare.com/products/workers/); verify this for the actual account before proceeding.

[Pages Functions pricing](https://developers.cloudflare.com/pages/functions/pricing/) counts functions against Workers quotas. [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) currently list 100,000 requests/day and 10 ms CPU/request on Free; network waiting is not CPU time. Large JSON/base64 processing can still consume CPU, so measure the real image response path. Limit routing to `/api/*`, leaving static files outside the Function.

Alternative, not the default: Vercel Hobby with Next route handlers, only if this assignment qualifies under its [personal/non-commercial restriction](https://vercel.com/docs/plans/hobby) and no card is required in actual signup. Do not assume a hiring/paid assignment qualifies. Its [function limits](https://vercel.com/docs/functions/limitations) include 4.5 MB request/response payloads, relevant to images and video uploads. Keep provider logic portable but do not implement two hosts preemptively.

## 3. Architecture

- Next.js App Router, JavaScript, regular CSS with CSS variables; no Tailwind, TypeScript migration, component framework or global state dependency.
- Export the four static route shells; interactive studio/library views are client components. Do not read browser storage during server rendering. Hydrate local data after mount and show a brief loading shell.
- Pages Functions handle `/api/capabilities` and `/api/generate` with standard Web APIs. There are **no Next POST route handlers or server actions** in the static export. This distinction avoids a deployment that works locally but has no backend when exported. [Next static-export limitations](https://nextjs.org/docs/app/guides/static-exports) explain the server-feature boundary.
- Browser calls a small generation client; server validates requests, chooses the configured adapter and normalizes results/errors. Cloudflare AI binding stays server-side; an optional HF token is an environment secret, never `NEXT_PUBLIC_*` or localStorage.
- A local React context/reducer owns the draft and current job. Persistence helpers own recipes/history/media. Do not add Redux, authentication, SQL, Redis, object storage or background workers.
- No inference on navigation, hydration or input changes. A deliberate Generate click is the only trigger. Frontend development defaults to the mock provider, with no remote AI binding calls.

### Proposed files (not created in this phase)

- `app/layout.js`, `app/page.js` (Explore), `app/image/page.js`, `app/video/page.js`, `app/assets/page.js`, `app/globals.css`.
- `components/AppShell.js`, `ExploreGallery.js`, `StudioWorkspace.js`, `GuidedControls.js`, `AdvancedControls.js`, `GenerationStatus.js`, `ResultPreview.js`, `RecipePanel.js`, `RecipeCompare.js`, `AssetLibrary.js`.
- `lib/recommendations.js`, `lib/capabilities.js`, `lib/generation-client.js`, `lib/storage.js`, `lib/media-store.js`; plain functions over a general framework.
- `lib/server/providers/mock.js`, `cloudflare.js`; optional `huggingface.js` only after Gate V. Never import this server directory into browser components.
- `functions/api/capabilities.js`, `functions/api/generate.js`; optional video status handler only after Gate V.
- `public/samples/` with small licensed/owned fixtures, poster images and attribution manifest. Screenshots are design references, not automatically licensed output media.
- Minimal future `next.config.mjs` for static export/unoptimized images, Cloudflare configuration, and API-only route inclusion. Avoid next/image server optimization, runtime dynamic routes and native image-processing dependencies.

Desktop composition: four-item global navigation, left composer roughly 320–360 px, flexible large preview, compact history/recipe access. Narrow screens stack composer above result with a reachable Generate action and no overlay hiding fields. Use neutral dark surfaces, lime accent, clear focus rings, labeled inputs and readable type. Avoid animation unless it communicates a real state.

## 4. Data and persistence

All records have `schemaVersion: 1` and UUIDs. Treat settings snapshots as immutable; labels can change without altering the generation record.

- **Draft:** `kind` image/video, `mode` guided/advanced, `intent`, `goal`, `style`, `prompt`, `providerId`, `modelId`, supported `settings`, optional `sourceAssetId`, `customized`, `recommendationVersion`.
- **Generation:** `id`, `projectId`, `createdAt`, `status`, request snapshot, `recipeId` if used, actual provider/model, `provenance` real/sample, `assetId`, optional normalized error and elapsed time. Save actual effective settings separately if the provider reports them; never claim requested unsupported values were applied.
- **Asset:** `id`, `kind`, `generationId`, `mediaKey` or bundled sample path, MIME, measured width/height and duration when available, prompt summary, provenance, creation time. Blob URLs are temporary display handles, not persisted paths.
- **Recipe:** `id`, name, kind, creation time, prompt/intent/settings snapshot, provider/model compatibility and optional source recipe ID. Applying fills the form; it never starts inference. Save changes as a new recipe; compare two snapshots and highlight changed fields. Same settings do not imply deterministic pixels.
- **Project:** one default `{id, name}` project for P0; user-created projects and reassignment are P1. Do not build a project management product.

Use namespaced/versioned localStorage for drafts, bounded history metadata (latest 50), recipes (up to 30) and project metadata. Store generated image blobs in a small IndexedDB media store, not base64 in localStorage. Use one media object store with get/put/delete helpers and a 20-output retention target; warn before evicting older local media. Keep bundled samples as paths, not duplicated blobs. This small browser store is justified by image size and refresh persistence, not server/database complexity.

On quota/private-mode failure, keep the visible output available in memory, offer download, and say Not saved on this device. Never display Saved before both media and metadata persist. Corrupt storage must show a recoverable notice and explicit reset option, not silently erase recipes. Reloading an in-flight job marks it interrupted; do not resubmit. Clearing browser data loses work; no device sync. Recipe JSON export is P1.

## 5. Provider contract

Conceptual contract, not implementation code:

- `getCapabilities()` returns provider/model ID, media kinds, supported fields/ranges, status (`real`, `sample`, `unavailable`) and limitations. Only expose public availability, never credentials or invented remaining quota.
- `generate(request, {signal})` resolves a normalized result or normalized error. Request includes kind, prompt, validated settings, source media only when supported, and a client request ID. The server, not a browser-supplied URL, selects the model endpoint.
- Result includes kind, MIME, image base64 or approved media reference, actual provider/model, provenance and any effective settings. The browser decodes base64 into a Blob; avoid unnecessary server re-encoding under the Free CPU limit. Measure payload size before finalizing this transport.
- Errors use codes such as `INVALID_INPUT`, `UNSUPPORTED_SETTING`, `UNAVAILABLE`, `QUOTA_EXCEEDED`, `TIMEOUT`, `BLOCKED`, `UPSTREAM_ERROR`; expose a useful message and retryability, not upstream stack traces, tokens or raw requests.
- The mock adapter selects deterministic licensed fixtures, returns `provenance: sample`, and supports controlled delay/error scenarios. It never claims the output reflects arbitrary prompt edits. Sample loading says Loading sample, not Rendering your image.
- A live adapter failure remains a failure. Only a separate explicit Preview sample action invokes the mock adapter. Real output can never inherit a sample's label or vice versa.

Server checks: POST only, bounded prompt/request size, allowed model/field values, known output domains, same-origin policy, and no arbitrary fetch proxy. One active request per browser, disabled duplicate submit and short UI cooldown reduce accidents but are **not** durable global rate limits. The hard no-spend protection is a verified Free-only account; abuse can exhaust quota and must degrade honestly. If public traffic threatens the demo, disable real generation server-side and offer samples rather than adding an auth/queue system. Do not claim a process-local counter prevents distributed abuse.

## 6. Guided and Advanced behavior

Guided starts with What are you creating? and optional Product / Portrait / Cinematic scene chips. The user writes a goal. Recommend uses local rules to produce an editable prompt and a short rationale, e.g. controlled lighting and a simple background for a product hero. Ambiguous intent gets a neutral default and visible assumptions, not a fake confidence score.

Default model is the validated free model; default steps 4 for the initial candidate. Show a compact recommendation summary and an Advanced link. Do not promise the user's portrait/square target will be an actual output ratio unless the chosen provider supports it. Unsupported reference images and negative prompts are absent.

Advanced shows the same editable prompt, actual model/provider and capability-backed controls. If only one real model exists, explain that rather than filling a dropdown with unavailable brands. Switching to Guided preserves customized values. Recommending again previews changes and requires Apply; recipe loading respects model compatibility and surfaces unsupported settings instead of dropping them silently.

Video Guided Mode recommends a simple motion description from the selected image context and a template. It does not analyze the image with AI. In sample mode, requested motion is a saved concept only; the selected fixed clip is explicitly not generated from the user's reference. Duration/resolution selectors appear only for validated real capabilities; otherwise show the sample's actual properties.

## 7. Lifecycle and interaction states

Image: idle → validating → submitting → waiting for provider → result ready → saving locally → saved. Validation returns focus to the offending field. Show an indeterminate indicator and elapsed time, never a fabricated percentage or queue position. Keep the submitted snapshot visible while allowing a separate draft for the next attempt.

Failure keeps prompt/settings intact and offers an appropriate retry. Timeout/offline/provider error are distinct from content rejection and quota exhaustion. No automatic inference retries: they can duplicate work and consume quota. Cancel stops waiting with AbortController; disclose that upstream compute may continue if cancellation is unsupported. Use request IDs to ignore stale results.

Empty state: example intent and one next action. Unavailable provider: explanation plus explicit sample action. Quota exceeded: state that free access is exhausted; show reset time only if known. Saved result: preview, download, Save recipe, Reuse settings and Open in Assets. Download failures and storage failures are visible states, not silent console errors.

Optional video: add provider-backed queued/running states only if actual progress events exist. A reload does not promise job recovery. External output links may expire; if durable local video copying cannot be validated within scope, require immediate download and label link-only assets as temporary. Bundled sample clips remain playable offline after loading.

## 8. Priorities

### P0 — required for a strong submission

- Four working destinations and recognizable responsive studio shell; Explore presets apply real draft values.
- The complete image workflow, Guided/Advanced shared draft, editable recommendation and supported manual controls.
- Mock provider for frontend development with permanent sample provenance; visible unavailable/loading/error states.
- Real image adapter if Gate I confirms reliable free access; otherwise explicit unmet-requirement disclosure and samples. Do not quietly downgrade this requirement.
- Save/reuse recipes and compare two settings snapshots; local history, image persistence, downloads, Assets search by prompt and image/video/sample filtering.
- Video Studio with meaningful concept setup, image selection, sample playback and recipe reuse; no fake inference claim.
- Keyboard/focus/contrast basics, narrow-screen layout, missing-config and storage error handling.
- Free deployment smoke test, server-only provider access, no secrets in client assets or public capture logs, preserved capture hooks.

### P1 — useful after the core loop works

- Real video adapter, conditional on Gate V. Highest schedule risk; first feature cut.
- Visual side-by-side result comparison in addition to required settings comparison.
- Favorites, named projects and recipe export/import; convenient but not necessary to prove the thesis.
- One additional image model only if demonstrably free and adding a meaningful capability, not just choice.

### P2 — omit/cut first

- Audio, video timelines, multi-shot scenes, ad multiplication, identity training, image editing brushes, masks, upscaling and 3D.
- Accounts, collaboration, cloud persistence, custom queues, paid GPU hosting and microservices.
- Model catalog parity, social feed, analytics dashboard, billing, credits store and promotional campaigns.
- LLM-powered guidance, arbitrary workflow graphs, advanced recipe branching or benchmark scores.

## 9. Milestones within 24 hours

Relative budget once implementation starts; not a claim about time already elapsed. Provider research performed now reduces but does not remove the gates. Freeze scope at each checkpoint.

1. **Hours 0–2: risk gates.** Verify no-card account/model eligibility; prioritize image. When coding is authorized, deploy the smallest static shell plus one API Function and exercise real image transport. Gate V gets at most 45 minutes research here; stop if inaccessible. Exit: confirmed host/API route or documented fallback. Do not build elaborate UI against an unproved runtime.
2. **Hours 2–7: mock vertical slice.** Four routes, studio shell, intent recommendation, sample generation, result, recipe save/reuse, Assets and refresh persistence. Exit: primary flow works with permanent sample labeling.
3. **Hours 7–11: real image and failure handling.** Swap adapter, validate capabilities, input limits, cancellations and quota/unavailable responses. Exit: deployed real image returned and saved when free access is available, or explicit documented failure with honest fallback.
4. **Hours 11–15: product polish.** Recipe settings comparison, Explore presets, library search/filter, responsive layout, keyboard behavior and storage/download edge cases. Exit: a concise reviewer demo with no dead controls.
5. **Hours 15–18: video workspace.** Deliver P0 concept/sample flow. At most 45 minutes real video spike if Gate V remains promising; integrate only if it fits the remaining budget. Otherwise cut live video immediately.
6. **Hours 18–22: verification and deployment.** Browser end-to-end checks, hosted direct-route refresh, persistence, real/sample provenance and provider outage demo. Fix defects rather than adding features.
7. **Hours 22–24: contingency and handoff.** Final smoke test, readme/run instructions, known limitations and demo script. Preserve two hours for deployment breakage. No new providers or architecture changes.

At hour 11, if the image loop still does not work, drop every P1. At hour 18, freeze features. Protect the last four hours from video queues and cosmetic redesigns.

## 10. Test plan

During implementation, add a few focused tests around behavior rather than component markup:

- Recommendation rules: known/ambiguous intent, explicit Apply, no overwrite on mode switch, unsupported settings rejected, loaded recipe compatibility.
- Provider contract: normalized real/sample provenance, distinct prompt outputs for genuine smoke requests, malformed input, missing binding, 429/quota, timeout, cancellation/stale response and no automatic mock fallback. Mock failures do not require exhausting real quotas.
- Persistence: reload image blob + recipe, missing/corrupt metadata, browser storage denial, quota failure and interrupted request. Never mark saved before successful writes.
- Browser path: Explore → Guided → Advanced → generate sample → save/reuse → compare → Assets → refresh; repeat image generation once against the validated free backend on the deployed host. Exercise video sample playback separately.
- Visual/manual: desktop and 390 px viewport, keyboard-only navigation, dialogs close/focus correctly, long prompts, empty library, loading/error readability, reduced motion and no layout shift when media loads.
- Security/deployment: no secrets in generated JS/HTML, no arbitrary provider URL, no paid billing enabled, direct-route reload works, `/api/*` is a real Function rather than exported HTML, sample labels persist on cards/details/download names. Check allowed media type and safe download names.
- Capture: run existing read-only verifier and hook registry check; never regenerate historical evidence. A test cannot inspect the current final response until the Stop hook runs after the turn.

## 11. Deployment and fallback procedure

After implementation authorization: use a free Cloudflare account, Next static build to `out`, Pages Functions for API routes, AI binding in preview/production as appropriate, and standard preview URL. No R2, custom domain, paid plan or credit card is needed by the proposed design; actual signup/binding access remains a gate. Use ordinary image elements/unoptimized static images and native video playback. Keep samples small and license-documented.

Use the mock adapter in local frontend development. For integration, use a built Pages preview with Functions and measure CPU/payload behavior; do not assume `next dev` implements Pages Functions. Restrict AI calls to deliberate smoke tests, because local AI bindings still reach the account. Deploy only after the user authorizes implementation/deployment; this plan does not perform either.

Fallback order:

1. If Cloudflare image access works but a setting does not, reduce the UI to verified supported fields rather than invent support.
2. If image inference cannot be made reliably free within Gate I, retain labeled sample mode and report real-image generation as unavailable/unmet. Consider another provider only with a verified no-card path and a short remaining timebox; do not spend the assignment chasing nominal free trials.
3. If free video is unreliable, keep Video Studio with clearly labeled sample clips and saved motion recipes. No pre-rendered clip is presented as a response to the user's prompt.
4. If Pages deployment fails, first diagnose static output/API routing. Use Vercel Hobby only after eligibility/no-card checks; otherwise ship a functioning local run plus documented deployment blocker, not a paid workaround.

## 12. Major risks and unresolved questions

- **Highest risk: real free image inference on the final host/account.** Documentation is promising but not proof. Validate binding entitlement, prompt quality, latency and transport under the Free CPU limit before investing in dependent UI.
- **Video queue/API instability:** free public Spaces may sleep, throttle, change schemas, require consent or expire outputs. Disproportionate time sink; fixed timebox and no durable-queue rescue.
- **Large image payloads:** base64 overhead, decode CPU, browser memory and storage limits can break an otherwise successful call. Keep one output/request, measure actual sizes, decode in browser and use IndexedDB; reject unreasonably large upstream responses safely.
- **Scope explosion:** screenshots advertise many products. Preserve four areas but implement one strong creative loop; defer all editing/audio/catalog parity.
- **Misleading controls/provenance:** ratio, seed or uploaded reference may not influence the selected model. Capability-driven UI and explicit sample provenance are release criteria.
- **Persistence expectation mismatch:** local work is not cloud-backed. State this near Assets and provide downloads; do not promise sync or background completion.
- **Deployment/account uncertainty:** no authenticated provider/dashboard checks were performed in planning. Confirm actual account access and licensing without requesting credentials in chat; provision secrets through provider settings later.
- **Sample rights and visual quality:** no licensed fixture library is present yet. Select owned or appropriately licensed media during implementation; do not scrape the supplied UI imagery into results.

Planning completion does not authorize application coding, dependency installation, committing or pushing. Next action is the no-cost provider/hosting feasibility gate when the user authorizes implementation.
