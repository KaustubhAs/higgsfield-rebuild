"""Isolated lifecycle fixtures; never writes to the submission log directory."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[2]


def hashes():
    return {str(p): hashlib.sha256(p.read_bytes()).hexdigest()
            for directory in (ROOT / '.agent-logs', ROOT / '.codex/.capture-state')
            for p in directory.iterdir() if p.is_file()}


before = hashes()
source = (ROOT / '.codex/hooks/capture.py').read_text(encoding='utf-8')
with tempfile.TemporaryDirectory(prefix='capture-lifecycle-fixtures-') as temp:
    root = Path(temp)
    script = root / '.codex/hooks/capture.py'
    script.parent.mkdir(parents=True)
    (root / '.codex/capture-settings.json').write_text(
        json.dumps({'author': 'TEST-FIXTURE', 'project': 'isolated-test'}), encoding='utf-8')
    script.write_text(source, encoding='utf-8')
    common = {'session_id': 'isolated-fixture-session', 'turn_id': 'isolated-fixture-turn',
              'model': 'TEST-FIXTURE', 'cwd': str(root), 'transcript_path': str(root / 'unused.jsonl')}
    sample = '\u2014 \u2018apostrophe\u2019 \u201cquotes\u201d caf\u00e9 \u0928\u092e\u0938\u094d\u0924\u0947 \U0001f642\r\n'
    prompt = dict(common, hook_event_name='UserPromptSubmit', prompt=sample)
    stop = dict(common, hook_event_name='Stop', last_assistant_message=sample, stop_hook_active=False)

    def run(event):
        env = os.environ.copy()
        env['PYTHONIOENCODING'] = 'cp1252:surrogateescape'
        return subprocess.run([sys.executable, str(script)],
            input=json.dumps(event, ensure_ascii=False).encode('utf-8'),
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env, timeout=10)

    # Reproduce the old Windows reader using the same hook entry point.
    script.write_text(source.replace('event = read_hook_event(sys.stdin.buffer)',
                                     'event = json.load(sys.stdin)'), encoding='utf-8')
    failed_prompt = run(prompt)
    assert failed_prompt.returncode == 1
    print('Reproduced old UserPromptSubmit stderr:', ascii(failed_prompt.stderr.decode('ascii')))
    assert b'surrogates not allowed' in failed_prompt.stderr
    assert any(p.stat().st_size == 0 for p in (root / '.agent-logs').glob('*.tmp-*'))
    assert not list((root / '.agent-logs').glob('*.md'))
    # Restore the fix, as happened between the failed prompt and its Stop.
    script.write_text(source, encoding='utf-8')
    failed_stop = run(stop)
    assert failed_stop.returncode == 1
    print('Reproduced subsequent Stop stderr:', ascii(failed_stop.stderr.decode('ascii')))
    assert b'Stop arrived without a captured UserPromptSubmit' in failed_stop.stderr

    for event in (prompt, stop, prompt, stop):
        result = run(event)
        assert result.returncode == 0, repr(result.stderr)
        assert json.loads(result.stdout) == {'continue': True}
    log = next((root / '.agent-logs').glob('*.md')).read_bytes()
    assert log.count(sample.encode('utf-8')) == 2
    assert log.count(b'[LOG_ENTRY type=PROMPT') == 1
    assert log.count(b'[LOG_ENTRY type=RESPONSE') == 1
    state = json.loads(next((root / '.codex/.capture-state').glob('*.json')).read_text())
    assert state['turns'][common['turn_id']]['response_written'] is True
    print('PASS: Fixed real-format prompt and Stop processes preserve Unicode, complete state, and tolerate event retries.')
assert hashes() == before
print('PASS: Existing submission logs, temporary files and capture state remain byte-for-byte unchanged.')
