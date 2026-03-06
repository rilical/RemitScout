AWS_PROFILE ?= rs-dev
AWS_REGION ?= us-east-1
OPS_AWS_ENV ?= staging
SEND_CURRENCIES_MACRO ?= USD,AED,GBP,EUR
RIGHTS_RECOVERY_HOT_LANES ?= US-AL-USD-ALL,US-AR-USD-ARS
OPS_CLUSTER ?= remit-scout-$(OPS_AWS_ENV)
OPS_CLUSTER_NAME ?= $(OPS_CLUSTER)
AWS_ACCOUNT ?= $(shell AWS_PROFILE=$(AWS_PROFILE) aws sts get-caller-identity --query Account --output text)
CDK_DEFAULT_ACCOUNT := $(AWS_ACCOUNT)
CDK_DEFAULT_REGION := $(AWS_REGION)
OPS_PAUSE_FN_PREFIX ?= remit-scout-dev-OpsPauseControllerFunction
OPS_PAUSE_FN_PREFIX_OVERRIDE ?=
COMMUNICATIONS_SECRET_NAME ?= remit-scout/dev/communications
COMMUNICATIONS_SECRET_ARN ?= $(shell AWS_PROFILE=$(AWS_PROFILE) aws secretsmanager describe-secret --region $(AWS_REGION) --secret-id $(COMMUNICATIONS_SECRET_NAME) --query ARN --output text 2>/dev/null)

# Single source of truth for dev pause/resume behavior (ops allowlist + nightly auto-pause).
DEV_RUNTIME_CONFIG ?= ops/dev-runtime.json
STAGING_RUNTIME_CONFIG ?= ops/staging-runtime.json
OPS_PAUSE_RULE_ALLOWLIST ?= $(shell jq -r '.opsPauseRuleAllowlist // [] | if type=="array" then join(",") else tostring end' "$(DEV_RUNTIME_CONFIG)" 2>/dev/null || echo "")
OPS_RESUME_RULE_ALLOWLIST ?= $(shell jq -r '.opsResumeRuleAllowlist // [] | if type=="array" then join(",") else tostring end' "$(DEV_RUNTIME_CONFIG)" 2>/dev/null || echo "")
PURGE_QUEUES_ON_RESUME ?= $(shell jq -r '.purgeQueuesOnResume // true' "$(DEV_RUNTIME_CONFIG)" 2>/dev/null || echo "true")
PURGE_QUEUE_ALLOWLIST ?= $(shell jq -r '.purgeQueueAllowlist // [] | if type=="array" then join(",") else tostring end' "$(DEV_RUNTIME_CONFIG)" 2>/dev/null || echo "")
DEV_NIGHTLY_PAUSE_ENABLED ?= $(shell jq -r '.nightlyAutoPause.enabled // false' "$(DEV_RUNTIME_CONFIG)" 2>/dev/null || echo "false")
DEV_NIGHTLY_PAUSE_TIMEZONE ?= $(shell jq -r '.nightlyAutoPause.timezone // "America/New_York"' "$(DEV_RUNTIME_CONFIG)" 2>/dev/null || echo "America/New_York")
DEV_NIGHTLY_PAUSE_CRON ?= $(shell jq -r '.nightlyAutoPause.cron // "cron(0 0 * * ? *)"' "$(DEV_RUNTIME_CONFIG)" 2>/dev/null || echo "cron(0 0 * * ? *)")

.PHONY: pause-dev resume-dev resume-dev-minimal status-dev status-staging status-env status-% ops-pause-dev ops-resume-dev ops-pause-staging ops-resume-staging ops-pause-env ops-resume-env ops-pause-% ops-resume-% dev-sanitize db-migrate-dev db-migrate-staging db-migrate-prod db-migrate-% rights-recovery-global rights-recovery-global-apply rights-validate-activation rights-recovery-macro rights-recovery-macro-apply
.PHONY: status-ops-permissions hotfix-ops-pause-status hotfix-ops-pause-status-% hotfix-ops-pause-cleanup hotfix-ops-pause-cleanup-% db-migrate-staging-dry-run db-migrate-staging-local

