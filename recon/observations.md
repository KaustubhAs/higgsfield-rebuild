# Screenshot reconnaissance

Reviewed 2026-10-08. Scope: the five supplied PNGs in `recon/screenshots/`. These are static desktop views, not evidence of successful inference, timings, mobile behavior, or interactions behind closed controls. Browser bookmarks and account imagery are not product requirements.

Evidence labels used below: **Observed** means visible in a screenshot; **Hypothesis** means an interpretation to validate; **Proposal** means our rebuild decision. Provider research is kept separate from observations of Higgsfield.

## 1. Homepage.png

**Observed**

- Explore is the active primary navigation item. Image, Video, Audio, MCP, API, AI Influencer, ChatGPT Plugin, Genjutsu, Ads Studio, Effects and a partly clipped Cinema Studio entry share a crowded horizontal navigation bar.
- Search, Pricing, Enterprise, Assets and an account avatar occupy the right side. Pricing carries a 55% OFF badge; some products have Free, New or Top badges.
- Large promotional media cards lead the page: Ads Studio: Ad Multiplier, Nano Banana 2.1, and Higgsfield Ads Studio. Smaller tool/model tiles appear below.
- A Seedance 2.5 banner advertises 30 days of unlimited use, a 54% discount, and a Scale Plan. These are marketing claims in the capture, not verified entitlements.
- A terms-update panel overlays the bottom-right content with a checkbox, linked terms/privacy policy, an age confirmation and an agreement button.
- Visual language: near-black background, charcoal surfaces, rounded media, white headings, muted supporting copy, bright yellow-green emphasis and occasional pink promotion badges.

**Hypothesis**: This is a product-discovery/launch surface rather than a user's personal generation dashboard. The number of model and tool choices may slow a newcomer, but screenshots alone cannot establish measured usability problems.

**Proposal**: Keep media-led Explore and the recognizable dark/lime palette. Replace promotional hierarchy with creative outcomes and one clear Start creating action; omit discounts, sales countdowns and unrelated tools.

## 2. Homepage-nav-video.png

**Observed**

- Video has an open large navigation panel while Explore remains highlighted behind it. The trigger might be hover or click; the image does not establish which.
- The panel separates Features from Models. Visible features include Create Video, Cinema Studio, Faceless Studio, 3D Jutsu, Shorts Studio, Higgsfield Explainer, Canvas, Mixed Media and a partly visible Edit Video.
- Visible model labels include Seedance 2.5, Higgsfield Genjutsu, Gemini Omni Flash 1.1, Kling 3.0, Kling Motion Control, FLUX.3 Video, MiniMax H3, Wan 3.0 and a partly visible Grok Imagine 1.5 Lite. These are labels displayed by the supplied UI, not independently verified model availability.
- Descriptions advertise text/image/video inputs, motion transfer, audio, keyframes and cinematic outputs. One mentions up to 30 seconds and another 2K output. None is demonstrated here.
- The terms-update overlay remains present behind the menu.

**Hypothesis**: Features and model names are alternative entry points into creation. Whether they share a form, pricing system or history is unknown.

**Proposal**: Preserve a direct Video Studio destination but put model selection in Advanced Mode. Do not recreate the mega-menu or every advertised capability.

## 3. image-studio.png

**Observed**

- Image is highlighted in the shared navigation. A promotional influencer banner spans the upper page; an empty-state illustration and large creation headline occupy the center.
- A compact composer sits near the bottom with a prompt field, plus and @ icons, selected model, 3:4 aspect-ratio chip, 1K chip, minus/plus around a 1/4 indicator, Draw control, and a prominent Generate button with a sparkle-like symbol and 2.
- The open model picker has Search and Featured models, descriptions, logos, and Premium/New badges. Nano Banana Pro is selected. Other visible choices include Higgsfield Soul 2.0, Higgsfield Soul Cinema, GPT Image 2.5 Sunburst/Flare, Nano Banana 2.1 and several Seedream variants.
- There is no completed generation, request state, error, upload dialog, seed field or comparison view visible.

**Hypotheses**

- The 2 on Generate may represent a credit cost; the screenshot does not define the unit.
- The 1/4 control likely concerns output quantity, but its exact semantics are not proven.
- Plus/@ likely attach or reference media/elements. Draw likely opens drawing input. Their actual behaviors are unobserved.

**Proposal**: Keep an image-first workspace with a prominent composer and large result stage. Guided Mode asks for intent before exposing a model. Advanced Mode exposes only controls the selected provider actually supports; do not copy ratio/resolution/count controls that the real adapter cannot honor.

## 4. video-studio.png

