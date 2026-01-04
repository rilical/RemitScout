# Database Migrations in AWS

This document describes how to run database migrations in the AWS-native deployment.

## Overview

Database migrations are managed via `backend/scripts/db-migrate.ts`, which:
1. Creates a `schema_migrations` table to track applied migrations
2. Reads SQL files from `backend/db/migrations/`
3. Applies migrations in order, skipping already-applied ones
4. Uses transactions to ensure atomicity

## Migration Script

**Location**: `backend/scripts/db-migrate.ts`

**Usage**:
```bash
# From backend directory
pnpm tsx scripts/db-migrate.ts
```

**Environment Variables**:
- `DATABASE_URL_PLANE_B` - Connection string for Plane B database (default)
- `PLANE_B_DB_HOST` - RDS Proxy endpoint (if using proxy)
- `PLANE_B_DB_PORT` - Database port (default: 5432)
- `PLANE_B_DB_NAME` - Database name (default: remit_scout)
- `PLANE_B_DB_SECRET_ARN` - Secrets Manager ARN for credentials
- `PLANE_B_DB_SSM_NAME` - SSM Parameter Store path for connection string

## RDS Proxy Support

The migration script supports RDS Proxy endpoints. When using RDS Proxy:

1. **Connection String Format**:
   ```
   postgresql://username:password@proxy-endpoint:5432/dbname
   ```

2. **Secrets Manager Integration**:
   The script reads credentials from Secrets Manager when `PLANE_B_DB_SECRET_ARN` is set:
   ```json
   {
     "username": "remit_scout",
     "password": "...",
     "host": "proxy-endpoint.proxy-xxxxx.us-east-1.rds.amazonaws.com",
     "port": "5432",
     "dbname": "remit_scout"
   }
   ```

3. **Connection Pooling**:
   RDS Proxy handles connection pooling, so the migration script can use standard `pg` Pool connections.

## Running Migrations in CI/CD

### Option 1: CodeBuild Step (Recommended)

Add a migration step to your CodeBuild pipeline:

```yaml
# buildspec.yml
phases:
  pre_build:
    commands:
      - echo "Installing dependencies..."
      - pnpm install --frozen-lockfile
  build:
    commands:
      - echo "Building application..."
      - pnpm -C backend build
  post_build:
    commands:
      - echo "Running database migrations..."
      - |
        cd backend
        export DATABASE_URL_PLANE_B="$PLANE_B_DB_SECRET_ARN"
        pnpm tsx scripts/db-migrate.ts
      - echo "Build completed"
```

**IAM Permissions Required**:
- `secretsmanager:GetSecretValue` for the database secret
- `rds-db:connect` for RDS Proxy (if using IAM auth)

### Option 2: ECS One-Off Task

Run migrations as a one-time ECS task:

```bash
aws ecs run-task \
  --cluster remit-scout-prod \
  --task-definition remit-scout-migration-task \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=DISABLED}" \
  --overrides '{
    "containerOverrides": [{
      "name": "migration",
      "command": ["node", "dist/scripts/db-migrate.js"],
      "environment": [
        {"name": "PLANE_B_DB_SECRET_ARN", "value": "arn:aws:secretsmanager:..."}
      ]
    }]
  }'
```

**Task Definition** (example):
```json
{
  "family": "remit-scout-migration-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [{
    "name": "migration",
    "image": "your-ecr-repo/remit-scout-backend:latest",
    "essential": true,
    "secrets": [{
      "name": "PLANE_B_DB_SECRET_ARN",
      "valueFrom": "arn:aws:secretsmanager:region:account:secret:remit-scout/prod/database"
    }]
  }]
}
```

### Option 3: Lambda Function (For Small Migrations)

For lightweight migrations, you can create a Lambda function:

```typescript
// backend/scripts/aws/db-migrate-lambda.ts
import { handler as migrateHandler } from '../db-migrate'

export const handler = async (event: any) => {
  try {
    await migrateHandler()
    return { statusCode: 200, body: 'Migrations completed' }
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}
```

**Note**: Lambda has a 15-minute timeout limit. For long-running migrations, use ECS.

## Manual Migration Execution

### From Local Machine (with VPN/Bastion)

```bash
# Set up AWS credentials
export AWS_PROFILE=your-profile
export AWS_REGION=us-east-1

# Get database connection from Secrets Manager
export DATABASE_URL_PLANE_B=$(aws secretsmanager get-secret-value \
  --secret-id remit-scout/prod/database \
  --query SecretString --output text | jq -r '.url')

# Run migrations
cd backend
pnpm tsx scripts/db-migrate.ts
```

### From EC2/Bastion Host

```bash
# SSH into bastion
ssh bastion-host

# Clone repository or copy migration files
git clone <repo-url>
cd remit-scout/backend

# Install dependencies
pnpm install --frozen-lockfile

# Run migrations
export DATABASE_URL_PLANE_B="postgresql://..."
pnpm tsx scripts/db-migrate.ts
```

## Migration Validation in CI/CD

Add validation steps to ensure migrations are applied correctly:

### Pre-Deployment Check

```bash
# Check if migrations are up to date
cd backend
pnpm tsx scripts/db-migrate.ts --dry-run

# Or validate migration files
pnpm tsx scripts/validate-migrations.ts
```

### Post-Deployment Verification

```bash
# Verify schema_migrations table
psql $DATABASE_URL_PLANE_B -c "
  SELECT id, applied_at 
  FROM public.schema_migrations 
  ORDER BY applied_at DESC 
  LIMIT 10;
"
```

## Migration Best Practices

1. **Idempotency**: All migrations should be idempotent (safe to run multiple times)
2. **Transactions**: Use transactions for atomicity (already handled by the script)
3. **Backwards Compatibility**: Avoid breaking changes in migrations
4. **Testing**: Test migrations in dev/staging before production
5. **Rollback Plan**: Document rollback procedures for each migration
6. **Timing**: Run migrations during low-traffic periods
7. **Backup**: Take database snapshots before major migrations

## Migration File Naming

Migration files should follow the pattern: `NNN_description.sql`

Example:
- `001_initial_schema.sql`
- `002_add_indexes.sql`
- `003_add_columns.sql`

The script sorts files lexicographically, so use zero-padded numbers.

## Troubleshooting

### Connection Timeout

If migrations timeout, check:
- RDS Proxy connection limits
- Security group rules (allow port 5432)
- VPC routing (if running from Lambda/ECS)

### Permission Denied

Ensure the database user has:
- `CREATE TABLE` permission
- `INSERT` permission on `schema_migrations`
- Permissions for all operations in migration SQL

### Migration Already Applied

The script automatically skips already-applied migrations. To re-run:
1. Remove entry from `schema_migrations` table (not recommended)
2. Or create a new migration file with the fix

## Monitoring

Track migration execution via:
- **CloudWatch Logs**: `/aws/lambda/remit-scout-migration` (if using Lambda)
- **ECS Task Logs**: CloudWatch Logs group for ECS task
- **Database Logs**: RDS/Aurora slow query log

## Related Documentation

- **Migration Script**: `backend/scripts/db-migrate.ts`
- **Database Configuration**: `backend/shared/db.ts`
- **AWS Secrets**: `docs/aws/aws-console-runbook.md`
- **RDS Proxy**: `infrastructure/cdk/lib/database.ts`