pause-dev:
	@echo "Pausing dev (CDK deploy with devPaused=true)"
	@cd infrastructure/cdk && \
			export AWS_SDK_LOAD_CONFIG=1 AWS_PROFILE=$(AWS_PROFILE) CDK_DEFAULT_ACCOUNT=$(CDK_DEFAULT_ACCOUNT) CDK_DEFAULT_REGION=$(CDK_DEFAULT_REGION) COMMUNICATIONS_SECRET_ARN="$(COMMUNICATIONS_SECRET_ARN)" SHARED_SECRET_ARN="$(COMMUNICATIONS_SECRET_ARN)"; \
			eval "$$(aws configure export-credentials --profile $(AWS_PROFILE) --format env)"; \
			npx cdk deploy -c env=dev -c devPaused=true \
				-c opsPauseRuleAllowlist="$(OPS_PAUSE_RULE_ALLOWLIST)" \
				-c opsResumeRuleAllowlist="$(OPS_RESUME_RULE_ALLOWLIST)" \
				-c purgeQueuesOnResume="$(PURGE_QUEUES_ON_RESUME)" \
				-c purgeQueueAllowlist="$(PURGE_QUEUE_ALLOWLIST)" \
				-c devNightlyPauseEnabled="$(DEV_NIGHTLY_PAUSE_ENABLED)" \
				-c devNightlyPauseTimezone="$(DEV_NIGHTLY_PAUSE_TIMEZONE)" \
				-c devNightlyPauseCron="$(DEV_NIGHTLY_PAUSE_CRON)" \
				--require-approval never
	@$(MAKE) ops-pause-dev

resume-dev:
	@echo "Resuming dev (CDK deploy with devPaused=false)"
	@cd infrastructure/cdk && \
			export AWS_SDK_LOAD_CONFIG=1 AWS_PROFILE=$(AWS_PROFILE) CDK_DEFAULT_ACCOUNT=$(CDK_DEFAULT_ACCOUNT) CDK_DEFAULT_REGION=$(CDK_DEFAULT_REGION) COMMUNICATIONS_SECRET_ARN="$(COMMUNICATIONS_SECRET_ARN)" SHARED_SECRET_ARN="$(COMMUNICATIONS_SECRET_ARN)"; \
			eval "$$(aws configure export-credentials --profile $(AWS_PROFILE) --format env)"; \
			npx cdk deploy -c env=dev -c devPaused=false \
				-c opsPauseRuleAllowlist="$(OPS_PAUSE_RULE_ALLOWLIST)" \
				-c opsResumeRuleAllowlist="$(OPS_RESUME_RULE_ALLOWLIST)" \
				-c purgeQueuesOnResume="$(PURGE_QUEUES_ON_RESUME)" \
				-c purgeQueueAllowlist="$(PURGE_QUEUE_ALLOWLIST)" \
				-c devNightlyPauseEnabled="$(DEV_NIGHTLY_PAUSE_ENABLED)" \
				-c devNightlyPauseTimezone="$(DEV_NIGHTLY_PAUSE_TIMEZONE)" \
				-c devNightlyPauseCron="$(DEV_NIGHTLY_PAUSE_CRON)" \
				--require-approval never
	@$(MAKE) ops-resume-dev

resume-dev-minimal:
	@echo "Resuming dev in minimal infra mode (reduced resource footprint)"
	@cd infrastructure/cdk && \
			export AWS_SDK_LOAD_CONFIG=1 AWS_PROFILE=$(AWS_PROFILE) CDK_DEFAULT_ACCOUNT=$(CDK_DEFAULT_ACCOUNT) CDK_DEFAULT_REGION=$(CDK_DEFAULT_REGION) COMMUNICATIONS_SECRET_ARN="$(COMMUNICATIONS_SECRET_ARN)" SHARED_SECRET_ARN="$(COMMUNICATIONS_SECRET_ARN)"; \
			eval "$$(aws configure export-credentials --profile $(AWS_PROFILE) --format env)"; \
			npx cdk deploy -c env=dev -c devPaused=false -c devMinimalInfra=true \
				-c opsPauseRuleAllowlist="$(OPS_PAUSE_RULE_ALLOWLIST)" \
				-c opsResumeRuleAllowlist="$(OPS_RESUME_RULE_ALLOWLIST)" \
				-c purgeQueuesOnResume="$(PURGE_QUEUES_ON_RESUME)" \
				-c purgeQueueAllowlist="$(PURGE_QUEUE_ALLOWLIST)" \
				-c devNightlyPauseEnabled="$(DEV_NIGHTLY_PAUSE_ENABLED)" \
				-c devNightlyPauseTimezone="$(DEV_NIGHTLY_PAUSE_TIMEZONE)" \
				-c devNightlyPauseCron="$(DEV_NIGHTLY_PAUSE_CRON)" \
				--require-approval never
	@$(MAKE) ops-resume-dev

