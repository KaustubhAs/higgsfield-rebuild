"""Read-only hook discovery check. Never prints raw server output or credentials."""
import json
import queue
import subprocess
import threading
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main():
    server = subprocess.Popen(
        ["codex", "app-server"], cwd=ROOT,
        stdin=subprocess.PIPE, stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL, text=True, encoding="utf-8",
    )
    incoming = queue.Queue()

    def read():
        for line in server.stdout:
            try:
                incoming.put(json.loads(line))
            except json.JSONDecodeError:
                pass

    threading.Thread(target=read, daemon=True).start()

    def send(message):
        server.stdin.write(json.dumps(message) + "\n")
        server.stdin.flush()

    def receive(request_id):
        deadline = time.monotonic() + 20
        while time.monotonic() < deadline:
            try:
                message = incoming.get(timeout=max(0.01, deadline - time.monotonic()))
            except queue.Empty:
                break
            if message.get("id") == request_id:
                if "error" in message:
                    raise RuntimeError("Registry request failed; raw server error withheld.")
                return message["result"]
        raise RuntimeError("Registry request timed out.")

    try:
        send({"id": 1, "method": "initialize", "params": {
            "clientInfo": {"name": "capture-check", "version": "1"},
            "capabilities": {"experimentalApi": True},
        }})
        receive(1)
        send({"method": "initialized"})
        send({"id": 2, "method": "hooks/list", "params": {"cwds": [str(ROOT)]}})
        result = receive(2)
        selected = []
        for entry in result.get("data", []):
            print("Registry errors:", len(entry.get("errors", [])))
            print("Registry warnings:", len(entry.get("warnings", [])))
            for hook in entry.get("hooks", []):
                if Path(hook["sourcePath"]).resolve() != ROOT / ".codex" / "hooks.json":
                    continue
                row = {key: hook.get(key) for key in (
                    "eventName", "enabled", "trustStatus", "source", "sourcePath"
                )}
                selected.append(row)
                print(json.dumps(row))
        ready = all(any(h["eventName"] == event and h["enabled"] and
                        h["trustStatus"] == "trusted" for h in selected)
                    for event in ("userPromptSubmit", "stop"))
        print("PASS: Both hooks discovered, enabled and trusted." if ready else
              "NOT READY: Both hooks must be discovered, enabled and trusted.")
        return 0 if ready else 1
    finally:
        server.terminate()
        try:
            server.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server.kill()
            server.wait(timeout=5)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception:
        print("Hook registry check failed; raw server output withheld.")
        raise SystemExit(2)
