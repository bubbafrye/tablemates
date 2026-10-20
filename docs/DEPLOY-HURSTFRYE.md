# Deploy to hurstfrye.com/tablemates (Network Solutions)

GitHub stays the source of truth. On every push to `main`:

1. **GitHub Pages** — `.github/workflows/deploy-pages.yml` (unchanged)
2. **hurstfrye.com** — `.github/workflows/deploy-hurstfrye.yml` → upload `out/` over **FTP**

Live site target: `https://hurstfrye.com/tablemates/`

## This account’s FTP user

Network Solutions FTP Management:

| Field | Value |
| --- | --- |
| Username | `tablemates` |
| Home directory | `/Public_html/Tablemates` |
| Enabled | on |

That user is **already inside** the `/tablemates/` web folder. GitHub Actions must upload into the FTP **home** (`.`), not into `/tablemates/` again (that would create `/Public_html/Tablemates/tablemates/`).

## GitHub Actions secrets

| Secret | Value for this host |
| --- | --- |
| `HURSTFRYE_FTP_SERVER` | FTP hostname from the panel (e.g. `ftp.hurstfrye.com`) |
| `HURSTFRYE_FTP_USER` | `tablemates` |
| `HURSTFRYE_FTP_PASSWORD` | password for that FTP user |
| `HURSTFRYE_FTP_PATH` | `.` |

```bash
gh secret set HURSTFRYE_FTP_SERVER --body 'ftp.hurstfrye.com'
gh secret set HURSTFRYE_FTP_USER --body 'tablemates'
gh secret set HURSTFRYE_FTP_PASSWORD --body 'YOUR_FTP_PASSWORD'
gh secret set HURSTFRYE_FTP_PATH --body '.'
```

Optional (shared with Pages): variable `NEXT_PUBLIC_PARTY_HOST`, variable `NEXT_PUBLIC_CONTACT_EMAIL`, secret `FIGMA_ACCESS_TOKEN`.

Network Solutions typically does **not** support FTPS (`AUTH TLS` → `504`). The workflow uses plain **FTP on port 21**. Multi-file FTP hangs on this host, so the Action uploads one zip and a one-shot `unzip-tablemates.php`.

`HURSTFRYE_FTP_PASSWORD` must be the password for the **`tablemates`** FTP user (not the main hosting login).

## White page at /tablemates/index.html

Until a successful upload, that URL is the **Portfolio** SPA at the domain root (empty `#root` if its JS is requested from `/tablemates/assets/`). After deploy you should see a `<title>tablemates</title>` document and files like `_next/` and `assets/2048/` in File Manager under `Public_html/Tablemates`.

## Verify

1. **Actions → Deploy to hurstfrye.com → Run workflow** (or push to `main`).
2. Open https://hurstfrye.com/tablemates/ — assets should load under `/tablemates/_next/...`.
3. Start a room; websockets still use your Cloudflare Worker (`NEXT_PUBLIC_PARTY_HOST`).
