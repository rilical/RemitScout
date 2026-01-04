# Security Scanning Automation

This document describes the security scanning automation setup for Remit-Scout, including dependency scanning, vulnerability assessment, dynamic application security testing (DAST), and secret scanning.

## Overview

We use multiple security scanning tools to ensure comprehensive coverage:

1. **Dependabot** - Automated dependency updates and vulnerability alerts
2. **Snyk** - Dependency vulnerability scanning and license compliance
3. **CodeQL** - Static Application Security Testing (SAST)
4. **OWASP ZAP** - Dynamic Application Security Testing (DAST)
5. **TruffleHog** - Secret scanning and credential detection
6. **Gitleaks** - Additional secret scanning
7. **Yelp Detect Secrets** - Baseline secret detection
8. **NPM Audit** - Built-in npm/pnpm vulnerability scanning

## Dependabot

### Configuration

Dependabot is configured in `.github/dependabot.yml` to:
- Scan npm dependencies in root, backend, and frontend directories
- Check GitHub Actions workflows
- Run weekly on Mondays at 9:00 AM
- Create grouped PRs for production and development dependencies
- Limit major version updates (requires manual review)

### Features

- **Automated PRs**: Creates pull requests for dependency updates
- **Security Alerts**: Automatically creates security alerts for vulnerable dependencies
- **Grouped Updates**: Groups related dependencies to reduce PR noise
- **Reviewers**: Automatically assigns security team reviewers

### Usage

Dependabot runs automatically. To manually trigger:
1. Go to repository Settings → Security → Dependabot
2. Click "Create alert" or wait for scheduled runs

## Snyk

### Setup

1. **Get Snyk Token**:
   - Sign up at https://snyk.io
   - Generate an API token from your account settings
   - Add it as `SNYK_TOKEN` in GitHub Secrets

2. **Integration**:
   - Snyk scans run automatically in CI/CD via `.github/workflows/security-scan.yml`
   - Results are uploaded to GitHub Security tab
   - SARIF reports are generated for detailed analysis

### Features

- **Vulnerability Detection**: Scans npm dependencies for known vulnerabilities
- **License Compliance**: Checks for problematic licenses
- **Severity Threshold**: Only reports high and critical severity issues
- **Multi-Project**: Scans root, backend, and frontend separately

### Viewing Results

- GitHub Security tab → Code scanning alerts
- Snyk dashboard (if connected)
- Workflow artifacts

## OWASP ZAP

### Configuration

OWASP ZAP is configured for:
- **Baseline Scan**: Runs on every push/PR (quick scan)
- **Full Scan**: Runs weekly and on manual trigger (comprehensive scan)

### Setup

1. **Target Application**: Configured to scan `http://localhost:3000`
   - Update in workflow if your app runs on different port
   - Ensure app is running before ZAP scan

2. **Rules**: Custom rules defined in `.zap/rules.tsv`
   - Focuses on common web vulnerabilities
   - Customizable per project needs

### Running Scans

**Automatic**:
- Baseline scan on every push/PR
- Full scan weekly (Monday 2 AM)

**Manual**:
```bash
# Trigger via GitHub Actions
gh workflow run security-scan.yml
```

### Common Issues Detected

- Missing security headers (CSP, X-Content-Type-Options, etc.)
- Weak authentication methods
- Session cookie vulnerabilities
- CSRF token absence
- Information disclosure
- Weak cipher suites

## TruffleHog

### Purpose

TruffleHog scans repositories for accidentally committed secrets, API keys, passwords, and credentials.

### Features

- **Verified Secrets Only**: Only reports verified secrets (reduces false positives)
- **Git History**: Scans entire git history, not just current state
- **Multiple Formats**: Detects secrets in various formats (AWS keys, GitHub tokens, etc.)
- **PR Comments**: Automatically comments on PRs with findings

### Running

**Automatic**:
- Runs on every push/PR
- Daily scheduled scan at 3 AM

**Manual**:
```bash
# Local scan
docker run -it -v "$PWD:/pwd" trufflesecurity/trufflehog:latest git file:///pwd

# Or via GitHub Actions
gh workflow run secret-scanning.yml
```

## Gitleaks

### Configuration

Gitleaks is configured in `.gitleaks.toml` with:
- Default regex patterns enabled
- Allowlist for known false positives (test files, examples, etc.)
- Custom rules for Remit-Scout specific patterns

### Running

**Automatic**:
- Runs in `.github/workflows/secret-scanning.yml`