**Observed — filename caveat**

This screenshot is **Ads Studio / Ad Multiplier**, not a generic Video Studio. Ads Studio is highlighted in navigation and the left card says Ad Multiplier. Do not treat its controls as evidence for all Higgsfield video creation.

- Left panel: reference video upload requesting 4–30 seconds; character/product/clothing references with up to 20 images; a Prompt toggle and text area; Change hook and Change CTA toggles; Quality set to 1080p; disabled Generate button.
- Right stage: History and How it works controls, an example video frame, the heading Say it your way, supporting copy about rewriting scripts/testing calls to action, and a small example carousel.
- The empty form has no uploaded source video or images. The screenshot does not establish why Generate is disabled, whether audio is preserved, or what output is produced.

**Hypothesis**: This workflow adapts an existing ad using references and optional script changes. It plausibly requires a reference video, but validation rules are unproven.

**Proposal**: Borrow the left-controls/right-preview layout and useful explanatory empty state. Build a smaller image-to-video concept workspace, clearly a proposed scope, not an asserted clone. Cut ad recreation, multiple identities, script rewriting, audio and CTA replacement.

## 5. assets.png

**Observed**

- Assets is a dedicated workspace with a left sidebar: Assets, Projects, Favourites, Elements, then Images, Video, Audio and Enhanced filters. All visible counters are zero.
- Main empty state says Nothing here yet and describes collecting generations/projects and reusing them consistently. Start generating is the primary action.
- A callout says search by date and prompt is now possible. No working populated search interface is shown.
- Decorative examples mention organizing, reusing elements and generating. They communicate intended benefits, not proof of completed user flows.

**Hypothesis**: Assets is the shared library across tools. Project grouping and reusable elements are intended concepts; their persistence, permissions and editing semantics are unknown.

**Proposal**: Keep a real local library with image/video/sample filters, a prompt search, result details and reuse settings. Use a default local project; do not reproduce empty categories for unsupported media.

## Information architecture and flows

**Observed architecture:** a broad global product/tool navigation; Explore discovery cards; Image creation composer; video feature/model discovery; a specialized ad workspace; an Assets library with nested organization/media filters. Image and specialized ad workspaces both retain the global header.

**Inferred flows, not click-tested:**

1. Explore or tool navigation → image workspace → prompt/model/configuration → Generate → an output. Only the entry and form states are shown; completion is inferred.
2. Video navigation → choose feature/model → creation workspace. The supplied specialized Ads screen cannot prove the general route.
3. Ad Multiplier → reference video and optional images/prompt → Generate. Requirements, processing and result are unknown.
4. Assets empty state → Start generating → create media → return to Assets. Actual saving/reuse is not demonstrated.

**Proposed rebuild flow:** Explore intent preset → Guided Image Studio → review recommendation → explicit real generation or sample preview → result → save/reuse recipe → compare settings → reopen in Assets. Video uses the same language and asset context without blocking this primary loop.

## UX patterns worth retaining or questioning

- Retain large media, restrained dark surfaces, bright primary actions, a visible model identity in Advanced Mode, compact contextual controls, and empty states with a next action.
- Question early model overload, mixing promotions with creation, and displaying technical choices without an outcome explanation. These are design judgments, not measured defects.
- Add keyboard-operable controls, visible focus, readable contrast, reduced-motion support, responsive stacking and clear errors. The screenshots do not prove their presence or absence in Higgsfield.
- Guided Mode, recipes and explicit settings comparison are requirements/proposals here; none is visible in the supplied evidence. Do not claim Higgsfield lacks them globally.

## Pricing and free-tier evidence

**Higgsfield screenshots only:** visible Premium model badges, Free badges on selected products, discount promotions, a Scale Plan mention, and a possible generation credit indicator. There is no pricing table, exact currency price, daily free quota, signup requirement or credit-card evidence. A Free badge on Ads Studio or AI Influencer does not establish free unrestricted image/video inference or a public API.

**External research, checked 2026-10-08:** Cloudflare documents a capped Workers AI free allocation; Hugging Face documents free use of existing ZeroGPU Spaces with quotas, distinct from hosting one. Neither screenshot claims nor generic platform pages establish successful inference for this account. Detailed sources, provider gates and deployment constraints are in [IMPLEMENTATION-PLAN.md](../IMPLEMENTATION-PLAN.md).

## Unknowns requiring validation

No mobile screenshots; no completed output or real processing/error states; no generic Video Studio form; no recipe screen; no proved generation performance; no detailed account/free-plan access; no evidence of licensed reusable sample assets. These gaps limit reconstruction claims and should not trigger building speculative features.
