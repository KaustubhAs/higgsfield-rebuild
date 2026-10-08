# Higgsfield rebuild - 8x assignment

This repository is prepared for the 8x Higgsfield rebuild assignment. Application development has not started; no application features have been built.

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