ops-pause-dev:
	@echo "Ops-pause dev (disable rules, scale ECS to 0, stop DB)"
	@FN=$$(AWS_PROFILE=$(AWS_PROFILE) aws lambda list-functions \
		--region $(AWS_REGION) \
		--output json | jq -r '.Functions[]? | .FunctionName // empty | select(startswith("$(OPS_PAUSE_FN_PREFIX)"))' | head -n1); \
	if [ -z "$$FN" ] || [ "$$FN" = "None" ]; then \
		echo "ERROR: OpsPause controller Lambda not found (prefix: $(OPS_PAUSE_FN_PREFIX))"; \
		exit 1; \
	fi; \
	AWS_PROFILE=$(AWS_PROFILE) aws lambda invoke \
		--cli-connect-timeout 10 \
		--cli-read-timeout 300 \
		--region $(AWS_REGION) \
		--cli-binary-format raw-in-base64-out \
		--function-name "$$FN" \
		--payload '{"paused": true}' \
		/tmp/remit-scout-ops-pause-dev.json >/dev/null; \
	cat /tmp/remit-scout-ops-pause-dev.json; \
	rm -f /tmp/remit-scout-ops-pause-dev.json

ops-resume-dev:
	@echo "Ops-resume dev (enable rules, restore ECS baselines, start DB)"
	@FN=$$(AWS_PROFILE=$(AWS_PROFILE) aws lambda list-functions \
		--region $(AWS_REGION) \
		--output json | jq -r '.Functions[]? | .FunctionName // empty | select(startswith("$(OPS_PAUSE_FN_PREFIX)"))' | head -n1); \
	if [ -z "$$FN" ] || [ "$$FN" = "None" ]; then \
		echo "ERROR: OpsPause controller Lambda not found (prefix: $(OPS_PAUSE_FN_PREFIX))"; \
		exit 1; \
	fi; \
	AWS_PROFILE=$(AWS_PROFILE) aws lambda invoke \
		--cli-connect-timeout 10 \
		--cli-read-timeout 300 \
		--region $(AWS_REGION) \
		--cli-binary-format raw-in-base64-out \
		--function-name "$$FN" \
		--payload '{"paused": false}' \
		/tmp/remit-scout-ops-resume-dev.json >/dev/null; \
	cat /tmp/remit-scout-ops-resume-dev.json; \
	rm -f /tmp/remit-scout-ops-resume-dev.json

dev-sanitize:
	@echo "Dev sanitize: stop orphaned EventBridge-started tasks + purge key queues"
	@CLUSTER="remit-scout-dev"; \
	TASKS=$$(AWS_PROFILE=$(AWS_PROFILE) aws ecs list-tasks \
		--cluster "$$CLUSTER" \
		--region $(AWS_REGION) \
		--desired-status RUNNING \
		| jq -r '.taskArns[]' | tr '\n' ' '); \
	if [ -n "$$TASKS" ]; then \
		ORPHANS=$$(AWS_PROFILE=$(AWS_PROFILE) aws ecs describe-tasks \
			--cluster "$$CLUSTER" \
			--region $(AWS_REGION) \
			--tasks $$TASKS \
			| jq -r '.tasks[] | select((.startedBy // "") | startswith("events-rule/")) | .taskArn'); \
		if [ -n "$$ORPHANS" ]; then \
			echo "Stopping orphan tasks:"; \
			echo "$$ORPHANS"; \
			for arn in $$ORPHANS; do \
				AWS_PROFILE=$(AWS_PROFILE) aws ecs stop-task \
					--cluster "$$CLUSTER" \
					--region $(AWS_REGION) \
					--task "$$arn" \
					--reason "dev-sanitize: orphaned events-rule task" >/dev/null; \
			done; \
		else \
			echo "No orphan event-rule tasks running."; \
		fi; \
	else \
		echo "No RUNNING tasks in $$CLUSTER."; \
	fi; \
	echo "Purging key dev queues (non-DLQ): ingest-fanout-tier2, gold-live, ops-alerts"; \
	for suffix in ingest-fanout-tier2 gold-live ops-alerts; do \
		NAME="remit-scout-dev-$$suffix"; \
		URL=$$(AWS_PROFILE=$(AWS_PROFILE) aws sqs get-queue-url \
			--queue-name "$$NAME" \
			--region $(AWS_REGION) \
			--query 'QueueUrl' \
			--output text 2>/dev/null); \
		if [ -n "$$URL" ] && [ "$$URL" != "None" ]; then \
			AWS_PROFILE=$(AWS_PROFILE) aws sqs purge-queue --queue-url "$$URL" --region $(AWS_REGION) >/dev/null || true; \
			echo "Purge requested: $$NAME"; \
		else \
			echo "Queue missing or inaccessible: $$NAME"; \
		fi; \
	done; \
	echo "Snapshot:"; \
	$(MAKE) status-dev

