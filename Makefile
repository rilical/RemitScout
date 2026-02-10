AWS_PROFILE ?= rs-dev
AWS_REGION ?= us-east-1
AWS_ACCOUNT ?= $(shell AWS_PROFILE=$(AWS_PROFILE) aws sts get-caller-identity --query Account --output text)
CDK_DEFAULT_ACCOUNT := $(AWS_ACCOUNT)
CDK_DEFAULT_REGION := $(AWS_REGION)
OPS_PAUSE_FN_PREFIX ?= remit-scout-dev-OpsPauseControllerFunction

.PHONY: pause-dev resume-dev status-dev ops-pause-dev ops-resume-dev

pause-dev:
	@echo "Pausing dev (CDK deploy with devPaused=true)"
	@cd infrastructure/cdk && \
		AWS_PROFILE=$(AWS_PROFILE) \
		CDK_DEFAULT_ACCOUNT=$(CDK_DEFAULT_ACCOUNT) \
		CDK_DEFAULT_REGION=$(CDK_DEFAULT_REGION) \
		npx cdk deploy -c env=dev -c devPaused=true
	@$(MAKE) ops-pause-dev

resume-dev:
	@echo "Resuming dev (CDK deploy with devPaused=false)"
	@cd infrastructure/cdk && \
		AWS_PROFILE=$(AWS_PROFILE) \
		CDK_DEFAULT_ACCOUNT=$(CDK_DEFAULT_ACCOUNT) \
		CDK_DEFAULT_REGION=$(CDK_DEFAULT_REGION) \
		npx cdk deploy -c env=dev -c devPaused=false
	@$(MAKE) ops-resume-dev

ops-pause-dev:
	@echo "Ops-pause dev (disable rules, scale ECS to 0, stop DB)"
	@FN=$$(AWS_PROFILE=$(AWS_PROFILE) aws lambda list-functions \
		--region $(AWS_REGION) \
		--query "Functions[?starts_with(FunctionName, '$(OPS_PAUSE_FN_PREFIX)')].FunctionName | [0]" \
		--output text); \
	if [ -z "$$FN" ] || [ "$$FN" = "None" ]; then \
		echo "ERROR: OpsPause controller Lambda not found (prefix: $(OPS_PAUSE_FN_PREFIX))"; \
		exit 1; \
	fi; \
	AWS_PROFILE=$(AWS_PROFILE) aws lambda invoke \
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
		--query "Functions[?starts_with(FunctionName, '$(OPS_PAUSE_FN_PREFIX)')].FunctionName | [0]" \
		--output text); \
	if [ -z "$$FN" ] || [ "$$FN" = "None" ]; then \
		echo "ERROR: OpsPause controller Lambda not found (prefix: $(OPS_PAUSE_FN_PREFIX))"; \
		exit 1; \
	fi; \
	AWS_PROFILE=$(AWS_PROFILE) aws lambda invoke \
		--region $(AWS_REGION) \
		--cli-binary-format raw-in-base64-out \
		--function-name "$$FN" \
		--payload '{"paused": false}' \
		/tmp/remit-scout-ops-resume-dev.json >/dev/null; \
	cat /tmp/remit-scout-ops-resume-dev.json; \
	rm -f /tmp/remit-scout-ops-resume-dev.json

status-dev:
	@echo "ECS service counts (dev)"
	@SERVICES=$$(AWS_PROFILE=$(AWS_PROFILE) aws ecs list-services \
		--cluster remit-scout-dev \
		--region $(AWS_REGION) \
		--query 'serviceArns' --output text); \
	if [ -n "$$SERVICES" ]; then \
		AWS_PROFILE=$(AWS_PROFILE) aws ecs describe-services \
			--cluster remit-scout-dev \
			--services $$SERVICES \
			--region $(AWS_REGION) \
			--query 'services[].{name:serviceName,desired:desiredCount,running:runningCount,pending:pendingCount}' \
			--output table; \
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
