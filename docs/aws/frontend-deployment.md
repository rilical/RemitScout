# Frontend Deployment Guide

This document describes the AWS deployment process for the Remit-Scout frontend.

## Overview

The frontend is deployed as a static site using:
- **S3** for hosting static assets
- **CloudFront** for CDN and caching
- **Route53** for DNS (optional)
- **ACM** for SSL certificates (optional)
- **WAF** for security (reuses Plane A WAF)

## Prerequisites

1. AWS CDK CLI installed and configured
2. Frontend domain name (optional, for custom domain)
3. ACM certificate ARN (optional, for custom domain)
4. Route53 hosted zone (optional, for custom domain)

## CDK Context Variables

The following context variables can be set via `cdk.json` or command line:

```json
{
  "frontendDomainName": "remit-scout.com",
  "frontendCertificateArn": "arn:aws:acm:us-east-1:123456789012:certificate/...",
  "frontendHostedZoneId": "Z1234567890ABC",
  "frontendHostedZoneName": "remit-scout.com"
}
```

Or via command line:

```bash
cdk deploy -c frontendDomainName=remit-scout.com \
  -c frontendCertificateArn=arn:aws:acm:... \
  -c frontendHostedZoneId=Z1234567890ABC \
  -c frontendHostedZoneName=remit-scout.com
```

## Environment Variables

### Build Time

The following environment variables are set during the CI/CD pipeline build:

- `PUBLIC_API_BASE`: CloudFront domain for Plane A API (e.g., `https://api.remit-scout.com/api/v1`)
- `PUBLIC_SITE_URL`: Frontend CloudFront domain (e.g., `https://remit-scout.com`)
- `PUBLIC_IMAGE_BASE`: CloudFront domain for images (e.g., `https://images.remit-scout.com`)

### Runtime

The frontend detects AWS environment via:
- `AWS_REGION`: AWS region
- `CLOUDFRONT_DISTRIBUTION_ID`: CloudFront distribution ID

## Deployment Process

### 1. Build

The frontend is built using:

```bash
pnpm -C frontend build
pnpm -C frontend generate
```

This generates static files in `frontend/.output/public/`.

### 2. Deploy to S3

Files are synced to S3 with appropriate cache headers:

```bash
# Static assets (long cache)
aws s3 sync frontend/.output/public s3://remit-scout-frontend-prod \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "*.html" --exclude "*.json"

# HTML and JSON (no cache)
aws s3 sync frontend/.output/public s3://remit-scout-frontend-prod \
  --delete \
  --cache-control "no-cache, no-store, must-revalidate" \
  --include "*.html" --include "*.json"
```

### 3. Invalidate CloudFront

After deployment, CloudFront cache is invalidated:

```bash
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*"
```

## ISR (Incremental Static Regeneration)

The frontend uses ISR for dynamic routes:

- `/send-money/**`: 10 minutes cache
- `/providers/**`: 30 minutes cache
- `/pulse`: 5 minutes cache

ISR is handled by CloudFront behaviors with Lambda@Edge functions.

## CloudFront Behaviors

### Default Behavior
- **Cache Policy**: No cache (for HTML)
- **Origin**: S3 bucket
- **Viewer Protocol**: Redirect to HTTPS

### ISR Routes
- `/send-money/*`: 10 minutes cache
- `/providers/*`: 30 minutes cache
- `/pulse`: 5 minutes cache

### Static Assets
- `/_nuxt/*`: 1 year cache
- `/images/*`: 1 year cache

## Error Handling

CloudFront is configured with custom error pages:
- **403** → `/index.html` (for SPA routing)
- **404** → `/index.html` (for SPA routing)

## Security

- **WAF**: Reuses Plane A WAF for protection
- **HTTPS**: Enforced via CloudFront
- **S3**: Private bucket with Origin Access Identity (OAI)

## Monitoring

CloudFront metrics are available in CloudWatch:
- Request count
- Error rates
- Cache hit ratio
- Data transfer

## Troubleshooting

### Cache Issues

If content isn't updating:
1. Check CloudFront invalidation status
2. Verify cache policies are correct
3. Check S3 object metadata

### Build Failures

1. Check environment variables are set correctly
2. Verify Node.js version (20+)
3. Check pnpm lockfile is up to date

### Deployment Failures

1. Verify S3 bucket permissions
2. Check CloudFront distribution status
3. Verify Route53 records (if using custom domain)

## Local Development

For local development, the frontend runs without AWS dependencies:

```bash
cd frontend
pnpm install
pnpm dev
```

The frontend will use local API endpoints and won't require AWS credentials.

## CI/CD Integration

The frontend is automatically built and deployed via CodePipeline:

1. **Source**: GitHub repository
2. **Build**: Builds frontend and backend
3. **Deploy**: Deploys infrastructure and frontend

See `infrastructure/cdk/lib/pipeline.ts` for details.

