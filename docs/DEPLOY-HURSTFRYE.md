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

That user **already logs in inside** the folder File Manager shows as `ROOT / PUBLIC_HTML / TABLEMATES`. GitHub Actions must upload into `.`. Using `public_html/tablemates/` creates a nested folder the site never serves.

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

Network Solutions typically does **not** support FTPS (`AUTH TLS` → `504`). The workflow uses plain **FTP on port 21**. Zip/PHP uploads are blocked by their malware scan, so the Action mirrors files with lftp.

## Verify

1. **Actions → Deploy to hurstfrye.com → Run workflow** (or push to `main`).
2. File Manager `PUBLIC_HTML / TABLEMATES` should contain `index.html`, `_next/`, `assets/`.
3. Open https://hurstfrye.com/tablemates/ — assets should load under `/tablemates/_next/...`.
4. Start a room; websockets still use your Cloudflare Worker (`NEXT_PUBLIC_PARTY_HOST`).
