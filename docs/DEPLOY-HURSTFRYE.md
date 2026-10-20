# Deploy to hurstfrye.com/tablemates (Network Solutions)

GitHub stays the source of truth. On every push to `main`:

1. **GitHub Pages** — `.github/workflows/deploy-pages.yml` (unchanged)
2. **hurstfrye.com** — `.github/workflows/deploy-hurstfrye.yml` → upload `out/` over **FTPS**

Live site target: `https://hurstfrye.com/tablemates/`

Network Solutions (formerly iPower) is **shared hosting**. Shell/`rsync` SSH is usually not available, so deploy uses **FTP/FTPS** credentials from your hosting account.

## Where “step 1” goes on Network Solutions

You do **not** add an SSH public key to a Linux `~/.ssh/authorized_keys` file unless Network Solutions has explicitly enabled SSH for your plan (many plans do not).

Instead, use the **FTP account** already tied to the site:

1. Log in to [Network Solutions Account Manager](https://www.networksolutions.com/) (or the hosting control panel linked from your domain).
2. Open **Hosting** → your site (`hurstfrye.com`) → **FTP** / **FTP Management** / **Website File Manager**.
3. Note (or create) an FTP user that can write under the web root.
4. Confirm the folder that is the site root (`htdocs`, `public_html`, or the domain folder). Create a **`tablemates`** subdirectory there if it does not exist (File Manager → New Folder).

That FTP user + password + server hostname are what GitHub Actions uses. No deploy key file on the server.

## GitHub Actions secrets

Repo → **Settings → Secrets and variables → Actions → Secrets**.

| Secret | Where to get it | Example |
| --- | --- | --- |
| `HURSTFRYE_FTP_SERVER` | FTP hostname in the panel | `ftp.hurstfrye.com` or host shown by Network Solutions |
| `HURSTFRYE_FTP_USER` | FTP username | often your account / domain user |
| `HURSTFRYE_FTP_PASSWORD` | FTP password | from the panel (reset if needed) |
| `HURSTFRYE_FTP_PATH` | Path **on the FTP server** for this app | `/tablemates/` or `/htdocs/tablemates/` |

Optional (shared with Pages): variable `NEXT_PUBLIC_PARTY_HOST`, variable `NEXT_PUBLIC_CONTACT_EMAIL`, secret `FIGMA_ACCESS_TOKEN`.

### Set secrets from your Mac

```bash
gh secret set HURSTFRYE_FTP_SERVER --body 'ftp.hurstfrye.com'
gh secret set HURSTFRYE_FTP_USER --body 'YOUR_FTP_USER'
gh secret set HURSTFRYE_FTP_PASSWORD --body 'YOUR_FTP_PASSWORD'
gh secret set HURSTFRYE_FTP_PATH --body '/tablemates/'
```

### Finding `HURSTFRYE_FTP_PATH`

Connect with any FTP client (FileZilla, Cyberduck) using the same credentials, then note the path to the folder that should become `https://hurstfrye.com/tablemates/`.

Common Network Solutions / iPower layouts:

- `/htdocs/tablemates/`
- `/tablemates/` (already inside the web root after login)
- `/hurstfrye.com/tablemates/`

Trailing slash recommended. The workflow uploads the **contents** of `out/` into that folder (`basePath` is already `/tablemates` in the build).

If FTPS fails in Actions, try changing `protocol` in `.github/workflows/deploy-hurstfrye.yml` from `ftps` to `ftp` (some shared hosts only allow plain FTP on port 21).

## Older SSH secrets

If you previously set `HURSTFRYE_SSH_KEY` / `HURSTFRYE_HOST` / `HURSTFRYE_USER` / `HURSTFRYE_PATH`, you can delete them — this host uses FTP secrets instead.

## Verify

1. Commit/push the workflow (or **Actions → Deploy to hurstfrye.com → Run workflow**).
2. Open https://hurstfrye.com/tablemates/ — JS/CSS should load under `/tablemates/_next/...`.
3. Start a room; websockets still use your Cloudflare Worker (`NEXT_PUBLIC_PARTY_HOST`).
