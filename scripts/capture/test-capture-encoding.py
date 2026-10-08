"""Encoding regression tests only; never generates submission log entries."""
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('capture', ROOT / '.codex/hooks/capture.py')
capture = importlib.util.module_from_spec(spec)
spec.loader.exec_module(capture)

before = {p: hashlib.sha256(p.read_bytes()).hexdigest()
          for p in (ROOT / '.agent-logs').iterdir() if p.is_file()}
# Test data, not a real user exchange or canary proof.
sample = 'CAPTURE TEST \u2014 8x assignment, Kaustubh Sonawane\r\n\u2018apostrophe\u2019 \u201cquotes\u201d caf\u00e9 \u0928\u092e\u0938\u094d\u0924\u0947 \U0001f642\n'
wire = json.dumps({'prompt': sample, 'last_assistant_message': sample}, ensure_ascii=False).encode('utf-8')
legacy = json.load(io.TextIOWrapper(io.BytesIO(wire), encoding='cp1252', errors='replace'))
assert legacy['prompt'] != sample
assert '\xe2\u20ac\u201d' in legacy['prompt']
print('PASS: Legacy cp1252 input decoding reproduces the observed dash corruption.')
event = capture.read_hook_event(io.BytesIO(wire))
assert event['prompt'] == event['last_assistant_message'] == sample
print('PASS: Strict UTF-8 input preserves all characters and CRLF/LF exactly.')
with tempfile.TemporaryDirectory(prefix='capture-encoding-test-') as directory:
    target = Path(directory) / 'roundtrip.txt'
    capture.write_atomic(target, sample)
    assert target.read_bytes() == sample.encode('utf-8')
    assert capture.read_exact(target) == sample
print('PASS: Existing UTF-8 file writer preserves the decoded text byte-for-byte.')
try:
    capture.read_hook_event(io.BytesIO(b'{"prompt":"\xff"}'))
except UnicodeDecodeError:
    print('PASS: Invalid UTF-8 fails rather than silently replacing characters.')
else:
    raise AssertionError('Invalid UTF-8 was accepted')
after = {p: hashlib.sha256(p.read_bytes()).hexdigest()
         for p in (ROOT / '.agent-logs').iterdir() if p.is_file()}
assert before == after
print('PASS: No submission log files were created, edited or removed by these tests.')
