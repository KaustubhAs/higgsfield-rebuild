#!/usr/bin/env python3
"""Run ONCE from the repository root, before launching Codex."""
import argparse
import json
import os
import shlex
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main():
    ap = argparse.ArgumentParser(description='Install automatic Codex lifecycle capture')
    ap.add_argument('--author', required=True, help='Your GitHub handle')
    ap.add_argument('--project', default=ROOT.name, help='Project name')
    args = ap.parse_args()
    if not args.author.strip() or '/' in args.author or '\\' in args.author:
        ap.error('Supply a GitHub handle for --author')
    capture = ROOT / '.codex' / 'hooks' / 'capture.py'
    if not capture.is_file():
        ap.error(f'Missing capture script: {capture}')
    (ROOT / '.agent-logs').mkdir(exist_ok=True)
    (ROOT / '.agent-logs' / '.gitkeep').touch()
    (ROOT / '.codex' / '.capture-state').mkdir(parents=True, exist_ok=True)
    (ROOT / '.codex' / '.capture-state' / '.gitignore').write_text('*\n!.gitignore\n', encoding='utf-8')
    settings = {'author': args.author.strip(), 'project': args.project.strip()}
    (ROOT / '.codex' / 'capture-settings.json').write_text(json.dumps(settings, indent=2) + '\n', encoding='utf-8')
    # Absolute path handles spaces and runs even if Codex is launched in a subfolder.
    unix_command = shlex.join([sys.executable, str(capture)])
    windows_command = subprocess.list2cmdline([sys.executable, str(capture)])
    handler = {'type': 'command', 'command': unix_command, 'commandWindows': windows_command, 'timeout': 30}
    hooks = {'description': '8x assignment: capture full submitted prompts and final replies', 'hooks': {
        'UserPromptSubmit': [{'hooks': [handler]}],
        'Stop': [{'hooks': [handler]}]
    }}
    hookfile = ROOT / '.codex' / 'hooks.json'
    if hookfile.exists():
        print('Refusing to overwrite existing .codex/hooks.json. Merge hooks manually.', file=sys.stderr)
        sys.exit(1)
    hookfile.write_text(json.dumps(hooks, indent=2) + '\n', encoding='utf-8')
    print('Installed automatic Codex capture.')
    print(f'Config: {hookfile}')
    print(f'Capture program: {capture}')
    print('Next: Start Codex from this folder, trust the project hooks using /hooks, and send the FULL 8x setup prompt as your first agent prompt.')


if __name__ == '__main__':
    main()
