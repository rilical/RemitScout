AWS_PROFILE ?= rs-dev
AWS_REGION ?= us-east-1
AWS_ACCOUNT ?= $(shell AWS_PROFILE=$(AWS_PROFILE) aws sts get-caller-identity --query Account --output text)
CDK_DEFAULT_ACCOUNT := $(AWS_ACCOUNT)
CDK_DEFAULT_REGION := $(AWS_REGION)

.PHONY: pause-dev resume-dev status-dev

pause-dev:
	@echo "Pausing dev (CDK deploy with devPaused=true)"
	@cd infrastructure/cdk && \
		AWS_PROFILE=$(AWS_PROFILE) \
		CDK_DEFAULT_ACCOUNT=$(CDK_DEFAULT_ACCOUNT) \
		CDK_DEFAULT_REGION=$(CDK_DEFAULT_REGION) \
		npx cdk deploy -c env=dev -c devPaused=true

resume-dev:
	@echo "Resuming dev (CDK deploy with devPaused=false)"
	@cd infrastructure/cdk && \
		AWS_PROFILE=$(AWS_PROFILE) \
		CDK_DEFAULT_ACCOUNT=$(CDK_DEFAULT_ACCOUNT) \
		CDK_DEFAULT_REGION=$(CDK_DEFAULT_REGION) \
		npx cdk deploy -c env=dev -c devPaused=false

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
