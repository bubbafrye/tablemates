#!/usr/bin/env python3
"""lftp helper for Network Solutions. The tablemates user is jailed to PUBLIC_HTML/TABLEMATES."""

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
    # Extra FTP user home is already PUBLIC_HTML/TABLEMATES. Nested paths 404.
    if "public_html" in path.lower() or "tablemates" in path.lower():
        print(f"ftp path {path!r} is inside the jail — using '.'")
        path = "."
    print(
        f"ftp diagnostics: user_len={len(user)} server_len={len(server)} "
        f"pass_len={len(password)} path={path!r}"
    )
    if not user or not server or not password:
        raise SystemExit("FTP user/server/password empty after trim")
    return user, password, server, path


def lftp(
    script: str,
    user: str,
    password: str,
    server: str,
    timeout: int,
    *,
    check: bool = True,
) -> None:
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
    if check and proc.returncode != 0:
        raise SystemExit(proc.returncode)


def enter_path(path: str) -> str:
    if path in (".", "./"):
        return "pwd\n"
    return f"mkdir -p {path}\ncd {path}\npwd\n"


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("usage: ns-ftp.py smoke | put FILE... | mirror [DIR]")
    cmd = sys.argv[1]
    user, password, server, path = creds()
    if cmd == "smoke":
        lftp(
            "set cmd:fail-exit no\n"
            "pwd\n"
            "cls -1\n"
            "rm -r public_html\n"
            "set cmd:fail-exit yes\n"
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
            f"put {name} -o {os.path.basename(name)}" for name in files
        )
        lftp(
            enter_path(path) + puts + "\ncls -1\nquit\n",
            user,
            password,
            server,
            timeout=180,
        )
        return
    if cmd == "mirror":
        local = sys.argv[2] if len(sys.argv) > 2 else "./out"
        dest = "." if path in (".", "./") else path
        lftp(
            enter_path(path)
            + "set cmd:fail-exit no\n"
            + "rm -r public_html\n"
            + "set cmd:fail-exit yes\n"
            + f"mirror -R --verbose --parallel=1 --no-perms "
            + f"--exclude-glob '*.zip' --exclude-glob '*.php' "
            + f"{local}/ {dest}/\n"
            + "cls -1\n"
            + "quit\n",
            user,
            password,
            server,
            timeout=600,
        )
        return
    raise SystemExit(f"unknown command {cmd}")


if __name__ == "__main__":
    main()
