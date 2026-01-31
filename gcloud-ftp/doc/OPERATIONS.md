# Google Drive FTP Adapter Operations & Troubleshooting

This document focuses on operational guidance: running the server safely,
managing accounts, and troubleshooting common failures.

## Running the server

From the `gcloud-ftp` directory:

```bash
npm run build
npm start
```

For a custom config file:

```bash
node dist/index.js /path/to/config.properties
```

## Logs

Logging is controlled by `LOG_LEVEL`:

- `error`, `warn`, `info`, `debug`

Example:

```
LOG_LEVEL=debug npm start
```

## Cache management

Cache and OAuth tokens live in `gcloud-ftp/cache/`:

- `gdrive-<ACCOUNT>.db` (SQLite cache)
- `token-<ACCOUNT>.json` (OAuth token)

To reset the cache:
1. Stop the server.
2. Delete the cache database.
3. Restart the server.

If you want to reset OAuth, delete the token file.

## OAuth / authorization issues

Symptoms:
- "Error loading client secret file"
- Browser never opens
- “Invalid grant”

Fixes:
- Ensure `client_secrets.json` exists in `gcloud-ftp/`.
- Re-run and re-authorize; delete the token file if necessary.
- Verify the Google account you authorize has access to the Drive content you expect.

## FTP connectivity issues

### Passive mode problems

If your FTP client hangs on directory listings or transfers:

1. Set `SERVER` to the public IP/DNS your client uses.
2. Configure a PASV port range in `configuration.properties`:
   ```
   ftp.pasv.port.start=40000
   ftp.pasv.port.end=40100
   ```
3. Open those ports in your firewall.

### Port already in use

Change `PORT` or stop the conflicting service.

## Permission problems

“Permission denied” indicates the user lacks the required right:

| Action | Required right |
|---|---|
| List | `dir` |
| Download | `get` |
| Upload | `put` or `append` |
| Rename/Move | `rename` |
| Delete | `delete` or `rmdir` |
| Create folder | `mkdir` |
| Change directory | `cd` |

Update `FTP_RIGHTS` or `FTP_RIGHTS2` accordingly.

## Home directory scoping

Users are scoped to their `FTP_HOME` (or `/` if empty). Paths outside that
scope are denied. If you want full drive access, set `FTP_HOME=/`.

## Large files / memory usage

Uploads stream to Google Drive, but Drive operations still depend on network
latency and Drive API limits. Large uploads may be slow; avoid many concurrent
uploads from multiple clients.

## Google Docs and native formats

Google Docs/Sheets/Slides are not stored as standard binary files. Downloading
them directly may not return a useful file. If you need export formats, you’ll
need to add Drive export support.

## Security recommendations

- Do not expose this FTP server to the public internet without a firewall.
- Use strong user passwords (not `user/user`).
- Prefer a dedicated Google account for Drive access.
- Keep `client_secrets.json` and the token file private.

## Known limitations

- Append is not supported by Drive (uploads overwrite).
- Duplicate filenames can exist in the same folder; listings may not be deterministic.
- The adapter relies on Drive change tokens; initial cache is minimal until changes occur.

## Diagnostics checklist

1. Verify `client_secrets.json` exists and is readable.
2. Confirm OAuth token was generated in `cache/`.
3. Check `LOG_LEVEL=debug` output for API errors.
4. Confirm FTP client uses the correct host/port.
5. Verify `FTP_HOME` and rights are correct.
