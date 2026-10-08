# 8x assignment — Codex capture setup (before building)

The hook scripts log **user prompt + final assistant response only**, not reasoning, tools, or intermediate output. Python 3.9+ is required.

## 1. Install BEFORE the first Codex message

Place this starter's files directly into the root of your **new empty Git repository**, not into a nested folder. From a PowerShell terminal in VS Code, run:

```powershell
py -3 scripts/capture/setup-capture.py --author YOUR_GITHUB_HANDLE --project higgsfield-rebuild
```

If `py -3` is unavailable, use `python scripts/capture/setup-capture.py ...`. The installer writes `.codex/hooks.json` with an **absolute Python path** and creates `.agent-logs/`. The hook also works when Codex is launched from a subfolder, but run the tests from your repo root.

## 2. Start Codex and trust hooks

```powershell
codex
```

Check `codex --version` (use a current version). Hooks are enabled by default on recent Codex CLI releases; if they were disabled in your configuration, start with `codex --enable hooks`. Check startup warnings. In Codex CLI, type `/hooks` and **review/trust both** project hooks (`UserPromptSubmit`, `Stop`). Also trust the project `.codex/` config if prompted. Do not use `--dangerously-bypass-hook-trust` as a shortcut.

**The first actual prompt you send to Codex must be the complete 8x setup prompt copied from the assignment.** Do not substitute or paraphrase it. Follow the agent's setup response, but do not start product coding.

## 3. First canary, in session 1

Send this as a separate prompt, replacing YOUR NAME with the exact name you'll pass the verifier:

```text
CAPTURE TEST — 8x assignment, YOUR NAME
```

Let Codex respond fully. In PowerShell, check:

```powershell
Get-ChildItem .agent-logs\*.md
Get-Content -Encoding UTF8 (Get-ChildItem .agent-logs\*.md | Select-Object -First 1).FullName -Tail 30
```

Both a `type=PROMPT` and a matching `type=RESPONSE` must be present for the canary. The file also includes the full first 8x prompt if hooks were trusted in time.

## 4. Second canary, in a NEW session

Exit Codex (`/exit`), start a **new** `codex` process from the same repository root. Do **not** use `codex resume`; it needs a distinct session ID. Send the **same exact canary prompt** as above and let it finish. Two session files should appear in `.agent-logs`.

## 5. Verify + generate authentic CAPTURE-TEST.md

In PowerShell:

```powershell
py -3 scripts/capture/verify-capture.py --name "YOUR NAME"
```

It exits with an error unless it finds a complete prompt/response canary in each of **two distinct sessions**. Verification is read-only by default. On a fresh setup only, add `--write-report` to create `CAPTURE-TEST.md` from real captured entries; it refuses to overwrite an existing report. Preserve existing failure history when appending later evidence. You may record genuine failed experiments via `--tried-first "..."`. Do not manually invent canary proof.

## 6. Commit and then begin building

```powershell
git add .gitignore README.md .codex .agent-logs CAPTURE-TEST.md CAPTURE-SETUP-STATUS.md scripts/capture docs/SETUP-CAPTURE.md
git commit -m "chore: verify automatic Codex agent capture"
```

Continue using Codex with hooks active. Regularly run `git add .agent-logs` and commit those changes **alongside** product-code commits. Don't put `.agent-logs/` in `.gitignore`, and don't curate/delete past entries.

## Notes

- If logs don't appear, open `/hooks`, check trust, review that Python works, and re-run a real canary before any build.
- Project hooks depend on a trusted project and local CLI installation. Cloud-hosted Codex runs may not support the same local command hooks.
- The installer stores machine-specific absolute paths in `.codex/hooks.json`. They work on *your* local environment and are included to make setup inspectable. Other machines must rerun the installer.
- Do not paste tokens or secrets into Codex prompts: the public repository will contain raw prompts and final replies.
- The hook fails visibly when a Stop event lacks a final assistant message; it never fills in a fake response.
- Session-level metadata records the first model and every exchange records the actual hook model. A model switch remains visible.
- The initial full 8x setup prompt may be missing if Codex did not trust the hook until after your first message. If that happens, **do not backfill a fake entry**. Document the limitation honestly, and verify future automatic prompts in both sessions.

Official hooks documentation: https://developers.openai.com/codex/hooks

## Recheck the installed setup

Run from the repository root (these checks preserve existing evidence):

```powershell
python -B scripts/capture/verify-capture.py --name "Kaustubh Sonawane"
python -B scripts/capture/test-capture-encoding.py
python -B scripts/capture/test-capture-lifecycle.py
python -B scripts/capture/check-capture-hooks.py
```

Historical reports retain the helper paths used when the evidence was recorded. Current helpers live under `scripts/capture/`. The Unicode failure investigation remains in `CAPTURE-SETUP-STATUS.md`.
