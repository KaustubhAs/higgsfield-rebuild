# Product decisions

Planning only, 2026-10-08. No application code or provider integration exists yet. Evidence: [screenshot observations](recon/observations.md); execution details: [implementation plan](IMPLEMENTATION-PLAN.md).

## Product thesis

Let people start with the creative outcome they want, then recommend a small set of understandable choices. Keep Higgsfield's media-led image/video studio character while revealing manual model and configuration controls only when useful. Make successful settings reusable through recipes, with honest distinctions between real generation and sample previews.

## Audience and first complete workflow

Assumed primary user: a solo creator making a cinematic product/lifestyle visual for a social post, without specialist model knowledge. This is a scope choice for the assignment, not a conclusion about Higgsfield's actual audience.

First workflow: choose a cinematic product concept in Explore → enter a goal in Guided Image Studio → see recommended prompt/model/settings and a short explanation → generate one image → inspect/download it → save its settings as a named recipe → reuse it with one change and compare the two settings → reopen results in Assets after refresh. Build this with the mock provider first, then replace it with a validated real provider. A sample must remain labeled throughout.

## Keep

- **Four areas: Explore, Image Studio, Video Studio, Assets (P0).** Familiar structure makes the rebuild recognizable. Each destination must do something useful; the image loop receives most implementation time.
- **Dark media-led studio and lime primary action (P0).** Large previews and a compact controls panel support UX quality without recreating every marketing card. Use an original wordmark rather than imply an official Higgsfield service.
- **Manual prompt/model control (P0).** Advanced Mode keeps experienced users productive. One real available model is acceptable; a catalog full of nonfunctional choices is not.
- **Library and reuse (P0).** Saved outputs and settings make the experience more than a one-shot generator. Local persistence is sufficient for this demo.

## Change

- **Intent before configuration (P0; usability, product judgment).** Guided Mode has a freeform goal, optional creative-intent chips, and a reviewable recommendation. Explain why defaults were chosen. Use deterministic rules/templates initially; do not imply an LLM understood the prompt or silently rewrite user intent.
- **Progressive disclosure without losing work (P0; functionality, UX).** Guided and Advanced edit one shared draft. Advanced shows the actual submitted prompt and only supported parameters. Returning to Guided preserves manual changes and marks the draft Customized; new recommendations require an explicit Apply action.
- **Generation Recipes (P0; functionality, differentiation).** Save a name and immutable settings snapshot, reload it, save a changed copy, and compare two snapshots with changed fields emphasized. This is settings comparison, not a scientific model leaderboard or a promise of identical pixels.
- **Provider honesty (P0; trust, judged functionality).** Real images are labeled with the real model; samples have a persistent Sample — not AI-generated in this session label. A real failure offers an explicit sample-preview action instead of silently replacing inference with a fixture. Download filenames and metadata retain sample provenance.
- **Useful Explore (P0; speed to outcome).** Six curated creative starting points at most. Each applies a visible prompt/style preset and opens the correct studio; no fake likes, community feed or inactive marketing links.
- **Smaller Video Studio (P0 shell, P1 real inference).** Let users select a local image, describe motion, review settings, play a clearly labeled sample and save/reuse a video recipe. The supplied video screenshot is Ad Multiplier, so our generic video flow is a deliberate proposal. Only expose real video generation after its API passes the feasibility gate.
- **Outcome-aware but capability-honest defaults (P0).** The initial FLUX Schnell candidate documents prompt and steps only. Recommend a composition in the prompt but do not sell it as an API aspect-ratio setting. Unsupported seed, reference-image or resolution controls are omitted rather than decorative.

## Cut

- **Audio, avatar/identity tools, ad recreation, timelines, multi-shot editing, inpainting and 3D (P2).** Large engineering/interaction surface; weak contribution to proving the core creative loop in 24 hours.
- **Authentication, collaboration, cloud sync, billing and subscriptions (P2).** No judged requirement justifies their cost and implementation time. A local-only notice is the explicit tradeoff.
- **Model marketplace, live community feed, promotional pricing and artificial credits (P2).** They reproduce complexity without improving real outcomes. Expose only genuine availability and errors.
- **An LLM chat assistant for Guided Mode (P2).** Adds another provider, latency and quota dependency. Transparent rules cover a few intentional creative workflows more reliably.
- **Custom GPU hosting and durable job infrastructure (P2).** Do not build queues/microservices or add paid compute to rescue video. External free video is optional and bounded by a strict timebox.

## Explicit tradeoffs

- One polished image workflow beats broad but incomplete screen coverage. Video remains a useful, honestly labeled concept/sample workspace if free inference fails.
- Free-tier output quality, availability and supported controls can be narrower than Higgsfield. Show these limitations; do not claim premium model parity, reproducible seeds or unlimited generations.
- Rule-based recommendations are less flexible than a conversational agent but explainable, fast and free. Users can edit everything that will be sent.
- Local persistence avoids accounts and a database, but clearing browser data loses work and devices do not sync. Download matters more than elaborate project organization.
- Static Next.js plus a small Cloudflare Function gives up SSR and Next server actions, neither of which this demo needs. It avoids deploying an entire server-rendering runtime just to proxy generation.
- Samples let the demo remain navigable offline, but cannot satisfy the real-image requirement. If no reliable no-card provider passes, record the requirement as unmet rather than disguising samples as success.

## Scope decisions under deadline pressure

First cut: **live Hugging Face video integration**, including its uploads, polling and expired-link handling. Keep Video Studio and labeled sample playback. Next cut multi-project management, favorites and visual result comparison; preserve basic recipe settings comparison, the real-image attempt, honest status/error handling, accessible controls and local persistence.

Do not add a feature unless it improves working functionality, the intent-first product argument, visible UX quality, or implementation speed. A seed control unsupported by the adapter, an empty audio screen or an animated pricing card fails that test.

## Definition of a strong submission

A reviewer can reach Image Studio from Explore, understand a recommendation, deliberately change it, receive a real image when the validated free provider is available, save and reuse the recipe, compare settings and find the output in Assets. Samples and provider failures are unmistakable. All four product areas work at desktop and narrow widths, and the deployed free-tier build survives a refresh without losing saved local work.
