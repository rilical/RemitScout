import { Duration, RemovalPolicy } from 'aws-cdk-lib'
import { Schedule } from 'aws-cdk-lib/aws-events'
import {
  BackupPlan,
  BackupPlanRule,
  BackupSelection,
  BackupVault,
  BackupVaultEvents,
  BackupResource,
  CfnRestoreTestingPlan,
  CfnRestoreTestingSelection,
} from 'aws-cdk-lib/aws-backup'
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { Topic } from 'aws-cdk-lib/aws-sns'
import type { DatabaseCluster } from 'aws-cdk-lib/aws-rds'
import type { SecurityGroup } from 'aws-cdk-lib/aws-ec2'
import type { Construct } from 'constructs'

export type BackupResources = {
  vault: BackupVault
  plan: BackupPlan
  notificationTopic: Topic
  restoreTestingPlan?: CfnRestoreTestingPlan
  restoreTestingSelection?: CfnRestoreTestingSelection
}

export type BackupOptions = {
  envName: string
  cluster: DatabaseCluster
  dbSecurityGroup: SecurityGroup
  enabled?: boolean
}

export const createBackup = (
  scope: Construct,
  options: BackupOptions,
): BackupResources | null => {
  const isProd = options.envName === 'prod'
  if (options.enabled === false) {
    return null
  }
  const vaultRetentionDays = isProd ? 35 : 14

  const notificationTopic = new Topic(scope, 'DatabaseBackupAlerts', {
    topicName: `remit-scout-${options.envName}-backup-alerts`,
  })

  const vault = new BackupVault(scope, 'DatabaseBackupVault', {
    backupVaultName: `remit-scout-${options.envName}-db`,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    notificationTopic,
    notificationEvents: [
      BackupVaultEvents.BACKUP_JOB_FAILED,
      BackupVaultEvents.RESTORE_JOB_FAILED,
    ],
  })

  const backupRole = new Role(scope, 'DatabaseBackupRole', {
    assumedBy: new ServicePrincipal('backup.amazonaws.com'),
    managedPolicies: [
      ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSBackupServiceRolePolicyForBackup'),
    ],
  })

  const plan = new BackupPlan(scope, 'DatabaseBackupPlan', {
    backupPlanName: `remit-scout-${options.envName}-db`,
  })

  plan.addRule(
    new BackupPlanRule({
      backupVault: vault,
      scheduleExpression: Schedule.cron({ minute: '0', hour: '4' }),
      deleteAfter: Duration.days(vaultRetentionDays),
      startWindow: Duration.hours(2),
      completionWindow: Duration.hours(6),
    }),
  )

  new BackupSelection(scope, 'DatabaseBackupSelection', {
    backupPlan: plan,
    role: backupRole,
    resources: [BackupResource.fromRdsDatabaseCluster(options.cluster)],
  })

  const restoreRole = new Role(scope, 'DatabaseRestoreTestingRole', {
    assumedBy: new ServicePrincipal('backup.amazonaws.com'),
    managedPolicies: [
      ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSBackupServiceRolePolicyForRestores'),
    ],
  })

  let restoreTestingPlan: CfnRestoreTestingPlan | undefined
  let restoreTestingSelection: CfnRestoreTestingSelection | undefined

  if (isProd) {
    const restorePlanName = `remit-scout-${options.envName}-db-restore`

    restoreTestingPlan = new CfnRestoreTestingPlan(scope, 'DatabaseRestoreTestingPlan', {
      restoreTestingPlanName: restorePlanName,
      scheduleExpression: 'cron(0 3 1 * ? *)',
      startWindowHours: 8,
      recoveryPointSelection: {
        algorithm: 'LATEST_WITHIN_WINDOW',
        includeVaults: [vault.backupVaultArn],
        recoveryPointTypes: ['SNAPSHOT'],
        selectionWindowDays: 30,
      },
    })

    const restoreMetadataOverrides: Record<string, string> = {
      DBClusterIdentifier: `remit-scout-${options.envName}-restore-test`,
      VpcSecurityGroupIds: options.dbSecurityGroup.securityGroupId,
    }

    restoreTestingSelection = new CfnRestoreTestingSelection(
      scope,
      'DatabaseRestoreTestingSelection',
      {
        restoreTestingPlanName: restorePlanName,
        restoreTestingSelectionName: `remit-scout-${options.envName}-db-selection`,
        protectedResourceType: 'RDS',
        protectedResourceArns: [options.cluster.clusterArn],
        iamRoleArn: restoreRole.roleArn,
        validationWindowHours: 8,
        restoreMetadataOverrides,
      },
    )

    restoreTestingSelection.addDependency(restoreTestingPlan)
  }

  return {
    vault,
    plan,
    notificationTopic,
    restoreTestingPlan,
    restoreTestingSelection,
  }
}