**Manual**:
```bash
# Install
brew install gitleaks

# Scan
gitleaks detect --source . --verbose
```

## Yelp Detect Secrets

### Purpose

Baseline-based secret detection that learns from your codebase.

### Setup

1. **Initial Baseline**:
   ```bash
   detect-secrets scan > .secrets.baseline
   ```

2. **Audit Baseline**:
   ```bash
   detect-secrets audit .secrets.baseline
   ```

3. **Update Baseline**:
   - After auditing, update `.secrets.baseline`
   - Commit the updated baseline

### Running

**Automatic**:
- Runs in `.github/workflows/secret-scanning.yml`

**Manual**:
```bash
# Scan
detect-secrets scan --baseline .secrets.baseline

# Audit
detect-secrets audit .secrets.baseline
```

## NPM Audit

### Purpose

Built-in npm/pnpm vulnerability scanning.

### Running

**Automatic**:
- Runs in `.github/workflows/security-scan.yml` for all directories

**Manual**:
```bash
# Root
pnpm audit --audit-level=high

# Backend
pnpm -C backend audit --audit-level=high

# Frontend
pnpm -C frontend audit --audit-level=high
```

## Workflow Integration

All security scans are integrated into GitHub Actions:

1. **`.github/workflows/codeql-analysis.yml`**:
   - CodeQL SAST analysis (JavaScript/TypeScript)

2. **`.github/workflows/security-scan.yml`**:
   - Snyk scanning
   - OWASP ZAP scanning
   - NPM audit
   - TruffleHog secret scanning

3. **`.github/workflows/secret-scanning.yml`**:
   - TruffleHog
   - Gitleaks
   - Detect Secrets

## Viewing Results

### GitHub Security Tab

1. Go to repository → Security tab
2. View:
   - Dependabot alerts
   - Code scanning alerts (Snyk, ZAP)
   - Secret scanning alerts

### Workflow Artifacts

1. Go to Actions → Select workflow run
2. Download artifacts:
   - `snyk-results`
   - `zap-results`
   - `trufflehog-results`
   - `npm-audit-*`

### PR Comments

Some tools automatically comment on PRs:
- TruffleHog (if secrets found)
- NPM Audit (if vulnerabilities found)

## Remediation

### Dependency Vulnerabilities

1. **Dependabot PRs**: Review and merge automatically created PRs
2. **Manual Updates**: Update dependencies manually if needed
3. **Snyk Fixes**: Use `snyk test --fix` for auto-fixable issues

### Secret Remediation

1. **Rotate Credentials**: Immediately rotate any exposed secrets
2. **Remove from History**: Use `git filter-branch` or BFG Repo-Cleaner
3. **Update Secrets**: Update in GitHub Secrets, AWS Secrets Manager, etc.
4. **Prevent Re-exposure**: Add to `.gitignore` and `.secrets.baseline`

### ZAP Findings

1. **Review Report**: Check ZAP HTML report
2. **Fix Issues**: Address high/critical findings
3. **Re-scan**: Verify fixes with another scan

## Best Practices

1. **Regular Reviews**: Review security scan results weekly
2. **Prioritize**: Focus on high/critical severity issues first
3. **Document Exceptions**: Document any accepted risks
4. **Keep Updated**: Regularly update scanning tools and configurations
5. **Monitor**: Set up alerts for critical findings

## Configuration Files

- `.github/dependabot.yml` - Dependabot configuration
- `.github/workflows/codeql-analysis.yml` - CodeQL SAST workflow
- `.github/codeql/codeql-config.yml` - CodeQL analysis configuration
- `.github/workflows/security-scan.yml` - Security scanning workflows
- `.github/workflows/secret-scanning.yml` - Secret scanning workflows
- `.gitleaks.toml` - Gitleaks configuration
- `.secrets.baseline` - Detect Secrets baseline
- `.zap/rules.tsv` - OWASP ZAP rules

## Required Secrets

Add these to GitHub Secrets:

- `SNYK_TOKEN` - Snyk API token (optional, for enhanced features)

## Troubleshooting

### Snyk Not Running

- Check if `SNYK_TOKEN` is set (optional but recommended)
- Verify workflow permissions
- Check workflow logs

### ZAP Scan Fails

- Ensure target application is running
- Check if port 3000 is accessible
- Review ZAP logs in workflow

### Too Many False Positives

- Update allowlists in `.gitleaks.toml`
- Audit and update `.secrets.baseline`
- Adjust severity thresholds in workflows

## Support

For issues or questions:
- Review workflow logs
- Check tool documentation
- Contact security team

