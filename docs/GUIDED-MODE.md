# Guided Image Studio decisions

Guided and Advanced modes share the same draft, prompt, model and submission path. Guided hides the editable model, quality/step and ratio controls; it shows the current model and format read-only with an Advanced action. Advanced still exposes model-specific controls. Switching modes does not apply recommendations or alter the prompt/model.

## Local recommendation rules

Before this change, keyword rules inferred style, aspect ratio, quality and batch size, but always kept the chosen real model. An inferred portrait format could therefore be replaced with FLUX's native format. The new `recommendImage(draft, context)` boundary returns a proposal (`prompt`, `settings`, `reason`, `source`) without modifying the draft. It is deliberately independent of React and provider requests so a future LLM adapter can return the same reviewable proposal; capability validation and explicit Apply must remain.

Priority order:

1. An explicit desired output format wins. “Flexible” means model-default sizing is acceptable.
2. Otherwise, intended use maps social post to 1:1, story/reel to 9:16, banner to 16:9, and product campaign to 4:5. General creative work permits model-default sizing.
3. With automatic intent, goal keywords suggest vertical (9:16), portrait (4:5), landscape (16:9), square (1:1), or product (4:5). Otherwise sizing is flexible. These are heuristics, not semantic understanding.
4. When real generation is available and the user has not chosen Samples only, every specific ratio selects SDXL. Flexible sizing selects FLUX. Missing real availability proposes a clearly identified sample model; it never submits a fallback generation. The sample provider has no 3:4 preset, so the proposal explicitly explains its 4:5 substitute.
5. Explicit style overrides style keywords. Style becomes descriptive wording in the proposed prompt. Intended use also adds relevant composition wording. Detail/print/high-quality keywords select the higher preset; variations/options/compare suggest two outputs. Exact diffusion-step mappings remain in Advanced and the capability definitions.

Changing a beginner preference invalidates the pending proposal but leaves applied generation settings intact. Review shows the proposed model, format and explanation. Only Apply replaces those settings and the prompt. Manual Advanced ratio choices are retained as the next desired format; users can select “Recommend a format” to request fresh inference from intent. Preferences persist with drafts and recipes. Samples-only preference is respected even when Cloudflare is enabled. Video retains its previous workflow and rules.

## FLUX dimensions and evidence

The project owner manually confirmed a returned FLUX image measured **1024 × 1024**. No real output file was available in the repository, and this change did not make a new inference call or inspect credentials. This is evidence of an observed square output, not evidence that the API guarantees its dimensions across all calls.

The pre-generation disclosure reads **Model default · 1:1**, explains the manual observation and API limitation, and directs users needing a specific native shape to SDXL. It additionally inspects actual dimensions already present in this browser's current/saved FLUX assets. Contradictory non-square observations replace the square label with an unconfirmed-size disclosure. Result metadata always displays actual decoded output dimensions. The original preview/download path does not crop, stretch, or resize real images to simulate requested shapes.

Automated tests use fixtures to exercise observed-dimension metadata; fixtures are not evidence of live FLUX defaults. Recommendations remain deterministic local rules, not LLM-powered suggestions. Availability means configured endpoint availability, not a guarantee that account access or quota will succeed; existing error handling remains in place.
