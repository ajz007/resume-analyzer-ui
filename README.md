# Resume Analyzer UI

React + Vite front-end for the Resume Analyzer application.

## Production Deployment (S3 + CloudFront)

### Environment model

- `.env.local` is dev-only and must not be uploaded to S3.
- Production uses build-time environment values baked into the static bundle.

### Build a production bundle (Vite)

```powershell
npm ci
npm run build -- --mode production
```

### Required production environment variables

- `VITE_API_BASE_URL` (API Gateway base URL, no trailing `/api/v1` unless required)
- `VITE_UPLOAD_MODE` (set to `s3`)
- `VITE_USE_MOCK_API` (set to `false` if used in the codebase)

#### Option A: `.env.production` file

```ini
VITE_API_BASE_URL=<API_BASE_URL>
VITE_UPLOAD_MODE=s3
VITE_USE_MOCK_API=false
```

#### Option B: pass env vars inline

PowerShell:

```powershell
$env:VITE_API_BASE_URL="<API_BASE_URL>"
$env:VITE_UPLOAD_MODE="s3"
$env:VITE_USE_MOCK_API="false"
npm run build -- --mode production
```

Bash:

```bash
VITE_API_BASE_URL="<API_BASE_URL>" \
VITE_UPLOAD_MODE="s3" \
VITE_USE_MOCK_API="false" \
npm run build -- --mode production
```

### Upload build artifacts to S3

Sync `dist/` to the bucket root (do not upload the `dist` folder itself):

```bash
aws s3 sync dist/ s3://<UI_BUCKET>/ --delete
```

### CloudFront cache invalidation

```bash
aws cloudfront create-invalidation --distribution-id <CLOUDFRONT_DIST_ID> --paths "/*"
```

### Verification

- Open `https://<CLOUDFRONT_DOMAIN>`
- Confirm `/` loads
- Refresh a deep route and confirm SPA routing works
- Confirm the UI calls API Gateway successfully (check DevTools Network)

### Troubleshooting

- **AccessDenied at CloudFront**: OAC/bucket policy issue or `index.html` not at bucket root.
- **Wrong `VITE_API_BASE_URL`**: stage mismatch or unintended `/api/v1` suffix.
- **Stale assets**: missing CloudFront invalidation after upload.