status-dev:
	@echo "ECS service counts (dev)"
	@SERVICES=$$(AWS_PROFILE=$(AWS_PROFILE) aws ecs list-services \
		--cluster remit-scout-dev \
		--region $(AWS_REGION) \
		--query 'serviceArns' --output text); \
	if [ -n "$$SERVICES" ] && [ "$$SERVICES" != "None" ]; then \
		read -r -a service_arns <<< "$$SERVICES"; \
		printf "%-45s %7s %7s %7s\n" "NAME" "DESIRED" "RUNNING" "PENDING"; \
		for ((i=0; i<$${#service_arns[@]}; i+=10)); do \
			batch=("$${service_arns[@]:i:10}"); \
			AWS_PROFILE=$(AWS_PROFILE) aws ecs describe-services \
				--cluster remit-scout-dev \
				--services "$${batch[@]}" \
				--region $(AWS_REGION) \
				--query 'services[].[serviceName,desiredCount,runningCount,pendingCount]' \
				--output text; \
		done | sort | awk '{printf "%-45s %7s %7s %7s\n", $$1, $$2, $$3, $$4}'; \
	else \
		echo "No ECS services found."; \
	fi
	@echo "EventBridge rules (dev)"
	@AWS_PROFILE=$(AWS_PROFILE) aws events list-rules \
		--name-prefix remit-scout-dev \
		--region $(AWS_REGION) \
		--query 'Rules[].{name:Name,state:State,expr:ScheduleExpression}' \
		--output table
	@echo "Drift check (optional)"
	@echo "aws cloudformation detect-stack-drift --stack-name remit-scout-dev --region $(AWS_REGION) --profile $(AWS_PROFILE)"

status-env:
	@echo "ECS service counts ($(OPS_AWS_ENV))"
	@CLUSTER="remit-scout-$(OPS_AWS_ENV)"; \
	SERVICES=$$(AWS_PROFILE=$(AWS_PROFILE) aws ecs list-services \
		--cluster "$$CLUSTER" \
		--region $(AWS_REGION) \
		--query 'serviceArns' --output text); \
	if [ -n "$$SERVICES" ] && [ "$$SERVICES" != "None" ]; then \
		read -r -a service_arns <<< "$$SERVICES"; \
		printf "%-45s %7s %7s %7s\n" "NAME" "DESIRED" "RUNNING" "PENDING"; \
		for ((i=0; i<$${#service_arns[@]}; i+=10)); do \
			batch=("$${service_arns[@]:i:10}"); \
			AWS_PROFILE=$(AWS_PROFILE) aws ecs describe-services \
				--cluster "$$CLUSTER" \
				--services "$${batch[@]}" \
				--region $(AWS_REGION) \
				--query 'services[].[serviceName,desiredCount,runningCount,pendingCount]' \
				--output text; \
		done | sort | awk '{printf "%-45s %7s %7s %7s\n", $$1, $$2, $$3, $$4}'; \
	else \
		echo "No ECS services found."; \
	fi
	@echo "EventBridge rules ($(OPS_AWS_ENV))"
	@AWS_PROFILE=$(AWS_PROFILE) aws events list-rules \
		--name-prefix remit-scout-$(OPS_AWS_ENV) \
		--region $(AWS_REGION) \
		--query 'Rules[].{name:Name,state:State,expr:ScheduleExpression}' \
		--output table
	@echo "Aurora status ($(OPS_AWS_ENV))"
	@AWS_PROFILE=$(AWS_PROFILE) aws rds describe-db-clusters \
		--region $(AWS_REGION) \
		--query "DBClusters[?starts_with(DBClusterIdentifier, 'remit-scout-$(OPS_AWS_ENV)')].{id:DBClusterIdentifier,status:Status,engine:Engine}" \
		--output table
	@echo "Drift check (optional)"
	@echo "aws cloudformation detect-stack-drift --stack-name remit-scout-$(OPS_AWS_ENV) --region $(AWS_REGION) --profile $(AWS_PROFILE)"

status-staging:
	@$(MAKE) OPS_AWS_ENV=staging status-env

status-%:
	@$(MAKE) OPS_AWS_ENV=$* status-env

ops-pause-env:
	@echo "Ops-pause $(OPS_AWS_ENV) (disable rules, scale ECS to 0, stop DB)"
	@FN_PREFIX=$${OPS_PAUSE_FN_PREFIX_OVERRIDE:-remit-scout-$(OPS_AWS_ENV)-OpsPauseControllerFunction}; \
	FN=$$(AWS_PROFILE=$(AWS_PROFILE) aws lambda list-functions \
		--region $(AWS_REGION) \
		--output json | jq -r --arg prefix "$$FN_PREFIX" '.Functions[]? | .FunctionName // empty | select(startswith($$prefix))' | head -n1); \
	if [ -z "$$FN" ] || [ "$$FN" = "None" ]; then \
		FN=$$(AWS_PROFILE=$(AWS_PROFILE) aws lambda list-functions \
			--region $(AWS_REGION) \
			--output json | jq -r '.Functions[]? | .FunctionName // empty | select(contains("remit-scout-$(OPS_AWS_ENV)") and contains("OpsPauseControllerFuncti"))' | head -n1); \
	fi; \
	if [ -z "$$FN" ] || [ "$$FN" = "None" ]; then \
		echo "ERROR: OpsPause controller Lambda not found (prefix: $$FN_PREFIX)"; \
		exit 1; \
	fi; \
	OUT="/tmp/remit-scout-ops-pause-$(OPS_AWS_ENV).json"; \
	AWS_PROFILE=$(AWS_PROFILE) aws lambda invoke \
		--cli-connect-timeout 10 \
		--cli-read-timeout 300 \
		--region $(AWS_REGION) \
		--cli-binary-format raw-in-base64-out \
		--function-name "$$FN" \
		--payload '{"paused": true}' \
		"$$OUT" >/dev/null || exit 1; \
	if [ ! -f "$$OUT" ]; then \
		echo "ERROR: OpsPause invoke returned no output payload."; \
		exit 1; \
	fi; \
	cat "$$OUT"; \
	rm -f "$$OUT"

ops-resume-env:
	@echo "Ops-resume $(OPS_AWS_ENV) (enable rules, restore ECS baselines, start DB)"
	@FN_PREFIX=$${OPS_PAUSE_FN_PREFIX_OVERRIDE:-remit-scout-$(OPS_AWS_ENV)-OpsPauseControllerFunction}; \
	FN=$$(AWS_PROFILE=$(AWS_PROFILE) aws lambda list-functions \
		--region $(AWS_REGION) \
		--output json | jq -r --arg prefix "$$FN_PREFIX" '.Functions[]? | .FunctionName // empty | select(startswith($$prefix))' | head -n1); \
	if [ -z "$$FN" ] || [ "$$FN" = "None" ]; then \
		FN=$$(AWS_PROFILE=$(AWS_PROFILE) aws lambda list-functions \
			--region $(AWS_REGION) \
			--output json | jq -r '.Functions[]? | .FunctionName // empty | select(contains("remit-scout-$(OPS_AWS_ENV)") and contains("OpsPauseControllerFuncti"))' | head -n1); \
	fi; \
	if [ -z "$$FN" ] || [ "$$FN" = "None" ]; then \
		echo "ERROR: OpsPause controller Lambda not found (prefix: $$FN_PREFIX)"; \
		exit 1; \
	fi; \
	OUT="/tmp/remit-scout-ops-resume-$(OPS_AWS_ENV).json"; \
	AWS_PROFILE=$(AWS_PROFILE) aws lambda invoke \
		--cli-connect-timeout 10 \
		--cli-read-timeout 300 \
		--region $(AWS_REGION) \
		--cli-binary-format raw-in-base64-out \
		--function-name "$$FN" \
		--payload '{"paused": false}' \
		"$$OUT" >/dev/null || exit 1; \
	if [ ! -f "$$OUT" ]; then \
		echo "ERROR: OpsResume invoke returned no output payload."; \
		exit 1; \
	fi; \
	cat "$$OUT"; \
	rm -f "$$OUT"

ops-pause-staging:
	@$(MAKE) OPS_AWS_ENV=staging ops-pause-env

ops-resume-staging:
	@$(MAKE) OPS_AWS_ENV=staging ops-resume-env

ops-pause-%:
	@$(MAKE) OPS_AWS_ENV=$* ops-pause-env

ops-resume-%:
	@$(MAKE) OPS_AWS_ENV=$* ops-resume-env

status-ops-permissions:
	@echo "Checking ECS/cloudwatch visibility for current AWS principal"
	@OPS_ENV=$${OPS_ENV:-dev}; \
	TARGET_CLUSTER=$${TARGET_CLUSTER:-remit-scout-$$OPS_ENV}; \
	TARGET_LOG_PREFIX=$${TARGET_LOG_PREFIX:-/remit-scout-$$OPS_ENV}; \
	AWS_PROFILE=$(AWS_PROFILE) AWS_REGION=$(AWS_REGION) OPS_ENV=$$OPS_ENV TARGET_CLUSTER=$$TARGET_CLUSTER TARGET_LOG_PREFIX=$$TARGET_LOG_PREFIX bash ops/check-aws-ops-permissions.sh

hotfix-ops-pause-status:
	@AWS_PROFILE=$(AWS_PROFILE) AWS_REGION=$(AWS_REGION) OPS_ENV=$(OPS_AWS_ENV) bash ops/reconcile-ops-pause-hotfix.sh

hotfix-ops-pause-status-%:
	@$(MAKE) OPS_AWS_ENV=$* hotfix-ops-pause-status

hotfix-ops-pause-cleanup:
	@AWS_PROFILE=$(AWS_PROFILE) AWS_REGION=$(AWS_REGION) OPS_ENV=$(OPS_AWS_ENV) APPLY=1 bash ops/reconcile-ops-pause-hotfix.sh

hotfix-ops-pause-cleanup-%:
	@$(MAKE) OPS_AWS_ENV=$* hotfix-ops-pause-cleanup

status-dev-b2c:
	@$(MAKE) status-dev
	@echo "SQS backlog snapshot (dev)"
	@for suffix in quote-refresh fx-rate-refresh ingest-fanout ingest-fanout-tier2; do \
		NAME="remit-scout-dev-$$suffix"; \
		URL=$$(AWS_PROFILE=$(AWS_PROFILE) aws sqs get-queue-url --queue-name "$$NAME" --region $(AWS_REGION) --query 'QueueUrl' --output text 2>/dev/null); \
		if [ -n "$$URL" ] && [ "$$URL" != "None" ]; then \
			ATTR=$$(AWS_PROFILE=$(AWS_PROFILE) aws sqs get-queue-attributes --queue-url "$$URL" --region $(AWS_REGION) --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible --query 'Attributes' --output json); \
			echo "$$NAME: $$ATTR"; \
		else \
			echo "$$NAME: unavailable"; \
		fi; \
	done
	@echo "Quote freshness snapshot (dev)"
	@pnpm -C backend ops:dev-b2c-snapshot

rights-recovery-global:
	@echo "Rights recovery (global, data-only strict, dry-run)"
	@pnpm -C backend capability:seed-global
	@STRICT_COUNTRY_SYNC=1 pnpm -C backend rights:sync-countries
	@STRICT_DATA_HEALTH=1 RIGHTS_SCOPE=all pnpm -C backend rights:differential
	@RIGHTS_SCOPE=all pnpm -C backend rights:delta-capability

rights-recovery-global-apply:
	@echo "Rights recovery (global, data-only strict, full apply)"
	@pnpm -C backend capability:seed-global
	@STRICT_COUNTRY_SYNC=1 pnpm -C backend rights:sync-countries
	@STRICT_DATA_HEALTH=1 RIGHTS_SCOPE=all pnpm -C backend rights:differential
	@RIGHTS_SCOPE=all pnpm -C backend rights:delta-capability
	@RIGHTS_SCOPE=all APPLY=1 pnpm -C backend rights:delta-capability
	@STRICT_DATA_HEALTH=1 RIGHTS_SCOPE=all pnpm -C backend rights:differential
	@$(MAKE) rights-validate-activation

rights-validate-activation:
	@echo "Validating rights activation baseline and hot-lane forensics"
	@pnpm -C backend rights:validate-activation
	@for corridor in $$(echo "$(RIGHTS_RECOVERY_HOT_LANES)" | tr ',' ' '); do \
		CORRIDOR_ID="$$corridor" pnpm -C backend corridor:forensics; \
	done

rights-recovery-macro:
	@echo "Rights recovery (macro diagnostic subset, data-only strict, dry-run)"
	@SEND_CURRENCIES=$(SEND_CURRENCIES_MACRO) pnpm -C backend capability:seed-macro
	@STRICT_COUNTRY_SYNC=1 pnpm -C backend rights:sync-countries
	@STRICT_DATA_HEALTH=1 RIGHTS_SCOPE=macro SEND_CURRENCIES=$(SEND_CURRENCIES_MACRO) pnpm -C backend rights:differential
	@RIGHTS_SCOPE=macro SEND_CURRENCIES=$(SEND_CURRENCIES_MACRO) pnpm -C backend rights:delta-capability
	@for corridor in $$(echo "$(RIGHTS_RECOVERY_HOT_LANES)" | tr ',' ' '); do \
		CORRIDOR_ID="$$corridor" pnpm -C backend corridor:forensics; \
	done

rights-recovery-macro-apply:
	@if [ -z "$(APPLY_PROVIDERS)" ]; then \
		echo "ERROR: APPLY_PROVIDERS is required for controlled apply batches (example: APPLY_PROVIDERS=wise,remitly)"; \
		exit 1; \
	fi
	@echo "Rights recovery (macro diagnostic subset, apply batch providers: $(APPLY_PROVIDERS))"
	@SEND_CURRENCIES=$(SEND_CURRENCIES_MACRO) pnpm -C backend capability:seed-macro
	@STRICT_COUNTRY_SYNC=1 pnpm -C backend rights:sync-countries
	@STRICT_DATA_HEALTH=1 RIGHTS_SCOPE=macro SEND_CURRENCIES=$(SEND_CURRENCIES_MACRO) pnpm -C backend rights:differential
	@RIGHTS_SCOPE=macro SEND_CURRENCIES=$(SEND_CURRENCIES_MACRO) pnpm -C backend rights:delta-capability
	@RIGHTS_SCOPE=macro SEND_CURRENCIES=$(SEND_CURRENCIES_MACRO) APPLY=1 APPLY_PROVIDERS="$(APPLY_PROVIDERS)" pnpm -C backend rights:delta-capability
	@STRICT_DATA_HEALTH=1 RIGHTS_SCOPE=macro SEND_CURRENCIES=$(SEND_CURRENCIES_MACRO) pnpm -C backend rights:differential
	@for corridor in $$(echo "$(RIGHTS_RECOVERY_HOT_LANES)" | tr ',' ' '); do \
		CORRIDOR_ID="$$corridor" pnpm -C backend corridor:forensics; \
	done

db-migrate-staging-dry-run:
	@if [ -z "$(DATABASE_URL_PLANE_B)" ]; then \
		echo "ERROR: DATABASE_URL_PLANE_B is required for direct DB migration checks."; \
		exit 1; \
	fi
	@echo "Running staging-style migration dry-run using DATABASE_URL_PLANE_B"
	@ALLOW_DB_MIGRATOR_URL=1 \
		DATABASE_URL_PLANE_B_MIGRATOR="$(DATABASE_URL_PLANE_B)" \
		DATABASE_URL_PLANE_B="$(DATABASE_URL_PLANE_B)" \
		pnpm -C backend db:migrate --dry-run

db-migrate-staging-local:
	@if [ -z "$(DATABASE_URL_PLANE_B)" ]; then \
		echo "ERROR: DATABASE_URL_PLANE_B is required for direct DB migration checks."; \
		exit 1; \
	fi
	@echo "Applying staging-style migration flow using DATABASE_URL_PLANE_B"
	@ALLOW_DB_MIGRATOR_URL=1 \
		DATABASE_URL_PLANE_B_MIGRATOR="$(DATABASE_URL_PLANE_B)" \
		DATABASE_URL_PLANE_B="$(DATABASE_URL_PLANE_B)" \
		pnpm -C backend db:migrate

db-migrate-dev:
	@$(MAKE) db-migrate-env ENV=dev

db-migrate-staging:
	@$(MAKE) db-migrate-env ENV=staging

db-migrate-prod:
	@$(MAKE) db-migrate-env ENV=prod

.PHONY: db-migrate-env
db-migrate-env:
	@ENV_NAME="$${ENV:-dev}"; \
	CLUSTER="remit-scout-$$ENV_NAME"; \
	echo "Running DB migrations on $$CLUSTER"; \
	SERVICE_ARN=$$(AWS_PROFILE=$(AWS_PROFILE) aws ecs list-services \
		--cluster "$$CLUSTER" \
		--region $(AWS_REGION) \
		--query "serviceArns[?contains(@, 'PlaneBIngestService')]|[0]" \
		--output text); \
	if [ -z "$$SERVICE_ARN" ] || [ "$$SERVICE_ARN" = "None" ]; then \
		echo "ERROR: Could not find PlaneBIngestService in $$CLUSTER"; \
		exit 1; \
	fi; \
	SERVICE_JSON=$$(AWS_PROFILE=$(AWS_PROFILE) aws ecs describe-services \
		--cluster "$$CLUSTER" \
		--services "$$SERVICE_ARN" \
		--region $(AWS_REGION) \
		--output json); \
	SERVICE_TASK_DEF=$$(echo "$$SERVICE_JSON" | jq -r '.services[0].taskDefinition'); \
	NETWORK_CONFIG=$$(echo "$$SERVICE_JSON" | jq -c '.services[0].networkConfiguration'); \
	if [ -z "$$SERVICE_TASK_DEF" ] || [ "$$SERVICE_TASK_DEF" = "null" ]; then \
		echo "ERROR: Could not resolve task definition for $$SERVICE_ARN"; \
		exit 1; \
	fi; \
	MIGRATE_TASK_DEF=$$(AWS_PROFILE=$(AWS_PROFILE) aws ecs list-task-definitions \
		--region $(AWS_REGION) \
		--status ACTIVE \
		--sort DESC \
		--query "taskDefinitionArns[?contains(@, '$$ENV_NAME') && (contains(@, 'db-migrate') || contains(@, 'DbMigrate'))]|[0]" \
		--output text); \
	if [ -n "$$MIGRATE_TASK_DEF" ] && [ "$$MIGRATE_TASK_DEF" != "None" ]; then \
		TASK_DEF="$$MIGRATE_TASK_DEF"; \
		echo "Using dedicated migration task definition: $$TASK_DEF"; \
		TASK_ARN=$$(AWS_PROFILE=$(AWS_PROFILE) aws ecs run-task \
			--cluster "$$CLUSTER" \
			--launch-type FARGATE \
			--task-definition "$$TASK_DEF" \
			--network-configuration "$$NETWORK_CONFIG" \
			--region $(AWS_REGION) \
			--query 'tasks[0].taskArn' \
			--output text); \
	else \
		TASK_DEF="$$SERVICE_TASK_DEF"; \
		echo "No dedicated migration task definition found; overriding command on $$TASK_DEF"; \
		CONTAINER_NAME=$$(AWS_PROFILE=$(AWS_PROFILE) aws ecs describe-task-definition \
			--task-definition "$$TASK_DEF" \
			--region $(AWS_REGION) \
			--query 'taskDefinition.containerDefinitions[0].name' \
			--output text); \
		if [ -z "$$CONTAINER_NAME" ] || [ "$$CONTAINER_NAME" = "None" ]; then \
			echo "ERROR: Could not resolve container name for $$TASK_DEF"; \
			exit 1; \
		fi; \
		OVERRIDES=$$(jq -nc --arg name "$$CONTAINER_NAME" \
			'{containerOverrides:[{name:$$name,command:["node","backend/dist/scripts/aws/db-migrate-ecs.js"]}]}' ); \
		TASK_ARN=$$(AWS_PROFILE=$(AWS_PROFILE) aws ecs run-task \
			--cluster "$$CLUSTER" \
			--launch-type FARGATE \
			--task-definition "$$TASK_DEF" \
			--network-configuration "$$NETWORK_CONFIG" \
			--overrides "$$OVERRIDES" \
			--region $(AWS_REGION) \
			--query 'tasks[0].taskArn' \
			--output text); \
	fi; \
	if [ -z "$$TASK_ARN" ] || [ "$$TASK_ARN" = "None" ]; then \
		echo "ERROR: ECS run-task failed for $$CLUSTER"; \
		exit 1; \
	fi; \
	echo "Migration task started: $$TASK_ARN"; \
	AWS_PROFILE=$(AWS_PROFILE) aws ecs wait tasks-stopped \
		--cluster "$$CLUSTER" \
		--tasks "$$TASK_ARN" \
		--region $(AWS_REGION); \
	EXIT_CODE=$$(AWS_PROFILE=$(AWS_PROFILE) aws ecs describe-tasks \
		--cluster "$$CLUSTER" \
		--tasks "$$TASK_ARN" \
		--region $(AWS_REGION) \
		--query 'tasks[0].containers[0].exitCode' \
		--output text); \
	STOP_REASON=$$(AWS_PROFILE=$(AWS_PROFILE) aws ecs describe-tasks \
		--cluster "$$CLUSTER" \
		--tasks "$$TASK_ARN" \
		--region $(AWS_REGION) \
		--query 'tasks[0].stoppedReason' \
		--output text); \
	echo "Task exit code: $$EXIT_CODE"; \
	echo "Stopped reason: $$STOP_REASON"; \
	if [ "$$EXIT_CODE" != "0" ]; then \
		echo "ERROR: migration task failed"; \
		exit 1; \
	fi; \
	echo "DB migrations completed for $$ENV_NAME"
