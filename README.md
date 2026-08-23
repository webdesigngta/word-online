# Word Online

Browser-first Word document editor and document-tool platform built with Next.js and React.

## Architecture

- Static Next.js export (`output: 'export'`)
- Browser-side document processing where practical
- Shared document engine and tool registry
- Word, PDF, image, HTML, and spreadsheet tool foundations
- Production deployment via GitHub Actions to HostGator over FTP/FTPS

## Development

```bash
npm ci --legacy-peer-deps
npm run typecheck
npm run build
```

The production-ready static site is generated in `out/`.

## Deployment

The repository workflow builds and deploys automatically from `main`.

Required GitHub repository secrets:

- `HOSTGATOR_FTP_SERVER`
- `HOSTGATOR_FTP_USERNAME`
- `HOSTGATOR_FTP_PASSWORD`

Optional secret:

- `HOSTGATOR_FTP_PATH` — defaults to `./word-online/`

No production credentials belong in source control.

## Source notice

Copyright © 2026. All rights reserved. Public source visibility does not grant permission to copy, redistribute, sublicense, or commercially reuse this code except as allowed by applicable law or GitHub's platform terms.
