#!/usr/bin/env python3
"""lftp helper for Network Solutions. Strips secret whitespace and passes user,pass explicitly."""

from __future__ import annotations

import os
import subprocess
import sys


def creds() -> tuple[str, str, str, str]:
    user = os.environ["FTP_USER"].strip()
    server = os.environ["FTP_SERVER"].strip()
    if server.startswith(("ftp://", "ftps://")):
        server = server.split("://", 1)[1]
    server = server.split("/")[0]
    password = os.environ["LFTP_PASSWORD"].strip("\r\n")
    path = os.environ.get("FTP_PATH", ".").strip() or "."
    print(
        f"ftp diagnostics: user_len={len(user)} server_len={len(server)} "
        f"pass_len={len(password)} path={path!r} server_has_colon={':' in server}"
    )
    if not user or not server or not password:
        raise SystemExit("FTP user/server/password empty after trim")
    return user, password, server, path


def lftp(script: str, user: str, password: str, server: str, timeout: int) -> None:
    settings = f"""
set ftp:ssl-allow no
set ftp:passive-mode true
set ftp:prefer-epsv no
set net:max-retries 2
set net:reconnect-interval-base 5
set net:timeout {timeout}
set cmd:fail-exit yes
debug 1
"""
    proc = subprocess.run(
        ["lftp", "-u", f"{user},{password}", f"ftp://{server}"],
        input=settings + script,
        text=True,
        check=False,
    )
    if proc.returncode != 0:
        raise SystemExit(proc.returncode)


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("usage: ns-ftp.py smoke | put FILE...")
    cmd = sys.argv[1]
    user, password, server, path = creds()
    if cmd == "smoke":
        lftp(
            "pwd\n"
            "cls -1\n"
            "cls -1 public_html\n"
            "cls -1 Public_html\n"
            "quit\n",
            user,
            password,
            server,
            timeout=20,
        )
        return
    if cmd == "put":
        files = sys.argv[2:]
        if not files:
            raise SystemExit("put requires files")
        puts = "\n".join(
            f"put -o {os.path.basename(name)} {name}" for name in files
        )
        script = (
            f"mkdir -p {path}\n"
            f"cd {path}\n"
            f"pwd\n"
            f"{puts}\n"
            "cls -1\n"
            "quit\n"
        )
        lftp(script, user, password, server, timeout=180)
        return
    raise SystemExit(f"unknown command {cmd}")


if __name__ == "__main__":
    main()
