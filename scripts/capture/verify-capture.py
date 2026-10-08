#!/usr/bin/env python3
"""Verify two REAL independent Codex canaries; preserve existing evidence by default."""
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PATTERN = re.compile(
    r'(?m)^\[LOG_ENTRY type=(PROMPT|RESPONSE) num=(\d+) session=([^\]]+)\]\n'
    r'timestamp: ([^\n]+)\nmodel: ([^\n]+)\n\n'
)


def parse_entries(doc):
    matches = list(PATTERN.finditer(doc))
    result = []
    for i, m in enumerate(matches):
        body = doc[m.end(): (matches[i+1].start() if i+1 < len(matches) else len(doc))]
        # Only strip delimiter newlines added by hook (not prompt/response content).
        # For canary comparisons, canary prompts deliberately contain no trailing newline.
        result.append({'type': m[1], 'num': int(m[2]), 'session': m[3],
                       'timestamp': m[4], 'model': m[5], 'body': body,
                       'raw': doc[m.start(): (matches[i+1].start() if i+1 < len(matches) else len(doc))]})
    return result


def read_exact(path):
    with path.open('r', encoding='utf-8', newline='') as handle:
        return handle.read()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--name', required=True, help='Exact name used in BOTH canary prompts')
    ap.add_argument('--tried-first', default='None', help='Any failed mechanisms, or None')
    ap.add_argument('--write-report', action='store_true', help='Create CAPTURE-TEST.md only if it does not exist; never overwrite evidence')
    args = ap.parse_args()
    expected = f'CAPTURE TEST — 8x assignment, {args.name}'
    session_matches = []
    files = sorted((ROOT / '.agent-logs').glob('*.md'))
    for file in files:
        doc = read_exact(file)
        sm = re.search(r'(?m)^session_id: ([^\n]+)$', doc)
        if not sm:
            continue
        session_id = sm[1]
        entries = parse_entries(doc)
        for entry in entries:
            if entry['type'] != 'PROMPT' or entry['body'].rstrip('\n') != expected:
                continue
            corresponding = next((e for e in entries if e['type'] == 'RESPONSE' and e['num'] == entry['num'] and e['body'].strip()), None)
            if corresponding:
                session_matches.append((session_id, file, entry, corresponding))
    # Require two separate sessions; don't accept two messages within one session.
    unique = {}
    for row in session_matches:
        unique.setdefault(row[0], row)
    if len(unique) < 2:
        print('FAIL: Need two completed canaries in TWO distinct Codex sessions.', file=sys.stderr)
        print(f'Expected exact prompt twice: {expected}', file=sys.stderr)
        print(f'Independent sessions found: {len(unique)}', file=sys.stderr)
        sys.exit(1)
    rows = list(unique.values())[:2]
    print('PASS: Found two completed canaries from different session IDs.')
    for _, file, prompt, response in rows:
        print(f'  {file.name} | prompt model={prompt["model"]}; response model={response["model"]}')
    if not args.write_report:
        print('Read-only verification: CAPTURE-TEST.md was not changed.')
        return
    if (ROOT / 'CAPTURE-TEST.md').exists():
        ap.error('CAPTURE-TEST.md already exists; preserve its history and append reviewed evidence separately.')
    cfg = json.loads(read_exact(ROOT / '.codex' / 'capture-settings.json'))
    hook_cfg = (ROOT / '.codex' / 'hooks.json').resolve()
    text = (
        '# CAPTURE-TEST — verified Codex agent capture\n\n'
        '> Automatically generated from actual log entries only. Review before committing.\n\n'
        f'- Tool: OpenAI Codex CLI\n'
        f'- Models observed: {", ".join(sorted({row[2]["model"] for row in rows} | {row[3]["model"] for row in rows}))}\n'
        '- Mechanism: Codex project lifecycle hooks `UserPromptSubmit` and `Stop`.\n'
        '- Configuration: `.codex/hooks.json` (absolute interpreter/script path set by scripts/capture/setup-capture.py).\n'
        '- Capture script: `.codex/hooks/capture.py`.\n'
        '- Log folder: `.agent-logs/`.\n'
        f'- Attempts that did not work: {args.tried_first}\n\n'
    )
    for idx, (_, file, prompt, response) in enumerate(rows, start=1):
        text += f'## Canary session {idx}\n\n- Log: `.agent-logs/{file.name}`\n- Session ID: `{rows[idx-1][0]}`\n\n'
        # Append captured raw entries, preserving their content.
        text += '```text\n' + prompt['raw'] + response['raw'] + '```\n\n'
    with (ROOT / 'CAPTURE-TEST.md').open('x', encoding='utf-8', newline='') as handle:
        handle.write(text)
    print('PASS: Found two completed canaries from different session IDs.')
    for i, (_, file, prompt, response) in enumerate(rows, 1):
        print(f'  Canary {i}: {file.name} | prompt model={prompt["model"]}; response model={response["model"]}')
    print('Created CAPTURE-TEST.md from actual logs.')


if __name__ == '__main__':
    main()
