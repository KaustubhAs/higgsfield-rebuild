#!/usr/bin/env python3
"""8x Codex hook: capture the original prompt and final response only.

Called automatically by Codex UserPromptSubmit and Stop lifecycle hooks.
Requires Python 3.9+; no third-party dependencies.
"""
from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LOG_DIR = ROOT / '.agent-logs'
STATE_DIR = ROOT / '.codex' / '.capture-state'
SETTINGS = ROOT / '.codex' / 'capture-settings.json'


def now_utc() -> str:
    return datetime.now(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')


def yaml_str(s: str) -> str:
    return json.dumps(s, ensure_ascii=False)


def write_atomic(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(path.name + f'.tmp-{os.getpid()}')
    with temp.open('w', encoding='utf-8', newline='') as handle:
        handle.write(text)
    temp.replace(path)


def read_exact(path: Path) -> str:
    with path.open('r', encoding='utf-8', newline='') as handle:
        return handle.read()


def read_json(path: Path) -> dict:
    return json.loads(read_exact(path))


def content_block(kind: str, num: int, short_id: str, timestamp: str, model: str, body: str) -> str:
    # Always write the user/model text exactly; delimiter spacing is outside the text.
    return (
        f'[LOG_ENTRY type={kind} num={num} session={short_id}]\n'
        f'timestamp: {timestamp}\n'
        f'model: {model}\n\n'
        f'{body}' + ('\n\n' if body.endswith('\n') else '\n\n\n')
    )


def replace_field(doc: str, key: str, value: str) -> str:
    updated, count = re.subn(rf'(?m)^{re.escape(key)}: .*$', f'{key}: {value}', doc, count=1)
    if count != 1:
        raise ValueError(f'Missing frontmatter field: {key}')
    return updated


def session_file(session_id: str) -> Path | None:
    files = list(LOG_DIR.glob(f'*_{session_id}.md'))
    if len(files) > 1:
        raise ValueError(f'Multiple logs for session {session_id}')
    return files[0] if files else None


def read_hook_event(stream) -> dict:
    # Codex sends UTF-8 JSON bytes. Windows redirected text stdin defaults to
    # cp1252 on some systems; bypass that decoder and newline translation.
    # Strict decoding fails visibly instead of substituting original characters.
    return json.loads(stream.read().decode('utf-8', errors='strict'))


def main() -> None:
    event = read_hook_event(sys.stdin.buffer)
    kind = event['hook_event_name']
    if kind not in ('UserPromptSubmit', 'Stop'):
        return

    cfg = read_json(SETTINGS)
    session_id = event['session_id']
    turn_id = event['turn_id']
    model = event['model']
    short_id = session_id[:8]
    timestamp = now_utc()
    statefile = STATE_DIR / f'{session_id}.json'
    state = read_json(statefile) if statefile.exists() else {'turns': {}}
    LOG_DIR.mkdir(parents=True, exist_ok=True)

    if kind == 'UserPromptSubmit':
        body = event['prompt']
        if not isinstance(body, str):
            raise ValueError('Prompt was not a string')
        if turn_id in state['turns']:
            # Avoid duplicating a prompt if Codex retries an event.
            return
        file = session_file(session_id)
        if file is None:
            first_time = timestamp
            file = LOG_DIR / f'{first_time[:10]}_{first_time[11:19].replace(":", "-")}_{session_id}.md'
            author = cfg['author']
            project = cfg['project']
            header = (
                '---\n'
                f'session_id: {session_id}\n'
                f'date: {first_time[:10]}\n'
                f'author: {yaml_str(author)}\n'
                f'model: {yaml_str(model)}\n'
                'tool: codex-cli\n'
                f'project: {yaml_str(project)}\n'
                'total_exchanges: 0\n'
                f'first_prompt_time: {first_time}\n'
                f'last_prompt_time: {first_time}\n'
                '---\n\n'
                f'# Session Log - {first_time[:10]}\n\n'
                f'Session: `{short_id}` | Project: `{project}` | Author: `{author}`\n\n'
                '---\n\n'
            )
            doc = header
        else:
            doc = read_exact(file)
        nums = [int(n) for n in re.findall(rf'(?m)^\[LOG_ENTRY type=PROMPT num=(\d+) session={re.escape(short_id)}\]$', doc)]
        n = max(nums, default=0) + 1
        doc = replace_field(doc, 'last_prompt_time', timestamp)
        doc += content_block('PROMPT', n, short_id, timestamp, model, body)
        write_atomic(file, doc)
        state['turns'][turn_id] = {'num': n, 'response_written': False}
        write_atomic(statefile, json.dumps(state, indent=2))
        return

    # Stop: only a real, completed response. Never fabricate missing replies.
    body = event.get('last_assistant_message')
    if not isinstance(body, str) or not body.strip():
        raise ValueError('Stop did not include a nonempty final assistant message; verify Codex version/hooks')
    if turn_id not in state['turns']:
        raise ValueError(f'Stop arrived without a captured UserPromptSubmit for turn {turn_id}')
    entry = state['turns'][turn_id]
    if entry['response_written']:
        return
    file = session_file(session_id)
    if file is None:
        raise ValueError('Stop arrived but the session log is missing')
    doc = read_exact(file)
    n = entry['num']
    doc += content_block('RESPONSE', n, short_id, timestamp, model, body)
    count = len(re.findall(rf'(?m)^\[LOG_ENTRY type=RESPONSE num=\d+ session={re.escape(short_id)}\]$', doc))
    doc = replace_field(doc, 'total_exchanges', str(count))
    write_atomic(file, doc)
    entry['response_written'] = True
    write_atomic(statefile, json.dumps(state, indent=2))


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        print(f'8x CAPTURE FAILED: {exc}', file=sys.stderr)
        sys.exit(1)
    # Stop hooks require JSON on stdout; returning it for both events is safe.
    print('{"continue": true}')
