# CDK Context Variables

This document lists every context key consumed by `infrastructure/cdk/lib/remit-scout-stack.ts`.

| Context Key | Type | Default | Env Relevance |
|---|---|---|---|
| `alertEvaluationDesiredCount` | `number` | `(unset)` | `all` |
| `alertEvaluationServiceEnabled` | `boolean` | `prod:true` | `all` |
| `auditLogsPrefix` | `string` | `audit-logs` | `all` |
| `backendImageTag` | `string` | `(unset)` | `all` |
| `bronzePrefix` | `string` | `bronze` | `all` |
| `communicationsSecretArn` | `string` | `(unset)` | `all` |
| `costAlertEmails` | `string[]` | `alerts@remit-scout.com` | `all` |
| `costAnomalyThresholdUsd` | `number` | `(unset)` | `all` |
| `costBudgetAmountUsd` | `number` | `(unset)` | `all` |
| `costGuardrailsCreateCur` | `boolean` | `env==prod` | `all` |
| `cpuArchitecture` | `arm64|x86_64|x86|amd64` | `arm64` | `all` |
| `devNatGateways` | `number` | `(unset)` | `dev` |
| `devPaused` | `boolean` | `dev:false` | `dev` |
| `devSharedSecretArn` | `string` | `(unset)` | `dev` |
| `disablePlaneAExecuteEndpoint` | `boolean` | `false` | `all` |
| `disablePlaneCExecuteEndpoint` | `boolean` | `(unset)` | `all` |
| `enableBackup` | `boolean` | `env!=dev` | `all` |
| `enableCloudFront` | `boolean` | `(unset)` | `all` |
| `enableCostGuardrails` | `boolean` | `true` | `all` |
| `enableDbProxy` | `boolean` | `env!=dev` | `all` |
| `enableFrontend` | `boolean` | `env!=dev` | `all` |
| `enableGithubActionsOidc` | `boolean` | `false` | `all` |
| `enablePlaneAJwtAuth` | `boolean` | `(unset)` | `all` |
| `enablePlaneCIamAuth` | `boolean` | `(unset)` | `all` |
| `enableWaf` | `boolean` | `(unset)` | `all` |
| `exportJobQueueMode` | `off|queue|shadow` | `prod/dev:queue, staging:off` | `all` |
| `exportServiceEnabled` | `boolean` | `prod:true` | `all` |
| `exportWorkerDesiredCount` | `number` | `(unset)` | `all` |
| `exportsPrefix` | `string` | `exports` | `all` |
| `frontendBaseUrl` | `string` | `(unset)` | `all` |
| `frontendCertificateArn` | `string` | `(unset)` | `all` |
| `frontendDomainName` | `string` | `(unset)` | `all` |
| `frontendHostedZoneId` | `string` | `(unset)` | `all` |
| `frontendHostedZoneName` | `string` | `(unset)` | `all` |
| `fxRateRefreshQueueMode` | `off|queue|shadow` | `prod/dev:queue, staging:off` | `all` |
| `githubActionsOidcProviderArn` | `string` | `(unset)` | `all` |
| `githubRepoName` | `string` | `(unset)` | `all` |
| `githubRepoOwner` | `string` | `(unset)` | `all` |
| `goldIndicesLookbackDays` | `number` | `(unset)` | `all` |
| `goldLiveDesiredCount` | `number` | `(unset)` | `all` |
| `goldLiveQueueMode` | `off|queue|shadow` | `dev:queue, else off` | `all` |
| `oandaSecretArn` | `string` | `(unset)` | `all` |
| `oandaSsmName` | `string` | `(unset)` | `all` |
| `opsPauseRuleAllowlist` | `string[]` | `(unset)` | `all` |
| `otelLambdaLayerArn` | `string` | `(unset)` | `all` |
| `pagerDutyIntegrationKey` | `string` | `(unset)` | `all` |
| `pipelineConnectionArn` | `string` | `(unset)` | `all` |
| `pipelineEnableDeploy` | `boolean` | `(unset)` | `all` |
| `pipelineEnabled` | `boolean` | `(unset)` | `all` |
| `pipelineRepoBranch` | `string` | `(unset)` | `all` |
| `pipelineRepoName` | `string` | `(unset)` | `all` |
| `pipelineRepoOwner` | `string` | `(unset)` | `all` |
| `pipelineRequireApproval` | `boolean` | `(unset)` | `all` |
| `planeAAdminEmails` | `string[]` | `(unset)` | `all` |
| `planeAB2cMaxBucketDeltaPct` | `number` | `prod:0.2, non-prod:0.25` | `all` |
| `planeACertificateArn` | `string` | `(unset)` | `staging/prod` |
| `planeACorsAllowCredentials` | `boolean` | `(unset)` | `all` |
| `planeACorsAllowedHeaders` | `string[]` | `(unset)` | `all` |
| `planeACorsAllowedMethods` | `string[]` | `(unset)` | `all` |
| `planeACorsOrigins` | `string[]` | `(unset)` | `all` |
| `planeADbSecretArn` | `string` | `(unset)` | `all` |
| `planeADbSecretJsonKey` | `string` | `(unset)` | `all` |
| `planeADbSsmName` | `string` | `(unset)` | `all` |
| `planeADomainName` | `string` | `(unset)` | `staging/prod` |
| `planeAHostedZoneId` | `string` | `(unset)` | `staging/prod` |
| `planeAHostedZoneName` | `string` | `(unset)` | `staging/prod` |
| `planeAJwtAudiences` | `string[]` | `(unset)` | `all` |
| `planeAJwtIssuer` | `string` | `(unset)` | `all` |
| `planeAThrottleBurst` | `number` | `(unset)` | `all` |
| `planeAThrottleRate` | `number` | `(unset)` | `all` |
| `planeBB2bMaxQueueDepth` | `number` | `(unset)` | `all` |
| `planeBB2bObservationMode` | `string` | `(unset)` | `all` |
| `planeBB2bTargetMinutes` | `number` | `(unset)` | `all` |
| `planeBB2cQueueInSweep` | `boolean` | `(unset)` | `all` |
| `planeBB2cRefreshDesiredCount` | `number` | `(unset)` | `all` |
| `planeBB2cRefreshServiceEnabled` | `boolean` | `prod/dev:true` | `all` |
| `planeBDbSecretArn` | `string` | `(unset)` | `all` |
| `planeBDbSsmName` | `string` | `(unset)` | `all` |
| `planeBDisableTier1` | `boolean` | `dev/staging:true` | `all` |
| `planeBFxRateRefreshDesiredCount` | `number` | `(unset)` | `all` |
| `planeBFxRateRefreshServiceEnabled` | `boolean` | `prod/dev:true` | `all` |
| `planeBIngestDesiredCount` | `number` | `(unset)` | `all` |
| `planeBIngestFanoutMessageMode` | `corridor|provider` | `(unset)` | `all` |
| `planeBIngestFanoutMode` | `off|queue|shadow` | `prod/dev:queue, staging:off` | `all` |
| `planeBIngestFanoutTier1DesiredCount` | `number` | `(unset)` | `all` |
| `planeBIngestFanoutTier2DesiredCount` | `number` | `(unset)` | `all` |
| `planeBNotificationsDesiredCount` | `number` | `(unset)` | `all` |
| `planeBNotificationsMode` | `off|queue|shadow` | `prod/dev:queue, staging:off` | `all` |
| `planeBOpsAlertsDesiredCount` | `number` | `(unset)` | `all` |
| `planeBOpsAlertsMode` | `off|queue|shadow` | `prod/dev:queue, staging:off` | `all` |
| `planeBQueueWorkerDesiredCount` | `number` | `(unset)` | `all` |
| `planeBQueueWorkerMaxCount` | `number` | `prod:20, dev:5, staging:50` | `all` |
| `planeBQueueWorkerSpotOnly` | `boolean` | `(unset)` | `all` |
| `planeCBaseUrl` | `string` | `(unset)` | `all` |
| `planeCDbSecretArn` | `string` | `(unset)` | `all` |
| `planeCDbSecretJsonKey` | `string` | `(unset)` | `all` |
| `planeCDbSsmName` | `string` | `(unset)` | `all` |
| `planeCThrottleBurst` | `number` | `(unset)` | `all` |
| `planeCThrottleRate` | `number` | `(unset)` | `all` |
| `providerWeightWindowDays` | `number` | `(unset)` | `all` |
| `proxyDatacenterSecretArn` | `string` | `(unset)` | `all` |
| `proxyDatacenterSecretJsonKey` | `string` | `(unset)` | `all` |
| `proxyDatacenterSsmName` | `string` | `(unset)` | `all` |
| `proxyDatacenterUrl` | `string` | `(unset)` | `all` |
| `proxyResidentialSecretArn` | `string` | `(unset)` | `all` |
| `proxyResidentialSecretJsonKey` | `string` | `(unset)` | `all` |
| `proxyResidentialSsmName` | `string` | `(unset)` | `all` |
| `proxyResidentialUrl` | `string` | `(unset)` | `all` |
| `publicAdsEnabled` | `boolean` | `(unset)` | `all` |
| `publicGa4MeasurementId` | `string` | `(unset)` | `all` |
| `publicMetaPixelId` | `string` | `(unset)` | `all` |
| `publicPulseEnabled` | `boolean` | `(unset)` | `all` |
| `publicSupabaseAnonKey` | `string` | `(unset)` | `all` |
| `publicSupabaseAnonKeySecretJsonKey` | `string` | `(unset)` | `all` |
| `publicSupabaseUrl` | `string` | `(unset)` | `all` |
| `publicSupabaseUrlSecretJsonKey` | `string` | `(unset)` | `all` |
| `quoteRefreshQueueMode` | `off|queue|shadow` | `prod/dev:queue, staging:off` | `all` |
| `redisSecretArn` | `string` | `(unset)` | `all` |
| `redisSecretJsonKey` | `string` | `(unset)` | `all` |
| `redisSsmName` | `string` | `(unset)` | `all` |
| `sentrySecretArn` | `string` | `(unset)` | `all` |
| `sentrySecretJsonKey` | `string` | `(unset)` | `all` |
| `sharedSecretArn` | `string` | `(unset)` | `all` |
| `slackCriticalChannelId` | `string` | `(unset)` | `all` |
| `slackOpsChannelId` | `string` | `(unset)` | `all` |
| `slackWarningChannelId` | `string` | `(unset)` | `all` |
| `slackWebhookUrl` | `string` | `(unset)` | `all` |
| `slackWorkspaceId` | `string` | `(unset)` | `all` |
| `stripeSecretArn` | `string` | `(unset)` | `all` |
| `stripeSsmName` | `string` | `(unset)` | `all` |
| `supabaseSecretArn` | `string` | `(unset)` | `all` |
| `supabaseSsmName` | `string` | `(unset)` | `all` |
| `tagOwner` | `string` | `(unset)` | `all` |
| `userAssetsPrefix` | `string` | `avatars` | `all` |
| `wafAllowListIps` | `string[]` | `(unset)` | `all` |
| `wafBlockListIps` | `string[]` | `(unset)` | `all` |
| `wafEnableBotControl` | `boolean` | `(unset)` | `all` |

## Notes

- Queue mode keys accept `off`, `queue`, or `shadow`.
- Boolean values accept `1/0`, `true/false`, or `yes/no`.
- List keys accept comma-separated strings or JSON arrays in `cdk.json`.
- Unknown non-reserved context keys fail synth via strict schema validation.