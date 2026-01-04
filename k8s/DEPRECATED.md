# ⚠️ DEPRECATED: Kubernetes Monitoring Files

**Status**: These files are **deprecated** and **not used** in AWS deployments.

## Migration Status

All Kubernetes-based monitoring has been migrated to AWS-native services:

- ✅ **Prometheus** → **CloudWatch Metrics**
- ✅ **Grafana** → **CloudWatch Dashboards**
- ✅ **Alertmanager** → **SNS Topics** (Slack/PagerDuty)
- ✅ **Synthetic Monitor Pod** → **CloudWatch Synthetics**

## Deprecated Files

The following files in this directory are **no longer used**:

- `prometheus-alert-rules.yaml` - Replaced by CloudWatch Alarms in `infrastructure/cdk/lib/monitoring.ts`
- `alertmanager-config.yaml` - Replaced by SNS subscriptions in `infrastructure/cdk/lib/sns-subscriptions.ts`
- `grafana-dashboards/*.json` - Replaced by CloudWatch Dashboards in `infrastructure/cdk/lib/monitoring.ts`
- `synthetic-monitor-deployment.yaml` - Replaced by CloudWatch Synthetics in `infrastructure/cdk/lib/synthetics.ts`

## Migration Documentation

See `docs/aws/monitoring-migration.md` for complete migration details.

## Action Required

These files are kept for reference only. They should **not** be:
- Deployed to Kubernetes clusters
- Used in AWS deployments
- Referenced in new code

If you need to reference the original alert rules or dashboard configurations, see:
- `infrastructure/cdk/lib/monitoring.ts` for CloudWatch Alarms and Dashboards
- `infrastructure/cdk/lib/synthetics.ts` for CloudWatch Synthetics
- `infrastructure/cdk/lib/sns-subscriptions.ts` for alert routing

## Removal Status

✅ **COMPLETED**: All legacy monitoring files have been removed:
- ✅ `prometheus-alert-rules.yaml` - Removed
- ✅ `alertmanager-config.yaml` - Removed
- ✅ `grafana-dashboards/*.json` - Removed
- ✅ `grafana-dashboards-configmap.yaml` - Removed
- ✅ `synthetic-monitor-deployment.yaml` - Removed
- ✅ `grafana-dashboards/` directory - Removed

**Removed Date**: Files have been successfully removed after AWS monitoring migration was completed and verified.

