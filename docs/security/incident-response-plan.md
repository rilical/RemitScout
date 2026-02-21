# Incident Response Plan

**Owner:** Engineering Lead
**Last reviewed:** 2026-02-21
**Review cadence:** Quarterly

---

## 1. Severity Levels

| Level | Name | Description | Response Time | Examples |
|-------|------|-------------|---------------|----------|
| P1 | Critical | Service fully down or data breach confirmed | 15 min acknowledge, 1 hr mitigate | Database compromise, API completely unreachable, PII leak |
| P2 | High | Major feature degraded, potential data exposure | 30 min acknowledge, 4 hr mitigate | Payment webhook failures, auth bypass detected, DLQ overflow |
| P3 | Medium | Non-critical degradation, elevated error rates | 2 hr acknowledge, 24 hr mitigate | Single provider outage, stale quote data, SLO breach |
| P4 | Low | Minor issue, no user impact | Next business day | Dashboard widget broken, non-critical log noise |

---

## 2. Escalation Matrix

| Severity | First Responder | Escalation (if unresolved) | Executive Notify |
|----------|----------------|---------------------------|------------------|
| P1 | On-call engineer | Engineering Lead (30 min) | CTO (1 hr) |
| P2 | On-call engineer | Engineering Lead (2 hr) | CTO (4 hr) |
| P3 | Assigned engineer | Engineering Lead (next standup) | N/A |
| P4 | Assigned engineer | N/A | N/A |

### On-Call Rotation
- Primary on-call: Rotating weekly (see PagerDuty/OpsGenie schedule)
- Secondary on-call: Engineering Lead (backup)
- Alerting channels: SNS critical/warning/ops topics -> Slack #incidents + PagerDuty

---

## 3. Incident Response Process

### Phase 1: Detection & Triage (0-15 min)
1. Alert fires via CloudWatch -> SNS -> Slack/PagerDuty
2. On-call acknowledges alert within SLA
3. Classify severity using matrix above
4. Create incident channel: `#incident-YYYY-MM-DD-brief-description`
5. Post initial assessment in channel

### Phase 2: Containment (15 min - 1 hr)
1. Identify blast radius (which planes, queues, users affected)
2. Apply immediate containment:
   - Enable WAF block rules if attack detected
   - Scale down/pause affected ECS services if needed
   - Rotate compromised credentials via Secrets Manager
3. Communicate status to stakeholders

### Phase 3: Eradication & Recovery (1-4 hr)
1. Identify and fix root cause
2. Deploy fix through standard CI/CD (or hotfix for P1)
3. Verify fix via smoke tests and monitoring
4. Confirm all systems nominal

### Phase 4: Post-Incident Review (within 48 hr)
1. Write post-mortem document (blameless)
2. Identify action items with owners and deadlines
3. Update runbooks if applicable
4. Share learnings in team retro

---

## 4. Data Breach Response (GDPR Article 33/34)

### Notification Timeline
- **72 hours**: Notify supervisory authority (ICO for UK, relevant EU DPA)
- **Without undue delay**: Notify affected data subjects if high risk to rights/freedoms

### Breach Assessment Checklist
- [ ] What personal data was affected? (categories, volume)
- [ ] How many data subjects are affected?
- [ ] What is the likely consequence for data subjects?
- [ ] What measures have been taken to address the breach?
- [ ] What measures have been taken to mitigate adverse effects?

### Notification Template (Supervisory Authority)

```
Subject: Personal Data Breach Notification - RemitScout

1. Nature of the breach: [Description]
2. Categories of data: [Email, name, usage data, etc.]
3. Approximate number of data subjects: [Count]
4. Data Protection Officer contact: [DPO email]
5. Likely consequences: [Assessment]
6. Measures taken: [Containment + remediation steps]
```

### Notification Template (Data Subjects)

```
Subject: Important Security Notice from RemitScout

We are writing to inform you of a security incident that may have
affected your personal data.

What happened: [Plain language description]
What data was involved: [Specific categories]
What we are doing: [Steps taken]
What you can do: [Recommended actions]

Contact: privacy@remitscout.com
```

---

## 5. Communication Channels

| Channel | Purpose | Audience |
|---------|---------|----------|
| Slack #incidents | Real-time coordination | Engineering team |
| Slack #incidents-external | Status updates | Wider company |
| StatusPage | Public status | Customers |
| Email | Breach notification | Affected users |
| Legal counsel | Regulatory guidance | DPO + legal |

---

## 6. Key Contacts

| Role | Responsibility |
|------|---------------|
| Engineering Lead | Incident commander, technical decisions |
| CTO | Executive escalation, external comms |
| DPO | GDPR breach assessment, authority notification |
| Legal Counsel | Regulatory obligations, liability assessment |

---

## 7. Tools & Access

- **CloudWatch Dashboards:** `remit-scout-prod` dashboard
- **Runbooks:** `docs/runbooks/` directory
- **WAF Console:** AWS WAF -> `remit-scout-prod-edge`
- **Database Access:** Via bastion host (see ops/brain/README.md)
- **Secrets Rotation:** AWS Secrets Manager console
- **Log Analysis:** CloudWatch Logs Insights

---

## 8. Revision History

| Date | Change | Author |
|------|--------|--------|
| 2026-02-21 | Initial version | Engineering |
